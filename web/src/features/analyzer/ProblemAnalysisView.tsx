import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock,
  Database,
  GitBranch,
  Info,
  Layers,
  Sparkles,
} from 'lucide-react';
import type { AnalyzeResponseDto } from '../../services/aiClient';
import { Badge } from '../../components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';

interface ProblemAnalysisViewProps {
  result: AnalyzeResponseDto;
  selectedStrategyName: string | null;
  onSelectStrategy: (strategyName: string) => void;
}

export function ProblemAnalysisView({
  result,
  selectedStrategyName,
  onSelectStrategy,
}: ProblemAnalysisViewProps) {
  const { analysis, verified_match: match, mode, notice } = result;

  return (
    <div
      aria-label="Structured AI problem analysis"
      className="space-y-5"
    >
      {/* Honest Mode & Verification Banner */}
      <div
        role="status"
        className={`rounded-2xl border p-4 space-y-2 ${
          mode === 'offline-demo'
            ? 'border-[#F1B34C] bg-[#FEF6E6]/80'
            : 'border-[#D8DCFF] bg-[#EEF0FF]/60'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#645BE8]" aria-hidden="true" />
            <Badge variant={mode === 'offline-demo' ? 'demo' : 'indigo'}>
              {mode === 'offline-demo'
                ? 'Offline Demo Mode (No Live AI Key)'
                : 'AI-Generated · Conceptual (Not Verified)'}
            </Badge>
            <Badge variant="neutral">No Code Executed</Badge>
          </div>
          <span className="text-xs font-medium text-[#555D7A]">
            {analysis.inferred_problem_type}
          </span>
        </div>
        {notice && (
          <p className="text-xs leading-relaxed text-[#9A630A] font-medium">
            {notice}
          </p>
        )}
      </div>

      {/* Verified vs. Ambiguous vs. Conceptual-Only Routing Card */}
      <Card
        className={
          match.status === 'verified'
            ? 'border-[#16B89D]'
            : match.status === 'ambiguous'
              ? 'border-[#F1B34C]'
              : 'border-[#E3E7F2]'
        }
      >
        <CardContent className="p-4 sm:p-5 space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                {match.status === 'verified' && (
                  <>
                    <CheckCircle2
                      className="h-4 w-4 text-[#16B89D]"
                      aria-hidden="true"
                    />
                    <Badge variant="mint">Verified Studio Engine Available</Badge>
                  </>
                )}
                {match.status === 'ambiguous' && (
                  <>
                    <AlertTriangle
                      className="h-4 w-4 text-[#C28219]"
                      aria-hidden="true"
                    />
                    <Badge variant="amber">Ambiguous Match — Please Choose</Badge>
                  </>
                )}
                {match.status === 'conceptual_only' && (
                  <>
                    <Info className="h-4 w-4 text-[#645BE8]" aria-hidden="true" />
                    <Badge variant="neutral">Conceptual Analysis Only</Badge>
                  </>
                )}
              </div>
              <p className="text-sm font-semibold text-[#20253B]">
                {match.reason}
              </p>
              <p className="text-xs text-[#555D7A]">{match.user_input_note}</p>
            </div>

            {match.studio_path && (
              <Link
                to={match.studio_path}
                className={`inline-flex h-10 shrink-0 items-center gap-1.5 rounded-xl px-4 text-xs font-semibold transition-colors ${
                  match.status === 'verified'
                    ? 'bg-[#16B89D] text-white hover:bg-[#0E967F]'
                    : 'border border-[#F1B34C] bg-[#FEF6E6] text-[#9A630A] hover:bg-[#FDEBC8]'
                }`}
              >
                {match.status === 'verified'
                  ? `Open Verified ${match.matched_problem_title} Studio`
                  : `Inspect ${match.matched_problem_title} Studio Anyway`}
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            )}
          </div>

          {match.compatibility_checks.length > 0 && (
            <ul className="flex flex-wrap gap-2 pt-1">
              {match.compatibility_checks.map((check) => (
                <li
                  key={check}
                  className="rounded-lg bg-[#F7F8FC] border border-[#E3E7F2] px-2.5 py-1 text-[11px] text-[#555D7A]"
                >
                  {check}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Main Summary, Inputs/Outputs, Constraints, Worked Example */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-[#645BE8]" aria-hidden="true" />
            <CardTitle className="text-xl">{analysis.title}</CardTitle>
          </div>
          <p className="text-sm leading-relaxed text-[#20253B] mt-1">
            {analysis.plain_language_summary}
          </p>
        </CardHeader>

        <CardContent className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-[#E3E7F2] bg-[#F7F8FC] p-3.5 space-y-1.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#555D7A]">
                Inputs
              </h3>
              <ul className="space-y-1 text-xs text-[#20253B]">
                {analysis.inputs.map((inp) => (
                  <li key={inp}>• {inp}</li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl border border-[#E3E7F2] bg-[#F7F8FC] p-3.5 space-y-1.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#555D7A]">
                Outputs
              </h3>
              <ul className="space-y-1 text-xs text-[#20253B]">
                {analysis.outputs.map((out) => (
                  <li key={out}>• {out}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Worked Example */}
          <div className="rounded-2xl border border-[#D8DCFF] bg-[#EEF0FF]/40 p-4 space-y-1.5 text-xs">
            <h3 className="font-bold uppercase tracking-wider text-[#4F46D8]">
              Illustrative Worked Example (Conceptual)
            </h3>
            <p className="font-mono text-[#20253B]">
              <strong>Input:</strong> {analysis.worked_example.input_summary}
            </p>
            <p className="font-mono text-[#0D7D6A]">
              <strong>Output:</strong> {analysis.worked_example.output_summary}
            </p>
            <p className="text-[#555D7A] leading-relaxed">
              {analysis.worked_example.walkthrough}
            </p>
          </div>

          {/* Constraints, Edge Cases, Ambiguities */}
          <div className="grid gap-4 md:grid-cols-3 text-xs">
            <div className="space-y-1.5">
              <h3 className="font-bold uppercase tracking-wider text-[#555D7A]">
                Constraints &amp; Assumptions
              </h3>
              <ul className="space-y-1 text-[#20253B]">
                {analysis.constraints_and_assumptions.map((c) => (
                  <li key={c}>• {c}</li>
                ))}
              </ul>
            </div>

            <div className="space-y-1.5">
              <h3 className="font-bold uppercase tracking-wider text-[#555D7A]">
                Important Edge Cases
              </h3>
              <ul className="space-y-1 text-[#20253B]">
                {analysis.edge_cases.map((e) => (
                  <li key={e}>• {e}</li>
                ))}
              </ul>
            </div>

            <div className="space-y-1.5">
              <h3 className="font-bold uppercase tracking-wider text-[#555D7A]">
                Clarifications / Ambiguities
              </h3>
              {analysis.clarifications_or_ambiguities.length > 0 ? (
                <ul className="space-y-1 text-[#9A630A]">
                  {analysis.clarifications_or_ambiguities.map((a) => (
                    <li key={a}>• {a}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-[#555D7A]">No major ambiguities flagged.</p>
              )}
            </div>
          </div>

          {/* Prerequisite Concepts */}
          {analysis.prerequisite_concepts.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 border-t border-[#E3E7F2] pt-3">
              <span className="text-xs font-bold text-[#555D7A]">
                Prerequisites:
              </span>
              {analysis.prerequisite_concepts.map((concept) => (
                <Badge key={concept} variant="neutral">
                  {concept}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Beginner-Friendly Decomposition Panel */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <GitBranch className="h-4 w-4 text-[#645BE8]" aria-hidden="true" />
            <CardTitle>Suggested Subproblem Decomposition</CardTitle>
            <Badge variant="neutral">Conceptual</Badge>
          </div>
          <p className="text-xs text-[#555D7A]">
            Break the problem into smaller reasoning goals before writing code.
          </p>
        </CardHeader>
        <CardContent>
          <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {analysis.subproblem_decomposition.map((step, idx) => (
              <li
                key={step.id}
                className="rounded-xl border border-[#E3E7F2] bg-[#F7F8FC] p-3.5 space-y-1.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#645BE8] font-mono text-xs font-bold text-white">
                    {idx + 1}
                  </span>
                  {step.depends_on.length > 0 && (
                    <span className="text-[10px] font-semibold text-[#4F46D8]">
                      Depends on: {step.depends_on.join(', ')}
                    </span>
                  )}
                </div>
                <p className="text-xs font-bold text-[#20253B]">{step.title}</p>
                <p className="text-xs leading-relaxed text-[#555D7A]">
                  {step.goal}
                </p>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      {/* Candidate Strategies */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-[#645BE8]" aria-hidden="true" />
            <CardTitle>Candidate Algorithmic Approaches</CardTitle>
          </div>
          <p className="text-xs text-[#555D7A]">
            Select a candidate strategy to focus the AI Tutor on comparing or explaining it.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 md:grid-cols-2">
            {analysis.candidate_strategies.map((strat) => {
              const isSelected = selectedStrategyName === strat.name;
              return (
                <button
                  key={strat.name}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => onSelectStrategy(strat.name)}
                  className={`flex flex-col justify-between rounded-2xl border p-4 text-left transition-colors cursor-pointer ${
                    isSelected
                      ? 'border-[#645BE8] bg-[#EEF0FF]/55 ring-1 ring-[#645BE8]/30'
                      : 'border-[#E3E7F2] bg-white hover:bg-[#F7F8FC]'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-sm font-bold text-[#20253B]">
                        {strat.name}
                      </span>
                      <Badge variant="indigo">{strat.technique}</Badge>
                    </div>
                    <p className="text-xs leading-relaxed text-[#20253B]">
                      {strat.intuition}
                    </p>
                    <p className="text-xs leading-relaxed text-[#555D7A]">
                      <strong>Why it applies:</strong> {strat.why_it_applies}
                    </p>
                    <p className="text-xs leading-relaxed text-[#9A630A]">
                      <strong>Limitations:</strong> {strat.limitations}
                    </p>
                  </div>

                  <div className="mt-3 space-y-1.5 border-t border-[#E3E7F2] pt-2.5">
                    <div className="flex flex-wrap items-center gap-2 font-mono text-[11px]">
                      <span className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-0.5 text-[#20253B] border border-[#E3E7F2]">
                        <Clock className="h-3 w-3 text-[#645BE8]" aria-hidden="true" />
                        Time: {strat.time_complexity}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-0.5 text-[#20253B] border border-[#E3E7F2]">
                        <Database className="h-3 w-3 text-[#16B89D]" aria-hidden="true" />
                        Space: {strat.space_complexity}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#555D7A]">
                      Assumptions: {strat.complexity_assumptions}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          <p className="text-[11px] text-[#555D7A] pt-1">
            <strong>Confidence &amp; Uncertainty Notes:</strong>{' '}
            {analysis.confidence_notes}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
