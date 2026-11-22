export type TwoSumStrategyId = 'brute-force' | 'hash-map';

export interface TwoSumInput {
  nums: number[];
  target: number;
}

export type HighlightRole = 'current' | 'partner' | 'match' | 'visited';

export interface ArrayHighlight {
  index: number;
  role: HighlightRole;
  label: string;
}

export interface HashMapEntry {
  key: number;
  value: number;
  isMatched?: boolean;
  isNew?: boolean;
}

export type TraceStatus = 'running' | 'found' | 'not-found';

export interface VisualState {
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

export type ExecutionAction =
  | 'select-anchor'
  | 'compare-pair'
  | 'lookup-miss'
  | 'store-value'
  | 'lookup-hit'
  | 'found'
  | 'not-found';

export interface ExecutionStep {
  id: string;
  stepIndex: number;
  action: ExecutionAction;
  actionTitle: string;
  line?: number;
  variables: Record<string, string | number | boolean | null>;
  visualState: VisualState;
  highlightedIndices: number[];
  explanation: string;
  isTerminal?: boolean;
}

export interface TwoSumTraceResult {
  strategyId: TwoSumStrategyId;
  input: TwoSumInput;
  steps: ExecutionStep[];
  result: [number, number] | null;
  found: boolean;
}
