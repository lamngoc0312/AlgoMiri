import { isValidSkillId } from '../domain/learning/skills';
import { sanitizeActiveStudySeconds } from '../domain/learning/studyTimer';
import type {
  EvidenceLevel,
  LearningSession,
  SessionOutcome,
} from '../domain/learning/types';
import {
  defaultXpLedgerRepository,
  type XpLedgerRepository,
} from './xpLedgerRepository';

export const LEARNING_STORAGE_KEY = 'algomiri.learning.history';
export const LEARNING_SCHEMA_VERSION = 2;
const MAX_STORED_SESSIONS = 100;

export interface StoredLearningEnvelope {
  schemaVersion: number;
  updatedAt: string;
  sessions: LearningSession[];
}

export interface StorageLoadResult {
  sessions: LearningSession[];
  recoveredFromError: boolean;
  migratedFromVersion: number | null;
  warningMessage: string | null;
}

export interface SaveSessionResult {
  saved: boolean;
  wasDuplicateUpdate: boolean;
  warningMessage: string | null;
}

export interface StorageInfo {
  backend: 'browser-local-storage';
  schemaVersion: number;
  syncedAcrossDevices: false;
  available: boolean;
}

/**
 * Storage abstraction designed so a future authenticated backend repository
 * can replace local persistence without rewriting Studio or Progress UI.
 */
export interface LearningRepository {
  loadSessions(): StorageLoadResult;
  saveSession(session: LearningSession): SaveSessionResult;
  hasSession(sessionId: string): boolean;
  clearHistory(): { cleared: boolean; warningMessage: string | null };
  getStorageInfo(): StorageInfo;
}

const VALID_OUTCOMES = new Set<SessionOutcome>([
  'completed-guided',
  'completed-with-skips',
  'partial-attempt',
  'viewed-only',
]);

const VALID_EVIDENCE_LEVELS = new Set<EvidenceLevel>([
  'viewed',
  'attempted',
  'correct-with-assistance',
  'first-try-correct',
  'independently-demonstrated',
]);

// Privacy boundary: only allow verified built-in problem IDs; never persist
// arbitrary pasted problem statements, API keys, or AI Tutor transcripts.
const ALLOWED_VERIFIED_PROBLEM_IDS = new Set([
  'two-sum',
  'valid-parentheses',
  'split-array-largest-sum',
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asNonNegativeInt(value: unknown, fallback = 0): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    return fallback;
  }
  return Math.floor(value);
}

/**
 * Validates and strips a single stored session down to the strict privacy-safe
 * LearningSession schema (dropping unknown/unexpected keys such as raw prompts or chat text).
 */
