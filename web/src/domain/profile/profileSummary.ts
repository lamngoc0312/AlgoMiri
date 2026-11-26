import { isEligiblePracticeSession } from '../learning/activityStreak';
import { sanitizeActiveStudySeconds } from '../learning/studyTimer';
import type { LearningSession } from '../learning/types';
import { getVerifiedLibraryItems } from '../problems/libraryCatalog';

export type TopicActivityStatus = 'practiced' | 'explored' | 'not-started';

export interface ProfileTopicSummary {
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

/**
 * Derives honest, evidence-based topic-level learning activity strictly from
 * verified LearningSession records. Never fabricates mastery percentages.
 */
export function buildProfileTopicSummaries(
  sessions: LearningSession[],
): ProfileTopicSummary[] {
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
