import { Clock, Database, MessageSquareText } from 'lucide-react';
import type { SolutionStrategy } from '../../domain/problems/types';
import type { ExecutionStep } from '../../domain/traces/types';
import { Badge } from '../../components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';

interface WalkthroughPaneProps {
  strategy: SolutionStrategy;
  step: ExecutionStep;
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
      ? { variant: 'mint' as const, label: 'Completed · Found' }
      : step.visualState.status === 'not-found'
        ? { variant: 'amber' as const, label: 'Completed · Not Found' }
        : { variant: 'indigo' as const, label: `Step ${stepIndex + 1} / ${totalSteps}` };

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <MessageSquareText
                className="h-4 w-4 text-[#645BE8]"
                aria-hidden="true"
              />
              <CardTitle>Step Explanation</CardTitle>
            </div>
            <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Plain-language Narrative */}
          <div
            aria-live="polite"
            className={`rounded-2xl border p-4 transition-colors duration-200 ${
              step.visualState.status === 'found'
                ? 'border-[#16B89D]/60 bg-[#E6F8F4]/70'
                : step.visualState.status === 'not-found'
                  ? 'border-[#F1B34C]/70 bg-[#FEF6E6]/70'
                  : 'border-[#E3E7F2] bg-[#F7F8FC]'
            }`}
          >
            <p className="text-xs font-bold uppercase tracking-wider text-[#4F46D8]">
              {step.actionTitle}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-[#20253B]">
              {step.explanation}
            </p>
          </div>

          {/* Synchronized Variables Readout */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#555D7A]">
              Execution State
            </h3>
            <dl className="mt-2 grid grid-cols-2 gap-2">
              {Object.entries(step.variables).map(([name, val]) => (
                <div
                  key={name}
                  className="rounded-xl border border-[#E3E7F2] bg-white px-3 py-2"
                >
                  <dt className="font-mono text-[11px] text-[#555D7A] truncate">
                    {name}
                  </dt>
                  <dd className="mt-0.5 font-mono text-sm font-bold text-[#20253B] truncate">
                    {val === null ? '—' : String(val)}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Strategy Complexity Reminder */}
          <div className="rounded-xl border border-[#E3E7F2] bg-[#F7F8FC] p-3 space-y-2">
            <p className="text-xs font-bold text-[#20253B]">
              Why {strategy.shortLabel}?
            </p>
            <p className="text-xs leading-relaxed text-[#555D7A]">
              {strategy.tradeoffs}
            </p>
            <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] pt-1">
              <span className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-0.5 text-[#20253B] border border-[#E3E7F2]">
                <Clock className="h-3 w-3 text-[#645BE8]" aria-hidden="true" />
                Time {strategy.timeComplexity}
              </span>
              <span className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-0.5 text-[#20253B] border border-[#E3E7F2]">
                <Database className="h-3 w-3 text-[#16B89D]" aria-hidden="true" />
                Space {strategy.spaceComplexity}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
