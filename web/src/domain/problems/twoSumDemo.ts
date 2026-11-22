import type { ProblemSpec, SolutionGraph } from './types';

export const TWO_SUM_PROBLEM: ProblemSpec = {
  id: 'two-sum',
  provider: 'algomiri-original',
  title: 'Two Sum',
  difficulty: 'Beginner',
  statement:
    'Given an array of integers nums and an integer target, find two distinct indices i and j such that nums[i] + nums[j] equals target. You may not use the same element twice.',
  constraints: [
    'Array contains finite integers (positive, zero, or negative).',
    'Duplicate values may appear at different indices.',
    'The two returned indices must be distinct (i != j).',
    'If no valid pair exists, report that no solution was found.',
  ],
  examples: [
    {
      input: 'nums = [2, 7, 11, 15], target = 9',
      output: '[0, 1]',
      explanation: 'nums[0] (2) + nums[1] (7) = 9.',
    },
    {
      input: 'nums = [3, 3], target = 6',
      output: '[0, 1]',
      explanation: 'Both values are 3, located at distinct indices 0 and 1.',
    },
  ],
  inputSchema: 'nums: number[], target: number',
  outputSchema: '[number, number] | null',
  supportedVisualization: true,
  supportedStrategies: [
    {
      id: 'brute-force',
      problemId: 'two-sum',
      name: 'Brute Force Pair Check',
      shortLabel: 'Brute Force',
      intuition:
        'Fix one number at index i, then scan every later index j > i to check whether the two values add up to target.',
      tradeoffs:
        'Easy to reason about and uses no extra memory, but checks many pairs as the array grows.',
      timeComplexity: 'O(n²)',
      spaceComplexity: 'O(1)',
      techniques: ['Nested Iteration', 'Pair Enumeration'],
      learningGraphId: 'two-sum-brute-force-graph',
    },
    {
      id: 'hash-map',
      problemId: 'two-sum',
      name: 'Hash Map Complement Lookup',
      shortLabel: 'Hash Map',
      intuition:
        'For each number, ask: "Have I already seen the exact complement (target - current)?" Store visited numbers in a hash map for instant lookup.',
      tradeoffs:
        'Uses extra memory to remember seen values, cutting the search down to a single pass.',
      timeComplexity: 'O(n)',
      spaceComplexity: 'O(n)',
      techniques: ['Complement Reformulation', 'Hash Map Lookup'],
      learningGraphId: 'two-sum-hash-map-graph',
    },
  ],
};

export const TWO_SUM_SOLUTION_GRAPHS: Record<string, SolutionGraph> = {
  'brute-force': {
    id: 'two-sum-brute-force-graph',
    strategyId: 'brute-force',
    nodes: [
      {
        id: 'bf-1',
        title: 'Pick anchor element i',
        learningGoal: 'Fix one candidate at a time so every pair is covered systematically.',
        skills: ['Array Indexing'],
        rationale: 'Anchoring i avoids random guessing.',
      },
      {
        id: 'bf-2',
        title: 'Scan partner j > i',
        learningGoal: 'Start j at i + 1 to guarantee distinct indices and avoid duplicate checks.',
        skills: ['Nested Loops', 'Index Bounds'],
        rationale: 'Starting after i prevents matching an element with itself.',
      },
      {
        id: 'bf-3',
        title: 'Check pair sum',
        learningGoal: 'Compare nums[i] + nums[j] against target and stop when matched.',
        skills: ['Early Exit'],
        rationale: 'Returning immediately avoids unnecessary remaining iterations.',
      },
    ],
    edges: [
      { source: 'bf-1', target: 'bf-2', reason: 'For each anchor i, pair it with later indices.' },
      { source: 'bf-2', target: 'bf-3', reason: 'Evaluate the sum of each distinct pair.' },
    ],
  },
  'hash-map': {
    id: 'two-sum-hash-map-graph',
    strategyId: 'hash-map',
    nodes: [
      {
        id: 'hm-1',
        title: 'Compute needed complement',
        learningGoal: 'Turn "find two numbers" into "find target - nums[i]".',
        skills: ['Algebraic Reformulation'],
        rationale: 'Knowing the exact missing number removes the inner scan.',
      },
      {
        id: 'hm-2',
        title: 'Check seen map first',
        learningGoal: 'Look up the complement BEFORE inserting nums[i] so an element never matches itself.',
        skills: ['Hash Map Lookup', 'Distinct-Index Invariant'],
        rationale: 'Order of lookup vs. insert prevents false self-matches like 3 + 3 = 6 at the same index.',
      },
      {
        id: 'hm-3',
        title: 'Store value -> index',
        learningGoal: 'Remember nums[i] and its index for future elements to find in O(1) time.',
        skills: ['Space-Time Tradeoff'],
        rationale: 'Trading O(n) memory eliminates repeated linear scans.',
      },
    ],
    edges: [
      { source: 'hm-1', target: 'hm-2', reason: 'Search memory for the exact complement needed.' },
      { source: 'hm-2', target: 'hm-3', reason: 'If not found yet, record current value and move on.' },
    ],
  },
};
