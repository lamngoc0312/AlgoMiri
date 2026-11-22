import type {
  ArrayHighlight,
  ExecutionAction,
  ExecutionStep,
  HashMapEntry,
  TraceStatus,
  TwoSumInput,
  TwoSumTraceResult,
} from './types';

function snapshotMap(
  seen: Map<number, number>,
  options?: { matchedKey?: number; addedKey?: number },
): HashMapEntry[] {
  const entries: HashMapEntry[] = [];
  for (const [key, value] of seen.entries()) {
    entries.push({
      key,
      value,
      isMatched: options?.matchedKey !== undefined && key === options.matchedKey,
      isNew: options?.addedKey !== undefined && key === options.addedKey,
    });
  }
  return entries;
}

function createStep(params: {
  stepIndex: number;
  action: ExecutionAction;
  actionTitle: string;
  nums: number[];
  target: number;
  pointers: Record<string, number>;
  highlights: ArrayHighlight[];
  hashMap: HashMapEntry[];
  variables: Record<string, string | number | boolean | null>;
  complement: number | null;
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
    id: `hm-step-${params.stepIndex}`,
    stepIndex: params.stepIndex,
    action: params.action,
    actionTitle: params.actionTitle,
    variables: { ...params.variables },
    visualState: {
      nums: [...params.nums],
      target: params.target,
      pointers: { ...params.pointers },
      highlights,
      hashMap: params.hashMap.map((entry) => ({ ...entry })),
      complement: params.complement,
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

export function generateHashMapTwoSumTrace(
  input: TwoSumInput,
): TwoSumTraceResult {
  const nums = [...input.nums];
  const { target } = input;
  const steps: ExecutionStep[] = [];
  const seen = new Map<number, number>();

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
        hashMap: [],
        variables: { length: nums.length, target, seenSize: 0, result: 'Not found' },
        complement: null,
        pairSum: null,
        foundPair: null,
        status: 'not-found',
        activeGoalIndex: 0,
        explanation:
          nums.length === 0
            ? 'The array is empty, so no pair can be formed. Return not found.'
            : 'The array has only 1 element. Two Sum requires two distinct indices, so no valid pair can exist.',
        isTerminal: true,
      }),
    );

    return {
      strategyId: 'hash-map',
      input: { nums, target },
      steps,
      result: null,
      found: false,
    };
  }

  for (let i = 0; i < nums.length; i += 1) {
    const current = nums[i];
    const complement = target - current;

    // Crucial invariant: check seen map BEFORE inserting current element
    if (seen.has(complement)) {
      const complementIndex = seen.get(complement)!;
      const pair: [number, number] = [complementIndex, i];

      steps.push(
        createStep({
          stepIndex: steps.length,
          action: 'lookup-hit',
          actionTitle: `Inspect i = ${i}: complement ${complement} found!`,
          nums,
          target,
          pointers: { i },
          highlights: [
            { index: complementIndex, role: 'partner', label: 'In Map' },
            { index: i, role: 'current', label: 'Current i' },
          ],
          hashMap: snapshotMap(seen, { matchedKey: complement }),
          variables: {
            i,
            'nums[i]': current,
            complement,
            lookupHit: `index ${complementIndex}`,
          },
          complement,
          pairSum: current + nums[complementIndex],
          foundPair: null,
          status: 'running',
          activeGoalIndex: 1,
          explanation: `At index ${i}, nums[${i}] is ${current}. We need complement ${target} - ${current} = ${complement}. Checking the Seen Map BEFORE inserting ${current} finds ${complement} at earlier index ${complementIndex}.`,
        }),
      );

      steps.push(
        createStep({
          stepIndex: steps.length,
          action: 'found',
          actionTitle: `Match found: [${complementIndex}, ${i}]`,
          nums,
          target,
          pointers: { i },
          highlights: [
            { index: complementIndex, role: 'match', label: `Match (${complementIndex})` },
            { index: i, role: 'match', label: `Match (${i})` },
          ],
          hashMap: snapshotMap(seen, { matchedKey: complement }),
          variables: {
            i,
            complementIndex,
            result: `[${complementIndex}, ${i}]`,
            target,
          },
          complement,
          pairSum: current + nums[complementIndex],
          foundPair: pair,
          status: 'found',
          activeGoalIndex: 2,
          explanation: `Distinct indices [${complementIndex}, ${i}] sum to ${target} (${nums[complementIndex]} + ${current} = ${target}). Return [${complementIndex}, ${i}] in a single pass.`,
          isTerminal: true,
        }),
      );

      return {
        strategyId: 'hash-map',
        input: { nums, target },
        steps,
        result: pair,
        found: true,
      };
    }

    steps.push(
      createStep({
        stepIndex: steps.length,
        action: 'lookup-miss',
        actionTitle: `Inspect i = ${i}: need complement ${complement}`,
        nums,
        target,
        pointers: { i },
        highlights: [{ index: i, role: 'current', label: 'Current i' }],
        hashMap: snapshotMap(seen),
        variables: {
          i,
          'nums[i]': current,
          complement,
          seenSize: seen.size,
        },
        complement,
        pairSum: null,
        foundPair: null,
        status: 'running',
        activeGoalIndex: 0,
        explanation: `At index ${i}, nums[${i}] is ${current}. To reach target ${target}, we need ${target} - ${current} = ${complement}. Checking the Seen Map first shows ${complement} is not stored yet.`,
      }),
    );

    seen.set(current, i);

    steps.push(
      createStep({
        stepIndex: steps.length,
        action: 'store-value',
        actionTitle: `Store ${current} → index ${i}`,
        nums,
        target,
        pointers: { i },
        highlights: [{ index: i, role: 'visited', label: 'Stored' }],
        hashMap: snapshotMap(seen, { addedKey: current }),
        variables: {
          i,
          stored: `${current} -> ${i}`,
          seenSize: seen.size,
          target,
        },
        complement,
        pairSum: null,
        foundPair: null,
        status: 'running',
        activeGoalIndex: 2,
        explanation: `Because ${complement} was not found, store ${current} → index ${i} in the Seen Map so future elements can look it up in O(1) time.`,
      }),
    );
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
      hashMap: snapshotMap(seen),
      variables: {
        seenSize: seen.size,
        target,
        result: 'Not found',
      },
      complement: null,
      pairSum: null,
      foundPair: null,
      status: 'not-found',
      activeGoalIndex: 2,
      explanation: `Finished scanning all ${nums.length} elements and never found a matching complement for target ${target}. Return not found.`,
      isTerminal: true,
    }),
  );

  return {
    strategyId: 'hash-map',
    input: { nums, target },
    steps,
    result: null,
    found: false,
  };
}
