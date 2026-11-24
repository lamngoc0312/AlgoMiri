import {
  ArrowRight,
  CheckCircle2,
  Eye,
  GitBranch,
  Hash,
  SearchX,
  Sparkles,
} from 'lucide-react';
import type { SolutionGraph, SolutionStrategy } from '../../domain/problems/types';
import type { HighlightRole, TwoSumInput } from '../../domain/traces/types';
import type {
  ArrayHashVisualState,
  GenericExecutionStep,
  PredictionPrompt,
} from '../../domain/core/types';
import type { PredictionRecord } from '../../domain/learning/session';
import { getActiveNodeIdsForStep } from '../../domain/solutions/graphValidator';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { PredictNextStepCard } from '../guided/PredictNextStepCard';
import { CustomInputBar } from './CustomInputBar';
import { PlaybackControls } from './PlaybackControls';

interface VisualCanvasProps {
  sessionId: number;
  strategy: SolutionStrategy;
  currentInput: TwoSumInput;
  step: GenericExecutionStep<ArrayHashVisualState>;
  stepIndex: number;
  totalSteps: number;
  isPlaying: boolean;
  speed: number;
  solutionGraph: SolutionGraph;
  predictModeEnabled: boolean;
  predictionPrompt: PredictionPrompt | null;
  predictionRecord: PredictionRecord | undefined;
  checkpointPaused: boolean;
  maxAllowedStepIndex: number;
  onTogglePredictMode: () => void;
  onAnswerPrediction: (
    questionId: string,
    optionId: string,
    isCorrect: boolean,
  ) => void;
  onSkipPrediction: (questionId: string) => void;
  onApplyInput: (input: TwoSumInput) => void;
  onPrev: () => void;
  onNext: () => void;
  onTogglePlay: () => void;
  onReset: () => void;
  onSpeedChange: (speed: number) => void;
  onSeek: (stepIndex: number) => void;
  onOpenMacroView: () => void;
}

const ROLE_STYLES: Record<
  HighlightRole,
  { box: string; badge: string }
> = {
  current: {
    box: 'border-[#F1B34C] bg-[#FEF6E6] text-[#20253B] shadow-xs scale-[1.03]',
    badge: 'bg-[#F1B34C] text-[#20253B]',
  },
  partner: {
    box: 'border-[#645BE8] bg-[#EEF0FF] text-[#20253B] shadow-xs scale-[1.03]',
    badge: 'bg-[#645BE8] text-white',
  },
  match: {
    box: 'border-[#16B89D] bg-[#E6F8F4] text-[#0A594B] shadow-xs scale-[1.04]',
    badge: 'bg-[#16B89D] text-white',
  },
  visited: {
    box: 'border-[#C5CBE3] bg-[#F0F2F8] text-[#555D7A]',
    badge: 'bg-[#555D7A] text-white',
  },
};

