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

export interface VisualState {
  nums: number[];
  target: number;
  pointers: Record<string, number>;
  highlights: ArrayHighlight[];
  hashMap?: HashMapEntry[];
  complement?: number | null;
  pairSum?: number | null;
  foundPair?: [number, number] | null;
}

export interface ExecutionStep {
  id: string;
  stepIndex: number;
  action: string;
  line?: number;
  variables: Record<string, string | number | boolean | null>;
  visualState: VisualState;
  highlightedIndices: number[];
  explanation: string;
  isTerminal?: boolean;
}
