import type { LearningSession } from '../domain/learning/types';
import {
  getLevelProgress,
  sanitizeXp,
  type LevelProgress,
} from '../domain/gamification/leveling';
import {
  buildAccountingTotals,
  evaluateNewXpEntriesForSession,
  type XpLedgerEntry,
  type XpRewardKind,
} from '../domain/gamification/xpPolicy';

export const XP_LEDGER_STORAGE_KEY = 'algomiri.xp.ledger.v1';
export const XP_LEDGER_SCHEMA_VERSION = 1;
export const MAX_RETAINED_LEDGER_ENTRIES = 1000;
export const MAX_ARCHIVED_REWARD_IDS = 2000;

const VALID_REWARD_KINDS = new Set<XpRewardKind>([
  'guided-stage',
  'trace-prediction',
  'session-completion',
  'legacy-practice',
]);

interface StoredXpLedgerEnvelope {
  schemaVersion: number;
  initialized: boolean;
  updatedAt: string;
  archivedXpTotal: number;
  archivedRewardIds: string[];
  entries: XpLedgerEntry[];
}

interface InternalLedgerState {
  initialized: boolean;
  archivedXpTotal: number;
  archivedRewardIds: string[];
  entries: XpLedgerEntry[];
  recoveredFromError: boolean;
  readOnlyFutureSchema: boolean;
  warningMessage: string | null;
}

export interface XpLedgerLoadResult {
  totalXp: number;
  levelProgress: LevelProgress;
  entries: XpLedgerEntry[];
  archivedXpTotal: number;
  initialized: boolean;
  recoveredFromError: boolean;
  readOnlyFutureSchema: boolean;
  warningMessage: string | null;
}

export interface XpLedgerUpdateResult {
  totalXp: number;
  levelProgress: LevelProgress;
  xpAwarded: number;
  newEntries: XpLedgerEntry[];
  persisted: boolean;
  readOnlyFutureSchema: boolean;
  warningMessage: string | null;
}

export interface XpLedgerRepository {
  load(): XpLedgerLoadResult;
  recordSession(session: LearningSession): XpLedgerUpdateResult;
  syncSessions(sessions: readonly LearningSession[]): XpLedgerUpdateResult;
  reset(): { reset: boolean; warningMessage: string | null };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function sanitizeLedgerEntry(raw: unknown): XpLedgerEntry | null {
  if (!isRecord(raw)) return null;
  if (
    typeof raw.rewardId !== 'string' ||
    raw.rewardId.trim().length === 0 ||
    typeof raw.sessionId !== 'string' ||
    raw.sessionId.trim().length === 0 ||
    typeof raw.problemId !== 'string' ||
    raw.problemId.trim().length === 0 ||
    typeof raw.dateKey !== 'string' ||
    raw.dateKey.trim().length === 0
  ) {
    return null;
  }

  const kind =
    typeof raw.kind === 'string' &&
    VALID_REWARD_KINDS.has(raw.kind as XpRewardKind)
      ? (raw.kind as XpRewardKind)
      : null;
  if (!kind) return null;

  const xp = sanitizeXp(typeof raw.xp === 'number' ? raw.xp : 0);
  if (xp <= 0) return null;

  const recordedAt =
    typeof raw.recordedAt === 'string' && raw.recordedAt.length > 0
      ? raw.recordedAt
      : new Date(0).toISOString();

  return {
    rewardId: raw.rewardId,
    sessionId: raw.sessionId,
    problemId: raw.problemId,
    dateKey: raw.dateKey,
    kind,
    xp,
    recordedAt,
  };
}

function computeTotalXp(
  archivedXpTotal: number,
  entries: readonly XpLedgerEntry[],
): number {
  let sum = sanitizeXp(archivedXpTotal);
  for (const entry of entries) {
    sum += sanitizeXp(entry.xp);
  }
  return sanitizeXp(sum);
}

function deduplicateEntries(entries: XpLedgerEntry[]): XpLedgerEntry[] {
  const seen = new Set<string>();
  const unique: XpLedgerEntry[] = [];
  for (const entry of entries) {
    if (seen.has(entry.rewardId)) continue;
    seen.add(entry.rewardId);
    unique.push(entry);
  }
  return unique;
}

function compactLedgerIfNeeded(
  archivedXpTotal: number,
  archivedRewardIds: string[],
  entries: XpLedgerEntry[],
): {
  archivedXpTotal: number;
  archivedRewardIds: string[];
  entries: XpLedgerEntry[];
} {
  if (entries.length <= MAX_RETAINED_LEDGER_ENTRIES) {
    return {
      archivedXpTotal: sanitizeXp(archivedXpTotal),
      archivedRewardIds: archivedRewardIds.slice(-MAX_ARCHIVED_REWARD_IDS),
      entries,
    };
  }

  const overflowCount = entries.length - MAX_RETAINED_LEDGER_ENTRIES;
  const toArchive = entries.slice(0, overflowCount);
  const retained = entries.slice(overflowCount);

  let nextArchivedXp = sanitizeXp(archivedXpTotal);
  const nextArchivedIds = [...archivedRewardIds];
  for (const entry of toArchive) {
    nextArchivedXp = sanitizeXp(nextArchivedXp + sanitizeXp(entry.xp));
    nextArchivedIds.push(entry.rewardId);
  }

  const dedupedArchivedIds = Array.from(new Set(nextArchivedIds)).slice(
    -MAX_ARCHIVED_REWARD_IDS,
  );

  return {
    archivedXpTotal: nextArchivedXp,
    archivedRewardIds: dedupedArchivedIds,
    entries: retained,
  };
}

export class LocalStorageXpLedgerRepository implements XpLedgerRepository {
  private readonly storageKey: string;
  private readonly getStorage: () => Storage | null;

