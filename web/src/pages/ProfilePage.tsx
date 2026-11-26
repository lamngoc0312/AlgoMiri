import { useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowRight,
  BookOpenCheck,
  CalendarDays,
  Check,
  Clock,
  Compass,
  Flame,
  HardDrive,
  History,
  Info,
  Library,
  Pencil,
  Sparkles,
  TrendingUp,
  Trophy,
  UserRound,
  X,
} from 'lucide-react';
import { aggregateLearningProgress } from '../domain/learning/analytics';
import {
  aggregateStudyActivity,
  isEligiblePracticeSession,
} from '../domain/learning/activityStreak';
import { formatStudyDuration } from '../domain/learning/studyTimer';
import { buildProfileTopicSummaries } from '../domain/profile/profileSummary';
import { defaultLearningRepository } from '../services/learningRepository';
import { defaultAiProblemHistoryRepository } from '../services/aiProblemHistoryRepository';
import {
  MAX_DISPLAY_NAME_LENGTH,
  defaultProfileRepository,
} from '../services/profileRepository';
import { ActivityHeatmap } from '../features/progress/ActivityHeatmap';
import { useLocalDateKey } from '../features/progress/useLocalDateKey';
import { localizePracticeSuggestion } from '../i18n/learningLocalization';
import { getTopicVisualStyle } from '../styles/topicColors';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';

const TOPIC_I18N_KEYS = {
  'Arrays & Hash Map': 'library.topics.arraysHashMap',
  'Stack (LIFO)': 'library.topics.stack',
  'Binary Search + Greedy': 'library.topics.binarySearchGreedy',
} as const;

