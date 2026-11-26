import type { TFunction } from 'i18next';

/**
 * Pause counting after 2 minutes without meaningful learner interaction.
 * Prevents unattended tabs, idle screens, or unattended autoplay from inflating study time.
 */
export const DEFAULT_INACTIVITY_TIMEOUT_MS = 120_000;

/**
 * Sanity cap per saved Studio session (4 hours = 14,400 seconds).
 * Protects statistics against clock glitches, corrupted storage, or implausible values.
 */
export const MAX_SESSION_ACTIVE_DURATION_SECONDS = 4 * 60 * 60;
export const MAX_SESSION_ACTIVE_DURATION_MS =
  MAX_SESSION_ACTIVE_DURATION_SECONDS * 1000;

export interface ActiveStudyTimerOptions {
  /** Monotonic clock in milliseconds (defaults to performance.now). */
  now?: () => number;
  /** Inactivity timeout in milliseconds (defaults to 2 minutes). */
  inactivityTimeoutMs?: number;
  /** Upper bound for a single session in milliseconds (defaults to 4 hours). */
  maxDurationMs?: number;
}

/**
 * Pure, monotonic active study-time tracker for a single verified Learning Studio session.
 *
 * Active time accumulates ONLY when all four conditions hold:
 * 1. The browser tab is visible (`isVisible === true`)
 * 2. The browser window has focus (`isFocused === true`)
 * 3. External pause gates are clear (`isPaused === false`, e.g., not waiting for an AI reply)
 * 4. A meaningful learner interaction occurred within `inactivityTimeoutMs` (2 minutes)
 *
 * Resulting durations are honest *estimated* active study time, never exact proof of attention.
 */
export class ActiveStudyTimer {
  private readonly now: () => number;
  private readonly inactivityTimeoutMs: number;
  private readonly maxDurationMs: number;

  private isVisible = false;
  private isFocused = false;
  private isPaused = false;
  private isStopped = false;
  private isIdle = false;

  private accumulatedMs = 0;
  private startedSegmentAt: number | null = null;
  private lastActivityAt: number;

  constructor(options: ActiveStudyTimerOptions = {}) {
    this.now =
      options.now ??
      (() =>
        typeof performance !== 'undefined' ? performance.now() : Date.now());
    this.inactivityTimeoutMs = Math.max(
      1_000,
      options.inactivityTimeoutMs ?? DEFAULT_INACTIVITY_TIMEOUT_MS,
    );
    this.maxDurationMs = Math.max(
      1_000,
      options.maxDurationMs ?? MAX_SESSION_ACTIVE_DURATION_MS,
    );
    this.lastActivityAt = this.now();
  }

  private flush(currentTime = this.now()): void {
    if (this.startedSegmentAt === null) {
      if (currentTime - this.lastActivityAt >= this.inactivityTimeoutMs) {
        this.isIdle = true;
      }
      return;
    }

    const idleDeadline = this.lastActivityAt + this.inactivityTimeoutMs;
    const effectiveEnd = Math.min(currentTime, idleDeadline);
    const delta = Math.max(0, effectiveEnd - this.startedSegmentAt);

    this.accumulatedMs = Math.min(
      this.maxDurationMs,
      this.accumulatedMs + delta,
    );

    if (currentTime >= idleDeadline) {
      this.startedSegmentAt = null;
      this.isIdle = true;
    } else {
      this.startedSegmentAt = currentTime;
    }
  }

  private syncRunningState(currentTime = this.now()): void {
    if (
      !this.isStopped &&
      this.isVisible &&
      this.isFocused &&
      !this.isPaused &&
      !this.isIdle
    ) {
      if (this.startedSegmentAt === null) {
        this.startedSegmentAt = currentTime;
      }
    } else {
      this.startedSegmentAt = null;
    }
  }

