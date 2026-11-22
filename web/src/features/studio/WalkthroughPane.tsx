import {
  ChevronLeft,
  ChevronRight,
  Info,
  MessageSquareText,
  Play,
  RotateCcw,
} from 'lucide-react';
import type { ExecutionStep } from '../../domain/traces/types';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';

interface WalkthroughPaneProps {
  step: ExecutionStep;
  stepIndex: number;
  totalSteps: number;
  onPrev: () => void;
  onNext: () => void;
  onReset: () => void;
}

export function WalkthroughPane({
  step,
  stepIndex,
  totalSteps,
  onPrev,
  onNext,
  onReset,
}: WalkthroughPaneProps) {
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === totalSteps - 1;

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <MessageSquareText
                className="h-4 w-4 text-[#645BE8]"
                aria-hidden="true"
              />
              <CardTitle>Step Walkthrough</CardTitle>
            </div>
            <Badge variant={step.isTerminal ? 'mint' : 'indigo'}>
              Step {stepIndex + 1} of {totalSteps}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Playback Controls */}
          <div
            role="group"
            aria-label="Step navigation controls"
            className="flex flex-wrap items-center gap-2"
          >
            <Button
              variant="outline"
              size="sm"
              onClick={onPrev}
              disabled={isFirst}
              aria-label="Previous step"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              Prev
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={onNext}
              disabled={isLast}
              aria-label="Next step"
            >
              Next
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={onReset}
              disabled={isFirst}
              aria-label="Reset preview to step 1"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              Reset
            </Button>
          </div>

          {/* Sprint 2 Auto-play Placeholder (honestly disabled) */}
          <div className="flex items-center justify-between gap-2 rounded-xl border border-dashed border-[#D7DCEB] bg-[#F7F8FC] px-3 py-2 text-xs text-[#555D7A]">
            <span className="inline-flex items-center gap-1.5">
              <Play className="h-3.5 w-3.5" aria-hidden="true" />
              Auto-play &amp; speed controls
            </span>
            <span className="font-semibold text-[#645BE8]">Sprint 2</span>
          </div>

          {/* Plain-language Explanation */}
          <div
            aria-live="polite"
            className={`rounded-2xl border p-4 ${
              step.isTerminal
                ? 'border-[#16B89D]/60 bg-[#E6F8F4]/70'
                : 'border-[#E3E7F2] bg-[#F7F8FC]'
            }`}
          >
            <p className="text-xs font-bold uppercase tracking-wider text-[#555D7A]">
              {step.action}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-[#20253B]">
              {step.explanation}
            </p>
          </div>

          {/* Variables Table */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#555D7A]">
              Tracked Variables
            </h3>
            <dl className="mt-2 grid grid-cols-2 gap-2">
              {Object.entries(step.variables).map(([name, val]) => (
                <div
                  key={name}
                  className="rounded-xl border border-[#E3E7F2] bg-white px-3 py-2"
                >
                  <dt className="font-mono text-[11px] text-[#555D7A]">
                    {name}
                  </dt>
                  <dd className="mt-0.5 font-mono text-sm font-bold text-[#20253B]">
                    {val === null ? '—' : String(val)}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Honest Scope Note */}
          <div className="flex items-start gap-2 rounded-xl bg-[#EEF0FF]/60 p-3 text-xs leading-relaxed text-[#4F46D8]">
            <Info className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
            <p>
              <strong>Sprint 1 Preview:</strong> These steps illustrate both Two Sum
              strategies on the default sample. Full deterministic trace generation
              for any custom integer input arrives in Sprint 2.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
