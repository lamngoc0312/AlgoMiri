import type {
  BinarySearchGreedyVisualState,
  GenericExecutionStep,
  PredictionPrompt,
  ProblemModule,
} from '../core/types';
import { generateSplitArrayTrace } from '../traces/splitArrayLargestSum';
import type { SplitArrayInput } from '../traces/splitArrayValidation';

export const DEFAULT_SPLIT_ARRAY_INPUT: SplitArrayInput = {
  nums: [7, 2, 5, 10, 8],
  k: 2,
};

export function generateSplitArrayPrediction(
  steps: GenericExecutionStep<BinarySearchGreedyVisualState>[],
  currentStepIndex: number,
  _strategyId: string,
  traceContextId = 'default',
): PredictionPrompt | null {
  const current = steps[currentStepIndex];
  const next = steps[currentStepIndex + 1];

  if (!current || !next) {
    return null;
  }

  const questionId = `${traceContextId}:step-${current.stepIndex}:${current.action}`;
  const { nums, k, low, high } = current.visualState;

  if (next.action === 'bs-select-mid') {
    const expectedMid = next.visualState.mid ?? low + Math.floor((high - low) / 2);
    return {
      id: questionId,
      stepIndex: current.stepIndex,
      question: `Current search bounds are [${low}, ${high}]. Which candidate largest sum mid will Binary Search test next?`,
      options: [
        {
          id: 'correct-mid',
          label: `mid = ${expectedMid}`,
          isCorrect: true,
          feedback: `Correct! mid = ${low} + floor((${high} - ${low}) / 2) = ${expectedMid}.`,
        },
        {
          id: 'low-bound',
          label: `mid = ${low} (just test low directly)`,
          isCorrect: expectedMid === low,
          feedback:
            expectedMid === low
              ? `Correct! Floor division lands on ${low} for [${low}, ${high}].`
              : `Testing low linearly only eliminates 1 value on failure; testing midpoint ${expectedMid} cuts the search range in half!`,
        },
        {
          id: 'high-bound',
          label: `mid = ${high} (test high)`,
          isCorrect: false,
          feedback: `When low < high, floor midpoint low + floor((high - low) / 2) is strictly less than ${high} (here ${expectedMid}), ensuring the loop always makes progress.`,
        },
      ].filter((opt, idx, arr) =>
        // Avoid duplicate labels when expectedMid === low (e.g., [10, 11] -> mid = 10)
        idx === 0 || opt.label !== arr[0].label,
      ),
    };
  }

  if (next.action === 'greedy-start') {
    const mid = current.visualState.mid ?? 0;
    return {
      id: questionId,
      stepIndex: current.stepIndex,
      question: `Binary Search picked mid = ${mid}. What question will the nested Greedy subroutine answer?`,
      options: [
        {
          id: 'ask-greedy',
          label: `Can we pack nums into at most ${k} contiguous groups with each sum <= ${mid}?`,
          isCorrect: true,
          feedback: `Yes! Binary Search delegates feasibility checking for mid = ${mid} to the O(n) Greedy packer.`,
        },
        {
          id: 'sort-array',
          label: 'Sort nums first so equal numbers sit together',
          isCorrect: false,
          feedback:
            'Subarrays must remain CONTIGUOUS in the original order, so we can never sort or reorder nums!',
        },
      ],
    };
  }

  if (next.action === 'greedy-add-to-group' || next.action === 'greedy-new-group') {
    const nextIdx = next.visualState.scanIndex ?? 0;
    const val = nums[nextIdx];
    const mid = current.visualState.mid ?? 0;
    const prevSum = current.visualState.runningSum ?? 0;
    const willFit = next.action === 'greedy-add-to-group';

    if (nextIdx === 0) {
      return {
        id: questionId,
        stepIndex: current.stepIndex,
        question: `Greedy scan starts at index 0 (value ${val}) with limit mid = ${mid}. What happens first?`,
        options: [
          {
            id: 'start-g1',
            label: `Place ${val} into Group 1 (running sum = ${val})`,
            isCorrect: true,
            feedback: `Correct! Because mid = ${mid} >= max(nums), the first element ${val} always fits into Group 1.`,
          },
          {
            id: 'exceed-immediately',
            label: `Reject immediately because ${val} > ${mid}`,
            isCorrect: false,
            feedback: `Since low starts at max(nums), mid is always >= every single element, including ${val}.`,
          },
        ],
      };
    }

    return {
      id: questionId,
      stepIndex: current.stepIndex,
      question: `Current group sum is ${prevSum} and next element is nums[${nextIdx}] = ${val} (limit mid = ${mid}). Does ${val} fit in the current group?`,
      options: [
        {
          id: 'fits-current',
          label: `Yes — ${prevSum} + ${val} = ${prevSum + val} <= ${mid}, keep in current group`,
          isCorrect: willFit,
          feedback: willFit
            ? `Spot on! ${prevSum + val} <= ${mid}, so Greedy packs ${val} into the current group to save group cuts for later.`
            : `Check the sum: ${prevSum} + ${val} = ${prevSum + val}, which exceeds mid = ${mid}!`,
        },
        {
          id: 'cut-new-group',
          label: `No — ${prevSum} + ${val} = ${prevSum + val} > ${mid}, start a new group`,
          isCorrect: !willFit,
          feedback: !willFit
            ? `Correct! ${prevSum + val} > ${mid}, so we must cut before index ${nextIdx} and start Group ${next.visualState.groupsUsed} with ${val}.`
            : `Actually ${prevSum} + ${val} = ${prevSum + val} <= ${mid}, so Greedy does not need to open a new group yet.`,
        },
      ],
    };
  }

  if (next.action === 'greedy-result') {
    const groupsUsed = current.visualState.groupsUsed;
    const mid = current.visualState.mid ?? 0;
    const isFeasible = groupsUsed <= k;

    return {
      id: questionId,
      stepIndex: current.stepIndex,
      question: `Greedy finished scanning with ${groupsUsed} group(s), and we are allowed k = ${k} groups. Is mid = ${mid} feasible?`,
      options: [
        {
          id: 'res-feasible',
          label: `Feasible (true) — ${groupsUsed} <= ${k}`,
          isCorrect: isFeasible,
          feedback: isFeasible
            ? `Yes! Using ${groupsUsed} <= ${k} groups proves a valid ${k}-group split with largest sum <= ${mid} exists.`
            : `We used ${groupsUsed} groups, which is MORE than k = ${k}, so mid = ${mid} is too small.`,
        },
        {
          id: 'res-infeasible',
          label: `Infeasible (false) — ${groupsUsed} > ${k}`,
          isCorrect: !isFeasible,
          feedback: !isFeasible
            ? `Correct! Even greedy packing needed ${groupsUsed} > ${k} groups, so mid = ${mid} is impossible.`
            : `Look at the counts: ${groupsUsed} <= ${k}, so mid = ${mid} IS feasible!`,
        },
      ],
    };
  }

  if (next.action === 'bs-update-bounds') {
    const mid = current.visualState.mid ?? 0;
    const feasible = current.visualState.feasible === true;

    return {
      id: questionId,
      stepIndex: current.stepIndex,
      question: `Greedy reported mid = ${mid} is ${feasible ? 'FEASIBLE' : 'INFEASIBLE'} on [${low}, ${high}]. How should Binary Search update its bounds?`,
      options: [
        {
          id: 'set-high-mid',
          label: `Set high = ${mid} (search [${low}, ${mid}])`,
          isCorrect: feasible,
          feedback: feasible
            ? `Exactly! ${mid} works, so keep ${mid} as a candidate and check if an even smaller answer in [${low}, ${mid}] also works.`
            : `Because ${mid} failed, every limit <= ${mid} also fails — setting high = ${mid} would throw away all valid answers!`,
        },
        {
          id: 'set-low-mid-plus-1',
          label: `Set low = ${mid + 1} (search [${mid + 1}, ${high}])`,
          isCorrect: !feasible,
          feedback: !feasible
            ? `Correct! Since ${mid} is too small, the minimum feasible largest sum must be at least ${mid + 1}.`
            : `Careful! ${mid} might already BE the optimal answer, so raising low to ${mid + 1} could skip the true answer!`,
        },
      ],
    };
  }

  if (next.action === 'bs-converged') {
    return {
      id: questionId,
      stepIndex: current.stepIndex,
      question: `Bounds have met at low = high = ${low}. What is the minimized largest subarray sum?`,
      options: [
        {
          id: 'ans-low',
          label: `Return ${low}`,
          isCorrect: true,
          feedback: `Yes! When low === high === ${low}, ${low} is proven feasible and ${low - 1} (if > max) is proven infeasible.`,
        },
        {
          id: 'ans-plus-one',
          label: `Return ${low + 1}`,
          isCorrect: false,
          feedback: `Because high always holds a known feasible bound (or sum(nums)), low === high === ${low} is already guaranteed feasible!`,
        },
      ],
    };
  }

  return null;
}

