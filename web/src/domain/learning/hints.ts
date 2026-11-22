import type { GuidedStageId } from './twoSumLesson';

export interface ProgressiveHint {
  level: 1 | 2 | 3;
  label: string;
  text: string;
}

export const STAGE_HINTS: Record<GuidedStageId, ProgressiveHint[]> = {
  understand: [
    {
      level: 1,
      label: 'Hint 1 · Conceptual Question',
      text: 'Read the rule about indices carefully: if an element appears once at index 0, can you pick index 0 twice?',
    },
    {
      level: 2,
      label: 'Hint 2 · Reasoning Guidance',
      text: 'A valid answer is a pair of two DIFFERENT positions (i != j). Duplicate values are allowed only when they sit at two separate indices.',
    },
    {
      level: 3,
      label: 'Hint 3 · Explicit Next Idea',
      text: 'In [3, 2, 4] with target 6, index 0 cannot pair with itself. Instead, check indices 1 and 2: nums[1] (2) + nums[2] (4) = 6.',
    },
  ],
  'discover-brute-force': [
    {
      level: 1,
      label: 'Hint 1 · Conceptual Question',
      text: 'If you have already tested all pairs involving index 0, do you ever need to test index 0 again when i moves to 1?',
    },
    {
      level: 2,
      label: 'Hint 2 · Reasoning Guidance',
      text: 'We need two things from our inner pointer j: never equal i, and never repeat an earlier pair like (1, 0) after checking (0, 1).',
    },
    {
      level: 3,
      label: 'Hint 3 · Explicit Next Idea',
      text: 'Start j at i + 1 and scan rightward to the end. That guarantees i < j, which automatically prevents self-matches and duplicate pair checks.',
    },
  ],
  'discover-optimization': [
    {
      level: 1,
      label: 'Hint 1 · Conceptual Question',
      text: 'Imagine nums = [3, 2, 4] and target = 6. What happens at i = 0 if you put 3 into the Seen Map before checking whether 6 - 3 is in the map?',
    },
    {
      level: 2,
      label: 'Hint 2 · Reasoning Guidance',
      text: 'The Seen Map should represent ONLY elements strictly to the left of index i when you perform the complement lookup.',
    },
    {
      level: 3,
      label: 'Hint 3 · Explicit Next Idea',
      text: 'Always check seen.has(target - nums[i]) BEFORE calling seen.set(nums[i], i). That guarantees any found index is strictly less than i.',
    },
  ],
  'build-solution': [
    {
      level: 1,
      label: 'Hint 1 · Conceptual Question',
      text: 'When you compute complement = target - nums[i], what piece of information do you already know, and what do you want the map to return?',
    },
    {
      level: 2,
      label: 'Hint 2 · Reasoning Guidance',
      text: 'A hash map gives O(1) lookup by KEY. Since we look up the complement number and need its array position, the key must be the number itself.',
    },
    {
      level: 3,
      label: 'Hint 3 · Explicit Next Idea',
      text: 'Store value → index in the map. Then for each i: compute complement, check if complement is in seen, return [seen[complement], i] if found, otherwise store seen[nums[i]] = i.',
    },
  ],
};
