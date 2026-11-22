import type {
  ArrayHighlight,
  ExecutionAction,
  ExecutionStep,
  TraceStatus,
  TwoSumInput,
  TwoSumTraceResult,
} from './types';

function createStep(params: {
  stepIndex: number;
  action: ExecutionAction;
  actionTitle: string;
  nums: number[];
  target: number;
  pointers: Record<string, number>;
  highlights: ArrayHighlight[];
  variables: Record<string, string | number | boolean | null>;
  pairSum: number | null;
  foundPair: [number, number] | null;
  status: TraceStatus;
  activeGoalIndex: number;
  explanation: string;
  isTerminal?: boolean;
}): ExecutionStep {
  const highlights = params.highlights.map((h) => ({ ...h }));
  const highlightedIndices = highlights.map((h) => h.index);

  return {
    id: `bf-step-${params.stepIndex}`,
    stepIndex: params.stepIndex,
    action: params.action,
    actionTitle: params.actionTitle,
    variables: { ...params.variables },
    visualState: {
      nums: [...params.nums],
      target: params.target,
      pointers: { ...params.pointers },
      highlights,
      pairSum: params.pairSum,
      foundPair: params.foundPair ? [params.foundPair[0], params.foundPair[1]] : null,
      status: params.status,
      activeGoalIndex: params.activeGoalIndex,
    },
    highlightedIndices,
    explanation: params.explanation,
    isTerminal: params.isTerminal,
  };
}

export function generateBruteForceTwoSumTrace(
  input: TwoSumInput,
): TwoSumTraceResult {
  const nums = [...input.nums];
  const { target } = input;
  const steps: ExecutionStep[] = [];

  if (nums.length < 2) {
    steps.push(
      createStep({
        stepIndex: 0,
        action: 'not-found',
        actionTitle: 'Not enough elements',
        nums,
        target,
        pointers: {},
        highlights: [],
        variables: { length: nums.length, target, result: 'Not found' },
        pairSum: null,
        foundPair: null,
        status: 'not-found',
        activeGoalIndex: 0,
        explanation:
          nums.length === 0
            ? 'The array is empty, so there are no pairs to check. Return not found.'
            : 'The array has only 1 element. Two Sum requires two distinct indices, so no valid pair can exist.',
        isTerminal: true,
      }),
    );

    return {
      strategyId: 'brute-force',
      input: { nums, target },
      steps,
      result: null,
      found: false,
    };
  }

  for (let i = 0; i < nums.length - 1; i += 1) {
    steps.push(
      createStep({
        stepIndex: steps.length,
        action: 'select-anchor',
        actionTitle: `Select anchor i = ${i}`,
        nums,
        target,
        pointers: { i },
        highlights: [{ index: i, role: 'current', label: 'Anchor i' }],
        variables: { i, 'nums[i]': nums[i], j: null, target },
        pairSum: null,
        foundPair: null,
        status: 'running',
        activeGoalIndex: 0,
        explanation: `Anchor i at index ${i} (value ${nums[i]}). Next, scan partner indices j starting at ${i + 1} so we never pair an element with itself.`,
      }),
    );

    for (let j = i + 1; j < nums.length; j += 1) {
      const pairSum = nums[i] + nums[j];
      const isMatch = pairSum === target;

      steps.push(
        createStep({
          stepIndex: steps.length,
          action: 'compare-pair',
          actionTitle: `Check pair (${i}, ${j}): ${nums[i]} + ${nums[j]} = ${pairSum}`,
          nums,
          target,
          pointers: { i, j },
          highlights: [
            { index: i, role: 'current', label: 'Anchor i' },
            { index: j, role: 'partner', label: 'Partner j' },
          ],
          variables: {
            i,
            j,
            'nums[i] + nums[j]': pairSum,
            target,
          },
          pairSum,
          foundPair: null,
          status: 'running',
          activeGoalIndex: 1,
          explanation: isMatch
            ? `Test partner j = ${j} (value ${nums[j]}). Adding ${nums[i]} + ${nums[j]} gives ${pairSum}, which matches target ${target}!`
            : `Test partner j = ${j} (value ${nums[j]}). Adding ${nums[i]} + ${nums[j]} gives ${pairSum}, which is not ${target}. Continue scanning.`,
        }),
      );

      if (isMatch) {
        const pair: [number, number] = [i, j];
        steps.push(
          createStep({
            stepIndex: steps.length,
            action: 'found',
            actionTitle: `Match found: [${i}, ${j}]`,
            nums,
            target,
            pointers: { i, j },
            highlights: [
              { index: i, role: 'match', label: 'Match (i)' },
              { index: j, role: 'match', label: 'Match (j)' },
            ],
            variables: {
              i,
              j,
              result: `[${i}, ${j}]`,
              target,
            },
            pairSum,
            foundPair: pair,
            status: 'found',
            activeGoalIndex: 2,
            explanation: `Confirmed distinct indices [${i}, ${j}] because nums[${i}] (${nums[i]}) + nums[${j}] (${nums[j]}) = ${target}. Return [${i}, ${j}] and stop early.`,
            isTerminal: true,
          }),
        );

        return {
          strategyId: 'brute-force',
          input: { nums, target },
          steps,
          result: pair,
          found: true,
        };
      }
    }
  }

  steps.push(
    createStep({
      stepIndex: steps.length,
      action: 'not-found',
      actionTitle: 'No valid pair found',
      nums,
      target,
      pointers: {},
      highlights: [],
      variables: { checkedPairs: (nums.length * (nums.length - 1)) / 2, target, result: 'Not found' },
      pairSum: null,
      foundPair: null,
      status: 'not-found',
      activeGoalIndex: 2,
      explanation: `Checked all distinct pairs (i < j) in the array and none summed to ${target}. Return not found.`,
      isTerminal: true,
    }),
  );

  return {
    strategyId: 'brute-force',
    input: { nums, target },
    steps,
    result: null,
    found: false,
  };
}
