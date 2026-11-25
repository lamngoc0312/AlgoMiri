import type { TwoSumInput } from './types';

export const MAX_ARRAY_LENGTH = 12;

export type ValidationResult =
  | { ok: true; value: TwoSumInput }
  | {
      ok: false;
      error: string;
      code:
        | 'targetRequired'
        | 'targetWhole'
        | 'targetSafe'
        | 'arrayTooLong'
        | 'invalidInteger'
        | 'unsafeInteger';
      values?: Record<string, string | number>;
    };

const INTEGER_PATTERN = /^[+-]?\d+$/;

export function parseAndValidateTwoSumInput(
  numsText: string,
  targetText: string,
): ValidationResult {
  const trimmedTarget = targetText.trim();
  if (!trimmedTarget) {
    return {
      ok: false,
      code: 'targetRequired',
      error: 'Please enter an integer target value (for example: 9).',
    };
  }

  if (!INTEGER_PATTERN.test(trimmedTarget)) {
    return {
      ok: false,
      code: 'targetWhole',
      values: { value: trimmedTarget },
      error: `Target "${trimmedTarget}" must be a whole integer (no decimals or letters).`,
    };
  }

  const target = Number(trimmedTarget);
  if (!Number.isSafeInteger(target)) {
    return {
      ok: false,
      code: 'targetSafe',
      error: 'Target must be a safe finite integer.',
    };
  }

  // Allow optional surrounding brackets like "[2, 7, 11, 15]" or "[]"
  let cleanedNums = numsText.trim();
  if (cleanedNums.startsWith('[') && cleanedNums.endsWith(']')) {
    cleanedNums = cleanedNums.slice(1, -1).trim();
  }

  if (cleanedNums === '') {
    return {
      ok: true,
      value: { nums: [], target },
    };
  }

  const rawTokens = cleanedNums
    .split(/[\s,]+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 0);

  if (rawTokens.length > MAX_ARRAY_LENGTH) {
    return {
      ok: false,
      code: 'arrayTooLong',
      values: { max: MAX_ARRAY_LENGTH },
      error: `Please enter at most ${MAX_ARRAY_LENGTH} numbers so the visualization stays clear and smooth.`,
    };
  }

  const nums: number[] = [];
  for (const token of rawTokens) {
    if (!INTEGER_PATTERN.test(token)) {
      return {
        ok: false,
        code: 'invalidInteger',
        values: { value: token },
        error: `"${token}" is not a valid integer. Use comma-separated whole numbers like 2, 7, 11, 15.`,
      };
    }

    const parsed = Number(token);
    if (!Number.isSafeInteger(parsed)) {
      return {
        ok: false,
        code: 'unsafeInteger',
        values: { value: token },
        error: `"${token}" is outside the safe integer range.`,
      };
    }

    nums.push(parsed);
  }

  return {
    ok: true,
    value: { nums, target },
  };
}

export function formatNumsInput(nums: number[]): string {
  return nums.join(', ');
}
