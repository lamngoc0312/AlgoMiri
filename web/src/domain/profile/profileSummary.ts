import { isEligiblePracticeSession } from '../learning/activityStreak';
import { sanitizeActiveStudySeconds } from '../learning/studyTimer';
import type { LearningSession } from '../learning/types';
import { getVerifiedLibraryItems } from '../problems/libraryCatalog';

export type TopicActivityStatus = 'practiced' | 'explored' | 'not-started';

export interface VerifiedStudioActivitySummary {
  problemId: string;
  problemTitle: string;
  topic: string;
  studioPath: string;
  status: TopicActivityStatus;
  eligibleSessionsCount: number;
  totalSessionsCount: number;
  bestCompletedStages: number;
  totalStages: number;
  activeStudySeconds: number | null;
}

/** Backward-compatible alias while keeping terminology accurate to Verified Studios. */
export type ProfileTopicSummary = VerifiedStudioActivitySummary;

/**
 * Derives honest, evidence-based activity across the implemented Verified Visual Studios
 * strictly from saved LearningSession records. Structured so future topic/island modules
 * can plug in without rewriting evidence rules. Never fabricates mastery percentages.
 */
export function buildProfileTopicSummaries(
  sessions: LearningSession[],
): VerifiedStudioActivitySummary[] {
  const verifiedItems = getVerifiedLibraryItems();

  return verifiedItems.map((item) => {
    const matching = sessions.filter((s) => s.problemId === item.id);
    const eligible = matching.filter(isEligiblePracticeSession);

    let bestCompletedStages = 0;
    let activeSecondsSum = 0;
    let timedCount = 0;

    for (const s of matching) {
      bestCompletedStages = Math.max(bestCompletedStages, s.completedStagesCount);
      const clean = sanitizeActiveStudySeconds(s.activeStudySeconds);
      if (clean !== undefined) {
        activeSecondsSum += clean;
        timedCount += 1;
      }
    }

    const status: TopicActivityStatus =
      eligible.length > 0
        ? 'practiced'
        : matching.length > 0
          ? 'explored'
          : 'not-started';

    return {
      problemId: item.id,
      problemTitle: item.title,
      topic: item.topic,
      studioPath: item.studioPath ?? `/studio/${item.id}`,
      status,
      eligibleSessionsCount: eligible.length,
      totalSessionsCount: matching.length,
      bestCompletedStages,
      totalStages: item.stagesCount ?? 0,
      activeStudySeconds: timedCount > 0 ? activeSecondsSum : null,
    };
  });
}
