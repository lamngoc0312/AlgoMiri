import type {
  BinarySearchGreedyVisualState,
  BsIterationSummary,
  CompositionAction,
  CompositionContext,
  ContiguousGroup,
  GenericExecutionStep,
  GenericTraceResult,
} from '../core/types';
import type { TraceStatus } from './types';
import type { SplitArrayInput } from './splitArrayValidation';

export interface GreedyCheckResult {
  feasible: boolean;
  groupsUsed: number;
}

/**
 * Pure O(n) time, O(1) auxiliary-space Greedy feasibility check.
 * Determines whether `nums` (nonnegative) can be partitioned into at most `k`
 * contiguous subarrays each having sum <= `maxAllowedSum`.
 */
export function checkGreedyFeasibility(
  nums: readonly number[],
  k: number,
  maxAllowedSum: number,
): GreedyCheckResult {
  let groupsUsed = 1;
  let runningSum = 0;

  for (let i = 0; i < nums.length; i += 1) {
    const val = nums[i];
    if (val > maxAllowedSum) {
      return { feasible: false, groupsUsed: k + 1 };
    }
    if (runningSum + val <= maxAllowedSum) {
      runningSum += val;
    } else {
      groupsUsed += 1;
      runningSum = val;
    }
  }

  return {
    feasible: groupsUsed <= k,
    groupsUsed,
  };
}

/**
 * Pure Binary Search on Answer + Greedy solver.
 * Time: O(n * log(sum(nums) - max(nums))), Auxiliary Space: O(1).
 */
export function computeSplitArrayOptimal(
  nums: readonly number[],
  k: number,
): number {
  let low = 0;
  let high = 0;
  for (const val of nums) {
    if (val > low) low = val;
    high += val;
  }

  while (low < high) {
    const mid = low + Math.floor((high - low) / 2);
    if (checkGreedyFeasibility(nums, k, mid).feasible) {
      high = mid;
    } else {
      low = mid + 1;
    }
  }

  return low;
}

/**
 * Refines a feasible greedy partition (using <= k groups) into EXACTLY k nonempty
 * contiguous groups without increasing any group's sum (valid whenever 1 <= k <= n
 * and all elements are nonnegative).
 */
export function refineToExactKGroups(
  nums: readonly number[],
  k: number,
  maxAllowedSum: number,
): ContiguousGroup[] {
  const slices: { start: number; end: number }[] = [];
  let start = 0;
  let sum = nums[0];

  for (let i = 1; i < nums.length; i += 1) {
    if (sum + nums[i] <= maxAllowedSum) {
      sum += nums[i];
    } else {
      slices.push({ start, end: i - 1 });
      start = i;
      sum = nums[i];
    }
  }
  slices.push({ start, end: nums.length - 1 });

  // Split multi-element groups from left to right until we have exactly k nonempty groups.
  // Because nums[i] >= 0, splitting [a..b] into [a..a] and [a+1..b] never increases either sum!
  let idx = 0;
  while (slices.length < k && idx < slices.length) {
    const slice = slices[idx];
    if (slice.end > slice.start) {
      slices.splice(
        idx,
        1,
        { start: slice.start, end: slice.start },
        { start: slice.start + 1, end: slice.end },
      );
    }
    idx += 1;
  }

  return slices.map((s, groupIdx) => {
    const elements = nums.slice(s.start, s.end + 1);
    const groupSum = elements.reduce((acc, v) => acc + v, 0);
    return {
      groupIndex: groupIdx + 1,
      startIndex: s.start,
      endIndex: s.end,
      elements,
      sum: groupSum,
      isCurrent: false,
      justCreated: false,
    };
  });
}

function cloneGroups(groups: ContiguousGroup[]): ContiguousGroup[] {
  return groups.map((g) => ({
    ...g,
    elements: [...g.elements],
  }));
}

function cloneIterations(
  iterations: BsIterationSummary[],
): BsIterationSummary[] {
  return iterations.map((it) => ({ ...it }));
}

