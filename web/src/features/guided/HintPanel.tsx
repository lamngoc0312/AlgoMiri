import { Lightbulb } from 'lucide-react';
import type { ProgressiveHint } from '../../domain/learning/hints';
import { Badge } from '../../components/ui/Badge';
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
      className="rounded-2xl border border-[#F8DFA8] bg-[#FEF6E6]/60 p-3.5 space-y-3"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs font-bold text-[#9A630A]">
          <Lightbulb className="h-4 w-4 text-[#C28219]" aria-hidden="true" />
          Need a Hint?
        </div>
        <Badge variant="amber">
          {revealedCount} / {hints.length} revealed
        </Badge>
      </div>

      {revealedCount > 0 ? (
        <ol className="space-y-2">
          {hints.slice(0, revealedCount).map((hint) => (
            <li
              key={hint.level}
              className="rounded-xl border border-[#F8DFA8] bg-white px-3 py-2.5 text-xs leading-relaxed text-[#20253B]"
            >
              <p className="font-bold text-[#9A630A]">{hint.label}</p>
              <p className="mt-1 text-[#555D7A]">{hint.text}</p>
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-xs text-[#555D7A]">
          Try thinking through the question first. Hints start with a gentle conceptual question before giving more specific guidance.
        </p>
      )}

      {hasMoreHints ? (
        <Button
          variant="outline"
          size="sm"
          onClick={onRevealNextHint}
          className="w-full border-[#F1B34C] text-[#9A630A] hover:bg-[#FEF6E6]"
        >
          <Lightbulb className="h-3.5 w-3.5" aria-hidden="true" />
          Reveal Hint {revealedCount + 1} of {hints.length}
        </Button>
      ) : (
        <p className="text-[11px] font-medium text-[#9A630A]">
          All 3 hint levels revealed for this stage.
        </p>
      )}
    </div>
  );
}
