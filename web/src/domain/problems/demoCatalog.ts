export interface SampleProblemCard {
  id: string;
  title: string;
  pattern: string;
  difficulty: 'Beginner' | 'Intermediate';
  status: 'live-demo' | 'coming-soon';
  summary: string;
  strategiesCount: number;
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
  },
  {
    id: 'valid-parentheses',
    title: 'Valid Parentheses',
    pattern: 'Stack',
    difficulty: 'Beginner',
    status: 'coming-soon',
    summary:
      'Visualize how a Last-In-First-Out stack tracks opening brackets and catches mismatched pairs.',
    strategiesCount: 1,
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
];

export interface RoadmapMilestone {
  id: string;
  stage: number;
  title: string;
  description: string;
  prerequisites: string[];
  sampleProblem: string;
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
    status: 'available-demo',
  },
  {
    id: 'two-pointers',
    stage: 2,
    title: 'Two Pointers',
    description:
      'Coordinate two moving indices on sorted or structured arrays to avoid nested loops without extra memory.',
    prerequisites: ['Arrays & Hash Lookups'],
    sampleProblem: 'Pair Sum in Sorted Array',
    status: 'planned',
  },
  {
    id: 'sliding-window',
    stage: 3,
    title: 'Sliding Window',
    description:
      'Expand and shrink a contiguous range while maintaining a running invariant.',
    prerequisites: ['Two Pointers'],
    sampleProblem: 'Longest Subarray Under Budget',
    status: 'planned',
  },
  {
    id: 'stacks-queues',
    stage: 4,
    title: 'Stacks & Queues',
    description:
      'Model nested structure and level-by-level processing using LIFO and FIFO containers.',
    prerequisites: ['Arrays & Hash Lookups'],
    sampleProblem: 'Valid Parentheses',
    status: 'planned',
  },
  {
    id: 'binary-search',
    stage: 5,
    title: 'Binary Search',
    description:
      'Eliminate half the remaining search space whenever a monotonic condition holds.',
    prerequisites: ['Two Pointers'],
    sampleProblem: 'First Bad Version',
    status: 'planned',
  },
  {
    id: 'trees-graphs',
    stage: 6,
    title: 'Trees, Graphs & Composite Strategies',
    description:
      'Combine BFS, DFS, and greedy/backtracking reasoning on connected structures.',
    prerequisites: ['Stacks & Queues', 'Binary Search'],
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
    evidenceNote: 'Sample metric — real mastery requires prediction & recall evidence.',
  },
  {
    skill: 'Hash Map Space-Time Tradeoff',
    levelLabel: 'Introduced (Demo)',
    progressPercent: 40,
    evidenceNote: 'Sample metric — viewing a visualization alone does not count as mastery.',
  },
  {
    skill: 'Distinct-Index Loop Bounds',
    levelLabel: 'Practicing (Demo)',
    progressPercent: 75,
    evidenceNote: 'Sample metric — persistent tracking arrives in a later phase.',
  },
];

export const DEMO_RECENT_SESSIONS = [
  {
    id: 'session-1',
    problem: 'Two Sum',
    strategy: 'Hash Map Complement Lookup',
    outcome: 'Preview explored (Demo)',
    dateLabel: 'Sample entry',
  },
  {
    id: 'session-2',
    problem: 'Two Sum',
    strategy: 'Brute Force Pair Check',
    outcome: 'Compared tradeoffs (Demo)',
    dateLabel: 'Sample entry',
  },
];
