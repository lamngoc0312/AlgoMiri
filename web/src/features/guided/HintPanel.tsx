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
      className="rounded-xl border border-[#F2D9A2] border-l-4 border-l-[#F1B34C] bg-[#FEF9EE] p-4 space-y-3"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-bold text-[#9A630A]">
          <Lightbulb className="h-4 w-4 text-[#C28219]" aria-hidden="true" />
          Need a Hint?
        </div>
        <Badge variant="amber">
          {revealedCount} / {hints.length} revealed
        </Badge>
      </div>

      {revealedCount > 0 ? (
        <ol className="space-y-2.5">
          {hints.slice(0, revealedCount).map((hint) => (
            <li
              key={hint.level}
              className="rounded-lg border border-[#F2D9A2] bg-white px-3.5 py-2.5 text-sm leading-relaxed text-[#181B2E]"
            >
              <p className="font-bold text-[#9A630A]">{hint.label}</p>
              <p className="mt-1 text-[#4E5672]">{hint.text}</p>
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-sm leading-relaxed text-[#4E5672]">
          Try thinking through the question first. Hints start gently before giving specific guidance.
        </p>
      )}

      {hasMoreHints ? (
        <Button
          variant="outline"
          size="sm"
          onClick={onRevealNextHint}
          className="w-full border-[#F1B34C] text-[#9A630A] hover:bg-[#FEF6E6]"
        >
          <Lightbulb className="h-4 w-4" aria-hidden="true" />
          Reveal Hint {revealedCount + 1} of {hints.length}
        </Button>
      ) : (
        <p className="text-xs font-medium text-[#9A630A]">
          All 3 hint levels revealed for this stage.
        </p>
      )}
    </div>
  );
}
