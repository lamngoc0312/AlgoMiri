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
  onPrev,
  onNext,
  onTogglePlay,
  onReset,
  onSpeedChange,
  onSeek,
}: PlaybackControlsProps) {
  const maxIndex = Math.max(0, totalSteps - 1);
  const isFirst = stepIndex === 0;
  const isLast = stepIndex >= maxIndex;
  const canPlay = totalSteps > 1;
  const isForwardBlocked = checkpointPaused && !isLast;
  const progressPercent =
    maxIndex === 0 ? 100 : Math.round((stepIndex / maxIndex) * 100);

  const handleSliderChange = (nextValue: number) => {
    // Prevent timeline from bypassing an unanswered guided prediction checkpoint
    if (isForwardBlocked && nextValue > stepIndex) {
      return;
    }
    onSeek(nextValue);
  };

  return (
    <div
      aria-label="Trace playback controls"
      className="rounded-2xl border border-[#E3E7F2] bg-[#F7F8FC] p-3.5 sm:p-4 space-y-3"
    >
      {/* Timeline & Step Counter */}
      <div className="space-y-1.5">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="font-mono font-semibold text-[#20253B]">
            Step {stepIndex + 1} of {totalSteps}
          </span>
          <div className="flex items-center gap-2">
            {status === 'found' && <Badge variant="mint">Completed · Valid</Badge>}
            {status === 'not-found' && (
              <Badge variant="amber">Completed · Not Found / Invalid</Badge>
            )}
            {status === 'running' && (
              <span className="font-mono text-[11px] text-[#555D7A]">
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
          aria-label="Trace step timeline"
          aria-valuetext={`Step ${stepIndex + 1} of ${totalSteps}`}
          className="h-2 w-full cursor-pointer appearance-none rounded-full bg-[#DCE1F0] accent-[#645BE8] disabled:cursor-not-allowed disabled:opacity-60"
        />
      </div>

      {/* Transport Buttons & Speed Selector */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          role="group"
          aria-label="Step transport controls"
          className="flex flex-wrap items-center gap-2"
        >
          <Button
            variant="outline"
            size="sm"
            onClick={onPrev}
            disabled={isFirst}
            aria-label="Previous step"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">Prev</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={onTogglePlay}
            disabled={!canPlay || isForwardBlocked}
            aria-label={isPlaying ? 'Pause trace' : 'Play trace'}
            aria-pressed={isPlaying}
            title={
              isForwardBlocked
                ? 'Answer or click Skip & Reveal below to continue playback'
                : undefined
            }
          >
            {isPlaying ? (
              <>
                <Pause className="h-4 w-4" aria-hidden="true" />
                Pause
              </>
            ) : (
              <>
                <Play className="h-4 w-4" aria-hidden="true" />
                {isLast && canPlay ? 'Replay' : 'Play'}
              </>
            )}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onNext}
            disabled={isLast || isForwardBlocked}
            aria-label="Next step"
            title={
              isForwardBlocked
                ? 'Answer or click Skip & Reveal below to advance past this checkpoint'
                : undefined
            }
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            disabled={isFirst && !isPlaying}
            aria-label="Reset trace"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">Reset</span>
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <label
            htmlFor="playback-speed"
            className="text-xs font-semibold text-[#555D7A]"
          >
            Speed
          </label>
          <select
            id="playback-speed"
            value={speed}
            onChange={(e) => onSpeedChange(Number(e.target.value))}
            aria-label="Playback speed"
            className="h-9 rounded-xl border border-[#D7DCEB] bg-white px-2.5 font-mono text-xs font-semibold text-[#20253B] focus:border-[#645BE8] focus:outline-none cursor-pointer"
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
        <p className="text-[11px] font-medium text-[#9A630A]">
          Checkpoint active — answer the prediction below or click Skip &amp; Reveal Next Step to advance.
        </p>
      )}
    </div>
  );
}
