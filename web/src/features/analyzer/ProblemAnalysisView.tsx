import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  Database,
  HelpCircle,
  Layers,
  ListChecks,
  MessageCircle,
  RotateCcw,
  Sparkles,
  WifiOff,
} from 'lucide-react';
import type { AnalyzeResponseDto } from '../../services/aiClient';
import { getVerifiedLibraryItems } from '../../domain/problems/libraryCatalog';
import {
  buildConceptualSteps,
  splitWalkthroughBeats,
} from './conceptualStepper';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';

type ReaderTab = 'walkthrough' | 'approaches' | 'details';

interface ProblemAnalysisViewProps {
  result: AnalyzeResponseDto;
  selectedStrategyName: string | null;
  isStale?: boolean;
  onReanalyze?: () => void;
  onSelectStrategy: (strategyName: string) => void;
  onOpenTutor?: () => void;
}

export function ProblemAnalysisView({
  result,
  selectedStrategyName,
  isStale = false,
  onReanalyze,
  onSelectStrategy,
  onOpenTutor,
}: ProblemAnalysisViewProps) {
  const { analysis, verified_match: match, mode } = result;
  const isOffline = mode === 'offline-demo';
  const verifiedStudios = getVerifiedLibraryItems();

  const conceptualSteps = useMemo(
    () => buildConceptualSteps(analysis),
    [analysis],
  );
  const walkthroughBeats = useMemo(
    () => splitWalkthroughBeats(analysis.worked_example.walkthrough),
    [analysis.worked_example.walkthrough],
  );

  const [readerTab, setReaderTab] = useState<ReaderTab>('walkthrough');
  const [activeStepIdx, setActiveStepIdx] = useState(0);
  const [activeBeatIdx, setActiveBeatIdx] = useState(0);
  const readerTabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const stepTabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const readerTabOrder: ReaderTab[] = ['walkthrough', 'approaches', 'details'];
  const handleReaderTabKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    idx: number,
  ) => {
    let nextIdx: number | null = null;
    if (event.key === 'ArrowRight') nextIdx = (idx + 1) % readerTabOrder.length;
    else if (event.key === 'ArrowLeft')
      nextIdx = (idx - 1 + readerTabOrder.length) % readerTabOrder.length;
    else if (event.key === 'Home') nextIdx = 0;
    else if (event.key === 'End') nextIdx = readerTabOrder.length - 1;
    if (nextIdx === null) return;

    event.preventDefault();
    setReaderTab(readerTabOrder[nextIdx]);
    readerTabRefs.current[nextIdx]?.focus();
  };

  const handleStepTabKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    idx: number,
  ) => {
    const count = conceptualSteps.length;
    if (count === 0) return;
    let nextIdx: number | null = null;
    if (event.key === 'ArrowRight') nextIdx = (idx + 1) % count;
    else if (event.key === 'ArrowLeft') nextIdx = (idx - 1 + count) % count;
    else if (event.key === 'Home') nextIdx = 0;
    else if (event.key === 'End') nextIdx = count - 1;
    if (nextIdx === null) return;

    event.preventDefault();
    setActiveStepIdx(nextIdx);
    stepTabRefs.current[nextIdx]?.focus();
  };

  // Reset interactive state cleanly whenever a new analysis loads
  useEffect(() => {
    setReaderTab('walkthrough');
    setActiveStepIdx(0);
    setActiveBeatIdx(0);
  }, [analysis.title, analysis.plain_language_summary]);

  const activeStep = conceptualSteps[activeStepIdx] ?? conceptualSteps[0];
  const activeBeat = walkthroughBeats[activeBeatIdx] ?? walkthroughBeats[0] ?? '';

  const activeStrategy =
    analysis.candidate_strategies.find(
      (s) => s.name === selectedStrategyName,
    ) ?? analysis.candidate_strategies[0];

  const guidingQuestion =
    analysis.clarifications_or_ambiguities[0] ??
    (activeStrategy
      ? `Before coding, why does ${activeStrategy.name} fit this problem's constraints?`
      : 'Before coding, what small example best tests the core rule of this problem?');

  // Compact, honest Offline AI state — never render a fake generic analysis page
  if (isOffline) {
    return (
      <div
        aria-label="Offline AI status"
        className={`space-y-4 transition-opacity ${isStale ? 'opacity-85' : ''}`}
      >
        {isStale && (
          <div
            role="alert"
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#F2B84B] bg-[#FEF7E7] px-5 py-3.5 text-sm text-[#925E08]"
          >
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="font-semibold">
                Outdated Analysis — Problem Statement Changed
              </span>
            </div>
            {onReanalyze && (
              <Button variant="primary" size="sm" onClick={onReanalyze}>
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                Re-analyze Updated Text
              </Button>
            )}
          </div>
        )}

        <Card className="p-6 sm:p-8 space-y-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="demo">
                <WifiOff className="h-3.5 w-3.5" aria-hidden="true" />
                Live AI Unavailable (Offline Mode)
              </Badge>
              {match.status === 'verified' && (
                <Badge variant="mint">
                  <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                  Verified Deterministic Studio Available
                </Badge>
              )}
            </div>
            <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#202B3B]">
              Live AI analysis is not enabled on this server
            </h3>
            <p className="text-base leading-relaxed text-[#526075]">
              Your pasted problem was not analyzed by an AI model because no live
              LLM key is configured. Your statement stays intact above — or you can
              practice right now in a verified interactive studio below.
            </p>
          </div>

          {match.studio_path ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#B4E6DF] bg-[#E6F7F5]/60 px-5 py-4">
              <p className="text-sm font-medium text-[#202B3B]">
                {match.reason}
              </p>
              <Link
                to={match.studio_path}
                className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-xl bg-[#0F8477] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#0E8779]"
              >
                {match.status === 'verified'
                  ? `Open Verified ${match.matched_problem_title} Studio`
                  : `Inspect Curated ${match.matched_problem_title} Studio`}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          ) : (
            <div className="space-y-3 border-t border-[#E2E8F0] pt-5">
              <p className="text-sm font-semibold text-[#202B3B]">
                Try a verified interactive lesson instead:
              </p>
              <div className="flex flex-wrap gap-2.5">
                {verifiedStudios.map((studio) => (
                  <Link
                    key={studio.id}
                    to={studio.studioPath ?? `/studio/${studio.id}`}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-[#E2E8F0] bg-[#F7F9FC] px-4 py-2.5 text-sm font-semibold text-[#202B3B] transition-colors hover:border-[#397BDB] hover:bg-[#EAF2FD]/60 hover:text-[#2257A8]"
                  >
                    {studio.title}
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>
    );
  }

  // Interactive-First Pin-UI Reader Card with 3-Tab Progressive Disclosure
  return (
    <div
      aria-label="Structured AI problem analysis"
      className={`space-y-5 transition-opacity ${isStale ? 'opacity-85' : ''}`}
    >
      {/* Stale Analysis Alert */}
      {isStale && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#F2B84B] bg-[#FEF7E7] px-5 py-4 text-sm text-[#925E08]"
        >
          <div className="flex items-start gap-2.5">
            <AlertTriangle
              className="h-5 w-5 shrink-0 mt-0.5"
              aria-hidden="true"
            />
            <div>
              <p className="font-bold">
                Outdated Analysis — Problem Statement Changed
              </p>
              <p className="mt-0.5 text-sm text-[#526075]">
                Re-analyze to refresh this walkthrough and reset the AI Tutor.
              </p>
            </div>
          </div>
          {onReanalyze && (
            <Button variant="primary" size="sm" onClick={onReanalyze}>
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              Re-analyze Updated Text
            </Button>
          )}
        </div>
      )}

      <Card className="overflow-hidden">
        {/* Compact Reader Header + 3-Tab Progressive Navigation */}
        <div className="border-b border-[#E2E8F0] bg-white p-6 sm:p-8 pb-5 space-y-5">
          <div
            role="status"
            className="flex flex-wrap items-center justify-between gap-2 text-xs"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 font-semibold text-[#2257A8]">
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                AI-Generated · Conceptual (Not Verified)
              </span>
              <span className="text-[#C5CBE3]" aria-hidden="true">
                ·
              </span>
              {match.status === 'verified' && (
                <span className="inline-flex items-center gap-1 font-semibold text-[#0D7A6E]">
                  <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                  Verified Deterministic Studio Available
                </span>
              )}
              {match.status === 'ambiguous' && (
                <span className="inline-flex items-center gap-1 font-semibold text-[#925E08]">
                  <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
                  Ambiguous Match — Please Choose
                </span>
              )}
              {match.status === 'conceptual_only' && (
                <span className="font-medium text-[#526075]">
                  Conceptual Analysis Only
                </span>
              )}
            </div>
            <span className="font-medium text-[#526075]">
              {analysis.inferred_problem_type}
            </span>
          </div>

          <div className="space-y-2">
            <h3 className="text-2xl sm:text-[28px] font-extrabold tracking-tight text-[#202B3B] leading-tight">
              {analysis.title}
            </h3>
            <p className="text-base leading-[1.7] text-[#202B3B]">
              {analysis.plain_language_summary}
            </p>
          </div>

          {/* Pin-UI-Inspired Segmented Reader Tabs with WAI-ARIA roving keyboard nav */}
          <div
            role="tablist"
            aria-label="Analysis sections"
            className="flex flex-wrap sm:inline-flex w-full sm:w-auto gap-1 rounded-xl border border-[#E2E8F0] bg-[#F7F9FC] p-1"
          >
            <button
              ref={(el) => {
                readerTabRefs.current[0] = el;
              }}
              id="analysis-tab-walkthrough"
              type="button"
              role="tab"
              aria-selected={readerTab === 'walkthrough'}
              aria-controls="analysis-panel-walkthrough"
              tabIndex={readerTab === 'walkthrough' ? 0 : -1}
              onClick={() => setReaderTab('walkthrough')}
              onKeyDown={(e) => handleReaderTabKeyDown(e, 0)}
              className={`inline-flex flex-1 sm:flex-none items-center justify-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors cursor-pointer ${
                readerTab === 'walkthrough'
                  ? 'bg-white text-[#202B3B] shadow-xs ring-1 ring-[#E2E8F0]'
                  : 'text-[#526075] hover:text-[#202B3B]'
              }`}
            >
              <Sparkles
                className={`h-4 w-4 ${readerTab === 'walkthrough' ? 'text-[#2664C2]' : ''}`}
                aria-hidden="true"
              />
              Walkthrough
            </button>
            <button
              ref={(el) => {
                readerTabRefs.current[1] = el;
              }}
              id="analysis-tab-approaches"
              type="button"
              role="tab"
              aria-selected={readerTab === 'approaches'}
              aria-controls="analysis-panel-approaches"
              tabIndex={readerTab === 'approaches' ? 0 : -1}
              onClick={() => setReaderTab('approaches')}
              onKeyDown={(e) => handleReaderTabKeyDown(e, 1)}
              className={`inline-flex flex-1 sm:flex-none items-center justify-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors cursor-pointer ${
                readerTab === 'approaches'
                  ? 'bg-white text-[#202B3B] shadow-xs ring-1 ring-[#E2E8F0]'
                  : 'text-[#526075] hover:text-[#202B3B]'
              }`}
            >
              <Layers
                className={`h-4 w-4 ${readerTab === 'approaches' ? 'text-[#0D7A6E]' : ''}`}
                aria-hidden="true"
              />
              Approaches ({analysis.candidate_strategies.length})
            </button>
            <button
              ref={(el) => {
                readerTabRefs.current[2] = el;
              }}
              id="analysis-tab-details"
              type="button"
              role="tab"
              aria-selected={readerTab === 'details'}
              aria-controls="analysis-panel-details"
              tabIndex={readerTab === 'details' ? 0 : -1}
              onClick={() => setReaderTab('details')}
              onKeyDown={(e) => handleReaderTabKeyDown(e, 2)}
              className={`inline-flex flex-1 sm:flex-none items-center justify-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors cursor-pointer ${
                readerTab === 'details'
                  ? 'bg-white text-[#202B3B] shadow-xs ring-1 ring-[#E2E8F0]'
                  : 'text-[#526075] hover:text-[#202B3B]'
              }`}
            >
              <ListChecks
                className={`h-4 w-4 ${readerTab === 'details' ? 'text-[#925E08]' : ''}`}
                aria-hidden="true"
              />
              Constraints &amp; Edge Cases
            </button>
          </div>
        </div>

        {/* TAB 1: Focused Interactive Walkthrough (Default Initial View) */}
        {readerTab === 'walkthrough' && (
          <div
            id="analysis-panel-walkthrough"
            role="tabpanel"
            aria-labelledby="analysis-tab-walkthrough"
            className="p-6 sm:p-8 space-y-7"
          >
            {/* Clear Input -> Output Example with Interactive Beats */}
            <div className="rounded-2xl bg-[#F7F9FC] border border-[#E2E8F0] p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#526075]">
                  Worked Example (Conceptual Illustration)
                </span>
                {walkthroughBeats.length > 1 && (
                  <div className="inline-flex items-center gap-1.5">
                    <button
                      type="button"
                      aria-label="Previous example beat"
                      disabled={activeBeatIdx === 0}
                      onClick={() =>
                        setActiveBeatIdx((idx) => Math.max(0, idx - 1))
                      }
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#E2E8F0] bg-white text-[#202B3B] hover:border-[#397BDB] disabled:opacity-40 cursor-pointer"
                    >
                      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                    </button>
                    <span className="min-w-[48px] text-center font-mono text-xs font-semibold text-[#526075]">
                      {activeBeatIdx + 1} / {walkthroughBeats.length}
                    </span>
                    <button
                      type="button"
                      aria-label="Next example beat"
                      disabled={activeBeatIdx >= walkthroughBeats.length - 1}
                      onClick={() =>
                        setActiveBeatIdx((idx) =>
                          Math.min(walkthroughBeats.length - 1, idx + 1),
                        )
                      }
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#E2E8F0] bg-white text-[#202B3B] hover:border-[#397BDB] disabled:opacity-40 cursor-pointer"
                    >
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                )}
              </div>

              <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
                <div className="rounded-xl bg-white border border-[#E2E8F0] px-4 py-3">
                  <span className="block text-xs font-semibold text-[#526075]">
                    Input
                  </span>
                  <p className="mt-1 font-mono text-sm font-semibold text-[#202B3B] break-words">
                    {analysis.worked_example.input_summary}
                  </p>
                </div>
                <ArrowRight
                  className="hidden sm:block h-5 w-5 text-[#2664C2]"
                  aria-hidden="true"
                />
                <div className="rounded-xl bg-[#E6F7F5]/60 border border-[#B4E6DF] px-4 py-3">
                  <span className="block text-xs font-semibold text-[#0D7A6E]">
                    Output
                  </span>
                  <p className="mt-1 font-mono text-sm font-bold text-[#0A594B] break-words">
                    {analysis.worked_example.output_summary}
                  </p>
                </div>
              </div>

              {activeBeat && (
                <p
                  aria-live="polite"
                  className="rounded-xl bg-white border border-[#E2E8F0] px-4 py-3.5 text-base leading-relaxed text-[#202B3B]"
                >
                  {activeBeat}
                </p>
              )}
            </div>

            {/* One-Step-At-A-Time Conceptual Reasoning Stepper */}
            {activeStep && (
              <div
                aria-label="Interactive conceptual steps"
                className="space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h4 className="text-lg font-bold tracking-tight text-[#202B3B]">
                      Walk Through the Logic
                    </h4>
                    <p className="text-sm text-[#526075]">
                      Step {activeStep.stepNumber} of {conceptualSteps.length} ·
                      Conceptual guide (not an executed trace)
                    </p>
                  </div>

                  <div
                    role="tablist"
                    aria-label="Conceptual reasoning steps"
                    className="inline-flex flex-wrap items-center gap-1.5"
                  >
                    {conceptualSteps.map((step, idx) => {
                      const isActive = idx === activeStepIdx;
                      const isVisited = idx < activeStepIdx;
                      return (
                        <button
                          key={step.id}
                          ref={(el) => {
                            stepTabRefs.current[idx] = el;
                          }}
                          id={`conceptual-step-tab-${step.id}`}
                          type="button"
                          role="tab"
                          aria-selected={isActive}
                          aria-controls="conceptual-step-panel"
                          tabIndex={isActive ? 0 : -1}
                          onClick={() => setActiveStepIdx(idx)}
                          onKeyDown={(e) => handleStepTabKeyDown(e, idx)}
                          className={`h-8 min-w-[32px] rounded-lg px-2.5 font-mono text-xs font-bold transition-colors cursor-pointer ${
                            isActive
                              ? 'bg-[#2B6CC9] text-white'
                              : isVisited
                                ? 'bg-[#EAF2FD] text-[#2257A8] hover:bg-[#DCEBFC]'
                                : 'bg-[#F1F5FA] text-[#526075] hover:bg-[#E2E8F0]'
                          }`}
                        >
                          {step.stepNumber}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div
                  id="conceptual-step-panel"
                  role="tabpanel"
                  aria-labelledby={`conceptual-step-tab-${activeStep.id}`}
                  aria-live="polite"
                  className="rounded-2xl border border-[#C2DAFA] bg-[#F7F9FC] p-5 sm:p-6 space-y-2.5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-2.5 text-base sm:text-lg font-bold text-[#202B3B]">
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#2B6CC9] font-mono text-xs font-bold text-white">
                        {activeStep.stepNumber}
                      </span>
                      {activeStep.title}
                    </span>
                    {activeStep.dependsOn.length > 0 && (
                      <span className="text-xs font-medium text-[#2257A8]">
                        Builds on {activeStep.dependsOn.join(', ')}
                      </span>
                    )}
                  </div>
                  <p className="text-base leading-[1.7] text-[#202B3B] pl-9">
                    {activeStep.goal}
                  </p>
                </div>

                {/* One Primary Next Action Row */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={activeStepIdx === 0}
                    onClick={() => setActiveStepIdx((i) => Math.max(0, i - 1))}
                  >
                    <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                    Previous Step
                  </Button>

                  <div className="flex flex-wrap items-center gap-2.5">
                    {match.studio_path && (
                      <Link
                        to={match.studio_path}
                        className={`inline-flex h-10 shrink-0 items-center gap-2 rounded-xl px-4 text-sm font-semibold transition-colors ${
                          match.status === 'verified'
                            ? 'bg-[#0F8477] text-white hover:bg-[#0E8779]'
                            : 'border border-[#F2B84B] bg-[#FEF7E7] text-[#925E08] hover:bg-[#FDEBC8]'
                        }`}
                      >
                        {match.status === 'verified'
                          ? `Open Verified ${match.matched_problem_title} Studio`
                          : `Inspect Curated ${match.matched_problem_title} Studio`}
                        <ArrowRight className="h-4 w-4" aria-hidden="true" />
                      </Link>
                    )}

                    {activeStepIdx < conceptualSteps.length - 1 ? (
                      <Button
                        type="button"
                        variant="primary"
                        size="md"
                        onClick={() =>
                          setActiveStepIdx((i) =>
                            Math.min(conceptualSteps.length - 1, i + 1),
                          )
                        }
                      >
                        Next Step
                        <ArrowRight className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    ) : !match.studio_path && onOpenTutor ? (
                      <Button
                        type="button"
                        variant="primary"
                        size="md"
                        onClick={onOpenTutor}
                      >
                        <MessageCircle className="h-4 w-4" aria-hidden="true" />
                        Ask AI Tutor
                      </Button>
                    ) : null}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Compact Selectable Approaches & Complexity */}
        {readerTab === 'approaches' && activeStrategy && (
          <div
            id="analysis-panel-approaches"
            role="tabpanel"
            aria-labelledby="analysis-tab-approaches"
            className="p-6 sm:p-8 space-y-5"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-[#526075]">
                Select an approach to compare tradeoffs and focus the AI Tutor.
              </p>
              <div
                role="group"
                aria-label="Selectable strategies"
                className="flex flex-wrap gap-2"
              >
                {analysis.candidate_strategies.map((strat) => {
                  const isSelected = activeStrategy.name === strat.name;
                  return (
                    <button
                      key={strat.name}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => onSelectStrategy(strat.name)}
                      className={`rounded-xl px-4 py-2 text-sm font-semibold transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-[#2B6CC9] text-white'
                          : 'border border-[#E2E8F0] bg-[#F7F9FC] text-[#202B3B] hover:border-[#397BDB]'
                      }`}
                    >
                      {strat.name}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-2xl border border-[#E2E8F0] bg-[#F7F9FC] p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-bold text-[#2257A8]">
                  {activeStrategy.technique}
                </span>
                <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
                  <span className="inline-flex items-center gap-1 rounded-md bg-white px-2.5 py-1 text-[#202B3B] border border-[#E2E8F0]">
                    <Clock
                      className="h-3.5 w-3.5 text-[#2664C2]"
                      aria-hidden="true"
                    />
                    Time: {activeStrategy.time_complexity}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-md bg-white px-2.5 py-1 text-[#202B3B] border border-[#E2E8F0]">
                    <Database
                      className="h-3.5 w-3.5 text-[#0D7A6E]"
                      aria-hidden="true"
                    />
                    Space: {activeStrategy.space_complexity}
                  </span>
                </div>
              </div>

              <p className="text-base leading-relaxed text-[#202B3B]">
                {activeStrategy.intuition}
              </p>
              <p className="text-sm leading-relaxed text-[#526075]">
                {activeStrategy.why_it_applies}
              </p>

              <div className="grid gap-3 border-t border-[#E2E8F0] pt-4 text-sm sm:grid-cols-2">
                <div>
                  <span className="block text-xs font-bold uppercase tracking-wider text-[#526075]">
                    Assumptions
                  </span>
                  <p className="mt-1 text-[#202B3B]">
                    {activeStrategy.complexity_assumptions}
                  </p>
                </div>
                <div>
                  <span className="block text-xs font-bold uppercase tracking-wider text-[#526075]">
                    Limitations
                  </span>
                  <p className="mt-1 text-[#526075]">
                    {activeStrategy.limitations}
                  </p>
                </div>
              </div>
            </div>

            {onOpenTutor && (
              <div className="flex justify-end">
                <Button variant="primary" size="md" onClick={onOpenTutor}>
                  <MessageCircle className="h-4 w-4" aria-hidden="true" />
                  Discuss {activeStrategy.name} with AI Tutor
                </Button>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: Constraints, Edge Cases, Guiding Question & Prerequisites */}
        {readerTab === 'details' && (
          <div
            id="analysis-panel-details"
            role="tabpanel"
            aria-labelledby="analysis-tab-details"
            className="p-6 sm:p-8 space-y-6 text-sm"
          >
            <div className="rounded-xl border-l-4 border-[#397BDB] bg-[#F7F9FC] px-5 py-4 space-y-1">
              <p className="flex items-center gap-2 text-sm font-bold text-[#2257A8]">
                <HelpCircle className="h-4 w-4" aria-hidden="true" />
                Check Your Intuition
              </p>
              <p className="text-base leading-relaxed text-[#202B3B]">
                {guidingQuestion}
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#526075]">
                  Inputs
                </h4>
                <ul className="space-y-1.5 text-sm text-[#202B3B]">
                  {analysis.inputs.map((inp) => (
                    <li key={inp}>• {inp}</li>
                  ))}
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#526075]">
                  Outputs
                </h4>
                <ul className="space-y-1.5 text-sm text-[#202B3B]">
                  {analysis.outputs.map((out) => (
                    <li key={out}>• {out}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#526075]">
                  Constraints &amp; Assumptions
                </h4>
                <ul className="space-y-1.5 text-sm text-[#202B3B]">
                  {analysis.constraints_and_assumptions.map((c) => (
                    <li key={c}>• {c}</li>
                  ))}
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#526075]">
                  Important Edge Cases
                </h4>
                <ul className="space-y-1.5 text-sm text-[#202B3B]">
                  {analysis.edge_cases.map((e) => (
                    <li key={e}>• {e}</li>
                  ))}
                </ul>
              </div>
            </div>

            {analysis.prerequisite_concepts.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 border-t border-[#E2E8F0] pt-4">
                <span className="text-xs font-bold text-[#526075]">
                  Prerequisites:
                </span>
                {analysis.prerequisite_concepts.map((concept) => (
                  <Badge key={concept} variant="neutral">
                    {concept}
                  </Badge>
                ))}
              </div>
            )}

            <p className="text-xs text-[#526075] border-t border-[#E2E8F0] pt-4">
              {analysis.confidence_notes} {match.user_input_note}
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
