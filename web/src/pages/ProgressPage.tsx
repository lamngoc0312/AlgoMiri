import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  Award,
  BookOpen,
  CheckCircle2,
  Clock,
  Compass,
  HardDrive,
  Info,
  Lightbulb,
  Sparkles,
  Target,
  Trash2,
  TrendingUp,
} from 'lucide-react';
import {
  aggregateLearningProgress,
  formatOutcomeLabel,
} from '../domain/learning/analytics';
import type {
  LearningSession,
  SkillProgressLabel,
} from '../domain/learning/types';
import {
  defaultLearningRepository,
  type LearningRepository,
} from '../services/learningRepository';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';

interface ProgressPageProps {
  repository?: LearningRepository;
}

function badgeVariantForSkillLabel(
  label: SkillProgressLabel,
): 'mint' | 'indigo' | 'amber' | 'neutral' {
  switch (label) {
    case 'Independently Demonstrated':
    case 'Strong Guided Recall (First-Try)':
      return 'mint';
    case 'Guided Progress (With Assistance)':
      return 'indigo';
    case 'Practicing (Attempted)':
      return 'amber';
    default:
      return 'neutral';
  }
}

function barColorForSkillLabel(label: SkillProgressLabel): string {
  switch (label) {
    case 'Independently Demonstrated':
    case 'Strong Guided Recall (First-Try)':
      return 'bg-[#15A897]';
    case 'Guided Progress (With Assistance)':
      return 'bg-[#397BDB]';
    case 'Practicing (Attempted)':
      return 'bg-[#F2B84B]';
    case 'Introduced (Viewed Only)':
      return 'bg-[#A6B0CF]';
    default:
      return 'bg-[#DCE1F0]';
  }
}

