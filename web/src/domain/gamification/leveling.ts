/**
 * Centralized, deterministic Level progression module for AlgoMiri (Phase 8A.1).
 *
 * Progression curve:
 * - Every learner starts at Level 1 with 0 XP.
 * - XP required to advance from Level L to Level L + 1:
 *     step(L) = 100 + (L - 1) * 50
 *     (Lv 1 -> 2: 100 XP, Lv 2 -> 3: 150 XP, Lv 3 -> 4: 200 XP, Lv 4 -> 5: 250 XP, ...)
 * - Cumulative XP threshold to reach Level L:
 *     totalXpForLevel(L) = 25 * (L - 1) * (L + 2)
 *     (Lv 1: 0, Lv 2: 100, Lv 3: 250, Lv 4: 450, Lv 5: 700, Lv 6: 1000, ...)
 *
 * Computed in O(1) time with exact boundary verification so large XP values
 * and malformed inputs are always handled safely without loops or drift.
 */

export const LEVEL_BASE_STEP_XP = 100;
export const LEVEL_STEP_INCREMENT_XP = 50;
export const MAX_SAFE_TRACKED_XP = 1_000_000_000;

export interface LevelProgress {
  /** Current learner level (integer >= 1). */
  level: number;
  /** Sanitized total earned XP (integer >= 0). */
  totalXp: number;
  /** Cumulative XP threshold at the start of the current level. */
  currentLevelFloorXp: number;
  /** Cumulative XP threshold required to reach the next level. */
  nextLevelThresholdXp: number;
  /** XP earned within the current level toward the next level. */
  xpIntoLevel: number;
  /** Total XP span required to advance from current level to next level. */
  xpForNextLevel: number;
  /** Remaining XP needed to reach the next level (always >= 1). */
  xpRemainingToNextLevel: number;
  /** Integer percentage (0..100) of progress within the current level. */
  progressPercent: number;
}

/**
 * Sanitizes arbitrary numeric input into a safe non-negative integer XP value.
 * Handles negative numbers, NaN, Infinity, floats, and oversized values.
 */
export function sanitizeXp(rawXp: number): number {
  if (typeof rawXp !== 'number' || !Number.isFinite(rawXp) || rawXp <= 0) {
    return 0;
  }
  return Math.min(Math.floor(rawXp), MAX_SAFE_TRACKED_XP);
}

/**
 * XP span required to advance from `level` to `level + 1`.
 */
export function xpRequiredForLevelStep(level: number): number {
  const safeLevel =
    typeof level === 'number' && Number.isFinite(level) && level >= 1
      ? Math.floor(level)
      : 1;
  return LEVEL_BASE_STEP_XP + (safeLevel - 1) * LEVEL_STEP_INCREMENT_XP;
}

/**
 * Cumulative XP required to reach `level` (Level 1 starts at 0 XP).
 */
export function totalXpForLevel(level: number): number {
  const safeLevel =
    typeof level === 'number' && Number.isFinite(level) && level >= 1
      ? Math.floor(level)
      : 1;
  return (LEVEL_STEP_INCREMENT_XP / 2) * (safeLevel - 1) * (safeLevel + 2);
}

/**
 * Computes full level progression details for a given total XP value.
 */
export function getLevelProgress(rawTotalXp: number): LevelProgress {
  const totalXp = sanitizeXp(rawTotalXp);

  // Solve 25 * (L - 1) * (L + 2) <= totalXp => L^2 + L - (2 + totalXp / 25) <= 0
  // Positive root: (-1 + sqrt(9 + 4 * totalXp / 25)) / 2
  const approxLevel = Math.max(
    1,
    Math.floor((-1 + Math.sqrt(9 + (4 * totalXp) / 25)) / 2),
  );

  let level = approxLevel;
  // Exact integer boundary adjustments (eliminates any floating-point rounding drift)
  while (totalXp >= totalXpForLevel(level + 1)) {
    level += 1;
  }
  while (level > 1 && totalXp < totalXpForLevel(level)) {
    level -= 1;
  }

  const currentLevelFloorXp = totalXpForLevel(level);
  const xpForNextLevel = xpRequiredForLevelStep(level);
  const nextLevelThresholdXp = currentLevelFloorXp + xpForNextLevel;
  const xpIntoLevel = totalXp - currentLevelFloorXp;
  const xpRemainingToNextLevel = Math.max(1, nextLevelThresholdXp - totalXp);
  const progressPercent = Math.min(
    100,
    Math.max(0, Math.floor((xpIntoLevel / xpForNextLevel) * 100)),
  );

  return {
    level,
    totalXp,
    currentLevelFloorXp,
    nextLevelThresholdXp,
    xpIntoLevel,
    xpForNextLevel,
    xpRemainingToNextLevel,
    progressPercent,
  };
}
