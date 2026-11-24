import type { GuidedStage } from '../core/types';

export type StageStatus =
  | 'unvisited'
  | 'viewed'
  | 'attempted'
  | 'skipped'
  | 'skipped-after-attempt'
  | 'completed';

export type StageStatusMap = Record<string, StageStatus>;

export interface PredictionMetadata {
  strategyId?: string;
  stepAction?: string;
  nextStepAction?: string;
  stepIndex?: number;
}

export interface PredictionRecord {
  questionId: string;
  firstAttemptCorrect: boolean;
  solved: boolean;
  retryCount: number;
  skipped: boolean;
  /** True once Skip & Reveal has been used on this question; prevents later answers from counting as first-try. */
  wasEverSkipped?: boolean;
  lastSelectedOptionId: string | null;
  strategyId?: string;
  stepAction?: string;
  nextStepAction?: string;
  stepIndex?: number;
}

/**
 * Prediction summary with strictly mutually exclusive per-question outcome buckets:
 *   totalQuestions === firstTryCorrect + solvedAfterRetry + skippedAfterAttempt + skippedWithoutAttempt + unresolvedAttempt
 * Derived totals (kept for backwards compatibility):
 *   questionsAttempted === firstTryCorrect + solvedAfterRetry + skippedAfterAttempt + unresolvedAttempt
 *   totalSolved === firstTryCorrect + solvedAfterRetry
 *   skippedCount === skippedAfterAttempt + skippedWithoutAttempt
 */
export interface PredictionSummaryStats {
  questionsAttempted: number;
  firstTryCorrect: number;
  solvedAfterRetry: number;
  totalSolved: number;
  totalRetries: number;
  skippedCount: number;
  skippedAfterAttempt: number;
  skippedWithoutAttempt: number;
  unresolvedAttempt: number;
  totalQuestions: number;
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
  meta?: PredictionMetadata,
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

  const mergedMeta: PredictionMetadata = {
    strategyId: meta?.strategyId ?? existing?.strategyId,
    stepAction: meta?.stepAction ?? existing?.stepAction,
    nextStepAction: meta?.nextStepAction ?? existing?.nextStepAction,
    stepIndex: meta?.stepIndex ?? existing?.stepIndex,
  };

  const previouslySkipped = Boolean(existing?.skipped || existing?.wasEverSkipped);

  // First real attempt on a question
  if (!existing || existing.lastSelectedOptionId === null) {
    return {
      ...records,
      [questionId]: {
        questionId,
        // Answering after Skip & Reveal can NEVER count as first-try success
        firstAttemptCorrect: previouslySkipped ? false : isCorrect,
        solved: isCorrect,
        retryCount: previouslySkipped ? 1 : 0,
        skipped: previouslySkipped && !isCorrect,
        wasEverSkipped: previouslySkipped,
        lastSelectedOptionId: optionId,
        ...mergedMeta,
      },
    };
  }

  // Retry after an incorrect attempt (tracked separately from first attempt)
  return {
    ...records,
    [questionId]: {
      ...existing,
      firstAttemptCorrect: false,
      solved: isCorrect,
      retryCount: existing.retryCount + 1,
      skipped: previouslySkipped && !isCorrect,
      wasEverSkipped: previouslySkipped,
      lastSelectedOptionId: optionId,
      ...mergedMeta,
    },
  };
}

export function recordPredictionSkip(
  records: Record<string, PredictionRecord>,
  questionId: string,
  meta?: PredictionMetadata,
): Record<string, PredictionRecord> {
  const existing = records[questionId];
  if (existing?.solved) {
    return records;
  }

  const mergedMeta: PredictionMetadata = {
    strategyId: meta?.strategyId ?? existing?.strategyId,
    stepAction: meta?.stepAction ?? existing?.stepAction,
    nextStepAction: meta?.nextStepAction ?? existing?.nextStepAction,
    stepIndex: meta?.stepIndex ?? existing?.stepIndex,
  };

  if (existing) {
    return {
      ...records,
      [questionId]: {
        ...existing,
        skipped: true,
        wasEverSkipped: true,
        ...mergedMeta,
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
      wasEverSkipped: true,
      lastSelectedOptionId: null,
      ...mergedMeta,
    },
  };
}

export function summarizePredictions(
  records: Record<string, PredictionRecord>,
): PredictionSummaryStats {
  const list = Object.values(records);
  let firstTryCorrect = 0;
  let solvedAfterRetry = 0;
  let skippedAfterAttempt = 0;
  let skippedWithoutAttempt = 0;
  let unresolvedAttempt = 0;
  let totalRetries = 0;

  for (const record of list) {
    totalRetries += record.retryCount;

    if (record.solved) {
      if (record.firstAttemptCorrect && !record.wasEverSkipped) {
        firstTryCorrect += 1;
      } else {
        solvedAfterRetry += 1;
      }
      continue;
    }

    const hadAttempt = record.lastSelectedOptionId !== null;
    if (record.skipped) {
      if (hadAttempt) {
        skippedAfterAttempt += 1;
      } else {
        skippedWithoutAttempt += 1;
      }
    } else if (hadAttempt) {
      unresolvedAttempt += 1;
    }
  }

  const totalSolved = firstTryCorrect + solvedAfterRetry;
  const questionsAttempted =
    totalSolved + skippedAfterAttempt + unresolvedAttempt;
  const skippedCount = skippedAfterAttempt + skippedWithoutAttempt;
  const totalQuestions = questionsAttempted + skippedWithoutAttempt;

  return {
    questionsAttempted,
    firstTryCorrect,
    solvedAfterRetry,
    totalSolved,
    totalRetries,
    skippedCount,
    skippedAfterAttempt,
    skippedWithoutAttempt,
    unresolvedAttempt,
    totalQuestions,
  };
}
