import { Eye, Hash, SlidersHorizontal } from 'lucide-react';
import type { SolutionGraph, SolutionStrategy } from '../../domain/problems/types';
import type { ExecutionStep, HighlightRole } from '../../domain/traces/types';
import { Badge } from '../../components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { SolutionMapPreview } from '../solutions/SolutionMapPreview';

interface VisualCanvasProps {
  strategy: SolutionStrategy;
  step: ExecutionStep;
  solutionGraph: SolutionGraph;
}

const ROLE_STYLES: Record<
  HighlightRole,
  { box: string; badge: string; dot: string }
> = {
  current: {
    box: 'border-[#F1B34C] bg-[#FEF6E6] text-[#20253B] shadow-xs',
    badge: 'bg-[#F1B34C] text-[#20253B]',
    dot: 'bg-[#F1B34C]',
  },
  partner: {
    box: 'border-[#645BE8] bg-[#EEF0FF] text-[#20253B] shadow-xs',
    badge: 'bg-[#645BE8] text-white',
    dot: 'bg-[#645BE8]',
  },
  match: {
    box: 'border-[#16B89D] bg-[#E6F8F4] text-[#0A594B] shadow-xs',
    badge: 'bg-[#16B89D] text-white',
    dot: 'bg-[#16B89D]',
  },
  visited: {
    box: 'border-[#C5CBE3] bg-[#F0F2F8] text-[#555D7A]',
    badge: 'bg-[#555D7A] text-white',
    dot: 'bg-[#555D7A]',
  },
};

export function VisualCanvas({
  strategy,
  step,
  solutionGraph,
}: VisualCanvasProps) {
  const { visualState } = step;

  const getHighlightForIndex = (index: number) =>
    visualState.highlights.find((h) => h.index === index);

  return (
    <div className="flex flex-col gap-4">
      <Card className="overflow-hidden">
        <CardHeader className="border-b border-[#E3E7F2] bg-white">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-[#645BE8]" aria-hidden="true" />
              <CardTitle>Visual Execution Canvas</CardTitle>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="indigo">{strategy.shortLabel}</Badge>
              <Badge variant="demo">Sprint 1 Static Preview</Badge>
            </div>
          </div>
          <p className="text-xs text-[#555D7A]">
            Inspect how pointers, array values, and memory structures change at each reasoning step.
          </p>
        </CardHeader>

        <CardContent className="space-y-6 pt-5">
          {/* Input Summary Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#E3E7F2] bg-[#F7F8FC] px-4 py-3">
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <span className="font-semibold text-[#555D7A]">Sample Input:</span>
              <code className="rounded-lg bg-white px-2.5 py-1 font-mono text-xs font-semibold text-[#20253B] border border-[#E3E7F2]">
                nums = [{visualState.nums.join(', ')}]
              </code>
              <code className="rounded-lg bg-[#EEF0FF] px-2.5 py-1 font-mono text-xs font-semibold text-[#4F46D8] border border-[#D8DCFF]">
                target = {visualState.target}
              </code>
            </div>

            <button
              type="button"
              disabled
              title="Custom array and target inputs are scheduled for Sprint 2"
              className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-[#C5CBE3] bg-white/70 px-2.5 py-1 text-xs font-medium text-[#555D7A] opacity-75 cursor-not-allowed"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
              Custom input (Sprint 2)
            </button>
          </div>

          {/* Array Visualization */}
          <div aria-label="Array state visualization" className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#555D7A]">
                Array Elements
              </h3>
              {visualState.complement !== undefined && visualState.complement !== null && (
                <span className="rounded-full bg-[#FEF6E6] px-2.5 py-0.5 font-mono text-xs font-semibold text-[#9A630A] border border-[#F8DFA8]">
                  Need complement: {visualState.complement}
                </span>
              )}
              {visualState.pairSum !== undefined && visualState.pairSum !== null && (
                <span className="rounded-full bg-[#E6F8F4] px-2.5 py-0.5 font-mono text-xs font-semibold text-[#0D7D6A] border border-[#BDECE2]">
                  Pair sum: {visualState.pairSum}
                </span>
              )}
            </div>

            <div className="grid grid-cols-4 gap-3 sm:gap-4">
              {visualState.nums.map((value, idx) => {
                const highlight = getHighlightForIndex(idx);
                const styles = highlight ? ROLE_STYLES[highlight.role] : null;

                return (
                  <div key={idx} className="flex flex-col items-center gap-2">
                    <div className="min-h-6 flex items-center justify-center">
                      {highlight ? (
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] font-bold whitespace-nowrap ${styles?.badge}`}
                        >
                          {highlight.label}
                        </span>
                      ) : (
                        <span className="text-[11px] text-transparent select-none">
                          idle
                        </span>
                      )}
                    </div>

                    <div
                      className={`flex h-20 w-full flex-col items-center justify-center rounded-2xl border-2 font-mono transition-colors ${
                        styles
                          ? styles.box
                          : 'border-[#E3E7F2] bg-white text-[#20253B]'
                      }`}
                    >
                      <span className="text-xl font-bold sm:text-2xl">{value}</span>
                      <span className="mt-0.5 text-[11px] text-[#555D7A]">
                        idx {idx}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Hash Map Panel (shown for Hash Map strategy) */}
          {strategy.id === 'hash-map' && (
            <div
              aria-label="Seen hash map visualization"
              className="rounded-2xl border border-[#E3E7F2] bg-[#F7F8FC] p-4"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Hash className="h-4 w-4 text-[#645BE8]" aria-hidden="true" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#20253B]">
                    Seen Hash Map (value &rarr; index)
                  </h3>
                </div>
                <span className="font-mono text-xs text-[#555D7A]">
                  size: {visualState.hashMap?.length ?? 0}
                </span>
              </div>

              {visualState.hashMap && visualState.hashMap.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-2.5">
                  {visualState.hashMap.map((entry) => (
                    <div
                      key={`${entry.key}-${entry.value}`}
                      className={`flex items-center gap-2 rounded-xl border px-3 py-2 font-mono text-xs font-semibold ${
                        entry.isMatched
                          ? 'border-[#16B89D] bg-[#E6F8F4] text-[#0D7D6A]'
                          : entry.isNew
                            ? 'border-[#645BE8] bg-[#EEF0FF] text-[#4F46D8]'
                            : 'border-[#E3E7F2] bg-white text-[#20253B]'
                      }`}
                    >
                      <span>{entry.key}</span>
                      <span className="text-[#8B93B0]">&rarr;</span>
                      <span>idx {entry.value}</span>
                      {entry.isMatched && (
                        <Badge variant="mint" className="ml-1">
                          Hit
                        </Badge>
                      )}
                      {entry.isNew && (
                        <Badge variant="indigo" className="ml-1">
                          Added
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-xs text-[#555D7A]">
                  Map is empty — no elements have been stored yet.
                </p>
              )}
            </div>
          )}

          {/* Accessible Color + Label Legend */}
          <div
            aria-label="Highlight color legend"
            className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-[#E3E7F2] pt-4 text-xs text-[#555D7A]"
          >
            <span className="font-bold text-[#20253B]">Legend:</span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-[#F1B34C]" aria-hidden="true" />
              Current / Anchor
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-[#645BE8]" aria-hidden="true" />
              Partner / Lookup
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-[#16B89D]" aria-hidden="true" />
              Confirmed Match
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-[#555D7A]" aria-hidden="true" />
              Stored / Visited
            </span>
          </div>
        </CardContent>
      </Card>

      <SolutionMapPreview
        graph={solutionGraph}
        activeStepIndex={step.stepIndex}
      />
    </div>
  );
}
