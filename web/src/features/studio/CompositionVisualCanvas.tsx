import {
  ArrowRight,
  CheckCircle2,
  Eye,
  GitBranch,
  History,
  Layers,
  Sparkles,
  Target,
} from 'lucide-react';
import type { SolutionGraph, SolutionStrategy } from '../../domain/problems/types';
import type {
  BinarySearchGreedyVisualState,
  GenericExecutionStep,
  PredictionPrompt,
  ProblemPreset,
} from '../../domain/core/types';
import type { PredictionRecord } from '../../domain/learning/session';
import type { SplitArrayInput } from '../../domain/traces/splitArrayValidation';
import { getActiveNodeIdsForStep } from '../../domain/solutions/graphValidator';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { PredictNextStepCard } from '../guided/PredictNextStepCard';
import { PlaybackControls } from './PlaybackControls';
import { SplitArrayInputBar } from './SplitArrayInputBar';

interface CompositionVisualCanvasProps {
  sessionId: number;
  strategy: SolutionStrategy;
  currentInput: SplitArrayInput;
  presets: ProblemPreset<SplitArrayInput>[];
  step: GenericExecutionStep<BinarySearchGreedyVisualState>;
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
  onApplyInput: (input: SplitArrayInput) => void;
  onPrev: () => void;
  onNext: () => void;
  onTogglePlay: () => void;
  onReset: () => void;
  onSpeedChange: (speed: number) => void;
  onSeek: (stepIndex: number) => void;
  onOpenMacroView: () => void;
}

const GROUP_PALETTE = [
  'border-[#645BE8] bg-[#EEF0FF] text-[#20253B]',
  'border-[#16B89D] bg-[#E6F8F4] text-[#0A594B]',
  'border-[#F1B34C] bg-[#FEF6E6] text-[#9A630A]',
  'border-[#6366F1] bg-[#EEF2FF] text-[#312E81]',
];

