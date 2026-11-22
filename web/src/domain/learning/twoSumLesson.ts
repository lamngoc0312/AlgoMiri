import type { TwoSumStrategyId } from '../traces/types';

export type GuidedStageId =
  | 'understand'
  | 'discover-brute-force'
  | 'discover-optimization'
  | 'build-solution';

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
  id: GuidedStageId;
  stageNumber: 1 | 2 | 3 | 4;
  shortTitle: string;
  title: string;
  goal: string;
  conceptLearned: string;
  narrative: string;
  recommendedStrategy: TwoSumStrategyId;
  unlocksHashMap: boolean;
  question: GuidedCheckQuestion;
}

export const TWO_SUM_GUIDED_STAGES: GuidedStage[] = [
  {
    id: 'understand',
    stageNumber: 1,
    shortTitle: 'Understand',
    title: 'Stage 1: Understand the Problem',
    goal: 'Clarify inputs, outputs, and the distinct-index rule before choosing any algorithm.',
    conceptLearned: 'Problem Decomposition & Distinct-Index Constraint',
    narrative:
      'Before thinking about loops or data structures, check what a valid answer looks like. We receive an array of integers (positive, zero, or negative) and a target integer, and must return two DIFFERENT indices whose values add up to target.',
    recommendedStrategy: 'brute-force',
    unlocksHashMap: false,
    question: {
      prompt:
        'Suppose nums = [3, 2, 4] and target = 6. Is [0, 0] a valid answer because nums[0] + nums[0] = 3 + 3 = 6?',
      options: [
        {
          id: 'yes-same-index',
          label: 'Yes — index 0 adds to 6 with itself.',
          isCorrect: false,
          feedback:
            'Careful! The problem forbids using the same element twice. Both indices must be distinct (i != j). Look at indices 1 and 2 instead: 2 + 4 = 6.',
        },
        {
          id: 'no-distinct-required',
          label: 'No — the two indices must be distinct, so the answer is [1, 2].',
          isCorrect: true,
          feedback:
            'Exactly right! Even though 3 + 3 = 6, index 0 cannot pair with itself. Indices 1 (value 2) and 2 (value 4) are distinct and sum to 6.',
        },
        {
          id: 'no-solution',
          label: 'No valid answer exists in [3, 2, 4].',
          isCorrect: false,
          feedback:
            'Check the other pairs! nums[1] (2) + nums[2] (4) = 6 uses two distinct indices.',
        },
      ],
    },
  },
  {
    id: 'discover-brute-force',
    stageNumber: 2,
    shortTitle: 'Brute Force',
    title: 'Stage 2: Discover Pair Enumeration',
    goal: 'Build a reliable first strategy that checks every distinct pair systematically.',
    conceptLearned: 'Systematic Pair Enumeration (j > i)',
    narrative:
      'A great first step is always finding a simple, guaranteed-correct strategy. If we fix one anchor index i, which partner indices j should we test so we check every pair once and never pair an element with itself?',
    recommendedStrategy: 'brute-force',
    unlocksHashMap: false,
    question: {
      prompt:
        'For a fixed anchor index i, where should the inner pointer j start?',
      options: [
        {
          id: 'start-zero',
          label: 'Start j at 0 so we check every index.',
          isCorrect: false,
          feedback:
            'Starting at 0 would check j = i (reusing the same element!) and re-check pairs we already tested earlier.',
        },
        {
          id: 'start-i',
          label: 'Start j at i to include the anchor element.',
          isCorrect: false,
          feedback:
            'If j starts at i, the first check pairs nums[i] with itself, violating the distinct-index rule.',
        },
        {
          id: 'start-i-plus-1',
          label: 'Start j at i + 1 and scan to the end of the array.',
          isCorrect: true,
          feedback:
            'Spot on! Starting j at i + 1 guarantees i != j and checks each unordered pair exactly once. Step through the Brute Force trace on the canvas to watch it in action!',
        },
      ],
    },
  },
  {
    id: 'discover-optimization',
    stageNumber: 3,
    shortTitle: 'Optimize',
    title: 'Stage 3: Discover Complement Lookup',
    goal: 'Spot the repeated work in Brute Force and replace the inner scan with an O(1) Hash Map lookup.',
    conceptLearned: 'Complement Reformulation & Lookup-Before-Insert',
    narrative:
      'Brute Force works, but for every element i it re-scans the rest of the array — O(n²) work. Instead of asking "does any later number add up with nums[i]?", flip the question: if you are looking at nums[i], you already know the exact single number you need!',
    recommendedStrategy: 'hash-map',
    unlocksHashMap: true,
    question: {
      prompt:
        'When inspecting nums[i], why must the Hash Map strategy check if (target - nums[i]) is in the Seen Map BEFORE storing nums[i]?',
      options: [
        {
          id: 'avoid-self-match',
          label: 'So the current element never accidentally matches with itself when target = 2 * nums[i].',
          isCorrect: true,
          feedback:
            'Exactly! Checking first guarantees any match in the Seen Map comes from an strictly earlier index. Now explore the Hash Map trace on the canvas and try predicting the next step!',
        },
        {
          id: 'save-memory',
          label: 'To reduce space complexity from O(n) to O(1).',
          isCorrect: false,
          feedback:
            'The Hash Map still uses O(n) space in the worst case. The order of lookup vs. insert is about correctness (distinct indices), not memory.',
        },
        {
          id: 'order-does-not-matter',
          label: 'The order does not matter — inserting first gives the same result.',
          isCorrect: false,
          feedback:
            'Try nums = [3, 2, 4], target = 6 in your head: if you inserted 3 → 0 before looking up 6 - 3 = 3, you would falsely match index 0 with itself!',
        },
      ],
    },
  },
  {
    id: 'build-solution',
    stageNumber: 4,
    shortTitle: 'Build Code',
    title: 'Stage 4: Build the Solution',
    goal: 'Translate your visual reasoning into structured pseudocode one idea at a time — only revealing what you need.',
    conceptLearned: 'Translating Visual Reasoning to Pseudocode',
    narrative:
      'Now that you have traced both strategies visually, turn the Hash Map reasoning into step-by-step pseudocode. Reveal each block only after thinking through what comes next, then implement it in your preferred language.',
    recommendedStrategy: 'hash-map',
    unlocksHashMap: true,
    question: {
      prompt:
        'Before revealing the pseudocode: what should each entry in the Seen Map store as its key and value?',
      options: [
        {
          id: 'key-index-val-number',
          label: 'Key = index, Value = number',
          isCorrect: false,
          feedback:
            'Think about what we search for: we know the needed complement VALUE and want to retrieve its INDEX in O(1) time.',
        },
        {
          id: 'key-number-val-index',
          label: 'Key = number (value), Value = index',
          isCorrect: true,
          feedback:
            'Correct! Keying by the number lets us ask "have we seen complement?" in O(1) time and immediately get back its stored index.',
        },
        {
          id: 'key-sum-val-bool',
          label: 'Key = pair sum, Value = true/false',
          isCorrect: false,
          feedback:
            'Storing sums would require enumerating all pairs again. Storing each seen number → its index lets us solve Two Sum in one pass.',
        },
      ],
    },
  },
];

export const TWO_SUM_PSEUDOCODE_BLOCKS: PseudocodeBlock[] = [
  {
    id: 'pseudo-1',
    stepNumber: 1,
    title: '1. Initialize memory',
    reason: 'Create an empty map to remember every visited value and its index.',
    lines: ['create empty map seen  // maps value -> index'],
  },
  {
    id: 'pseudo-2',
    stepNumber: 2,
    title: '2. Loop and compute complement',
    reason: 'Walk through the array once and calculate the exact missing partner.',
    lines: [
      'for i from 0 to length(nums) - 1:',
      '    complement = target - nums[i]',
    ],
  },
  {
    id: 'pseudo-3',
    stepNumber: 3,
    title: '3. Lookup BEFORE inserting',
    reason: 'Guarantees distinct indices by checking only previously visited elements.',
    lines: [
      '    if complement is in seen:',
      '        return [seen[complement], i]',
    ],
  },
  {
    id: 'pseudo-4',
    stepNumber: 4,
    title: '4. Store current value & handle not-found',
    reason: 'Record the current value for future elements, or return not-found after the loop.',
    lines: [
      '    seen[nums[i]] = i',
      'return not found',
    ],
  },
];
