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
      <CardHeader className="border-b border-[var(--border-subtle)] pb-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <GraduationCap
              className="h-4 w-4 text-[var(--accent-blue-link)]"
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
        <p className="text-sm leading-relaxed text-[var(--text-secondary)]">{stage.goal}</p>
      </CardHeader>

      <CardContent className="space-y-5 pt-5">
        <p className="text-base leading-relaxed text-[var(--text-primary)]">
          {stage.narrative}
        </p>

        {/* Interactive Guided Check Question */}
        <div className="rounded-xl bg-[var(--surface-subtle)] border border-[var(--border-subtle)] p-4 space-y-3.5">
          <div className="flex items-start gap-2.5">
            <HelpCircle
              className="h-5 w-5 shrink-0 text-[var(--accent-blue-link)] mt-0.5"
              aria-hidden="true"
            />
            <p className="text-sm font-bold leading-relaxed text-[var(--text-primary)]">
              {stage.question.prompt}
            </p>
          </div>

          <div className="space-y-2" role="radiogroup" aria-label={stage.title}>
            {stage.question.options.map((option) => {
              const isSelected = selectedOptionId === option.id;
              let optionClass =
                'border-[var(--border-control)] bg-[var(--surface-card)] text-[var(--text-primary)] hover:border-[#397BDB] hover:bg-[var(--accent-blue-soft)]/35';

              if (isSelected && option.isCorrect) {
                optionClass =
                  'border-[#15A897] bg-[var(--accent-teal-soft)] text-[var(--accent-teal-deep)] font-semibold';
              } else if (isSelected && !option.isCorrect) {
                optionClass =
                  'border-[#F2B84B] bg-[var(--accent-amber-soft)] text-[var(--accent-amber-text)]';
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
                  ? 'border-[#15A897]/60 bg-[var(--accent-teal-soft)] text-[var(--accent-teal-deep)]'
                  : 'border-[#F2B84B] bg-[var(--accent-amber-soft)] text-[var(--accent-amber-text)]'
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
            className="rounded-xl border border-[var(--accent-blue-border)] bg-[var(--surface-subtle)] p-4 space-y-3"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sm font-bold text-[var(--accent-blue-text)]">
                <Code2 className="h-4 w-4" aria-hidden="true" />
                Progressive Pseudocode
              </div>
              <Badge variant="indigo">
                {revealedPseudoCount} / {lesson.pseudocodeBlocks.length} steps
              </Badge>
            </div>

            {revealedPseudoCount === 0 ? (
              <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
                Pseudocode stays hidden until you ask for it. Sketch the steps in your head first, then reveal one logical block at a time.
              </p>
            ) : (
              <div className="space-y-3">
                {lesson.pseudocodeBlocks
                  .slice(0, revealedPseudoCount)
                  .map((block) => (
                    <div
                      key={block.id}
                      className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-3.5 space-y-1.5"
                    >
                      <p className="text-sm font-bold text-[var(--text-primary)]">
                        {block.title}
                      </p>
                      <p className="text-xs text-[var(--text-secondary)]">{block.reason}</p>
                      <pre className="overflow-x-auto rounded-lg bg-[var(--surface-code)] px-3.5 py-2.5 font-mono text-xs leading-relaxed text-[var(--text-code)]">
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
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--border-subtle)] pt-4">
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
