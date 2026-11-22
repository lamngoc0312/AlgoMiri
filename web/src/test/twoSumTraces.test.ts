import { describe, expect, it } from 'vitest';
import { generateBruteForceTwoSumTrace } from '../domain/traces/twoSumBruteForce';
import { generateHashMapTwoSumTrace } from '../domain/traces/twoSumHashMap';
import {
  MAX_ARRAY_LENGTH,
  parseAndValidateTwoSumInput,
} from '../domain/traces/validation';
import type { TwoSumInput, TwoSumTraceResult } from '../domain/traces/types';

function oracleHasSolution(nums: number[], target: number): boolean {
  for (let i = 0; i < nums.length; i += 1) {
    for (let j = i + 1; j < nums.length; j += 1) {
      if (nums[i] + nums[j] === target) return true;
    }
  }
  return false;
}

function assertTraceInvariants(trace: TwoSumTraceResult) {
  const { nums, target } = trace.input;
  const expectedFound = oracleHasSolution(nums, target);

  expect(trace.found).toBe(expectedFound);
  expect(trace.steps.length).toBeGreaterThan(0);

  // Check strictly increasing stepIndex and in-bounds highlights
  trace.steps.forEach((step, idx) => {
    expect(step.stepIndex).toBe(idx);
    for (const hIdx of step.highlightedIndices) {
      expect(hIdx).toBeGreaterThanOrEqual(0);
      expect(hIdx).toBeLessThan(nums.length);
    }
    for (const highlight of step.visualState.highlights) {
      expect(highlight.index).toBeGreaterThanOrEqual(0);
      expect(highlight.index).toBeLessThan(nums.length);
    }
  });

  // Final step must be terminal and match found status
  const lastStep = trace.steps[trace.steps.length - 1];
  expect(lastStep.isTerminal).toBe(true);

  if (expectedFound) {
    expect(trace.result).not.toBeNull();
    const [i, j] = trace.result!;
    expect(i).not.toBe(j);
    expect(i).toBeGreaterThanOrEqual(0);
    expect(i).toBeLessThan(nums.length);
    expect(j).toBeGreaterThanOrEqual(0);
    expect(j).toBeLessThan(nums.length);
    expect(nums[i] + nums[j]).toBe(target);
    expect(lastStep.visualState.status).toBe('found');
    expect(lastStep.visualState.foundPair).toEqual([i, j]);
  } else {
    expect(trace.result).toBeNull();
    expect(lastStep.visualState.status).toBe('not-found');
    expect(lastStep.visualState.foundPair).toBeNull();
  }
}

const DOC_TEST_CASES: { label: string; input: TwoSumInput; exactPair?: [number, number] }[] = [
  { label: 'classic [2,7,11,15], target 9', input: { nums: [2, 7, 11, 15], target: 9 }, exactPair: [0, 1] },
  { label: 'duplicates [3,3], target 6', input: { nums: [3, 3], target: 6 }, exactPair: [0, 1] },
  { label: 'negatives [-3,4,3,90], target 0', input: { nums: [-3, 4, 3, 90], target: 0 }, exactPair: [0, 2] },
  { label: 'not found [1,2,3], target 100', input: { nums: [1, 2, 3], target: 100 } },
  { label: 'empty [], target 5', input: { nums: [], target: 5 } },
  { label: 'single element [1], target 2', input: { nums: [1], target: 2 } },
  { label: 'multiple duplicate pairs [2,2,2], target 4', input: { nums: [2, 2, 2], target: 4 } },
  { label: 'self-match guard [3,2,4], target 6', input: { nums: [3, 2, 4], target: 6 }, exactPair: [1, 2] },
  { label: 'zeros [0,4,3,0], target 0', input: { nums: [0, 4, 3, 0], target: 0 }, exactPair: [0, 3] },
];

describe('Two Sum deterministic trace generators', () => {
  describe.each([
    { name: 'Brute Force', fn: generateBruteForceTwoSumTrace },
    { name: 'Hash Map', fn: generateHashMapTwoSumTrace },
  ])('$name generator', ({ fn }) => {
    it.each(DOC_TEST_CASES)('satisfies correctness & invariants for $label', ({ input, exactPair }) => {
      const trace = fn(input);
      assertTraceInvariants(trace);

      if (exactPair) {
        expect(trace.result).toEqual(exactPair);
      }
    });

    it('produces immutable snapshots that do not share mutable references across steps', () => {
      const trace = fn({ nums: [1, 5, 3, 7], target: 10 });
      expect(trace.steps.length).toBeGreaterThan(2);

      // Mutate step 0's arrays/objects and confirm step 1 is unaffected
      const step0 = trace.steps[0];
      const step1 = trace.steps[1];
      const originalNums = [...step1.visualState.nums];

      step0.visualState.nums[0] = 9999;
      step0.visualState.highlights.push({ index: 0, role: 'match', label: 'mutated' });

      expect(step1.visualState.nums).toEqual(originalNums);
      expect(step1.visualState.highlights.some((h) => h.label === 'mutated')).toBe(false);
    });
  });

  it('Hash Map checks complement before inserting current element (never matches self)', () => {
    const trace = generateHashMapTwoSumTrace({ nums: [3, 2, 4], target: 6 });
    expect(trace.found).toBe(true);
    expect(trace.result).toEqual([1, 2]);

    // Step 0 inspects i=0 (3), complement 3 — map must be empty so no self-match occurs
    expect(trace.steps[0].action).toBe('lookup-miss');
    expect(trace.steps[0].visualState.hashMap).toEqual([]);
  });
});

describe('Two Sum custom input validation', () => {
  it('parses valid comma, space, bracketed, negative, and empty inputs', () => {
    expect(parseAndValidateTwoSumInput('2, 7, 11, 15', '9')).toEqual({
      ok: true,
      value: { nums: [2, 7, 11, 15], target: 9 },
    });

    expect(parseAndValidateTwoSumInput('[-3, 4, 3, 90]', '0')).toEqual({
      ok: true,
      value: { nums: [-3, 4, 3, 90], target: 0 },
    });

    expect(parseAndValidateTwoSumInput('', '5')).toEqual({
      ok: true,
      value: { nums: [], target: 5 },
    });

    expect(parseAndValidateTwoSumInput('[]', '5')).toEqual({
      ok: true,
      value: { nums: [], target: 5 },
    });
  });

  it('rejects invalid numbers, empty target, decimals, and oversized arrays', () => {
    expect(parseAndValidateTwoSumInput('2, abc, 7', '9').ok).toBe(false);
    expect(parseAndValidateTwoSumInput('2, 7.5', '9').ok).toBe(false);
    expect(parseAndValidateTwoSumInput('2, 7', '').ok).toBe(false);
    expect(parseAndValidateTwoSumInput('2, 7', '9.2').ok).toBe(false);

    const tooMany = Array.from({ length: MAX_ARRAY_LENGTH + 1 }, (_, i) => i).join(', ');
    expect(parseAndValidateTwoSumInput(tooMany, '5').ok).toBe(false);
  });
});
