import { Lightbulb } from 'lucide-react';
import type { ProgressiveHint } from '../../domain/learning/hints';
import { Button } from '../../components/ui/Button';

interface HintPanelProps {
  hints: ProgressiveHint[];
  revealedCount: number;
  onRevealNextHint: () => void;
}

export function HintPanel({
  hints,
  revealedCount,
  onRevealNextHint,
}: HintPanelProps) {
  const hasMoreHints = revealedCount < hints.length;

  return (
    <div
      aria-label="Progressive hints"
      className="rounded-xl border border-[#E2E8F0] bg-[#F7F9FC] p-3.5 space-y-3"
    >
      {revealedCount > 0 && (
        <ol className="space-y-2">
          {hints.slice(0, revealedCount).map((hint) => (
            <li
              key={hint.level}
              className="rounded-lg border-l-4 border-[#F2B84B] bg-white px-3.5 py-2.5 text-sm leading-relaxed text-[#202B3B]"
            >
              <p className="font-bold text-[#925E08]">{hint.label}</p>
              <p className="mt-0.5 text-[#526075]">{hint.text}</p>
            </li>
          ))}
        </ol>
      )}

      {hasMoreHints ? (
        <Button
          variant="outline"
          size="sm"
          onClick={onRevealNextHint}
          className="w-full justify-between border-[#E2E8F0] bg-white text-[#202B3B] hover:border-[#F2B84B] hover:bg-[#FEF9EE]"
        >
          <span className="inline-flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-[#C28219]" aria-hidden="true" />
            Reveal Hint {revealedCount + 1} of {hints.length}
          </span>
          <span className="text-xs font-medium text-[#526075]">
            {revealedCount} / {hints.length} revealed
          </span>
        </Button>
      ) : (
        <p className="text-xs font-medium text-[#925E08]">
          All {hints.length} hints revealed for this stage.
        </p>
      )}
    </div>
  );
}
