import { describe, expect, it } from 'vitest';
import {
  checkGreedyFeasibility,
  computeSplitArrayOptimal,
  generateSplitArrayTrace,
  refineToExactKGroups,
} from '../domain/traces/splitArrayLargestSum';
import {
  MAX_SPLIT_ARRAY_LENGTH,
  parseAndValidateSplitArrayInput,
} from '../domain/traces/splitArrayValidation';
import { splitArrayModule } from '../domain/problems/splitArrayModule';
import { validateTraceNodeReferences } from '../domain/solutions/graphValidator';

/**
 * Independent brute-force oracle that enumerates ALL C(n - 1, k - 1) contiguous
 * partition cuts and returns the minimum largest subarray sum.
 */
function bruteForceSplitArrayOracle(nums: number[], k: number): number {
  let best = Infinity;

  function dfs(startIdx: number, groupsLeft: number, currentMaxSum: number) {
    if (groupsLeft === 1) {
      let tailSum = 0;
      for (let i = startIdx; i < nums.length; i += 1) {
        tailSum += nums[i];
      }
      best = Math.min(best, Math.max(currentMaxSum, tailSum));
      return;
    }

    let running = 0;
    // Leave at least (groupsLeft - 1) elements for the remaining nonempty groups
    for (let end = startIdx; end <= nums.length - groupsLeft; end += 1) {
      running += nums[end];
      dfs(end + 1, groupsLeft - 1, Math.max(currentMaxSum, running));
    }
  }

  dfs(0, k, 0);
  return best;
}

const REQUIRED_CASES: {
  label: string;
  nums: number[];
  k: number;
  expected: number;
}[] = [
  { label: '[7,2,5,10,8], k=2 => 18', nums: [7, 2, 5, 10, 8], k: 2, expected: 18 },
  { label: '[1,2,3,4,5], k=2 => 9', nums: [1, 2, 3, 4, 5], k: 2, expected: 9 },
  { label: '[1,4,4], k=3 => 4', nums: [1, 4, 4], k: 3, expected: 4 },
  { label: '[1], k=1 => 1', nums: [1], k: 1, expected: 1 },
  { label: '[0,0,0], k=2 => 0', nums: [0, 0, 0], k: 2, expected: 0 },
  { label: 'k=1 => sum(nums)', nums: [4, 9, 2, 6], k: 1, expected: 21 },
  { label: 'k=n => max(nums)', nums: [4, 9, 2, 6], k: 4, expected: 9 },
];

