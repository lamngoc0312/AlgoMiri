import { CheckCircle2, Clock, Database, Layers, Lock } from 'lucide-react';
import type { ProblemSpec } from '../../domain/problems/types';
import { Badge } from '../../components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';

interface ProblemPaneProps {
  problem: ProblemSpec;
  selectedStrategyId: string;
  onSelectStrategy: (strategyId: string) => void;
  hideStrategySelector?: boolean;
  lockedStrategyIds?: string[];
}

export function ProblemPane({
  problem,
  selectedStrategyId,
  onSelectStrategy,
  hideStrategySelector = false,
  lockedStrategyIds = [],
}: ProblemPaneProps) {
  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Badge variant="mint">{problem.difficulty}</Badge>
            <Badge variant="indigo">Interactive</Badge>
          </div>
          <CardTitle className="text-xl mt-1">{problem.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm leading-relaxed text-[#20253B]">
            {problem.statement}
          </p>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#555D7A]">
              Examples
            </h3>
            <div className="mt-2 space-y-2.5">
              {problem.examples.map((ex, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-[#E3E7F2] bg-[#F7F8FC] p-3 text-xs"
                >
                  <p className="font-mono font-medium text-[#20253B]">
                    {ex.input}
                  </p>
                  <p className="mt-1 font-mono text-[#0D7D6A]">
                    Output: {ex.output}
                  </p>
                  <p className="mt-1 text-[#555D7A]">{ex.explanation}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#555D7A]">
              Key Rules
            </h3>
            <ul className="mt-2 space-y-1.5 text-xs text-[#555D7A]">
              {problem.constraints.map((rule) => (
                <li key={rule} className="flex items-start gap-2">
                  <span
                    className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#645BE8]"
                    aria-hidden="true"
                  />
                  <span>{rule}</span>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      {!hideStrategySelector && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-[#645BE8]" aria-hidden="true" />
              <CardTitle>Choose a Strategy</CardTitle>
            </div>
            <p className="text-xs text-[#555D7A]">
              Compare how different ideas solve the same problem before writing code.
            </p>
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
                      className="w-full rounded-xl border border-dashed border-[#D7DCEB] bg-[#F7F8FC] p-3.5 text-left"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-bold text-[#555D7A]">
                          Optimized Strategy
                        </span>
                        <Badge variant="neutral">
                          <Lock className="h-3 w-3" aria-hidden="true" />
                          Stage 3
                        </Badge>
                      </div>
                      <p className="mt-1.5 text-xs text-[#555D7A]">
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
                        ? 'border-[#645BE8] bg-[#EEF0FF]/70 ring-1 ring-[#645BE8]/30'
                        : 'border-[#E3E7F2] bg-white hover:border-[#C5CBE3] hover:bg-[#F7F8FC]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-sm font-bold text-[#20253B]">
                        {strategy.name}
                      </span>
                      {isSelected && (
                        <CheckCircle2
                          className="h-4 w-4 shrink-0 text-[#645BE8]"
                          aria-hidden="true"
                        />
                      )}
                    </div>
                    <p className="mt-1.5 text-xs leading-relaxed text-[#555D7A]">
                      {strategy.intuition}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-2 font-mono text-[11px]">
                      <span className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-0.5 text-[#20253B] border border-[#E3E7F2]">
                        <Clock className="h-3 w-3 text-[#645BE8]" aria-hidden="true" />
                        Time {strategy.timeComplexity}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-0.5 text-[#20253B] border border-[#E3E7F2]">
                        <Database className="h-3 w-3 text-[#16B89D]" aria-hidden="true" />
                        Space {strategy.spaceComplexity}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
