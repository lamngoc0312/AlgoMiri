import { ArrowRight, GitBranch } from 'lucide-react';
import type { SolutionGraph } from '../../domain/problems/types';
import { Badge } from '../../components/ui/Badge';

interface SolutionMapPreviewProps {
  graph: SolutionGraph;
  activeGoalIndex: number;
}

export function SolutionMapPreview({
  graph,
  activeGoalIndex,
}: SolutionMapPreviewProps) {
  const clampedGoalIndex = Math.max(
    0,
    Math.min(activeGoalIndex, graph.nodes.length - 1),
  );

  return (
    <section
      aria-label="Conceptual Solution Map"
      className="rounded-2xl border border-[#E3E7F2] bg-[#F7F8FC]/80 p-4"
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <GitBranch className="h-4 w-4 text-[#645BE8]" aria-hidden="true" />
          <h3 className="text-sm font-bold text-[#20253B]">
            Conceptual Solution Map
          </h3>
        </div>
        <Badge variant="indigo">Reasoning Flow</Badge>
      </div>

      <ol className="grid gap-3 sm:grid-cols-3">
        {graph.nodes.map((node, index) => {
          const isCurrent = index === clampedGoalIndex;
          return (
            <li
              key={node.id}
              className={`relative rounded-xl border p-3 transition-colors duration-200 ${
                isCurrent
                  ? 'border-[#645BE8] bg-white shadow-xs'
                  : 'border-[#E3E7F2] bg-white/75'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span
                  className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                    isCurrent
                      ? 'bg-[#645BE8] text-white'
                      : 'bg-[#EEF0FF] text-[#4F46D8]'
                  }`}
                >
                  {index + 1}
                </span>
                {index < graph.nodes.length - 1 && (
                  <ArrowRight
                    className="hidden h-4 w-4 text-[#8B93B0] sm:block"
                    aria-hidden="true"
                  />
                )}
              </div>
              <p className="mt-2 text-xs font-bold text-[#20253B]">
                {node.title}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-[#555D7A]">
                {node.learningGoal}
              </p>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