function createStep(params: {
  stepIndex: number;
  action: CompositionAction;
  actionTitle: string;
  conceptualNodeIds: string[];
  nums: number[];
  k: number;
  low: number;
  high: number;
  mid: number | null;
  composition: CompositionContext;
  scanIndex: number | null;
  runningSum: number | null;
  groupsUsed: number;
  groups: ContiguousGroup[];
  feasible: boolean | null;
  boundDecision: string | null;
  finalAnswer: number | null;
  completedIterations: BsIterationSummary[];
  status: TraceStatus;
  activeGoalIndex: number;
  variables: Record<string, string | number | boolean | null>;
  explanation: string;
  isTerminal?: boolean;
}): GenericExecutionStep<BinarySearchGreedyVisualState> {
  const highlightedIndices =
    params.scanIndex !== null ? [params.scanIndex] : [];

  return {
    id: `sa-step-${params.stepIndex}`,
    stepIndex: params.stepIndex,
    action: params.action,
    actionTitle: params.actionTitle,
    conceptualNodeIds: [...params.conceptualNodeIds],
    variables: { ...params.variables },
    visualState: {
      kind: 'bs-greedy',
      nums: [...params.nums],
      k: params.k,
      low: params.low,
      high: params.high,
      mid: params.mid,
      composition: { ...params.composition },
      scanIndex: params.scanIndex,
      runningSum: params.runningSum,
      groupsUsed: params.groupsUsed,
      groups: cloneGroups(params.groups),
      feasible: params.feasible,
      boundDecision: params.boundDecision,
      finalAnswer: params.finalAnswer,
      completedIterations: cloneIterations(params.completedIterations),
      status: params.status,
      activeGoalIndex: params.activeGoalIndex,
    },
    highlightedIndices,
    explanation: params.explanation,
    isTerminal: params.isTerminal,
  };
}