export function sanitizeStoredSession(raw: unknown): LearningSession | null {
  if (!isRecord(raw)) return null;

  const sessionId =
    typeof raw.sessionId === 'string' && raw.sessionId.trim().length > 0
      ? raw.sessionId.trim().slice(0, 120)
      : null;
  const problemId =
    typeof raw.problemId === 'string' &&
    ALLOWED_VERIFIED_PROBLEM_IDS.has(raw.problemId)
      ? raw.problemId
      : null;
  const problemTitle =
    typeof raw.problemTitle === 'string' && raw.problemTitle.trim().length > 0
      ? raw.problemTitle.trim().slice(0, 120)
      : null;

  if (!sessionId || !problemId || !problemTitle) {
    return null;
  }

  const startedAt =
    typeof raw.startedAt === 'string' && !Number.isNaN(Date.parse(raw.startedAt))
      ? raw.startedAt
      : new Date(0).toISOString();
  const completedAt =
    typeof raw.completedAt === 'string' &&
    !Number.isNaN(Date.parse(raw.completedAt))
      ? raw.completedAt
      : startedAt;

  const mode = raw.mode === 'explore' ? 'explore' : 'guided';
  const strategiesExplored = Array.isArray(raw.strategiesExplored)
    ? Array.from(
        new Set(
          raw.strategiesExplored.filter(
            (s): s is string => typeof s === 'string' && s.trim().length > 0,
          ),
        ),
      )
    : [];

  const stageStatuses: LearningSession['stageStatuses'] = {};
  if (isRecord(raw.stageStatuses)) {
    for (const [key, val] of Object.entries(raw.stageStatuses)) {
      if (
        val === 'unvisited' ||
        val === 'viewed' ||
        val === 'attempted' ||
        val === 'skipped' ||
        val === 'skipped-after-attempt' ||
        val === 'completed'
      ) {
        stageStatuses[key] = val;
      }
    }
  }

  const rawPred = isRecord(raw.predictionSummary) ? raw.predictionSummary : {};
  const firstTryCorrect = asNonNegativeInt(rawPred.firstTryCorrect);
  const solvedAfterRetry = asNonNegativeInt(rawPred.solvedAfterRetry);
  const totalSolved = firstTryCorrect + solvedAfterRetry;
  const rawQuestionsAttempted = asNonNegativeInt(
    rawPred.questionsAttempted,
    totalSolved,
  );
  const rawSkippedCount = asNonNegativeInt(rawPred.skippedCount);

  const skippedAfterAttempt =
    typeof rawPred.skippedAfterAttempt === 'number'
      ? asNonNegativeInt(rawPred.skippedAfterAttempt)
      : Math.min(rawSkippedCount, Math.max(0, rawQuestionsAttempted - totalSolved));
  const skippedWithoutAttempt =
    typeof rawPred.skippedWithoutAttempt === 'number'
      ? asNonNegativeInt(rawPred.skippedWithoutAttempt)
      : Math.max(0, rawSkippedCount - skippedAfterAttempt);
  const unresolvedAttempt =
    typeof rawPred.unresolvedAttempt === 'number'
      ? asNonNegativeInt(rawPred.unresolvedAttempt)
      : Math.max(0, rawQuestionsAttempted - totalSolved - skippedAfterAttempt);

  const questionsAttempted =
    totalSolved + skippedAfterAttempt + unresolvedAttempt;
  const skippedCount = skippedAfterAttempt + skippedWithoutAttempt;
  const totalQuestions = questionsAttempted + skippedWithoutAttempt;

  const predictionSummary = {
    questionsAttempted,
    firstTryCorrect,
    solvedAfterRetry,
    totalSolved,
    totalRetries: asNonNegativeInt(rawPred.totalRetries),
    skippedCount,
    skippedAfterAttempt,
    skippedWithoutAttempt,
    unresolvedAttempt,
    totalQuestions,
  };

  const hintsByStage: Record<string, number> = {};
  if (isRecord(raw.hintsByStage)) {
    for (const [k, v] of Object.entries(raw.hintsByStage)) {
      hintsByStage[k] = asNonNegativeInt(v);
    }
  }

  const attempts: LearningSession['attempts'] = Array.isArray(raw.attempts)
    ? raw.attempts
        .filter(isRecord)
        .map((a, idx) => {
          const level = VALID_EVIDENCE_LEVELS.has(
            a.evidenceLevel as EvidenceLevel,
          )
            ? (a.evidenceLevel as EvidenceLevel)
            : 'attempted';
          return {
            id:
              typeof a.id === 'string' && a.id
                ? a.id
                : `${sessionId}:att-${idx}`,
            source:
              a.source === 'trace-prediction'
                ? ('trace-prediction' as const)
                : ('guided-stage' as const),
            targetId: typeof a.targetId === 'string' ? a.targetId : 'unknown',
            skillIds: Array.isArray(a.skillIds)
              ? a.skillIds.filter(isValidSkillId)
              : [],
            correct: Boolean(a.correct),
            firstTry: Boolean(a.firstTry),
            retries: asNonNegativeInt(a.retries),
            hintsUsed: asNonNegativeInt(a.hintsUsed),
            skipped: Boolean(a.skipped),
            evidenceLevel: level,
          };
        })
    : [];

  const skillEvidence: LearningSession['skillEvidence'] = Array.isArray(
    raw.skillEvidence,
  )
    ? raw.skillEvidence
        .filter(isRecord)
        .filter(
          (ev) =>
            isValidSkillId(ev.skillId) &&
            VALID_EVIDENCE_LEVELS.has(ev.evidenceLevel as EvidenceLevel),
        )
        .map((ev, idx) => ({
          id:
            typeof ev.id === 'string' && ev.id
              ? ev.id
              : `${sessionId}:ev-${idx}`,
          skillId: ev.skillId as LearningSession['skillEvidence'][number]['skillId'],
          sessionId,
          problemId,
          source:
            ev.source === 'trace-prediction' || ev.source === 'strategy-view'
              ? ev.source
              : ('guided-stage' as const),
          evidenceLevel: ev.evidenceLevel as EvidenceLevel,
          recordedAt:
            typeof ev.recordedAt === 'string' ? ev.recordedAt : completedAt,
        }))
    : [];

  const events: LearningSession['events'] = Array.isArray(raw.events)
    ? raw.events
        .filter(isRecord)
        .filter((e) => typeof e.type === 'string' && typeof e.timestamp === 'string')
        .slice(-100)
        .map((e, idx) => ({
          id: typeof e.id === 'string' ? e.id : `${sessionId}:e-${idx}`,
          type: e.type as LearningSession['events'][number]['type'],
          timestamp: e.timestamp as string,
          ...(typeof e.stageId === 'string' ? { stageId: e.stageId } : {}),
          ...(typeof e.strategyId === 'string'
            ? { strategyId: e.strategyId }
            : {}),
          ...(typeof e.questionId === 'string'
            ? { questionId: e.questionId }
            : {}),
          ...(typeof e.correct === 'boolean' ? { correct: e.correct } : {}),
          ...(typeof e.hintLevel === 'number'
            ? { hintLevel: e.hintLevel }
            : {}),
        }))
    : [];

  const outcome: SessionOutcome = VALID_OUTCOMES.has(
    raw.outcome as SessionOutcome,
  )
    ? (raw.outcome as SessionOutcome)
    : 'partial-attempt';

  const activeStudySeconds = sanitizeActiveStudySeconds(raw.activeStudySeconds);

  return {
    sessionId,
    problemId,
    problemTitle,
    mode,
    strategiesExplored,
    startedAt,
    completedAt,
    ...(activeStudySeconds !== undefined ? { activeStudySeconds } : {}),
    stageStatuses,
    totalStages: asNonNegativeInt(raw.totalStages),
    completedStagesCount: asNonNegativeInt(raw.completedStagesCount),
    skippedStagesCount: asNonNegativeInt(raw.skippedStagesCount),
    attemptedStagesCount: asNonNegativeInt(raw.attemptedStagesCount),
    predictionSummary,
    hintsUsed: asNonNegativeInt(raw.hintsUsed),
    hintsByStage,
    attempts,
    skillEvidence,
    events,
    outcome,
  };
}

