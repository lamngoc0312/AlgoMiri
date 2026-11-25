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
      className="rounded-2xl border border-[#E2E8F0] bg-white p-2.5 shadow-[0_1px_3px_rgba(32,37,59,0.04)]"
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
                      ? 'bg-[#2B6CC9] text-white shadow-xs'
                      : isCompleted
                        ? 'bg-[#E6F7F5] text-[#0D7A6E] hover:bg-[#D5F3EC]'
                        : isSkipped
                          ? 'bg-[#FEF7E7] text-[#925E08] hover:bg-[#FDEBC8]'
                          : isAttempted
                            ? 'bg-[#EAF2FD]/70 text-[#2257A8] hover:bg-[#E1E5FF]'
                            : 'bg-[#F7F9FC] text-[#526075] hover:bg-[#EAF2FD]/70 hover:text-[#202B3B]'
                  }`}
                >
                  {isCompleted && !isActive ? (
                    <CheckCircle2
                      className="h-4 w-4 shrink-0 text-[#0D7A6E]"
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
                          ? 'bg-white/20 text-white'
                          : 'bg-white text-[#2257A8] border border-[#DCE1F0]'
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
              ? 'bg-[#0F8477] text-white shadow-xs'
              : 'border border-[#D7DCEB] bg-white text-[#202B3B] hover:bg-[#F7F9FC]'
          }`}
        >
          <ClipboardCheck className="h-4 w-4" aria-hidden="true" />
          Summary
        </button>
      </div>
    </nav>
  );
}
