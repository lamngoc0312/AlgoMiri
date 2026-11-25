import { ChevronDown, Clock, Database, MessageSquareText } from 'lucide-react';
import type { SolutionStrategy } from '../../domain/problems/types';
import type { GenericExecutionStep } from '../../domain/core/types';
import { Badge } from '../../components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';

interface WalkthroughPaneProps {
  strategy: SolutionStrategy;
  step: GenericExecutionStep;
  stepIndex: number;
  totalSteps: number;
}

export function WalkthroughPane({
  strategy,
  step,
  stepIndex,
  totalSteps,
}: WalkthroughPaneProps) {
  const statusBadge =
    step.visualState.status === 'found'
      ? { variant: 'mint' as const, label: 'Completed · Valid' }
      : step.visualState.status === 'not-found'
        ? { variant: 'amber' as const, label: 'Completed · Stopped' }
        : {
            variant: 'indigo' as const,
            label: `Step ${stepIndex + 1} / ${totalSteps}`,
          };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <MessageSquareText
              className="h-4 w-4 text-[#2664C2]"
              aria-hidden="true"
            />
            <CardTitle className="text-lg">Step Explanation</CardTitle>
          </div>
          <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="grid gap-5 md:grid-cols-[1.35fr_1fr] md:items-start">
          {/* Plain-language Narrative (16px body) */}
          <div
            aria-live="polite"
            className={`rounded-xl border-l-4 px-5 py-4 transition-colors duration-200 ${
              step.visualState.status === 'found'
                ? 'border-[#15A897] bg-[#E6F7F5]/70'
                : step.visualState.status === 'not-found'
                  ? 'border-[#F2B84B] bg-[#FEF7E7]/70'
                  : 'border-[#397BDB] bg-[#F7F9FC]'
            }`}
          >
            <p className="text-xs font-bold uppercase tracking-wider text-[#2257A8]">
              {step.actionTitle}
            </p>
            <p className="mt-1.5 text-base leading-relaxed text-[#202B3B]">
              {step.explanation}
            </p>
          </div>

          {/* Synchronized Variables Readout */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#526075]">
              Execution State
            </h3>
            <dl className="mt-2 grid grid-cols-2 gap-2.5">
              {Object.entries(step.variables).map(([name, val]) => (
                <div
                  key={name}
                  className="rounded-xl border border-[#E2E8F0] bg-[#F7F9FC] px-3 py-2.5"
                >
                  <dt className="font-mono text-xs text-[#526075] truncate">
                    {name}
                  </dt>
                  <dd className="mt-0.5 font-mono text-base font-bold text-[#202B3B] truncate">
                    {val === null ? '—' : String(val)}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        {/* Progressive Disclosure: Complexity & Tradeoffs */}
        <details className="group rounded-xl border border-[#E2E8F0] bg-[#F7F9FC]">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 text-sm font-bold text-[#202B3B]">
            <span className="flex flex-wrap items-center gap-2.5">
              <span>Complexity &amp; Why {strategy.shortLabel}?</span>
              <span className="inline-flex items-center gap-1 rounded-md bg-white px-2.5 py-0.5 font-mono text-xs font-semibold text-[#202B3B] border border-[#E2E8F0]">
                <Clock className="h-3.5 w-3.5 text-[#2664C2]" aria-hidden="true" />
                {strategy.timeComplexity}
              </span>
              <span className="inline-flex items-center gap-1 rounded-md bg-white px-2.5 py-0.5 font-mono text-xs font-semibold text-[#202B3B] border border-[#E2E8F0]">
                <Database
                  className="h-3.5 w-3.5 text-[#0D7A6E]"
                  aria-hidden="true"
                />
                {strategy.spaceComplexity}
              </span>
            </span>
            <ChevronDown
              className="h-4 w-4 shrink-0 text-[#526075] transition-transform group-open:rotate-180"
              aria-hidden="true"
            />
          </summary>
          <div className="border-t border-[#E2E8F0] px-4 py-3.5 text-sm leading-relaxed text-[#526075]">
            {strategy.tradeoffs}
          </div>
        </details>
      </CardContent>
    </Card>
  );
}
