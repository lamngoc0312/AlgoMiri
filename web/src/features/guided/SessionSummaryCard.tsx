import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Award,
  CheckCircle2,
  Compass,
  Info,
  Lightbulb,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import type { TwoSumStrategyId } from '../../domain/traces/types';
import {
  TWO_SUM_GUIDED_STAGES,
  type GuidedStageId,
} from '../../domain/learning/twoSumLesson';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';

interface SessionSummaryCardProps {
  strategiesExplored: Set<TwoSumStrategyId>;
  completedStages: Set<GuidedStageId>;
  predictionAttempts: number;
  predictionCorrect: number;
  hintsUsed: number;
  onSwitchToExplore: () => void;
  onRestartLesson: () => void;
}

const STRATEGY_LABELS: Record<TwoSumStrategyId, string> = {
  'brute-force': 'Brute Force Pair Check · O(n²) time / O(1) space',
  'hash-map': 'Hash Map Complement Lookup · O(n) time / O(n) space',
};

export function SessionSummaryCard({
  strategiesExplored,
  completedStages,
  predictionAttempts,
  predictionCorrect,
  hintsUsed,
  onSwitchToExplore,
  onRestartLesson,
}: SessionSummaryCardProps) {
  const conceptsLearned = TWO_SUM_GUIDED_STAGES.filter((s) =>
    completedStages.has(s.id),
  ).map((s) => s.conceptLearned);

  return (
    <Card className="border-[#16B89D]/50">
      <CardHeader className="border-b border-[#E3E7F2] bg-[#E6F8F4]/50">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-[#16B89D]" aria-hidden="true" />
            <CardTitle className="text-lg">Local Session Summary</CardTitle>
          </div>
          <Badge variant="demo">Local Session Only</Badge>
        </div>
        <p className="text-xs leading-relaxed text-[#555D7A]">
          Here is what you explored during this browser session for Two Sum.
        </p>
      </CardHeader>

      <CardContent className="space-y-5 pt-5">
        {/* Metrics Row */}
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-[#E3E7F2] bg-[#F7F8FC] p-3.5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#555D7A]">
              Strategies Explored
            </p>
            <p className="mt-1 font-mono text-xl font-extrabold text-[#20253B]">
              {strategiesExplored.size} / 2
            </p>
          </div>

          <div className="rounded-xl border border-[#E3E7F2] bg-[#F7F8FC] p-3.5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#555D7A]">
              Prediction Attempts
            </p>
            <p className="mt-1 font-mono text-xl font-extrabold text-[#20253B]">
              {predictionAttempts}
              {predictionAttempts > 0 && (
                <span className="ml-1.5 text-xs font-sans font-semibold text-[#0D7D6A]">
                  ({predictionCorrect} correct)
                </span>
              )}
            </p>
          </div>

          <div className="rounded-xl border border-[#E3E7F2] bg-[#F7F8FC] p-3.5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#555D7A]">
              Hints Used
            </p>
            <p className="mt-1 flex items-center gap-1.5 font-mono text-xl font-extrabold text-[#20253B]">
              <Lightbulb
                className="h-4 w-4 text-[#F1B34C]"
                aria-hidden="true"
              />
              {hintsUsed}
            </p>
          </div>
        </div>

        {/* Strategies Explored List */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#555D7A]">
            Strategies Explored
          </h3>
          <ul className="mt-2 space-y-1.5">
            {Array.from(strategiesExplored).map((strategyId) => (
              <li
                key={strategyId}
                className="flex items-center gap-2 text-xs font-medium text-[#20253B]"
              >
                <CheckCircle2
                  className="h-4 w-4 shrink-0 text-[#16B89D]"
                  aria-hidden="true"
                />
                {STRATEGY_LABELS[strategyId]}
              </li>
            ))}
          </ul>
        </div>

        {/* Concepts Covered */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#555D7A]">
            Concepts Covered ({conceptsLearned.length} / {TWO_SUM_GUIDED_STAGES.length})
          </h3>
          {conceptsLearned.length > 0 ? (
            <ul className="mt-2 flex flex-wrap gap-2">
              {conceptsLearned.map((concept) => (
                <li key={concept}>
                  <Badge variant="indigo">{concept}</Badge>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-1.5 text-xs text-[#555D7A]">
              Complete any guided stage check to record concepts covered in this session.
            </p>
          )}
        </div>

        {/* Suggested Next Learning Activities */}
        <div className="rounded-2xl border border-[#E3E7F2] bg-[#F7F8FC] p-4 space-y-2.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#20253B]">
            <Sparkles className="h-4 w-4 text-[#645BE8]" aria-hidden="true" />
            Suggested Next Learning Activity
          </div>
          <p className="text-xs leading-relaxed text-[#555D7A]">
            Switch to <strong>Free Exploration</strong> and test tricky edge cases like{' '}
            <code className="font-mono font-semibold text-[#20253B]">[3, 3], target = 6</code>,{' '}
            <code className="font-mono font-semibold text-[#20253B]">[-3, 4, 3, 90], target = 0</code>, or{' '}
            <code className="font-mono font-semibold text-[#20253B]">[1, 2, 3], target = 100</code>{' '}
            with Predict Mode enabled — then try implementing Two Sum in your own editor without peeking!
          </p>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Button variant="primary" size="sm" onClick={onSwitchToExplore}>
              Try Edge Cases in Free Exploration
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Button>
            <Button variant="outline" size="sm" onClick={onRestartLesson}>
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              Restart Guided Lesson
            </Button>
            <Link
              to="/roadmap"
              className="inline-flex h-9 items-center gap-1.5 rounded-xl px-3 text-xs font-semibold text-[#4F46D8] hover:bg-[#EEF0FF]"
            >
              <Compass className="h-3.5 w-3.5" aria-hidden="true" />
              View Roadmap Preview
            </Link>
          </div>
        </div>

        {/* Honest Mastery Disclaimer */}
        <div
          role="note"
          className="flex items-start gap-2 rounded-xl border border-[#F1B34C]/60 bg-[#FEF6E6]/70 px-3.5 py-3 text-xs leading-relaxed text-[#20253B]"
        >
          <Info
            className="h-4 w-4 shrink-0 text-[#9A630A] mt-0.5"
            aria-hidden="true"
          />
          <p>
            <strong>Honest scope note:</strong> This summary reflects your local
            browser session only and is not saved to an account. Completing a
            visual walkthrough is a great start, but does not measure long-term
            skill mastery yet.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