function formatSessionTimestamp(iso: string): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return 'Saved locally';
  return parsed.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function ProgressPage({
  repository = defaultLearningRepository,
}: ProgressPageProps) {
  const [loadState, setLoadState] = useState(() => repository.loadSessions());
  const [confirmingClear, setConfirmingClear] = useState(false);
  const [clearFeedback, setClearFeedback] = useState<string | null>(null);

  const sessions: LearningSession[] = loadState.sessions;
  const summary = useMemo(
    () => aggregateLearningProgress(sessions),
    [sessions],
  );

  const handleConfirmClear = () => {
    const res = repository.clearHistory();
    setConfirmingClear(false);
    if (res.cleared) {
      setLoadState({
        sessions: [],
        recoveredFromError: false,
        migratedFromVersion: null,
        warningMessage: null,
      });
      setClearFeedback('Local learning history cleared from this browser.');
    } else {
      setClearFeedback(
        res.warningMessage ?? 'Could not clear local browser history.',
      );
    }
  };

  // Strictly mutually exclusive prediction outcome buckets (zero double-counting)
  const totalPredictionEvents = summary.totalPredictionQuestions;

  const firstTryBarPct =
    totalPredictionEvents > 0
      ? Math.round(
          (summary.totalPredictionsFirstTry / totalPredictionEvents) * 100,
        )
      : 0;
  const retryBarPct =
    totalPredictionEvents > 0
      ? Math.round(
          (summary.totalPredictionsSolvedAfterRetry / totalPredictionEvents) *
            100,
        )
      : 0;
  const skippedAfterAttemptBarPct =
    totalPredictionEvents > 0
      ? Math.round(
          (summary.totalPredictionsSkippedAfterAttempt /
            totalPredictionEvents) *
            100,
        )
      : 0;
  const skippedWithoutAttemptBarPct =
    totalPredictionEvents > 0
      ? Math.round(
          (summary.totalPredictionsSkippedWithoutAttempt /
            totalPredictionEvents) *
            100,
        )
      : 0;
  const unresolvedBarPct =
    totalPredictionEvents > 0
      ? Math.max(
          0,
          100 -
            firstTryBarPct -
            retryBarPct -
            skippedAfterAttemptBarPct -
            skippedWithoutAttemptBarPct,
        )
      : 0;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <TrendingUp className="h-5 w-5 text-[#2664C2]" aria-hidden="true" />
            <h1 className="text-2xl font-extrabold tracking-tight text-[#202B3B] sm:text-3xl">
              Learning Progress
            </h1>
            <Badge variant="indigo">
              <HardDrive className="h-3 w-3" aria-hidden="true" />
              Local Browser History
            </Badge>
          </div>
          <p className="text-sm text-[#526075]">
            Evidence-based activity recorded from your Guided Learning sessions and deterministic trace predictions.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/problems"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#2B6CC9] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#2257A8]"
          >
            Practice a Problem
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
          {sessions.length > 0 && !confirmingClear && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setConfirmingClear(true);
                setClearFeedback(null);
              }}
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              Clear Local History
            </Button>
          )}
        </div>
      </div>

      {/* Confirm Clear History Inline Guard */}
      {confirmingClear && (
        <div
          role="alertdialog"
          aria-label="Confirm clearing local learning history"
          className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 border-[#E05252]/60 bg-[#FDF2F2] px-4 py-3.5 text-xs text-[#202B3B]"
        >
          <div className="space-y-0.5">
            <p className="font-bold text-[#9B2C2C]">
              Clear all saved learning sessions from this browser?
            </p>
            <p className="text-[#526075]">
              This permanently removes your {sessions.length} locally saved session(s) and resets all skill evidence counts.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmingClear(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              className="bg-[#C53030] hover:bg-[#9B2C2C]"
              onClick={handleConfirmClear}
            >
              Confirm Clear History
            </Button>
          </div>
        </div>
      )}

      {/* Honest Local-Only Storage Notice */}
      <div
        role="note"
        className="flex items-start gap-2.5 rounded-2xl border border-[#C2DAFA] bg-[#EAF2FD]/55 px-4 py-3 text-xs leading-relaxed text-[#202B3B]"
      >
        <Info
          className="h-4 w-4 shrink-0 text-[#2257A8] mt-0.5"
          aria-hidden="true"
        />
        <p>
          <strong>Saved only in this browser:</strong> Learning history is stored
          locally on this device and is <strong>not synchronized across devices</strong>{' '}
          (no account or database is connected yet). Viewing a visualization or
          chatting with the AI Tutor never counts as verified mastery, and private
          pasted problem text or API keys are never stored.
        </p>
      </div>

      {loadState.warningMessage && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-[#F2B84B] bg-[#FEF7E7] px-4 py-3 text-xs text-[#925E08]"
        >
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
          <span>{loadState.warningMessage}</span>
        </div>
      )}

      {clearFeedback && (
        <div
          role="status"
          className="rounded-xl border border-[#15A897]/50 bg-[#E6F7F5]/70 px-4 py-3 text-xs font-medium text-[#0D7A6E]"
        >
          {clearFeedback}
        </div>
      )}

      {/* Honest Empty State for First-Time Learners */}
      {sessions.length === 0 ? (
        <div className="space-y-6">
          <Card className="border-dashed border-2 border-[#D7DCEB]">
            <CardContent className="p-8 text-center space-y-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EAF2FD] text-[#2664C2]">
                <BookOpen className="h-6 w-6" aria-hidden="true" />
              </div>
              <div className="space-y-1.5 max-w-lg mx-auto">
                <h2 className="text-lg font-extrabold text-[#202B3B]">
                  No learning sessions recorded yet
                </h2>
                <p className="text-sm leading-relaxed text-[#526075]">
                  Complete or finalize a Guided Learning session in any verified Studio
                  to record real prediction accuracy, stage checks, hints used, and
                  skill evidence here. We never show fabricated stats or fake streaks.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
                <Link
                  to="/studio/two-sum"
                  className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-[#2B6CC9] px-4 text-sm font-semibold text-white hover:bg-[#2257A8]"
                >
                  Start Two Sum
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <Link
                  to="/studio/valid-parentheses"
                  className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-[#D7DCEB] bg-white px-4 text-sm font-semibold text-[#202B3B] hover:bg-[#F7F9FC]"
                >
                  Start Valid Parentheses
                </Link>
                <Link
                  to="/studio/split-array-largest-sum"
                  className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-[#D7DCEB] bg-white px-4 text-sm font-semibold text-[#202B3B] hover:bg-[#F7F9FC]"
                >
                  Start Split Array Largest Sum
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Starter deterministic suggestions */}
          <SuggestionsCard suggestions={summary.suggestions} />
        </div>
      ) : (
        <>
          {/* KPI Overview Grid */}
          <section aria-label="Progress summary statistics">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#526075]">
                    Learning Sessions
                  </span>
                  <Clock className="h-4 w-4 text-[#2664C2]" aria-hidden="true" />
                </div>
                <p
                  data-testid="progress-total-sessions"
                  className="mt-2 font-mono text-2xl font-extrabold text-[#202B3B]"
                >
                  {summary.totalSessions}
                </p>
                <p className="mt-0.5 text-[11px] text-[#526075]">
                  Saved in this browser
                </p>
              </Card>

              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#526075]">
                    Problems Practiced
                  </span>
                  <BookOpen className="h-4 w-4 text-[#0D7A6E]" aria-hidden="true" />
                </div>
                <p
                  data-testid="progress-problems-practiced"
                  className="mt-2 font-mono text-2xl font-extrabold text-[#202B3B]"
                >
                  {summary.problemsPracticedCount} / {summary.totalAvailableProblems}
                </p>
                <p className="mt-0.5 text-[11px] text-[#526075]">
                  Verified visual studios
                </p>
              </Card>

              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#526075]">
                    Strategies Explored
                  </span>
                  <Award className="h-4 w-4 text-[#2664C2]" aria-hidden="true" />
                </div>
                <p
                  data-testid="progress-strategies-explored"
                  className="mt-2 font-mono text-2xl font-extrabold text-[#202B3B]"
                >
                  {summary.uniqueStrategiesExploredCount} /{' '}
                  {summary.totalAvailableStrategies}
                </p>
                <p className="mt-0.5 text-[11px] text-[#526075]">
                  Across all verified studios
                </p>
              </Card>

              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#526075]">
                    Prediction Accuracy
                  </span>
                  <Target className="h-4 w-4 text-[#0D7A6E]" aria-hidden="true" />
                </div>
                <p
                  data-testid="progress-prediction-accuracy"
                  className="mt-2 font-mono text-2xl font-extrabold text-[#202B3B]"
                >
                  {summary.firstTryAccuracyPercent !== null
                    ? `${summary.firstTryAccuracyPercent}%`
                    : '—'}
                </p>
                <p className="mt-0.5 text-[11px] text-[#526075]">
                  {summary.totalPredictionsAttempted > 0
                    ? `${summary.totalPredictionsFirstTry}/${summary.totalPredictionsAttempted} first-try`
                    : 'No predictions attempted yet'}
                </p>
              </Card>

              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#526075]">
                    Hints Used
                  </span>
                  <Lightbulb className="h-4 w-4 text-[#F2B84B]" aria-hidden="true" />
                </div>
                <p
                  data-testid="progress-hints-used"
                  className="mt-2 font-mono text-2xl font-extrabold text-[#202B3B]"
                >
                  {summary.totalHintsUsed}
                </p>
                <p className="mt-0.5 text-[11px] text-[#526075]">
                  {summary.skillsPracticedCount} of {summary.skillSummaries.length}{' '}
                  skills practiced
                </p>
              </Card>
            </div>
          </section>

          {/* Prediction Outcomes Breakdown Chart */}
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle>Trace Prediction Breakdown</CardTitle>
                <Badge variant="neutral">
                  {summary.totalPredictionQuestions} total ·{' '}
                  {summary.totalPredictionsAttempted} attempted ·{' '}
                  {summary.totalPredictionsSkipped} skipped
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {totalPredictionEvents > 0 ? (
                <>
                  <div
                    role="img"
                    aria-label={`Prediction outcomes across ${totalPredictionEvents} question(s): ${summary.totalPredictionsFirstTry} first-try correct, ${summary.totalPredictionsSolvedAfterRetry} solved after retry, ${summary.totalPredictionsSkippedAfterAttempt} skipped after attempt, ${summary.totalPredictionsSkippedWithoutAttempt} skipped without attempt, ${summary.totalPredictionsUnresolved} unresolved`}
                    className="flex h-4 w-full overflow-hidden rounded-full bg-[#EAF2FD]"
                  >
                    {firstTryBarPct > 0 && (
                      <div
                        className="h-full bg-[#15A897] transition-all"
                        style={{ width: `${firstTryBarPct}%` }}
                        title={`First-try correct: ${summary.totalPredictionsFirstTry}`}
                      />
                    )}
                    {retryBarPct > 0 && (
                      <div
                        className="h-full bg-[#397BDB] transition-all"
                        style={{ width: `${retryBarPct}%` }}
                        title={`Solved after retry/reveal: ${summary.totalPredictionsSolvedAfterRetry}`}
                      />
                    )}
                    {skippedAfterAttemptBarPct > 0 && (
                      <div
                        className="h-full bg-[#E08A2E] transition-all"
                        style={{ width: `${skippedAfterAttemptBarPct}%` }}
                        title={`Skipped after wrong attempt: ${summary.totalPredictionsSkippedAfterAttempt}`}
                      />
                    )}
                    {skippedWithoutAttemptBarPct > 0 && (
                      <div
                        className="h-full bg-[#F2B84B] transition-all"
                        style={{ width: `${skippedWithoutAttemptBarPct}%` }}
                        title={`Skipped without attempting: ${summary.totalPredictionsSkippedWithoutAttempt}`}
                      />
                    )}
                    {summary.totalPredictionsUnresolved > 0 &&
                      unresolvedBarPct > 0 && (
                        <div
                          className="h-full bg-[#9AA2BE] transition-all"
                          style={{ width: `${unresolvedBarPct}%` }}
                          title={`Unresolved attempt: ${summary.totalPredictionsUnresolved}`}
                        />
                      )}
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-[#526075]">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-[#15A897]" />
                      First-try correct:{' '}
                      <strong className="text-[#202B3B]">
                        {summary.totalPredictionsFirstTry}
                      </strong>
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-[#397BDB]" />
                      Solved after retry/reveal:{' '}
                      <strong className="text-[#202B3B]">
                        {summary.totalPredictionsSolvedAfterRetry}
                      </strong>
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-[#E08A2E]" />
                      Skipped after attempt:{' '}
                      <strong className="text-[#202B3B]">
                        {summary.totalPredictionsSkippedAfterAttempt}
                      </strong>
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-[#F2B84B]" />
                      Skipped (unattempted):{' '}
                      <strong className="text-[#202B3B]">
                        {summary.totalPredictionsSkippedWithoutAttempt}
                      </strong>
                    </span>
                    {summary.totalPredictionsUnresolved > 0 && (
                      <span className="inline-flex items-center gap-1.5">
                        <span className="h-2.5 w-2.5 rounded-full bg-[#9AA2BE]" />
                        Unresolved:{' '}
                        <strong className="text-[#202B3B]">
                          {summary.totalPredictionsUnresolved}
                        </strong>
                      </span>
                    )}
                    {summary.overallSolvedPercent !== null && (
                      <span className="ml-auto font-mono text-[11px] font-semibold text-[#2257A8]">
                        Eventually solved: {summary.overallSolvedPercent}%
                      </span>
                    )}
                  </div>
                </>
              ) : (
                <p className="text-xs text-[#526075]">
                  No trace predictions recorded yet. Keep Predict Mode enabled during Guided Learning to test your intuition step by step.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Areas Needing More Practice + Deterministic Next Suggestions */}
          <div className="grid gap-5 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <CardTitle>Areas Needing More Practice</CardTitle>
                  <Badge
                    variant={
                      summary.areasNeedingPractice.length > 0 ? 'amber' : 'mint'
                    }
                  >
                    {summary.areasNeedingPractice.length > 0
                      ? `${summary.areasNeedingPractice.length} flagged`
                      : 'Looking steady'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {summary.areasNeedingPractice.length > 0 ? (
                  <ul className="space-y-3">
                    {summary.areasNeedingPractice.map((item) => (
                      <li
                        key={item.skill.id}
                        className="rounded-xl border border-[#F2B84B]/60 bg-[#FEF7E7]/60 p-3.5 space-y-1.5"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-sm font-bold text-[#202B3B]">
                            {item.skill.name}
                          </span>
                          <Badge variant="amber">{item.label}</Badge>
                        </div>
                        <p className="text-xs text-[#526075]">
                          {item.evidenceNote}
                        </p>
                        <Link
                          to={item.skill.recommendedStudioPath}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-[#925E08] hover:underline"
                        >
                          Practice in Studio
                          <ArrowRight className="h-3 w-3" aria-hidden="true" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs leading-relaxed text-[#526075]">
                    No specific skills are currently flagged for mistakes or heavy hint reliance. Continue exploring unpracticed skills or trying harder edge cases in Free Exploration.
                  </p>
                )}
              </CardContent>
            </Card>

            <SuggestionsCard suggestions={summary.suggestions} />
          </div>

          {/* Evidence-Based Skill Tracking */}
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <CardTitle>Evidence-Based Skill Tracking</CardTitle>
                  <p className="mt-1 text-xs text-[#526075]">
                    Distinguishes viewing, attempting, assisted answers, and first-try recall. Guided lessons cap below 100% because independent mastery requires an unassisted assessment.
                  </p>
                </div>
                <Badge variant="indigo">
                  {summary.skillsPracticedCount} / {summary.skillSummaries.length}{' '}
                  Practiced
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              {summary.skillSummaries.map((item) => (
                <div
                  key={item.skill.id}
                  className="rounded-xl border border-[#E2E8F0] bg-[#F7F9FC]/70 p-4 space-y-2"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-bold text-[#202B3B]">
                        {item.skill.name}
                      </p>
                      <p className="text-[11px] text-[#526075]">
                        {item.skill.category}
                      </p>
                    </div>
                    <Badge variant={badgeVariantForSkillLabel(item.label)}>
                      {item.label}
                    </Badge>
                  </div>

                  <div
                    role="progressbar"
                    aria-label={`${item.skill.name} evidence indicator`}
                    aria-valuenow={item.indicatorPercent}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    className="h-2 w-full overflow-hidden rounded-full bg-[#E2E8F0]"
                  >
                    <div
                      className={`h-full rounded-full transition-all ${barColorForSkillLabel(item.label)}`}
                      style={{ width: `${item.indicatorPercent}%` }}
                    />
                  </div>

                  <div className="flex flex-wrap gap-1.5 text-[10px] font-mono text-[#526075]">
                    <span className="rounded bg-white px-1.5 py-0.5 border border-[#E2E8F0]">
                      First-try: {item.counts['first-try-correct']}
                    </span>
                    <span className="rounded bg-white px-1.5 py-0.5 border border-[#E2E8F0]">
                      Assisted: {item.counts['correct-with-assistance']}
                    </span>
                    <span className="rounded bg-white px-1.5 py-0.5 border border-[#E2E8F0]">
                      Attempted: {item.counts.attempted}
                    </span>
                    <span className="rounded bg-white px-1.5 py-0.5 border border-[#E2E8F0]">
                      Viewed: {item.counts.viewed}
                    </span>
                  </div>

                  <p className="text-[11px] leading-relaxed text-[#526075]">
                    {item.evidenceNote}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Individual Problem Progress */}
          <Card>
            <CardHeader>
              <CardTitle>Individual Problem Progress</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              {summary.problemSummaries.map((prob) => (
                <div
                  key={prob.problemId}
                  className="flex flex-col justify-between rounded-2xl border border-[#E2E8F0] bg-white p-4 space-y-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-bold text-[#202B3B]">
                        {prob.problemTitle}
                      </h3>
                      <Badge
                        variant={prob.totalSessions > 0 ? 'mint' : 'neutral'}
                      >
                        {prob.totalSessions > 0
                          ? `${prob.totalSessions} session${prob.totalSessions === 1 ? '' : 's'}`
                          : 'Not started'}
                      </Badge>
                    </div>
                    <dl className="grid grid-cols-2 gap-2 text-xs">
                      <div className="rounded-lg bg-[#F7F9FC] p-2">
                        <dt className="text-[10px] font-semibold uppercase text-[#526075]">
                          Best Stages
                        </dt>
                        <dd className="font-mono font-bold text-[#202B3B]">
                          {prob.bestVerifiedStages} / {prob.totalStages}
                        </dd>
                      </div>
                      <div className="rounded-lg bg-[#F7F9FC] p-2">
                        <dt className="text-[10px] font-semibold uppercase text-[#526075]">
                          Strategies
                        </dt>
                        <dd className="font-mono font-bold text-[#202B3B]">
                          {prob.strategiesExplored.length} /{' '}
                          {prob.totalStrategiesAvailable}
                        </dd>
                      </div>
                      <div className="rounded-lg bg-[#F7F9FC] p-2">
                        <dt className="text-[10px] font-semibold uppercase text-[#526075]">
                          Predictions
                        </dt>
                        <dd className="font-mono font-bold text-[#202B3B]">
                          {prob.predictionsFirstTry}/{prob.predictionsAttempted}{' '}
                          <span className="font-sans text-[10px] font-normal text-[#526075]">
                            1st try
                          </span>
                        </dd>
                      </div>
                      <div className="rounded-lg bg-[#F7F9FC] p-2">
                        <dt className="text-[10px] font-semibold uppercase text-[#526075]">
                          Hints Used
                        </dt>
                        <dd className="font-mono font-bold text-[#202B3B]">
                          {prob.hintsUsed}
                        </dd>
                      </div>
                    </dl>
                  </div>

                  <Link
                    to={prob.studioPath}
                    className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-xl border border-[#D7DCEB] bg-[#F7F9FC] text-xs font-semibold text-[#2257A8] hover:bg-[#EAF2FD]"
                  >
                    {prob.totalSessions > 0 ? 'Practice Again' : 'Start Lesson'}
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </Link>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Recent Learning Sessions History */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <CardTitle>Recent Learning Sessions</CardTitle>
                <Badge variant="neutral">
                  {summary.recentSessions.length} recorded
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="divide-y divide-[#E2E8F0]">
                {summary.recentSessions.map((session) => (
                  <li
                    key={session.sessionId}
                    className="flex flex-wrap items-center justify-between gap-3 py-3.5 first:pt-0 last:pb-0 text-sm"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <CheckCircle2
                          className="h-4 w-4 text-[#0D7A6E]"
                          aria-hidden="true"
                        />
                        <span className="font-bold text-[#202B3B]">
                          {session.problemTitle}
                        </span>
                        <Badge
                          variant={
                            session.outcome === 'completed-guided'
                              ? 'mint'
                              : session.outcome === 'completed-with-skips'
                                ? 'amber'
                                : 'neutral'
                          }
                        >
                          {formatOutcomeLabel(session.outcome)}
                        </Badge>
                      </div>
                      <p className="text-xs text-[#526075]">
                        Verified stages:{' '}
                        <strong>
                          {session.completedStagesCount}/{session.totalStages}
                        </strong>
                        {session.skippedStagesCount > 0 &&
                          ` (${session.skippedStagesCount} skipped)`}{' '}
                        · Predictions:{' '}
                        <strong>
                          {session.predictionSummary.firstTryCorrect}/
                          {session.predictionSummary.questionsAttempted} first-try
                        </strong>
                        {session.predictionSummary.skippedCount > 0 &&
                          ` (${session.predictionSummary.skippedCount} skipped)`}{' '}
                        · Hints: <strong>{session.hintsUsed}</strong>
                      </p>
                    </div>
                    <span className="text-xs font-medium text-[#526075]">
                      {formatSessionTimestamp(session.completedAt)}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function SuggestionsCard({
  suggestions,
}: {
  suggestions: ReturnType<typeof aggregateLearningProgress>['suggestions'];
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-[#2664C2]" aria-hidden="true" />
            <CardTitle>Next Practice Suggestions</CardTitle>
          </div>
          <Badge variant="neutral">Rule-Based · Deterministic</Badge>
        </div>
        <p className="text-xs text-[#526075]">
          Simple suggestions derived directly from your recorded local evidence (not an AI recommendation model).
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {suggestions.map((item) => (
          <div
            key={item.id}
            className="rounded-xl border border-[#E2E8F0] bg-[#F7F9FC] p-3.5 space-y-2"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-[#202B3B]">{item.title}</h3>
              {item.priority === 'high' && (
                <Badge variant="amber">Recommended Review</Badge>
              )}
            </div>
            <p className="text-xs leading-relaxed text-[#526075]">
              <strong>Why:</strong> {item.reason}
            </p>
            <Link
              to={item.targetPath}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2664C2] hover:text-[#2257A8]"
            >
              <Compass className="h-3.5 w-3.5" aria-hidden="true" />
              {item.ctaLabel}
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
