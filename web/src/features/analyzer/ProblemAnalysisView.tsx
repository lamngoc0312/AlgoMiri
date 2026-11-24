import { Link } from 'react-router-dom';
import {
  AlertTriangle,
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

  const essentialSteps = analysis.subproblem_decomposition.slice(0, 3);
  const guidingQuestion =
    analysis.clarifications_or_ambiguities[0] ??
    (analysis.candidate_strategies[0]
      ? `Before writing code, why does ${analysis.candidate_strategies[0].name} fit this problem's constraints?`
      : 'Before writing code, what small example best tests the core rule of this problem?');

  // Phase C: Compact, honest Offline AI state — never render a fake generic analysis page
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
          <div className="flex flex-wrap items-start justify-between gap-3">
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

  // Phase A: Focused, Single-Column Reading Experience for Live Structured AI Analysis
  return (
    <div
      aria-label="Structured AI problem analysis"
      className={`space-y-5 transition-opacity ${isStale ? 'opacity-85' : ''}`}
    >
      {/* Stale Analysis Alert (only visible after editing problem text) */}
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
                Re-analyze to refresh this breakdown and reset the AI Tutor.
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
        {/* 1. Title, Plain-Language Explanation & Calm Status Strip */}
        <div className="p-6 sm:p-8 space-y-5">
          <div
            role="status"
            className="flex flex-wrap items-center justify-between gap-2"
          >
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="indigo">
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                AI-Generated · Conceptual (Not Verified)
              </Badge>
              {match.status === 'verified' && (
                <Badge variant="mint">
                  <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                  Verified Deterministic Studio Available
                </Badge>
              )}
              {match.status === 'ambiguous' && (
                <Badge variant="amber">
                  <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
                  Ambiguous Match — Please Choose
                </Badge>
              )}
              {match.status === 'conceptual_only' && (
                <Badge variant="neutral">Conceptual Analysis Only</Badge>
              )}
            </div>
            <span className="text-sm font-medium text-[#4E5672]">
              {analysis.inferred_problem_type}
            </span>
          </div>

          <div className="space-y-3">
            <h3 className="text-2xl sm:text-[28px] font-extrabold tracking-tight text-[#181B2E] leading-tight">
              {analysis.title}
            </h3>
            <p className="text-base leading-[1.7] text-[#181B2E]">
              {analysis.plain_language_summary}
            </p>
          </div>

          {/* 2. Visual Input -> Output Example */}
          <div className="rounded-xl bg-[#F8F9FC] border border-[#E4E7F1] p-5 space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-[#4E5672]">
              Example
            </p>
            <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
              <div className="rounded-lg bg-white border border-[#E4E7F1] px-4 py-3">
                <span className="block text-xs font-semibold text-[#4E5672]">
                  Input
                </span>
                <p className="mt-1 font-mono text-sm font-medium text-[#181B2E] break-words">
                  {analysis.worked_example.input_summary}
                </p>
              </div>
              <ArrowRight
                className="hidden sm:block h-5 w-5 text-[#645BE8]"
                aria-hidden="true"
              />
              <div className="rounded-lg bg-[#E6F8F4]/55 border border-[#BDECE2] px-4 py-3">
                <span className="block text-xs font-semibold text-[#0D7D6A]">
                  Output
                </span>
                <p className="mt-1 font-mono text-sm font-bold text-[#0A594B] break-words">
                  {analysis.worked_example.output_summary}
                </p>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-[#4E5672]">
              {analysis.worked_example.walkthrough}
            </p>
          </div>
        </div>

        {/* 3. Three Essential Reasoning Steps */}
        {essentialSteps.length > 0 && (
          <div className="p-6 sm:p-8 space-y-4">
            <h4 className="text-lg font-bold tracking-tight text-[#181B2E]">
              3 Key Reasoning Steps
            </h4>
            <ol className="space-y-4">
              {essentialSteps.map((step, idx) => (
                <li key={step.id} className="flex items-start gap-3.5">
                  <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#EEF0FF] font-mono text-sm font-bold text-[#4F46D8]">
                    {idx + 1}
                  </span>
                  <div className="space-y-1">
                    <p className="text-base font-bold text-[#181B2E]">
                      {step.title}
                    </p>
                    <p className="text-base leading-relaxed text-[#4E5672]">
                      {step.goal}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* 4 & 5. One Useful Guiding Question + One Clear Next Action */}
        <div className="p-6 sm:p-8 space-y-5">
          <div className="rounded-xl border-l-4 border-[#645BE8] bg-[#F8F9FC] px-5 py-4 space-y-1.5">
            <p className="flex items-center gap-2 text-sm font-bold text-[#4F46D8]">
              <HelpCircle className="h-4 w-4" aria-hidden="true" />
              Think About This First
            </p>
            <p className="text-base leading-relaxed text-[#181B2E]">
              {guidingQuestion}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
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
                  Ready to test your intuition or get a hint?
                </p>
                <Button variant="primary" size="md" onClick={onOpenTutor}>
                  <MessageCircle className="h-4 w-4" aria-hidden="true" />
                  Ask AI Tutor
                </Button>
              </>
            ) : null}
          </div>
        </div>

        {/* Progressive Disclosure 1: Candidate Strategies & Complexity */}
        {analysis.candidate_strategies.length > 0 && (
          <details className="group">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-6 sm:px-8 py-4 text-sm font-bold text-[#181B2E] hover:bg-[#F8F9FC]">
              <span>
                Candidate Approaches &amp; Complexity (
                {analysis.candidate_strategies.length})
              </span>
              <ChevronDown
                className="h-4 w-4 shrink-0 text-[#4E5672] transition-transform group-open:rotate-180"
                aria-hidden="true"
              />
            </summary>
            <div className="px-6 sm:px-8 pb-7 pt-2 space-y-3.5">
              {analysis.candidate_strategies.map((strat) => {
                const isSelected = selectedStrategyName === strat.name;
                return (
                  <button
                    key={strat.name}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => onSelectStrategy(strat.name)}
                    className={`w-full rounded-xl border p-5 text-left transition-colors cursor-pointer space-y-2.5 ${
                      isSelected
                        ? 'border-[#645BE8] bg-[#EEF0FF]/40 ring-1 ring-[#645BE8]/30'
                        : 'border-[#E4E7F1] bg-white hover:bg-[#F8F9FC]'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-base font-bold text-[#181B2E]">
                        {strat.name}
                      </span>
                      <span className="text-xs font-semibold text-[#4F46D8]">
                        {strat.technique}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed text-[#181B2E]">
                      {strat.intuition}
                    </p>
                    <p className="text-sm leading-relaxed text-[#4E5672]">
                      {strat.why_it_applies}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 pt-1 font-mono text-xs">
                      <span className="inline-flex items-center gap-1 rounded-md bg-[#F8F9FC] px-2.5 py-1 text-[#181B2E] border border-[#E4E7F1]">
                        <Clock
                          className="h-3.5 w-3.5 text-[#645BE8]"
                          aria-hidden="true"
                        />
                        {strat.time_complexity}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-md bg-[#F8F9FC] px-2.5 py-1 text-[#181B2E] border border-[#E4E7F1]">
                        <Database
                          className="h-3.5 w-3.5 text-[#16B89D]"
                          aria-hidden="true"
                        />
                        {strat.space_complexity}
                      </span>
                    </div>
                    <p className="text-xs text-[#4E5672]">
                      Limitations: {strat.limitations}
                    </p>
                  </button>
                );
              })}
            </div>
          </details>
        )}

        {/* Progressive Disclosure 2: Constraints, Edge Cases & Details */}
        <details className="group">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-6 sm:px-8 py-4 text-sm font-bold text-[#181B2E] hover:bg-[#F8F9FC]">
            <span>Constraints, Edge Cases &amp; Prerequisites</span>
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