export function CompositionVisualCanvas({
  sessionId,
  strategy,
  currentInput,
  presets,
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
}: CompositionVisualCanvasProps) {
  const { visualState } = step;
  const { composition } = visualState;
  const isDriverActive = composition.role === 'driver';
  const isSubroutineActive = composition.role === 'subroutine';

  const activeNodeIds = getActiveNodeIdsForStep(solutionGraph, step);
  const activeNodes = solutionGraph.nodes.filter((n) =>
    activeNodeIds.includes(n.id),
  );

  // Map each array index to its current ContiguousGroup (if assigned yet)
  const findGroupForIndex = (idx: number) =>
    visualState.groups.find((g) => idx >= g.startIndex && idx <= g.endIndex);

  return (
    <div className="flex flex-col gap-4">
      <Card className="overflow-hidden">
        <CardHeader className="border-b border-[#E3E7F2] bg-white">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-[#645BE8]" aria-hidden="true" />
              <CardTitle>Composition Execution Canvas</CardTitle>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="indigo">{strategy.shortLabel}</Badge>
              <button
                type="button"
                role="switch"
                aria-checked={predictModeEnabled}
                onClick={onTogglePredictMode}
                className={`inline-flex min-h-[36px] items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
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
            Watch the Binary Search driver propose candidate caps <code className="font-mono">mid</code> and delegate feasibility checking to the Greedy contiguous packer.
          </p>
        </CardHeader>

        <CardContent className="space-y-5 pt-5">
          <SplitArrayInputBar
            key={sessionId}
            currentInput={currentInput}
            presets={presets}
            onApplyInput={onApplyInput}
          />

          {/* Driver <-> Subroutine Composition Coordination Panel */}
          <div
            aria-label="Algorithm composition coordination"
            className="grid gap-3 md:grid-cols-[1fr_auto_1fr] md:items-stretch"
          >
            {/* Outer Driver: Binary Search on Answer */}
            <div
              className={`rounded-2xl border-2 p-3.5 transition-all duration-200 ${
                isDriverActive
                  ? 'border-[#645BE8] bg-[#EEF0FF]/55 shadow-xs'
                  : 'border-[#E3E7F2] bg-[#F7F8FC]'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#20253B]">
                  <Target className="h-3.5 w-3.5 text-[#645BE8]" aria-hidden="true" />
                  Outer Driver · Binary Search
                </span>
                {isDriverActive && <Badge variant="indigo">Active</Badge>}
              </div>

              <div className="mt-2.5 grid grid-cols-3 gap-2 text-center font-mono">
                <div className="rounded-xl border border-[#DCE1F0] bg-white py-1.5 px-2">
                  <span className="block text-[10px] text-[#555D7A]">low</span>
                  <span className="text-sm font-extrabold text-[#20253B]">
                    {visualState.low}
                  </span>
                </div>
                <div className="rounded-xl border border-[#645BE8]/40 bg-white py-1.5 px-2">
                  <span className="block text-[10px] text-[#4F46D8]">mid</span>
                  <span className="text-sm font-extrabold text-[#4F46D8]">
                    {visualState.mid ?? '—'}
                  </span>
                </div>
                <div className="rounded-xl border border-[#DCE1F0] bg-white py-1.5 px-2">
                  <span className="block text-[10px] text-[#555D7A]">high</span>
                  <span className="text-sm font-extrabold text-[#20253B]">
                    {visualState.high}
                  </span>
                </div>
              </div>

              {visualState.boundDecision && (
                <p className="mt-2 font-mono text-[11px] font-semibold text-[#4F46D8]">
                  {visualState.boundDecision}
                </p>
              )}
            </div>

            {/* Data Contract Connector */}
            <div className="flex flex-col items-center justify-center px-1 text-[11px] font-mono text-[#555D7A]">
              <span>mid={visualState.mid ?? '?'} &rarr;</span>
              <span className="text-[#0D7D6A] font-semibold">
                {visualState.feasible === null
                  ? 'checking...'
                  : visualState.feasible
                    ? '← true'
                    : '← false'}
              </span>
            </div>

            {/* Inner Subroutine: Greedy Feasibility Checker */}
            <div
              className={`rounded-2xl border-2 p-3.5 transition-all duration-200 ${
                isSubroutineActive
                  ? 'border-[#16B89D] bg-[#E6F8F4]/60 shadow-xs'
                  : 'border-[#E3E7F2] bg-[#F7F8FC]'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#20253B]">
                  <Layers className="h-3.5 w-3.5 text-[#16B89D]" aria-hidden="true" />
                  Subroutine · Greedy Packer
                </span>
                {isSubroutineActive ? (
                  <Badge variant="mint">{composition.invocationId}</Badge>
                ) : (
                  <span className="font-mono text-xs text-[#555D7A]">
                    {composition.invocationId}
                  </span>
                )}
              </div>

              <div className="mt-2.5 grid grid-cols-2 gap-2 text-center font-mono">
                <div className="rounded-xl border border-[#DCE1F0] bg-white py-1.5 px-2">
                  <span className="block text-[10px] text-[#555D7A]">
                    groups / k
                  </span>
                  <span
                    className={`text-sm font-extrabold ${
                      visualState.groupsUsed > visualState.k
                        ? 'text-[#9A630A]'
                        : 'text-[#0A594B]'
                    }`}
                  >
                    {visualState.groupsUsed || '—'} / {visualState.k}
                  </span>
                </div>
                <div className="rounded-xl border border-[#DCE1F0] bg-white py-1.5 px-2">
                  <span className="block text-[10px] text-[#555D7A]">
                    sum / cap
                  </span>
                  <span className="text-sm font-extrabold text-[#20253B]">
                    {visualState.runningSum ?? '—'} / {visualState.mid ?? '—'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Array & Contiguous Partition Visualization */}
          <div aria-label="Contiguous partition visualization" className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#555D7A]">
                Array Scan &amp; Contiguous Partitions (k = {visualState.k})
              </h3>
              {visualState.scanIndex !== null && (
                <span className="rounded-full bg-[#FEF6E6] px-2.5 py-0.5 font-mono text-xs font-semibold text-[#9A630A] border border-[#F8DFA8]">
                  Scanning idx {visualState.scanIndex} (val{' '}
                  {visualState.nums[visualState.scanIndex]})
                </span>
              )}
            </div>

            <div className="flex flex-wrap justify-center gap-2 sm:gap-2.5 py-1">
              {visualState.nums.map((val, idx) => {
                const group = findGroupForIndex(idx);
                const isScanning = visualState.scanIndex === idx;
                const paletteStyle = group
                  ? GROUP_PALETTE[(group.groupIndex - 1) % GROUP_PALETTE.length]
                  : 'border-[#E3E7F2] bg-white text-[#20253B]';

                return (
                  <div
                    key={`${idx}-${val}`}
                    className="flex flex-col items-center gap-1 w-14 sm:w-16"
                  >
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        isScanning
                          ? 'bg-[#F1B34C] text-[#20253B]'
                          : group
                            ? 'bg-[#EEF0FF] text-[#4F46D8]'
                            : 'text-transparent select-none'
                      }`}
                    >
                      {isScanning
                        ? group?.justCreated
                          ? `Cut G${group.groupIndex}`
                          : `Scan`
                        : group
                          ? `G${group.groupIndex}`
                          : 'idle'}
                    </span>

                    <div
                      className={`flex h-14 sm:h-16 w-full flex-col items-center justify-center rounded-2xl border-2 font-mono transition-all duration-200 ${paletteStyle} ${
                        isScanning ? 'scale-105 ring-2 ring-[#F1B34C]/60' : ''
                      }`}
                    >
                      <span className="text-sm sm:text-base font-bold truncate max-w-[52px]">
                        {val}
                      </span>
                      <span className="text-[10px] opacity-75">idx {idx}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Formed Contiguous Groups Summary */}
            {visualState.groups.length > 0 && (
              <div
                aria-label="Formed contiguous subarrays"
                className="flex flex-wrap gap-2 pt-1"
              >
                {visualState.groups.map((group) => (
                  <div
                    key={group.groupIndex}
                    className={`flex items-center gap-2 rounded-xl border px-3 py-1.5 font-mono text-xs ${
                      group.justCreated
                        ? 'border-[#F1B34C] bg-[#FEF6E6] text-[#9A630A] font-bold'
                        : group.isCurrent
                          ? 'border-[#16B89D] bg-[#E6F8F4] text-[#0A594B] font-semibold'
                          : 'border-[#E3E7F2] bg-white text-[#20253B]'
                    }`}
                  >
                    <span className="font-bold">G{group.groupIndex}:</span>
                    <span>[{group.elements.join(', ')}]</span>
                    <span className="text-[#555D7A]">sum={group.sum}</span>
                    {group.justCreated && (
                      <Badge variant="amber">New Group</Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Terminal Convergence Banner */}
          {visualState.finalAnswer !== null && (
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
                  Minimized Largest Subarray Sum: {visualState.finalAnswer}
                </p>
                <p className="text-xs mt-0.5">
                  Verified exact {visualState.k}-subarray partition:{' '}
                  <span className="font-mono font-semibold">
                    {visualState.groups
                      .map((g) => `[${g.elements.join(', ')}] (sum ${g.sum})`)
                      .join(' · ')}
                  </span>
                </p>
              </div>
            </div>
          )}

          {/* Binary Search Iteration Inspector */}
          {visualState.completedIterations.length > 0 && (
            <div
              aria-label="Binary Search iteration history"
              className="rounded-2xl border border-[#E3E7F2] bg-[#F7F8FC] p-3.5 space-y-2"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#20253B]">
                  <History className="h-3.5 w-3.5 text-[#645BE8]" aria-hidden="true" />
                  Binary Search Iterations (click to inspect Greedy subtrace)
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {visualState.completedIterations.map((iter) => {
                  const isCurrentIter =
                    composition.invocationId === iter.invocationId;
                  const locked = iter.firstStepIndex > maxAllowedStepIndex;

                  return (
                    <button
                      key={iter.invocationId}
                      type="button"
                      disabled={locked}
                      onClick={() => onSeek(iter.firstStepIndex)}
                      className={`rounded-xl border px-2.5 py-1.5 font-mono text-[11px] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                        isCurrentIter
                          ? 'border-[#645BE8] bg-[#EEF0FF] text-[#4F46D8] font-bold'
                          : 'border-[#DCE1F0] bg-white text-[#20253B] hover:border-[#645BE8]'
                      }`}
                    >
                      #{iter.iteration} [{iter.low}..{iter.high}] mid={iter.mid}{' '}
                      &rarr; {iter.groupsUsed}/{visualState.k}{' '}
                      {iter.feasible ? '✓' : '✗'}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Shared Playback Controls */}
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

          {/* Shared Interactive Prediction Card */}
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

          {/* Accessible Color + Label Legend */}
          <div
            aria-label="Composition highlight legend"
            className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-[#E3E7F2] pt-3.5 text-xs text-[#555D7A]"
          >
            <span className="font-bold text-[#20253B]">Legend:</span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-[#645BE8]" aria-hidden="true" />
              BS Driver / Group 1
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-[#16B89D]" aria-hidden="true" />
              Greedy Active / Feasible
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-[#F1B34C]" aria-hidden="true" />
              Scanning / New Group Cut
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
            Current Step Supports Conceptual Component:
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
          Open Composition Map
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}
