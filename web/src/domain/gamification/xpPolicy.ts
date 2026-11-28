import type { LearningAttempt, LearningSession } from '../learning/types';
import {
  isEligiblePracticeSession,
  toLocalDateKey,
} from '../learning/activityStreak';

/**
 * Explicit, deterministic XP policy constants for AlgoMiri (Phase 8A.1).
 *
 * Principles:
 * - Only genuine verified Studio practice evidence earns XP.
 * - Passive viewing, skipping without attempting, AI analysis/chat/bookmarks,
 *   page visits, island demo previews, and time spent alone earn 0 XP.
 * - Re-saving an unchanged session earns 0 duplicate XP (idempotent by rewardId).
 * - Fair per-session, per-problem-day, and global daily caps prevent farming.
 */
export const XP_POLICY = {
  guidedStage: {
    firstTryCorrect: 15,
    correctWithAssistance: 10,
    attempted: 4,
    viewed: 0,
  },
  tracePrediction: {
    firstTryCorrect: 10,
    correctWithAssistance: 6,
    attempted: 3,
    viewed: 0,
  },
  completionBonus: {
    completedGuided: 25,
    completedWithSkips: 10,
  },
  legacyPracticeFallback: 10,
  caps: {
    maxXpPerSession: 100,
    maxXpPerProblemPerDay: 120,
    maxXpPerDay: 250,
  },
} as const;

export type XpRewardKind =
  | 'guided-stage'
  | 'trace-prediction'
  | 'session-completion'
  | 'legacy-practice';

export interface XpRewardCandidate {
  /** Stable idempotent key (e.g. `${sessionId}:guided-stage:${targetId}`). */
  rewardId: string;
  sessionId: string;
  problemId: string;
  /** Local calendar date key YYYY-MM-DD derived from session.completedAt. */
  dateKey: string;
  kind: XpRewardKind;
  baseXp: number;
}

export interface XpLedgerEntry {
  rewardId: string;
  sessionId: string;
  problemId: string;
  dateKey: string;
  kind: XpRewardKind;
  xp: number;
  recordedAt: string;
}

export interface XpAccountingTotals {
  sessionXp: Record<string, number>;
  problemDayXp: Record<string, number>;
  dayXp: Record<string, number>;
}

/**
 * Computes the local calendar date key YYYY-MM-DD for a session timestamp.
 * Falls back to `'unknown-date'` if timestamp is unparseable.
 */
export function resolveSessionDateKey(completedAt: string): string {
  const parsed = new Date(completedAt);
  if (Number.isNaN(parsed.getTime())) {
    return 'unknown-date';
  }
  return toLocalDateKey(parsed);
}

/**
 * Returns the base XP for a single verified learning attempt.
 * Viewed-only or skipped-without-attempt records always return 0.
 */
export function getAttemptBaseXp(attempt: LearningAttempt): number {
  if (attempt.evidenceLevel === 'viewed') {
    return 0;
  }
  if (attempt.skipped && !attempt.correct && attempt.retries === 0) {
    return 0;
  }

  const table =
    attempt.source === 'guided-stage'
      ? XP_POLICY.guidedStage
      : attempt.source === 'trace-prediction'
        ? XP_POLICY.tracePrediction
        : null;

  if (!table) {
    return 0;
  }

  switch (attempt.evidenceLevel) {
    case 'first-try-correct':
      return table.firstTryCorrect;
    case 'correct-with-assistance':
      return table.correctWithAssistance;
    case 'attempted':
      return table.attempted;
    default:
      return 0;
  }
}

/**
 * Extracts all deterministic, eligible XP reward candidates from a single
 * verified LearningSession.
 *
 * - Multi-topic sessions (e.g. `split-array-largest-sum`) are evaluated once
 *   per sessionId, never doubled across topics.
 * - Viewed-only and skipped-only sessions produce zero candidates.
 */
