import { useTranslation } from 'react-i18next';
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
  'border-[#397BDB] bg-[var(--accent-blue-soft)] text-[var(--text-primary)]',
  'border-[#15A897] bg-[var(--accent-teal-soft)] text-[var(--accent-teal-deep)]',
  'border-[#F2B84B] bg-[var(--accent-amber-soft)] text-[var(--accent-amber-text)]',
  'border-[#83C8ED] bg-[var(--accent-sky-soft)] text-[var(--accent-sky-text)]',
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
  const { t } = useTranslation();
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
        <CardHeader className="border-b border-[var(--border-subtle)] bg-[var(--surface-card)]">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Eye
                className="h-4 w-4 text-[var(--accent-blue-link)]"
                aria-hidden="true"
              />
              <CardTitle>{t('visualization.composition.title')}</CardTitle>
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
                    ? 'bg-[var(--accent-blue-solid)] text-white'
                    : 'border border-[var(--border-control)] bg-[var(--surface-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Sparkles className="h-3 w-3" aria-hidden="true" />
                {predictModeEnabled
                  ? t('visualization.predictToggleOn')
                  : t('visualization.predictToggleOff')}
              </button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-5 pt-5">
          {/* Driver <-> Subroutine Composition Coordination Panel */}
          <div
            aria-label={t('visualization.composition.coordinationLabel')}
            className="grid gap-3 md:grid-cols-[1fr_auto_1fr] md:items-stretch"
          >
            {/* Outer Driver: Binary Search on Answer */}
            <div
              className={`rounded-2xl border-2 p-3.5 transition-all duration-200 ${
                isDriverActive
                  ? 'border-[#397BDB] bg-[var(--accent-blue-soft)]/55 shadow-xs'
                  : 'border-[var(--border-subtle)] bg-[var(--surface-subtle)]'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--text-primary)]">
                  <Target
                    className="h-3.5 w-3.5 text-[var(--accent-blue-link)]"
                    aria-hidden="true"
                  />
                  {t('visualization.composition.outerDriver')}
                </span>
                {isDriverActive && (
                  <Badge variant="indigo">
                    {t('visualization.composition.activeBadge')}
                  </Badge>
                )}
              </div>

              <div className="mt-2.5 grid grid-cols-3 gap-2 text-center font-mono">
                <div className="rounded-xl border border-[var(--border-control)] bg-[var(--surface-card)] py-1.5 px-2">
                  <span className="block text-xs text-[var(--text-secondary)]">
                    low
                  </span>
                  <span className="text-sm font-extrabold text-[var(--text-primary)]">
                    {visualState.low}
                  </span>
                </div>
                <div className="rounded-xl border border-[#397BDB]/40 bg-[var(--surface-card)] py-1.5 px-2">
                  <span className="block text-xs text-[var(--accent-blue-text)]">
                    mid
                  </span>
                  <span className="text-sm font-extrabold text-[var(--accent-blue-text)]">
                    {visualState.mid ?? '—'}
                  </span>
                </div>
                <div className="rounded-xl border border-[var(--border-control)] bg-[var(--surface-card)] py-1.5 px-2">
                  <span className="block text-xs text-[var(--text-secondary)]">
                    high
                  </span>
                  <span className="text-sm font-extrabold text-[var(--text-primary)]">
                    {visualState.high}
                  </span>
                </div>
              </div>

              {visualState.boundDecision && (
                <p className="mt-2 font-mono text-xs font-semibold text-[var(--accent-blue-text)]">
                  {visualState.boundDecision}
                </p>
              )}
            </div>

            {/* Data Contract Connector */}
            <div className="flex flex-col items-center justify-center px-1 text-xs font-mono text-[var(--text-secondary)]">
              <span>mid={visualState.mid ?? '?'} &rarr;</span>
              <span className="text-[var(--accent-teal-text)] font-semibold">
                {visualState.feasible === null
                  ? t('visualization.composition.checking')
                  : visualState.feasible
                    ? '← true'
                    : '← false'}
              </span>
            </div>

            {/* Inner Subroutine: Greedy Feasibility Checker */}
            <div
              className={`rounded-2xl border-2 p-3.5 transition-all duration-200 ${
                isSubroutineActive
                  ? 'border-[#15A897] bg-[var(--accent-teal-soft)]/60 shadow-xs'
                  : 'border-[var(--border-subtle)] bg-[var(--surface-subtle)]'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--text-primary)]">
                  <Layers
                    className="h-3.5 w-3.5 text-[var(--accent-teal-text)]"
                    aria-hidden="true"
                  />
                  {t('visualization.composition.subroutine')}
                </span>
                {isSubroutineActive ? (
                  <Badge variant="mint">{composition.invocationId}</Badge>
                ) : (
                  <span className="font-mono text-xs text-[var(--text-secondary)]">
                    {composition.invocationId}
                  </span>
                )}
              </div>

              <div className="mt-2.5 grid grid-cols-2 gap-2 text-center font-mono">
                <div className="rounded-xl border border-[var(--border-control)] bg-[var(--surface-card)] py-1.5 px-2">
                  <span className="block text-xs text-[var(--text-secondary)]">
                    {t('visualization.composition.groupsPerK')}
                  </span>
                  <span
                    className={`text-sm font-extrabold ${
                      visualState.groupsUsed > visualState.k
                        ? 'text-[var(--accent-amber-text)]'
                        : 'text-[var(--accent-teal-deep)]'
                    }`}
                  >
                    {visualState.groupsUsed || '—'} / {visualState.k}
                  </span>
                </div>
                <div className="rounded-xl border border-[var(--border-control)] bg-[var(--surface-card)] py-1.5 px-2">
                  <span className="block text-xs text-[var(--text-secondary)]">
                    {t('visualization.composition.sumPerCap')}
                  </span>
                  <span className="text-sm font-extrabold text-[var(--text-primary)]">
                    {visualState.runningSum ?? '—'} / {visualState.mid ?? '—'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Array & Contiguous Partition Visualization */}
          <div
            aria-label={t('visualization.composition.partitionRegion')}
            className="space-y-3"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                {t('visualization.composition.arrayScanHeader', {
                  k: visualState.k,
                })}
              </h3>
              {visualState.scanIndex !== null && (
                <span className="rounded-full bg-[var(--accent-amber-soft)] px-2.5 py-0.5 font-mono text-xs font-semibold text-[var(--accent-amber-text)] border border-[var(--accent-amber-border)]">
                  {t('visualization.composition.scanningBadge', {
                    index: visualState.scanIndex,
                    value: visualState.nums[visualState.scanIndex],
                  })}
                </span>
              )}
            </div>

            <div className="flex flex-wrap justify-center gap-2 sm:gap-2.5 py-1">
              {visualState.nums.map((val, idx) => {
                const group = findGroupForIndex(idx);
                const isScanning = visualState.scanIndex === idx;
                const paletteStyle = group
                  ? GROUP_PALETTE[(group.groupIndex - 1) % GROUP_PALETTE.length]
                  : 'border-[var(--border-subtle)] bg-[var(--surface-card)] text-[var(--text-primary)]';

                return (
                  <div
                    key={`${idx}-${val}`}
                    className="flex flex-col items-center gap-1 w-14 sm:w-16"
                  >
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                        isScanning
                          ? 'bg-[#F2B84B] text-[#202B3B]'
                          : group
                            ? 'bg-[var(--accent-blue-soft)] text-[var(--accent-blue-text)]'
                            : 'text-transparent select-none'
                      }`}
                    >
                      {isScanning
                        ? group?.justCreated
                          ? t('traces.highlights.cutGroup', {
                              group: group.groupIndex,
                            })
                          : t('traces.highlights.scan')
                        : group
                          ? `G${group.groupIndex}`
                          : 'idle'}
                    </span>

                    <div
                      className={`flex h-14 sm:h-16 w-full flex-col items-center justify-center rounded-2xl border-2 font-mono transition-all duration-200 ${paletteStyle} ${
                        isScanning ? 'scale-105 ring-2 ring-[#F2B84B]/60' : ''
                      }`}
                    >
                      <span className="text-sm sm:text-base font-bold truncate max-w-[52px]">
                        {val}
                      </span>
                      <span className="text-xs opacity-75">idx {idx}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Formed Contiguous Groups Summary */}
            {visualState.groups.length > 0 && (
              <div
                aria-label={t('visualization.composition.formedGroupsLabel')}
                className="flex flex-wrap gap-2 pt-1"
              >
                {visualState.groups.map((group) => (
                  <div
                    key={group.groupIndex}
                    className={`flex items-center gap-2 rounded-xl border px-3 py-1.5 font-mono text-xs ${
                      group.justCreated
                        ? 'border-[#F2B84B] bg-[var(--accent-amber-soft)] text-[var(--accent-amber-text)] font-bold'
                        : group.isCurrent
                          ? 'border-[#15A897] bg-[var(--accent-teal-soft)] text-[var(--accent-teal-deep)] font-semibold'
                          : 'border-[var(--border-subtle)] bg-[var(--surface-card)] text-[var(--text-primary)]'
                    }`}
                  >
                    <span className="font-bold">G{group.groupIndex}:</span>
                    <span>[{group.elements.join(', ')}]</span>
                    <span className="text-[var(--text-secondary)]">
                      sum={group.sum}
                    </span>
                    {group.justCreated && (
                      <Badge variant="amber">
                        {t('visualization.composition.newGroupBadge')}
                      </Badge>
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
              className="flex items-start gap-2.5 rounded-2xl border border-[#15A897] bg-[var(--accent-teal-soft)] px-4 py-3 text-sm text-[var(--accent-teal-deep)]"
            >
              <CheckCircle2
                className="h-5 w-5 shrink-0 text-[var(--accent-teal-text)] mt-0.5"
                aria-hidden="true"
              />
              <div>
                <p className="font-bold">
                  {t('visualization.composition.finalAnswerTitle', {
                    answer: visualState.finalAnswer,
                  })}
                </p>
                <p className="text-xs mt-0.5">
                  {t('visualization.composition.finalAnswerDetail', {
                    k: visualState.k,
                  })}{' '}
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
              aria-label={t('visualization.composition.iterationsRegion')}
              className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-subtle)] p-3.5 space-y-2"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--text-primary)]">
                  <History
                    className="h-3.5 w-3.5 text-[var(--accent-blue-link)]"
                    aria-hidden="true"
                  />
                  {t('visualization.composition.iterationsTitle')}
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
                      className={`rounded-xl border px-2.5 py-1.5 font-mono text-xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                        isCurrentIter
                          ? 'border-[#397BDB] bg-[var(--accent-blue-soft)] text-[var(--accent-blue-text)] font-bold'
                          : 'border-[var(--border-control)] bg-[var(--surface-card)] text-[var(--text-primary)] hover:border-[#397BDB]'
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
            aria-label={t('visualization.composition.legendLabel')}
            className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-[var(--border-subtle)] pt-3.5 text-xs text-[var(--text-secondary)]"
          >
            <span className="font-bold text-[var(--text-primary)]">
              {t('visualization.legend')}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span
                className="h-3 w-3 rounded-full bg-[#397BDB]"
                aria-hidden="true"
              />
              {t('visualization.composition.legendDriver')}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span
                className="h-3 w-3 rounded-full bg-[#15A897]"
                aria-hidden="true"
              />
              {t('visualization.composition.legendGreedy')}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span
                className="h-3 w-3 rounded-full bg-[#F2B84B]"
                aria-hidden="true"
              />
              {t('visualization.composition.legendScanning')}
            </span>
          </div>

          {/* Custom Input Bar */}
          <SplitArrayInputBar
            key={sessionId}
            currentInput={currentInput}
            presets={presets}
            onApplyInput={onApplyInput}
          />
        </CardContent>
      </Card>

      {/* Synchronized Macro Goal Link Banner */}
      <div
        aria-label={t('visualization.macroBannerLabel')}
        className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--accent-blue-border)] bg-[var(--accent-blue-soft)]/45 px-4 py-3"
      >
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--accent-blue-text)]">
            <GitBranch className="h-3.5 w-3.5" aria-hidden="true" />
            {t('visualization.currentStepComponent')}
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
          {t('visualization.openCompositionMap')}
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}