export const splitArrayModule: ProblemModule<
  SplitArrayInput,
  BinarySearchGreedyVisualState
> = {
  id: 'split-array-largest-sum',
  visualKind: 'bs-greedy',
  spec: {
    id: 'split-array-largest-sum',
    provider: 'algomiri-original',
    title: 'Split Array Largest Sum',
    difficulty: 'Intermediate',
    statement:
      'Given an array of nonnegative integers nums and an integer k, split nums into exactly k nonempty contiguous subarrays so that the largest sum among those k subarrays is as small as possible. Return that minimized largest sum.',
    constraints: [
      '1 <= k <= nums.length (every subarray must be nonempty and contiguous).',
      'All values in nums are nonnegative safe integers (nums[i] >= 0).',
      'Why nonnegative matters: adding elements never shrinks a subarray sum, making feasibility monotonic.',
      'Why <= k suffices: any valid split into <= k groups can be split further into exact k nonempty groups without increasing the largest sum.',
    ],
    examples: [
      {
        input: 'nums = [7, 2, 5, 10, 8], k = 2',
        output: '18',
        explanation:
          'Split into [7, 2, 5] (sum 14) and [10, 8] (sum 18). Largest sum is 18 — no 2-way split does better.',
      },
      {
        input: 'nums = [1, 2, 3, 4, 5], k = 2',
        output: '9',
        explanation:
          'Split into [1, 2, 3] (sum 6) and [4, 5] (sum 9). Largest sum is 9.',
      },
    ],
    inputSchema: 'nums: number[] (>= 0), k: number (1 <= k <= nums.length)',
    outputSchema: 'number (minimized largest subarray sum)',
    supportedVisualization: true,
    supportedStrategies: [
      {
        id: 'bs-greedy-composition',
        problemId: 'split-array-largest-sum',
        name: 'Binary Search on Answer + Greedy Check',
        shortLabel: 'BS + Greedy',
        intuition:
          'Binary Search guesses a candidate largest sum mid in [max(nums), sum(nums)], and calls a fast O(n) Greedy packer to check if nums fits into <= k groups under limit mid.',
        tradeoffs:
          'Runs in O(n · log(sum - max)) time with O(1) auxiliary algorithm space (note: AlgoMiri uses extra UI memory only to store immutable visualization snapshots). Requires nums[i] >= 0.',
        timeComplexity: 'O(n log S)',
        spaceComplexity: 'O(1) aux',
        techniques: ['Binary Search on Answer', 'Greedy Partitioning'],
        learningGraphId: 'split-array-bs-greedy-graph',
      },
    ],
  },
  defaultStrategyId: 'bs-greedy-composition',
  guidedInitialStrategyId: 'bs-greedy-composition',
  defaultInput: DEFAULT_SPLIT_ARRAY_INPUT,
  presets: [
    {
      id: 'classic-18',
      label: '[7, 2, 5, 10, 8], k = 2',
      input: { nums: [7, 2, 5, 10, 8], k: 2 },
    },
    {
      id: 'rising-9',
      label: '[1, 2, 3, 4, 5], k = 2',
      input: { nums: [1, 2, 3, 4, 5], k: 2 },
    },
    {
      id: 'exact-k-4',
      label: '[1, 4, 4], k = 3',
      input: { nums: [1, 4, 4], k: 3 },
    },
    {
      id: 'zeros-0',
      label: '[0, 0, 0], k = 2',
      input: { nums: [0, 0, 0], k: 2 },
    },
    {
      id: 'single-1',
      label: '[1], k = 1',
      input: { nums: [1], k: 1 },
    },
  ],
  formatInputKey: (input) => `${input.nums.join(',')}:k=${input.k}`,
  generateTrace: (_strategyId, input) => generateSplitArrayTrace(input),
  solutionGraphs: {
    'bs-greedy-composition': {
      id: 'split-array-bs-greedy-graph',
      strategyId: 'bs-greedy-composition',
      title: 'Binary Search + Greedy Composition Map',
      summary:
        'Bound the answer range, let Binary Search propose candidate caps mid, delegate feasibility to the O(n) Greedy packer, and merge both to narrow bounds.',
      requiresDag: true,
      nodes: [
        {
          id: 'sa-search-space',
          title: 'Bound answer range [max, sum]',
          category: 'input-model',
          learningGoal:
            'Establish tight guaranteed bounds for the optimal largest subarray sum.',
          explanation:
            'No partition can have largest sum smaller than max(nums) (since the max element must sit in some group), nor larger than sum(nums) (1 group holding everything).',
          rationale:
            'Binary Search on Answer requires a finite interval guaranteed to contain the optimal answer.',
          skills: ['Answer-Space Bounding'],
          prerequisites: ['Array max & sum'],
          techniques: ['Problem Reformulation'],
          ioContract: {
            inputs: ['nums[] (nonnegative)', 'k'],
            outputs: ['low = max(nums), high = sum(nums)'],
          },
          mappedActions: ['bs-init-bounds'],
        },
        {
          id: 'sa-bs-driver',
          title: 'Binary Search Driver (pick mid)',
          category: 'technique',
          learningGoal:
            'Propose midpoint mid = low + floor((high - low) / 2) to halve the remaining candidate answers each round.',
          explanation:
            'Instead of testing every integer from max to sum one by one, Binary Search tests the middle candidate mid.',
          rationale:
            'Linearly testing every candidate takes O(n · S) time (slow when values are huge); Binary Search cuts it to O(n · log S). Note: Binary Search alone cannot tell if mid works — it needs a feasibility subroutine!',
          skills: ['Binary Search on Answer', 'Overflow-Safe Midpoint'],
          prerequisites: ['Monotonicity'],
          techniques: ['Binary Search on Answer'],
          ioContract: {
            inputs: ['[low, high]'],
            outputs: ['candidate cap mid'],
          },
          mappedActions: ['bs-select-mid'],
        },
        {
          id: 'sa-greedy-check',
          title: 'Greedy Feasibility Checker',
          category: 'technique',
          learningGoal:
            'Pack as many nonnegative elements as possible <= mid per group and check if groupsUsed <= k.',
          explanation:
            'Scan left to right: keep adding nums[i] to the current group while runningSum + nums[i] <= mid; otherwise start a new group.',
          rationale:
            'Because nums[i] >= 0, delaying each cut as late as possible leaves maximum room for remaining elements, guaranteeing the minimum group count. If groupsUsed <= k, splitting multi-element groups yields exact k nonempty groups without raising any sum!',
          skills: ['Greedy Packing', 'Nonnegative Monotonicity'],
          prerequisites: ['Contiguous Subarrays'],
          techniques: ['Greedy Partitioning'],
          ioContract: {
            inputs: ['nums[]', 'k', 'candidate cap mid'],
            outputs: ['feasible: boolean (groupsUsed <= k)'],
          },
          mappedActions: [
            'greedy-start',
            'greedy-add-to-group',
            'greedy-new-group',
            'greedy-result',
          ],
        },
        {
          id: 'sa-monotonic-update',
          title: 'Narrow bounds via monotonicity',
          category: 'decision',
          learningGoal:
            'If feasible, set high = mid (keep mid); if infeasible, set low = mid + 1 (discard <= mid).',
          explanation:
            'Combine the Binary Search interval with Greedy’s boolean verdict to discard half of the search range while keeping the optimal answer inside [low, high].',
          rationale:
            'Feasibility is monotonic: if cap mid fails, every cap < mid also fails; if cap mid succeeds, we keep mid and look lower.',
          skills: ['Monotonic Invariant', 'Boundary Maintenance'],
          prerequisites: ['Binary Search on Answer', 'Greedy Packing'],
          techniques: ['Algorithm Composition'],
          ioContract: {
            inputs: ['[low, high], mid', 'feasible: boolean'],
            outputs: ['updated [low, high]'],
          },
          mappedActions: ['greedy-result', 'bs-update-bounds'],
        },
        {
          id: 'sa-converge',
          title: 'Converge & refine to k groups',
          category: 'termination',
          learningGoal:
            'Stop when low === high and return low as the minimum feasible largest subarray sum.',
          explanation:
            'Once low meets high, every smaller cap has been proven infeasible and high is proven feasible — so low is the exact optimum.',
          rationale:
            'Loop termination is guaranteed because mid < high whenever low < high, strictly shrinking high - low on every iteration.',
          skills: ['Convergence Proof', 'Partition Refinement'],
          prerequisites: ['Boundary Maintenance'],
          techniques: ['Minimax Optimization'],
          ioContract: {
            inputs: ['converged low === high'],
            outputs: ['minLargestSum = low'],
          },
          mappedActions: ['bs-converged'],
        },
      ],
      edges: [
        {
          id: 'sa-e1',
          source: 'sa-search-space',
          target: 'sa-bs-driver',
          reason: 'Initializes the guaranteed answer interval [max(nums), sum(nums)].',
        },
        {
          id: 'sa-e2',
          source: 'sa-bs-driver',
          target: 'sa-greedy-check',
          reason: 'Passes candidate largest-sum cap mid to the Greedy checker.',
        },
        {
          id: 'sa-e3',
          source: 'sa-bs-driver',
          target: 'sa-monotonic-update',
          reason: 'Supplies current interval [low, high] and tested midpoint mid.',
        },
        {
          id: 'sa-e4',
          source: 'sa-greedy-check',
          target: 'sa-monotonic-update',
          reason: 'Returns boolean feasibility (groupsUsed <= k) for mid.',
        },
        {
          id: 'sa-e5',
          source: 'sa-monotonic-update',
          target: 'sa-converge',
          reason: 'Repeatedly halves [low, high] until low === high.',
        },
      ],
    },
  },
  lesson: {
    stages: [
      {
        id: 'sa-stage-1-understand',
        stageNumber: 1,
        shortTitle: 'Partitions',
        title: 'Stage 1: Contiguous Partitions & Minimax Goal',
        goal: 'Understand contiguous subarrays and what "minimize the largest sum" means.',
        conceptLearned: 'Contiguous Partitioning & Minimax Objective',
        narrative:
          'We cannot reorder nums — we only place k - 1 dividers between adjacent elements to form k nonempty contiguous groups. For each split, we look at the heaviest group sum, and want the split whose heaviest group is as small as possible.',
        recommendedStrategy: 'bs-greedy-composition',
        lockedStrategyIds: [],
        question: {
          prompt:
            'For nums = [7, 2, 5, 10, 8] and k = 2, splitting into [7, 2, 5] and [10, 8] gives group sums 14 and 18. What is this split’s "largest subarray sum"?',
          options: [
            {
              id: 'sa-q1-18',
              label: '18 — the maximum of the two group sums (14 and 18).',
              isCorrect: true,
              feedback:
                'Exactly! For any split, we measure its bottleneck (max group sum = 18), and we want to make that bottleneck as small as possible.',
            },
            {
              id: 'sa-q1-32',
              label: '32 — the total sum of both groups combined.',
              isCorrect: false,
              feedback:
                '32 is the total sum of the whole array (which never changes!). We measure max(14, 18) = 18.',
            },
          ],
        },
      },
      {
        id: 'sa-stage-2-feasibility',
        stageNumber: 2,
        shortTitle: 'Feasibility',
        title: 'Stage 2: Turn Optimization into a Yes/No Check',
        goal: 'See how "can we keep every group sum <= X using at most k groups?" unlocks the problem.',
        conceptLearned: 'Decision-Problem Reformulation & Exact-k Refinement',
        narrative:
          'Choosing k - 1 cut positions directly has exponentially many combinations. Instead, pick a candidate cap X and ask a simpler Yes/No question: can we split nums into AT MOST k contiguous groups with each sum <= X?',
        recommendedStrategy: 'bs-greedy-composition',
        lockedStrategyIds: [],
        question: {
          prompt:
            'Suppose k = 3, nums = [1, 4, 4] (all nonnegative), and our packer fits everything into just 2 groups ([1], [4, 4]) under cap X = 8. Can we still form EXACTLY k = 3 nonempty groups <= 8?',
          options: [
            {
              id: 'sa-q2-yes',
              label: 'Yes — split [4, 4] into [4] and [4]; with nonnegative numbers, splitting never increases any group sum!',
              isCorrect: true,
              feedback:
                'Spot on! Because 1 <= k <= n and nums[i] >= 0, any split using <= k groups can always be subdivided into exact k nonempty groups without exceeding X.',
            },
            {
              id: 'sa-q2-no',
              label: 'No — using fewer than k groups means cap X = 8 is invalid.',
              isCorrect: false,
              feedback:
                'Because n = 3 >= k = 3 and all values are >= 0, splitting a multi-element group into smaller pieces only keeps sums <= 8!',
            },
          ],
        },
      },
      {
        id: 'sa-stage-3-greedy',
        stageNumber: 3,
        shortTitle: 'Greedy Check',
        title: 'Stage 3: Why Greedy Packing Works (Nonnegative Rule)',
        goal: 'Understand how O(n) Greedy checks a candidate cap X and why negative numbers would break it.',
        conceptLearned: 'Greedy Contiguous Packing & Nonnegative Requirement',
        narrative:
          'To check if cap X is feasible, scan left to right and pack each element into the current group as long as runningSum + nums[i] <= X; only start a new group when forced. Delaying cuts leaves as much room as possible for the rest of the array.',
        recommendedStrategy: 'bs-greedy-composition',
        lockedStrategyIds: [],
        question: {
          prompt:
            'Why does this Greedy feasibility check require all numbers in nums to be nonnegative (nums[i] >= 0)?',
          options: [
            {
              id: 'sa-q3-nonneg',
              label: 'With negative numbers, a running sum exceeding X might drop back <= X later, so cutting immediately when sum > X would no longer be safe.',
              isCorrect: true,
              feedback:
                'Exactly! Nonnegativity guarantees running sums only grow as we add elements, so the moment runningSum + nums[i] > X, cutting is mandatory.',
            },
            {
              id: 'sa-q3-mod',
              label: 'Because floor division in Binary Search fails on negative integers.',
              isCorrect: false,
              feedback:
                'Binary Search can run over negative ranges, but the Greedy feasibility checker itself breaks when future negative values can rescue an over-limit subarray!',
            },
          ],
        },
      },
      {
        id: 'sa-stage-4-bs-answer',
        stageNumber: 4,
        shortTitle: 'Binary Search',
        title: 'Stage 4: Monotonicity & Binary Search on Answer',
        goal: 'Understand why Binary Search and Greedy need each other.',
        conceptLearned: 'Monotonic Feasibility & Binary Search on Answer',
        narrative:
          'Testing every cap X from max(nums) up to sum(nums) one by one works, but if numbers are up to 10^9 that linear scan is far too slow! Meanwhile, Binary Search alone cannot check if a cap works. Together: Feasibility is monotonic (false, false, ..., true, true), so Binary Search halves [max(nums), sum(nums)] while Greedy tests each midpoint!',
        recommendedStrategy: 'bs-greedy-composition',
        lockedStrategyIds: [],
        question: {
          prompt:
            'If Greedy reports that candidate cap mid = 15 is INFEASIBLE (needed more than k groups), what do we immediately know about every cap <= 15?',
          options: [
            {
              id: 'sa-q4-all-fail',
              label: 'Every cap <= 15 is also infeasible, so we can safely set low = 16.',
              isCorrect: true,
              feedback:
                'Yes! Tightening the cap below 15 can never require FEWER groups, so we discard everything <= 15 in one step.',
            },
            {
              id: 'sa-q4-smaller-works',
              label: 'A smaller cap like 12 might still work, so we must check [low, 14].',
              isCorrect: false,
              feedback:
                'A smaller cap allows even LESS sum per group, which forces at least as many groups — never fewer!',
            },
          ],
        },
      },
      {
        id: 'sa-stage-5-compose',
        stageNumber: 5,
        shortTitle: 'Compose Code',
        title: 'Stage 5: Combine Both Techniques & Build Pseudocode',
        goal: 'Write clean modular pseudocode: a Greedy helper called inside a Binary Search loop.',
        conceptLearned: 'Modular Driver + Subroutine Composition',
        narrative:
          'When two techniques cooperate, keep them cleanly separated in code: write a small `canSplit(nums, k, maxSum)` Greedy helper, then call it inside your `while low < high` Binary Search loop.',
        recommendedStrategy: 'bs-greedy-composition',
        lockedStrategyIds: [],
        question: {
          prompt:
            'When `canSplit(nums, k, mid)` returns TRUE, why do we set `high = mid` instead of `high = mid - 1`?',
          options: [
            {
              id: 'sa-q5-keep-mid',
              label: 'Because mid itself might be the minimum feasible answer — discarding mid could lose the optimal answer!',
              isCorrect: true,
              feedback:
                'Spot on! Keeping `high = mid` preserves the invariant that `high` is always a known feasible answer until `low === high`.',
            },
            {
              id: 'sa-q5-infinite',
              label: 'Setting high = mid - 1 would run slower.',
              isCorrect: false,
              feedback:
                'It is a correctness bug, not speed: if mid is the smallest feasible cap, `high = mid - 1` would exclude the true answer from `[low, high]`!',
            },
          ],
        },
      },
    ],
    hintsByStage: {
      'sa-stage-1-understand': [
        {
          level: 1,
          label: 'Hint 1 · Conceptual Question',
          text: 'If two trucks carry 14 kg and 18 kg, which truck determines the heaviest load?',
        },
        {
          level: 2,
          label: 'Hint 2 · Reasoning Guidance',
          text: 'For a single partition, take the MAX across its k subarray sums. Across all possible partitions, we want the MIN of that max.',
        },
        {
          level: 3,
          label: 'Hint 3 · Explicit Next Idea',
          text: 'The two subarray sums are 7+2+5 = 14 and 10+8 = 18, so the largest subarray sum for that split is max(14, 18) = 18.',
        },
      ],
      'sa-stage-2-feasibility': [
        {
          level: 1,
          label: 'Hint 1 · Conceptual Question',
          text: 'If [4, 4] has sum 8 <= 8, what are the sums when you cut [4, 4] into [4] and [4]?',
        },
        {
          level: 2,
          label: 'Hint 2 · Reasoning Guidance',
          text: 'Splitting a group of nonnegative numbers produces two smaller nonnegative sums, neither of which can exceed the original group sum.',
        },
        {
          level: 3,
          label: 'Hint 3 · Explicit Next Idea',
          text: 'Because n >= k and nums[i] >= 0, we can always split multi-element groups until we have exact k nonempty groups, all still <= X.',
        },
      ],
      'sa-stage-3-greedy': [
        {
          level: 1,
          label: 'Hint 1 · Conceptual Question',
          text: 'Imagine nums = [6, 5, -10] and cap X = 8. At index 1 the sum hits 11 > 8, but what happens if you include -10?',
        },
        {
          level: 2,
          label: 'Hint 2 · Reasoning Guidance',
          text: 'Greedy cuts immediately when runningSum + nums[i] > X because it assumes future elements can never reduce the sum.',
        },
        {
          level: 3,
          label: 'Hint 3 · Explicit Next Idea',
          text: 'Nonnegativity ensures subarray sums grow monotonically as elements are added, making the greedy cut decision locally and globally optimal.',
        },
      ],
      'sa-stage-4-bs-answer': [
        {
          level: 1,
          label: 'Hint 1 · Conceptual Question',
          text: 'If you cannot pack books into k boxes of capacity 15 kg, could you pack the exact same books into k boxes of capacity 14 kg?',
        },
        {
          level: 2,
          label: 'Hint 2 · Reasoning Guidance',
          text: 'Smaller capacity never allows fewer boxes. Feasibility across capacities looks like: F, F, ..., F, T, T, ..., T.',
        },
        {
          level: 3,
          label: 'Hint 3 · Explicit Next Idea',
          text: 'When mid = 15 is infeasible (F), every capacity <= 15 is also F, so we safely advance low to mid + 1 = 16.',
        },
      ],
      'sa-stage-5-compose': [
        {
          level: 1,
          label: 'Hint 1 · Conceptual Question',
          text: 'Suppose the true optimal answer is 18, and Binary Search tests mid = 18 (which returns feasible = true). What happens if you set high = 17?',
        },
        {
          level: 2,
          label: 'Hint 2 · Reasoning Guidance',
          text: 'We want [low, high] to ALWAYS contain the optimal answer at the end of every iteration.',
        },
        {
          level: 3,
          label: 'Hint 3 · Explicit Next Idea',
          text: 'Keep high = mid on feasible (since mid may be optimal) and set low = mid + 1 on infeasible (since mid definitely failed).',
        },
      ],
    },
    pseudocodeStageId: 'sa-stage-5-compose',
    pseudocodeBlocks: [
      {
        id: 'sa-pseudo-1',
        stepNumber: 1,
        title: '1. Greedy Feasibility Helper (O(n) time, O(1) aux space)',
        reason: 'Counts the minimum contiguous groups needed so every group sum <= maxSum.',
        lines: [
          'function canSplit(nums, k, maxSum):',
          '    groups = 1, runningSum = 0',
          '    for x in nums:',
          '        if runningSum + x <= maxSum:',
          '            runningSum += x',
          '        else:',
          '            groups += 1',
          '            runningSum = x',
          '    return groups <= k',
        ],
      },
      {
        id: 'sa-pseudo-2',
        stepNumber: 2,
        title: '2. Initialize Binary Search Answer Bounds',
        reason: 'Optimal largest sum must lie in [max(nums), sum(nums)].',
        lines: [
          'function splitArray(nums, k):',
          '    low = max(nums)',
          '    high = sum(nums)',
        ],
      },
      {
        id: 'sa-pseudo-3',
        stepNumber: 3,
        title: '3. Binary Search Driver Calling Greedy',
        reason: 'Halve the candidate range while keeping the optimal answer inside [low, high].',
        lines: [
          '    while low < high:',
          '        mid = low + floor((high - low) / 2)',
          '        if canSplit(nums, k, mid):',
          '            high = mid',
          '        else:',
          '            low = mid + 1',
        ],
      },
      {
        id: 'sa-pseudo-4',
        stepNumber: 4,
        title: '4. Return Converged Optimum',
        reason: 'When low == high, low is the smallest feasible largest subarray sum.',
        lines: ['    return low'],
      },
    ],
    suggestedNextActivity:
      'Switch to Free Exploration and compare presets like [1, 4, 4] (k = 3), [0, 0, 0] (k = 2), and k = 1 vs k = n — and click through the Binary Search Iteration Inspector to see how each Greedy subtrace narrows [low, high]!',
  },
  generatePrediction: (steps, stepIndex, strategyId, traceContextId) =>
    generateSplitArrayPrediction(steps, stepIndex, strategyId, traceContextId),
};
