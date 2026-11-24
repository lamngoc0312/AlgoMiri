export interface ProblemExample {
  input: string;
  output: string;
  explanation: string;
}

export type SolutionNodeCategory =
  | 'input-model'
  | 'invariant'
  | 'operation'
  | 'decision'
  | 'technique'
  | 'termination';

export interface SolutionNodeIO {
  inputs: string[];
  outputs: string[];
}

export interface SolutionGraphNode {
  id: string;
  title: string;
  category: SolutionNodeCategory;
  learningGoal: string;
  explanation: string;
  rationale: string;
  skills: string[];
  prerequisites?: string[];
  techniques?: string[];
  ioContract?: SolutionNodeIO;
  mappedActions: string[];
}

export interface SolutionGraphEdge {
  id: string;
  source: string;
  target: string;
  reason: string;
}

export interface SolutionGraph {
  id: string;
  strategyId: string;
  title: string;
  summary: string;
  requiresDag?: boolean;
  nodes: SolutionGraphNode[];
  edges: SolutionGraphEdge[];
}

export interface SolutionStrategy {
  id: string;
  problemId: string;
  name: string;
  shortLabel: string;
  intuition: string;
  tradeoffs: string;
  timeComplexity: string;
  spaceComplexity: string;
  techniques: string[];
  learningGraphId: string;
}

export interface ProblemSpec {
  id: string;
  provider: 'algomiri-original';
  providerId?: string;
  title: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  statement: string;
  constraints: string[];
  examples: ProblemExample[];
  inputSchema: string;
  outputSchema: string;
  supportedStrategies: SolutionStrategy[];
  supportedVisualization: boolean;
}
