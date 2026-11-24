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
    title: 'Brute Force Decomposition',
    summary:
      'Fix an anchor element, enforce distinct partner bounds, evaluate pair sums, and exit as soon as target is matched.',
    requiresDag: true,
    nodes: [
      {
        id: 'bf-anchor',
        title: 'Pick anchor element i',
        category: 'input-model',
        learningGoal:
          'Fix one candidate index at a time so every unordered pair is covered systematically.',
        explanation:
          'Hold index i steady while exploring possible partner indices to its right.',
        rationale:
          'Anchoring i gives a structured search order instead of guessing random pairs.',
        skills: ['Array Indexing', 'Systematic Search'],
        prerequisites: ['Basic loops'],
        techniques: ['Pair Enumeration'],
        ioContract: {
          inputs: ['nums[]', 'anchor index i'],
          outputs: ['fixed candidate nums[i]'],
        },
        mappedActions: ['select-anchor'],
      },
      {
        id: 'bf-distinct-bound',
        title: 'Enforce j > i bound',
        category: 'invariant',
        learningGoal:
          'Start j at i + 1 to guarantee distinct indices and avoid checking the same pair twice.',
        explanation:
          'Only consider indices strictly greater than i so (i, i) is impossible and (j, i) is never repeated.',
        rationale:
          'Starting at 0 or i would violate the distinct-index rule or double the work.',
        skills: ['Loop Bounds', 'Distinct-Index Invariant'],
        prerequisites: ['Array Indexing'],
        techniques: ['Nested Iteration'],
        ioContract: {
          inputs: ['anchor index i', 'array length n'],
          outputs: ['valid partner range [i + 1 .. n - 1]'],
        },
        mappedActions: ['select-anchor', 'compare-pair'],
      },
      {
        id: 'bf-pair-sum',
        title: 'Evaluate pair sum',
        category: 'operation',
        learningGoal:
          'Compute nums[i] + nums[j] and compare it directly against target.',
        explanation:
          'Test whether the anchored element and current partner sum to the required target.',
        rationale:
          'Each comparison either proves the pair is a solution or eliminates it cleanly.',
        skills: ['Arithmetic Comparison'],
        prerequisites: ['Array Indexing'],
        techniques: ['Direct Verification'],
        ioContract: {
          inputs: ['nums[i]', 'nums[j]', 'target'],
          outputs: ['match: boolean'],
        },
        mappedActions: ['compare-pair'],
      },
      {
        id: 'bf-early-exit',
        title: 'Return pair or Not Found',
        category: 'termination',
        learningGoal:
          'Return [i, j] immediately on a match, or report not-found only after all distinct pairs fail.',
        explanation:
          'Stop early when a valid pair is found; otherwise conclude no solution exists once all pairs are exhausted.',
        rationale:
          'Early exit avoids wasted work, while exhaustive completion ensures no valid pair is missed.',
        skills: ['Early Exit', 'Edge-Case Handling'],
        prerequisites: ['Loop Bounds', 'Arithmetic Comparison'],
        techniques: ['Exhaustive Search Termination'],
        ioContract: {
          inputs: ['comparison result', 'remaining pairs'],
          outputs: ['[i, j] | null'],
        },
        mappedActions: ['found', 'not-found'],
      },
    ],
    edges: [
      {
        id: 'bf-e1',
        source: 'bf-anchor',
        target: 'bf-distinct-bound',
        reason: 'Anchor i defines the lower bound j = i + 1 for valid partners.',
      },
      {
        id: 'bf-e2',
        source: 'bf-anchor',
        target: 'bf-pair-sum',
        reason: 'Supplies nums[i] for the pair addition.',
      },
      {
        id: 'bf-e3',
        source: 'bf-distinct-bound',
        target: 'bf-early-exit',
        reason: 'Guarantees any returned pair uses two distinct indices.',
      },
      {
        id: 'bf-e4',
        source: 'bf-pair-sum',
        target: 'bf-early-exit',
        reason: 'Determines whether to return [i, j] immediately or continue.',
      },
    ],
  },
  'hash-map': {
    id: 'two-sum-hash-map-graph',
    strategyId: 'hash-map',
    title: 'Hash Map Complement Decomposition',
    summary:
      'Reformulate the search into a single complement value, combine O(1) memory with the distinct-index rule, and check before inserting.',
    requiresDag: true,
    nodes: [
      {
        id: 'hm-reformulate',
        title: 'Reformulate as complement',
        category: 'input-model',
        learningGoal:
          'Turn "find two numbers summing to target" into "find exact value target - nums[i]".',
        explanation:
          'Once you inspect nums[i], only one specific number can complete the pair: complement = target - nums[i].',
        rationale:
          'Knowing the exact missing value eliminates the need to test every other number blindly.',
        skills: ['Algebraic Reformulation'],
        prerequisites: ['Basic arithmetic'],
        techniques: ['Complement Reformulation'],
        ioContract: {
          inputs: ['nums[i]', 'target'],
          outputs: ['complement: number'],
        },
        mappedActions: ['lookup-miss', 'lookup-hit'],
      },
      {
        id: 'hm-memory-map',
        title: 'Maintain Seen Map (value → index)',
        category: 'technique',
        learningGoal:
          'Trade O(n) memory to look up any previously visited value in O(1) average time.',
        explanation:
          'Store each visited number as the key and its array index as the value in a hash map.',
        rationale:
          'Keying by value lets us ask "have we seen complement?" instantly instead of scanning linearly.',
        skills: ['Hash Map Lookup', 'Space-Time Tradeoff'],
        prerequisites: ['Key-Value Dictionaries'],
        techniques: ['Hash Map'],
        ioContract: {
          inputs: ['visited (value, index) pairs'],
          outputs: ['O(1) lookup table seen'],
        },
        mappedActions: ['store-value'],
      },
      {
        id: 'hm-distinct-rule',
        title: 'Enforce lookup-before-insert',
        category: 'invariant',
        learningGoal:
          'Keep the Seen Map restricted to indices strictly less than i during every lookup.',
        explanation:
          'Check whether complement is already in seen BEFORE recording nums[i] at index i.',
        rationale:
          'If you inserted nums[i] first, inputs like [3, 2, 4] with target 6 would falsely match index 0 with itself.',
        skills: ['Distinct-Index Invariant', 'Order of Operations'],
        prerequisites: ['Problem Constraints'],
        techniques: ['Invariant Maintenance'],
        ioContract: {
          inputs: ['current index i', 'seen map of indices < i'],
          outputs: ['guaranteed distinct index j < i'],
        },
        mappedActions: ['lookup-miss', 'lookup-hit'],
      },
      {
        id: 'hm-check-and-store',
        title: 'Lookup complement, else store',
        category: 'decision',
        learningGoal:
          'Combine the hash map and distinct-index invariant into one O(1) step per element.',
        explanation:
          'Query seen for complement; if present, you found a valid earlier partner; otherwise insert nums[i] → i and move on.',
        rationale:
          'Merging lookup and deferred storage reduces total runtime from O(n²) to a single O(n) pass.',
        skills: ['Single-Pass Traversal', 'Conditional Branching'],
        prerequisites: ['Hash Map Lookup', 'Distinct-Index Invariant'],
        techniques: ['Single-Pass Hashing'],
        ioContract: {
          inputs: ['complement', 'seen map', 'nums[i], i'],
          outputs: ['hit index j | updated seen map'],
        },
        mappedActions: ['lookup-miss', 'store-value', 'lookup-hit'],
      },
      {
        id: 'hm-terminate',
        title: 'Confirm pair or Not Found',
        category: 'termination',
        learningGoal:
          'Return [seen[complement], i] on a hit, or report not-found if the single pass finishes.',
        explanation:
          'A lookup hit immediately yields two distinct indices; finishing the array without a hit proves no valid pair exists.',
        rationale:
          'If a valid pair existed, the later element of the pair would always find the earlier element already in seen.',
        skills: ['Correctness Proof', 'Edge-Case Handling'],
        prerequisites: ['Single-Pass Traversal'],
        techniques: ['Early Exit'],
        ioContract: {
          inputs: ['lookup hit | end of array'],
          outputs: ['[j, i] | null'],
        },
        mappedActions: ['found', 'not-found'],
      },
    ],
    edges: [
      {
        id: 'hm-e1',
        source: 'hm-reformulate',
        target: 'hm-memory-map',
        reason: 'Defines what value we want to look up quickly in memory.',
      },
      {
        id: 'hm-e2',
        source: 'hm-reformulate',
        target: 'hm-distinct-rule',
        reason: 'Complement may equal nums[i], so we must guard against self-matching.',
      },
      {
        id: 'hm-e3',
        source: 'hm-memory-map',
        target: 'hm-check-and-store',
        reason: 'Provides O(1) lookup and storage for visited numbers.',
      },
      {
        id: 'hm-e4',
        source: 'hm-distinct-rule',
        target: 'hm-check-and-store',
        reason: 'Requires performing the lookup strictly before inserting nums[i].',
      },
      {
        id: 'hm-e5',
        source: 'hm-check-and-store',
        target: 'hm-terminate',
        reason: 'Produces either a confirmed distinct pair or exhausts the array.',
      },
    ],
  },
};
