import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(
    record?.lastSelectedOptionId ?? null,
  );

  // Reset local selection whenever the trace/session/step-aware prompt ID changes
  useEffect(() => {
    setSelectedOptionId(record?.lastSelectedOptionId ?? null);
  }, [prompt?.id, record?.lastSelectedOptionId]);

  if (!prompt) {
    return (
      <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-subtle)] p-4 text-sm text-[var(--text-secondary)]">
        {t('guided.predict.reachedEnd')}
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
      aria-label={t('guided.predict.sectionLabel')}
      className="rounded-xl border border-[var(--accent-blue-border)] border-l-4 border-l-[#397BDB] bg-[var(--surface-subtle)] p-5 space-y-3.5"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-bold text-[var(--accent-blue-text)]">
          <Sparkles className="h-4 w-4" aria-hidden="true" />
          {t('guided.predict.title')}
        </div>
        <div className="flex items-center gap-1.5">
          {isCheckpointPaused && !isSolved && (
            <Badge variant="amber">{t('guided.predict.checkpointPaused')}</Badge>
          )}
          <Badge variant={isSolved ? 'mint' : 'indigo'}>
            {isSolved
              ? t('guided.predict.verified')
              : t('guided.predict.activeRecall')}
          </Badge>
        </div>
      </div>

      <p className="text-base font-semibold leading-snug text-[var(--text-primary)]">
        {prompt.question}
      </p>

      <div
        className="space-y-2"
        role="radiogroup"
        aria-label={t('guided.predict.choicesLabel')}
      >
        {prompt.options.map((option) => {
          const isSelected = selectedOptionId === option.id;
          let style =
            'border-[var(--border-control)] bg-[var(--surface-card)] text-[var(--text-primary)] hover:border-[#397BDB] hover:bg-[var(--accent-blue-soft)]/35';

          if (isSelected && option.isCorrect) {
            style =
              'border-[#15A897] bg-[var(--accent-teal-soft)] text-[var(--accent-teal-deep)] font-semibold';
          } else if (isSelected && !option.isCorrect) {
            style =
              'border-[#F2B84B] bg-[var(--accent-amber-soft)] text-[var(--accent-amber-text)]';
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
              ? 'border-[#15A897]/60 bg-[var(--accent-teal-soft)] text-[var(--accent-teal-deep)]'
              : 'border-[#F2B84B] bg-[var(--accent-amber-soft)] text-[var(--accent-amber-text)]'
          }`}
        >
          <div className="flex items-center gap-1.5 font-bold">
            {selectedOption.isCorrect && (
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            )}
            <span>
              {selectedOption.isCorrect
                ? t('guided.predict.correct')
                : t('guided.predict.incorrect')}
            </span>
          </div>
          <p className="mt-1">{selectedOption.feedback}</p>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
        {isSolved ? (
          <Button variant="mint" size="sm" onClick={onStepForward}>
            {t('guided.predict.stepToVerified')}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        ) : (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onSkipAndReveal(prompt.id)}
          >
            <FastForward className="h-4 w-4" aria-hidden="true" />
            {t('guided.predict.skipAndReveal')}
          </Button>
        )}
      </div>
    </section>
  );
}
