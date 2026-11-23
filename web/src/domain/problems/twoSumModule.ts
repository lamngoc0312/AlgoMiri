import type {
  ArrayHashVisualState,
  GenericExecutionStep,
  ProblemModule,
} from '../core/types';
import {
  TWO_SUM_PROBLEM,
  TWO_SUM_SOLUTION_GRAPHS,
} from './twoSumDemo';
import {
  DEFAULT_TWO_SUM_INPUT,
  TWO_SUM_PRESETS,
  generateTwoSumTrace,
} from '../traces/twoSumEngine';
import type {
  ExecutionStep,
  TwoSumInput,
  TwoSumStrategyId,
} from '../traces/types';
import {
  TWO_SUM_GUIDED_STAGES,
  TWO_SUM_PSEUDOCODE_BLOCKS,
} from '../learning/twoSumLesson';
import { STAGE_HINTS } from '../learning/hints';
import { generatePredictionPrompt } from '../learning/predictions';

function toGenericStep(
  step: ExecutionStep,
): GenericExecutionStep<ArrayHashVisualState> {
  return {
    ...step,
    visualState: {
      kind: 'array-hash',
      ...step.visualState,
    },
  };
}

export const twoSumModule: ProblemModule<TwoSumInput, ArrayHashVisualState> = {
  id: 'two-sum',
  visualKind: 'array-hash',
  spec: TWO_SUM_PROBLEM,
  defaultStrategyId: 'hash-map',
  guidedInitialStrategyId: 'brute-force',
  defaultInput: DEFAULT_TWO_SUM_INPUT,
  presets: TWO_SUM_PRESETS,
  formatInputKey: (input) => `${input.nums.join(',')}:${input.target}`,
  generateTrace: (strategyId, input) => {
    const resolvedStrategy: TwoSumStrategyId =
      strategyId === 'brute-force' ? 'brute-force' : 'hash-map';
    const trace = generateTwoSumTrace(resolvedStrategy, input);
    return {
      problemId: 'two-sum',
      strategyId: trace.strategyId,
      input: trace.input,
      steps: trace.steps.map(toGenericStep),
      found: trace.found,
      resultLabel: trace.result
        ? `[${trace.result[0]}, ${trace.result[1]}]`
        : 'Not found',
    };
  },
  solutionGraphs: TWO_SUM_SOLUTION_GRAPHS,
  lesson: {
    stages: TWO_SUM_GUIDED_STAGES.map((stage) => ({
      id: stage.id,
      stageNumber: stage.stageNumber,
      shortTitle: stage.shortTitle,
      title: stage.title,
      goal: stage.goal,
      conceptLearned: stage.conceptLearned,
      narrative: stage.narrative,
      recommendedStrategy: stage.recommendedStrategy,
      lockedStrategyIds: stage.unlocksHashMap ? [] : ['hash-map'],
      question: stage.question,
    })),
    hintsByStage: STAGE_HINTS,
    pseudocodeStageId: 'build-solution',
    pseudocodeBlocks: TWO_SUM_PSEUDOCODE_BLOCKS,
    suggestedNextActivity:
      'Switch to Free Exploration and test tricky edge cases like [3, 3] (target 6), [-3, 4, 3, 90] (target 0), or [1, 2, 3] (target 100) with Predict Mode enabled — then try implementing Two Sum in your own editor without peeking!',
  },
  generatePrediction: (steps, stepIndex, strategyId, traceContextId) => {
    const resolvedStrategy: TwoSumStrategyId =
      strategyId === 'brute-force' ? 'brute-force' : 'hash-map';
    // Re-adapt generic array-hash steps to ExecutionStep for the pure Two Sum prediction generator
    const adapted: ExecutionStep[] = steps.map((s) => ({
      ...s,
      action: s.action as ExecutionStep['action'],
      visualState: s.visualState,
    }));
    return generatePredictionPrompt(
      adapted,
      stepIndex,
      resolvedStrategy,
      traceContextId,
    );
  },
};
