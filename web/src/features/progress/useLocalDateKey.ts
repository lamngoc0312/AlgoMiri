import { useEffect, useState } from 'react';
import { toLocalDateKey } from '../../domain/learning/activityStreak';

/**
 * Tracks the learner's current local calendar date key (YYYY-MM-DD) and triggers
 * a recalculation when the local date rolls over (e.g., midnight or returning to
 * a browser tab left open overnight).
 */
export function useLocalDateKey(): string {
  const [dateKey, setDateKey] = useState<string>(() => toLocalDateKey(new Date()));

  useEffect(() => {
    const syncDateKey = () => {
      const next = toLocalDateKey(new Date());
      setDateKey((prev) => (prev === next ? prev : next));
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        syncDateKey();
      }
    };

    // Schedule a single one-shot timeout just after the next local midnight
    const now = new Date();
    const nextMidnight = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1,
      0,
      0,
      1,
      0,
    );
    const msUntilMidnight = Math.max(1_000, nextMidnight.getTime() - now.getTime());
    const timeoutId = window.setTimeout(syncDateKey, msUntilMidnight);

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', syncDateKey);

    return () => {
      window.clearTimeout(timeoutId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', syncDateKey);
    };
  }, [dateKey]);

  return dateKey;
}
