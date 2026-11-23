import { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Code2,
  Eye,
  FastForward,
  GraduationCap,
  HelpCircle,
} from 'lucide-react';
import type {
  GuidedStage,
  ProblemLesson,
} from '../../domain/core/types';
import type { StageStatus } from '../../domain/learning/session';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { HintPanel } from './HintPanel';

interface GuidedStagePanelProps {
  lesson: ProblemLesson;
  stage: GuidedStage;
  stageStatus: StageStatus;
  revealedHintsCount: number;
  onRevealNextHint: () => void;
  onAnswerStage: (stageId: string, isCorrect: boolean) => void;
  onNavigateStage: (stageId: string) => void;
  onSkipOrContinue: (
    currentStageId: string,
    destination: string | 'summary',
  ) => void;
}

export function GuidedStagePanel({
  lesson,
  stage,
  stageStatus,
  revealedHintsCount,
  onRevealNextHint,
  onAnswerStage,
  onNavigateStage,
  onSkipOrContinue,
}: GuidedStagePanelProps) {
  const [selectedOptionByStage, setSelectedOptionByStage] = useState<
    Record<string, string>
  >({});
  const [revealedPseudoCount, setRevealedPseudoCount] = useState(0);

  const selectedOptionId = selectedOptionByStage[stage.id] ?? null;
  const selectedOption = stage.question.options.find(
    (opt) => opt.id === selectedOptionId,
  );

  const stageIdx = lesson.stages.findIndex((s) => s.id === stage.id);
  const prevStage = stageIdx > 0 ? lesson.stages[stageIdx - 1] : null;
  const nextStage =
    stageIdx < lesson.stages.length - 1 ? lesson.stages[stageIdx + 1] : null;

  const isCompleted = stageStatus === 'completed';

  const handleSelectOption = (optionId: string, isCorrect: boolean) => {
    setSelectedOptionByStage((prev) => ({
      ...prev,
      [stage.id]: optionId,
    }));
    onAnswerStage(stage.id, isCorrect);
  };

  const hints = lesson.hintsByStage[stage.id] ?? [];
  const showPseudocode = stage.id === lesson.pseudocodeStageId;

  return (
    <Card className="border-[#645BE8]/35">
      <CardHeader className="border-b border-[#E3E7F2] bg-[#EEF0FF]/40">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <GraduationCap
              className="h-4 w-4 text-[#645BE8]"
              aria-hidden="true"
            />
            <Badge variant="indigo">
              Stage {stage.stageNumber} of {lesson.stages.length}
            </Badge>
          </div>
          {isCompleted && (
            <Badge variant="mint">
              <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
              Completed
            </Badge>
          )}
          {stageStatus === 'skipped' && (
            <Badge variant="amber">
              <FastForward className="h-3 w-3" aria-hidden="true" />
              Skipped
            </Badge>
          )}
          {stageStatus === 'skipped-after-attempt' && (
            <Badge variant="amber">
              <FastForward className="h-3 w-3" aria-hidden="true" />
              Skipped After Attempt
            </Badge>
          )}
          {stageStatus === 'attempted' && (
            <Badge variant="neutral">Attempted</Badge>
          )}
        </div>
        <CardTitle className="text-lg mt-1">{stage.title}</CardTitle>
        <p className="text-xs leading-relaxed text-[#555D7A]">{stage.goal}</p>
      </CardHeader>

      <CardContent className="space-y-4 pt-4">
        <p className="text-sm leading-relaxed text-[#20253B]">
          {stage.narrative}
        </p>

        {/* Interactive Guided Check Question */}
        <div className="rounded-2xl border border-[#E3E7F2] bg-[#F7F8FC] p-3.5 space-y-3">
          <div className="flex items-start gap-2">
            <HelpCircle
              className="h-4 w-4 shrink-0 text-[#645BE8] mt-0.5"
              aria-hidden="true"
            />
            <p className="text-xs font-bold leading-relaxed text-[#20253B]">
              {stage.question.prompt}
            </p>
          </div>

          <div className="space-y-2" role="radiogroup" aria-label={stage.title}>
            {stage.question.options.map((option) => {
              const isSelected = selectedOptionId === option.id;
              let optionClass =
                'border-[#DCE1F0] bg-white text-[#20253B] hover:border-[#645BE8] hover:bg-[#EEF0FF]/40';

              if (isSelected && option.isCorrect) {
                optionClass =
                  'border-[#16B89D] bg-[#E6F8F4] text-[#0A594B] font-semibold';
              } else if (isSelected && !option.isCorrect) {
                optionClass =
                  'border-[#F1B34C] bg-[#FEF6E6] text-[#9A630A]';
              }

              return (
                <button
                  key={option.id}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => handleSelectOption(option.id, option.isCorrect)}
                  className={`w-full rounded-xl border px-3 py-2.5 text-left text-xs leading-relaxed transition-colors cursor-pointer ${optionClass}`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>

          {selectedOption && (
            <div
              role="status"
              className={`rounded-xl border px-3 py-2.5 text-xs leading-relaxed ${
                selectedOption.isCorrect
                  ? 'border-[#16B89D]/60 bg-[#E6F8F4] text-[#0A594B]'
                  : 'border-[#F1B34C] bg-[#FEF6E6] text-[#9A630A]'
              }`}
            >
              <p className="font-bold">
                {selectedOption.isCorrect
                  ? 'Great reasoning!'
                  : 'Not quite — try another option (no penalty):'}
              </p>
              <p className="mt-0.5">{selectedOption.feedback}</p>
            </div>
          )}
        </div>

        {/* Progressive Pseudocode Reveal (hidden until requested) */}
        {showPseudocode && lesson.pseudocodeBlocks.length > 0 && (
          <div
            aria-label="Progressive pseudocode reveal"
            className="rounded-2xl border border-[#D8DCFF] bg-[#EEF0FF]/40 p-3.5 space-y-3"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#4F46D8]">
                <Code2 className="h-4 w-4" aria-hidden="true" />
                Progressive Pseudocode
              </div>
              <Badge variant="indigo">
                {revealedPseudoCount} / {lesson.pseudocodeBlocks.length} steps
              </Badge>
            </div>

            {revealedPseudoCount === 0 ? (
              <p className="text-xs leading-relaxed text-[#555D7A]">
                Pseudocode stays hidden until you ask for it. Try sketching the steps in your head first, then reveal one logical block at a time.
              </p>
            ) : (
              <div className="space-y-2.5">
                {lesson.pseudocodeBlocks
                  .slice(0, revealedPseudoCount)
                  .map((block) => (
                    <div
                      key={block.id}
                      className="rounded-xl border border-[#E3E7F2] bg-white p-3 space-y-1.5"
                    >
                      <p className="text-xs font-bold text-[#20253B]">
                        {block.title}
                      </p>
                      <p className="text-[11px] text-[#555D7A]">
                        {block.reason}
                      </p>
                      <pre className="overflow-x-auto rounded-lg bg-[#20253B] px-3 py-2 font-mono text-[11px] leading-relaxed text-[#EEF0FF]">
                        {block.lines.join('\n')}
                      </pre>
                    </div>
                  ))}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2">
              {revealedPseudoCount < lesson.pseudocodeBlocks.length && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() =>
                    setRevealedPseudoCount((count) =>
                      Math.min(count + 1, lesson.pseudocodeBlocks.length),
                    )
                  }
                >
                  <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                  Reveal Next Pseudocode Step
                </Button>
              )}
              {revealedPseudoCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setRevealedPseudoCount(0)}
                >
                  Hide Pseudocode
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Progressive 3-Level Hint Panel */}
        {hints.length > 0 && (
          <HintPanel
            hints={hints}
            revealedCount={revealedHintsCount}
            onRevealNextHint={onRevealNextHint}
          />
        )}

        {/* Stage Navigation Footer */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#E3E7F2] pt-3">
          {prevStage ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigateStage(prevStage.id)}
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
              Stage {prevStage.stageNumber}
            </Button>
          ) : (
            <span />
          )}

          {nextStage ? (
            <Button
              variant={isCompleted ? 'primary' : 'outline'}
              size="sm"
              onClick={() => onSkipOrContinue(stage.id, nextStage.id)}
            >
              {isCompleted
                ? `Continue to Stage ${nextStage.stageNumber}`
                : `Skip to Stage ${nextStage.stageNumber}`}
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Button>
          ) : (
            <Button
              variant={isCompleted ? 'mint' : 'outline'}
              size="sm"
              onClick={() => onSkipOrContinue(stage.id, 'summary')}
            >
              {isCompleted ? 'Finish & View Summary' : 'Skip & View Summary'}
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
