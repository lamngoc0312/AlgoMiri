import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertCircle, SlidersHorizontal } from 'lucide-react';
import type { ProblemPreset } from '../../domain/core/types';
import {
  formatSplitArrayNums,
  parseAndValidateSplitArrayInput,
  type SplitArrayInput,
} from '../../domain/traces/splitArrayValidation';
import { Button } from '../../components/ui/Button';

interface SplitArrayInputBarProps {
  currentInput: SplitArrayInput;
  presets: ProblemPreset<SplitArrayInput>[];
  onApplyInput: (input: SplitArrayInput) => void;
}

export function SplitArrayInputBar({
  currentInput,
  presets,
  onApplyInput,
}: SplitArrayInputBarProps) {
  const { t } = useTranslation();
  const [numsText, setNumsText] = useState(() =>
    formatSplitArrayNums(currentInput.nums),
  );
  const [kText, setKText] = useState(() => String(currentInput.k));
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const result = parseAndValidateSplitArrayInput(numsText, kText);
    if (!result.ok) {
      const key = `studioInputs.validation.${result.code}` as never;
      setError(String(result.values ? t(key, result.values as never) : t(key)));
      return;
    }
    setError(null);
    onApplyInput(result.value);
  };

  const handlePresetClick = (presetInput: SplitArrayInput) => {
    setNumsText(formatSplitArrayNums(presetInput.nums));
    setKText(String(presetInput.k));
    setError(null);
    onApplyInput(presetInput);
  };

  return (
    <div className="rounded-2xl border border-[#E2E8F0] bg-[#F7F9FC] p-3.5 sm:p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#202B3B]">
          <SlidersHorizontal
            className="h-3.5 w-3.5 text-[#2664C2]"
            aria-hidden="true"
          />
          {t('studioInputs.customInput')}
        </div>
        <span className="text-xs text-[#526075]">
          {t('studioInputs.splitHelp')}
        </span>
      </div>

      <form
        onSubmit={handleSubmit}
        className="grid gap-2.5 sm:grid-cols-[1fr_110px_auto] sm:items-end"
      >
        <div>
          <label
            htmlFor="split-nums-input"
            className="block text-xs font-semibold text-[#526075] mb-1"
          >
            {t('studioInputs.splitNums')}
          </label>
          <input
            id="split-nums-input"
            type="text"
            value={numsText}
            onChange={(e) => {
              setNumsText(e.target.value);
              if (error) setError(null);
            }}
            placeholder="e.g. 7, 2, 5, 10, 8"
            aria-invalid={error ? 'true' : 'false'}
            className="h-9 w-full rounded-xl border border-[#D7DCEB] bg-white px-3 font-mono text-xs text-[#202B3B] placeholder:text-[#8B93B0] focus:border-[#397BDB] focus:outline-none"
          />
        </div>

        <div>
          <label
            htmlFor="split-k-input"
            className="block text-xs font-semibold text-[#526075] mb-1"
          >
            {t('studioInputs.subarrays')}
          </label>
          <input
            id="split-k-input"
            type="text"
            inputMode="numeric"
            value={kText}
            onChange={(e) => {
              setKText(e.target.value);
              if (error) setError(null);
            }}
            placeholder="2"
            aria-invalid={error ? 'true' : 'false'}
            className="h-9 w-full rounded-xl border border-[#D7DCEB] bg-white px-3 font-mono text-xs text-[#202B3B] placeholder:text-[#8B93B0] focus:border-[#397BDB] focus:outline-none"
          />
        </div>

        <Button type="submit" variant="primary" size="sm" className="w-full sm:w-auto">
          {t('common.apply')}
        </Button>
      </form>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-[#F2B84B] bg-[#FEF7E7] px-3 py-2 text-xs text-[#925E08]"
        >
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
        <span className="text-xs font-semibold text-[#526075] mr-1">
          {t('common.presets')}
        </span>
        {presets.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => handlePresetClick(preset.input)}
            className="rounded-lg border border-[#DCE1F0] bg-white px-2.5 py-1 text-xs font-medium text-[#202B3B] transition-colors hover:border-[#397BDB] hover:bg-[#EAF2FD]/60 hover:text-[#2257A8] cursor-pointer"
          >
            {preset.label}
          </button>
        ))}
      </div>
    </div>
  );
}