  start(initialVisible: boolean, initialFocused: boolean): void {
    const t = this.now();
    this.isStopped = false;
    this.isVisible = initialVisible;
    this.isFocused = initialFocused;
    this.isIdle = false;
    this.lastActivityAt = t;
    this.startedSegmentAt = null;
    this.syncRunningState(t);
  }

  recordActivity(): void {
    if (this.isStopped) return;
    const t = this.now();
    this.flush(t);
    this.lastActivityAt = t;
    this.isIdle = false;
    this.syncRunningState(t);
  }

  setVisibility(visible: boolean): void {
    if (this.isStopped) return;
    const t = this.now();
    this.flush(t);
    this.isVisible = visible;
    if (visible && this.isFocused && !this.isPaused && !this.isIdle) {
      this.startedSegmentAt = t;
    } else if (!visible) {
      this.startedSegmentAt = null;
    }
  }

  setFocus(focused: boolean): void {
    if (this.isStopped) return;
    const t = this.now();
    this.flush(t);
    this.isFocused = focused;
    if (focused && this.isVisible && !this.isPaused && !this.isIdle) {
      this.startedSegmentAt = t;
    } else if (!focused) {
      this.startedSegmentAt = null;
    }
  }

  setPaused(paused: boolean): void {
    if (this.isStopped) return;
    const t = this.now();
    this.flush(t);
    this.isPaused = paused;
    this.syncRunningState(t);
  }

  checkInactivity(): void {
    if (this.isStopped) return;
    this.flush(this.now());
  }

  isRunning(): boolean {
    this.flush(this.now());
    return this.startedSegmentAt !== null;
  }

  getElapsedMs(): number {
    if (!this.isStopped) {
      this.flush(this.now());
    }
    return Math.min(this.maxDurationMs, Math.max(0, Math.round(this.accumulatedMs)));
  }

  getElapsedSeconds(): number {
    return Math.min(
      MAX_SESSION_ACTIVE_DURATION_SECONDS,
      Math.max(0, Math.floor(this.getElapsedMs() / 1000)),
    );
  }

  reset(initialVisible: boolean, initialFocused: boolean): void {
    const t = this.now();
    this.accumulatedMs = 0;
    this.startedSegmentAt = null;
    this.isStopped = false;
    this.isVisible = initialVisible;
    this.isFocused = initialFocused;
    this.isIdle = false;
    this.lastActivityAt = t;
    this.syncRunningState(t);
  }

  stop(): void {
    if (this.isStopped) return;
    this.flush(this.now());
    this.startedSegmentAt = null;
    this.isStopped = true;
  }
}

/**
 * Validates and normalizes an optional active study duration in seconds.
 * Rejects NaN, Infinity, negatives, non-numbers, and implausibly large values (> 4 hours),
 * returning `undefined` so malformed or legacy missing values are treated as unknown.
 */
export function sanitizeActiveStudySeconds(value: unknown): number | undefined {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return undefined;
  }
  if (value < 0 || value > MAX_SESSION_ACTIVE_DURATION_SECONDS) {
    return undefined;
  }
  return Math.floor(value);
}

/**
 * Formats an optional active study duration in seconds into friendly localized EN/VI text.
 * Explicitly distinguishes `null`/`undefined` (unknown historical duration) from `0` seconds.
 */
export function formatStudyDuration(
  seconds: number | null | undefined,
  t: TFunction,
): string {
  const clean = sanitizeActiveStudySeconds(seconds);
  if (clean === undefined) {
    return t('studyTime.notRecorded');
  }
  if (clean < 60) {
    return t('studyTime.seconds', { count: clean });
  }
  const totalMinutes = Math.floor(clean / 60);
  if (totalMinutes < 60) {
    return t('studyTime.minutes', { count: totalMinutes });
  }
  const hours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;
  if (remainingMinutes === 0) {
    return t('studyTime.hours', { count: hours });
  }
  return t('studyTime.hoursMinutes', {
    hours: t('studyTime.hours', { count: hours }),
    minutes: t('studyTime.minutes', { count: remainingMinutes }),
  });
}
