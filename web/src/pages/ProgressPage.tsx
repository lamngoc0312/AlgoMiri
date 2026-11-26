import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  AlertTriangle,
  ArrowRight,
  Award,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock,
  Compass,
  Flame,
  HardDrive,
  Info,
  Lightbulb,
  Sparkles,
  Target,
  Trash2,
  TrendingUp,
  Trophy,
} from 'lucide-react';
import { aggregateLearningProgress } from '../domain/learning/analytics';
import { aggregateStudyActivity } from '../domain/learning/activityStreak';
import { formatStudyDuration } from '../domain/learning/studyTimer';
import { ActivityHeatmap } from '../features/progress/ActivityHeatmap';
import { useLocalDateKey } from '../features/progress/useLocalDateKey';
import type {
  LearningSession,
  ProblemProgressSummary,
  SkillProgressLabel,
  SkillProgressSummary,
} from '../domain/learning/types';
import {
  defaultLearningRepository,
  type LearningRepository,
} from '../services/learningRepository';
import {
  localizePracticeSuggestion,
  localizeSessionOutcome,
  localizeSkillCategory,
  localizeSkillEvidenceNote,
  localizeSkillName,
  localizeSkillProgressLabel,
} from '../i18n/learningLocalization';
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

function formatSessionTimestamp(
  iso: string,
  locale: string,
  fallback: string,
): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return fallback;
  return parsed.toLocaleString(locale === 'vi' ? 'vi-VN' : 'en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function ProgressPage({
  repository = defaultLearningRepository,
}: ProgressPageProps) {
  const { t, i18n } = useTranslation();
  const [loadState, setLoadState] = useState(() => repository.loadSessions());
  const [confirmingClear, setConfirmingClear] = useState(false);
  const [clearFeedback, setClearFeedback] = useState<string | null>(null);

  const sessions: LearningSession[] = loadState.sessions;
  const summary = useMemo(
    () => aggregateLearningProgress(sessions),
    [sessions],
  );
  const localDateKey = useLocalDateKey();
  const studyActivity = useMemo(
    () => aggregateStudyActivity(sessions, { now: new Date() }),
    // Recalculate streaks when local calendar date rolls over (e.g. tab left open overnight)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sessions, localDateKey],
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
      setClearFeedback(t('progress.clearedFeedback'));
    } else {
      setClearFeedback(
        res.warningMessage ?? t('progress.clearFailedFeedback'),
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
            <TrendingUp
              className="h-5 w-5 text-[var(--accent-blue-link)]"
              aria-hidden="true"
            />
            <h1 className="text-2xl font-extrabold tracking-tight text-[var(--text-primary)] sm:text-3xl">
              {t('progress.title')}
            </h1>
            <Badge variant="indigo">
              <HardDrive className="h-3 w-3" aria-hidden="true" />
              {t('progress.localHistoryBadge')}
            </Badge>
          </div>
          <p className="text-sm text-[var(--text-secondary)]">
            {t('progress.subtitle')}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/problems"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[var(--accent-blue-solid)] px-4 text-sm font-semibold text-white transition-colors hover:bg-[var(--accent-blue-hover)]"
          >
            {t('progress.practiceProblem')}
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
              {t('progress.clearLocalHistory')}
            </Button>
          )}
        </div>
      </div>

      {/* Confirm Clear History Inline Guard */}
      {confirmingClear && (
        <div
          role="alertdialog"
          aria-label={t('progress.confirmClearAria')}
          className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 border-[#E05252]/60 bg-[var(--accent-coral-soft)] px-4 py-3.5 text-xs text-[var(--text-primary)]"
        >
          <div className="space-y-0.5">
            <p className="font-bold text-[var(--accent-coral-text)]">
              {t('progress.confirmClearTitle')}
            </p>
            <p className="text-[var(--text-secondary)]">
              {t('progress.confirmClearDescription', {
                count: sessions.length,
              })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmingClear(false)}
            >
              {t('common.cancel')}
            </Button>
            <Button
              variant="primary"
              size="sm"
              className="bg-[#C53030] hover:bg-[#9B2C2C]"
              onClick={handleConfirmClear}
            >
              {t('progress.confirmClearButton')}
            </Button>
          </div>
        </div>
      )}

      {/* Honest Local-Only Storage Notice */}
      <div
        role="note"
        className="flex items-start gap-2.5 rounded-2xl border border-[var(--accent-blue-border)] bg-[var(--accent-blue-soft)]/55 px-4 py-3 text-xs leading-relaxed text-[var(--text-primary)]"
      >
        <Info
          className="h-4 w-4 shrink-0 text-[var(--accent-blue-text)] mt-0.5"
          aria-hidden="true"
        />
        <p>
          <strong>{t('progress.noticeLead')}</strong> {t('progress.noticeBody')}
        </p>
      </div>

      {loadState.warningMessage && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-[#F2B84B] bg-[var(--accent-amber-soft)] px-4 py-3 text-xs text-[var(--accent-amber-text)]"
        >
          <AlertTriangle
            className="h-4 w-4 shrink-0 mt-0.5"
            aria-hidden="true"
          />
          <span>{loadState.warningMessage}</span>
        </div>
      )}

      {clearFeedback && (
        <div
          role="status"
          className="rounded-xl border border-[#15A897]/50 bg-[var(--accent-teal-soft)]/70 px-4 py-3 text-xs font-medium text-[var(--accent-teal-text)]"
        >
          {clearFeedback}
        </div>
      )}

      {/* Honest Empty State for First-Time Learners */}
      {sessions.length === 0 ? (
        <div className="space-y-6">
          <Card className="border-dashed border-2 border-[var(--border-control)]">
            <CardContent className="p-8 text-center space-y-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--accent-blue-soft)] text-[var(--accent-blue-link)]">
                <BookOpen className="h-6 w-6" aria-hidden="true" />
              </div>
              <div className="space-y-1.5 max-w-lg mx-auto">
                <h2 className="text-lg font-extrabold text-[var(--text-primary)]">
                  {t('progress.emptyTitle')}
                </h2>
                <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
                  {t('progress.emptyDescription')}
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
                <Link
                  to="/studio/two-sum"
                  className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-[var(--accent-blue-solid)] px-4 text-sm font-semibold text-white hover:bg-[var(--accent-blue-hover)]"
                >
                  {t('progress.startProblem', { problem: 'Two Sum' })}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <Link
                  to="/studio/valid-parentheses"
                  className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-[var(--border-control)] bg-[var(--surface-card)] px-4 text-sm font-semibold text-[var(--text-primary)] hover:bg-[var(--surface-elevated)]"
                >
                  {t('progress.startProblem', { problem: 'Valid Parentheses' })}
                </Link>
                <Link
                  to="/studio/split-array-largest-sum"
                  className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-[var(--border-control)] bg-[var(--surface-card)] px-4 text-sm font-semibold text-[var(--text-primary)] hover:bg-[var(--surface-elevated)]"
                >
                  {t('progress.startProblem', {
                    problem: 'Split Array Largest Sum',
                  })}
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Starter deterministic suggestions */}
          <SuggestionsCard
            suggestions={summary.suggestions}
            skillSummaries={summary.skillSummaries}
            problemSummaries={summary.problemSummaries}
          />
        </div>
      ) : (
        <>
          {/* KPI Overview Grid */}
          <section aria-label={t('progress.statsAria')}>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                    {t('studyTime.totalLabel')}
                  </span>
                  <Clock
                    className="h-4 w-4 text-[var(--accent-teal-text)]"
                    aria-hidden="true"
                  />
                </div>
                <p
                  data-testid="progress-active-study-time"
                  className="mt-2 font-mono text-2xl font-extrabold text-[var(--text-primary)]"
                >
                  {formatStudyDuration(summary.totalActiveStudySeconds, t)}
                </p>
                <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
                  {summary.timedSessionsCount === 0
                    ? t('studyTime.noTimedSessions')
                    : summary.timedSessionsCount < summary.totalSessions
                      ? t('studyTime.partialCoverage', {
                          timed: summary.timedSessionsCount,
                          total: summary.totalSessions,
                        })
                      : t('studyTime.estimatedSubtitle')}
                </p>
              </Card>

              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                    {t('progress.kpi.learningSessions')}
                  </span>
                  <Clock
                    className="h-4 w-4 text-[var(--accent-blue-link)]"
                    aria-hidden="true"
                  />
                </div>
                <p
                  data-testid="progress-total-sessions"
                  className="mt-2 font-mono text-2xl font-extrabold text-[var(--text-primary)]"
                >
                  {summary.totalSessions}
                </p>
                <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
                  {t('progress.kpi.savedInBrowser')}
                </p>
              </Card>

              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                    {t('progress.kpi.problemsPracticed')}
                  </span>
                  <BookOpen
                    className="h-4 w-4 text-[var(--accent-teal-text)]"
                    aria-hidden="true"
                  />
                </div>
                <p
                  data-testid="progress-problems-practiced"
                  className="mt-2 font-mono text-2xl font-extrabold text-[var(--text-primary)]"
                >
                  {summary.problemsPracticedCount} /{' '}
                  {summary.totalAvailableProblems}
                </p>
                <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
                  {t('progress.kpi.verifiedVisualStudios')}
                </p>
              </Card>

              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                    {t('progress.kpi.strategiesExplored')}
                  </span>
                  <Award
                    className="h-4 w-4 text-[var(--accent-blue-link)]"
                    aria-hidden="true"
                  />
                </div>
                <p
                  data-testid="progress-strategies-explored"
                  className="mt-2 font-mono text-2xl font-extrabold text-[var(--text-primary)]"
                >
                  {summary.uniqueStrategiesExploredCount} /{' '}
                  {summary.totalAvailableStrategies}
                </p>
                <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
                  {t('progress.kpi.acrossAllStudios')}
                </p>
              </Card>

              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                    {t('progress.kpi.predictionAccuracy')}
                  </span>
                  <Target
                    className="h-4 w-4 text-[var(--accent-teal-text)]"
                    aria-hidden="true"
                  />
                </div>
                <p
                  data-testid="progress-prediction-accuracy"
                  className="mt-2 font-mono text-2xl font-extrabold text-[var(--text-primary)]"
                >
                  {summary.firstTryAccuracyPercent !== null
                    ? `${summary.firstTryAccuracyPercent}%`
                    : '—'}
                </p>
                <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
                  {summary.totalPredictionsAttempted > 0
                    ? t('progress.kpi.firstTryRatio', {
                        firstTry: summary.totalPredictionsFirstTry,
                        attempted: summary.totalPredictionsAttempted,
                      })
                    : t('progress.kpi.noPredictionsAttempted')}
                </p>
              </Card>

              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                    {t('progress.kpi.hintsUsed')}
                  </span>
                  <Lightbulb
                    className="h-4 w-4 text-[#F2B84B]"
                    aria-hidden="true"
                  />
                </div>
                <p
                  data-testid="progress-hints-used"
                  className="mt-2 font-mono text-2xl font-extrabold text-[var(--text-primary)]"
                >
                  {summary.totalHintsUsed}
                </p>
                <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
                  {t('progress.kpi.skillsPracticedOf', {
                    practiced: summary.skillsPracticedCount,
                    total: summary.skillSummaries.length,
                  })}
                </p>
              </Card>
            </div>
          </section>

          {/* Study Streak & Active Days Summary */}
          <section aria-label={t('activity.streakSectionAria')} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                    {t('activity.kpi.currentStreak')}
                  </span>
                  <Flame
                    className="h-4 w-4 text-[var(--accent-coral)]"
                    aria-hidden="true"
                  />
                </div>
                <p
                  data-testid="progress-current-streak"
                  className="mt-2 font-mono text-2xl font-extrabold text-[var(--text-primary)]"
                >
                  {t('activity.days', { count: studyActivity.currentStreak })}
                </p>
                <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
                  {studyActivity.practicedToday
                    ? t('activity.kpi.practicedToday')
                    : studyActivity.practicedYesterdayOnly
                      ? t('activity.kpi.practicedYesterday')
                      : t('activity.kpi.noCurrentStreak')}
                </p>
              </Card>

              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                    {t('activity.kpi.longestStreak')}
                  </span>
                  <Trophy
                    className="h-4 w-4 text-[var(--accent-amber)]"
                    aria-hidden="true"
                  />
                </div>
                <p
                  data-testid="progress-longest-streak"
                  className="mt-2 font-mono text-2xl font-extrabold text-[var(--text-primary)]"
                >
                  {t('activity.days', { count: studyActivity.longestObservedStreak })}
                </p>
                <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
                  {t('activity.kpi.withinRetainedHistory')}
                </p>
              </Card>

              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                    {t('activity.kpi.activeDays')}
                  </span>
                  <CalendarDays
                    className="h-4 w-4 text-[var(--accent-teal-text)]"
                    aria-hidden="true"
                  />
                </div>
                <p
                  data-testid="progress-active-days"
                  className="mt-2 font-mono text-2xl font-extrabold text-[var(--text-primary)]"
                >
                  {t('activity.days', { count: studyActivity.totalActiveDaysInRange })}
                </p>
                <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
                  {t('activity.kpi.last52WeeksLocal')}
                </p>
              </Card>
            </div>

            <ActivityHeatmap activity={studyActivity} />
          </section>

          {/* Prediction Outcomes Breakdown Chart */}
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle>{t('progress.predictionBreakdown.title')}</CardTitle>
                <Badge variant="neutral">
                  {t('progress.predictionBreakdown.summaryBadge', {
                    total: summary.totalPredictionQuestions,
                    attempted: summary.totalPredictionsAttempted,
                    skipped: summary.totalPredictionsSkipped,
                  })}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {totalPredictionEvents > 0 ? (
                <>
                  <div
                    role="img"
                    aria-label={t('progress.predictionBreakdown.chartAria', {
                      total: totalPredictionEvents,
                      firstTry: summary.totalPredictionsFirstTry,
                      retry: summary.totalPredictionsSolvedAfterRetry,
                      skippedAttempt:
                        summary.totalPredictionsSkippedAfterAttempt,
                      skippedUnattempted:
                        summary.totalPredictionsSkippedWithoutAttempt,
                      unresolved: summary.totalPredictionsUnresolved,
                    })}
                    className="flex h-4 w-full overflow-hidden rounded-full bg-[var(--accent-blue-soft)]"
                  >
                    {firstTryBarPct > 0 && (
                      <div
                        className="h-full bg-[#15A897] transition-all"
                        style={{ width: `${firstTryBarPct}%` }}
                        title={`${t('progress.predictionBreakdown.firstTryCorrect')} ${summary.totalPredictionsFirstTry}`}
                      />
                    )}
                    {retryBarPct > 0 && (
                      <div
                        className="h-full bg-[#397BDB] transition-all"
                        style={{ width: `${retryBarPct}%` }}
                        title={`${t('progress.predictionBreakdown.solvedAfterRetry')} ${summary.totalPredictionsSolvedAfterRetry}`}
                      />
                    )}
                    {skippedAfterAttemptBarPct > 0 && (
                      <div
                        className="h-full bg-[#E08A2E] transition-all"
                        style={{ width: `${skippedAfterAttemptBarPct}%` }}
                        title={`${t('progress.predictionBreakdown.skippedAfterAttempt')} ${summary.totalPredictionsSkippedAfterAttempt}`}
                      />
                    )}
                    {skippedWithoutAttemptBarPct > 0 && (
                      <div
                        className="h-full bg-[#F2B84B] transition-all"
                        style={{ width: `${skippedWithoutAttemptBarPct}%` }}
                        title={`${t('progress.predictionBreakdown.skippedUnattempted')} ${summary.totalPredictionsSkippedWithoutAttempt}`}
                      />
                    )}
                    {summary.totalPredictionsUnresolved > 0 &&
                      unresolvedBarPct > 0 && (
                        <div
                          className="h-full bg-[#9AA2BE] transition-all"
                          style={{ width: `${unresolvedBarPct}%` }}
                          title={`${t('progress.predictionBreakdown.unresolved')} ${summary.totalPredictionsUnresolved}`}
                        />
                      )}
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-[var(--text-secondary)]">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-[#15A897]" />
                      {t('progress.predictionBreakdown.firstTryCorrect')}{' '}
                      <strong className="text-[var(--text-primary)]">
                        {summary.totalPredictionsFirstTry}
                      </strong>
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-[#397BDB]" />
                      {t('progress.predictionBreakdown.solvedAfterRetry')}{' '}
                      <strong className="text-[var(--text-primary)]">
                        {summary.totalPredictionsSolvedAfterRetry}
                      </strong>
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-[#E08A2E]" />
                      {t('progress.predictionBreakdown.skippedAfterAttempt')}{' '}
                      <strong className="text-[var(--text-primary)]">
                        {summary.totalPredictionsSkippedAfterAttempt}
                      </strong>
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-[#F2B84B]" />
                      {t('progress.predictionBreakdown.skippedUnattempted')}{' '}
                      <strong className="text-[var(--text-primary)]">
                        {summary.totalPredictionsSkippedWithoutAttempt}
                      </strong>
                    </span>
                    {summary.totalPredictionsUnresolved > 0 && (
                      <span className="inline-flex items-center gap-1.5">
                        <span className="h-2.5 w-2.5 rounded-full bg-[#9AA2BE]" />
                        {t('progress.predictionBreakdown.unresolved')}{' '}
                        <strong className="text-[var(--text-primary)]">
                          {summary.totalPredictionsUnresolved}
                        </strong>
                      </span>
                    )}
                    {summary.overallSolvedPercent !== null && (
                      <span className="ml-auto font-mono text-xs font-semibold text-[var(--accent-blue-text)]">
                        {t('progress.predictionBreakdown.eventuallySolved', {
                          percent: summary.overallSolvedPercent,
                        })}
                      </span>
                    )}
                  </div>
                </>
              ) : (
                <p className="text-xs text-[var(--text-secondary)]">
                  {t('progress.predictionBreakdown.empty')}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Areas Needing More Practice + Deterministic Next Suggestions */}
          <div className="grid gap-5 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <CardTitle>
                    {t('progress.areasNeedingPractice.title')}
                  </CardTitle>
                  <Badge
                    variant={
                      summary.areasNeedingPractice.length > 0 ? 'amber' : 'mint'
                    }
                  >
                    {summary.areasNeedingPractice.length > 0
                      ? t('progress.areasNeedingPractice.flaggedCount', {
                          count: summary.areasNeedingPractice.length,
                        })
                      : t('progress.areasNeedingPractice.lookingSteady')}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {summary.areasNeedingPractice.length > 0 ? (
                  <ul className="space-y-3">
                    {summary.areasNeedingPractice.map((item) => (
                      <li
                        key={item.skill.id}
                        className="rounded-xl border border-[#F2B84B]/60 bg-[var(--accent-amber-soft)]/60 p-3.5 space-y-1.5"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-sm font-bold text-[var(--text-primary)]">
                            {localizeSkillName(t, item.skill.id)}
                          </span>
                          <Badge variant="amber">
                            {localizeSkillProgressLabel(t, item.label)}
                          </Badge>
                        </div>
                        <p className="text-xs text-[var(--text-secondary)]">
                          {localizeSkillEvidenceNote(t, item)}
                        </p>
                        <Link
                          to={item.skill.recommendedStudioPath}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--accent-amber-text)] hover:underline"
                        >
                          {t('progress.areasNeedingPractice.practiceInStudio')}
                          <ArrowRight className="h-3 w-3" aria-hidden="true" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
                    {t('progress.areasNeedingPractice.empty')}
                  </p>
                )}
              </CardContent>
            </Card>

            <SuggestionsCard
              suggestions={summary.suggestions}
              skillSummaries={summary.skillSummaries}
              problemSummaries={summary.problemSummaries}
            />
          </div>

          {/* Evidence-Based Skill Tracking */}
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <CardTitle>{t('progress.skillTracking.title')}</CardTitle>
                  <p className="mt-1 text-xs text-[var(--text-secondary)]">
                    {t('progress.skillTracking.subtitle')}
                  </p>
                </div>
                <Badge variant="indigo">
                  {t('progress.skillTracking.practicedBadge', {
                    practiced: summary.skillsPracticedCount,
                    total: summary.skillSummaries.length,
                  })}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              {summary.skillSummaries.map((item) => {
                const localizedSkillName = localizeSkillName(t, item.skill.id);
                return (
                  <div
                    key={item.skill.id}
                    className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-subtle)]/70 p-4 space-y-2"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-bold text-[var(--text-primary)]">
                          {localizedSkillName}
                        </p>
                        <p className="text-xs text-[var(--text-secondary)]">
                          {localizeSkillCategory(t, item.skill.category)}
                        </p>
                      </div>
                      <Badge variant={badgeVariantForSkillLabel(item.label)}>
                        {localizeSkillProgressLabel(t, item.label)}
                      </Badge>
                    </div>

                    <div
                      role="progressbar"
                      aria-label={t('progress.skillTracking.indicatorAria', {
                        skill: localizedSkillName,
                      })}
                      aria-valuenow={item.indicatorPercent}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      className="h-2 w-full overflow-hidden rounded-full bg-[var(--border-subtle)]"
                    >
                      <div
                        className={`h-full rounded-full transition-all ${barColorForSkillLabel(item.label)}`}
                        style={{ width: `${item.indicatorPercent}%` }}
                      />
                    </div>

                    <div className="flex flex-wrap gap-1.5 text-xs font-mono text-[var(--text-secondary)]">
                      <span className="rounded bg-[var(--surface-card)] px-1.5 py-0.5 border border-[var(--border-subtle)]">
                        {t('progress.skillTracking.firstTry', {
                          count: item.counts['first-try-correct'],
                        })}
                      </span>
                      <span className="rounded bg-[var(--surface-card)] px-1.5 py-0.5 border border-[var(--border-subtle)]">
                        {t('progress.skillTracking.assisted', {
                          count: item.counts['correct-with-assistance'],
                        })}
                      </span>
                      <span className="rounded bg-[var(--surface-card)] px-1.5 py-0.5 border border-[var(--border-subtle)]">
                        {t('progress.skillTracking.attempted', {
                          count: item.counts.attempted,
                        })}
                      </span>
                      <span className="rounded bg-[var(--surface-card)] px-1.5 py-0.5 border border-[var(--border-subtle)]">
                        {t('progress.skillTracking.viewed', {
                          count: item.counts.viewed,
                        })}
                      </span>
                    </div>

                    <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
                      {localizeSkillEvidenceNote(t, item)}
                    </p>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Individual Problem Progress */}
          <Card>
            <CardHeader>
              <CardTitle>{t('progress.problemProgress.title')}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              {summary.problemSummaries.map((prob) => (
                <div
                  key={prob.problemId}
                  className="flex flex-col justify-between rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-4 space-y-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-bold text-[var(--text-primary)]">
                        {prob.problemTitle}
                      </h3>
                      <Badge
                        variant={prob.totalSessions > 0 ? 'mint' : 'neutral'}
                      >
                        {prob.totalSessions > 0
                          ? t('progress.problemProgress.sessionsCount', {
                              count: prob.totalSessions,
                            })
                          : t('progress.problemProgress.notStarted')}
                      </Badge>
                    </div>
                    <dl className="grid grid-cols-2 gap-2 text-xs">
                      <div className="rounded-lg bg-[var(--surface-subtle)] p-2">
                        <dt className="text-xs font-semibold uppercase text-[var(--text-secondary)]">
                          {t('progress.problemProgress.bestStages')}
                        </dt>
                        <dd className="font-mono font-bold text-[var(--text-primary)]">
                          {prob.bestVerifiedStages} / {prob.totalStages}
                        </dd>
                      </div>
                      <div className="rounded-lg bg-[var(--surface-subtle)] p-2">
                        <dt className="text-xs font-semibold uppercase text-[var(--text-secondary)]">
                          {t('progress.problemProgress.strategies')}
                        </dt>
                        <dd className="font-mono font-bold text-[var(--text-primary)]">
                          {prob.strategiesExplored.length} /{' '}
                          {prob.totalStrategiesAvailable}
                        </dd>
                      </div>
                      <div className="rounded-lg bg-[var(--surface-subtle)] p-2">
                        <dt className="text-xs font-semibold uppercase text-[var(--text-secondary)]">
                          {t('progress.problemProgress.predictions')}
                        </dt>
                        <dd className="font-mono font-bold text-[var(--text-primary)]">
                          {prob.predictionsFirstTry}/{prob.predictionsAttempted}{' '}
                          <span className="font-sans text-xs font-normal text-[var(--text-secondary)]">
                            {t('progress.problemProgress.firstTryShort')}
                          </span>
                        </dd>
                      </div>
                      <div className="rounded-lg bg-[var(--surface-subtle)] p-2">
                        <dt className="text-xs font-semibold uppercase text-[var(--text-secondary)]">
                          {t('progress.problemProgress.hintsUsed')}
                        </dt>
                        <dd className="font-mono font-bold text-[var(--text-primary)]">
                          {prob.hintsUsed}
                        </dd>
                      </div>
                    </dl>
                  </div>

                  <Link
                    to={prob.studioPath}
                    className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-xl border border-[var(--border-control)] bg-[var(--surface-subtle)] text-xs font-semibold text-[var(--accent-blue-text)] hover:bg-[var(--accent-blue-soft)]"
                  >
                    {prob.totalSessions > 0
                      ? t('progress.problemProgress.practiceAgain')
                      : t('progress.problemProgress.startLesson')}
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
                <CardTitle>{t('progress.recentSessions.title')}</CardTitle>
                <Badge variant="neutral">
                  {t('progress.recentSessions.recordedCount', {
                    count: summary.recentSessions.length,
                  })}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="divide-y divide-[var(--border-subtle)]">
                {summary.recentSessions.map((session) => (
                  <li
                    key={session.sessionId}
                    className="flex flex-wrap items-center justify-between gap-3 py-3.5 first:pt-0 last:pb-0 text-sm"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <CheckCircle2
                          className="h-4 w-4 text-[var(--accent-teal-text)]"
                          aria-hidden="true"
                        />
                        <span className="font-bold text-[var(--text-primary)]">
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
                          {localizeSessionOutcome(t, session.outcome)}
                        </Badge>
                      </div>
                      <p className="text-xs text-[var(--text-secondary)]">
                        {t('progress.recentSessions.verifiedStages')}{' '}
                        <strong>
                          {session.completedStagesCount}/{session.totalStages}
                        </strong>
                        {session.skippedStagesCount > 0 &&
                          t('progress.recentSessions.skippedParen', {
                            count: session.skippedStagesCount,
                          })}{' '}
                        · {t('progress.recentSessions.predictions')}{' '}
                        <strong>
                          {session.predictionSummary.firstTryCorrect}/
                          {session.predictionSummary.questionsAttempted}
                          {t('progress.recentSessions.firstTrySuffix')}
                        </strong>
                        {session.predictionSummary.skippedCount > 0 &&
                          t('progress.recentSessions.skippedParen', {
                            count: session.predictionSummary.skippedCount,
                          })}{' '}
                        · {t('progress.recentSessions.hints')}{' '}
                        <strong>{session.hintsUsed}</strong>
                        {' · '}
                        {t('studyTime.sessionLabel')}{' '}
                        <strong>
                          {formatStudyDuration(session.activeStudySeconds, t)}
                        </strong>
                      </p>
                    </div>
                    <span className="text-xs font-medium text-[var(--text-secondary)]">
                      {formatSessionTimestamp(
                        session.completedAt,
                        i18n.resolvedLanguage ?? 'en',
                        t('progress.savedLocallyFallback'),
                      )}
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
  skillSummaries,
  problemSummaries,
}: {
  suggestions: ReturnType<typeof aggregateLearningProgress>['suggestions'];
  skillSummaries: SkillProgressSummary[];
  problemSummaries: ProblemProgressSummary[];
}) {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <Sparkles
              className="h-4 w-4 text-[var(--accent-blue-link)]"
              aria-hidden="true"
            />
            <CardTitle>{t('progress.suggestionsCard.title')}</CardTitle>
          </div>
          <Badge variant="neutral">
            {t('progress.suggestionsCard.badge')}
          </Badge>
        </div>
        <p className="text-xs text-[var(--text-secondary)]">
          {t('progress.suggestionsCard.subtitle')}
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {suggestions.map((item) => {
          const localized = localizePracticeSuggestion(
            t,
            item,
            skillSummaries,
            problemSummaries,
          );
          return (
            <div
              key={item.id}
              className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-subtle)] p-3.5 space-y-2"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-bold text-[var(--text-primary)]">
                  {localized.title}
                </h3>
                {item.priority === 'high' && (
                  <Badge variant="amber">
                    {t('progress.suggestionsCard.recommendedReview')}
                  </Badge>
                )}
              </div>
              <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
                <strong>{t('progress.suggestionsCard.whyPrefix')}</strong>{' '}
                {localized.reason}
              </p>
              <Link
                to={item.targetPath}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--accent-blue-link)] hover:text-[var(--accent-blue-text)]"
              >
                <Compass className="h-3.5 w-3.5" aria-hidden="true" />
                {localized.ctaLabel}
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
