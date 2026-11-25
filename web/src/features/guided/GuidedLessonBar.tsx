import { CheckCircle2, ClipboardCheck, FastForward } from 'lucide-react';
import type { GuidedStage } from '../../domain/core/types';
import type { StageStatusMap } from '../../domain/learning/session';

interface GuidedLessonBarProps {
  stages: GuidedStage[];
  activeStageId: string;
  stageStatuses: StageStatusMap;
  showingSummary: boolean;
  onSelectStage: (stageId: string) => void;
  onOpenSummary: () => void;
}

export function GuidedLessonBar({
  stages,
  activeStageId,
  stageStatuses,
  showingSummary,
  onSelectStage,
  onOpenSummary,
}: GuidedLessonBarProps) {
  return (
    <nav
      aria-label="Guided lesson stages"
      className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-2.5 shadow-[0_1px_3px_rgba(32,37,59,0.04)]"
    >
      <div className="flex flex-wrap items-center gap-2">
        <ol className="flex flex-1 flex-wrap items-center gap-1.5">
          {stages.map((stage) => {
            const isActive = !showingSummary && activeStageId === stage.id;
            const status = stageStatuses[stage.id];
            const isCompleted = status === 'completed';
            const isSkipped =
              status === 'skipped' || status === 'skipped-after-attempt';
            const isAttempted = status === 'attempted';

            return (
              <li key={stage.id} className="flex-1 min-w-[125px]">
                <button
                  type="button"
                  onClick={() => onSelectStage(stage.id)}
                  aria-current={isActive ? 'step' : undefined}
                  className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-semibold transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-[var(--accent-blue-solid)] text-white shadow-xs'
                      : isCompleted
                        ? 'bg-[var(--accent-teal-soft)] text-[var(--accent-teal-text)] hover:bg-[#D5F3EC]'
                        : isSkipped
                          ? 'bg-[var(--accent-amber-soft)] text-[var(--accent-amber-text)] hover:bg-[var(--accent-amber-soft)]'
                          : isAttempted
                            ? 'bg-[var(--accent-blue-soft)]/70 text-[var(--accent-blue-text)] hover:bg-[#E1E5FF]'
                            : 'bg-[var(--surface-subtle)] text-[var(--text-secondary)] hover:bg-[var(--accent-blue-soft)]/70 hover:text-[var(--text-primary)]'
                  }`}
                >
                  {isCompleted && !isActive ? (
                    <CheckCircle2
                      className="h-4 w-4 shrink-0 text-[var(--accent-teal-text)]"
                      aria-hidden="true"
                    />
                  ) : isSkipped && !isActive ? (
                    <FastForward
                      className="h-3.5 w-3.5 shrink-0 text-[#C28219]"
                      aria-hidden="true"
                    />
                  ) : (
                    <span
                      className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full font-mono text-xs font-bold ${
                        isActive
                          ? 'bg-[var(--surface-card)]/20 text-white'
                          : 'bg-[var(--surface-card)] text-[var(--accent-blue-text)] border border-[var(--border-control)]'
                      }`}
                    >
                      {stage.stageNumber}
                    </span>
                  )}
                  <span className="truncate">{stage.shortTitle}</span>
                </button>
              </li>
            );
          })}
        </ol>

        <button
          type="button"
          onClick={onOpenSummary}
          aria-pressed={showingSummary}
          className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-colors cursor-pointer ${
            showingSummary
              ? 'bg-[var(--accent-teal-solid)] text-white shadow-xs'
              : 'border border-[var(--border-control)] bg-[var(--surface-card)] text-[var(--text-primary)] hover:bg-[var(--surface-elevated)]'
          }`}
        >
          <ClipboardCheck className="h-4 w-4" aria-hidden="true" />
          Summary
        </button>
      </div>
    </nav>
  );
}
