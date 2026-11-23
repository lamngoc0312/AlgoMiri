import type { GuidedStage } from '../core/types';

export type StageStatus =
  | 'unvisited'
  | 'viewed'
  | 'attempted'
  | 'skipped'
  | 'skipped-after-attempt'
  | 'completed';

export type StageStatusMap = Record<string, StageStatus>;

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

export function createInitialStageStatuses(
  stages: GuidedStage[],
): StageStatusMap {
  const map: StageStatusMap = {};
  stages.forEach((stage, idx) => {
    map[stage.id] = idx === 0 ? 'viewed' : 'unvisited';
  });
  return map;
}

export function createInitialHintsByStage(
  stages: GuidedStage[],
): Record<string, number> {
  const map: Record<string, number> = {};
  for (const stage of stages) {
    map[stage.id] = 0;
  }
  return map;
}

export function markStageViewed(
  statuses: StageStatusMap,
  stageId: string,
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
  stageId: string,
  isCorrect: boolean,
): StageStatusMap {
  if (isCorrect) {
    if (statuses[stageId] === 'completed') return statuses;
    return {
      ...statuses,
      [stageId]: 'completed',
    };
  }

  // Never downgrade an already completed stage
  if (statuses[stageId] === 'completed') {
    return statuses;
  }

  return {
    ...statuses,
    [stageId]: 'attempted',
  };
}

export function markStageSkippedIfIncomplete(
  statuses: StageStatusMap,
  stageId: string,
): StageStatusMap {
  const current = statuses[stageId];
  if (current === 'completed') {
    return statuses;
  }
  if (current === 'attempted' || current === 'skipped-after-attempt') {
    return {
      ...statuses,
      [stageId]: 'skipped-after-attempt',
    };
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
