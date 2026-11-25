import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertCircle, SlidersHorizontal } from 'lucide-react';
import type { ProblemPreset } from '../../domain/core/types';
import {
  parseAndValidateBracketsInput,
  type ValidParenthesesInput,
} from '../../domain/traces/validParenthesesValidation';
import { Button } from '../../components/ui/Button';

interface StackInputBarProps {
  currentInput: ValidParenthesesInput;
  presets: ProblemPreset<ValidParenthesesInput>[];
  onApplyInput: (input: ValidParenthesesInput) => void;
}

export function StackInputBar({
  currentInput,
  presets,
  onApplyInput,
}: StackInputBarProps) {
  const { t } = useTranslation();
  const [text, setText] = useState(currentInput.brackets);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const result = parseAndValidateBracketsInput(text);
    if (!result.ok) {
      const key = `studioInputs.validation.${result.code}` as never;
      setError(String(t(key, result.values as never)));
      return;
    }
    setError(null);
    onApplyInput(result.value);
  };

  const handlePresetClick = (presetInput: ValidParenthesesInput) => {
    setText(presetInput.brackets);
    setError(null);
    onApplyInput(presetInput);
  };

  return (
    <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-subtle)] p-3.5 sm:p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">
          <SlidersHorizontal
            className="h-3.5 w-3.5 text-[var(--accent-blue-link)]"
            aria-hidden="true"
          />
          {t('studioInputs.customBrackets')}
        </div>
        <span className="text-xs text-[var(--text-secondary)]">
          {t('studioInputs.bracketsHelp')}
        </span>
      </div>

      <form
        onSubmit={handleSubmit}
        className="grid gap-2.5 sm:grid-cols-[1fr_auto] sm:items-end"
      >
        <div>
          <label
            htmlFor="brackets-input"
            className="block text-xs font-semibold text-[var(--text-secondary)] mb-1"
          >
            {t('studioInputs.brackets')}
          </label>
          <input
            id="brackets-input"
            type="text"
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              if (error) setError(null);
            }}
            placeholder={t('studioInputs.bracketsPlaceholder')}
            aria-invalid={error ? 'true' : 'false'}
            className="h-9 w-full rounded-xl border border-[var(--border-control)] bg-[var(--surface-card)] px-3 font-mono text-xs text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:border-[#397BDB] focus:outline-none"
          />
        </div>

        <Button type="submit" variant="primary" size="sm" className="w-full sm:w-auto">
          {t('common.apply')}
        </Button>
      </form>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-[#F2B84B] bg-[var(--accent-amber-soft)] px-3 py-2 text-xs text-[var(--accent-amber-text)]"
        >
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
        <span className="text-xs font-semibold text-[var(--text-secondary)] mr-1">
          {t('common.presets')}
        </span>
        {presets.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => handlePresetClick(preset.input)}
            className="rounded-lg border border-[var(--border-control)] bg-[var(--surface-card)] px-2.5 py-1 text-xs font-medium text-[var(--text-primary)] transition-colors hover:border-[#397BDB] hover:bg-[var(--accent-blue-soft)]/60 hover:text-[var(--accent-blue-text)] cursor-pointer"
          >
            {preset.label}
          </button>
        ))}
      </div>
    </div>
  );
}
