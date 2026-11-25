import { useTranslation } from 'react-i18next';
import {
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  RotateCcw,
} from 'lucide-react';
import { PLAYBACK_SPEEDS } from './useTracePlayback';
import type { TraceStatus } from '../../domain/traces/types';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

interface PlaybackControlsProps {
  stepIndex: number;
  totalSteps: number;
  isPlaying: boolean;
  speed: number;
  status: TraceStatus;
  checkpointPaused?: boolean;
  maxAllowedStepIndex?: number;
  onPrev: () => void;
  onNext: () => void;
  onTogglePlay: () => void;
  onReset: () => void;
  onSpeedChange: (speed: number) => void;
  onSeek: (stepIndex: number) => void;
}

export function PlaybackControls({
  stepIndex,
  totalSteps,
  isPlaying,
  speed,
  status,
  checkpointPaused = false,
  maxAllowedStepIndex,
  onPrev,
  onNext,
  onTogglePlay,
  onReset,
  onSpeedChange,
  onSeek,
}: PlaybackControlsProps) {
  const { t } = useTranslation();

  const maxIndex = Math.max(0, totalSteps - 1);
  const effectiveMaxAllowed =
    maxAllowedStepIndex !== undefined
      ? Math.max(0, Math.min(maxIndex, maxAllowedStepIndex))
      : maxIndex;

  const isFirst = stepIndex === 0;
  const isLast = stepIndex >= maxIndex;
  const canPlay = totalSteps > 1;
  const isForwardBlocked =
    (checkpointPaused || stepIndex >= effectiveMaxAllowed) && !isLast;
  const progressPercent =
    maxIndex === 0 ? 100 : Math.round((stepIndex / maxIndex) * 100);

  const handleSliderChange = (nextValue: number) => {
    // Never allow forward seeking past the first unresolved guided checkpoint
    if (nextValue > effectiveMaxAllowed) {
      if (stepIndex < effectiveMaxAllowed) {
        onSeek(effectiveMaxAllowed);
      }
      return;
    }
    onSeek(nextValue);
  };

  const stepOfText = t('visualization.playback.stepOf', {
    current: stepIndex + 1,
    total: totalSteps,
  });

  return (
    <div
      aria-label={t('visualization.playback.regionLabel')}
      className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-subtle)] p-3.5 sm:p-4 space-y-3"
    >
      {/* Timeline & Step Counter */}
      <div className="space-y-1.5">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="font-mono font-semibold text-[var(--text-primary)]">
            {stepOfText}
          </span>
          <div className="flex items-center gap-2">
            {status === 'found' && (
              <Badge variant="mint">
                {t('visualization.playback.completedValid')}
              </Badge>
            )}
            {status === 'not-found' && (
              <Badge variant="amber">
                {t('visualization.playback.completedNotFound')}
              </Badge>
            )}
            {status === 'running' && (
              <span className="font-mono text-xs text-[var(--text-secondary)]">
                {progressPercent}%
              </span>
            )}
          </div>
        </div>

        <input
          type="range"
          min={0}
          max={maxIndex}
          value={stepIndex}
          disabled={maxIndex === 0}
          onChange={(e) => handleSliderChange(Number(e.target.value))}
          aria-label={t('visualization.playback.timelineLabel')}
          aria-valuetext={stepOfText}
          className="h-2 w-full cursor-pointer appearance-none rounded-full bg-[#DCE1F0] accent-[#397BDB] disabled:cursor-not-allowed disabled:opacity-60"
        />
      </div>

      {/* Transport Buttons & Speed Selector */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          role="group"
          aria-label={t('visualization.playback.transportLabel')}
          className="flex flex-wrap items-center gap-2"
        >
          <Button
            variant="outline"
            size="sm"
            onClick={onPrev}
            disabled={isFirst}
            aria-label={t('visualization.playback.previousAria')}
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">
              {t('visualization.playback.previous')}
            </span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={onTogglePlay}
            disabled={!canPlay || isForwardBlocked}
            aria-label={
              isPlaying
                ? t('visualization.playback.pauseAria')
                : t('visualization.playback.playAria')
            }
            aria-pressed={isPlaying}
            title={
              isForwardBlocked
                ? t('visualization.playback.blockedPlayTitle')
                : undefined
            }
          >
            {isPlaying ? (
              <>
                <Pause className="h-4 w-4" aria-hidden="true" />
                {t('visualization.playback.pause')}
              </>
            ) : (
              <>
                <Play className="h-4 w-4" aria-hidden="true" />
                {isLast && canPlay
                  ? t('visualization.playback.replay')
                  : t('visualization.playback.play')}
              </>
            )}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onNext}
            disabled={isLast || isForwardBlocked}
            aria-label={t('visualization.playback.nextAria')}
            title={
              isForwardBlocked
                ? t('visualization.playback.blockedNextTitle')
                : undefined
            }
          >
            <span className="hidden sm:inline">
              {t('visualization.playback.next')}
            </span>
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            disabled={isFirst && !isPlaying}
            aria-label={t('visualization.playback.resetAria')}
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">
              {t('visualization.playback.reset')}
            </span>
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <label
            htmlFor="playback-speed"
            className="text-sm font-semibold text-[var(--text-secondary)]"
          >
            {t('visualization.playback.speed')}
          </label>
          <select
            id="playback-speed"
            value={speed}
            onChange={(e) => onSpeedChange(Number(e.target.value))}
            aria-label={t('visualization.playback.speedAria')}
            className="h-9 rounded-xl border border-[var(--border-control)] bg-[var(--surface-card)] px-2.5 font-mono text-sm font-semibold text-[var(--text-primary)] focus:border-[#397BDB] focus:outline-none cursor-pointer"
          >
            {PLAYBACK_SPEEDS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isForwardBlocked && (
        <p className="text-sm font-medium text-[var(--accent-amber-text)]">
          {t('visualization.playback.checkpointActiveBanner')}
        </p>
      )}
    </div>
  );
}
