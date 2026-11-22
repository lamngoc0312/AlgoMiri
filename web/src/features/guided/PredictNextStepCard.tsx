import { useEffect, useState } from 'react';
import { ArrowRight, CheckCircle2, Sparkles } from 'lucide-react';
import type { PredictionPrompt } from '../../domain/learning/predictions';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

interface PredictNextStepCardProps {
  prompt: PredictionPrompt | null;
  onRecordAttempt: (isCorrect: boolean) => void;
  onRevealAndAdvance: () => void;
}

export function PredictNextStepCard({
  prompt,
  onRecordAttempt,
  onRevealAndAdvance,
}: PredictNextStepCardProps) {
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);

  // Clear local selection whenever the step/prompt changes
  useEffect(() => {
    setSelectedOptionId(null);
  }, [prompt?.id]);

  if (!prompt) {
    return (
      <div className="rounded-2xl border border-[#E3E7F2] bg-[#F7F8FC] p-3.5 text-xs text-[#555D7A]">
        Reached the final step of this trace. Reset or try a custom input to practice more predictions!
      </div>
    );
  }

  const selectedOption = prompt.options.find(
    (opt) => opt.id === selectedOptionId,
  );

  const handleChoose = (optionId: string, isCorrect: boolean) => {
    setSelectedOptionId(optionId);
    onRecordAttempt(isCorrect);
  };

  return (
    <section
      aria-label="Predict the next step"
      className="rounded-2xl border border-[#645BE8]/40 bg-[#EEF0FF]/45 p-4 space-y-3"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs font-bold text-[#4F46D8]">
          <Sparkles className="h-4 w-4" aria-hidden="true" />
          Predict the Next Step
        </div>
        <Badge variant="indigo">Active Recall</Badge>
      </div>

      <p className="text-sm font-semibold leading-snug text-[#20253B]">
        {prompt.question}
      </p>

      <div className="space-y-2" role="radiogroup" aria-label="Prediction choices">
        {prompt.options.map((option) => {
          const isSelected = selectedOptionId === option.id;
          let style =
            'border-[#DCE1F0] bg-white text-[#20253B] hover:border-[#645BE8] hover:bg-white';

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
              className={`w-full rounded-xl border px-3 py-2 text-left text-xs leading-relaxed transition-colors cursor-pointer ${style}`}
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
          <div className="flex items-center gap-1.5 font-bold">
            {selectedOption.isCorrect && (
              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            <span>
              {selectedOption.isCorrect
                ? 'Correct prediction!'
                : 'Not quite — try again without penalty, or reveal the verified next step.'}
            </span>
          </div>
          <p className="mt-1">{selectedOption.feedback}</p>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
        <Button
          variant={selectedOption?.isCorrect ? 'mint' : 'secondary'}
          size="sm"
          onClick={onRevealAndAdvance}
        >
          {selectedOption?.isCorrect
            ? 'Step to Verified State'
            : 'Reveal & Step Forward'}
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Button>
      </div>
    </section>
  );
}
