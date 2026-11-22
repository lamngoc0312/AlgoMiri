import type { ProblemSpec, SolutionGraph } from './types';
import type { ExecutionStep } from '../traces/types';

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

const PREVIEW_NUMS = [2, 7, 11, 15];
const PREVIEW_TARGET = 9;

export const TWO_SUM_PREVIEW_STEPS: Record<string, ExecutionStep[]> = {
  'brute-force': [
    {
      id: 'bf-preview-0',
      stepIndex: 0,
      action: 'Select anchor i = 0',
      variables: { i: 0, 'nums[i]': 2, j: null, target: PREVIEW_TARGET },
      visualState: {
        nums: PREVIEW_NUMS,
        target: PREVIEW_TARGET,
        pointers: { i: 0 },
        highlights: [{ index: 0, role: 'current', label: 'Anchor i' }],
        pairSum: null,
        foundPair: null,
      },
      highlightedIndices: [0],
      explanation:
        'Start by anchoring i at index 0 (value 2). Next, we will check elements to the right of i so we never pair an element with itself.',
    },
    {
      id: 'bf-preview-1',
      stepIndex: 1,
      action: 'Check partner j = 1',
      variables: { i: 0, j: 1, 'nums[i] + nums[j]': 9, target: PREVIEW_TARGET },
      visualState: {
        nums: PREVIEW_NUMS,
        target: PREVIEW_TARGET,
        pointers: { i: 0, j: 1 },
        highlights: [
          { index: 0, role: 'current', label: 'Anchor i' },
          { index: 1, role: 'partner', label: 'Partner j' },
        ],
        pairSum: 9,
        foundPair: null,
      },
      highlightedIndices: [0, 1],
      explanation:
        'Test partner j = 1 (value 7). Adding nums[0] + nums[1] gives 2 + 7 = 9, which matches our target of 9.',
    },
    {
      id: 'bf-preview-2',
      stepIndex: 2,
      action: 'Match confirmed: [0, 1]',
      variables: { i: 0, j: 1, result: '[0, 1]', target: PREVIEW_TARGET },
      visualState: {
        nums: PREVIEW_NUMS,
        target: PREVIEW_TARGET,
        pointers: { i: 0, j: 1 },
        highlights: [
          { index: 0, role: 'match', label: 'Match (i)' },
          { index: 1, role: 'match', label: 'Match (j)' },
        ],
        pairSum: 9,
        foundPair: [0, 1],
      },
      highlightedIndices: [0, 1],
      explanation:
        'Both indices 0 and 1 are distinct and sum to 9. Return [0, 1] and stop early without scanning the rest of the array.',
      isTerminal: true,
    },
  ],
  'hash-map': [
    {
      id: 'hm-preview-0',
      stepIndex: 0,
      action: 'Inspect i = 0, need complement 7',
      variables: { i: 0, 'nums[i]': 2, complement: 7, seenSize: 0 },
      visualState: {
        nums: PREVIEW_NUMS,
        target: PREVIEW_TARGET,
        pointers: { i: 0 },
        highlights: [{ index: 0, role: 'current', label: 'Current i' }],
        hashMap: [],
        complement: 7,
        foundPair: null,
      },
      highlightedIndices: [0],
      explanation:
        'At index 0, nums[0] is 2. To reach target 9, we need 9 - 2 = 7. We check the Seen Map first — it is empty, so 7 has not been seen yet.',
    },
    {
      id: 'hm-preview-1',
      stepIndex: 1,
      action: 'Store 2 -> index 0 in Seen Map',
      variables: { i: 0, stored: '2 -> 0', seenSize: 1 },
      visualState: {
        nums: PREVIEW_NUMS,
        target: PREVIEW_TARGET,
        pointers: { i: 0 },
        highlights: [{ index: 0, role: 'visited', label: 'Stored' }],
        hashMap: [{ key: 2, value: 0, isNew: true }],
        complement: 7,
        foundPair: null,
      },
      highlightedIndices: [0],
      explanation:
        'Because 7 was not in the map, we record value 2 with its index 0 in the Seen Map, then move forward to index 1.',
    },
    {
      id: 'hm-preview-2',
      stepIndex: 2,
      action: 'Inspect i = 1, complement 2 found!',
      variables: { i: 1, 'nums[i]': 7, complement: 2, lookupHit: 'index 0' },
      visualState: {
        nums: PREVIEW_NUMS,
        target: PREVIEW_TARGET,
        pointers: { i: 1 },
        highlights: [
          { index: 0, role: 'partner', label: 'In Map' },
          { index: 1, role: 'current', label: 'Current i' },
        ],
        hashMap: [{ key: 2, value: 0, isMatched: true }],
        complement: 2,
        foundPair: null,
      },
      highlightedIndices: [0, 1],
      explanation:
        'At index 1, nums[1] is 7. Its complement is 9 - 7 = 2. Checking the Seen Map BEFORE inserting 7 finds 2 immediately at index 0.',
    },
    {
      id: 'hm-preview-3',
      stepIndex: 3,
      action: 'Match confirmed: [0, 1]',
      variables: { i: 1, complementIndex: 0, result: '[0, 1]' },
      visualState: {
        nums: PREVIEW_NUMS,
        target: PREVIEW_TARGET,
        pointers: { i: 1 },
        highlights: [
          { index: 0, role: 'match', label: 'Match (0)' },
          { index: 1, role: 'match', label: 'Match (1)' },
        ],
        hashMap: [{ key: 2, value: 0, isMatched: true }],
        complement: 2,
        pairSum: 9,
        foundPair: [0, 1],
      },
      highlightedIndices: [0, 1],
      explanation:
        'Lookup succeeded in O(1) time without a nested loop. Return the distinct indices [0, 1].',
      isTerminal: true,
    },
  ],
};
