import type { ProblemSpec, SolutionGraph } from '../problems/types';
import type {
  ArrayHighlight,
  ExecutionAction,
  HashMapEntry,
  TraceStatus,
} from '../traces/types';

export interface ArrayHashVisualState {
  kind: 'array-hash';
  nums: number[];
  target: number;
  pointers: Record<string, number>;
  highlights: ArrayHighlight[];
  hashMap?: HashMapEntry[];
  complement?: number | null;
  pairSum?: number | null;
  foundPair?: [number, number] | null;
  status: TraceStatus;
  activeGoalIndex: number;
}

export interface StackItem {
  id: string;
  char: string;
  index: number;
  highlight?: 'normal' | 'new' | 'comparing' | 'matched' | 'mismatched';
}

export type StackOperation =
  | 'init'
  | 'push'
  | 'check-match'
  | 'pop'
  | 'mismatch'
  | 'unclosed'
  | 'valid';

export interface StackVisualState {
  kind: 'stack';
  input: string;
  currentIndex: number | null;
  currentChar: string | null;
  stack: StackItem[];
  operation: StackOperation;
  comparingWith?: string | null;
  expectedBracket?: string | null;
  isValid: boolean | null;
  status: TraceStatus;
  activeGoalIndex: number;
}

export type CompositionRole = 'driver' | 'subroutine';

export type CompositionAction =
  | 'bs-init-bounds'
  | 'bs-select-mid'
  | 'greedy-start'
  | 'greedy-add-to-group'
  | 'greedy-new-group'
  | 'greedy-result'
  | 'bs-update-bounds'
  | 'bs-converged';

export interface CompositionContext {
  invocationId: string;
  bsIteration: number;
  role: CompositionRole;
  driverTechnique: 'Binary Search on Answer';
  subroutineTechnique: 'Greedy Partitioning';
}

export interface ContiguousGroup {
  groupIndex: number;
  startIndex: number;
  endIndex: number;
  elements: number[];
  sum: number;
  isCurrent: boolean;
  justCreated?: boolean;
}

export interface BsIterationSummary {
  invocationId: string;
  iteration: number;
  low: number;
  high: number;
  mid: number;
  groupsUsed: number;
  feasible: boolean;
  nextLow: number;
  nextHigh: number;
  firstStepIndex: number;
  lastStepIndex: number;
}

export interface BinarySearchGreedyVisualState {
  kind: 'bs-greedy';
  nums: number[];
  k: number;
  low: number;
  high: number;
  mid: number | null;
  composition: CompositionContext;
  scanIndex: number | null;
  runningSum: number | null;
  groupsUsed: number;
  groups: ContiguousGroup[];
  feasible: boolean | null;
  boundDecision: string | null;
  finalAnswer: number | null;
  completedIterations: BsIterationSummary[];
  status: TraceStatus;
  activeGoalIndex: number;
}

export type AnyVisualState =
  | ArrayHashVisualState
  | StackVisualState
  | BinarySearchGreedyVisualState;

export type AnyStepAction =
  | ExecutionAction
  | StackOperation
  | CompositionAction;

export interface GenericExecutionStep<
  TVisual extends AnyVisualState = AnyVisualState,
> {
  id: string;
  stepIndex: number;
  action: AnyStepAction;
  actionTitle: string;
  line?: number;
  conceptualNodeIds?: string[];
  variables: Record<string, string | number | boolean | null>;
  visualState: TVisual;
  highlightedIndices: number[];
  explanation: string;
  isTerminal?: boolean;
}

export interface GenericTraceResult<
  TInput = unknown,
  TVisual extends AnyVisualState = AnyVisualState,
> {
  problemId: string;
  strategyId: string;
  input: TInput;
  steps: GenericExecutionStep<TVisual>[];
  found: boolean;
  resultLabel: string;
}

export interface GuidedQuestionOption {
  id: string;
  label: string;
  isCorrect: boolean;
  feedback: string;
}

export interface GuidedCheckQuestion {
  prompt: string;
  options: GuidedQuestionOption[];
}

export interface PseudocodeBlock {
  id: string;
  stepNumber: number;
  title: string;
  reason: string;
  lines: string[];
}

export interface GuidedStage {
  id: string;
  stageNumber: number;
  shortTitle: string;
  title: string;
  goal: string;
  conceptLearned: string;
  narrative: string;
  recommendedStrategy: string;
  lockedStrategyIds: string[];
  question: GuidedCheckQuestion;
}

export interface ProgressiveHint {
  level: 1 | 2 | 3;
  label: string;
  text: string;
}

export interface PredictionOption {
  id: string;
  label: string;
  isCorrect: boolean;
  feedback: string;
}

export interface PredictionPrompt {
  id: string;
  stepIndex: number;
  question: string;
  options: PredictionOption[];
}

export interface ProblemLesson {
  stages: GuidedStage[];
  hintsByStage: Record<string, ProgressiveHint[]>;
  pseudocodeStageId: string;
  pseudocodeBlocks: PseudocodeBlock[];
  suggestedNextActivity: string;
}

export interface ProblemPreset<TInput = unknown> {
  id: string;
  label: string;
  input: TInput;
}

export interface ProblemModule<
  TInput = unknown,
  TVisual extends AnyVisualState = AnyVisualState,
> {
  id: string;
  visualKind: TVisual['kind'];
  spec: ProblemSpec;
  defaultStrategyId: string;
  guidedInitialStrategyId: string;
  defaultInput: TInput;
  presets: ProblemPreset<TInput>[];
  formatInputKey: (input: TInput) => string;
  generateTrace: (
    strategyId: string,
    input: TInput,
  ) => GenericTraceResult<TInput, TVisual>;
  solutionGraphs: Record<string, SolutionGraph>;
  lesson: ProblemLesson;
  generatePrediction: (
    steps: GenericExecutionStep<TVisual>[],
    stepIndex: number,
    strategyId: string,
    traceContextId: string,
  ) => PredictionPrompt | null;
}
