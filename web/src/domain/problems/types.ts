export interface ProblemExample {
  input: string;
  output: string;
  explanation: string;
}

export interface SolutionGraphNode {
  id: string;
  title: string;
  learningGoal: string;
  skills: string[];
  rationale: string;
}

export interface SolutionGraphEdge {
  source: string;
  target: string;
  reason: string;
}

export interface SolutionGraph {
  id: string;
  strategyId: string;
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
