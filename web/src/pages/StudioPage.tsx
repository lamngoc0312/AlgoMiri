import { useCallback, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  Compass,
  Eye,
  GitBranch,
  GraduationCap,
  Library,
  MessageSquareText,
} from 'lucide-react';
import {
  getAllProblemModules,
  getProblemModule,
  type AnyProblemModule,
} from '../domain/problems/registry';
import type {
  ArrayHashVisualState,
  BinarySearchGreedyVisualState,
  GenericExecutionStep,
  StackVisualState,
} from '../domain/core/types';
import type { TwoSumInput } from '../domain/traces/types';
import type { ValidParenthesesInput } from '../domain/traces/validParenthesesValidation';
import type { SplitArrayInput } from '../domain/traces/splitArrayValidation';
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
import { StackVisualCanvas } from '../features/studio/StackVisualCanvas';
import { CompositionVisualCanvas } from '../features/studio/CompositionVisualCanvas';
import { PlaybackControls } from '../features/studio/PlaybackControls';
import { WalkthroughPane } from '../features/studio/WalkthroughPane';
import { useTracePlayback } from '../features/studio/useTracePlayback';
import { GuidedLessonBar } from '../features/guided/GuidedLessonBar';
import { GuidedStagePanel } from '../features/guided/GuidedStagePanel';
import { SessionSummaryCard } from '../features/guided/SessionSummaryCard';
import { InteractiveSolutionMap } from '../features/solutions/InteractiveSolutionMap';
import { AiTutorPanel } from '../features/analyzer/AiTutorPanel';
import { buildProblemAnalysisFromModule } from '../services/aiClient';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';

type StudioMode = 'guided' | 'explore';
type PerspectiveView = 'micro' | 'macro';
type MobileTab = 'problem' | 'canvas' | 'walkthrough';

const MOBILE_TABS: { id: MobileTab; label: string; icon: typeof Eye }[] = [
  { id: 'problem', label: 'Guide & Problem', icon: BookOpen },
  { id: 'canvas', label: 'Visual Canvas', icon: Eye },
  { id: 'walkthrough', label: 'Walkthrough', icon: MessageSquareText },
];

interface StudioWorkspaceProps {
  problemModule: AnyProblemModule;
  initialMode: StudioMode;
}

