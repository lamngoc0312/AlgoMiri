import type { LearningSession } from './types';
import { sanitizeActiveStudySeconds } from './studyTimer';

/**
 * Matches LearningRepository's local retention cap (100 recent sessions).
 * Used to label streak statistics honestly as observed within retained local history.
 */
export const RETAINED_HISTORY_LIMIT = 100;
export const DEFAULT_HEATMAP_WEEKS = 52;

export type HeatmapIntensity = 0 | 1 | 2 | 3 | 4;

export interface DailyActivityRecord {
  /** Local calendar date key in YYYY-MM-DD format (user's local timezone). */
  dateKey: string;
  eligibleSessionCount: number;
  /** Sum of known active study seconds across eligible sessions on this date, or null if none recorded. */
  activeStudySeconds: number | null;
  problemIds: string[];
}

export interface HeatmapDayCell {
  dateKey: string;
  eligibleSessionCount: number;
  activeStudySeconds: number | null;
  intensity: HeatmapIntensity;
  isToday: boolean;
  isFuture: boolean;
}

export interface HeatmapMonthLabel {
  /** Zero-based week column index where this month starts. */
  weekIndex: number;
  year: number;
  monthIndex: number;
}

export interface StudyActivitySummary {
  /** User's local calendar date key for "today" when computed. */
  todayDateKey: string;
  /** Unique local calendar dates with >= 1 eligible practice session (ascending). */
  activeDateKeys: string[];
  /** Per-date eligible activity map keyed by YYYY-MM-DD. */
  activityByDate: Record<string, DailyActivityRecord>;
  /** Current consecutive eligible days ending today or yesterday (0 otherwise). */
  currentStreak: number;
  /** Longest consecutive run of eligible days observed within retained local records. */
  longestObservedStreak: number;
  /** True when the learner has at least one eligible practice session today. */
  practicedToday: boolean;
  /** True when currentStreak > 0 from yesterday, waiting for today's practice. */
  practicedYesterdayOnly: boolean;
  /** Total eligible active days inside the displayed heatmap window. */
  totalActiveDaysInRange: number;
  /** Total unique eligible active days across all retained local sessions. */
  totalObservedActiveDays: number;
  /** Total deduplicated eligible practice sessions across retained local records. */
  totalEligibleSessions: number;
  /** 52-week grid of columns (each column has 7 Sunday-to-Saturday cells). */
  weeks: HeatmapDayCell[][];
  /** Month labels aligned to week column starts. */
  monthLabels: HeatmapMonthLabel[];
  /** True when retained history has reached or exceeded the 100-session local cap. */
  isRetentionCapped: boolean;
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

/**
 * Formats a Date into a local calendar date key `YYYY-MM-DD`.
 * Never uses `toISOString().slice(0, 10)` so late-night / timezone-shifted sessions
 * are attributed accurately to the learner's local calendar day.
 */
export function toLocalDateKey(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

/**
 * Parses a `YYYY-MM-DD` date key into a local Date anchored at 12:00 noon.
 * Anchoring at local noon prevents Daylight Saving Time (23h/25h) transitions
 * from shifting calendar days when adding or subtracting days.
 */
export function parseLocalDateKey(dateKey: string): Date {
  const [y, m, d] = dateKey.split('-').map(Number);
  return new Date(y, m - 1, d, 12, 0, 0, 0);
}

/**
 * Adds `deltaDays` calendar days to a `YYYY-MM-DD` date key safely across
 * month boundaries, year boundaries, leap days (Feb 29), and DST transitions.
 */
export function addCalendarDays(dateKey: string, deltaDays: number): string {
  const base = parseLocalDateKey(dateKey);
  base.setDate(base.getDate() + deltaDays);
  return toLocalDateKey(base);
}

/**
 * Determines whether a saved verified Studio session contains genuine practice evidence.
 *
 * Eligible:
 * - Genuine guided-stage attempt (not viewed-only / skipped-without-attempt)
 * - Genuine prediction checkpoint attempt (`questionsAttempted > 0` or non-viewed attempt)
 * - Completed guided stage supported by a valid attempt
 *
 * Excluded:
 * - Viewed-only sessions (`outcome === 'viewed-only'`)
 * - Passive playback or opening Studio without practice
 * - Skipping every stage and prediction without attempting
 */
export function isEligiblePracticeSession(session: LearningSession): boolean {
  if (session.outcome === 'viewed-only') {
    return false;
  }

  const hasGenuineAttemptRecord = session.attempts.some(
    (attempt) =>
      (attempt.source === 'guided-stage' ||
        attempt.source === 'trace-prediction') &&
      attempt.evidenceLevel !== 'viewed',
  );
  if (hasGenuineAttemptRecord) {
    return true;
  }

  const hasPredictionAttempt =
    session.predictionSummary.questionsAttempted > 0;
  if (hasPredictionAttempt) {
    return true;
  }

  const hasGuidedStageActivity =
    session.completedStagesCount > 0 || session.attemptedStagesCount > 0;
  if (hasGuidedStageActivity) {
    // Guard against malformed records where every stage is only viewed or skipped-without-attempt
    const statuses = Object.values(session.stageStatuses);
    const hasNonSkippedAttempt = statuses.some(
      (s) =>
        s === 'completed' ||
        s === 'attempted' ||
        s === 'skipped-after-attempt',
    );
    if (hasNonSkippedAttempt) {
      return true;
    }
  }

  return false;
}

function intensityForSessionCount(count: number): HeatmapIntensity {
  if (count <= 0) return 0;
  if (count === 1) return 1;
  if (count === 2) return 2;
  if (count === 3) return 3;
  return 4;
}

/**
 * Pure, deterministic daily learning activity, streak, and 52-week heatmap aggregator.
 *
 * Session date rule:
 * Each eligible verified Studio session counts on the **local calendar date of its
 * `completedAt` timestamp**. Cross-midnight sessions count consistently on their
 * completion date. Invalid or future-dated timestamps are ignored.
 */
export function aggregateStudyActivity(
  sessions: LearningSession[],
  options: {
    now?: Date;
    weeksCount?: number;
  } = {},
): StudyActivitySummary {
  const now = options.now ?? new Date();
  const weeksCount = Math.max(1, options.weeksCount ?? DEFAULT_HEATMAP_WEEKS);
  const todayDateKey = toLocalDateKey(now);

  // 1. Deduplicate by stable sessionId (preserving latest completedAt if duplicated)
  const dedupedById = new Map<string, LearningSession>();
  for (const session of sessions) {
    if (!session.sessionId) continue;
    const prev = dedupedById.get(session.sessionId);
    if (!prev || session.completedAt.localeCompare(prev.completedAt) >= 0) {
      dedupedById.set(session.sessionId, session);
    }
  }
  const uniqueSessions = Array.from(dedupedById.values());

  // 2. Group eligible sessions by local calendar completion date, rejecting invalid/future timestamps
  const dateBuckets = new Map<
    string,
    {
      count: number;
      activeSecondsSum: number;
      timedCount: number;
      problemIds: Set<string>;
    }
  >();
  let totalEligibleSessions = 0;

  for (const session of uniqueSessions) {
    if (!isEligiblePracticeSession(session)) continue;
    const completedDate = new Date(session.completedAt);
    if (Number.isNaN(completedDate.getTime())) continue;
    // Reject timestamps later than actual current time (even on the same local calendar date)
    if (completedDate.getTime() > now.getTime()) continue;

    const dateKey = toLocalDateKey(completedDate);
    // Reject future-dated calendar keys so clock skew cannot inflate streaks
    if (dateKey > todayDateKey) continue;

    totalEligibleSessions += 1;
    const bucket = dateBuckets.get(dateKey) ?? {
      count: 0,
      activeSecondsSum: 0,
      timedCount: 0,
      problemIds: new Set<string>(),
    };
    bucket.count += 1;
    bucket.problemIds.add(session.problemId);
    const cleanSeconds = sanitizeActiveStudySeconds(session.activeStudySeconds);
    if (cleanSeconds !== undefined) {
      bucket.activeSecondsSum += cleanSeconds;
      bucket.timedCount += 1;
    }
    dateBuckets.set(dateKey, bucket);
  }

  const activeDateKeys = Array.from(dateBuckets.keys()).sort();
  const activityByDate: Record<string, DailyActivityRecord> = {};
  for (const dateKey of activeDateKeys) {
    const bucket = dateBuckets.get(dateKey)!;
    activityByDate[dateKey] = {
      dateKey,
      eligibleSessionCount: bucket.count,
      activeStudySeconds:
        bucket.timedCount > 0 ? bucket.activeSecondsSum : null,
      problemIds: Array.from(bucket.problemIds),
    };
  }

  // 3. Longest observed streak across retained eligible dates
  let longestObservedStreak = 0;
  let runningStreak = 0;
  let previousDateKey: string | null = null;
  for (const dateKey of activeDateKeys) {
    if (
      previousDateKey !== null &&
      dateKey === addCalendarDays(previousDateKey, 1)
    ) {
      runningStreak += 1;
    } else {
      runningStreak = 1;
    }
    if (runningStreak > longestObservedStreak) {
      longestObservedStreak = runningStreak;
    }
    previousDateKey = dateKey;
  }

  // 4. Current study streak (today, or preserved through yesterday until today ends)
  const activeDateSet = new Set(activeDateKeys);
  const yesterdayDateKey = addCalendarDays(todayDateKey, -1);
  const practicedToday = activeDateSet.has(todayDateKey);
  const practicedYesterdayOnly =
    !practicedToday && activeDateSet.has(yesterdayDateKey);

  let currentStreak = 0;
  if (practicedToday || practicedYesterdayOnly) {
    let cursor = practicedToday ? todayDateKey : yesterdayDateKey;
    while (activeDateSet.has(cursor)) {
      currentStreak += 1;
      cursor = addCalendarDays(cursor, -1);
    }
  }

  // 5. Build 52-week Sunday..Saturday calendar grid ending on the week containing today
  const todayLocal = parseLocalDateKey(todayDateKey);
  const todayDayOfWeek = todayLocal.getDay(); // 0 = Sun, 6 = Sat
  const currentWeekSunday = addCalendarDays(todayDateKey, -todayDayOfWeek);
  const gridStartDateKey = addCalendarDays(
    currentWeekSunday,
    -(weeksCount - 1) * 7,
  );

  const weeks: HeatmapDayCell[][] = [];
  const monthLabels: HeatmapMonthLabel[] = [];
  let totalActiveDaysInRange = 0;
  let lastLabeledMonth = -1;

  for (let weekIdx = 0; weekIdx < weeksCount; weekIdx += 1) {
    const column: HeatmapDayCell[] = [];
    for (let dayIdx = 0; dayIdx < 7; dayIdx += 1) {
      const dateKey = addCalendarDays(gridStartDateKey, weekIdx * 7 + dayIdx);
      const isFuture = dateKey > todayDateKey;
      const record = !isFuture ? activityByDate[dateKey] : undefined;
      const count = record?.eligibleSessionCount ?? 0;
      if (count > 0) {
        totalActiveDaysInRange += 1;
      }

      const cellDate = parseLocalDateKey(dateKey);
      if (dayIdx === 0 && !isFuture) {
        const m = cellDate.getMonth();
        const prevLabel = monthLabels[monthLabels.length - 1];
        if (m !== lastLabeledMonth) {
          // Avoid overlapping adjacent month labels when week 0 has only a few days of the prior month
          if (prevLabel && weekIdx - prevLabel.weekIndex < 3) {
            monthLabels.pop();
          }
          monthLabels.push({
            weekIndex: weekIdx,
            year: cellDate.getFullYear(),
            monthIndex: m,
          });
          lastLabeledMonth = m;
        }
      }

      column.push({
        dateKey,
        eligibleSessionCount: count,
        activeStudySeconds: record?.activeStudySeconds ?? null,
        intensity: isFuture ? 0 : intensityForSessionCount(count),
        isToday: dateKey === todayDateKey,
        isFuture,
      });
    }
    weeks.push(column);
  }

  return {
    todayDateKey,
    activeDateKeys,
    activityByDate,
    currentStreak,
    longestObservedStreak,
    practicedToday,
    practicedYesterdayOnly,
    totalActiveDaysInRange,
    totalObservedActiveDays: activeDateKeys.length,
    totalEligibleSessions,
    weeks,
    monthLabels,
    isRetentionCapped: uniqueSessions.length >= RETAINED_HISTORY_LIMIT,
  };
}
