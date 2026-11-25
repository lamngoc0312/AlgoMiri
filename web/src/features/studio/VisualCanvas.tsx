import { useTranslation } from 'react-i18next';
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
    box: 'border-[#F2B84B] bg-[var(--accent-amber-soft)] text-[var(--text-primary)] shadow-xs scale-[1.03]',
    badge: 'bg-[#F2B84B] text-[#202B3B]',
  },
  partner: {
    box: 'border-[#397BDB] bg-[var(--accent-blue-soft)] text-[var(--text-primary)] shadow-xs scale-[1.03]',
    badge: 'bg-[var(--accent-blue-solid)] text-white',
  },
  match: {
    box: 'border-[#15A897] bg-[var(--accent-teal-soft)] text-[var(--accent-teal-deep)] shadow-xs scale-[1.04]',
    badge: 'bg-[var(--accent-teal-solid)] text-white',
  },
  visited: {
    box: 'border-[var(--border-control)] bg-[var(--surface-elevated)] text-[var(--text-secondary)]',
    badge: 'bg-[#526075] text-white',
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
  const { t } = useTranslation();
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
        <CardHeader className="border-b border-[var(--border-subtle)] bg-[var(--surface-card)]">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Eye
                className="h-4 w-4 text-[var(--accent-blue-link)]"
                aria-hidden="true"
              />
              <CardTitle>{t('visualization.arrayHash.title')}</CardTitle>
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
          {/* Array Visualization — Primary Focal Point */}
          <div
            aria-label={t('visualization.arrayHash.arrayRegion')}
            className="space-y-3"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                  {t('visualization.arrayHash.arrayHeader', {
                    count: visualState.nums.length,
                  })}
                </h3>
                <span className="rounded-md bg-[var(--accent-blue-soft)] px-2 py-0.5 font-mono text-xs font-semibold text-[var(--accent-blue-text)]">
                  target = {visualState.target}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {visualState.complement !== undefined &&
                  visualState.complement !== null && (
                    <span className="rounded-full bg-[var(--accent-amber-soft)] px-2.5 py-0.5 font-mono text-xs font-semibold text-[var(--accent-amber-text)] border border-[var(--accent-amber-border)]">
                      {t('visualization.arrayHash.needComplement', {
                        value: visualState.complement,
                      })}
                    </span>
                  )}
                {visualState.pairSum !== undefined &&
                  visualState.pairSum !== null && (
                    <span
                      className={`rounded-full px-2.5 py-0.5 font-mono text-xs font-semibold border ${
                        visualState.pairSum === visualState.target
                          ? 'bg-[var(--accent-teal-soft)] text-[var(--accent-teal-text)] border-[var(--accent-teal-border)]'
                          : 'bg-[var(--surface-elevated)] text-[var(--text-secondary)] border-[var(--border-control)]'
                      }`}
                    >
                      {t('visualization.arrayHash.pairSum', {
                        value: visualState.pairSum,
                      })}
                    </span>
                  )}
              </div>
            </div>

            {visualState.nums.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--border-control)] bg-[var(--surface-subtle)] px-4 py-8 text-center">
                <SearchX
                  className="h-7 w-7 text-[var(--text-secondary)]"
                  aria-hidden="true"
                />
                <p className="mt-2 text-sm font-bold text-[var(--text-primary)]">
                  {t('visualization.arrayHash.emptyTitle')}
                </p>
                <p className="mt-1 max-w-sm text-xs text-[var(--text-secondary)]">
                  {t('visualization.arrayHash.emptyDescription', {
                    target: visualState.target,
                  })}
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
                            className={`rounded-full px-2 py-0.5 text-xs font-bold whitespace-nowrap transition-colors duration-200 ${styles?.badge}`}
                          >
                            {highlight.label}
                          </span>
                        ) : (
                          <span className="text-xs text-transparent select-none">
                            idle
                          </span>
                        )}
                      </div>

                      <div
                        className={`flex h-16 sm:h-[72px] w-full flex-col items-center justify-center rounded-2xl border-2 font-mono transition-all duration-200 ${
                          styles
                            ? styles.box
                            : 'border-[var(--border-subtle)] bg-[var(--surface-card)] text-[var(--text-primary)]'
                        }`}
                      >
                        <span className="text-base sm:text-lg font-bold truncate max-w-[60px]">
                          {value}
                        </span>
                        <span className="mt-0.5 text-xs text-[var(--text-secondary)]">
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
              className="flex items-start gap-2.5 rounded-2xl border border-[#15A897] bg-[var(--accent-teal-soft)] px-4 py-3 text-sm text-[var(--accent-teal-deep)]"
            >
              <CheckCircle2
                className="h-5 w-5 shrink-0 text-[var(--accent-teal-text)] mt-0.5"
                aria-hidden="true"
              />
              <div>
                <p className="font-bold">
                  {t('visualization.arrayHash.solutionFound', {
                    first: visualState.foundPair[0],
                    second: visualState.foundPair[1],
                  })}
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
              className="flex items-start gap-2.5 rounded-2xl border border-[#F2B84B] bg-[var(--accent-amber-soft)] px-4 py-3 text-sm text-[var(--accent-amber-text)]"
            >
              <SearchX className="h-5 w-5 shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <p className="font-bold">
                  {t('visualization.arrayHash.noPairFound')}
                </p>
                <p className="text-xs mt-0.5 text-[var(--text-secondary)]">
                  {t('visualization.arrayHash.noPairDescription', {
                    target: visualState.target,
                  })}
                </p>
              </div>
            </div>
          )}

          {/* Hash Map Panel (Hash Map strategy only) */}
          {strategy.id === 'hash-map' && (
            <div
              aria-label={t('visualization.arrayHash.hashMapRegion')}
              className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-subtle)] p-4"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Hash
                    className="h-4 w-4 text-[var(--accent-blue-link)]"
                    aria-hidden="true"
                  />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">
                    {t('visualization.arrayHash.hashMapTitle')}
                  </h3>
                </div>
                <span className="font-mono text-xs text-[var(--text-secondary)]">
                  {t('visualization.arrayHash.hashMapSize', {
                    count: visualState.hashMap?.length ?? 0,
                  })}
                </span>
              </div>

              {visualState.hashMap && visualState.hashMap.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {visualState.hashMap.map((entry) => (
                    <div
                      key={`${entry.key}-${entry.value}`}
                      className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 font-mono text-xs font-semibold transition-colors duration-200 ${
                        entry.isMatched
                          ? 'border-[#15A897] bg-[var(--accent-teal-soft)] text-[var(--accent-teal-text)]'
                          : entry.isNew
                            ? 'border-[#397BDB] bg-[var(--accent-blue-soft)] text-[var(--accent-blue-text)]'
                            : 'border-[var(--border-subtle)] bg-[var(--surface-card)] text-[var(--text-primary)]'
                      }`}
                    >
                      <span>{entry.key}</span>
                      <span className="text-[var(--text-secondary)]">&rarr;</span>
                      <span>idx {entry.value}</span>
                      {entry.isMatched && (
                        <Badge variant="mint" className="ml-1">
                          {t('visualization.arrayHash.hashMapHit')}
                        </Badge>
                      )}
                      {entry.isNew && (
                        <Badge variant="indigo" className="ml-1">
                          {t('visualization.arrayHash.hashMapAdded')}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-2.5 text-xs text-[var(--text-secondary)]">
                  {t('visualization.arrayHash.hashMapEmpty')}
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
            className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-3.5 text-xs leading-relaxed text-[var(--text-primary)] lg:hidden"
          >
            <p className="font-bold text-[var(--accent-blue-text)]">
              {step.actionTitle}
            </p>
            <p className="mt-1 text-[var(--text-secondary)]">
              {step.explanation}
            </p>
          </div>

          {/* Accessible Color + Label Legend */}
          <div
            aria-label={t('visualization.arrayHash.legendLabel')}
            className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-[var(--border-subtle)] pt-3.5 text-xs text-[var(--text-secondary)]"
          >
            <span className="font-bold text-[var(--text-primary)]">
              {t('visualization.legend')}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span
                className="h-3 w-3 rounded-full bg-[#F2B84B]"
                aria-hidden="true"
              />
              {t('visualization.arrayHash.legendCurrent')}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span
                className="h-3 w-3 rounded-full bg-[#397BDB]"
                aria-hidden="true"
              />
              {t('visualization.arrayHash.legendPartner')}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span
                className="h-3 w-3 rounded-full bg-[#15A897]"
                aria-hidden="true"
              />
              {t('visualization.arrayHash.legendMatch')}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span
                className="h-3 w-3 rounded-full bg-[#526075]"
                aria-hidden="true"
              />
              {t('visualization.arrayHash.legendVisited')}
            </span>
          </div>

          {/* Custom Input Controls */}
          <CustomInputBar
            key={sessionId}
            currentInput={currentInput}
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
            {t('visualization.currentStepGoal')}
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
          {t('visualization.openSolutionMap')}
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}
