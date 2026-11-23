import type { GuidedStageId } from './twoSumLesson';

export type StageStatus =
  | 'unvisited'
  | 'viewed'
  | 'attempted'
  | 'skipped'
  | 'completed';

export type StageStatusMap = Record<GuidedStageId, StageStatus>;

export interface PredictionRecord {
  questionId: string;
  firstAttemptCorrect: boolean;
  solved: boolean;
  retryCount: number;
  skipped: boolean;
  lastSelectedOptionId: string | null;
}

export interface PredictionSummaryStats {
  questionsAttempted: number;
  firstTryCorrect: number;
  solvedAfterRetry: number;
  totalSolved: number;
  totalRetries: number;
  skippedCount: number;
}

export function createInitialStageStatuses(): StageStatusMap {
  return {
    understand: 'viewed',
    'discover-brute-force': 'unvisited',
    'discover-optimization': 'unvisited',
    'build-solution': 'unvisited',
  };
}

export function createInitialHintsByStage(): Record<GuidedStageId, number> {
  return {
    understand: 0,
    'discover-brute-force': 0,
    'discover-optimization': 0,
    'build-solution': 0,
  };
}

export function markStageViewed(
  statuses: StageStatusMap,
  stageId: GuidedStageId,
): StageStatusMap {
  if (statuses[stageId] !== 'unvisited') {
    return statuses;
  }
  return {
    ...statuses,
    [stageId]: 'viewed',
  };
}

export function recordStageAnswer(
  statuses: StageStatusMap,
  stageId: GuidedStageId,
  isCorrect: boolean,
): StageStatusMap {
  if (isCorrect) {
    if (statuses[stageId] === 'completed') return statuses;
    return {
      ...statuses,
      [stageId]: 'completed',
    };
  }

  // Do not downgrade an already completed stage
  if (statuses[stageId] === 'completed' || statuses[stageId] === 'attempted') {
    return statuses;
  }

  return {
    ...statuses,
    [stageId]: 'attempted',
  };
}

export function markStageSkippedIfIncomplete(
  statuses: StageStatusMap,
  stageId: GuidedStageId,
): StageStatusMap {
  const current = statuses[stageId];
  // Never overwrite a verified completion or an active wrong-answer attempt
  if (current === 'completed' || current === 'attempted') {
    return statuses;
  }
  return {
    ...statuses,
    [stageId]: 'skipped',
  };
}

export function recordPredictionAnswer(
  records: Record<string, PredictionRecord>,
  questionId: string,
  optionId: string,
  isCorrect: boolean,
): Record<string, PredictionRecord> {
  const existing = records[questionId];

  // Prevent repeated clicks on an already-solved question from inflating stats
  if (existing?.solved) {
    return records;
  }

  // Prevent repeated clicks on the exact same option from inflating retries
  if (existing && existing.lastSelectedOptionId === optionId) {
    return records;
  }

  // First real attempt (either brand new or previously only skipped)
  if (!existing || existing.lastSelectedOptionId === null) {
    return {
      ...records,
      [questionId]: {
        questionId,
        firstAttemptCorrect: isCorrect,
        solved: isCorrect,
        retryCount: 0,
        skipped: false,
        lastSelectedOptionId: optionId,
      },
    };
  }

  // Retry after an incorrect attempt (no penalty, tracked separately from first attempt)
  return {
    ...records,
    [questionId]: {
      ...existing,
      solved: isCorrect,
      retryCount: existing.retryCount + 1,
      skipped: false,
      lastSelectedOptionId: optionId,
    },
  };
}

export function recordPredictionSkip(
  records: Record<string, PredictionRecord>,
  questionId: string,
): Record<string, PredictionRecord> {
  const existing = records[questionId];
  if (existing?.solved) {
    return records;
  }

  if (existing) {
    return {
      ...records,
      [questionId]: {
        ...existing,
        skipped: true,
      },
    };
  }

  return {
    ...records,
    [questionId]: {
      questionId,
      firstAttemptCorrect: false,
      solved: false,
      retryCount: 0,
      skipped: true,
      lastSelectedOptionId: null,
    },
  };
}

export function summarizePredictions(
  records: Record<string, PredictionRecord>,
): PredictionSummaryStats {
  const list = Object.values(records);
  let questionsAttempted = 0;
  let firstTryCorrect = 0;
  let solvedAfterRetry = 0;
  let totalRetries = 0;
  let skippedCount = 0;

  for (const record of list) {
    if (record.lastSelectedOptionId !== null) {
      questionsAttempted += 1;
    }
    if (record.firstAttemptCorrect) {
      firstTryCorrect += 1;
    } else if (record.solved) {
      solvedAfterRetry += 1;
    }
    totalRetries += record.retryCount;
    if (record.skipped && !record.solved) {
      skippedCount += 1;
    }
  }

  return {
    questionsAttempted,
    firstTryCorrect,
    solvedAfterRetry,
    totalSolved: firstTryCorrect + solvedAfterRetry,
    totalRetries,
    skippedCount,
  };
}
