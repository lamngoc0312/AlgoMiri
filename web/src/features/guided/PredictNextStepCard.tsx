import { useEffect, useState } from 'react';
import { ArrowRight, CheckCircle2, FastForward, Sparkles } from 'lucide-react';
import type { PredictionPrompt } from '../../domain/learning/predictions';
import type { PredictionRecord } from '../../domain/learning/session';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

interface PredictNextStepCardProps {
  prompt: PredictionPrompt | null;
  record: PredictionRecord | undefined;
  isCheckpointPaused: boolean;
  onAnswer: (questionId: string, optionId: string, isCorrect: boolean) => void;
  onSkipAndReveal: (questionId: string) => void;
  onStepForward: () => void;
}

export function PredictNextStepCard({
  prompt,
  record,
  isCheckpointPaused,
  onAnswer,
  onSkipAndReveal,
  onStepForward,
}: PredictNextStepCardProps) {
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(
    record?.lastSelectedOptionId ?? null,
  );

  // Reset local selection whenever the trace/session/step-aware prompt ID changes
  useEffect(() => {
    setSelectedOptionId(record?.lastSelectedOptionId ?? null);
  }, [prompt?.id, record?.lastSelectedOptionId]);

  if (!prompt) {
    return (
      <div className="rounded-xl border border-[#E4E7F1] bg-[#F8F9FC] p-4 text-sm text-[#4E5672]">
        Reached the final step of this trace. Reset or try a custom input to practice more predictions!
      </div>
    );
  }

  const selectedOption = prompt.options.find(
    (opt) => opt.id === selectedOptionId,
  );
  const isSolved = Boolean(record?.solved);

  const handleChoose = (optionId: string, isCorrect: boolean) => {
    setSelectedOptionId(optionId);
    onAnswer(prompt.id, optionId, isCorrect);
  };

  return (
    <section
      aria-label="Predict the next step"
      className="rounded-xl border border-[#D8DCFF] border-l-4 border-l-[#645BE8] bg-[#F8F9FC] p-5 space-y-3.5"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-bold text-[#4F46D8]">
          <Sparkles className="h-4 w-4" aria-hidden="true" />
          Predict the Next Step
        </div>
        <div className="flex items-center gap-1.5">
          {isCheckpointPaused && !isSolved && (
            <Badge variant="amber">Checkpoint Paused</Badge>
          )}
          <Badge variant={isSolved ? 'mint' : 'indigo'}>
            {isSolved ? 'Verified' : 'Active Recall'}
          </Badge>
        </div>
      </div>

      <p className="text-base font-semibold leading-snug text-[#181B2E]">
        {prompt.question}
      </p>

      <div className="space-y-2" role="radiogroup" aria-label="Prediction choices">
        {prompt.options.map((option) => {
          const isSelected = selectedOptionId === option.id;
          let style =
            'border-[#DCE1F0] bg-white text-[#181B2E] hover:border-[#645BE8] hover:bg-[#EEF0FF]/35';

          if (isSelected && option.isCorrect) {
            style =
              'border-[#16B89D] bg-[#E6F8F4] text-[#0A594B] font-semibold';
          } else if (isSelected && !option.isCorrect) {
            style = 'border-[#F1B34C] bg-[#FEF6E6] text-[#9A630A]';
          }

          return (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => handleChoose(option.id, option.isCorrect)}
              className={`w-full rounded-xl border px-4 py-2.5 text-left text-sm leading-relaxed transition-colors cursor-pointer ${style}`}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      {selectedOption && (
        <div
          role="status"
          className={`rounded-xl border px-4 py-3 text-sm leading-relaxed ${
            selectedOption.isCorrect
              ? 'border-[#16B89D]/60 bg-[#E6F8F4] text-[#0A594B]'
              : 'border-[#F1B34C] bg-[#FEF6E6] text-[#9A630A]'
          }`}
        >
          <div className="flex items-center gap-1.5 font-bold">
            {selectedOption.isCorrect && (
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            )}
            <span>
              {selectedOption.isCorrect
                ? 'Correct prediction!'
                : 'Not quite — try again without penalty, or skip & reveal the verified next step.'}
            </span>
          </div>
          <p className="mt-1">{selectedOption.feedback}</p>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
        {isSolved ? (
          <Button variant="mint" size="sm" onClick={onStepForward}>
            Step to Verified State
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        ) : (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onSkipAndReveal(prompt.id)}
          >
            <FastForward className="h-4 w-4" aria-hidden="true" />
            Skip &amp; Reveal Next Step
          </Button>
        )}
      </div>
    </section>
  );
}