  constructor(
    storageKey = XP_LEDGER_STORAGE_KEY,
    customStorage?: Storage | null,
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
  }

  private readState(): InternalLedgerState {
    const storage = this.getStorage();
    if (!storage) {
      return {
        initialized: false,
        archivedXpTotal: 0,
        archivedRewardIds: [],
        entries: [],
        recoveredFromError: true,
        readOnlyFutureSchema: false,
        warningMessage: 'Local browser storage is unavailable for XP tracking.',
      };
    }

    let rawText: string | null = null;
    try {
      rawText = storage.getItem(this.storageKey);
    } catch {
      return {
        initialized: false,
        archivedXpTotal: 0,
        archivedRewardIds: [],
        entries: [],
        recoveredFromError: true,
        readOnlyFutureSchema: false,
        warningMessage: 'Could not read local XP ledger from browser storage.',
      };
    }

    if (!rawText) {
      return {
        initialized: false,
        archivedXpTotal: 0,
        archivedRewardIds: [],
        entries: [],
        recoveredFromError: false,
        readOnlyFutureSchema: false,
        warningMessage: null,
      };
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      return {
        initialized: false,
        archivedXpTotal: 0,
        archivedRewardIds: [],
        entries: [],
        recoveredFromError: true,
        readOnlyFutureSchema: false,
        warningMessage:
          'Corrupted local XP ledger was safely ignored and reset.',
      };
    }

    if (!isRecord(parsed)) {
      return {
        initialized: false,
        archivedXpTotal: 0,
        archivedRewardIds: [],
        entries: [],
        recoveredFromError: true,
        readOnlyFutureSchema: false,
        warningMessage: 'Unrecognized local XP ledger format was ignored.',
      };
    }

    const storedVersion =
      typeof parsed.schemaVersion === 'number' ? parsed.schemaVersion : 0;
    if (storedVersion > XP_LEDGER_SCHEMA_VERSION) {
      return {
        initialized: true,
        archivedXpTotal: 0,
        archivedRewardIds: [],
        entries: [],
        recoveredFromError: true,
        readOnlyFutureSchema: true,
        warningMessage: `Stored XP ledger uses newer schema v${storedVersion} and cannot be safely modified by v${XP_LEDGER_SCHEMA_VERSION}.`,
      };
    }

    const rawEntries = Array.isArray(parsed.entries) ? parsed.entries : [];
    const sanitizedEntries = deduplicateEntries(
      rawEntries
        .map(sanitizeLedgerEntry)
        .filter((e): e is XpLedgerEntry => e !== null),
    );
    const droppedAny = sanitizedEntries.length < rawEntries.length;

    const archivedXpTotal = sanitizeXp(
      typeof parsed.archivedXpTotal === 'number' ? parsed.archivedXpTotal : 0,
    );
    const archivedRewardIds = Array.isArray(parsed.archivedRewardIds)
      ? parsed.archivedRewardIds.filter(
          (id): id is string => typeof id === 'string' && id.trim().length > 0,
        )
      : [];

    return {
      initialized: parsed.initialized === true || sanitizedEntries.length > 0 || archivedXpTotal > 0,
      archivedXpTotal,
      archivedRewardIds,
      entries: sanitizedEntries,
      recoveredFromError: droppedAny,
      readOnlyFutureSchema: false,
      warningMessage: droppedAny
        ? 'Some malformed XP ledger entries were safely skipped.'
        : null,
    };
  }

