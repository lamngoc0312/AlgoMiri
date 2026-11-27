import { isEligiblePracticeSession } from '../learning/activityStreak';
import { sanitizeActiveStudySeconds } from '../learning/studyTimer';
import type { LearningSession } from '../learning/types';
import {
  MIRI_ISLANDS_REGISTRY,
  type MiriIslandDefinition,
  type MiriIslandId,
} from './islandRegistry';

/**
 * Honest growth stage derived strictly from verified Studio evidence.
 * - 'preview': island has no verified deterministic Studio yet (AI-guided preview only).
 * - 'undiscovered': verified Studio exists, 0 saved sessions.
 * - 'explored': saved session(s) exist, but 0 eligible practice attempts (viewed/skipped only).
 * - 'developing': >= 1 eligible practice session with genuine attempts.
 * - 'flourishing': >= 1 completed guided lesson OR >= 2 eligible practice sessions with strong skill evidence.
 *   Still represents guided evidence, NEVER independent coding completion.
 */
export type IslandGrowthStage =
  | 'preview'
  | 'undiscovered'
  | 'explored'
  | 'developing'
  | 'flourishing';

export interface MiriIslandProgress {
  island: MiriIslandDefinition;
  stage: IslandGrowthStage;
  hasVerifiedStudio: boolean;
  /** Number of saved verified sessions relevant to this island. */
  relevantSessionsCount: number;
  /** Number of eligible practice sessions (with genuine attempts) relevant to this island. */
  eligiblePracticeSessionsCount: number;
  /** Count of genuine non-viewed skill evidence items mapped to this island's skills. */
  verifiedSkillEvidenceCount: number;
  /** True when this island shares a multi-topic Studio (e.g. Split Array spans Binary Search + Greedy). */
  sharesMultiTopicStudio: boolean;
  /** Sum of known active study seconds across relevant sessions, or null if none recorded. */
  relevantActiveStudySeconds: number | null;
}

export interface MiriIslandsSnapshot {
  islands: MiriIslandProgress[];
  islandsById: Record<MiriIslandId, MiriIslandProgress>;
  /** Deduplicated global totals so multi-topic Studios (like Split Array) are NEVER double-counted. */
  globalTotals: {
    uniqueSavedSessions: number;
    uniqueEligiblePracticeSessions: number;
    totalActiveStudySeconds: number | null;
    verifiedIslandsCount: number;
    practicedIslandsCount: number;
  };
}

/**
 * Maps verified LearningSession records onto the 8 Miri Islands cleanly and honestly.
 *
 * Safeguards:
 * - Never awards progress from AI bookmarks, AI conceptual analyses, or passive viewing.
 * - Deduplicates sessions by stable `sessionId` before computing island and global totals.
 * - Split Array Largest Sum contributes topic-relevant evidence to both Halfway Lighthouse
 *   (Binary Search) and Compass Cove (Greedy), while `globalTotals` counts each session ONCE.
 */
export function buildMiriIslandsSnapshot(
  sessions: LearningSession[],
): MiriIslandsSnapshot {
  // Deduplicate by sessionId first
  const dedupedById = new Map<string, LearningSession>();
  for (const session of sessions) {
    if (!session.sessionId) continue;
    const prev = dedupedById.get(session.sessionId);
    if (!prev || session.completedAt.localeCompare(prev.completedAt) >= 0) {
      dedupedById.set(session.sessionId, session);
    }
  }
  const uniqueSessions = Array.from(dedupedById.values());

  // Identify verified problem IDs that appear on >1 island (e.g. split-array-largest-sum)
  const problemIslandCount = new Map<string, number>();
  for (const island of MIRI_ISLANDS_REGISTRY) {
    for (const pid of island.verifiedProblemIds) {
      problemIslandCount.set(pid, (problemIslandCount.get(pid) ?? 0) + 1);
    }
  }

  const islands: MiriIslandProgress[] = MIRI_ISLANDS_REGISTRY.map((island) => {
    const hasVerifiedStudio = island.verifiedProblemIds.length > 0;
    const sharesMultiTopicStudio = island.verifiedProblemIds.some(
      (pid) => (problemIslandCount.get(pid) ?? 0) > 1,
    );

    if (!hasVerifiedStudio) {
      return {
        island,
        stage: 'preview',
        hasVerifiedStudio: false,
        relevantSessionsCount: 0,
        eligiblePracticeSessionsCount: 0,
        verifiedSkillEvidenceCount: 0,
        sharesMultiTopicStudio: false,
        relevantActiveStudySeconds: null,
      };
    }

    const problemSet = new Set(island.verifiedProblemIds);
    const skillSet = new Set(island.relatedSkillIds);

    const matchingSessions = uniqueSessions.filter((s) =>
      problemSet.has(s.problemId),
    );
    const eligibleSessions = matchingSessions.filter(isEligiblePracticeSession);

    let verifiedSkillEvidenceCount = 0;
    let hasCompletedGuided = false;
    let activeSecondsSum = 0;
    let timedCount = 0;

    for (const s of matchingSessions) {
      const cleanSec = sanitizeActiveStudySeconds(s.activeStudySeconds);
      if (cleanSec !== undefined) {
        activeSecondsSum += cleanSec;
        timedCount += 1;
      }
      if (s.outcome === 'completed-guided') {
        hasCompletedGuided = true;
      }
      for (const ev of s.skillEvidence) {
        if (skillSet.has(ev.skillId) && ev.evidenceLevel !== 'viewed') {
          verifiedSkillEvidenceCount += 1;
        }
      }
    }

    let stage: IslandGrowthStage;
    if (matchingSessions.length === 0) {
      stage = 'undiscovered';
    } else if (eligibleSessions.length === 0) {
      // Viewed-only or skipped-only sessions never advance beyond 'explored'
      stage = 'explored';
    } else if (
      hasCompletedGuided ||
      (eligibleSessions.length >= 2 && verifiedSkillEvidenceCount >= 2)
    ) {
      stage = 'flourishing';
    } else {
      stage = 'developing';
    }

    return {
      island,
      stage,
      hasVerifiedStudio: true,
      relevantSessionsCount: matchingSessions.length,
      eligiblePracticeSessionsCount: eligibleSessions.length,
      verifiedSkillEvidenceCount,
      sharesMultiTopicStudio,
      relevantActiveStudySeconds: timedCount > 0 ? activeSecondsSum : null,
    };
  });

  const islandsById = Object.fromEntries(
    islands.map((entry) => [entry.island.id, entry]),
  ) as Record<MiriIslandId, MiriIslandProgress>;

  // Global totals strictly deduplicated across uniqueSessions (no Split Array double-counting!)
  let uniqueEligiblePracticeSessions = 0;
  let globalActiveSecondsSum = 0;
  let globalTimedCount = 0;
  for (const s of uniqueSessions) {
    if (isEligiblePracticeSession(s)) {
      uniqueEligiblePracticeSessions += 1;
    }
    const cleanSec = sanitizeActiveStudySeconds(s.activeStudySeconds);
    if (cleanSec !== undefined) {
      globalActiveSecondsSum += cleanSec;
      globalTimedCount += 1;
    }
  }

  return {
    islands,
    islandsById,
    globalTotals: {
      uniqueSavedSessions: uniqueSessions.length,
      uniqueEligiblePracticeSessions,
      totalActiveStudySeconds:
        globalTimedCount > 0 ? globalActiveSecondsSum : null,
      verifiedIslandsCount: islands.filter((i) => i.hasVerifiedStudio).length,
      practicedIslandsCount: islands.filter(
        (i) => i.stage === 'developing' || i.stage === 'flourishing',
      ).length,
    },
  };
}