function deduplicateBySessionId(
  sessions: LearningSession[],
): LearningSession[] {
  const map = new Map<string, LearningSession>();
  for (const s of sessions) {
    map.set(s.sessionId, s);
  }
  return Array.from(map.values())
    .sort((a, b) => b.completedAt.localeCompare(a.completedAt))
    .slice(0, MAX_STORED_SESSIONS);
}

export class LocalStorageLearningRepository implements LearningRepository {
  private readonly storageKey: string;
  private readonly getStorage: () => Storage | null;
  private readonly xpLedger: XpLedgerRepository | null;

  constructor(
    storageKey = LEARNING_STORAGE_KEY,
    customStorage?: Storage | null,
    xpLedger?: XpLedgerRepository | null,
  ) {
    this.storageKey = storageKey;
    this.getStorage = () => {
      if (customStorage !== undefined) return customStorage;
      try {
        return typeof window !== 'undefined' ? window.localStorage : null;
      } catch {
        return null;
      }
    };
    this.xpLedger =
      xpLedger !== undefined
        ? xpLedger
        : storageKey === LEARNING_STORAGE_KEY && customStorage === undefined
          ? defaultXpLedgerRepository
          : null;
  }

  private writeEnvelope(sessions: LearningSession[]): boolean {
    const storage = this.getStorage();
    if (!storage) return false;
    const envelope: StoredLearningEnvelope = {
      schemaVersion: LEARNING_SCHEMA_VERSION,
      updatedAt: new Date().toISOString(),
      sessions: deduplicateBySessionId(sessions),
    };
    storage.setItem(this.storageKey, JSON.stringify(envelope));
    return true;
  }

