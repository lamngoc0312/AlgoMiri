import { useTranslation } from 'react-i18next';
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  CheckCircle2,
  Eye,
  GitBranch,
  Layers,
  Sparkles,
  XCircle,
} from 'lucide-react';
import type { SolutionGraph, SolutionStrategy } from '../../domain/problems/types';
import type {
  GenericExecutionStep,
  PredictionPrompt,
  ProblemPreset,
  StackVisualState,
} from '../../domain/core/types';
import type { PredictionRecord } from '../../domain/learning/session';
import type { ValidParenthesesInput } from '../../domain/traces/validParenthesesValidation';
import { getActiveNodeIdsForStep } from '../../domain/solutions/graphValidator';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { PredictNextStepCard } from '../guided/PredictNextStepCard';
import { PlaybackControls } from './PlaybackControls';
import { StackInputBar } from './StackInputBar';

interface StackVisualCanvasProps {
  sessionId: number;
  strategy: SolutionStrategy;
  currentInput: ValidParenthesesInput;
  presets: ProblemPreset<ValidParenthesesInput>[];
  step: GenericExecutionStep<StackVisualState>;
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
  onApplyInput: (input: ValidParenthesesInput) => void;
  onPrev: () => void;
  onNext: () => void;
  onTogglePlay: () => void;
  onReset: () => void;
  onSpeedChange: (speed: number) => void;
  onSeek: (stepIndex: number) => void;
  onOpenMacroView: () => void;
}

