export interface SampleProblemCard {
  id: string;
  title: string;
  pattern: string;
  difficulty: 'Beginner' | 'Intermediate';
  status: 'live-demo' | 'coming-soon';
  summary: string;
  strategiesCount: number;
  studioPath?: string;
}

export const SAMPLE_PROBLEMS: SampleProblemCard[] = [
  {
    id: 'two-sum',
    title: 'Two Sum',
    pattern: 'Arrays & Hash Map',
    difficulty: 'Beginner',
    status: 'live-demo',
    summary:
      'Compare Brute Force pair scanning against O(n) Hash Map complement lookups with step-by-step visuals.',
    strategiesCount: 2,
    studioPath: '/studio/two-sum',
  },
  {
    id: 'valid-parentheses',
    title: 'Valid Parentheses',
    pattern: 'Stack (LIFO)',
    difficulty: 'Beginner',
    status: 'live-demo',
    summary:
      'Visualize how a Last-In-First-Out stack tracks opening brackets and catches mismatches or unclosed leftovers.',
    strategiesCount: 1,
    studioPath: '/studio/valid-parentheses',
  },
  {
    id: 'split-array-largest-sum',
    title: 'Split Array Largest Sum',
    pattern: 'Binary Search + Greedy',
    difficulty: 'Intermediate',
    status: 'live-demo',
    summary:
      'Learn algorithm composition: Binary Search on Answer proposes candidate caps while an O(n) Greedy packer checks feasibility.',
    strategiesCount: 1,
    studioPath: '/studio/split-array-largest-sum',
  },
  {
    id: 'binary-search',
    title: 'Binary Search',
    pattern: 'Divide & Conquer',
    difficulty: 'Beginner',
    status: 'coming-soon',
    summary:
      'Watch left, mid, and right boundaries shrink a sorted search space in half at each step.',
    strategiesCount: 2,
  },
  {
    id: 'sliding-window-budget',
    title: 'Longest Subarray Under Budget',
    pattern: 'Sliding Window',
    difficulty: 'Intermediate',
    status: 'coming-soon',
    summary:
      'Expand and shrink a contiguous window while maintaining a running sum invariant.',
    strategiesCount: 2,
  },
];

export interface RoadmapMilestone {
  id: string;
  stage: number;
  title: string;
  description: string;
  prerequisites: string[];
  sampleProblem: string;
  studioPath?: string;
  status: 'available-demo' | 'planned';
}

export const DEMO_ROADMAP_MILESTONES: RoadmapMilestone[] = [
  {
    id: 'arrays-hashing',
    stage: 1,
    title: 'Arrays & Hash Lookups',
    description:
      'Turn repeated scans into instant memory lookups by reformulating what you need to find.',
    prerequisites: ['Basic loops & indexing'],
    sampleProblem: 'Two Sum',
    studioPath: '/studio/two-sum',
    status: 'available-demo',
  },
  {
    id: 'stacks-queues',
    stage: 2,
    title: 'Stacks & Queues',
    description:
      'Model nested structure and level-by-level processing using LIFO and FIFO containers.',
    prerequisites: ['Arrays & Hash Lookups'],
    sampleProblem: 'Valid Parentheses',
    studioPath: '/studio/valid-parentheses',
    status: 'available-demo',
  },
  {
    id: 'two-pointers',
    stage: 3,
    title: 'Two Pointers',
    description:
      'Coordinate two moving indices on sorted or structured arrays to avoid nested loops without extra memory.',
    prerequisites: ['Arrays & Hash Lookups'],
    sampleProblem: 'Pair Sum in Sorted Array',
    status: 'planned',
  },
  {
    id: 'sliding-window',
    stage: 4,
    title: 'Sliding Window',
    description:
      'Expand and shrink a contiguous range while maintaining a running invariant.',
    prerequisites: ['Two Pointers'],
    sampleProblem: 'Longest Subarray Under Budget',
    status: 'planned',
  },
  {
    id: 'binary-search-composition',
    stage: 5,
    title: 'Binary Search on Answer + Greedy',
    description:
      'Compose Binary Search over a monotonic answer range with an O(n) Greedy feasibility subroutine.',
    prerequisites: ['Arrays & Hash Lookups'],
    sampleProblem: 'Split Array Largest Sum',
    studioPath: '/studio/split-array-largest-sum',
    status: 'available-demo',
  },
  {
    id: 'trees-graphs',
    stage: 6,
    title: 'Trees, Graphs & Traversals',
    description:
      'Combine BFS, DFS, and shortest-path reasoning on connected structures.',
    prerequisites: ['Stacks & Queues', 'Binary Search on Answer + Greedy'],
    sampleProblem: 'Shortest Path in Grid',
    status: 'planned',
  },
];

export interface DemoSkillMastery {
  skill: string;
  levelLabel: string;
  progressPercent: number;
  evidenceNote: string;
}

export const DEMO_PROGRESS_SKILLS: DemoSkillMastery[] = [
  {
    skill: 'Complement Reformulation',
    levelLabel: 'Exploring (Demo)',
    progressPercent: 60,
    evidenceNote: 'Sample metric — real mastery requires persistent multi-session recall evidence.',
  },
  {
    skill: 'Stack LIFO Bracket Matching',
    levelLabel: 'Exploring (Demo)',
    progressPercent: 50,
    evidenceNote: 'Sample metric — viewing a visualization alone does not count as mastery.',
  },
  {
    skill: 'Binary Search + Greedy Composition',
    levelLabel: 'Introduced (Demo)',
    progressPercent: 45,
    evidenceNote: 'Sample metric — persistent tracking arrives in a later phase.',
  },
];

export const DEMO_RECENT_SESSIONS = [
  {
    id: 'session-0',
    problem: 'Split Array Largest Sum',
    strategy: 'Binary Search on Answer + Greedy Check',
    outcome: 'Composition explored (Demo)',
    dateLabel: 'Sample entry',
  },
  {
    id: 'session-1',
    problem: 'Valid Parentheses',
    strategy: 'Stack Bracket Matching',
    outcome: 'Preview explored (Demo)',
    dateLabel: 'Sample entry',
  },
  {
    id: 'session-2',
    problem: 'Two Sum',
    strategy: 'Hash Map Complement Lookup',
    outcome: 'Compared tradeoffs (Demo)',
    dateLabel: 'Sample entry',
  },
];
