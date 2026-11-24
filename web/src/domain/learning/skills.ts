import type { SkillDefinition, SkillId } from './types';

/**
 * Stable Skill Registry with genuine conceptual prerequisite dependencies.
 * Note: Dependencies reflect real learning prerequisites, NOT an artificial linear chain
 * (e.g., Stack / LIFO is an independent foundation alongside Array Indexing).
 */
export const SKILL_REGISTRY: readonly SkillDefinition[] = [
  {
    id: 'array-indexing',
    name: 'Array Indexing',
    category: 'Foundations',
    description:
      'Reason accurately about 0-based indices, element values vs. positions, and distinct-index constraints.',
    prerequisites: [],
    relatedProblemIds: ['two-sum', 'split-array-largest-sum'],
    recommendedStudioPath: '/studio/two-sum',
  },
  {
    id: 'stack-lifo',
    name: 'Stack / LIFO',
    category: 'Data Structures',
    description:
      'Model nested obligations with Last-In-First-Out push/top/pop operations and empty-stack boundary checks.',
    prerequisites: [],
    relatedProblemIds: ['valid-parentheses'],
    recommendedStudioPath: '/studio/valid-parentheses',
  },
  {
    id: 'brute-force',
    name: 'Brute Force',
    category: 'Strategy Design',
    description:
      'Construct a systematic baseline search (such as j > i pair enumeration) before optimizing.',
    prerequisites: ['array-indexing'],
    relatedProblemIds: ['two-sum'],
    recommendedStudioPath: '/studio/two-sum',
  },
  {
    id: 'time-space-complexity',
    name: 'Time and Space Complexity',
    category: 'Analysis',
    description:
      'Compare naive vs. optimized runtime and auxiliary memory tradeoffs accurately.',
    prerequisites: ['brute-force'],
    relatedProblemIds: [
      'two-sum',
      'valid-parentheses',
      'split-array-largest-sum',
    ],
    recommendedStudioPath: '/studio/two-sum',
  },
  {
    id: 'hash-map-lookup',
    name: 'Hash Map Lookup',
    category: 'Data Structures',
    description:
      'Reformulate repeated scans into O(1) complement lookups while preserving lookup-before-insert invariants.',
    prerequisites: ['array-indexing', 'brute-force'],
    relatedProblemIds: ['two-sum'],
    recommendedStudioPath: '/studio/two-sum',
  },
  {
    id: 'greedy-feasibility',
    name: 'Greedy Feasibility',
    category: 'Optimization',
    description:
      'Verify a candidate cap in O(n) via greedy contiguous packing and understand why nonnegativity is required.',
    prerequisites: ['array-indexing'],
    relatedProblemIds: ['split-array-largest-sum'],
    recommendedStudioPath: '/studio/split-array-largest-sum',
  },
  {
    id: 'binary-search-answer',
    name: 'Binary Search on Answer',
    category: 'Search & Monotonicity',
    description:
      'Bound a monotonic answer space [low, high], pick mid, and safely narrow bounds until convergence.',
    prerequisites: ['time-space-complexity'],
    relatedProblemIds: ['split-array-largest-sum'],
    recommendedStudioPath: '/studio/split-array-largest-sum',
  },
  {
    id: 'algorithm-composition',
    name: 'Algorithm Composition',
    category: 'Problem Decomposition',
    description:
      'Coordinate a driver technique (Binary Search) with a nested feasibility subroutine (Greedy).',
    prerequisites: ['binary-search-answer', 'greedy-feasibility'],
    relatedProblemIds: ['split-array-largest-sum'],
    recommendedStudioPath: '/studio/split-array-largest-sum',
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
 * Deterministic mapping from verified next-step trace predictions to core skills.
 * Uses `nextStepAction` (the actual upcoming transition the learner is asked to predict)
 * and falls back gracefully when loading older records that only stored `currentStepAction`.
 */
export function getSkillsForPrediction(
  problemId: string,
  strategyId?: string,
  nextStepAction?: string,
  currentStepAction?: string,
): SkillId[] {
  const predictedAction = nextStepAction ?? currentStepAction;

  if (problemId === 'two-sum') {
    if (strategyId === 'hash-map') {
      if (predictedAction === 'found' || currentStepAction === 'lookup-hit') {
        return ['hash-map-lookup', 'array-indexing'];
      }
      return ['hash-map-lookup'];
    }
    return ['brute-force', 'array-indexing'];
  }

  if (problemId === 'valid-parentheses') {
    return ['stack-lifo'];
  }

  if (problemId === 'split-array-largest-sum') {
    // Next-step prediction semantics (matches splitArrayModule.ts):
    // - next = bs-select-mid -> choosing Binary Search midpoint
    // - next = greedy-start -> delegating mid to nested Greedy subroutine (Composition + Greedy)
    // - next = greedy-add-to-group | greedy-new-group | greedy-result -> Greedy packing & feasibility check
    // - next = bs-update-bounds -> updating Binary Search bounds from Greedy verdict (BS + Composition)
    // - next = bs-converged -> Binary Search convergence
    if (nextStepAction) {
      switch (nextStepAction) {
        case 'bs-select-mid':
        case 'bs-converged':
          return ['binary-search-answer'];
        case 'greedy-start':
          return ['greedy-feasibility', 'algorithm-composition'];
        case 'greedy-add-to-group':
        case 'greedy-new-group':
        case 'greedy-result':
          return ['greedy-feasibility'];
        case 'bs-update-bounds':
          return ['binary-search-answer', 'algorithm-composition'];
        default:
          return ['binary-search-answer', 'algorithm-composition'];
      }
    }

    // Legacy fallback when only currentStepAction was recorded
    switch (currentStepAction) {
      case 'bs-init-bounds':
      case 'bs-update-bounds':
        return ['binary-search-answer'];
      case 'bs-select-mid':
        return ['greedy-feasibility', 'algorithm-composition'];
      case 'greedy-start':
      case 'greedy-add-to-group':
      case 'greedy-new-group':
        return ['greedy-feasibility'];
      case 'greedy-result':
        return ['binary-search-answer', 'algorithm-composition'];
      default:
        return [
          'binary-search-answer',
          'greedy-feasibility',
          'algorithm-composition',
        ];
    }
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