export function ProfilePage() {
  const { t } = useTranslation();
  const localDateKey = useLocalDateKey();

  const [profile, setProfile] = useState(() => defaultProfileRepository.load());
  const [editingName, setEditingName] = useState(false);
  const [draftName, setDraftName] = useState(profile.displayName ?? '');
  const [nameFeedback, setNameFeedback] = useState<{
    type: 'saved' | 'error';
    message: string;
  } | null>(null);

  const learningLoad = useMemo(() => defaultLearningRepository.loadSessions(), []);
  const aiHistoryLoad = useMemo(() => defaultAiProblemHistoryRepository.load(), []);
  const sessions = learningLoad.sessions;

  const progressSummary = useMemo(
    () => aggregateLearningProgress(sessions),
    [sessions],
  );
  const studyActivity = useMemo(
    () => aggregateStudyActivity(sessions, { now: new Date() }),
    // Recalculate streaks when local calendar date rolls over overnight
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sessions, localDateKey],
  );
  const topicSummaries = useMemo(
    () => buildProfileTopicSummaries(sessions),
    [sessions],
  );

  const viewedOnlyCount = useMemo(
    () => sessions.filter((s) => !isEligiblePracticeSession(s)).length,
    [sessions],
  );
  const aiConceptualCount = useMemo(
    () => aiHistoryLoad.records.filter((r) => r.status === 'ai-conceptual').length,
    [aiHistoryLoad.records],
  );
  const bookmarkedCount = useMemo(
    () => aiHistoryLoad.records.filter((r) => r.status === 'bookmarked').length,
    [aiHistoryLoad.records],
  );

  const displayName = profile.displayName ?? t('profile.defaultName');
  const avatarInitial = profile.displayName
    ? profile.displayName.charAt(0).toUpperCase()
    : null;

  const rawSuggestion = progressSummary.suggestions[0];
  const nextSuggestion = rawSuggestion
    ? {
        ...localizePracticeSuggestion(
          t,
          rawSuggestion,
          progressSummary.skillSummaries,
          progressSummary.problemSummaries,
        ),
        targetPath: rawSuggestion.targetPath,
      }
    : null;

  const handleSaveName = (event: FormEvent) => {
    event.preventDefault();
    const result = defaultProfileRepository.saveDisplayName(draftName);
    if (result.saved) {
      setProfile(result.profile);
      setDraftName(result.profile.displayName ?? '');
      setEditingName(false);
      setNameFeedback({ type: 'saved', message: t('profile.nameSaved') });
    } else {
      setNameFeedback({
        type: 'error',
        message:
          result.error === 'invalid'
            ? t('profile.nameErrorTooLong')
            : t('profile.nameErrorStorage'),
      });
    }
  };

  const handleClearName = () => {
    const result = defaultProfileRepository.saveDisplayName('');
    if (result.saved) {
      setProfile(result.profile);
      setDraftName('');
      setEditingName(false);
      setNameFeedback({ type: 'saved', message: t('profile.nameSaved') });
    }
  };

  const hasVerifiedActivity = sessions.length > 0;

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      {/* Friendly Pastel Learner Profile Header */}
      <Card className="overflow-hidden">
        <div
          aria-hidden="true"
          className="h-2 w-full bg-gradient-to-r from-[#397BDB] via-[#15A897] to-[#F2B84B]"
        />
        <CardContent className="p-6 sm:p-8 space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div
                aria-hidden="true"
                className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-[var(--accent-blue-border)] bg-[var(--accent-blue-soft)] text-2xl font-extrabold text-[var(--accent-blue-text)] shadow-xs"
              >
                {avatarInitial ? (
                  avatarInitial
                ) : (
                  <UserRound className="h-8 w-8" />
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="indigo">
                    <Sparkles className="h-3 w-3" aria-hidden="true" />
                    {t('profile.badge')}
                  </Badge>
                  <Badge variant="neutral">
                    <HardDrive className="h-3 w-3" aria-hidden="true" />
                    {t('profile.localOnlyBadge')}
                  </Badge>
                </div>
                <h1
                  data-testid="profile-display-name"
                  className="text-2xl font-extrabold tracking-tight text-[var(--text-primary)] sm:text-3xl"
                >
                  {displayName}
                </h1>
                <p className="max-w-2xl text-sm leading-relaxed text-[var(--text-secondary)]">
                  {t('profile.subtitle')}
                </p>
              </div>
            </div>

            {!editingName && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setDraftName(profile.displayName ?? '');
                  setNameFeedback(null);
                  setEditingName(true);
                }}
              >
                <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                {t('profile.editName')}
              </Button>
            )}
          </div>

          {editingName && (
            <form
              onSubmit={handleSaveName}
              className="flex flex-wrap items-end gap-2.5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-subtle)] p-4"
            >
              <label className="min-w-[220px] flex-1 space-y-1 text-xs font-semibold text-[var(--text-primary)]">
                <span>{t('profile.displayNameLabel')}</span>
                <input
                  type="text"
                  value={draftName}
                  maxLength={MAX_DISPLAY_NAME_LENGTH}
                  onChange={(e) => setDraftName(e.target.value)}
                  placeholder={t('profile.displayNamePlaceholder')}
                  className="h-10 w-full rounded-xl border border-[var(--border-control)] bg-[var(--surface-input)] px-3 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-blue)] focus:ring-2 focus:ring-[var(--accent-blue-soft)]"
                />
              </label>
              <div className="flex flex-wrap items-center gap-2">
                <Button type="submit" variant="primary" size="sm">
                  <Check className="h-4 w-4" aria-hidden="true" />
                  {t('profile.saveName')}
                </Button>
                {profile.displayName && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleClearName}
                  >
                    {t('profile.clearName')}
                  </Button>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingName(false)}
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                  {t('common.cancel')}
                </Button>
              </div>
            </form>
          )}

          {nameFeedback && (
            <p
              role={nameFeedback.type === 'error' ? 'alert' : 'status'}
              className={`text-xs font-semibold ${
                nameFeedback.type === 'error'
                  ? 'text-[var(--accent-coral-text)]'
                  : 'text-[var(--accent-teal-text)]'
              }`}
            >
              {nameFeedback.message}
            </p>
          )}

          <div
            role="note"
            className="flex items-start gap-2.5 rounded-xl border border-[var(--accent-sky-border)] bg-[var(--accent-sky-soft)]/55 px-3.5 py-2.5 text-xs leading-relaxed text-[var(--text-secondary)]"
          >
            <Info
              className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent-sky-text)]"
              aria-hidden="true"
            />
            <span>{t('profile.localNotice')}</span>
          </div>
        </CardContent>
      </Card>

      {/* Honest New-Learner Welcome Banner (shown when zero verified sessions exist) */}
      {!hasVerifiedActivity && (
        <Card className="border-[var(--accent-blue-border)] bg-[var(--accent-blue-soft)]/35 p-6 sm:p-8">
          <div className="max-w-2xl space-y-3">
            <h2 className="text-xl font-extrabold text-[var(--text-primary)]">
              {t('profile.emptyTitle')}
            </h2>
            <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
              {t('profile.emptyDescription')}
            </p>
            <div className="flex flex-wrap gap-3 pt-1">
              <Link
                to="/studio/two-sum"
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-[var(--accent-blue-solid)] px-4 text-sm font-semibold text-white transition-colors hover:bg-[var(--accent-blue-hover)]"
              >
                {t('profile.startFirstStudio')}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                to="/problems"
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-[var(--border-control)] bg-[var(--surface-card)] px-4 text-sm font-semibold text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-elevated)]"
              >
                {t('profile.exploreLibrary')}
              </Link>
            </div>
          </div>
        </Card>
      )}

      {/* Learning Journey Summary KPI Grid (shared source of truth with ProgressPage) */}
      <section aria-label={t('profile.summaryAria')}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
              data-testid="profile-active-study-time"
              className="mt-2 font-mono text-2xl font-extrabold text-[var(--text-primary)]"
            >
              {formatStudyDuration(progressSummary.totalActiveStudySeconds, t)}
            </p>
            <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
              {progressSummary.timedSessionsCount === 0
                ? t('studyTime.noTimedSessions')
                : progressSummary.timedSessionsCount < progressSummary.totalSessions
                  ? t('studyTime.partialCoverage', {
                      timed: progressSummary.timedSessionsCount,
                      total: progressSummary.totalSessions,
                    })
                  : t('studyTime.estimatedSubtitle')}
            </p>
          </Card>

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
              data-testid="profile-current-streak"
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
              data-testid="profile-longest-streak"
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
                className="h-4 w-4 text-[var(--accent-blue-link)]"
                aria-hidden="true"
              />
            </div>
            <p
              data-testid="profile-active-days"
              className="mt-2 font-mono text-2xl font-extrabold text-[var(--text-primary)]"
            >
              {t('activity.days', { count: studyActivity.totalActiveDaysInRange })}
            </p>
            <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
              {t('activity.kpi.last52WeeksLocal')}
            </p>
          </Card>
        </div>
      </section>

      {/* Reusable 52-Week Activity Heatmap */}
      <ActivityHeatmap activity={studyActivity} />

      {/* Extensible Two-Column Dashboard: Topic Activity + Continue Learning & Evidence */}
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        {/* Topic-Level Learning Activity */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <BookOpenCheck
                className="h-5 w-5 text-[var(--accent-teal-text)]"
                aria-hidden="true"
              />
              <CardTitle>{t('profile.topics.title')}</CardTitle>
            </div>
            <p className="text-xs text-[var(--text-secondary)]">
              {t('profile.topics.subtitle')}
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {topicSummaries.map((topicItem) => {
              const style = getTopicVisualStyle(topicItem.topic);
              const topicKey =
                topicItem.topic in TOPIC_I18N_KEYS
                  ? TOPIC_I18N_KEYS[
                      topicItem.topic as keyof typeof TOPIC_I18N_KEYS
                    ]
                  : null;
              const localizedTopic = topicKey ? t(topicKey) : topicItem.topic;
              const statusVariant =
                topicItem.status === 'practiced'
                  ? 'mint'
                  : topicItem.status === 'explored'
                    ? 'amber'
                    : 'neutral';

              return (
                <div
                  key={topicItem.problemId}
                  data-testid={`profile-topic-${topicItem.problemId}`}
                  className="overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-subtle)]"
                >
                  <div className={`h-1 w-full ${style.accentBarClass}`} aria-hidden="true" />
                  <div className="flex flex-wrap items-center justify-between gap-3 p-4">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={style.badgeVariant}>{localizedTopic}</Badge>
                        <Badge variant={statusVariant}>
                          {t(`profile.topics.status.${topicItem.status}`)}
                        </Badge>
                      </div>
                      <p className="text-base font-bold text-[var(--text-primary)]">
                        {topicItem.problemTitle}
                      </p>
                      <p className="text-xs text-[var(--text-secondary)]">
                        {t('profile.topics.stagesCount', {
                          best: topicItem.bestCompletedStages,
                          total: topicItem.totalStages,
                        })}
                        {' · '}
                        {t('profile.topics.sessionsCount', {
                          count: topicItem.totalSessionsCount,
                        })}
                        {topicItem.activeStudySeconds !== null && (
                          <>
                            {' · '}
                            {formatStudyDuration(topicItem.activeStudySeconds, t)}
                          </>
                        )}
                      </p>
                    </div>
                    <Link
                      to={topicItem.studioPath}
                      className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl bg-[var(--surface-card)] border border-[var(--border-control)] px-3.5 text-sm font-semibold text-[var(--text-primary)] transition-colors hover:border-[var(--accent-blue-border)] hover:text-[var(--accent-blue-text)]"
                    >
                      {topicItem.totalSessionsCount > 0
                        ? t('profile.topics.openStudio')
                        : t('profile.topics.startStudio')}
                      <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Right Column: Continue Learning + Separated Evidence Breakdown */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('profile.continue.title')}</CardTitle>
              <p className="text-xs text-[var(--text-secondary)]">
                {t('profile.continue.subtitle')}
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {nextSuggestion && (
                <div className="rounded-2xl border border-[var(--accent-blue-border)] bg-[var(--accent-blue-soft)]/50 p-4 space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--accent-blue-text)]">
                    {t('profile.continue.recommendedNext')}
                  </span>
                  <p className="text-sm font-bold text-[var(--text-primary)]">
                    {nextSuggestion.title}
                  </p>
                  <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
                    {nextSuggestion.reason}
                  </p>
                  <Link
                    to={nextSuggestion.targetPath}
                    className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-[var(--accent-blue-solid)] px-3.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--accent-blue-hover)]"
                  >
                    {nextSuggestion.ctaLabel}
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </Link>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2.5 text-sm">
                <Link
                  to="/history"
                  className="inline-flex items-center gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-subtle)] px-3 py-2.5 font-semibold text-[var(--text-primary)] transition-colors hover:border-[var(--accent-blue-border)]"
                >
                  <History className="h-4 w-4 shrink-0 text-[var(--accent-coral-text)]" aria-hidden="true" />
                  <span className="truncate">{t('profile.continue.viewHistory')}</span>
                </Link>
                <Link
                  to="/progress"
                  className="inline-flex items-center gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-subtle)] px-3 py-2.5 font-semibold text-[var(--text-primary)] transition-colors hover:border-[var(--accent-blue-border)]"
                >
                  <TrendingUp className="h-4 w-4 shrink-0 text-[var(--accent-green)]" aria-hidden="true" />
                  <span className="truncate">{t('profile.continue.viewProgress')}</span>
                </Link>
                <Link
                  to="/roadmap"
                  className="inline-flex items-center gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-subtle)] px-3 py-2.5 font-semibold text-[var(--text-primary)] transition-colors hover:border-[var(--accent-blue-border)]"
                >
                  <Compass className="h-4 w-4 shrink-0 text-[var(--accent-sky)]" aria-hidden="true" />
                  <span className="truncate">{t('profile.continue.viewRoadmap')}</span>
                </Link>
                <Link
                  to="/problems"
                  className="inline-flex items-center gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-subtle)] px-3 py-2.5 font-semibold text-[var(--text-primary)] transition-colors hover:border-[var(--accent-blue-border)]"
                >
                  <Library className="h-4 w-4 shrink-0 text-[var(--accent-teal)]" aria-hidden="true" />
                  <span className="truncate">{t('profile.continue.browseProblems')}</span>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{t('profile.evidence.title')}</CardTitle>
              <p className="text-xs text-[var(--text-secondary)]">
                {t('profile.evidence.subtitle')}
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              <dl className="divide-y divide-[var(--border-subtle)] text-xs">
                <div className="flex items-center justify-between py-2 first:pt-0">
                  <dt className="text-[var(--text-secondary)]">
                    {t('profile.evidence.verifiedPractice')}
                  </dt>
                  <dd className="font-mono font-bold text-[var(--accent-teal-text)]">
                    {studyActivity.totalEligibleSessions}
                  </dd>
                </div>
                <div className="flex items-center justify-between py-2">
                  <dt className="text-[var(--text-secondary)]">
                    {t('profile.evidence.viewedOnly')}
                  </dt>
                  <dd className="font-mono font-bold text-[var(--text-primary)]">
                    {viewedOnlyCount}
                  </dd>
                </div>
                <div className="flex items-center justify-between py-2">
                  <dt className="text-[var(--text-secondary)]">
                    {t('profile.evidence.aiConceptual')}
                  </dt>
                  <dd className="font-mono font-bold text-[var(--accent-blue-text)]">
                    {aiConceptualCount}
                  </dd>
                </div>
                <div className="flex items-center justify-between py-2 last:pb-0">
                  <dt className="text-[var(--text-secondary)]">
                    {t('profile.evidence.bookmarks')}
                  </dt>
                  <dd className="font-mono font-bold text-[var(--text-secondary)]">
                    {bookmarkedCount}
                  </dd>
                </div>
              </dl>
              <p className="border-t border-[var(--border-subtle)] pt-2.5 text-[11px] leading-relaxed text-[var(--text-secondary)]">
                {t('profile.evidence.disclaimer')}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