export function VisualCanvas({
  sessionId,
  strategy,
  currentInput,
  step,
  stepIndex,
  totalSteps,
  isPlaying,
  speed,
  solutionGraph,
  predictModeEnabled,
  predictionPrompt,
  predictionRecord,
  checkpointPaused,
  maxAllowedStepIndex,
  onTogglePredictMode,
  onAnswerPrediction,
  onSkipPrediction,
  onApplyInput,
  onPrev,
  onNext,
  onTogglePlay,
  onReset,
  onSpeedChange,
  onSeek,
  onOpenMacroView,
}: VisualCanvasProps) {
  const { visualState } = step;

  const getHighlightForIndex = (index: number) =>
    visualState.highlights.find((h) => h.index === index);

  const activeNodeIds = getActiveNodeIdsForStep(solutionGraph, step);
  const activeNodes = solutionGraph.nodes.filter((n) =>
    activeNodeIds.includes(n.id),
  );

  return (
    <div className="flex flex-col gap-4">
      <Card className="overflow-hidden">
        <CardHeader className="border-b border-[#E3E7F2] bg-white">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-[#645BE8]" aria-hidden="true" />
              <CardTitle>Visual Execution Canvas</CardTitle>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="indigo">{strategy.shortLabel}</Badge>
              <button
                type="button"
                role="switch"
                aria-checked={predictModeEnabled}
                onClick={onTogglePredictMode}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-colors cursor-pointer ${
                  predictModeEnabled
                    ? 'bg-[#645BE8] text-white'
                    : 'border border-[#D7DCEB] bg-[#F7F8FC] text-[#555D7A] hover:text-[#20253B]'
                }`}
              >
                <Sparkles className="h-3 w-3" aria-hidden="true" />
                Predict Next Step: {predictModeEnabled ? 'On' : 'Off'}
              </button>
            </div>
          </div>
          <p className="text-xs text-[#555D7A]">
            Every step is computed deterministically from your input — inspect pointers, complements, and memory updates live.
          </p>
        </CardHeader>

        <CardContent className="space-y-5 pt-5">
          {/* Custom Input Controls (keyed by sessionId so Restart resets input fields cleanly) */}
          <CustomInputBar
            key={sessionId}
            currentInput={currentInput}
            onApplyInput={onApplyInput}
          />

          {/* Array Visualization */}
          <div aria-label="Array state visualization" className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#555D7A]">
                  Array ({visualState.nums.length}{' '}
                  {visualState.nums.length === 1 ? 'item' : 'items'})
                </h3>
                <span className="rounded-md bg-[#EEF0FF] px-2 py-0.5 font-mono text-xs font-semibold text-[#4F46D8]">
                  target = {visualState.target}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {visualState.complement !== undefined &&
                  visualState.complement !== null && (
                    <span className="rounded-full bg-[#FEF6E6] px-2.5 py-0.5 font-mono text-xs font-semibold text-[#9A630A] border border-[#F8DFA8]">
                      Need complement: {visualState.complement}
                    </span>
                  )}
                {visualState.pairSum !== undefined &&
                  visualState.pairSum !== null && (
                    <span
                      className={`rounded-full px-2.5 py-0.5 font-mono text-xs font-semibold border ${
                        visualState.pairSum === visualState.target
                          ? 'bg-[#E6F8F4] text-[#0D7D6A] border-[#BDECE2]'
                          : 'bg-[#F0F2F8] text-[#4A526E] border-[#DFE3F0]'
                      }`}
                    >
                      Pair sum: {visualState.pairSum}
                    </span>
                  )}
              </div>
            </div>

            {visualState.nums.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#C5CBE3] bg-[#F7F8FC] px-4 py-8 text-center">
                <SearchX
                  className="h-7 w-7 text-[#8B93B0]"
                  aria-hidden="true"
                />
                <p className="mt-2 text-sm font-bold text-[#20253B]">
                  Empty Array ([])
                </p>
                <p className="mt-1 max-w-sm text-xs text-[#555D7A]">
                  With 0 elements, no two distinct indices can sum to{' '}
                  <span className="font-mono font-semibold">{visualState.target}</span>.
                  Try a preset or enter at least two integers above.
                </p>
              </div>
            ) : (
              <div className="flex flex-wrap justify-center gap-2.5 sm:gap-3 py-1">
                {visualState.nums.map((value, idx) => {
                  const highlight = getHighlightForIndex(idx);
                  const styles = highlight ? ROLE_STYLES[highlight.role] : null;

                  return (
                    <div
                      key={`${idx}-${value}`}
                      className="flex flex-col items-center gap-1.5 w-[68px] sm:w-[76px]"
                    >
                      <div className="min-h-5 flex items-center justify-center">
                        {highlight ? (
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold whitespace-nowrap transition-colors duration-200 ${styles?.badge}`}
                          >
                            {highlight.label}
                          </span>
                        ) : (
                          <span className="text-[10px] text-transparent select-none">
                            idle
                          </span>
                        )}
                      </div>

                      <div
                        className={`flex h-16 sm:h-[72px] w-full flex-col items-center justify-center rounded-2xl border-2 font-mono transition-all duration-200 ${
                          styles
                            ? styles.box
                            : 'border-[#E3E7F2] bg-white text-[#20253B]'
                        }`}
                      >
                        <span className="text-base sm:text-lg font-bold truncate max-w-[60px]">
                          {value}
                        </span>
                        <span className="mt-0.5 text-[10px] text-[#555D7A]">
                          idx {idx}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Terminal Result Banner */}
          {visualState.status === 'found' && visualState.foundPair && (
            <div
              role="status"
              className="flex items-start gap-2.5 rounded-2xl border border-[#16B89D] bg-[#E6F8F4] px-4 py-3 text-sm text-[#0A594B]"
            >
              <CheckCircle2
                className="h-5 w-5 shrink-0 text-[#16B89D] mt-0.5"
                aria-hidden="true"
              />
              <div>
                <p className="font-bold">
                  Solution found: indices [{visualState.foundPair[0]},{' '}
                  {visualState.foundPair[1]}]
                </p>
                <p className="text-xs mt-0.5">
                  <span className="font-mono">
                    nums[{visualState.foundPair[0]}] (
                    {visualState.nums[visualState.foundPair[0]]}) + nums[
                    {visualState.foundPair[1]}] (
                    {visualState.nums[visualState.foundPair[1]]}) ={' '}
                    {visualState.target}
                  </span>
                </p>
              </div>
            </div>
          )}

          {visualState.status === 'not-found' && (
            <div
              role="status"
              className="flex items-start gap-2.5 rounded-2xl border border-[#F1B34C] bg-[#FEF6E6] px-4 py-3 text-sm text-[#9A630A]"
            >
              <SearchX className="h-5 w-5 shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <p className="font-bold">No valid pair found</p>
                <p className="text-xs mt-0.5 text-[#555D7A]">
                  No two distinct indices in this array sum to{' '}
                  <span className="font-mono font-semibold text-[#20253B]">
                    {visualState.target}
                  </span>
                  .
                </p>
              </div>
            </div>
          )}

          {/* Hash Map Panel (Hash Map strategy only) */}
          {strategy.id === 'hash-map' && (
            <div
              aria-label="Seen hash map visualization"
              className="rounded-2xl border border-[#E3E7F2] bg-[#F7F8FC] p-4"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Hash className="h-4 w-4 text-[#645BE8]" aria-hidden="true" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#20253B]">
                    Seen Hash Map (value &rarr; index)
                  </h3>
                </div>
                <span className="font-mono text-xs text-[#555D7A]">
                  size: {visualState.hashMap?.length ?? 0}
                </span>
              </div>

              {visualState.hashMap && visualState.hashMap.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {visualState.hashMap.map((entry) => (
                    <div
                      key={`${entry.key}-${entry.value}`}
                      className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 font-mono text-xs font-semibold transition-colors duration-200 ${
                        entry.isMatched
                          ? 'border-[#16B89D] bg-[#E6F8F4] text-[#0D7D6A]'
                          : entry.isNew
                            ? 'border-[#645BE8] bg-[#EEF0FF] text-[#4F46D8]'
                            : 'border-[#E3E7F2] bg-white text-[#20253B]'
                      }`}
                    >
                      <span>{entry.key}</span>
                      <span className="text-[#8B93B0]">&rarr;</span>
                      <span>idx {entry.value}</span>
                      {entry.isMatched && (
                        <Badge variant="mint" className="ml-1">
                          Hit
                        </Badge>
                      )}
                      {entry.isNew && (
                        <Badge variant="indigo" className="ml-1">
                          Added
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-2.5 text-xs text-[#555D7A]">
                  Map is empty — no elements have been stored yet.
                </p>
              )}
            </div>
          )}

          {/* Playback Controls directly beneath visualization */}
          <PlaybackControls
            stepIndex={stepIndex}
            totalSteps={totalSteps}
            isPlaying={isPlaying}
            speed={speed}
            status={visualState.status}
            checkpointPaused={checkpointPaused}
            maxAllowedStepIndex={maxAllowedStepIndex}
            onPrev={onPrev}
            onNext={onNext}
            onTogglePlay={onTogglePlay}
            onReset={onReset}
            onSpeedChange={onSpeedChange}
            onSeek={onSeek}
          />

          {/* Interactive Predict the Next Step Card */}
          {predictModeEnabled && (
            <PredictNextStepCard
              prompt={predictionPrompt}
              record={predictionRecord}
              isCheckpointPaused={checkpointPaused}
              onAnswer={onAnswerPrediction}
              onSkipAndReveal={onSkipPrediction}
              onStepForward={onNext}
            />
          )}

          {/* Compact Synchronized Narrative on Mobile */}
          <div
            aria-live="polite"
            className="rounded-xl border border-[#E3E7F2] bg-white p-3.5 text-xs leading-relaxed text-[#20253B] lg:hidden"
          >
            <p className="font-bold text-[#4F46D8]">{step.actionTitle}</p>
            <p className="mt-1 text-[#555D7A]">{step.explanation}</p>
          </div>

          {/* Accessible Color + Label Legend */}
          <div
            aria-label="Highlight color legend"
            className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-[#E3E7F2] pt-3.5 text-xs text-[#555D7A]"
          >
            <span className="font-bold text-[#20253B]">Legend:</span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-[#F1B34C]" aria-hidden="true" />
              Current / Anchor
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-[#645BE8]" aria-hidden="true" />
              Partner / Lookup
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-[#16B89D]" aria-hidden="true" />
              Confirmed Match
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-[#555D7A]" aria-hidden="true" />
              Stored / Visited
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Synchronized Macro Goal Link Banner */}
      <div
        aria-label="Synchronized Macro conceptual goal"
        className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#D8DCFF] bg-[#EEF0FF]/45 px-4 py-3"
      >
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#4F46D8]">
            <GitBranch className="h-3.5 w-3.5" aria-hidden="true" />
            Current Step Supports Conceptual Goal:
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {activeNodes.map((node) => (
              <Badge key={node.id} variant="mint">
                {node.title}
              </Badge>
            ))}
          </div>
        </div>
        <Button variant="secondary" size="sm" onClick={onOpenMacroView}>
          Open Solution Map
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}
