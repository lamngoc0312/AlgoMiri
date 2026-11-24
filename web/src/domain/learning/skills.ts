import type { SkillDefinition, SkillId } from './types';

export const SKILL_REGISTRY: readonly SkillDefinition[] = [
  {
    id: 'array-indexing',
    name: 'Array Indexing',
    category: 'Foundations',
    description:
      'Reason accurately about 0-based indices, element values vs. positions, and distinct-index constraints.',
    relatedProblemIds: ['two-sum', 'split-array-largest-sum'],
    recommendedStudioPath: '/studio/two-sum',
  },
  {
    id: 'brute-force',
    name: 'Brute Force',
    category: 'Strategy Design',
    description:
      'Construct a systematic baseline search (such as j > i pair enumeration) before optimizing.',
    relatedProblemIds: ['two-sum'],
    recommendedStudioPath: '/studio/two-sum',
  },
  {
    id: 'hash-map-lookup',
    name: 'Hash Map Lookup',
    category: 'Data Structures',
    description:
      'Reformulate repeated scans into O(1) complement lookups while preserving lookup-before-insert invariants.',
    relatedProblemIds: ['two-sum'],
    recommendedStudioPath: '/studio/two-sum',
  },
  {
    id: 'stack-lifo',
    name: 'Stack / LIFO',
    category: 'Data Structures',
    description:
      'Model nested obligations with Last-In-First-Out push/top/pop operations and empty-stack boundary checks.',
    relatedProblemIds: ['valid-parentheses'],
    recommendedStudioPath: '/studio/valid-parentheses',
  },
  {
    id: 'binary-search-answer',
    name: 'Binary Search on Answer',
    category: 'Search & Monotonicity',
    description:
      'Bound a monotonic answer space [low, high], pick mid, and safely narrow bounds until convergence.',
    relatedProblemIds: ['split-array-largest-sum'],
    recommendedStudioPath: '/studio/split-array-largest-sum',
  },
  {
    id: 'greedy-feasibility',
    name: 'Greedy Feasibility',
    category: 'Optimization',
    description:
      'Verify a candidate cap in O(n) via greedy contiguous packing and understand why nonnegativity is required.',
    relatedProblemIds: ['split-array-largest-sum'],
    recommendedStudioPath: '/studio/split-array-largest-sum',
  },
  {
    id: 'algorithm-composition',
    name: 'Algorithm Composition',
    category: 'Problem Decomposition',
    description:
      'Coordinate a driver technique (Binary Search) with a nested feasibility subroutine (Greedy).',
    relatedProblemIds: ['split-array-largest-sum'],
    recommendedStudioPath: '/studio/split-array-largest-sum',
  },
  {
    id: 'time-space-complexity',
    name: 'Time and Space Complexity',
    category: 'Analysis',
    description:
      'Compare naive vs. optimized runtime and auxiliary memory tradeoffs accurately.',
    relatedProblemIds: [
      'two-sum',
      'valid-parentheses',
      'split-array-largest-sum',
    ],
    recommendedStudioPath: '/studio/two-sum',
  },
] as const;

const SKILL_MAP = new Map<SkillId, SkillDefinition>(
  SKILL_REGISTRY.map((skill) => [skill.id, skill]),
);

export function getSkillDefinition(skillId: SkillId): SkillDefinition {
  const found = SKILL_MAP.get(skillId);
  if (!found) {
    throw new Error(`Unknown skill id: ${skillId}`);
  }
  return found;
}

export function isValidSkillId(value: unknown): value is SkillId {
  return typeof value === 'string' && SKILL_MAP.has(value as SkillId);
}

/**
 * Deterministic mapping from verified Guided Lesson stages to core skills.
 */
const STAGE_SKILL_MAP: Record<string, SkillId[]> = {
  // Two Sum stages
  'two-sum:understand': ['array-indexing'],
  'two-sum:discover-brute-force': ['array-indexing', 'brute-force'],
  'two-sum:discover-optimization': ['hash-map-lookup', 'time-space-complexity'],
  'two-sum:build-solution': ['hash-map-lookup', 'array-indexing'],

  // Valid Parentheses stages
  'valid-parentheses:vp-understand': ['stack-lifo'],
  'valid-parentheses:vp-why-stack': ['stack-lifo'],
  'valid-parentheses:vp-trace-ops': ['stack-lifo', 'time-space-complexity'],
  'valid-parentheses:vp-build-pseudo': ['stack-lifo'],

  // Split Array Largest Sum stages
  'split-array-largest-sum:sa-stage-1-understand': ['array-indexing'],
  'split-array-largest-sum:sa-stage-2-feasibility': [
    'greedy-feasibility',
    'algorithm-composition',
  ],
  'split-array-largest-sum:sa-stage-3-greedy': [
    'greedy-feasibility',
    'time-space-complexity',
  ],
  'split-array-largest-sum:sa-stage-4-bs-answer': [
    'binary-search-answer',
    'algorithm-composition',
  ],
  'split-array-largest-sum:sa-stage-5-compose': [
    'binary-search-answer',
    'algorithm-composition',
  ],
};

export function getSkillsForStage(
  problemId: string,
  stageId: string,
): SkillId[] {
  return STAGE_SKILL_MAP[`${problemId}:${stageId}`] ?? [];
}

/**
 * Deterministic mapping from verified trace prediction steps to core skills.
 */
export function getSkillsForPrediction(
  problemId: string,
  strategyId?: string,
  stepAction?: string,
): SkillId[] {
  if (problemId === 'two-sum') {
    if (strategyId === 'hash-map') {
      return stepAction === 'lookup-hit'
        ? ['hash-map-lookup', 'array-indexing']
        : ['hash-map-lookup'];
    }
    return ['brute-force', 'array-indexing'];
  }

  if (problemId === 'valid-parentheses') {
    return ['stack-lifo'];
  }

  if (problemId === 'split-array-largest-sum') {
    if (
      stepAction === 'bs-init-bounds' ||
      stepAction === 'bs-select-mid' ||
      stepAction === 'bs-update-bounds' ||
      stepAction === 'bs-converged'
    ) {
      return ['binary-search-answer', 'algorithm-composition'];
    }
    if (
      stepAction === 'greedy-start' ||
      stepAction === 'greedy-add-to-group' ||
      stepAction === 'greedy-new-group' ||
      stepAction === 'greedy-result'
    ) {
      return ['greedy-feasibility', 'algorithm-composition'];
    }
    return ['binary-search-answer', 'greedy-feasibility', 'algorithm-composition'];
  }

  return [];
}

/**
 * Skills introduced when viewing/exploring a strategy (viewed-only evidence, NEVER mastery).
 */
export function getSkillsForStrategy(
  problemId: string,
  strategyId: string,
): SkillId[] {
  if (problemId === 'two-sum') {
    if (strategyId === 'brute-force') {
      return ['array-indexing', 'brute-force', 'time-space-complexity'];
    }
    return ['hash-map-lookup', 'time-space-complexity'];
  }
  if (problemId === 'valid-parentheses') {
    return ['stack-lifo', 'time-space-complexity'];
  }
  if (problemId === 'split-array-largest-sum') {
    return [
      'binary-search-answer',
      'greedy-feasibility',
      'algorithm-composition',
      'time-space-complexity',
    ];
  }
  return [];
}
