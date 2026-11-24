export interface SplitArrayInput {
  nums: number[];
  k: number;
}

export const MAX_SPLIT_ARRAY_LENGTH = 10;

export type SplitArrayValidationResult =
  | { ok: true; value: SplitArrayInput }
  | { ok: false; error: string };

const SIGNED_INT_PATTERN = /^[+-]?\d+$/;

export function parseAndValidateSplitArrayInput(
  numsText: string,
  kText: string,
): SplitArrayValidationResult {
  let cleanedNums = numsText.trim();
  if (cleanedNums.startsWith('[') && cleanedNums.endsWith(']')) {
    cleanedNums = cleanedNums.slice(1, -1).trim();
  }

  if (!cleanedNums) {
    return {
      ok: false,
      error:
        'Please enter at least 1 nonnegative integer for nums (for example: 7, 2, 5, 10, 8).',
    };
  }

  const rawTokens = cleanedNums
    .split(/[\s,]+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 0);

  if (rawTokens.length > MAX_SPLIT_ARRAY_LENGTH) {
    return {
      ok: false,
      error: `Please enter at most ${MAX_SPLIT_ARRAY_LENGTH} integers so the nested Binary Search + Greedy trace remains clear and easy to follow.`,
    };
  }

  const nums: number[] = [];
  let runningTotal = 0;

  for (const token of rawTokens) {
    if (!SIGNED_INT_PATTERN.test(token)) {
      return {
        ok: false,
        error: `"${token}" is not a valid whole integer. Use comma-separated nonnegative integers like 7, 2, 5, 10, 8.`,
      };
    }

    const value = Number(token);
    if (!Number.isSafeInteger(value)) {
      return {
        ok: false,
        error: `"${token}" exceeds JavaScript's safe integer range.`,
      };
    }

    if (value < 0) {
      return {
        ok: false,
        error: `Negative value ${value} is not allowed. Binary Search + Greedy partitioning relies on nonnegative numbers so adding an element never decreases a subarray sum.`,
      };
    }

    const nextTotal = runningTotal + value;
    if (!Number.isSafeInteger(nextTotal)) {
      return {
        ok: false,
        error:
          'The sum of nums exceeds the safe integer limit, which would risk overflow when computing search bounds.',
      };
    }
    runningTotal = nextTotal;
    nums.push(value);
  }

  const trimmedK = kText.trim();
  if (!trimmedK || !SIGNED_INT_PATTERN.test(trimmedK)) {
    return {
      ok: false,
      error: 'Please enter a valid whole integer for k (number of subarrays).',
    };
  }

  const k = Number(trimmedK);
  if (!Number.isSafeInteger(k)) {
    return {
      ok: false,
      error: 'Subarray count k must be a safe integer.',
    };
  }

  if (k < 1 || k > nums.length) {
    return {
      ok: false,
      error: `Subarray count k must satisfy 1 <= k <= nums.length (got k = ${k} for ${nums.length} element${nums.length === 1 ? '' : 's'}).`,
    };
  }

  return {
    ok: true,
    value: { nums, k },
  };
}

export function formatSplitArrayNums(nums: number[]): string {
  return nums.join(', ');
}
