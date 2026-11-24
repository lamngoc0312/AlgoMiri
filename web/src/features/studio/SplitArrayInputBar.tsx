import { useState, type FormEvent } from 'react';
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
  const [numsText, setNumsText] = useState(() =>
    formatSplitArrayNums(currentInput.nums),
  );
  const [kText, setKText] = useState(() => String(currentInput.k));
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const result = parseAndValidateSplitArrayInput(numsText, kText);
    if (!result.ok) {
      setError(result.error);
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
          Nonnegative integers (&ge; 0) · 1 &le; k &le; length (max 10)
        </span>
      </div>

      <form
        onSubmit={handleSubmit}
        className="grid gap-2.5 sm:grid-cols-[1fr_110px_auto] sm:items-end"
      >
        <div>
          <label
            htmlFor="split-nums-input"
            className="block text-xs font-semibold text-[#555D7A] mb-1"
          >
            Array (nums &ge; 0)
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
            className="h-9 w-full rounded-xl border border-[#D7DCEB] bg-white px-3 font-mono text-xs text-[#20253B] placeholder:text-[#8B93B0] focus:border-[#645BE8] focus:outline-none"
          />
        </div>

        <div>
          <label
            htmlFor="split-k-input"
            className="block text-xs font-semibold text-[#555D7A] mb-1"
          >
            Subarrays (k)
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
        {presets.map((preset) => (
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
