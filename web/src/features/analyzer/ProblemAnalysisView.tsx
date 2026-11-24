import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Clock,
  Database,
  Info,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import type { AnalyzeResponseDto } from '../../services/aiClient';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';

interface ProblemAnalysisViewProps {
  result: AnalyzeResponseDto;
  selectedStrategyName: string | null;
  isStale?: boolean;
  onReanalyze?: () => void;
  onSelectStrategy: (strategyName: string) => void;
}

export function ProblemAnalysisView({
  result,
  selectedStrategyName,
  isStale = false,
  onReanalyze,
  onSelectStrategy,
}: ProblemAnalysisViewProps) {
  const { analysis, verified_match: match, mode, notice } = result;

  return (
    <div
      aria-label="Structured AI problem analysis"
      className={`space-y-5 transition-opacity ${isStale ? 'opacity-80' : ''}`}
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

      {/* Single Unified Document Card (replaces 5 stacked cards & repetitive banners) */}
      <Card className="overflow-hidden divide-y divide-[#E4E7F1]">
        {/* 1. Unified Status & Studio Routing Bar */}
        <div
          role="status"
          className="bg-[#F8F9FC] px-6 py-4 space-y-2.5"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={mode === 'offline-demo' ? 'demo' : 'indigo'}>
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                {mode === 'offline-demo'
                  ? 'Offline Demo Mode (No Live AI Key)'
                  : 'AI-Generated · Conceptual (Not Verified)'}
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
                <Badge variant="neutral">
                  <Info className="h-3.5 w-3.5" aria-hidden="true" />
                  Conceptual Analysis Only
                </Badge>
              )}
            </div>

            <span className="text-xs font-semibold text-[#4E5672]">
              {analysis.inferred_problem_type}
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-[#4E5672] leading-relaxed">
              {match.reason}
              {notice ? ` ${notice}` : ''}
            </p>

            {match.studio_path && (
              <Link
                to={match.studio_path}
                className={`inline-flex h-10 shrink-0 items-center gap-1.5 rounded-xl px-4 text-sm font-semibold transition-colors ${
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
            )}
          </div>
        </div>

        {/* 2. Problem Overview & Worked Example (16px readable body) */}
        <div className="p-6 sm:p-7 space-y-6">
          <div className="space-y-2.5">
            <h3 className="text-2xl font-extrabold tracking-tight text-[#181B2E]">
              {analysis.title}
            </h3>
            <p className="text-base leading-relaxed text-[#181B2E]">
              {analysis.plain_language_summary}
            </p>
          </div>

          {/* Worked Example — clean left-accented callout instead of nested card */}
          <div className="rounded-xl border-l-4 border-[#645BE8] bg-[#F8F9FC] px-5 py-4 space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-[#4F46D8]">
              Worked Example (Conceptual)
            </p>
            <div className="flex flex-wrap gap-x-6 gap-y-1 font-mono text-sm">
              <p className="text-[#181B2E]">
                <span className="text-[#4E5672]">Input:</span>{' '}
                {analysis.worked_example.input_summary}
              </p>
              <p className="text-[#0D7D6A] font-semibold">
                <span className="font-normal text-[#4E5672]">Output:</span>{' '}
                {analysis.worked_example.output_summary}
              </p>
            </div>
            <p className="text-sm leading-relaxed text-[#4E5672]">
              {analysis.worked_example.walkthrough}
            </p>
          </div>
        </div>

        {/* 3. Candidate Approaches (primary interactive focus) */}
        <div className="p-6 sm:p-7 space-y-4">
          <div>
            <h4 className="text-lg font-bold tracking-tight text-[#181B2E]">
              Candidate Approaches
            </h4>
            <p className="mt-0.5 text-sm text-[#4E5672]">
              Choose an approach to focus the AI Tutor on comparing or explaining it.
            </p>
          </div>

          <div className="grid gap-3.5 md:grid-cols-2">
            {analysis.candidate_strategies.map((strat) => {
              const isSelected = selectedStrategyName === strat.name;
              return (
                <button
                  key={strat.name}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => onSelectStrategy(strat.name)}
                  className={`flex flex-col justify-between rounded-xl border p-4.5 text-left transition-colors cursor-pointer ${
                    isSelected
                      ? 'border-[#645BE8] bg-[#EEF0FF]/45 ring-1 ring-[#645BE8]/30'
                      : 'border-[#E4E7F1] bg-white hover:border-[#C5CBE3] hover:bg-[#F8F9FC]'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-base font-bold text-[#181B2E]">
                        {strat.name}
                      </span>
                      <Badge variant="indigo">{strat.technique}</Badge>
                    </div>
                    <p className="text-sm leading-relaxed text-[#181B2E]">
                      {strat.intuition}
                    </p>
                    <p className="text-sm leading-relaxed text-[#4E5672]">
                      {strat.why_it_applies}
                    </p>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-[#E4E7F1] pt-3 font-mono text-xs">
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
                </button>
              );
            })}
          </div>
        </div>

        {/* 4. Progressive Disclosure: Subproblem Breakdown */}
        {analysis.subproblem_decomposition.length > 0 && (
          <details className="group">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-6 py-4 text-sm font-bold text-[#181B2E] hover:bg-[#F8F9FC]">
              <span>
                Step-by-Step Subproblem Breakdown (
                {analysis.subproblem_decomposition.length} steps)
              </span>
              <ChevronDown
                className="h-4 w-4 shrink-0 text-[#4E5672] transition-transform group-open:rotate-180"
                aria-hidden="true"
              />
            </summary>
            <div className="px-6 pb-6 pt-1">
              <ol className="space-y-3">
                {analysis.subproblem_decomposition.map((step, idx) => (
                  <li
                    key={step.id}
                    className="flex items-start gap-3.5 rounded-xl bg-[#F8F9FC] px-4 py-3.5"
                  >
                    <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#645BE8] font-mono text-xs font-bold text-white">
                      {idx + 1}
                    </span>
                    <div className="space-y-0.5">
                      <p className="text-sm font-bold text-[#181B2E]">
                        {step.title}
                        {step.depends_on.length > 0 && (
                          <span className="ml-2 text-xs font-medium text-[#4F46D8]">
                            (after {step.depends_on.join(', ')})
                          </span>
                        )}
                      </p>
                      <p className="text-sm leading-relaxed text-[#4E5672]">
                        {step.goal}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </details>
        )}

        {/* 5. Progressive Disclosure: Specs, Constraints, Edge Cases & Notes */}
        <details className="group">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-6 py-4 text-sm font-bold text-[#181B2E] hover:bg-[#F8F9FC]">
            <span>Inputs, Constraints, Edge Cases &amp; Prerequisites</span>
            <ChevronDown
              className="h-4 w-4 shrink-0 text-[#4E5672] transition-transform group-open:rotate-180"
              aria-hidden="true"
            />
          </summary>
          <div className="px-6 pb-6 pt-2 space-y-5 text-sm">
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

            {analysis.clarifications_or_ambiguities.length > 0 && (
              <div className="space-y-1.5">
                <h5 className="text-xs font-bold uppercase tracking-wider text-[#4E5672]">
                  Clarifications / Ambiguities
                </h5>
                <ul className="space-y-1 text-[#9A630A]">
                  {analysis.clarifications_or_ambiguities.map((a) => (
                    <li key={a}>• {a}</li>
                  ))}
                </ul>
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