describe('Split Array Largest Sum — Binary Search + Greedy Composition Engine', () => {
  it.each(REQUIRED_CASES)(
    'produces exact result, valid invariants, and exact-k partition for $label',
    ({ nums, k, expected }) => {
      expect(computeSplitArrayOptimal(nums, k)).toBe(expected);

      const trace = generateSplitArrayTrace({ nums, k });
      expect(trace.found).toBe(true);
      expect(trace.resultLabel).toBe(String(expected));

      const lastStep = trace.steps[trace.steps.length - 1];
      expect(lastStep.isTerminal).toBe(true);
      expect(lastStep.action).toBe('bs-converged');
      expect(lastStep.visualState.finalAnswer).toBe(expected);

      // Final converged partition must have EXACTLY k nonempty contiguous groups, all <= expected
      const finalGroups = lastStep.visualState.groups;
      expect(finalGroups).toHaveLength(k);
      expect(finalGroups.flatMap((g) => g.elements)).toEqual(nums);
      for (const group of finalGroups) {
        expect(group.elements.length).toBeGreaterThan(0);
        expect(group.sum).toBeLessThanOrEqual(expected);
      }

      // Optimal answer must stay within [low, high] at EVERY step of the trace
      trace.steps.forEach((step, idx) => {
        expect(step.stepIndex).toBe(idx);
        expect(step.visualState.low).toBeLessThanOrEqual(expected);
        expect(step.visualState.high).toBeGreaterThanOrEqual(expected);
      });

      // Validate explicit graph node references
      const graph = splitArrayModule.solutionGraphs['bs-greedy-composition'];
      expect(validateTraceNodeReferences(graph, trace.steps).valid).toBe(true);
    },
  );

  it('matches the independent brute-force C(n-1, k-1) partition oracle across diverse arrays and k', () => {
    const sampleArrays = [
      [7, 2, 5, 10, 8],
      [1, 2, 3, 4, 5],
      [0, 5, 0, 5, 0],
      [10, 1, 1, 10, 2, 8],
      [3, 3, 3, 3],
      [12, 0, 4, 7, 9],
    ];

    for (const nums of sampleArrays) {
      for (let k = 1; k <= nums.length; k += 1) {
        const oracle = bruteForceSplitArrayOracle(nums, k);
        const optimized = computeSplitArrayOptimal(nums, k);
        expect(optimized).toBe(oracle);

        const refined = refineToExactKGroups(nums, k, optimized);
        expect(refined).toHaveLength(k);
        expect(Math.max(...refined.map((g) => g.sum))).toBe(optimized);
      }
    }
  });

  it('exhibits monotonic feasibility across [max(nums) .. sum(nums)]', () => {
    const nums = [7, 2, 5, 10, 8];
    const k = 2;
    const minCap = Math.max(...nums);
    const maxCap = nums.reduce((a, b) => a + b, 0);

    let seenFeasible = false;
    for (let cap = minCap; cap <= maxCap; cap += 1) {
      const { feasible } = checkGreedyFeasibility(nums, k, cap);
      if (seenFeasible) {
        // Once feasible is true, every larger cap must ALSO be feasible
        expect(feasible).toBe(true);
      }
      if (feasible) {
        seenFeasible = true;
      }
    }
    expect(seenFeasible).toBe(true);
  });

  it('connects child Greedy events to their parent Binary Search iteration via invocationId and preserves immutability', () => {
    const trace = generateSplitArrayTrace({ nums: [7, 2, 5, 10, 8], k: 2 });

    const bsSelectSteps = trace.steps.filter((s) => s.action === 'bs-select-mid');
    expect(bsSelectSteps.length).toBeGreaterThan(0);

    for (const selectStep of bsSelectSteps) {
      const invId = selectStep.visualState.composition.invocationId;
      const iterNum = selectStep.visualState.composition.bsIteration;
      expect(invId).toBe(`bs-iter-${iterNum}`);

      const matchingSubroutineSteps = trace.steps.filter(
        (s) =>
          s.visualState.composition.invocationId === invId &&
          s.visualState.composition.role === 'subroutine',
      );
      expect(matchingSubroutineSteps.length).toBeGreaterThan(0);
    }

    // Immutability check: mutating an earlier step's groups does not affect later steps
    const stepWithGroups = trace.steps.find(
      (s) => s.visualState.groups.length > 0,
    )!;
    const laterStep = trace.steps[trace.steps.length - 1];
    const snapshotSums = laterStep.visualState.groups.map((g) => g.sum);

    stepWithGroups.visualState.groups[0].sum = 999999;
    stepWithGroups.visualState.groups.push({
      groupIndex: 99,
      startIndex: 0,
      endIndex: 0,
      elements: [999],
      sum: 999,
      isCurrent: false,
    });

    expect(laterStep.visualState.groups.map((g) => g.sum)).toEqual(snapshotSums);
  });

  it('validates nonnegative safe integers, k bounds, length limits, and safe-sum overflow', () => {
    expect(parseAndValidateSplitArrayInput('7, 2, 5, 10, 8', '2')).toEqual({
      ok: true,
      value: { nums: [7, 2, 5, 10, 8], k: 2 },
    });

    // Rejects negative integers with nonnegative explanation
    const neg = parseAndValidateSplitArrayInput('7, -2, 5', '2');
    expect(neg.ok).toBe(false);
    if (!neg.ok) {
      expect(neg.error).toMatch(/nonnegative/i);
    }

    // Rejects k < 1 and k > n
    expect(parseAndValidateSplitArrayInput('1, 2, 3', '0').ok).toBe(false);
    expect(parseAndValidateSplitArrayInput('1, 2, 3', '4').ok).toBe(false);

    // Rejects unsafe integer sum overflow
    const overflow = parseAndValidateSplitArrayInput(
      `${Number.MAX_SAFE_INTEGER}, 5`,
      '1',
    );
    expect(overflow.ok).toBe(false);
    if (!overflow.ok) {
      expect(overflow.error).toMatch(/safe integer/i);
    }

    // Rejects oversized array
    const tooLong = Array.from(
      { length: MAX_SPLIT_ARRAY_LENGTH + 1 },
      () => '1',
    ).join(', ');
    expect(parseAndValidateSplitArrayInput(tooLong, '2').ok).toBe(false);
  });

  it('generates exactly ONE correct option with distinct distractors across representative and seeded randomized inputs (Phase A regression)', () => {
    // Simple deterministic LCG PRNG for reproducible tests
    let seed = 20261124;
    const nextRand = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 0x100000000;
    };

    const testInputs: { nums: number[]; k: number }[] = [
      // Explicitly hits high === low + 1 (e.g., [1, 1], k = 1 -> [1, 2]; [7, 2, 5, 10, 8], k = 2)
      { nums: [1, 1], k: 1 },
      { nums: [2, 1], k: 2 },
      { nums: [7, 2, 5, 10, 8], k: 2 },
      { nums: [1, 2, 3, 4, 5], k: 2 },
      { nums: [1, 4, 4], k: 3 },
      { nums: [0, 1], k: 1 },
    ];

    for (let t = 0; t < 25; t += 1) {
      const len = 1 + Math.floor(nextRand() * 7);
      const nums = Array.from({ length: len }, () =>
        Math.floor(nextRand() * 25),
      );
      const k = 1 + Math.floor(nextRand() * len);
      testInputs.push({ nums, k });
    }

    for (const input of testInputs) {
      const trace = generateSplitArrayTrace(input);
      for (let i = 0; i < trace.steps.length - 1; i += 1) {
        const prompt = splitArrayModule.generatePrediction(
          trace.steps,
          i,
          'bs-greedy-composition',
          `seed-test:${input.nums.join(',')}:${input.k}`,
        );
        expect(prompt).not.toBeNull();

        const correctOptions = prompt!.options.filter((o) => o.isCorrect);
        expect(
          correctOptions,
          `Step ${i} (${trace.steps[i].action}) for [${input.nums}] k=${input.k}`,
        ).toHaveLength(1);

        // Distractors must be distinct from the correct option and from each other
        const labels = prompt!.options.map((o) => o.label);
        expect(new Set(labels).size).toBe(labels.length);

        // For mid-selection questions, all numeric mid values must be strictly distinct
        if (trace.steps[i + 1].action === 'bs-select-mid') {
          const midValues = labels.map((l) => l.match(/mid = (\d+)/)?.[1]);
          expect(new Set(midValues).size).toBe(midValues.length);
        }
      }

      // Terminal step has no prediction
      expect(
        splitArrayModule.generatePrediction(
          trace.steps,
          trace.steps.length - 1,
          'bs-greedy-composition',
          'terminal',
        ),
      ).toBeNull();
    }
  });
});