function StudioWorkspace({ problemModule, initialMode }: StudioWorkspaceProps) {
  const { spec, lesson } = problemModule;
  const firstStageId = lesson.stages[0]?.id ?? '';

  const [sessionId, setSessionId] = useState(1);
  const [mode, setMode] = useState<StudioMode>(initialMode);
  const [perspective, setPerspective] = useState<PerspectiveView>('micro');
  const [activeStageId, setActiveStageId] = useState<string>(firstStageId);
  const [showingSummary, setShowingSummary] = useState(false);

  const initialStrategy =
    initialMode === 'explore'
      ? problemModule.defaultStrategyId
      : problemModule.guidedInitialStrategyId;

  const [selectedStrategyId, setSelectedStrategyId] =
    useState<string>(initialStrategy);
  const [currentInput, setCurrentInput] = useState<unknown>(
    problemModule.defaultInput,
  );
  // Monotonic counter ensures re-applying the exact same input always resets playback
  const [applyRevision, setApplyRevision] = useState(0);
  const [mobileTab, setMobileTab] = useState<MobileTab>('canvas');
  const [predictModeEnabled, setPredictModeEnabled] = useState(
    initialMode === 'guided',
  );

  // Verified local session state (honest in-browser tracking, no account persistence)
  const [stageStatuses, setStageStatuses] = useState<StageStatusMap>(() =>
    createInitialStageStatuses(lesson.stages),
  );
  const [strategiesExplored, setStrategiesExplored] = useState<Set<string>>(
    () => new Set([initialStrategy]),
  );
  const [hintsByStage, setHintsByStage] = useState<Record<string, number>>(() =>
    createInitialHintsByStage(lesson.stages),
  );
  const [predictionRecords, setPredictionRecords] = useState<
    Record<string, PredictionRecord>
  >({});

  const activeStage =
    lesson.stages.find((s) => s.id === activeStageId) ?? lesson.stages[0];

  const strategy =
    spec.supportedStrategies.find((s) => s.id === selectedStrategyId) ??
    spec.supportedStrategies[0];

  const trace = useMemo(
    () => problemModule.generateTrace(strategy.id, currentInput),
    [problemModule, strategy.id, currentInput],
  );

  const traceContextId = `${problemModule.id}:s${sessionId}:r${applyRevision}:${strategy.id}:${problemModule.formatInputKey(currentInput)}`;

  const shouldPauseAtStep = useCallback(
    (stepIdx: number) => {
      if (mode !== 'guided' || !predictModeEnabled) return false;
      const prompt = problemModule.generatePrediction(
        trace.steps,
        stepIdx,
        strategy.id,
        traceContextId,
      );
      if (!prompt) return false;
      const record = predictionRecords[prompt.id];
      return !record?.solved && !record?.skipped;
    },
    [
      mode,
      predictModeEnabled,
      problemModule,
      trace.steps,
      strategy.id,
      traceContextId,
      predictionRecords,
    ],
  );

  // Phase A: Furthest reachable step is the FIRST unresolved guided checkpoint.
  // Prevents dragging the timeline slider over an unresolved checkpoint even if the current one is solved.
  const maxReachableStepIndex = useMemo(() => {
    const lastIdx = Math.max(0, trace.steps.length - 1);
    if (mode !== 'guided' || !predictModeEnabled) {
      return lastIdx;
    }
    for (let i = 0; i <= lastIdx; i += 1) {
      if (shouldPauseAtStep(i)) {
        return i;
      }
    }
    return lastIdx;
  }, [mode, predictModeEnabled, trace.steps.length, shouldPauseAtStep]);

  const playback = useTracePlayback({
    totalSteps: trace.steps.length,
    resetKey: traceContextId,
    shouldPauseAtStep,
  });

  const currentStep = trace.steps[playback.stepIndex] ?? trace.steps[0];
  const solutionGraph =
    problemModule.solutionGraphs[strategy.id] ??
    Object.values(problemModule.solutionGraphs)[0];

  const predictionPrompt = useMemo(
    () =>
      problemModule.generatePrediction(
        trace.steps,
        playback.stepIndex,
        strategy.id,
        traceContextId,
      ),
    [problemModule, trace.steps, playback.stepIndex, strategy.id, traceContextId],
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
    if (spec.supportedStrategies.some((s) => s.id === newStrategyId)) {
      setSelectedStrategyId(newStrategyId);
      setStrategiesExplored((prev) => new Set(prev).add(newStrategyId));
    }
  };

  const handleApplyInput = (nextInput: unknown) => {
    setCurrentInput(nextInput);
    setApplyRevision((rev) => rev + 1);
  };

  const navigateToStage = (stageId: string) => {
    setShowingSummary(false);
    setActiveStageId(stageId);
    setStageStatuses((prev) => markStageViewed(prev, stageId));
    const targetStage = lesson.stages.find((s) => s.id === stageId);
    if (targetStage) {
      setSelectedStrategyId(targetStage.recommendedStrategy);
      setStrategiesExplored((prev) =>
        new Set(prev).add(targetStage.recommendedStrategy),
      );
    }
  };

  const handleAnswerStage = (stageId: string, isCorrect: boolean) => {
    setStageStatuses((prev) => recordStageAnswer(prev, stageId, isCorrect));
  };

  const handleSkipOrContinue = (
    currentStageId: string,
    destination: string | 'summary',
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
    const maxHints = lesson.hintsByStage[activeStage.id]?.length ?? 3;
    setHintsByStage((prev) => ({
      ...prev,
      [activeStage.id]: Math.min(maxHints, (prev[activeStage.id] ?? 0) + 1),
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

  const handleRestartLesson = () => {
    setSessionId((id) => id + 1);
    setShowingSummary(false);
    setPerspective('micro');
    setActiveStageId(firstStageId);
    setSelectedStrategyId(problemModule.guidedInitialStrategyId);
    setCurrentInput(problemModule.defaultInput);
    setApplyRevision((rev) => rev + 1);
    setPredictModeEnabled(true);
    setStageStatuses(createInitialStageStatuses(lesson.stages));
    setStrategiesExplored(new Set([problemModule.guidedInitialStrategyId]));
    setHintsByStage(createInitialHintsByStage(lesson.stages));
    setPredictionRecords({});
  };

  const lockedStrategyIds =
    mode === 'guided' ? activeStage.lockedStrategyIds : [];

  const allModules = getAllProblemModules();

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-4">
      {/* Studio Top Bar + Problem Switcher + Mode Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-[#20253B]">
              Learning Studio
            </h1>
            <Badge variant="indigo">{spec.title}</Badge>
            <Badge variant="mint">
              {mode === 'guided' ? 'Guided Learning' : 'Free Exploration'}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-[#555D7A]">
            {mode === 'guided'
              ? 'Discover the intuition step by step, inspect the Solution Map, and predict verified trace transitions.'
              : 'Explore freely across Micro (execution trace) and Macro (conceptual Solution Map) views.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Problem Switcher */}
          <nav
            aria-label="Switch problem"
            className="inline-flex items-center gap-1 rounded-2xl border border-[#E3E7F2] bg-white p-1"
          >
            {allModules.map((mod) => {
              const isCurrent = mod.id === problemModule.id;
              return (
                <Link
                  key={mod.id}
                  to={`/studio/${mod.id}${mode === 'explore' ? '?mode=explore' : ''}`}
                  className={`rounded-xl px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                    isCurrent
                      ? 'bg-[#EEF0FF] text-[#4F46D8]'
                      : 'text-[#555D7A] hover:text-[#20253B]'
                  }`}
                >
                  {mod.spec.title}
                </Link>
              );
            })}
            <Link
              to="/problems"
              className="inline-flex items-center gap-1 rounded-xl px-2 py-1.5 text-xs font-semibold text-[#555D7A] hover:text-[#20253B]"
              title="Open Problem Library"
            >
              <Library className="h-3.5 w-3.5" aria-hidden="true" />
              All
            </Link>
          </nav>

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
      </div>

      {/* Guided Lesson Stepper */}
      {mode === 'guided' && (
        <GuidedLessonBar
          stages={lesson.stages}
          activeStageId={activeStage.id}
          stageStatuses={stageStatuses}
          showingSummary={showingSummary}
          onSelectStage={navigateToStage}
          onOpenSummary={() => setShowingSummary(true)}
        />
      )}

      {/* Session Summary View */}
      {mode === 'guided' && showingSummary ? (
        <div className="mx-auto max-w-3xl pt-2">
          <SessionSummaryCard
            problem={spec}
            lesson={lesson}
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
                  lesson={lesson}
                  stage={activeStage}
                  stageStatus={stageStatuses[activeStage.id] ?? 'viewed'}
                  revealedHintsCount={hintsByStage[activeStage.id] ?? 0}
                  onRevealNextHint={handleRevealNextHint}
                  onAnswerStage={handleAnswerStage}
                  onNavigateStage={navigateToStage}
                  onSkipOrContinue={handleSkipOrContinue}
                />
              )}

              <ProblemPane
                problem={spec}
                selectedStrategyId={strategy.id}
                onSelectStrategy={handleSelectStrategy}
                lockedStrategyIds={lockedStrategyIds}
              />
            </section>

            <section
              aria-label="Visual execution canvas panel"
              className={`space-y-4 ${
                mobileTab === 'canvas' ? 'block' : 'hidden lg:block'
              }`}
            >
              {/* Synchronized Micro / Macro Perspective Switcher */}
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-[#E3E7F2] bg-white px-3.5 py-2.5">
                <span className="text-xs font-bold text-[#555D7A]">
                  Perspective:
                </span>
                <div
                  role="group"
                  aria-label="Micro and Macro view switcher"
                  className="inline-flex rounded-xl border border-[#E3E7F2] bg-[#F7F8FC] p-0.5"
                >
                  <button
                    type="button"
                    aria-pressed={perspective === 'micro'}
                    onClick={() => setPerspective('micro')}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                      perspective === 'micro'
                        ? 'bg-[#645BE8] text-white shadow-2xs'
                        : 'text-[#555D7A] hover:text-[#20253B]'
                    }`}
                  >
                    <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                    Micro View (Execution)
                  </button>
                  <button
                    type="button"
                    aria-pressed={perspective === 'macro'}
                    onClick={() => setPerspective('macro')}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                      perspective === 'macro'
                        ? 'bg-[#645BE8] text-white shadow-2xs'
                        : 'text-[#555D7A] hover:text-[#20253B]'
                    }`}
                  >
                    <GitBranch className="h-3.5 w-3.5" aria-hidden="true" />
                    Macro View (Solution Map)
                  </button>
                </div>
              </div>

              {perspective === 'macro' ? (
                <div className="space-y-4">
                  <InteractiveSolutionMap
                    key={solutionGraph.id}
                    graph={solutionGraph}
                    steps={trace.steps}
                    currentStep={currentStep}
                    maxAllowedStepIndex={maxReachableStepIndex}
                    onSelectStep={(idx) => {
                      playback.goToStep(idx);
                      setPerspective('micro');
                    }}
                    onSwitchToMicro={() => setPerspective('micro')}
                  />

                  <PlaybackControls
                    stepIndex={playback.stepIndex}
                    totalSteps={trace.steps.length}
                    isPlaying={playback.isPlaying}
                    speed={playback.speed}
                    status={currentStep.visualState.status}
                    checkpointPaused={isPredictionCheckpointActive}
                    maxAllowedStepIndex={maxReachableStepIndex}
                    onPrev={playback.prev}
                    onNext={playback.next}
                    onTogglePlay={playback.togglePlay}
                    onReset={playback.reset}
                    onSpeedChange={playback.setSpeed}
                    onSeek={playback.goToStep}
                  />
                </div>
              ) : currentStep.visualState.kind === 'array-hash' ? (
                <VisualCanvas
                  sessionId={sessionId}
                  strategy={strategy}
                  currentInput={currentInput as TwoSumInput}
                  step={currentStep as GenericExecutionStep<ArrayHashVisualState>}
                  stepIndex={playback.stepIndex}
                  totalSteps={trace.steps.length}
                  isPlaying={playback.isPlaying}
                  speed={playback.speed}
                  solutionGraph={solutionGraph}
                  predictModeEnabled={predictModeEnabled}
                  predictionPrompt={predictionPrompt}
                  predictionRecord={currentPredictionRecord}
                  checkpointPaused={isPredictionCheckpointActive}
                  maxAllowedStepIndex={maxReachableStepIndex}
                  onTogglePredictMode={() =>
                    setPredictModeEnabled((prev) => !prev)
                  }
                  onAnswerPrediction={handleAnswerPrediction}
                  onSkipPrediction={handleSkipPrediction}
                  onApplyInput={(nextInput) =>
                    handleApplyInput({
                      nums: [...nextInput.nums],
                      target: nextInput.target,
                    })
                  }
                  onPrev={playback.prev}
                  onNext={playback.next}
                  onTogglePlay={playback.togglePlay}
                  onReset={playback.reset}
                  onSpeedChange={playback.setSpeed}
                  onSeek={playback.goToStep}
                  onOpenMacroView={() => setPerspective('macro')}
                />
              ) : currentStep.visualState.kind === 'stack' ? (
                <StackVisualCanvas
                  sessionId={sessionId}
                  strategy={strategy}
                  currentInput={currentInput as ValidParenthesesInput}
                  presets={problemModule.presets}
                  step={currentStep as GenericExecutionStep<StackVisualState>}
                  stepIndex={playback.stepIndex}
                  totalSteps={trace.steps.length}
                  isPlaying={playback.isPlaying}
                  speed={playback.speed}
                  solutionGraph={solutionGraph}
                  predictModeEnabled={predictModeEnabled}
                  predictionPrompt={predictionPrompt}
                  predictionRecord={currentPredictionRecord}
                  checkpointPaused={isPredictionCheckpointActive}
                  maxAllowedStepIndex={maxReachableStepIndex}
                  onTogglePredictMode={() =>
                    setPredictModeEnabled((prev) => !prev)
                  }
                  onAnswerPrediction={handleAnswerPrediction}
                  onSkipPrediction={handleSkipPrediction}
                  onApplyInput={(nextInput) =>
                    handleApplyInput({ brackets: nextInput.brackets })
                  }
                  onPrev={playback.prev}
                  onNext={playback.next}
                  onTogglePlay={playback.togglePlay}
                  onReset={playback.reset}
                  onSpeedChange={playback.setSpeed}
                  onSeek={playback.goToStep}
                  onOpenMacroView={() => setPerspective('macro')}
                />
              ) : (
                <CompositionVisualCanvas
                  sessionId={sessionId}
                  strategy={strategy}
                  currentInput={currentInput as SplitArrayInput}
                  presets={problemModule.presets}
                  step={
                    currentStep as GenericExecutionStep<BinarySearchGreedyVisualState>
                  }
                  stepIndex={playback.stepIndex}
                  totalSteps={trace.steps.length}
                  isPlaying={playback.isPlaying}
                  speed={playback.speed}
                  solutionGraph={solutionGraph}
                  predictModeEnabled={predictModeEnabled}
                  predictionPrompt={predictionPrompt}
                  predictionRecord={currentPredictionRecord}
                  checkpointPaused={isPredictionCheckpointActive}
                  maxAllowedStepIndex={maxReachableStepIndex}
                  onTogglePredictMode={() =>
                    setPredictModeEnabled((prev) => !prev)
                  }
                  onAnswerPrediction={handleAnswerPrediction}
                  onSkipPrediction={handleSkipPrediction}
                  onApplyInput={(nextInput) =>
                    handleApplyInput({
                      nums: [...nextInput.nums],
                      k: nextInput.k,
                    })
                  }
                  onPrev={playback.prev}
                  onNext={playback.next}
                  onTogglePlay={playback.togglePlay}
                  onReset={playback.reset}
                  onSpeedChange={playback.setSpeed}
                  onSeek={playback.goToStep}
                  onOpenMacroView={() => setPerspective('macro')}
                />
              )}
            </section>

            <section
              aria-label="Step walkthrough and explanation panel"
              className={`space-y-4 ${
                mobileTab === 'walkthrough' ? 'block' : 'hidden lg:block'
              }`}
            >
              <WalkthroughPane
                strategy={strategy}
                step={currentStep}
                stepIndex={playback.stepIndex}
                totalSteps={trace.steps.length}
              />

              <StudioTutorDrawer
                problemModule={problemModule}
                selectedStrategy={strategy.name}
                learningStage={mode === 'guided' ? activeStage.title : 'Free Exploration'}
                executionContext={`Step ${playback.stepIndex + 1} of ${trace.steps.length}: ${currentStep.actionTitle} — ${currentStep.explanation}`}
              />
            </section>
          </div>
        </>
      )}
    </div>
  );
}

