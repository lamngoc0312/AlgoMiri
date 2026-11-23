import { CheckCircle2, ClipboardCheck, FastForward } from 'lucide-react';
import {
  TWO_SUM_GUIDED_STAGES,
  type GuidedStageId,
} from '../../domain/learning/twoSumLesson';
import type { StageStatusMap } from '../../domain/learning/session';

interface GuidedLessonBarProps {
  activeStageId: GuidedStageId;
  stageStatuses: StageStatusMap;
  showingSummary: boolean;
  onSelectStage: (stageId: GuidedStageId) => void;
  onOpenSummary: () => void;
}

export function GuidedLessonBar({
  activeStageId,
  stageStatuses,
  showingSummary,
  onSelectStage,
  onOpenSummary,
}: GuidedLessonBarProps) {
  return (
    <nav
      aria-label="Guided lesson stages"
      className="rounded-2xl border border-[#E3E7F2] bg-white p-2.5 shadow-[0_1px_3px_rgba(32,37,59,0.04)]"
    >
      <div className="flex flex-wrap items-center gap-2">
        <ol className="flex flex-1 flex-wrap items-center gap-1.5">
          {TWO_SUM_GUIDED_STAGES.map((stage) => {
            const isActive = !showingSummary && activeStageId === stage.id;
            const status = stageStatuses[stage.id];
            const isCompleted = status === 'completed';
            const isSkipped = status === 'skipped';
            const isAttempted = status === 'attempted';

            return (
              <li key={stage.id} className="flex-1 min-w-[125px]">
                <button
                  type="button"
                  onClick={() => onSelectStage(stage.id)}
                  aria-current={isActive ? 'step' : undefined}
                  className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-semibold transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-[#645BE8] text-white shadow-xs'
                      : isCompleted
                        ? 'bg-[#E6F8F4] text-[#0D7D6A] hover:bg-[#D5F3EC]'
                        : isSkipped
                          ? 'bg-[#FEF6E6] text-[#9A630A] hover:bg-[#FDEBC8]'
                          : isAttempted
                            ? 'bg-[#EEF0FF]/70 text-[#4F46D8] hover:bg-[#E1E5FF]'
                            : 'bg-[#F7F8FC] text-[#555D7A] hover:bg-[#EEF0FF]/70 hover:text-[#20253B]'
                  }`}
                >
                  {isCompleted && !isActive ? (
                    <CheckCircle2
                      className="h-4 w-4 shrink-0 text-[#16B89D]"
                      aria-hidden="true"
                    />
                  ) : isSkipped && !isActive ? (
                    <FastForward
                      className="h-3.5 w-3.5 shrink-0 text-[#C28219]"
                      aria-hidden="true"
                    />
                  ) : (
                    <span
                      className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full font-mono text-[11px] font-bold ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-white text-[#4F46D8] border border-[#DCE1F0]'
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
              ? 'bg-[#16B89D] text-white shadow-xs'
              : 'border border-[#D7DCEB] bg-white text-[#20253B] hover:bg-[#F7F8FC]'
          }`}
        >
          <ClipboardCheck className="h-4 w-4" aria-hidden="true" />
          Summary
        </button>
      </div>
    </nav>
  );
}
