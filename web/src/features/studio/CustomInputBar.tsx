import { useState, type FormEvent } from 'react';
import { AlertCircle, SlidersHorizontal } from 'lucide-react';
import type { TwoSumInput } from '../../domain/traces/types';
import { TWO_SUM_PRESETS } from '../../domain/traces/twoSumEngine';
import {
  formatNumsInput,
  parseAndValidateTwoSumInput,
} from '../../domain/traces/validation';
import { Button } from '../../components/ui/Button';

interface CustomInputBarProps {
  currentInput: TwoSumInput;
  onApplyInput: (input: TwoSumInput) => void;
}

export function CustomInputBar({
  currentInput,
  onApplyInput,
}: CustomInputBarProps) {
  const [numsText, setNumsText] = useState(() =>
    formatNumsInput(currentInput.nums),
  );
  const [targetText, setTargetText] = useState(() =>
    String(currentInput.target),
  );
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const result = parseAndValidateTwoSumInput(numsText, targetText);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setError(null);
    onApplyInput(result.value);
  };

  const handlePresetClick = (presetInput: TwoSumInput) => {
    setNumsText(formatNumsInput(presetInput.nums));
    setTargetText(String(presetInput.target));
    setError(null);
    onApplyInput(presetInput);
  };

  return (
    <div className="rounded-2xl border border-[#E3E7F2] bg-[#F7F8FC] p-3.5 sm:p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#20253B]">
          <SlidersHorizontal
            className="h-3.5 w-3.5 text-[#645BE8]"
            aria-hidden="true"
          />
          Custom Input
        </div>
        <span className="text-[11px] text-[#555D7A]">
          Up to 12 integers · negatives &amp; duplicates supported
        </span>
      </div>

      <form
        onSubmit={handleSubmit}
        className="grid gap-2.5 sm:grid-cols-[1fr_110px_auto] sm:items-end"
      >
        <div>
          <label
            htmlFor="nums-input"
            className="block text-xs font-semibold text-[#555D7A] mb-1"
          >
            Array (nums)
          </label>
          <input
            id="nums-input"
            type="text"
            value={numsText}
            onChange={(e) => {
              setNumsText(e.target.value);
              if (error) setError(null);
            }}
            placeholder="e.g. 2, 7, 11, 15 (or leave blank for [])"
            aria-invalid={error ? 'true' : 'false'}
            className="h-9 w-full rounded-xl border border-[#D7DCEB] bg-white px-3 font-mono text-xs text-[#20253B] placeholder:text-[#8B93B0] focus:border-[#645BE8] focus:outline-none"
          />
        </div>

        <div>
          <label
            htmlFor="target-input"
            className="block text-xs font-semibold text-[#555D7A] mb-1"
          >
            Target
          </label>
          <input
            id="target-input"
            type="text"
            inputMode="numeric"
            value={targetText}
            onChange={(e) => {
              setTargetText(e.target.value);
              if (error) setError(null);
            }}
            placeholder="9"
            aria-invalid={error ? 'true' : 'false'}
            className="h-9 w-full rounded-xl border border-[#D7DCEB] bg-white px-3 font-mono text-xs text-[#20253B] placeholder:text-[#8B93B0] focus:border-[#645BE8] focus:outline-none"
          />
        </div>

        <Button type="submit" variant="primary" size="sm" className="w-full sm:w-auto">
          Apply
        </Button>
      </form>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-[#F1B34C] bg-[#FEF6E6] px-3 py-2 text-xs text-[#9A630A]"
        >
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
        <span className="text-[11px] font-semibold text-[#555D7A] mr-1">
          Presets:
        </span>
        {TWO_SUM_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => handlePresetClick(preset.input)}
            className="rounded-lg border border-[#DCE1F0] bg-white px-2.5 py-1 text-[11px] font-medium text-[#20253B] transition-colors hover:border-[#645BE8] hover:bg-[#EEF0FF]/60 hover:text-[#4F46D8] cursor-pointer"
          >
            {preset.label}
          </button>
        ))}
      </div>
    </div>
  );
}
