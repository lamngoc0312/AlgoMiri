import { getAllProblemModules } from './registry';

export type ProblemAvailability = 'verified-studio' | 'ai-guided';
export type LibraryDifficulty = 'Beginner' | 'Intermediate';

export interface LibraryProblemItem {
  id: string;
  title: string;
  topic: string;
  difficulty: LibraryDifficulty;
  availability: ProblemAvailability;
  summary: string;
  /** Verified studio route when availability === 'verified-studio'. */
  studioPath?: string;
  strategiesCount?: number;
  stagesCount?: number;
  /** Original AlgoMiri educational statement used to prefill the AI Analyzer when availability === 'ai-guided'. */
  originalPrompt?: string;
}

export interface ExternalReferenceLink {
  id: string;
  title: string;
  provider: string;
  referenceId: string;
  topic: string;
  url: string;
}

/**
 * 100% original AlgoMiri educational practice statements for conceptual AI-guided exploration.
 * Never scrapes or copies proprietary problem catalogs or official solutions.
 */
export const ORIGINAL_AI_GUIDED_PROBLEMS: readonly LibraryProblemItem[] = [
  {
    id: 'sorted-pair-sum',
    title: 'Pair Sum in a Sorted Array',
    topic: 'Two Pointers',
    difficulty: 'Beginner',
    availability: 'ai-guided',
    summary:
      'Use two opposite-end pointers on an already-sorted integer array to find a pair matching a target sum in O(1) extra space.',
    originalPrompt:
      'Given an array of integers sorted in non-decreasing order and a target integer, determine whether two distinct positions have values that add up to target using O(1) extra memory.',
  },
  {
    id: 'longest-subarray-under-budget',
    title: 'Longest Subarray Under Budget',
    topic: 'Sliding Window',
    difficulty: 'Intermediate',
    availability: 'ai-guided',
    summary:
      'Expand and shrink a contiguous window over nonnegative daily costs to find the longest streak whose total cost stays within a budget.',
    originalPrompt:
      'Given an array of nonnegative integers representing daily expenses and an integer budget B, return the length of the longest contiguous subarray whose sum is at most B.',
  },
  {
    id: 'minimum-coin-change',
    title: 'Minimum Coin Change',
    topic: 'Dynamic Programming',
    difficulty: 'Intermediate',
    availability: 'ai-guided',
    summary:
      'Discover why greedy largest-coin picking fails on arbitrary denominations and how bottom-up subproblems find the fewest coins.',
    originalPrompt:
      'Given a list of positive coin denominations (unlimited supply of each) and a nonnegative target amount, return the minimum number of coins required to make up the exact amount, or -1 if impossible.',
  },
  {
    id: 'first-true-boundary',
    title: 'First True in a Monotonic Boolean Array',
    topic: 'Binary Search',
    difficulty: 'Beginner',
    availability: 'ai-guided',
    summary:
      'Find the first index where a sorted false-then-true condition flips from false to true without scanning linearly.',
    originalPrompt:
      'Given a boolean array where all false values appear before all true values, return the 0-based index of the first true value (or -1 if none exists) in O(log n) time.',
  },
  {
    id: 'shortest-grid-path',
    title: 'Shortest Path in an Unweighted Grid',
    topic: 'Graphs & BFS',
    difficulty: 'Intermediate',
    availability: 'ai-guided',
    summary:
      'Explore why Breadth-First Search finds the fewest 4-directional steps between start and goal cells while avoiding blocked walls.',
    originalPrompt:
      'Given a 2D grid of open cells (0) and blocked walls (1), find the minimum number of 4-directional steps from the top-left cell to the bottom-right cell, or -1 if no path exists.',
  },
  {
    id: 'top-k-frequent-values',
    title: 'Top-K Most Frequent Values',
    topic: 'Hashing & Frequency',
    difficulty: 'Intermediate',
    availability: 'ai-guided',
    summary:
      'Count element frequencies with a Hash Map and compare sorting, min-heap, and bucket-sort tradeoffs for selecting the top k.',
    originalPrompt:
      'Given an integer array nums and an integer k, return the k values that appear most frequently in nums. Compare O(n log n) sorting against O(n log k) heap and O(n) bucket approaches.',
  },
] as const;

/**
 * Compact external reference metadata (provider IDs & links only — zero copied statements or solutions).
 */
export const EXTERNAL_REFERENCE_LINKS: readonly ExternalReferenceLink[] = [
  {
    id: 'ref-two-sum',
    title: 'Two Sum',
    provider: 'LeetCode Reference',
    referenceId: '#1',
    topic: 'Arrays & Hash Map',
    url: 'https://leetcode.com/problems/two-sum/',
  },
  {
    id: 'ref-valid-parentheses',
    title: 'Valid Parentheses',
    provider: 'LeetCode Reference',
    referenceId: '#20',
    topic: 'Stack (LIFO)',
    url: 'https://leetcode.com/problems/valid-parentheses/',
  },
  {
    id: 'ref-split-array',
    title: 'Split Array Largest Sum',
    provider: 'LeetCode Reference',
    referenceId: '#410',
    topic: 'Binary Search + Greedy',
    url: 'https://leetcode.com/problems/split-array-largest-sum/',
  },
  {
    id: 'ref-coin-change',
    title: 'Coin Change',
    provider: 'LeetCode Reference',
    referenceId: '#322',
    topic: 'Dynamic Programming',
    url: 'https://leetcode.com/problems/coin-change/',
  },
] as const;

const VERIFIED_TOPIC_MAP: Record<string, string> = {
  'two-sum': 'Arrays & Hash Map',
  'valid-parentheses': 'Stack (LIFO)',
  'split-array-largest-sum': 'Binary Search + Greedy',
};

const VERIFIED_SUMMARY_MAP: Record<string, string> = {
  'two-sum':
    'Compare Brute Force pair scanning against O(n) Hash Map complement lookups with step-by-step visuals.',
  'valid-parentheses':
    'Visualize how a Last-In-First-Out stack tracks opening brackets and catches mismatches or unclosed leftovers.',
  'split-array-largest-sum':
    'Learn algorithm composition: Binary Search on Answer proposes candidate caps while an O(n) Greedy packer checks feasibility.',
};

export function getVerifiedLibraryItems(): LibraryProblemItem[] {
  return getAllProblemModules().map((mod) => ({
    id: mod.id,
    title: mod.spec.title,
    topic: VERIFIED_TOPIC_MAP[mod.id] ?? mod.spec.supportedStrategies[0]?.techniques[0] ?? 'Algorithms',
    difficulty: mod.spec.difficulty === 'Intermediate' ? 'Intermediate' : 'Beginner',
    availability: 'verified-studio',
    summary: VERIFIED_SUMMARY_MAP[mod.id] ?? mod.spec.statement,
    studioPath: `/studio/${mod.id}`,
    strategiesCount: mod.spec.supportedStrategies.length,
    stagesCount: mod.lesson.stages.length,
  }));
}

export function getAllLibraryItems(): LibraryProblemItem[] {
  return [...getVerifiedLibraryItems(), ...ORIGINAL_AI_GUIDED_PROBLEMS];
}

export function getAiGuidedProblemById(id: string): LibraryProblemItem | undefined {
  return ORIGINAL_AI_GUIDED_PROBLEMS.find((p) => p.id === id);
}