  loadSessions(): StorageLoadResult {
    const storage = this.getStorage();
    if (!storage) {
      return {
        sessions: [],
        recoveredFromError: true,
        migratedFromVersion: null,
        warningMessage:
          'Local browser storage is unavailable. Sessions cannot be saved across reloads in this environment.',
      };
    }

    let rawText: string | null = null;
    try {
      rawText = storage.getItem(this.storageKey);
    } catch {
      return {
        sessions: [],
        recoveredFromError: true,
        migratedFromVersion: null,
        warningMessage: 'Could not read local learning history from browser storage.',
      };
    }

    if (!rawText) {
      return {
        sessions: [],
        recoveredFromError: false,
        migratedFromVersion: null,
        warningMessage: null,
      };
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      return {
        sessions: [],
        recoveredFromError: true,
        migratedFromVersion: null,
        warningMessage:
          'Corrupted local learning history was safely ignored. New sessions will save cleanly.',
      };
    }

    // Schema migration: v0 legacy raw array -> v1 versioned envelope
    if (Array.isArray(parsed)) {
      const sanitized = deduplicateBySessionId(
        parsed
          .map(sanitizeStoredSession)
          .filter((s): s is LearningSession => s !== null),
      );
      try {
        this.writeEnvelope(sanitized);
      } catch {
        // Non-fatal if storage is read-only
      }
      return {
        sessions: sanitized,
        recoveredFromError: false,
        migratedFromVersion: 0,
        warningMessage: null,
      };
    }

    if (!isRecord(parsed) || !Array.isArray(parsed.sessions)) {
      return {
        sessions: [],
        recoveredFromError: true,
        migratedFromVersion: null,
        warningMessage:
          'Unrecognized local history format was safely ignored.',
      };
    }

    const storedVersion =
      typeof parsed.schemaVersion === 'number' ? parsed.schemaVersion : 0;

    if (storedVersion > LEARNING_SCHEMA_VERSION) {
      return {
        sessions: [],
        recoveredFromError: true,
        migratedFromVersion: null,
        warningMessage: `Stored history uses newer schema v${storedVersion} and cannot be safely loaded by v${LEARNING_SCHEMA_VERSION}.`,
      };
    }

    const rawList = parsed.sessions;
    const sanitized = deduplicateBySessionId(
      rawList
        .map(sanitizeStoredSession)
        .filter((s): s is LearningSession => s !== null),
    );
    const droppedAny = sanitized.length < rawList.length;

    if (storedVersion < LEARNING_SCHEMA_VERSION) {
      try {
        this.writeEnvelope(sanitized);
      } catch {
        // Non-fatal
      }
      return {
        sessions: sanitized,
        recoveredFromError: droppedAny,
        migratedFromVersion: storedVersion,
        warningMessage: droppedAny
          ? 'Some invalid historical records were skipped during migration.'
          : null,
      };
    }

    return {
      sessions: sanitized,
      recoveredFromError: droppedAny,
      migratedFromVersion: null,
      warningMessage: droppedAny
        ? 'Some corrupted session records were safely skipped.'
        : null,
    };
  }

  saveSession(session: LearningSession): SaveSessionResult {
    const cleanSession = sanitizeStoredSession(session);
    if (!cleanSession) {
      return {
        saved: false,
        wasDuplicateUpdate: false,
        warningMessage: 'Session could not be saved due to invalid structure.',
      };
    }

    const loaded = this.loadSessions();
    const existingIndex = loaded.sessions.findIndex(
      (s) => s.sessionId === cleanSession.sessionId,
    );
    const nextSessions =
      existingIndex >= 0
        ? loaded.sessions.map((s, idx) =>
            idx === existingIndex ? cleanSession : s,
          )
        : [cleanSession, ...loaded.sessions];

    try {
      const ok = this.writeEnvelope(nextSessions);
      if (!ok) {
        return {
          saved: false,
          wasDuplicateUpdate: false,
          warningMessage:
            'Local browser storage is unavailable; session was not persisted.',
        };
      }
      try {
        this.xpLedger?.recordSession(cleanSession);
      } catch {
        // Non-fatal: session persistence must not fail if XP ledger throws
      }
      return {
        saved: true,
        wasDuplicateUpdate: existingIndex >= 0,
        warningMessage: null,
      };
    } catch {
      return {
        saved: false,
        wasDuplicateUpdate: false,
        warningMessage:
          'Could not save session (browser storage quota exceeded or restricted).',
      };
    }
  }

  hasSession(sessionId: string): boolean {
    return this.loadSessions().sessions.some((s) => s.sessionId === sessionId);
  }

  clearHistory(): { cleared: boolean; warningMessage: string | null } {
    const storage = this.getStorage();
    if (!storage) {
      return {
        cleared: false,
        warningMessage: 'Local browser storage is unavailable.',
      };
    }
    try {
      storage.removeItem(this.storageKey);
      this.xpLedger?.reset();
      return { cleared: true, warningMessage: null };
    } catch {
      return {
        cleared: false,
        warningMessage: 'Could not clear local browser storage.',
      };
    }
  }

  getStorageInfo(): StorageInfo {
    const storage = this.getStorage();
    return {
      backend: 'browser-local-storage',
      schemaVersion: LEARNING_SCHEMA_VERSION,
      syncedAcrossDevices: false,
      available: storage !== null,
    };
  }
}

export const defaultLearningRepository: LearningRepository =
  new LocalStorageLearningRepository();
