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
              className="h-4 w-4 text-[var(--accent-blue-link)]"
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
                ? 'border-[#15A897] bg-[var(--accent-teal-soft)]/70'
                : step.visualState.status === 'not-found'
                  ? 'border-[#F2B84B] bg-[var(--accent-amber-soft)]/70'
                  : 'border-[#397BDB] bg-[var(--surface-subtle)]'
            }`}
          >
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--accent-blue-text)]">
              {step.actionTitle}
            </p>
            <p className="mt-1.5 text-base leading-relaxed text-[var(--text-primary)]">
              {step.explanation}
            </p>
          </div>

          {/* Synchronized Variables Readout */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
              Execution State
            </h3>
            <dl className="mt-2 grid grid-cols-2 gap-2.5">
              {Object.entries(step.variables).map(([name, val]) => (
                <div
                  key={name}
                  className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-subtle)] px-3 py-2.5"
                >
                  <dt className="font-mono text-xs text-[var(--text-secondary)] truncate">
                    {name}
                  </dt>
                  <dd className="mt-0.5 font-mono text-base font-bold text-[var(--text-primary)] truncate">
                    {val === null ? '—' : String(val)}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        {/* Progressive Disclosure: Complexity & Tradeoffs */}
        <details className="group rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-subtle)]">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 text-sm font-bold text-[var(--text-primary)]">
            <span className="flex flex-wrap items-center gap-2.5">
              <span>Complexity &amp; Why {strategy.shortLabel}?</span>
              <span className="inline-flex items-center gap-1 rounded-md bg-[var(--surface-card)] px-2.5 py-0.5 font-mono text-xs font-semibold text-[var(--text-primary)] border border-[var(--border-subtle)]">
                <Clock className="h-3.5 w-3.5 text-[var(--accent-blue-link)]" aria-hidden="true" />
                {strategy.timeComplexity}
              </span>
              <span className="inline-flex items-center gap-1 rounded-md bg-[var(--surface-card)] px-2.5 py-0.5 font-mono text-xs font-semibold text-[var(--text-primary)] border border-[var(--border-subtle)]">
                <Database
                  className="h-3.5 w-3.5 text-[var(--accent-teal-text)]"
                  aria-hidden="true"
                />
                {strategy.spaceComplexity}
              </span>
            </span>
            <ChevronDown
              className="h-4 w-4 shrink-0 text-[var(--text-secondary)] transition-transform group-open:rotate-180"
              aria-hidden="true"
            />
          </summary>
          <div className="border-t border-[var(--border-subtle)] px-4 py-3.5 text-sm leading-relaxed text-[var(--text-secondary)]">
            {strategy.tradeoffs}
          </div>
        </details>
      </CardContent>
    </Card>
  );
}