  private writeState(
    archivedXpTotal: number,
    archivedRewardIds: string[],
    entries: XpLedgerEntry[],
  ): boolean {
    const storage = this.getStorage();
    if (!storage) return false;

    const compacted = compactLedgerIfNeeded(
      archivedXpTotal,
      archivedRewardIds,
      entries,
    );
    const envelope: StoredXpLedgerEnvelope = {
      schemaVersion: XP_LEDGER_SCHEMA_VERSION,
      initialized: true,
      updatedAt: new Date().toISOString(),
      archivedXpTotal: compacted.archivedXpTotal,
      archivedRewardIds: compacted.archivedRewardIds,
      entries: compacted.entries,
    };

    try {
      storage.setItem(this.storageKey, JSON.stringify(envelope));
      return true;
    } catch {
      return false;
    }
  }

  load(): XpLedgerLoadResult {
    const state = this.readState();
    const totalXp = computeTotalXp(state.archivedXpTotal, state.entries);
    return {
      totalXp,
      levelProgress: getLevelProgress(totalXp),
      entries: state.entries,
      archivedXpTotal: state.archivedXpTotal,
      initialized: state.initialized,
      recoveredFromError: state.recoveredFromError,
      readOnlyFutureSchema: state.readOnlyFutureSchema,
      warningMessage: state.warningMessage,
    };
  }

  syncSessions(sessions: readonly LearningSession[]): XpLedgerUpdateResult {
    // Always read fresh from storage first so stale tabs never clobber newer XP
    const state = this.readState();
    if (state.readOnlyFutureSchema) {
      const totalXp = computeTotalXp(state.archivedXpTotal, state.entries);
      return {
        totalXp,
        levelProgress: getLevelProgress(totalXp),
        xpAwarded: 0,
        newEntries: [],
        persisted: false,
        readOnlyFutureSchema: true,
        warningMessage: state.warningMessage,
      };
    }

    const grantedIds = new Set<string>(state.archivedRewardIds);
    for (const entry of state.entries) {
      grantedIds.add(entry.rewardId);
    }

    const totals = buildAccountingTotals(state.entries);
    const sortedSessions = [...sessions].sort((a, b) =>
      a.completedAt.localeCompare(b.completedAt),
    );
    const recordedAt = new Date().toISOString();
    const appended: XpLedgerEntry[] = [];

    for (const session of sortedSessions) {
      const created = evaluateNewXpEntriesForSession(
        session,
        grantedIds,
        totals,
        recordedAt,
      );
      for (const entry of created) {
        grantedIds.add(entry.rewardId);
        appended.push(entry);
      }
    }

    const nextEntries =
      appended.length > 0 ? [...state.entries, ...appended] : state.entries;
    const totalXp = computeTotalXp(state.archivedXpTotal, nextEntries);
    const xpAwarded = appended.reduce((acc, entry) => acc + entry.xp, 0);

    let persisted = true;
    let warningMessage = state.warningMessage;
    if (appended.length > 0 || !state.initialized) {
      persisted = this.writeState(
        state.archivedXpTotal,
        state.archivedRewardIds,
        nextEntries,
      );
      if (!persisted) {
        warningMessage =
          'Could not persist XP ledger update to local browser storage.';
      }
    }

    return {
      totalXp,
      levelProgress: getLevelProgress(totalXp),
      xpAwarded,
      newEntries: appended,
      persisted,
      readOnlyFutureSchema: false,
      warningMessage,
    };
  }

  recordSession(session: LearningSession): XpLedgerUpdateResult {
    return this.syncSessions([session]);
  }

  reset(): { reset: boolean; warningMessage: string | null } {
    const storage = this.getStorage();
    if (!storage) {
      return {
        reset: false,
        warningMessage: 'Local browser storage is unavailable.',
      };
    }
    try {
      storage.removeItem(this.storageKey);
      return { reset: true, warningMessage: null };
    } catch {
      return {
        reset: false,
        warningMessage: 'Could not clear local XP ledger.',
      };
    }
  }
}

export const defaultXpLedgerRepository: XpLedgerRepository =
  new LocalStorageXpLedgerRepository();
