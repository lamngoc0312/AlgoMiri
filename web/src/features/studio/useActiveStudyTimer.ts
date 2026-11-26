import { useCallback, useEffect, useRef } from 'react';
import {
  ActiveStudyTimer,
  DEFAULT_INACTIVITY_TIMEOUT_MS,
} from '../../domain/learning/studyTimer';

const MEANINGFUL_ACTIVITY_EVENTS: ReadonlyArray<keyof WindowEventMap> = [
  'pointerdown',
  'keydown',
  'wheel',
  'touchstart',
  'change',
  'submit',
];

export interface UseActiveStudyTimerOptions {
  /** Stable session identifier; timer resets only when this changes. */
  sessionKey: string;
  /** External pause gate (e.g., waiting for an AI Tutor response). */
  paused?: boolean;
  /** Optional inactivity timeout override (primarily for tests). */
  inactivityTimeoutMs?: number;
}

export interface ActiveStudyTimerHandle {
  getActiveStudySeconds: () => number;
  getActiveStudyMs: () => number;
}

function getInitialVisibility(): boolean {
  if (typeof document === 'undefined') return true;
  return document.visibilityState !== 'hidden';
}

function getInitialFocus(): boolean {
  if (typeof document === 'undefined') return true;
  return typeof document.hasFocus === 'function' ? document.hasFocus() : true;
}

/**
 * Tracks estimated active study time for an active verified Learning Studio session.
 *
 * - Pauses automatically on tab hidden, window blur, external pause (e.g. AI loading),
 *   or 2 minutes without meaningful interaction (deliberately ignoring mousemove).
 * - Preserves accumulated time across language, strategy, and view-mode switches within
 *   the same `sessionKey`.
 * - Resets cleanly when `sessionKey` changes and removes all listeners on unmount.
 */
export function useActiveStudyTimer({
  sessionKey,
  paused = false,
  inactivityTimeoutMs = DEFAULT_INACTIVITY_TIMEOUT_MS,
}: UseActiveStudyTimerOptions): ActiveStudyTimerHandle {
  const timerRef = useRef<ActiveStudyTimer | null>(null);
  const currentKeyRef = useRef<string | null>(null);

  if (!timerRef.current) {
    timerRef.current = new ActiveStudyTimer({ inactivityTimeoutMs });
  }

  useEffect(() => {
    const timer = timerRef.current!;
    if (currentKeyRef.current !== sessionKey) {
      currentKeyRef.current = sessionKey;
      timer.reset(getInitialVisibility(), getInitialFocus());
    } else {
      timer.start(getInitialVisibility(), getInitialFocus());
    }
    timer.setPaused(paused);

    const handleVisibilityChange = () => {
      timer.setVisibility(document.visibilityState !== 'hidden');
    };
    const handleFocus = () => {
      timer.setFocus(true);
    };
    const handleBlur = () => {
      timer.setFocus(false);
    };
    const handleMeaningfulActivity = () => {
      timer.recordActivity();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);
    for (const eventName of MEANINGFUL_ACTIVITY_EVENTS) {
      window.addEventListener(eventName, handleMeaningfulActivity, {
        capture: true,
        passive: true,
      });
    }

    return () => {
      timer.stop();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
      for (const eventName of MEANINGFUL_ACTIVITY_EVENTS) {
        window.removeEventListener(eventName, handleMeaningfulActivity, {
          capture: true,
        });
      }
    };
    // Note: `paused` is synced in a separate effect below so toggling AI loading never resets listeners or elapsed time.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionKey, inactivityTimeoutMs]);

  useEffect(() => {
    timerRef.current?.setPaused(paused);
  }, [paused]);

  const getActiveStudySeconds = useCallback(
    () => timerRef.current?.getElapsedSeconds() ?? 0,
    [],
  );

  const getActiveStudyMs = useCallback(
    () => timerRef.current?.getElapsedMs() ?? 0,
    [],
  );

  return { getActiveStudySeconds, getActiveStudyMs };
}