export function extractSessionXpCandidates(
  session: LearningSession,
): XpRewardCandidate[] {
  if (!isEligiblePracticeSession(session)) {
    return [];
  }

  const dateKey = resolveSessionDateKey(session.completedAt);
  const candidatesById = new Map<string, XpRewardCandidate>();

  for (const attempt of session.attempts) {
    const baseXp = getAttemptBaseXp(attempt);
    if (baseXp <= 0) {
      continue;
    }

    const stableTarget = attempt.targetId || attempt.id;
    const rewardId = `${session.sessionId}:${attempt.source}:${stableTarget}`;
    const existing = candidatesById.get(rewardId);

    // If duplicate targetId exists in the same session, keep the higher verified evidence value
    if (!existing || baseXp > existing.baseXp) {
      candidatesById.set(rewardId, {
        rewardId,
        sessionId: session.sessionId,
        problemId: session.problemId,
        dateKey,
        kind:
          attempt.source === 'guided-stage'
            ? 'guided-stage'
            : 'trace-prediction',
        baseXp,
      });
    }
  }

  // Conservative legacy fallback for older eligible sessions saved without detailed attempts[]
  if (candidatesById.size === 0 && session.attempts.length === 0) {
    const legacyId = `${session.sessionId}:legacy-practice`;
    candidatesById.set(legacyId, {
      rewardId: legacyId,
      sessionId: session.sessionId,
      problemId: session.problemId,
      dateKey,
      kind: 'legacy-practice',
      baseXp: XP_POLICY.legacyPracticeFallback,
    });
  }

  // Verified guided completion bonus (awarded at most once per eligible session)
  if (session.outcome === 'completed-guided') {
    const completionId = `${session.sessionId}:completion`;
    candidatesById.set(completionId, {
      rewardId: completionId,
      sessionId: session.sessionId,
      problemId: session.problemId,
      dateKey,
      kind: 'session-completion',
      baseXp: XP_POLICY.completionBonus.completedGuided,
    });
  } else if (
    session.outcome === 'completed-with-skips' &&
    session.completedStagesCount > 0
  ) {
    const completionId = `${session.sessionId}:completion`;
    candidatesById.set(completionId, {
      rewardId: completionId,
      sessionId: session.sessionId,
      problemId: session.problemId,
      dateKey,
      kind: 'session-completion',
      baseXp: XP_POLICY.completionBonus.completedWithSkips,
    });
  }

  return Array.from(candidatesById.values());
}

/**
 * Builds running cap-accounting totals from existing ledger entries.
 */
export function buildAccountingTotals(
  entries: readonly XpLedgerEntry[],
): XpAccountingTotals {
  const sessionXp: Record<string, number> = {};
  const problemDayXp: Record<string, number> = {};
  const dayXp: Record<string, number> = {};

  for (const entry of entries) {
    if (entry.xp <= 0) continue;
    sessionXp[entry.sessionId] = (sessionXp[entry.sessionId] ?? 0) + entry.xp;
    const problemDayKey = `${entry.problemId}::${entry.dateKey}`;
    problemDayXp[problemDayKey] = (problemDayXp[problemDayKey] ?? 0) + entry.xp;
    dayXp[entry.dateKey] = (dayXp[entry.dateKey] ?? 0) + entry.xp;
  }

  return { sessionXp, problemDayXp, dayXp };
}

/**
 * Evaluates a session against already-granted rewardIds and current cap totals,
 * returning only newly earned XP ledger entries.
 */
export function evaluateNewXpEntriesForSession(
  session: LearningSession,
  grantedRewardIds: ReadonlySet<string>,
  totals: XpAccountingTotals,
  recordedAt: string,
): XpLedgerEntry[] {
  const candidates = extractSessionXpCandidates(session);
  if (candidates.length === 0) {
    return [];
  }

  const newEntries: XpLedgerEntry[] = [];

  for (const candidate of candidates) {
    if (grantedRewardIds.has(candidate.rewardId)) {
      continue;
    }

    const currentSessionXp = totals.sessionXp[candidate.sessionId] ?? 0;
    const problemDayKey = `${candidate.problemId}::${candidate.dateKey}`;
    const currentProblemDayXp = totals.problemDayXp[problemDayKey] ?? 0;
    const currentDayXp = totals.dayXp[candidate.dateKey] ?? 0;

    const sessionRoom = Math.max(
      0,
      XP_POLICY.caps.maxXpPerSession - currentSessionXp,
    );
    const problemDayRoom = Math.max(
      0,
      XP_POLICY.caps.maxXpPerProblemPerDay - currentProblemDayXp,
    );
    const dayRoom = Math.max(0, XP_POLICY.caps.maxXpPerDay - currentDayXp);

    const awardedXp = Math.min(
      candidate.baseXp,
      sessionRoom,
      problemDayRoom,
      dayRoom,
    );

    if (awardedXp <= 0) {
      continue;
    }

    totals.sessionXp[candidate.sessionId] = currentSessionXp + awardedXp;
    totals.problemDayXp[problemDayKey] = currentProblemDayXp + awardedXp;
    totals.dayXp[candidate.dateKey] = currentDayXp + awardedXp;

    newEntries.push({
      rewardId: candidate.rewardId,
      sessionId: candidate.sessionId,
      problemId: candidate.problemId,
      dateKey: candidate.dateKey,
      kind: candidate.kind,
      xp: awardedXp,
      recordedAt,
    });
  }

  return newEntries;
}