export function generateSplitArrayTrace(
  input: SplitArrayInput,
): GenericTraceResult<SplitArrayInput, BinarySearchGreedyVisualState> {
  const nums = [...input.nums];
  const { k } = input;
  const steps: GenericExecutionStep<BinarySearchGreedyVisualState>[] = [];
  const completedIterations: BsIterationSummary[] = [];

  let low = 0;
  let high = 0;
  for (const val of nums) {
    if (val > low) low = val;
    high += val;
  }

  steps.push(
    createStep({
      stepIndex: 0,
      action: 'bs-init-bounds',
      actionTitle: `Initialize answer bounds [${low}, ${high}]`,
      conceptualNodeIds: ['sa-search-space'],
      nums,
      k,
      low,
      high,
      mid: null,
      composition: {
        invocationId: 'bs-init',
        bsIteration: 0,
        role: 'driver',
        driverTechnique: 'Binary Search on Answer',
        subroutineTechnique: 'Greedy Partitioning',
      },
      scanIndex: null,
      runningSum: null,
      groupsUsed: 0,
      groups: [],
      feasible: null,
      boundDecision: null,
      finalAnswer: null,
      completedIterations,
      status: 'running',
      activeGoalIndex: 0,
      variables: {
        k,
        'low (max)': low,
        'high (sum)': high,
        mid: null,
      },
      explanation: `Every nonempty subarray must hold at least the largest single element (low = max(nums) = ${low}), and no subarray sum can exceed the entire array total (high = sum(nums) = ${high}).`,
    }),
  );

  let iteration = 0;

  while (low < high) {
    iteration += 1;
    const invocationId = `bs-iter-${iteration}`;
    const iterFirstStep = steps.length;
    const mid = low + Math.floor((high - low) / 2);

    // 1. Binary Search Driver picks candidate answer mid
    steps.push(
      createStep({
        stepIndex: steps.length,
        action: 'bs-select-mid',
        actionTitle: `BS Iter #${iteration}: Test candidate largest sum mid = ${mid}`,
        conceptualNodeIds: ['sa-bs-driver'],
        nums,
        k,
        low,
        high,
        mid,
        composition: {
          invocationId,
          bsIteration: iteration,
          role: 'driver',
          driverTechnique: 'Binary Search on Answer',
          subroutineTechnique: 'Greedy Partitioning',
        },
        scanIndex: null,
        runningSum: null,
        groupsUsed: 0,
        groups: [],
        feasible: null,
        boundDecision: null,
        finalAnswer: null,
        completedIterations,
        status: 'running',
        activeGoalIndex: 1,
        variables: {
          bsIter: iteration,
          low,
          high,
          mid,
          k,
        },
        explanation: `Binary Search picks midpoint mid = ${low} + floor((${high} - ${low}) / 2) = ${mid}, and asks the Greedy checker: "Can we split nums into at most ${k} groups with every group sum <= ${mid}?"`,
      }),
    );

    // 2. Greedy Feasibility Subroutine starts
    const groups: ContiguousGroup[] = [];
    steps.push(
      createStep({
        stepIndex: steps.length,
        action: 'greedy-start',
        actionTitle: `Greedy Check #${iteration}: Pack subarrays with sum <= ${mid}`,
        conceptualNodeIds: ['sa-greedy-check'],
        nums,
        k,
        low,
        high,
        mid,
        composition: {
          invocationId,
          bsIteration: iteration,
          role: 'subroutine',
          driverTechnique: 'Binary Search on Answer',
          subroutineTechnique: 'Greedy Partitioning',
        },
        scanIndex: null,
        runningSum: 0,
        groupsUsed: 1,
        groups: [],
        feasible: null,
        boundDecision: null,
        finalAnswer: null,
        completedIterations,
        status: 'running',
        activeGoalIndex: 2,
        variables: {
          invocation: invocationId,
          limit: mid,
          groupsUsed: 1,
          runningSum: 0,
        },
        explanation: `Start Greedy scan for candidate mid = ${mid}. Because all numbers are nonnegative, packing as many elements as possible into each group minimizes the total number of groups needed.`,
      }),
    );

    let runningSum = 0;
    let groupsUsed = 1;

    for (let idx = 0; idx < nums.length; idx += 1) {
      const val = nums[idx];

      if (idx === 0) {
        runningSum = val;
        groups.push({
          groupIndex: 1,
          startIndex: 0,
          endIndex: 0,
          elements: [val],
          sum: val,
          isCurrent: true,
          justCreated: true,
        });

        steps.push(
          createStep({
            stepIndex: steps.length,
            action: 'greedy-add-to-group',
            actionTitle: `Scan idx 0 (${val}): Start Group 1 (sum = ${runningSum} <= ${mid})`,
            conceptualNodeIds: ['sa-greedy-check'],
            nums,
            k,
            low,
            high,
            mid,
            composition: {
              invocationId,
              bsIteration: iteration,
              role: 'subroutine',
              driverTechnique: 'Binary Search on Answer',
              subroutineTechnique: 'Greedy Partitioning',
            },
            scanIndex: 0,
            runningSum,
            groupsUsed,
            groups,
            feasible: null,
            boundDecision: null,
            finalAnswer: null,
            completedIterations,
            status: 'running',
            activeGoalIndex: 2,
            variables: {
              idx: 0,
              'nums[idx]': val,
              runningSum,
              limit: mid,
              groupsUsed,
            },
            explanation: `Place first element nums[0] = ${val} into Group 1. Since mid >= max(nums), ${val} <= ${mid} always holds.`,
          }),
        );
      } else if (runningSum + val <= mid) {
        const prevSum = runningSum;
        runningSum += val;
        for (const g of groups) {
          g.justCreated = false;
        }
        const currentGroup = groups[groups.length - 1];
        currentGroup.endIndex = idx;
        currentGroup.elements.push(val);
        currentGroup.sum = runningSum;

        steps.push(
          createStep({
            stepIndex: steps.length,
            action: 'greedy-add-to-group',
            actionTitle: `Scan idx ${idx} (${val}): Add to Group ${groupsUsed} (${prevSum} + ${val} = ${runningSum} <= ${mid})`,
            conceptualNodeIds: ['sa-greedy-check'],
            nums,
            k,
            low,
            high,
            mid,
            composition: {
              invocationId,
              bsIteration: iteration,
              role: 'subroutine',
              driverTechnique: 'Binary Search on Answer',
              subroutineTechnique: 'Greedy Partitioning',
            },
            scanIndex: idx,
            runningSum,
            groupsUsed,
            groups,
            feasible: null,
            boundDecision: null,
            finalAnswer: null,
            completedIterations,
            status: 'running',
            activeGoalIndex: 2,
            variables: {
              idx,
              'nums[idx]': val,
              runningSum,
              limit: mid,
              groupsUsed,
            },
            explanation: `Adding ${val} keeps Group ${groupsUsed}'s sum at ${runningSum} <= ${mid}, so greedily keep ${val} in Group ${groupsUsed}.`,
          }),
        );
      } else {
        const wouldBeSum = runningSum + val;
        for (const g of groups) {
          g.isCurrent = false;
          g.justCreated = false;
        }
        groupsUsed += 1;
        runningSum = val;
        groups.push({
          groupIndex: groupsUsed,
          startIndex: idx,
          endIndex: idx,
          elements: [val],
          sum: val,
          isCurrent: true,
          justCreated: true,
        });

        steps.push(
          createStep({
            stepIndex: steps.length,
            action: 'greedy-new-group',
            actionTitle: `Scan idx ${idx} (${val}): ${wouldBeSum} > ${mid} → Start Group ${groupsUsed}`,
            conceptualNodeIds: ['sa-greedy-check'],
            nums,
            k,
            low,
            high,
            mid,
            composition: {
              invocationId,
              bsIteration: iteration,
              role: 'subroutine',
              driverTechnique: 'Binary Search on Answer',
              subroutineTechnique: 'Greedy Partitioning',
            },
            scanIndex: idx,
            runningSum,
            groupsUsed,
            groups,
            feasible: null,
            boundDecision: null,
            finalAnswer: null,
            completedIterations,
            status: 'running',
            activeGoalIndex: 2,
            variables: {
              idx,
              'nums[idx]': val,
              runningSum,
              limit: mid,
              groupsUsed,
            },
            explanation: `Adding ${val} would raise the previous group's sum to ${wouldBeSum} > ${mid}. Cut here and open Group ${groupsUsed} starting with ${val}.`,
          }),
        );
      }
    }

    // Mark group scan done
    for (const g of groups) {
      g.isCurrent = false;
      g.justCreated = false;
    }

    const feasible = groupsUsed <= k;

    // 3. Greedy returns feasibility result to Binary Search driver
    steps.push(
      createStep({
        stepIndex: steps.length,
        action: 'greedy-result',
        actionTitle: feasible
          ? `Greedy Result: ${groupsUsed} <= ${k} groups → mid = ${mid} is FEASIBLE`
          : `Greedy Result: ${groupsUsed} > ${k} groups → mid = ${mid} is TOO SMALL`,
        conceptualNodeIds: ['sa-greedy-check', 'sa-monotonic-update'],
        nums,
        k,
        low,
        high,
        mid,
        composition: {
          invocationId,
          bsIteration: iteration,
          role: 'subroutine',
          driverTechnique: 'Binary Search on Answer',
          subroutineTechnique: 'Greedy Partitioning',
        },
        scanIndex: null,
        runningSum: null,
        groupsUsed,
        groups,
        feasible,
        boundDecision: null,
        finalAnswer: null,
        completedIterations,
        status: 'running',
        activeGoalIndex: 3,
        variables: {
          mid,
          groupsUsed,
          allowedK: k,
          feasible,
        },
        explanation: feasible
          ? `Greedy needed ${groupsUsed} group${groupsUsed === 1 ? '' : 's'} (<= k = ${k}) with every group sum <= ${mid}. Since 1 <= k <= n and values are nonnegative, ${groupsUsed} groups can always be split into exactly ${k} nonempty groups without raising the largest sum!`
          : `Even packing greedily required ${groupsUsed} groups (> k = ${k}). Therefore NO valid ${k}-way split can achieve largest sum <= ${mid}.`,
      }),
    );

    // 4. Binary Search updates bounds
    const prevLow = low;
    const prevHigh = high;
    let decisionText: string;
    if (feasible) {
      high = mid;
      decisionText = `Feasible → high = ${mid}`;
    } else {
      low = mid + 1;
      decisionText = `Infeasible → low = ${mid + 1}`;
    }

    const iterLastStep = steps.length;
    completedIterations.push({
      invocationId,
      iteration,
      low: prevLow,
      high: prevHigh,
      mid,
      groupsUsed,
      feasible,
      nextLow: low,
      nextHigh: high,
      firstStepIndex: iterFirstStep,
      lastStepIndex: iterLastStep,
    });

    steps.push(
      createStep({
        stepIndex: iterLastStep,
        action: 'bs-update-bounds',
        actionTitle: `BS Update: ${decisionText} (new bounds [${low}, ${high}])`,
        conceptualNodeIds: ['sa-monotonic-update'],
        nums,
        k,
        low,
        high,
        mid,
        composition: {
          invocationId,
          bsIteration: iteration,
          role: 'driver',
          driverTechnique: 'Binary Search on Answer',
          subroutineTechnique: 'Greedy Partitioning',
        },
        scanIndex: null,
        runningSum: null,
        groupsUsed,
        groups,
        feasible,
        boundDecision: decisionText,
        finalAnswer: null,
        completedIterations,
        status: 'running',
        activeGoalIndex: 3,
        variables: {
          bsIter: iteration,
          testedMid: mid,
          newLow: low,
          newHigh: high,
        },
        explanation: feasible
          ? `Because mid = ${mid} is feasible, keep ${mid} as a valid candidate and search [${low}, ${high}] to see if an even smaller largest sum works.`
          : `Because mid = ${mid} failed, every limit <= ${mid} will also fail by monotonicity. Raise low to ${mid} + 1 = ${low} and search [${low}, ${high}].`,
      }),
    );
  }

  // 5. Converged: low === high
  const exactKGroups = refineToExactKGroups(nums, k, low);

  steps.push(
    createStep({
      stepIndex: steps.length,
      action: 'bs-converged',
      actionTitle: `Converged at low = high = ${low} (Optimal Answer)`,
      conceptualNodeIds: ['sa-converge'],
      nums,
      k,
      low,
      high,
      mid: low,
      composition: {
        invocationId: 'bs-done',
        bsIteration: iteration,
        role: 'driver',
        driverTechnique: 'Binary Search on Answer',
        subroutineTechnique: 'Greedy Partitioning',
      },
      scanIndex: null,
      runningSum: null,
      groupsUsed: exactKGroups.length,
      groups: exactKGroups,
      feasible: true,
      boundDecision: `Converged: answer = ${low}`,
      finalAnswer: low,
      completedIterations,
      status: 'found',
      activeGoalIndex: 4,
      variables: {
        low,
        high,
        k,
        minLargestSum: low,
      },
      explanation: `Search bounds converged to low = high = ${low}. Displayed above is a verified partition into exactly ${k} nonempty subarray${k === 1 ? '' : 's'} whose largest subarray sum is ${low}.`,
      isTerminal: true,
    }),
  );

  return {
    problemId: 'split-array-largest-sum',
    strategyId: 'bs-greedy-composition',
    input: { nums: [...nums], k },
    steps,
    found: true,
    resultLabel: String(low),
  };
}
