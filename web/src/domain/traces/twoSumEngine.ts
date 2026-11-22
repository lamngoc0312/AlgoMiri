import { generateBruteForceTwoSumTrace } from './twoSumBruteForce';
import { generateHashMapTwoSumTrace } from './twoSumHashMap';
import type { TwoSumInput, TwoSumStrategyId, TwoSumTraceResult } from './types';

export interface TwoSumPreset {
  id: string;
  label: string;
  input: TwoSumInput;
}

export const DEFAULT_TWO_SUM_INPUT: TwoSumInput = {
  nums: [2, 7, 11, 15],
  target: 9,
};

export const TWO_SUM_PRESETS: TwoSumPreset[] = [
  {
    id: 'classic',
    label: 'Classic [2, 7, 11, 15]',
    input: { nums: [2, 7, 11, 15], target: 9 },
  },
  {
    id: 'duplicates',
    label: 'Duplicates [3, 3]',
    input: { nums: [3, 3], target: 6 },
  },
  {
    id: 'negatives',
    label: 'Negatives [-3, 4, 3, 90]',
    input: { nums: [-3, 4, 3, 90], target: 0 },
  },
  {
    id: 'no-solution',
    label: 'No Match [1, 2, 3]',
    input: { nums: [1, 2, 3], target: 100 },
  },
  {
    id: 'empty',
    label: 'Empty []',
    input: { nums: [], target: 5 },
  },
];

export function generateTwoSumTrace(
  strategyId: TwoSumStrategyId,
  input: TwoSumInput,
): TwoSumTraceResult {
  if (strategyId === 'brute-force') {
    return generateBruteForceTwoSumTrace(input);
  }
  return generateHashMapTwoSumTrace(input);
}
