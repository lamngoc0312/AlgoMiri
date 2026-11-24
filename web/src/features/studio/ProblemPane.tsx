import { CheckCircle2, ChevronDown, Clock, Database, Layers, Lock } from 'lucide-react';
import type { ProblemSpec } from '../../domain/problems/types';
import { Badge } from '../../components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';

interface ProblemPaneProps {
  problem: ProblemSpec;
  selectedStrategyId: string;
  onSelectStrategy: (strategyId: string) => void;
  hideStrategySelector?: boolean;
  lockedStrategyIds?: string[];
  /** Progressive disclosure: collapse full problem statement in Guided Mode so the active task stays primary. */
  defaultStatementExpanded?: boolean;
}

export function ProblemPane({
  problem,
  selectedStrategyId,
  onSelectStrategy,
  hideStrategySelector = false,
  lockedStrategyIds = [],
  defaultStatementExpanded = true,
}: ProblemPaneProps) {
  return (
    <div className="flex flex-col gap-4">
      {!hideStrategySelector && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-[#645BE8]" aria-hidden="true" />
              <CardTitle className="text-lg">Strategy</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div
              role="radiogroup"
              aria-label="Solution strategy selector"
              className="flex flex-col gap-2.5"
            >
              {problem.supportedStrategies.map((strategy) => {
                const isSelected = strategy.id === selectedStrategyId;
                const isLocked = lockedStrategyIds.includes(strategy.id);

                if (isLocked) {
                  return (
                    <div
                      key={strategy.id}
                      className="w-full rounded-xl border border-dashed border-[#D7DCEB] bg-[#F8F9FC] p-3.5 text-left"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-bold text-[#4E5672]">
                          Optimized Strategy
                        </span>
                        <Badge variant="neutral">
                          <Lock className="h-3 w-3" aria-hidden="true" />
                          Stage 3
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm text-[#4E5672] leading-relaxed">
                        Unlocks in Stage 3 (Discover Optimization) — or switch to Free Exploration anytime.
                      </p>
                    </div>
                  );
                }

                return (
                  <button
                    key={strategy.id}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => onSelectStrategy(strategy.id)}
                    className={`w-full rounded-xl border p-3.5 text-left transition-colors cursor-pointer ${
                      isSelected
                        ? 'border-[#645BE8] bg-[#EEF0FF]/55 ring-1 ring-[#645BE8]/30'
                        : 'border-[#E4E7F1] bg-white hover:border-[#C5CBE3] hover:bg-[#F8F9FC]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-base font-bold text-[#181B2E]">
                        {strategy.name}
                      </span>
                      {isSelected && (
                        <CheckCircle2
                          className="h-4 w-4 shrink-0 text-[#645BE8] mt-0.5"
                          aria-hidden="true"
                        />
                      )}
                    </div>
                    <p className="mt-1 text-sm leading-relaxed text-[#4E5672]">
                      {strategy.intuition}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-2 font-mono text-xs">
                      <span className="inline-flex items-center gap-1 rounded-md bg-white px-2.5 py-0.5 text-[#181B2E] border border-[#E4E7F1]">
                        <Clock className="h-3.5 w-3.5 text-[#645BE8]" aria-hidden="true" />
                        {strategy.timeComplexity}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-md bg-white px-2.5 py-0.5 text-[#181B2E] border border-[#E4E7F1]">
                        <Database className="h-3.5 w-3.5 text-[#16B89D]" aria-hidden="true" />
                        {strategy.spaceComplexity}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Progressive Disclosure for Problem Statement, Examples & Key Rules */}
      <Card>
        <details open={defaultStatementExpanded} className="group">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-6 py-4 text-sm font-bold text-[#181B2E] hover:bg-[#F8F9FC] rounded-2xl">
            <span className="flex items-center gap-2">
              <span>{problem.title} — Problem &amp; Rules</span>
              <Badge variant="mint">{problem.difficulty}</Badge>
            </span>
            <ChevronDown
              className="h-4 w-4 shrink-0 text-[#4E5672] transition-transform group-open:rotate-180"
              aria-hidden="true"
            />
          </summary>

          <CardContent className="space-y-5 border-t border-[#E4E7F1] pt-5">
            <p className="text-base leading-relaxed text-[#181B2E]">
              {problem.statement}
            </p>

            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#4E5672]">
                Examples
              </h3>
              <div className="mt-2.5 space-y-2.5">
                {problem.examples.map((ex, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl border-l-4 border-[#645BE8] bg-[#F8F9FC] px-4 py-3 text-sm"
                  >
                    <p className="font-mono font-medium text-[#181B2E]">
                      {ex.input}
                    </p>
                    <p className="mt-1 font-mono text-[#0D7D6A] font-semibold">
                      Output: {ex.output}
                    </p>
                    <p className="mt-1 text-[#4E5672] leading-relaxed">
                      {ex.explanation}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#4E5672]">
                Key Rules
              </h3>
              <ul className="mt-2.5 space-y-2 text-sm text-[#4E5672]">
                {problem.constraints.map((rule) => (
                  <li key={rule} className="flex items-start gap-2.5">
                    <span
                      className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#645BE8]"
                      aria-hidden="true"
                    />
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </details>
      </Card>
    </div>
  );
}
