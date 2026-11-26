import type { LearningSession, SessionOutcome } from '../learning/types';

export interface VerifiedProblemHistorySummary {
  problemId: string;
  problemTitle: string;
  sessionCount: number;
  latestActivityAt: string;
  strategiesExplored: string[];
  bestCompletedStages: number;
  totalStages: number;
  latestOutcome: SessionOutcome;
  studioPath: string;
}

export function groupLearningSessionsByProblem(
  sessions: LearningSession[],
): VerifiedProblemHistorySummary[] {
  const grouped = new Map<string, LearningSession[]>();
  for (const session of sessions) {
    const current = grouped.get(session.problemId) ?? [];
    current.push(session);
    grouped.set(session.problemId, current);
  }

  return [...grouped.entries()]
    .map(([problemId, problemSessions]) => {
      const sorted = [...problemSessions].sort((a, b) =>
        b.completedAt.localeCompare(a.completedAt),
      );
      const latest = sorted[0];
      return {
        problemId,
        problemTitle: latest.problemTitle,
        sessionCount: sorted.length,
        latestActivityAt: latest.completedAt,
        strategiesExplored: Array.from(
          new Set(sorted.flatMap((session) => session.strategiesExplored)),
        ),
        bestCompletedStages: Math.max(
          ...sorted.map((session) => session.completedStagesCount),
        ),
        totalStages: Math.max(...sorted.map((session) => session.totalStages)),
        latestOutcome: latest.outcome,
        studioPath: `/studio/${problemId}`,
      };
    })
    .sort((a, b) => b.latestActivityAt.localeCompare(a.latestActivityAt));
}