export function StackVisualCanvas({
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
}: StackVisualCanvasProps) {
  const { t } = useTranslation();
  const { visualState } = step;
  const chars = visualState.input.split('');
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
              <CardTitle>{t('visualization.stack.title')}</CardTitle>
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
          {/* Input String Character Strip — Primary Focal Point */}
          <div
            aria-label={t('visualization.stack.inputRegion')}
            className="space-y-2.5"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                {t('visualization.stack.inputHeader', { count: chars.length })}
              </h3>
              {visualState.currentChar && (
                <span className="rounded-full bg-[var(--accent-amber-soft)] px-2.5 py-0.5 font-mono text-xs font-semibold text-[var(--accent-amber-text)] border border-[var(--accent-amber-border)]">
                  {t('visualization.stack.currentChar', {
                    char: visualState.currentChar,
                    index: visualState.currentIndex ?? 0,
                  })}
                </span>
              )}
            </div>

            {chars.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#15A897] bg-[var(--accent-teal-soft)]/60 px-4 py-5 text-center text-xs text-[var(--accent-teal-deep)]">
                <p className="font-bold text-sm">
                  {t('visualization.stack.emptyTitle')}
                </p>
                <p className="mt-1">
                  {t('visualization.stack.emptyDescription')}
                </p>
              </div>
            ) : (
              <div className="flex flex-wrap justify-center gap-2 py-1">
                {chars.map((ch, idx) => {
                  const isCurrent = visualState.currentIndex === idx;
                  const isScanned =
                    visualState.currentIndex !== null &&
                    idx < visualState.currentIndex;

                  let tileStyle =
                    'border-[var(--border-subtle)] bg-[var(--surface-card)] text-[var(--text-primary)]';
                  if (isCurrent && visualState.operation === 'mismatch') {
                    tileStyle =
                      'border-[#F2B84B] bg-[var(--accent-amber-soft)] text-[var(--accent-amber-text)] scale-105 shadow-xs';
                  } else if (isCurrent && visualState.operation === 'pop') {
                    tileStyle =
                      'border-[#15A897] bg-[var(--accent-teal-soft)] text-[var(--accent-teal-deep)] scale-105 shadow-xs';
                  } else if (isCurrent) {
                    tileStyle =
                      'border-[#397BDB] bg-[var(--accent-blue-soft)] text-[var(--accent-blue-text)] scale-105 shadow-xs';
                  } else if (isScanned) {
                    tileStyle =
                      'border-[var(--border-control)] bg-[var(--surface-elevated)] text-[var(--text-secondary)]';
                  }

                  return (
                    <div
                      key={`${idx}-${ch}`}
                      className="flex flex-col items-center gap-1 w-12 sm:w-14"
                    >
                      <span
                        className={`text-xs font-bold ${
                          isCurrent
                            ? 'text-[var(--accent-blue-link)]'
                            : 'text-transparent select-none'
                        }`}
                      >
                        curr
                      </span>
                      <div
                        className={`flex h-12 sm:h-14 w-full flex-col items-center justify-center rounded-xl border-2 font-mono transition-all duration-200 ${tileStyle}`}
                      >
                        <span className="text-base sm:text-lg font-bold">
                          {ch}
                        </span>
                        <span className="text-xs opacity-75">{idx}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Vertical Stack Visualization */}
          <div
            aria-label={t('visualization.stack.stackRegion')}
            className="grid gap-4 sm:grid-cols-[1fr_220px] sm:items-center rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-subtle)] p-4"
          >
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Layers
                  className="h-4 w-4 text-[var(--accent-blue-link)]"
                  aria-hidden="true"
                />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">
                  {t('visualization.stack.stackTitle')}
                </h3>
                <Badge variant="neutral">
                  {t('visualization.stack.stackSize', {
                    count: visualState.stack.length,
                  })}
                </Badge>
              </div>

              <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-3 text-xs space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-[var(--text-primary)]">
                  {visualState.operation === 'push' && (
                    <>
                      <ArrowDown
                        className="h-3.5 w-3.5 text-[var(--accent-blue-link)]"
                        aria-hidden="true"
                      />
                      <span>{t('visualization.stack.opPush')}</span>
                    </>
                  )}
                  {visualState.operation === 'pop' && (
                    <>
                      <ArrowUp
                        className="h-3.5 w-3.5 text-[var(--accent-teal-text)]"
                        aria-hidden="true"
                      />
                      <span>{t('visualization.stack.opPop')}</span>
                    </>
                  )}
                  {visualState.operation === 'check-match' && (
                    <span>
                      {t('visualization.stack.opCheckMatch', {
                        char: visualState.currentChar ?? '',
                        top: visualState.comparingWith ?? '',
                      })}
                    </span>
                  )}
                  {visualState.operation === 'mismatch' && (
                    <span className="text-[var(--accent-amber-text)]">
                      {t('visualization.stack.opMismatch')}
                    </span>
                  )}
                  {visualState.operation === 'unclosed' && (
                    <span className="text-[var(--accent-amber-text)]">
                      {t('visualization.stack.opUnclosed')}
                    </span>
                  )}
                  {visualState.operation === 'valid' && (
                    <span className="text-[var(--accent-teal-text)]">
                      {t('visualization.stack.opValid')}
                    </span>
                  )}
                </div>
                <p className="text-[var(--text-secondary)] leading-relaxed">
                  {step.explanation}
                </p>
              </div>
            </div>

            {/* Vertical U-Shaped Stack Frame */}
            <div className="flex flex-col items-center">
              <span className="mb-1.5 text-xs font-bold uppercase tracking-wider text-[var(--accent-blue-link)]">
                {t('visualization.stack.topHint')}
              </span>
              <div className="flex min-h-[168px] w-full max-w-[200px] flex-col-reverse justify-start gap-2 rounded-b-2xl border-x-2 border-b-2 border-[var(--border-control)] bg-[var(--surface-card)] px-3 pb-3 pt-4">
                {visualState.stack.length === 0 ? (
                  <div className="my-auto py-8 text-center text-xs font-medium text-[var(--text-secondary)]">
                    {t('visualization.stack.stackEmpty')}
                  </div>
                ) : (
                  visualState.stack.map((item, idx) => {
                    const isTop = idx === visualState.stack.length - 1;
                    let itemStyle =
                      'border-[var(--border-control)] bg-[var(--surface-subtle)] text-[var(--text-primary)]';
                    if (item.highlight === 'new') {
                      itemStyle =
                        'border-[#397BDB] bg-[var(--accent-blue-soft)] text-[var(--accent-blue-text)] shadow-xs';
                    } else if (item.highlight === 'matched') {
                      itemStyle =
                        'border-[#15A897] bg-[var(--accent-teal-soft)] text-[var(--accent-teal-deep)] shadow-xs';
                    } else if (item.highlight === 'mismatched') {
                      itemStyle =
                        'border-[#F2B84B] bg-[var(--accent-amber-soft)] text-[var(--accent-amber-text)] shadow-xs';
                    }

                    return (
                      <div
                        key={item.id}
                        className={`flex items-center justify-between rounded-xl border-2 px-3 py-2 font-mono text-sm font-bold transition-all duration-200 ${itemStyle}`}
                      >
                        <span>
                          {item.char}{' '}
                          <span className="text-xs font-normal">
                            (idx {item.index})
                          </span>
                        </span>
                        {isTop && (
                          <span className="rounded-full bg-[var(--accent-blue-solid)] px-2 py-0.5 font-sans text-xs font-bold text-white">
                            TOP
                          </span>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
              <span className="mt-1 text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                {t('visualization.stack.bottomLabel')}
              </span>
            </div>
          </div>

          {/* Terminal Result Banner */}
          {visualState.isValid === true && (
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
                  {t('visualization.stack.validTitle')}
                </p>
                <p className="text-xs mt-0.5">
                  {t('visualization.stack.validDescription')}
                </p>
              </div>
            </div>
          )}

          {visualState.isValid === false && (
            <div
              role="status"
              className="flex items-start gap-2.5 rounded-2xl border border-[#F2B84B] bg-[var(--accent-amber-soft)] px-4 py-3 text-sm text-[var(--accent-amber-text)]"
            >
              <XCircle className="h-5 w-5 shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <p className="font-bold">
                  {t('visualization.stack.invalidTitle')}
                </p>
                <p className="text-xs mt-0.5 text-[var(--text-secondary)]">
                  {visualState.operation === 'unclosed'
                    ? t('visualization.stack.invalidUnclosed')
                    : t('visualization.stack.invalidMismatch')}
                </p>
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
            aria-label={t('visualization.stack.legendLabel')}
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
              {t('visualization.stack.legendCurrent')}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span
                className="h-3 w-3 rounded-full bg-[#15A897]"
                aria-hidden="true"
              />
              {t('visualization.stack.legendMatched')}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span
                className="h-3 w-3 rounded-full bg-[#F2B84B]"
                aria-hidden="true"
              />
              {t('visualization.stack.legendMismatch')}
            </span>
          </div>

          {/* Custom Bracket Input */}
          <StackInputBar
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
