import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  Eye,
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
import { Badge } from '../../components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { SolutionMapPreview } from '../solutions/SolutionMapPreview';
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
}: StackVisualCanvasProps) {
  const { visualState } = step;
  const chars = visualState.input.split('');

  return (
    <div className="flex flex-col gap-4">
      <Card className="overflow-hidden">
        <CardHeader className="border-b border-[#E3E7F2] bg-white">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-[#645BE8]" aria-hidden="true" />
              <CardTitle>Stack Execution Canvas</CardTitle>
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
            Watch each opening bracket push onto TOP and each closing bracket verify against TOP in Last-In-First-Out order.
          </p>
        </CardHeader>

        <CardContent className="space-y-5 pt-5">
          <StackInputBar
            key={sessionId}
            currentInput={currentInput}
            presets={presets}
            onApplyInput={onApplyInput}
          />

          {/* Input String Character Strip */}
          <div aria-label="Bracket input string" className="space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#555D7A]">
                Input String ({chars.length}{' '}
                {chars.length === 1 ? 'char' : 'chars'})
              </h3>
              {visualState.currentChar && (
                <span className="rounded-full bg-[#FEF6E6] px-2.5 py-0.5 font-mono text-xs font-semibold text-[#9A630A] border border-[#F8DFA8]">
                  Current: &quot;{visualState.currentChar}&quot; (idx{' '}
                  {visualState.currentIndex})
                </span>
              )}
            </div>

            {chars.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#16B89D] bg-[#E6F8F4]/60 px-4 py-5 text-center text-xs text-[#0A594B]">
                <p className="font-bold text-sm">Empty String (&quot;&quot;)</p>
                <p className="mt-1">
                  Zero brackets means zero mismatches and an empty stack — valid (true)!
                </p>
              </div>
            ) : (
              <div className="flex flex-wrap justify-center gap-2 py-1">
                {chars.map((ch, idx) => {
                  const isCurrent = visualState.currentIndex === idx;
                  const isScanned =
                    visualState.currentIndex !== null &&
                    idx < visualState.currentIndex;

                  let tileStyle = 'border-[#E3E7F2] bg-white text-[#20253B]';
                  if (isCurrent && visualState.operation === 'mismatch') {
                    tileStyle =
                      'border-[#F1B34C] bg-[#FEF6E6] text-[#9A630A] scale-105 shadow-xs';
                  } else if (isCurrent && visualState.operation === 'pop') {
                    tileStyle =
                      'border-[#16B89D] bg-[#E6F8F4] text-[#0A594B] scale-105 shadow-xs';
                  } else if (isCurrent) {
                    tileStyle =
                      'border-[#645BE8] bg-[#EEF0FF] text-[#4F46D8] scale-105 shadow-xs';
                  } else if (isScanned) {
                    tileStyle =
                      'border-[#DCE1F0] bg-[#F0F2F8] text-[#7E86A3]';
                  }

                  return (
                    <div
                      key={`${idx}-${ch}`}
                      className="flex flex-col items-center gap-1 w-12 sm:w-14"
                    >
                      <span
                        className={`text-[10px] font-bold ${
                          isCurrent
                            ? 'text-[#645BE8]'
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
                        <span className="text-[10px] opacity-75">{idx}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Vertical Stack Visualization */}
          <div
            aria-label="Vertical stack visualization"
            className="grid gap-4 sm:grid-cols-[1fr_220px] sm:items-center rounded-2xl border border-[#E3E7F2] bg-[#F7F8FC] p-4"
          >
            {/* Operation Status & Comparison Explanation */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-[#645BE8]" aria-hidden="true" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#20253B]">
                  Stack State (LIFO)
                </h3>
                <Badge variant="neutral">
                  size: {visualState.stack.length}
                </Badge>
              </div>

              <div className="rounded-xl border border-[#E3E7F2] bg-white p-3 text-xs space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-[#20253B]">
                  {visualState.operation === 'push' && (
                    <>
                      <ArrowDown className="h-3.5 w-3.5 text-[#645BE8]" aria-hidden="true" />
                      <span>Push onto TOP</span>
                    </>
                  )}
                  {visualState.operation === 'pop' && (
                    <>
                      <ArrowUp className="h-3.5 w-3.5 text-[#16B89D]" aria-hidden="true" />
                      <span>Pop from TOP</span>
                    </>
                  )}
                  {visualState.operation === 'check-match' && (
                    <span>
                      Comparing &quot;{visualState.currentChar}&quot; with TOP &quot;
                      {visualState.comparingWith}&quot;
                    </span>
                  )}
                  {visualState.operation === 'mismatch' && (
                    <span className="text-[#9A630A]">Mismatch Detected</span>
                  )}
                  {visualState.operation === 'unclosed' && (
                    <span className="text-[#9A630A]">
                      Unclosed Brackets Remain
                    </span>
                  )}
                  {visualState.operation === 'valid' && (
                    <span className="text-[#0D7D6A]">Balanced &amp; Empty Stack</span>
                  )}
                </div>
                <p className="text-[#555D7A] leading-relaxed">
                  {step.explanation}
                </p>
              </div>
            </div>

            {/* Vertical U-Shaped Stack Frame */}
            <div className="flex flex-col items-center">
              <span className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-[#645BE8]">
                &darr; Push / Pop at TOP &uarr;
              </span>
              <div className="flex min-h-[168px] w-full max-w-[200px] flex-col-reverse justify-start gap-2 rounded-b-2xl border-x-2 border-b-2 border-[#C5CBE3] bg-white px-3 pb-3 pt-4">
                {visualState.stack.length === 0 ? (
                  <div className="my-auto py-8 text-center text-xs font-medium text-[#8B93B0]">
                    Stack is empty
                  </div>
                ) : (
                  visualState.stack.map((item, idx) => {
                    const isTop = idx === visualState.stack.length - 1;
                    let itemStyle = 'border-[#DCE1F0] bg-[#F7F8FC] text-[#20253B]';
                    if (item.highlight === 'new') {
                      itemStyle =
                        'border-[#645BE8] bg-[#EEF0FF] text-[#4F46D8] shadow-xs';
                    } else if (item.highlight === 'matched') {
                      itemStyle =
                        'border-[#16B89D] bg-[#E6F8F4] text-[#0A594B] shadow-xs';
                    } else if (item.highlight === 'mismatched') {
                      itemStyle =
                        'border-[#F1B34C] bg-[#FEF6E6] text-[#9A630A] shadow-xs';
                    }

                    return (
                      <div
                        key={item.id}
                        className={`flex items-center justify-between rounded-xl border-2 px-3 py-2 font-mono text-sm font-bold transition-all duration-200 ${itemStyle}`}
                      >
                        <span>
                          {item.char}{' '}
                          <span className="text-[10px] font-normal opacity-75">
                            (idx {item.index})
                          </span>
                        </span>
                        {isTop && (
                          <span className="rounded-full bg-[#645BE8] px-2 py-0.5 font-sans text-[10px] font-bold text-white">
                            TOP
                          </span>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
              <span className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-[#8B93B0]">
                Bottom
              </span>
            </div>
          </div>

          {/* Terminal Result Banner */}
          {visualState.isValid === true && (
            <div
              role="status"
              className="flex items-start gap-2.5 rounded-2xl border border-[#16B89D] bg-[#E6F8F4] px-4 py-3 text-sm text-[#0A594B]"
            >
              <CheckCircle2
                className="h-5 w-5 shrink-0 text-[#16B89D] mt-0.5"
                aria-hidden="true"
              />
              <div>
                <p className="font-bold">Valid Parentheses (true)</p>
                <p className="text-xs mt-0.5">
                  Every bracket closed in proper Last-In-First-Out order and the stack ended empty.
                </p>
              </div>
            </div>
          )}

          {visualState.isValid === false && (
            <div
              role="status"
              className="flex items-start gap-2.5 rounded-2xl border border-[#F1B34C] bg-[#FEF6E6] px-4 py-3 text-sm text-[#9A630A]"
            >
              <XCircle className="h-5 w-5 shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <p className="font-bold">Invalid Parentheses (false)</p>
                <p className="text-xs mt-0.5 text-[#555D7A]">
                  {visualState.operation === 'unclosed'
                    ? 'Opening brackets remained unclosed on the stack when the string ended.'
                    : 'A closing bracket failed to match the TOP of the stack (or the stack was empty).'}
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
            aria-label="Stack highlight color legend"
            className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-[#E3E7F2] pt-3.5 text-xs text-[#555D7A]"
          >
            <span className="font-bold text-[#20253B]">Legend:</span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-[#645BE8]" aria-hidden="true" />
              Current / Pushed
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-[#16B89D]" aria-hidden="true" />
              Matched / Valid
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-[#F1B34C]" aria-hidden="true" />
              Mismatch / Unclosed
            </span>
          </div>
        </CardContent>
      </Card>

      <SolutionMapPreview
        graph={solutionGraph}
        activeGoalIndex={visualState.activeGoalIndex}
      />
    </div>
  );
}
