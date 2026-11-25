import { useCallback, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
import {
  buildLearningSession,
  createSessionId,
} from '../domain/learning/analytics';
import type {
  LearningEvent,
  LearningSession,
} from '../domain/learning/types';
import { defaultLearningRepository } from '../services/learningRepository';
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
import { localizeLesson } from '../i18n/learningLocalization';
import { Badge } from '../components/ui/Badge';
import { Card, CardContent } from '../components/ui/Card';

type StudioMode = 'guided' | 'explore';
type PerspectiveView = 'micro' | 'macro';
type MobileTab = 'problem' | 'canvas' | 'walkthrough';

const MOBILE_TABS: {
  id: MobileTab;
  labelKey: 'studio.mobileTabs.problem' | 'studio.mobileTabs.canvas' | 'studio.mobileTabs.walkthrough';
  icon: typeof Eye;
}[] = [
  { id: 'problem', labelKey: 'studio.mobileTabs.problem', icon: BookOpen },
  { id: 'canvas', labelKey: 'studio.mobileTabs.canvas', icon: Eye },
  { id: 'walkthrough', labelKey: 'studio.mobileTabs.walkthrough', icon: MessageSquareText },
];

interface StudioWorkspaceProps {
  problemModule: AnyProblemModule;
  initialMode: StudioMode;
}

function StudioWorkspace({ problemModule, initialMode }: StudioWorkspaceProps) {
  const { t, i18n } = useTranslation();
  const { spec } = problemModule;
  const lesson = useMemo(
    () => localizeLesson(t, problemModule.id, problemModule.lesson),
    // Recompute localized lesson copy whenever active language changes without resetting session state
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, i18n.resolvedLanguage, problemModule.id, problemModule.lesson],
  );
  const firstStageId = lesson.stages[0]?.id ?? '';

  const [sessionId, setSessionId] = useState(1);
  const [sessionUuid, setSessionUuid] = useState<string>(() =>
    createSessionId(problemModule.id),
  );
  const [sessionStartedAt, setSessionStartedAt] = useState<string>(() =>
    new Date().toISOString(),
  );
  const [sessionEvents, setSessionEvents] = useState<LearningEvent[]>(() => [
    {
      id: `init-stage-${firstStageId}`,
      type: 'stage-viewed',
      timestamp: new Date().toISOString(),
      stageId: firstStageId,
    },
  ]);
  const [savedSessionRecord, setSavedSessionRecord] =
    useState<LearningSession | null>(null);
  const [saveWarning, setSaveWarning] = useState<string | null>(null);
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
  const [previouslySkippedStages, setPreviouslySkippedStages] = useState<
    Set<string>
  >(() => new Set());
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

  const appendEvent = (event: Omit<LearningEvent, 'id' | 'timestamp'>) => {
    const timestamp = new Date().toISOString();
    setSessionEvents((prev) => [
      ...prev,
      {
        ...event,
        id: `${sessionUuid}:ev-${prev.length + 1}`,
        timestamp,
      },
    ]);
  };

  const persistCurrentSession = (
    overrideStatuses?: StageStatusMap,
    overrideEvents?: LearningEvent[],
    overrideSkippedStages?: Set<string>,
  ) => {
    const statusesToUse = overrideStatuses ?? stageStatuses;
    const eventsToUse = overrideEvents ?? sessionEvents;
    const skippedStagesToUse = overrideSkippedStages ?? previouslySkippedStages;
    const built = buildLearningSession({
      sessionId: sessionUuid,
      problemId: problemModule.id,
      problemTitle: spec.title,
      mode,
      strategiesExplored,
      startedAt: sessionStartedAt,
      stageIds: lesson.stages.map((s) => s.id),
      stageStatuses: statusesToUse,
      previouslySkippedStageIds: skippedStagesToUse,
      hintsByStage,
      predictionRecords,
      events: eventsToUse,
    });
    const res = defaultLearningRepository.saveSession(built);
    if (res.saved) {
      setSavedSessionRecord(built);
      setSaveWarning(null);
    } else {
      setSaveWarning(
        res.warningMessage ?? t('studio.saveSessionError'),
      );
    }
  };

  const hasRecordedActivity = (statuses: StageStatusMap) => {
    const anyStageActivity = Object.values(statuses).some(
      (s) =>
        s === 'completed' ||
        s === 'attempted' ||
        s === 'skipped' ||
        s === 'skipped-after-attempt',
    );
    return (
      anyStageActivity ||
      Object.keys(predictionRecords).length > 0 ||
      totalHintsUsed > 0
    );
  };

  const handleSelectStrategy = (newStrategyId: string) => {
    if (spec.supportedStrategies.some((s) => s.id === newStrategyId)) {
      setSelectedStrategyId(newStrategyId);
      setStrategiesExplored((prev) => new Set(prev).add(newStrategyId));
      appendEvent({ type: 'strategy-explored', strategyId: newStrategyId });
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
    appendEvent({ type: 'stage-viewed', stageId });
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
    appendEvent({ type: 'stage-answered', stageId, correct: isCorrect });
  };

  const handleSkipOrContinue = (
    currentStageId: string,
    destination: string | 'summary',
  ) => {
    const nextStatuses = markStageSkippedIfIncomplete(
      stageStatuses,
      currentStageId,
    );
    setStageStatuses(nextStatuses);

    const wasSkipped =
      nextStatuses[currentStageId] === 'skipped' ||
      nextStatuses[currentStageId] === 'skipped-after-attempt';
    const nextSkippedStages = wasSkipped
      ? new Set(previouslySkippedStages).add(currentStageId)
      : previouslySkippedStages;
    const nextEvents = wasSkipped
      ? [
          ...sessionEvents,
          {
            id: `${sessionUuid}:ev-${sessionEvents.length + 1}`,
            type: 'stage-skipped' as const,
            timestamp: new Date().toISOString(),
            stageId: currentStageId,
          },
        ]
      : sessionEvents;
    if (wasSkipped) {
      setPreviouslySkippedStages(nextSkippedStages);
      setSessionEvents(nextEvents);
    }

    if (destination === 'summary') {
      setShowingSummary(true);
      persistCurrentSession(nextStatuses, nextEvents, nextSkippedStages);
    } else {
      navigateToStage(destination);
    }
  };

  const handleOpenSummary = () => {
    setShowingSummary(true);
    if (hasRecordedActivity(stageStatuses)) {
      persistCurrentSession();
    }
  };

  const handleRevealNextHint = () => {
    const maxHints = lesson.hintsByStage[activeStage.id]?.length ?? 3;
    const nextLevel = Math.min(maxHints, (hintsByStage[activeStage.id] ?? 0) + 1);
    setHintsByStage((prev) => ({
      ...prev,
      [activeStage.id]: nextLevel,
    }));
    appendEvent({
      type: 'hint-revealed',
      stageId: activeStage.id,
      hintLevel: nextLevel,
    });
  };

  const handleAnswerPrediction = (
    questionId: string,
    optionId: string,
    isCorrect: boolean,
  ) => {
    const nextStep = trace.steps[playback.stepIndex + 1];
    setPredictionRecords((prev) =>
      recordPredictionAnswer(prev, questionId, optionId, isCorrect, {
        strategyId: strategy.id,
        stepAction: currentStep.action,
        nextStepAction: nextStep?.action,
        stepIndex: currentStep.stepIndex,
      }),
    );
    appendEvent({
      type: 'prediction-answered',
      questionId,
      strategyId: strategy.id,
      correct: isCorrect,
    });
  };

  const handleSkipPrediction = (questionId: string) => {
    const nextStep = trace.steps[playback.stepIndex + 1];
    setPredictionRecords((prev) =>
      recordPredictionSkip(prev, questionId, {
        strategyId: strategy.id,
        stepAction: currentStep.action,
        nextStepAction: nextStep?.action,
        stepIndex: currentStep.stepIndex,
      }),
    );
    appendEvent({
      type: 'prediction-skipped',
      questionId,
      strategyId: strategy.id,
    });
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
    const freshUuid = createSessionId(problemModule.id);
    const now = new Date().toISOString();
    setSessionId((id) => id + 1);
    setSessionUuid(freshUuid);
    setSessionStartedAt(now);
    setSessionEvents([
      {
        id: `${freshUuid}:ev-1`,
        type: 'stage-viewed',
        timestamp: now,
        stageId: firstStageId,
      },
    ]);
    setSavedSessionRecord(null);
    setSaveWarning(null);
    setShowingSummary(false);
    setPerspective('micro');
    setActiveStageId(firstStageId);
    setSelectedStrategyId(problemModule.guidedInitialStrategyId);
    setCurrentInput(problemModule.defaultInput);
    setApplyRevision((rev) => rev + 1);
    setPredictModeEnabled(true);
    setStageStatuses(createInitialStageStatuses(lesson.stages));
    setPreviouslySkippedStages(new Set());
    setStrategiesExplored(new Set([problemModule.guidedInitialStrategyId]));
    setHintsByStage(createInitialHintsByStage(lesson.stages));
    setPredictionRecords({});
  };

  const lockedStrategyIds =
    mode === 'guided' ? activeStage.lockedStrategyIds : [];

  const allModules = getAllProblemModules();

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-4">
      {/* Studio Top Bar + Problem Switcher + Mode Switcher (Streamlined) */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <h1 className="text-2xl font-extrabold tracking-tight text-[var(--text-primary)]">
            {t('studio.title')}
          </h1>
          <Badge variant="indigo">{spec.title}</Badge>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Problem Switcher */}
          <nav
            aria-label={t('studio.switchProblem')}
            className="inline-flex items-center gap-1 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-1"
          >
            {allModules.map((mod) => {
              const isCurrent = mod.id === problemModule.id;
              return (
                <Link
                  key={mod.id}
                  to={`/studio/${mod.id}${mode === 'explore' ? '?mode=explore' : ''}`}
                  className={`rounded-xl px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                    isCurrent
                      ? 'bg-[var(--accent-blue-soft)] text-[var(--accent-blue-text)]'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {mod.spec.title}
                </Link>
              );
            })}
            <Link
              to="/problems"
              className="inline-flex items-center gap-1 rounded-xl px-2 py-1.5 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              title={t('studio.openProblemLibrary')}
            >
              <Library className="h-3.5 w-3.5" aria-hidden="true" />
              {t('studio.allProblems')}
            </Link>
          </nav>

          {/* Mode Switcher */}
          <div
            role="group"
            aria-label={t('studio.modeSwitcher')}
            className="inline-flex rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-1 shadow-[0_1px_2px_rgba(32,37,59,0.04)]"
          >
            <button
              type="button"
              aria-pressed={mode === 'guided'}
              onClick={() => handleSwitchMode('guided')}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition-colors cursor-pointer ${
                mode === 'guided'
                  ? 'bg-[var(--accent-blue-solid)] text-white shadow-xs'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <GraduationCap className="h-4 w-4" aria-hidden="true" />
              {t('studio.guidedLearning')}
            </button>
            <button
              type="button"
              aria-pressed={mode === 'explore'}
              onClick={() => handleSwitchMode('explore')}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition-colors cursor-pointer ${
                mode === 'explore'
                  ? 'bg-[var(--accent-blue-solid)] text-white shadow-xs'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Compass className="h-4 w-4" aria-hidden="true" />
              {t('studio.freeExploration')}
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
          onOpenSummary={handleOpenSummary}
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
            savedSession={savedSessionRecord}
            saveWarning={saveWarning}
            onSaveSession={() => persistCurrentSession()}
            onSwitchToExplore={() => handleSwitchMode('explore')}
            onRestartLesson={handleRestartLesson}
          />
        </div>
      ) : (
        <>
          {/* Mobile Tab Bar (< 1024px) */}
          <div
            role="tablist"
            aria-label={t('studio.panesLabel')}
            className="grid grid-cols-3 gap-1.5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-1.5 lg:hidden"
          >
            {MOBILE_TABS.map(({ id, labelKey, icon: Icon }) => {
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
                      ? 'bg-[var(--accent-blue-solid)] text-white shadow-xs'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--surface-elevated)]'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span className="truncate">{t(labelKey)}</span>
                </button>
              );
            })}
          </div>

          {/* Responsive 2-Column Canvas-First Desktop Grid / Mobile Tabbed Panes */}
          <div className="grid gap-6 lg:grid-cols-[380px_minmax(0,1fr)] lg:items-start">
            <section
              aria-label={t('studio.panelLabels.problemAndGuide')}
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
                defaultStatementExpanded={mode === 'explore'}
              />
            </section>

            <div className="space-y-4">
              <section
                aria-label={t('studio.panelLabels.visualCanvas')}
                className={`space-y-4 ${
                  mobileTab === 'canvas' ? 'block' : 'hidden lg:block'
                }`}
              >
              {/* Synchronized Micro / Macro Perspective Switcher */}
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-card)] px-3.5 py-2.5">
                <span className="text-xs font-bold text-[var(--text-secondary)]">
                  {t('studio.perspective')}
                </span>
                <div
                  role="group"
                  aria-label={t('studio.perspectiveSwitcher')}
                  className="inline-flex rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-subtle)] p-0.5"
                >
                  <button
                    type="button"
                    aria-pressed={perspective === 'micro'}
                    onClick={() => setPerspective('micro')}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                      perspective === 'micro'
                        ? 'bg-[var(--accent-blue-solid)] text-white shadow-2xs'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                    {t('studio.microView')}
                  </button>
                  <button
                    type="button"
                    aria-pressed={perspective === 'macro'}
                    onClick={() => setPerspective('macro')}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                      perspective === 'macro'
                        ? 'bg-[var(--accent-blue-solid)] text-white shadow-2xs'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    <GitBranch className="h-3.5 w-3.5" aria-hidden="true" />
                    {t('studio.macroView')}
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
              aria-label={t('studio.panelLabels.walkthrough')}
              className={`space-y-3 ${
                mobileTab === 'walkthrough' ? 'block' : 'hidden lg:block'
              }`}
            >
              <StudioSecondaryDock
                problemModule={problemModule}
                strategy={strategy}
                step={currentStep}
                stepIndex={playback.stepIndex}
                totalSteps={trace.steps.length}
                learningStage={
                  mode === 'guided' ? activeStage.title : 'Free Exploration'
                }
              />
            </section>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function StudioSecondaryDock({
  problemModule,
  strategy,
  step,
  stepIndex,
  totalSteps,
  learningStage,
}: {
  problemModule: AnyProblemModule;
  strategy: AnyProblemModule['spec']['supportedStrategies'][number];
  step: GenericExecutionStep;
  stepIndex: number;
  totalSteps: number;
  learningStage: string;
}) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'explanation' | 'tutor'>(
    'explanation',
  );
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const tabs: { id: 'explanation' | 'tutor'; label: string }[] = [
    { id: 'explanation', label: t('studio.dockTabs.explanation') },
    { id: 'tutor', label: t('studio.dockTabs.tutor') },
  ];

  const analysis = useMemo(
    () => buildProblemAnalysisFromModule(problemModule, strategy.id),
    [problemModule, strategy.id],
  );
  const executionContext = `Step ${stepIndex + 1} of ${totalSteps}: ${step.actionTitle} — ${step.explanation}`;

  const handleTabKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    idx: number,
  ) => {
    let nextIdx: number | null = null;
    if (event.key === 'ArrowRight') nextIdx = (idx + 1) % tabs.length;
    else if (event.key === 'ArrowLeft')
      nextIdx = (idx - 1 + tabs.length) % tabs.length;
    else if (event.key === 'Home') nextIdx = 0;
    else if (event.key === 'End') nextIdx = tabs.length - 1;
    if (nextIdx === null) return;

    event.preventDefault();
    setActiveTab(tabs[nextIdx].id);
    tabRefs.current[nextIdx]?.focus();
  };

  return (
    <div className="space-y-3">
      <div
        role="tablist"
        aria-label={t('studio.dockLabel')}
        className="inline-flex rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-1"
      >
        {tabs.map((tab, idx) => {
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              ref={(el) => {
                tabRefs.current[idx] = el;
              }}
              id={`studio-dock-tab-${tab.id}`}
              type="button"
              role="tab"
              aria-selected={isSelected}
              aria-controls={`studio-dock-panel-${tab.id}`}
              tabIndex={isSelected ? 0 : -1}
              onClick={() => setActiveTab(tab.id)}
              onKeyDown={(e) => handleTabKeyDown(e, idx)}
              className={`rounded-lg px-3.5 py-1.5 text-sm font-semibold transition-colors cursor-pointer ${
                isSelected
                  ? 'bg-[var(--accent-blue-solid)] text-white'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Keep both panels mounted so switching tabs preserves AI Tutor replies, drafts, and loading state */}
      <div
        id="studio-dock-panel-explanation"
        role="tabpanel"
        aria-labelledby="studio-dock-tab-explanation"
        hidden={activeTab !== 'explanation'}
        className={activeTab === 'explanation' ? '' : 'hidden'}
      >
        <WalkthroughPane
          strategy={strategy}
          step={step}
          stepIndex={stepIndex}
          totalSteps={totalSteps}
        />
      </div>

      <div
        id="studio-dock-panel-tutor"
        role="tabpanel"
        aria-labelledby="studio-dock-tab-tutor"
        hidden={activeTab !== 'tutor'}
        className={activeTab === 'tutor' ? '' : 'hidden'}
      >
        <AiTutorPanel
          contextKey={`studio:${problemModule.id}:${strategy.name}`}
          problemAnalysis={analysis}
          selectedStrategy={strategy.name}
          learningStage={learningStage}
          executionContext={executionContext}
        />
      </div>
    </div>
  );
}

export function StudioPage() {
  const { t } = useTranslation();
  const { problemId } = useParams<{ problemId: string }>();
  const [searchParams] = useSearchParams();
  const initialMode: StudioMode =
    searchParams.get('mode') === 'explore' ? 'explore' : 'guided';

  const resolvedId = problemId ?? 'two-sum';
  const problemModule = getProblemModule(resolvedId);

  if (!problemModule) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <Card className="border-[#F2B84B]">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-2 text-[var(--accent-amber-text)]">
              <AlertCircle className="h-5 w-5" aria-hidden="true" />
              <h1 className="text-lg font-extrabold text-[var(--text-primary)]">
                {t('studio.notAvailableTitle')}
              </h1>
            </div>
            <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
              {t('studio.notAvailableDescription', { problemId: resolvedId })}
            </p>
            <Link
              to="/problems"
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-[var(--accent-blue-solid)] px-4 text-sm font-semibold text-white hover:bg-[var(--accent-blue-hover)]"
            >
              {t('studio.browseProblemLibrary')}
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