function StudioTutorDrawer({
  problemModule,
  selectedStrategy,
  learningStage,
  executionContext,
}: {
  problemModule: AnyProblemModule;
  selectedStrategy: string;
  learningStage: string;
  executionContext: string;
}) {
  const [open, setOpen] = useState(false);
  const analysis = useMemo(
    () => buildProblemAnalysisFromModule(problemModule),
    [problemModule],
  );

  return (
    <div className="space-y-2">
      <Button
        variant="secondary"
        size="sm"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className="w-full"
      >
        {open ? 'Hide AI Tutor' : 'Ask AI Tutor About This Step'}
      </Button>
      {open && (
        <AiTutorPanel
          contextKey={`studio:${problemModule.id}:${selectedStrategy}`}
          problemAnalysis={analysis}
          selectedStrategy={selectedStrategy}
          learningStage={learningStage}
          executionContext={executionContext}
        />
      )}
    </div>
  );
}

export function StudioPage() {
  const { problemId } = useParams<{ problemId: string }>();
  const [searchParams] = useSearchParams();
  const initialMode: StudioMode =
    searchParams.get('mode') === 'explore' ? 'explore' : 'guided';

  const resolvedId = problemId ?? 'two-sum';
  const problemModule = getProblemModule(resolvedId);

  if (!problemModule) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <Card className="border-[#F1B34C]">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-2 text-[#9A630A]">
              <AlertCircle className="h-5 w-5" aria-hidden="true" />
              <h1 className="text-lg font-extrabold text-[#20253B]">
                Problem Not Available Yet
              </h1>
            </div>
            <p className="text-sm leading-relaxed text-[#555D7A]">
              We don&apos;t have a verified deterministic visual engine for{' '}
              <code className="font-mono font-semibold text-[#20253B]">
                {resolvedId}
              </code>{' '}
              yet. Choose a supported interactive problem from the Problem Library.
            </p>
            <Link
              to="/problems"
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#645BE8] px-4 text-sm font-semibold text-white hover:bg-[#4F46D8]"
            >
              Browse Problem Library
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Keying by problemModule.id guarantees clean reset of all playback & learning state when switching problems
  return (
    <StudioWorkspace
      key={problemModule.id}
      problemModule={problemModule}
      initialMode={initialMode}
    />
  );
}
