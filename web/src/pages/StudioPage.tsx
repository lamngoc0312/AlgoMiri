import { useCallback, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  BookOpen,
  Compass,
  Eye,
  GraduationCap,
  MessageSquareText,
} from 'lucide-react';
import {
  TWO_SUM_PROBLEM,
  TWO_SUM_SOLUTION_GRAPHS,
} from '../domain/problems/twoSumDemo';
import {
  DEFAULT_TWO_SUM_INPUT,
  generateTwoSumTrace,
} from '../domain/traces/twoSumEngine';
import type { TwoSumInput, TwoSumStrategyId } from '../domain/traces/types';
import {
  TWO_SUM_GUIDED_STAGES,
  type GuidedStageId,
} from '../domain/learning/twoSumLesson';
import { generatePredictionPrompt } from '../domain/learning/predictions';
import {
  createInitialHintsByStage,
  createInitialStageStatuses,
  markStageSkippedIfIncomplete,
  markStageViewed,
  recordPredictionAnswer,
  recordPredictionSkip,
  recordStageAnswer,
  summarizePredictions,
  type PredictionRecord,
  type StageStatusMap,
} from '../domain/learning/session';
import { ProblemPane } from '../features/studio/ProblemPane';
import { VisualCanvas } from '../features/studio/VisualCanvas';
import { WalkthroughPane } from '../features/studio/WalkthroughPane';
import { useTracePlayback } from '../features/studio/useTracePlayback';
import { GuidedLessonBar } from '../features/guided/GuidedLessonBar';
import { GuidedStagePanel } from '../features/guided/GuidedStagePanel';
import { SessionSummaryCard } from '../features/guided/SessionSummaryCard';
import { Badge } from '../components/ui/Badge';

type StudioMode = 'guided' | 'explore';
type MobileTab = 'problem' | 'canvas' | 'walkthrough';

const MOBILE_TABS: { id: MobileTab; label: string; icon: typeof Eye }[] = [
  { id: 'problem', label: 'Guide & Problem', icon: BookOpen },
  { id: 'canvas', label: 'Visual Canvas', icon: Eye },
  { id: 'walkthrough', label: 'Walkthrough', icon: MessageSquareText },
];

