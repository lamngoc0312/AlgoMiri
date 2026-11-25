import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  const clampedGoalIndex = Math.max(
    0,
    Math.min(activeGoalIndex, graph.nodes.length - 1),
  );

  return (
    <section
      aria-label={t('visualization.solutionMap.previewTitle')}
      className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-subtle)]/80 p-4"
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <GitBranch
            className="h-4 w-4 text-[var(--accent-blue-link)]"
            aria-hidden="true"
          />
          <h3 className="text-sm font-bold text-[var(--text-primary)]">
            {t('visualization.solutionMap.previewTitle')}
          </h3>
        </div>
        <Badge variant="indigo">
          {t('visualization.solutionMap.previewBadge')}
        </Badge>
      </div>

      <ol className="grid gap-3 sm:grid-cols-3">
        {graph.nodes.map((node, index) => {
          const isCurrent = index === clampedGoalIndex;
          return (
            <li
              key={node.id}
              className={`relative rounded-xl border p-3 transition-colors duration-200 ${
                isCurrent
                  ? 'border-[#397BDB] bg-[var(--surface-card)] shadow-xs'
                  : 'border-[var(--border-subtle)] bg-[var(--surface-card)]/75'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span
                  className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                    isCurrent
                      ? 'bg-[var(--accent-blue-solid)] text-white'
                      : 'bg-[var(--accent-blue-soft)] text-[var(--accent-blue-text)]'
                  }`}
                >
                  {index + 1}
                </span>
                {index < graph.nodes.length - 1 && (
                  <ArrowRight
                    className="hidden h-4 w-4 text-[var(--text-secondary)] sm:block"
                    aria-hidden="true"
                  />
                )}
              </div>
              <p className="mt-2 text-xs font-bold text-[var(--text-primary)]">
                {node.title}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-[var(--text-secondary)]">
                {node.learningGoal}
              </p>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
