import { useCallback, useEffect, useState } from 'react';

export interface PlaybackSpeedOption {
  value: number;
  label: string;
  delayMs: number;
}

export const PLAYBACK_SPEEDS: PlaybackSpeedOption[] = [
  { value: 0.5, label: '0.5×', delayMs: 1800 },
  { value: 1, label: '1×', delayMs: 1000 },
  { value: 1.5, label: '1.5×', delayMs: 650 },
  { value: 2, label: '2×', delayMs: 400 },
];

interface UseTracePlaybackOptions {
  totalSteps: number;
  resetKey: string;
}

export function useTracePlayback({
  totalSteps,
  resetKey,
}: UseTracePlaybackOptions) {
  const [stepIndex, setStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);

  // Reset playback state deterministically whenever strategy or input changes
  useEffect(() => {
    setStepIndex(0);
    setIsPlaying(false);
  }, [resetKey]);

  const maxIndex = Math.max(0, totalSteps - 1);
  const safeStepIndex = Math.min(stepIndex, maxIndex);

  useEffect(() => {
    if (!isPlaying) return undefined;

    if (safeStepIndex >= maxIndex) {
      setIsPlaying(false);
      return undefined;
    }

    const speedOption =
      PLAYBACK_SPEEDS.find((s) => s.value === speed) ?? PLAYBACK_SPEEDS[1];

    const timerId = window.setTimeout(() => {
      setStepIndex((prev) => {
        const next = Math.min(prev + 1, maxIndex);
        if (next >= maxIndex) {
          setIsPlaying(false);
        }
        return next;
      });
    }, speedOption.delayMs);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [isPlaying, safeStepIndex, maxIndex, speed]);

  const prev = useCallback(() => {
    setIsPlaying(false);
    setStepIndex((curr) => Math.max(0, curr - 1));
  }, []);

  const next = useCallback(() => {
    setIsPlaying(false);
    setStepIndex((curr) => Math.min(maxIndex, curr + 1));
  }, [maxIndex]);

  const pause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const play = useCallback(() => {
    if (totalSteps <= 1) return;
    setStepIndex((curr) => (curr >= maxIndex ? 0 : curr));
    setIsPlaying(true);
  }, [maxIndex, totalSteps]);

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, pause, play]);

  const reset = useCallback(() => {
    setIsPlaying(false);
    setStepIndex(0);
  }, []);

  const goToStep = useCallback(
    (index: number) => {
      setIsPlaying(false);
      const clamped = Math.max(0, Math.min(maxIndex, index));
      setStepIndex(clamped);
    },
    [maxIndex],
  );

  return {
    stepIndex: safeStepIndex,
    isPlaying,
    speed,
    setSpeed,
    prev,
    next,
    play,
    pause,
    togglePlay,
    reset,
    goToStep,
  };
}