export function StudioPage() {
  const [searchParams] = useSearchParams();
  const initialMode: StudioMode =
    searchParams.get('mode') === 'explore' ? 'explore' : 'guided';

  const [sessionId, setSessionId] = useState(1);
  const [mode, setMode] = useState<StudioMode>(initialMode);
  const [activeStageId, setActiveStageId] =
    useState<GuidedStageId>('understand');
  const [showingSummary, setShowingSummary] = useState(false);

  // Start Guided mode with Brute Force so beginners discover Hash Map in Stage 3
  const [selectedStrategyId, setSelectedStrategyId] =
    useState<TwoSumStrategyId>(
      initialMode === 'explore' ? 'hash-map' : 'brute-force',
    );
  const [currentInput, setCurrentInput] = useState<TwoSumInput>(
    DEFAULT_TWO_SUM_INPUT,
  );
  // Monotonic counter ensures re-applying the exact same input always resets playback
  const [applyRevision, setApplyRevision] = useState(0);
  const [mobileTab, setMobileTab] = useState<MobileTab>('canvas');
  const [predictModeEnabled, setPredictModeEnabled] = useState(
    initialMode === 'guided',
  );

  // Verified local session state (honest in-browser tracking, no account persistence)
  const [stageStatuses, setStageStatuses] = useState<StageStatusMap>(
    createInitialStageStatuses,
  );
  const [strategiesExplored, setStrategiesExplored] = useState<
    Set<TwoSumStrategyId>
  >(() => new Set([initialMode === 'explore' ? 'hash-map' : 'brute-force']));
  const [hintsByStage, setHintsByStage] = useState<
    Record<GuidedStageId, number>
  >(createInitialHintsByStage);
  const [predictionRecords, setPredictionRecords] = useState<
    Record<string, PredictionRecord>
  >({});

  const activeStage =
    TWO_SUM_GUIDED_STAGES.find((s) => s.id === activeStageId) ??
    TWO_SUM_GUIDED_STAGES[0];

  const strategy =
    TWO_SUM_PROBLEM.supportedStrategies.find((s) => s.id === selectedStrategyId) ??
    TWO_SUM_PROBLEM.supportedStrategies[0];

  const trace = useMemo(
    () => generateTwoSumTrace(selectedStrategyId, currentInput),
    [selectedStrategyId, currentInput],
  );

  // Stable trace + session identity for both playback resets and prediction IDs
  const traceContextId = `s${sessionId}:r${applyRevision}:${selectedStrategyId}:${currentInput.nums.join(',')}:${currentInput.target}`;

  const shouldPauseAtStep = useCallback(
    (stepIdx: number) => {
      if (mode !== 'guided' || !predictModeEnabled) return false;
      const prompt = generatePredictionPrompt(
        trace.steps,
        stepIdx,
        selectedStrategyId,
        traceContextId,
      );
      if (!prompt) return false;
      const record = predictionRecords[prompt.id];
      return !record?.solved && !record?.skipped;
    },
    [
      mode,
      predictModeEnabled,
      trace.steps,
      selectedStrategyId,
      traceContextId,
      predictionRecords,
    ],
  );

  const playback = useTracePlayback({
    totalSteps: trace.steps.length,
    resetKey: traceContextId,
    shouldPauseAtStep,
  });

  const currentStep = trace.steps[playback.stepIndex] ?? trace.steps[0];
  const solutionGraph =
    TWO_SUM_SOLUTION_GRAPHS[strategy.id] ?? TWO_SUM_SOLUTION_GRAPHS['hash-map'];

  const predictionPrompt = useMemo(
    () =>
      generatePredictionPrompt(
        trace.steps,
        playback.stepIndex,
        selectedStrategyId,
        traceContextId,
      ),
    [trace.steps, playback.stepIndex, selectedStrategyId, traceContextId],
  );

  const currentPredictionRecord = predictionPrompt
    ? predictionRecords[predictionPrompt.id]
    : undefined;

  const isPredictionCheckpointActive = shouldPauseAtStep(playback.stepIndex);

  const predictionStats = useMemo(
    () => summarizePredictions(predictionRecords),
    [predictionRecords],
  );

  const totalHintsUsed = Object.values(hintsByStage).reduce(
    (sum, count) => sum + count,
    0,
  );

  const handleSelectStrategy = (newStrategyId: string) => {
    if (newStrategyId === 'brute-force' || newStrategyId === 'hash-map') {
      setSelectedStrategyId(newStrategyId);
      setStrategiesExplored((prev) => new Set(prev).add(newStrategyId));
    }
  };

  const handleApplyInput = (nextInput: TwoSumInput) => {
    setCurrentInput({
      nums: [...nextInput.nums],
      target: nextInput.target,
    });
    setApplyRevision((rev) => rev + 1);
  };

  const navigateToStage = (stageId: GuidedStageId) => {
    setShowingSummary(false);
    setActiveStageId(stageId);
    setStageStatuses((prev) => markStageViewed(prev, stageId));
    const targetStage = TWO_SUM_GUIDED_STAGES.find((s) => s.id === stageId);
    if (targetStage) {
      setSelectedStrategyId(targetStage.recommendedStrategy);
      setStrategiesExplored((prev) =>
        new Set(prev).add(targetStage.recommendedStrategy),
      );
    }
  };

  const handleAnswerStage = (stageId: GuidedStageId, isCorrect: boolean) => {
    setStageStatuses((prev) => recordStageAnswer(prev, stageId, isCorrect));
  };

  const handleSkipOrContinue = (
    currentStageId: GuidedStageId,
    destination: GuidedStageId | 'summary',
  ) => {
    setStageStatuses((prev) =>
      markStageSkippedIfIncomplete(prev, currentStageId),
    );
    if (destination === 'summary') {
      setShowingSummary(true);
    } else {
      navigateToStage(destination);
    }
  };

  const handleRevealNextHint = () => {
    setHintsByStage((prev) => ({
      ...prev,
      [activeStage.id]: Math.min(3, prev[activeStage.id] + 1),
    }));
  };

  const handleAnswerPrediction = (
    questionId: string,
    optionId: string,
    isCorrect: boolean,
  ) => {
    setPredictionRecords((prev) =>
      recordPredictionAnswer(prev, questionId, optionId, isCorrect),
    );
  };

  const handleSkipPrediction = (questionId: string) => {
    setPredictionRecords((prev) => recordPredictionSkip(prev, questionId));
    playback.next();
  };

  const handleSwitchMode = (nextMode: StudioMode) => {
    setMode(nextMode);
    setShowingSummary(false);
    if (nextMode === 'explore') {
      setPredictModeEnabled(false);
    } else {
      setPredictModeEnabled(true);
      setSelectedStrategyId(activeStage.recommendedStrategy);
    }
  };

  // Clean full session reset
  const handleRestartLesson = () => {
    setSessionId((id) => id + 1);
    setShowingSummary(false);
    setActiveStageId('understand');
    setSelectedStrategyId('brute-force');
    setCurrentInput({
      nums: [...DEFAULT_TWO_SUM_INPUT.nums],
      target: DEFAULT_TWO_SUM_INPUT.target,
    });
    setApplyRevision((rev) => rev + 1);
    setPredictModeEnabled(true);
    setStageStatuses(createInitialStageStatuses());
    setStrategiesExplored(new Set(['brute-force']));
    setHintsByStage(createInitialHintsByStage());
    setPredictionRecords({});
  };

  const lockedStrategyIds =
    mode === 'guided' && !activeStage.unlocksHashMap ? ['hash-map'] : [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-4">
      {/* Studio Top Bar + Mode Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-[#20253B]">
              Learning Studio
            </h1>
            <Badge variant="indigo">Two Sum</Badge>
            <Badge variant="mint">
              {mode === 'guided' ? 'Guided Learning' : 'Free Exploration'}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-[#555D7A]">
            {mode === 'guided'
              ? 'Discover the intuition step by step, predict transitions, and reveal pseudocode only when ready.'
              : 'Explore both strategies freely with custom inputs, playback controls, and optional step predictions.'}
          </p>
        </div>

        {/* Mode Switcher */}
        <div
          role="group"
          aria-label="Learning mode switcher"
          className="inline-flex rounded-2xl border border-[#E3E7F2] bg-white p-1 shadow-[0_1px_2px_rgba(32,37,59,0.04)]"
        >
          <button
            type="button"
            aria-pressed={mode === 'guided'}
            onClick={() => handleSwitchMode('guided')}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition-colors cursor-pointer ${
              mode === 'guided'
                ? 'bg-[#645BE8] text-white shadow-xs'
                : 'text-[#555D7A] hover:text-[#20253B]'
            }`}
          >
            <GraduationCap className="h-4 w-4" aria-hidden="true" />
            Guided Learning
          </button>
          <button
            type="button"
            aria-pressed={mode === 'explore'}
            onClick={() => handleSwitchMode('explore')}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition-colors cursor-pointer ${
              mode === 'explore'
                ? 'bg-[#645BE8] text-white shadow-xs'
                : 'text-[#555D7A] hover:text-[#20253B]'
            }`}
          >
            <Compass className="h-4 w-4" aria-hidden="true" />
            Free Exploration
          </button>
        </div>
      </div>

      {/* Guided Lesson 4-Stage Stepper */}
      {mode === 'guided' && (
        <GuidedLessonBar
          activeStageId={activeStage.id}
          stageStatuses={stageStatuses}
          showingSummary={showingSummary}
          onSelectStage={navigateToStage}
          onOpenSummary={() => setShowingSummary(true)}
        />
      )}

      {/* Session Summary View (when requested in Guided Mode) */}
      {mode === 'guided' && showingSummary ? (
        <div className="mx-auto max-w-3xl pt-2">
          <SessionSummaryCard
            strategiesExplored={strategiesExplored}
            stageStatuses={stageStatuses}
            predictionStats={predictionStats}
            hintsUsed={totalHintsUsed}
            onSwitchToExplore={() => handleSwitchMode('explore')}
            onRestartLesson={handleRestartLesson}
          />
        </div>
      ) : (
        <>
          {/* Mobile Tab Bar (< 1024px) */}
          <div
            role="tablist"
            aria-label="Learning Studio panes"
            className="grid grid-cols-3 gap-1.5 rounded-2xl border border-[#E3E7F2] bg-white p-1.5 lg:hidden"
          >
            {MOBILE_TABS.map(({ id, label, icon: Icon }) => {
              const isActive = mobileTab === id;
              return (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setMobileTab(id)}
                  className={`flex items-center justify-center gap-1.5 rounded-xl px-2 py-2.5 text-xs font-semibold transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-[#645BE8] text-white shadow-xs'
                      : 'text-[#555D7A] hover:bg-[#F7F8FC]'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span className="truncate">{label}</span>
                </button>
              );
            })}
          </div>

          {/* Responsive 3-Column Desktop Grid / Mobile Tabbed Panes */}
          <div className="grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)_300px] lg:items-start">
            <section
              aria-label="Problem and guided lesson panel"
              className={`space-y-4 ${
                mobileTab === 'problem' ? 'block' : 'hidden lg:block'
              }`}
            >
              {mode === 'guided' && (
                <GuidedStagePanel
                  key={sessionId}
                  stage={activeStage}
                  stageStatus={stageStatuses[activeStage.id]}
                  revealedHintsCount={hintsByStage[activeStage.id]}
                  onRevealNextHint={handleRevealNextHint}
                  onAnswerStage={handleAnswerStage}
                  onNavigateStage={navigateToStage}
                  onSkipOrContinue={handleSkipOrContinue}
                />
              )}

              <ProblemPane
                problem={TWO_SUM_PROBLEM}
                selectedStrategyId={strategy.id}
                onSelectStrategy={handleSelectStrategy}
                lockedStrategyIds={lockedStrategyIds}
              />
            </section>

            <section
              aria-label="Visual execution canvas panel"
              className={mobileTab === 'canvas' ? 'block' : 'hidden lg:block'}
            >
              <VisualCanvas
                sessionId={sessionId}
                strategy={strategy}
                currentInput={currentInput}
                step={currentStep}
                stepIndex={playback.stepIndex}
                totalSteps={trace.steps.length}
                isPlaying={playback.isPlaying}
                speed={playback.speed}
                solutionGraph={solutionGraph}
                predictModeEnabled={predictModeEnabled}
                predictionPrompt={predictionPrompt}
                predictionRecord={currentPredictionRecord}
                checkpointPaused={isPredictionCheckpointActive}
                onTogglePredictMode={() =>
                  setPredictModeEnabled((prev) => !prev)
                }
                onAnswerPrediction={handleAnswerPrediction}
                onSkipPrediction={handleSkipPrediction}
                onApplyInput={handleApplyInput}
                onPrev={playback.prev}
                onNext={playback.next}
                onTogglePlay={playback.togglePlay}
                onReset={playback.reset}
                onSpeedChange={playback.setSpeed}
                onSeek={playback.goToStep}
              />
            </section>

            <section
              aria-label="Step walkthrough and explanation panel"
              className={
                mobileTab === 'walkthrough' ? 'block' : 'hidden lg:block'
              }
            >
              <WalkthroughPane
                strategy={strategy}
                step={currentStep}
                stepIndex={playback.stepIndex}
                totalSteps={trace.steps.length}
              />
            </section>
          </div>
        </>
      )}
    </div>
  );
}
