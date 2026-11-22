export type IndependenceLevel =
  | 'guided'
  | 'hinted'
  | 'predicted'
  | 'independent';

export interface LearningAttempt {
  userId: string;
  problemId: string;
  strategyId: string;
  startedAt: string;
  completedAt?: string;
  result: 'in-progress' | 'completed' | 'abandoned';
  hintsUsed: number;
  predictionAccuracy?: number;
  selfRatedConfidence?: 1 | 2 | 3 | 4 | 5;
}

export interface SkillEvidence {
  skillId: string;
  attemptId: string;
  source: 'prediction' | 'comprehension-check' | 'guided-recall';
  independenceLevel: IndependenceLevel;
  success: boolean;
  recordedAt: string;
}
