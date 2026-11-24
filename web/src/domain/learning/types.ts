import type { PredictionSummaryStats, StageStatusMap } from './session';

export type SkillId =
  | 'array-indexing'
  | 'brute-force'
  | 'hash-map-lookup'
  | 'stack-lifo'
  | 'binary-search-answer'
  | 'greedy-feasibility'
  | 'algorithm-composition'
  | 'time-space-complexity';

export interface SkillDefinition {
  id: SkillId;
  name: string;
  category: string;
  description: string;
  prerequisites: SkillId[];
  relatedProblemIds: string[];
  recommendedStudioPath: string;
}

/**
 * Cautious evidence hierarchy.
 * - 'viewed': learner viewed a stage/strategy only (does NOT prove understanding)
 * - 'attempted': learner attempted a check/prediction without solving it
 * - 'correct-with-assistance': learner solved after retries or after revealing hints
 * - 'first-try-correct': learner solved a guided check or trace prediction on first try without hints
 * - 'independently-demonstrated': reserved strictly for future unassisted assessments;
 *    NEVER awarded from guided lessons, viewing visuals, or AI Tutor conversations.
 */
export type EvidenceLevel =
  | 'viewed'
  | 'attempted'
  | 'correct-with-assistance'
  | 'first-try-correct'
  | 'independently-demonstrated';

export type LearningEventType =
  | 'stage-viewed'
  | 'stage-answered'
  | 'stage-skipped'
  | 'hint-revealed'
  | 'prediction-answered'
  | 'prediction-skipped'
  | 'strategy-explored'
  | 'session-finalized';

export interface LearningEvent {
  id: string;
  type: LearningEventType;
  timestamp: string;
  stageId?: string;
  strategyId?: string;
  questionId?: string;
  correct?: boolean;
  hintLevel?: number;
}

export type AttemptSource = 'guided-stage' | 'trace-prediction';

export interface LearningAttempt {
  id: string;
  source: AttemptSource;
  targetId: string;
  skillIds: SkillId[];
  correct: boolean;
  firstTry: boolean;
  retries: number;
  hintsUsed: number;
  skipped: boolean;
  evidenceLevel: EvidenceLevel;
}

export interface SkillEvidence {
  id: string;
  skillId: SkillId;
  sessionId: string;
  problemId: string;
  source: AttemptSource | 'strategy-view';
  evidenceLevel: EvidenceLevel;
  recordedAt: string;
}

export type SessionOutcome =
  | 'completed-guided'
  | 'completed-with-skips'
  | 'partial-attempt'
  | 'viewed-only';

export interface LearningSession {
  sessionId: string;
  problemId: string;
  problemTitle: string;
  mode: 'guided' | 'explore';
  strategiesExplored: string[];
  startedAt: string;
  completedAt: string;
  stageStatuses: StageStatusMap;
  totalStages: number;
  completedStagesCount: number;
  skippedStagesCount: number;
  attemptedStagesCount: number;
  predictionSummary: PredictionSummaryStats;
  hintsUsed: number;
  hintsByStage: Record<string, number>;
  attempts: LearningAttempt[];
  skillEvidence: SkillEvidence[];
  events: LearningEvent[];
  outcome: SessionOutcome;
}

export type SkillProgressLabel =
  | 'Not Yet Practiced'
  | 'Introduced (Viewed Only)'
  | 'Practicing (Attempted)'
  | 'Guided Progress (With Assistance)'
  | 'Strong Guided Recall (First-Try)'
  | 'Independently Demonstrated';

export interface SkillProgressSummary {
  skill: SkillDefinition;
  label: SkillProgressLabel;
  /** Cautious visual bar value (0-100); capped below 100% until independently demonstrated. */
  indicatorPercent: number;
  counts: Record<EvidenceLevel, number>;
  totalAttempts: number;
  mistakesAndSkips: number;
  evidenceNote: string;
  needsPractice: boolean;
}

export interface ProblemProgressSummary {
  problemId: string;
  problemTitle: string;
  studioPath: string;
  totalSessions: number;
  strategiesExplored: string[];
  totalStrategiesAvailable: number;
  bestVerifiedStages: number;
  totalStages: number;
  predictionsAttempted: number;
  predictionsFirstTry: number;
  predictionsSolved: number;
  predictionsSkipped: number;
  hintsUsed: number;
  lastPracticedAt: string | null;
  lastOutcome: SessionOutcome | null;
}

export interface PracticeSuggestion {
  id: string;
  title: string;
  reason: string;
  targetProblemId: string;
  targetPath: string;
  ctaLabel: string;
  relatedSkills: SkillId[];
  priority: 'high' | 'medium' | 'starter';
}

export interface LearningProgressSummary {
  totalSessions: number;
  problemsPracticedCount: number;
  totalAvailableProblems: number;
  uniqueStrategiesExploredCount: number;
  totalAvailableStrategies: number;
  totalPredictionsAttempted: number;
  totalPredictionsFirstTry: number;
  totalPredictionsSolvedAfterRetry: number;
  totalPredictionsSolved: number;
  totalPredictionsSkipped: number;
  totalPredictionsSkippedAfterAttempt: number;
  totalPredictionsSkippedWithoutAttempt: number;
  totalPredictionsUnresolved: number;
  totalPredictionQuestions: number;
  /** Percentage of attempted predictions answered right on first try, or null if none attempted. */
  firstTryAccuracyPercent: number | null;
  /** Percentage of attempted predictions eventually solved, or null if none attempted. */
  overallSolvedPercent: number | null;
  totalHintsUsed: number;
  skillsPracticedCount: number;
  skillSummaries: SkillProgressSummary[];
  problemSummaries: ProblemProgressSummary[];
  areasNeedingPractice: SkillProgressSummary[];
  recentSessions: LearningSession[];
  suggestions: PracticeSuggestion[];
}
