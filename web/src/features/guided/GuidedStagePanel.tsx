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
    <Card>
      <CardHeader className="border-b border-[#E2E8F0] pb-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <GraduationCap
              className="h-4 w-4 text-[#2664C2]"
              aria-hidden="true"
            />
            <Badge variant="indigo">
              Stage {stage.stageNumber} of {lesson.stages.length}
            </Badge>
          </div>
          {isCompleted && (
            <Badge variant="mint">
              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
              Completed
            </Badge>
          )}
          {stageStatus === 'skipped' && (
            <Badge variant="amber">
              <FastForward className="h-3.5 w-3.5" aria-hidden="true" />
              Skipped
            </Badge>
          )}
          {stageStatus === 'skipped-after-attempt' && (
            <Badge variant="amber">
              <FastForward className="h-3.5 w-3.5" aria-hidden="true" />
              Skipped After Attempt
            </Badge>
          )}
          {stageStatus === 'attempted' && (
            <Badge variant="neutral">Attempted</Badge>
          )}
        </div>
        <CardTitle className="text-xl mt-2">{stage.title}</CardTitle>
        <p className="text-sm leading-relaxed text-[#526075]">{stage.goal}</p>
      </CardHeader>

      <CardContent className="space-y-5 pt-5">
        <p className="text-base leading-relaxed text-[#202B3B]">
          {stage.narrative}
        </p>

        {/* Interactive Guided Check Question */}
        <div className="rounded-xl bg-[#F7F9FC] border border-[#E2E8F0] p-4 space-y-3.5">
          <div className="flex items-start gap-2.5">
            <HelpCircle
              className="h-5 w-5 shrink-0 text-[#2664C2] mt-0.5"
              aria-hidden="true"
            />
            <p className="text-sm font-bold leading-relaxed text-[#202B3B]">
              {stage.question.prompt}
            </p>
          </div>

          <div className="space-y-2" role="radiogroup" aria-label={stage.title}>
            {stage.question.options.map((option) => {
              const isSelected = selectedOptionId === option.id;
              let optionClass =
                'border-[#DCE1F0] bg-white text-[#202B3B] hover:border-[#397BDB] hover:bg-[#EAF2FD]/35';

              if (isSelected && option.isCorrect) {
                optionClass =
                  'border-[#15A897] bg-[#E6F7F5] text-[#0A594B] font-semibold';
              } else if (isSelected && !option.isCorrect) {
                optionClass =
                  'border-[#F2B84B] bg-[#FEF7E7] text-[#925E08]';
              }

              return (
                <button
                  key={option.id}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => handleSelectOption(option.id, option.isCorrect)}
                  className={`w-full rounded-xl border px-3.5 py-3 text-left text-sm leading-relaxed transition-colors cursor-pointer ${optionClass}`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>

          {selectedOption && (
            <div
              role="status"
              className={`rounded-xl border px-3.5 py-3 text-sm leading-relaxed ${
                selectedOption.isCorrect
                  ? 'border-[#15A897]/60 bg-[#E6F7F5] text-[#0A594B]'
                  : 'border-[#F2B84B] bg-[#FEF7E7] text-[#925E08]'
              }`}
            >
              <p className="font-bold">
                {selectedOption.isCorrect
                  ? 'Great reasoning!'
                  : 'Not quite — try another option (no penalty):'}
              </p>
              <p className="mt-1">{selectedOption.feedback}</p>
            </div>
          )}
        </div>

        {/* Progressive Pseudocode Reveal (hidden until requested) */}
        {showPseudocode && lesson.pseudocodeBlocks.length > 0 && (
          <div
            aria-label="Progressive pseudocode reveal"
            className="rounded-xl border border-[#C2DAFA] bg-[#F7F9FC] p-4 space-y-3"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sm font-bold text-[#2257A8]">
                <Code2 className="h-4 w-4" aria-hidden="true" />
                Progressive Pseudocode
              </div>
              <Badge variant="indigo">
                {revealedPseudoCount} / {lesson.pseudocodeBlocks.length} steps
              </Badge>
            </div>

            {revealedPseudoCount === 0 ? (
              <p className="text-sm leading-relaxed text-[#526075]">
                Pseudocode stays hidden until you ask for it. Sketch the steps in your head first, then reveal one logical block at a time.
              </p>
            ) : (
              <div className="space-y-3">
                {lesson.pseudocodeBlocks
                  .slice(0, revealedPseudoCount)
                  .map((block) => (
                    <div
                      key={block.id}
                      className="rounded-xl border border-[#E2E8F0] bg-white p-3.5 space-y-1.5"
                    >
                      <p className="text-sm font-bold text-[#202B3B]">
                        {block.title}
                      </p>
                      <p className="text-xs text-[#526075]">{block.reason}</p>
                      <pre className="overflow-x-auto rounded-lg bg-[#202B3B] px-3.5 py-2.5 font-mono text-xs leading-relaxed text-[#EAF2FD]">
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
                  <Eye className="h-4 w-4" aria-hidden="true" />
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
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#E2E8F0] pt-4">
          {prevStage ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigateStage(prevStage.id)}
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
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
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          ) : (
            <Button
              variant={isCompleted ? 'mint' : 'outline'}
              size="sm"
              onClick={() => onSkipOrContinue(stage.id, 'summary')}
            >
              {isCompleted ? 'Finish & View Summary' : 'Skip & View Summary'}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
