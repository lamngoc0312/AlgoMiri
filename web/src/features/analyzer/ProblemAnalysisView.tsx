import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Clock,
  Database,
  HelpCircle,
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

  const [activeStepIdx, setActiveStepIdx] = useState(0);
  const [activeBeatIdx, setActiveBeatIdx] = useState(0);

  // Reset interactive indices cleanly whenever a new analysis loads
  useEffect(() => {
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
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#F1B34C] bg-[#FEF6E6] px-5 py-3.5 text-sm text-[#9A630A]"
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
            <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#181B2E]">
              Live AI analysis is not enabled on this server
            </h3>
            <p className="text-base leading-relaxed text-[#4E5672]">
              Your pasted problem was not analyzed by an AI model because no live
              LLM key is configured. Your statement stays intact above — or you can
              practice right now in a verified interactive studio below.
            </p>
          </div>

          {match.studio_path ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#BDECE2] bg-[#E6F8F4]/60 px-5 py-4">
              <p className="text-sm font-medium text-[#181B2E]">
                {match.reason}
              </p>
              <Link
                to={match.studio_path}
                className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-xl bg-[#16B89D] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#0E967F]"
              >
                {match.status === 'verified'
                  ? `Open Verified ${match.matched_problem_title} Studio`
                  : `Inspect Curated ${match.matched_problem_title} Studio`}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          ) : (
            <div className="space-y-3 border-t border-[#E4E7F1] pt-5">
              <p className="text-sm font-semibold text-[#181B2E]">
                Try a verified interactive lesson instead:
              </p>
              <div className="flex flex-wrap gap-2.5">
                {verifiedStudios.map((studio) => (
                  <Link
                    key={studio.id}
                    to={studio.studioPath ?? `/studio/${studio.id}`}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-[#E4E7F1] bg-[#F8F9FC] px-4 py-2.5 text-sm font-semibold text-[#181B2E] transition-colors hover:border-[#645BE8] hover:bg-[#EEF0FF]/60 hover:text-[#4F46D8]"
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

  // Interactive-First Pin-UI Reader Card
  return (
    <div
      aria-label="Structured AI problem analysis"
      className={`space-y-5 transition-opacity ${isStale ? 'opacity-85' : ''}`}
    >
      {/* Stale Analysis Alert */}
      {isStale && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#F1B34C] bg-[#FEF6E6] px-5 py-4 text-sm text-[#9A630A]"
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
              <p className="mt-0.5 text-sm text-[#4E5672]">
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

      <Card className="overflow-hidden divide-y divide-[#E4E7F1]">
        {/* 1. Concise Header, Summary & Interactive Example Card */}
        <div className="p-6 sm:p-8 space-y-6">
          <div
            role="status"
            className="flex flex-wrap items-center justify-between gap-2 text-xs"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 font-semibold text-[#4F46D8]">
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                AI-Generated · Conceptual (Not Verified)
              </span>
              <span className="text-[#C5CBE3]" aria-hidden="true">
                ·
              </span>
              {match.status === 'verified' && (
                <span className="inline-flex items-center gap-1 font-semibold text-[#0D7D6A]">
                  <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                  Verified Deterministic Studio Available
                </span>
              )}
              {match.status === 'ambiguous' && (
                <span className="inline-flex items-center gap-1 font-semibold text-[#9A630A]">
                  <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
                  Ambiguous Match — Please Choose
                </span>
              )}
              {match.status === 'conceptual_only' && (
                <span className="font-medium text-[#4E5672]">
                  Conceptual Analysis Only
                </span>
              )}
            </div>
            <span className="font-medium text-[#4E5672]">
              {analysis.inferred_problem_type}
            </span>
          </div>

          <div className="space-y-2.5">
            <h3 className="text-2xl sm:text-[28px] font-extrabold tracking-tight text-[#181B2E] leading-tight">
              {analysis.title}
            </h3>
            <p className="text-base leading-[1.7] text-[#181B2E]">
              {analysis.plain_language_summary}
            </p>
          </div>

          {/* Interactive Visual Input -> Output Example */}
          <div className="rounded-2xl bg-[#F8F9FC] border border-[#E4E7F1] p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#4E5672]">
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
                    className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-[#E4E7F1] bg-white text-[#181B2E] hover:border-[#645BE8] disabled:opacity-40 cursor-pointer"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                  <span className="min-w-[44px] text-center font-mono text-xs font-semibold text-[#4E5672]">
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
                    className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-[#E4E7F1] bg-white text-[#181B2E] hover:border-[#645BE8] disabled:opacity-40 cursor-pointer"
                  >
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </div>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
              <div className="rounded-xl bg-white border border-[#E4E7F1] px-4 py-3">
                <span className="block text-xs font-semibold text-[#4E5672]">
                  Input
                </span>
                <p className="mt-1 font-mono text-sm font-semibold text-[#181B2E] break-words">
                  {analysis.worked_example.input_summary}
                </p>
              </div>
              <ArrowRight
                className="hidden sm:block h-5 w-5 text-[#645BE8]"
                aria-hidden="true"
              />
              <div className="rounded-xl bg-[#E6F8F4]/60 border border-[#BDECE2] px-4 py-3">
                <span className="block text-xs font-semibold text-[#0D7D6A]">
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
                className="rounded-xl bg-white border border-[#E4E7F1] px-4 py-3 text-base leading-relaxed text-[#181B2E]"
              >
                {activeBeat}
              </p>
            )}
          </div>
        </div>

        {/* 2. Interactive One-Step-At-A-Time Conceptual Walkthrough */}
        {activeStep && (
          <div
            aria-label="Interactive conceptual steps"
            className="p-6 sm:p-8 space-y-5"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h4 className="text-lg font-bold tracking-tight text-[#181B2E]">
                  Walk Through the Logic
                </h4>
                <p className="text-sm text-[#4E5672]">
                  Step {activeStep.stepNumber} of {conceptualSteps.length} ·
                  Conceptual guide (not an executed trace)
                </p>
              </div>

              {/* Pin-UI-style segmented step pills */}
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
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      onClick={() => setActiveStepIdx(idx)}
                      className={`h-8 min-w-[32px] rounded-lg px-2.5 font-mono text-xs font-bold transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-[#645BE8] text-white'
                          : isVisited
                            ? 'bg-[#EEF0FF] text-[#4F46D8] hover:bg-[#E1E4FF]'
                            : 'bg-[#F4F5FA] text-[#4E5672] hover:bg-[#E4E7F1]'
                      }`}
                    >
                      {step.stepNumber}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Active Learning Step Card */}
            <div
              role="tabpanel"
              aria-live="polite"
              className="rounded-2xl border border-[#D8DCFF] bg-[#F8F9FC] p-5 sm:p-6 space-y-2.5"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="inline-flex items-center gap-2 text-base sm:text-lg font-bold text-[#181B2E]">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#645BE8] font-mono text-xs font-bold text-white">
                    {activeStep.stepNumber}
                  </span>
                  {activeStep.title}
                </span>
                {activeStep.dependsOn.length > 0 && (
                  <span className="text-xs font-medium text-[#4F46D8]">
                    Builds on {activeStep.dependsOn.join(', ')}
                  </span>
                )}
              </div>
              <p className="text-base leading-[1.7] text-[#181B2E] pl-9">
                {activeStep.goal}
              </p>
            </div>

            {/* Step Navigation Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3">
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

              {activeStepIdx < conceptualSteps.length - 1 ? (
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() =>
                    setActiveStepIdx((i) =>
                      Math.min(conceptualSteps.length - 1, i + 1),
                    )
                  }
                >
                  Next Step
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Button>
              ) : onOpenTutor ? (
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={onOpenTutor}
                >
                  <MessageCircle className="h-4 w-4" aria-hidden="true" />
                  Discuss with AI Tutor
                </Button>
              ) : null}
            </div>
          </div>
        )}

        {/* 3. Compact Selectable Strategy Comparison */}
        {analysis.candidate_strategies.length > 0 && activeStrategy && (
          <div className="p-6 sm:p-8 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h4 className="text-lg font-bold tracking-tight text-[#181B2E]">
                Compare Approaches
              </h4>
              <div
                role="group"
                aria-label="Selectable strategies"
                className="flex flex-wrap gap-1.5"
              >
                {analysis.candidate_strategies.map((strat) => {
                  const isSelected = activeStrategy.name === strat.name;
                  return (
                    <button
                      key={strat.name}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => onSelectStrategy(strat.name)}
                      className={`rounded-xl px-3.5 py-2 text-sm font-semibold transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-[#645BE8] text-white'
                          : 'border border-[#E4E7F1] bg-[#F8F9FC] text-[#181B2E] hover:border-[#645BE8]'
                      }`}
                    >
                      {strat.name}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-2xl border border-[#E4E7F1] bg-[#F8F9FC] p-5 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-bold text-[#4F46D8]">
                  {activeStrategy.technique}
                </span>
                <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
                  <span className="inline-flex items-center gap-1 rounded-md bg-white px-2.5 py-1 text-[#181B2E] border border-[#E4E7F1]">
                    <Clock
                      className="h-3.5 w-3.5 text-[#645BE8]"
                      aria-hidden="true"
                    />
                    {activeStrategy.time_complexity}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-md bg-white px-2.5 py-1 text-[#181B2E] border border-[#E4E7F1]">
                    <Database
                      className="h-3.5 w-3.5 text-[#16B89D]"
                      aria-hidden="true"
                    />
                    {activeStrategy.space_complexity}
                  </span>
                </div>
              </div>

              <p className="text-base leading-relaxed text-[#181B2E]">
                {activeStrategy.intuition}
              </p>
              <p className="text-sm leading-relaxed text-[#4E5672]">
                {activeStrategy.why_it_applies}
              </p>
            </div>
          </div>
        )}

        {/* 4. Guiding Question & Single Clear Next Action */}
        <div className="p-6 sm:p-8 space-y-5">
          <div className="rounded-xl border-l-4 border-[#645BE8] bg-[#F8F9FC] px-5 py-4 space-y-1">
            <p className="flex items-center gap-2 text-sm font-bold text-[#4F46D8]">
              <HelpCircle className="h-4 w-4" aria-hidden="true" />
              Check Your Intuition
            </p>
            <p className="text-base leading-relaxed text-[#181B2E]">
              {guidingQuestion}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            {match.studio_path ? (
              <>
                <p className="text-sm text-[#4E5672] max-w-md">{match.reason}</p>
                <Link
                  to={match.studio_path}
                  className={`inline-flex h-11 shrink-0 items-center gap-2 rounded-xl px-5 text-sm font-semibold transition-colors ${
                    match.status === 'verified'
                      ? 'bg-[#16B89D] text-white hover:bg-[#0E967F]'
                      : 'border border-[#F1B34C] bg-[#FEF6E6] text-[#9A630A] hover:bg-[#FDEBC8]'
                  }`}
                >
                  {match.status === 'verified'
                    ? `Open Verified ${match.matched_problem_title} Studio`
                    : `Inspect Curated ${match.matched_problem_title} Studio`}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </>
            ) : onOpenTutor ? (
              <>
                <p className="text-sm text-[#4E5672]">
                  Want a simpler explanation or a Socratic hint?
                </p>
                <Button variant="primary" size="md" onClick={onOpenTutor}>
                  <MessageCircle className="h-4 w-4" aria-hidden="true" />
                  Ask AI Tutor
                </Button>
              </>
            ) : null}
          </div>
        </div>

        {/* 5. Progressive Disclosure: Constraints, Edge Cases, Complexity & Prerequisites */}
        <details className="group">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-6 sm:px-8 py-4 text-sm font-bold text-[#181B2E] hover:bg-[#F8F9FC]">
            <span>
              Constraints, Edge Cases, Complexity Notes &amp; Prerequisites
            </span>
            <ChevronDown
              className="h-4 w-4 shrink-0 text-[#4E5672] transition-transform group-open:rotate-180"
              aria-hidden="true"
            />
          </summary>
          <div className="px-6 sm:px-8 pb-7 pt-2 space-y-5 text-sm">
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-1.5">
                <h5 className="text-xs font-bold uppercase tracking-wider text-[#4E5672]">
                  Inputs
                </h5>
                <ul className="space-y-1 text-[#181B2E]">
                  {analysis.inputs.map((inp) => (
                    <li key={inp}>• {inp}</li>
                  ))}
                </ul>
              </div>
              <div className="space-y-1.5">
                <h5 className="text-xs font-bold uppercase tracking-wider text-[#4E5672]">
                  Outputs
                </h5>
                <ul className="space-y-1 text-[#181B2E]">
                  {analysis.outputs.map((out) => (
                    <li key={out}>• {out}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-1.5">
                <h5 className="text-xs font-bold uppercase tracking-wider text-[#4E5672]">
                  Constraints &amp; Assumptions
                </h5>
                <ul className="space-y-1 text-[#181B2E]">
                  {analysis.constraints_and_assumptions.map((c) => (
                    <li key={c}>• {c}</li>
                  ))}
                </ul>
              </div>
              <div className="space-y-1.5">
                <h5 className="text-xs font-bold uppercase tracking-wider text-[#4E5672]">
                  Important Edge Cases
                </h5>
                <ul className="space-y-1 text-[#181B2E]">
                  {analysis.edge_cases.map((e) => (
                    <li key={e}>• {e}</li>
                  ))}
                </ul>
              </div>
            </div>

            {activeStrategy && (
              <div className="rounded-xl bg-[#F8F9FC] border border-[#E4E7F1] p-4 space-y-1">
                <h5 className="text-xs font-bold uppercase tracking-wider text-[#4E5672]">
                  Complexity Assumptions &amp; Limitations ({activeStrategy.name})
                </h5>
                <p className="text-[#181B2E]">
                  <strong>Assumptions:</strong>{' '}
                  {activeStrategy.complexity_assumptions}
                </p>
                <p className="text-[#4E5672]">
                  <strong>Limitations:</strong> {activeStrategy.limitations}
                </p>
              </div>
            )}

            {analysis.prerequisite_concepts.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#E4E7F1]">
                <span className="text-xs font-bold text-[#4E5672]">
                  Prerequisites:
                </span>
                {analysis.prerequisite_concepts.map((concept) => (
                  <Badge key={concept} variant="neutral">
                    {concept}
                  </Badge>
                ))}
              </div>
            )}

            <p className="text-xs text-[#4E5672] pt-2 border-t border-[#E4E7F1]">
              {analysis.confidence_notes} {match.user_input_note}
            </p>
          </div>
        </details>
      </Card>
    </div>
  );
}
