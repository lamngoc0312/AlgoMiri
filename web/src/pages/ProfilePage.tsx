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
import { defaultXpLedgerRepository } from '../services/xpLedgerRepository';
import { defaultAiProblemHistoryRepository } from '../services/aiProblemHistoryRepository';
import {
  MAX_DISPLAY_NAME_LENGTH,
  defaultProfileRepository,
} from '../services/profileRepository';
import { ActivityHeatmap } from '../features/progress/ActivityHeatmap';
import { useLocalDateKey } from '../features/progress/useLocalDateKey';
import { XpLevelCard } from '../features/gamification/XpLevelCard';
import { MiriIslandsShowcase } from '../features/islands/MiriIslandsShowcase';
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
  const xpSnapshot = useMemo(
    () => defaultXpLedgerRepository.syncSessions(sessions),
    [sessions],
  );

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
  const studioSummaries = useMemo(
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
  const hasActiveStreak = studyActivity.currentStreak > 0;

  return (
    <div className="mx-auto max-w-6xl space-y-5 px-4 py-7 sm:px-6 sm:py-9 lg:px-8">
      {/* Cozy Pastel Learner Profile Hero — extensible right slot for a future Miri mascot */}
      <Card className="relative overflow-hidden border-[var(--border-subtle)] shadow-sm">
        <div
          aria-hidden="true"
          className="h-1.5 w-full bg-gradient-to-r from-[#397BDB] via-[#15A897] to-[#F2B84B]"
        />
        {/* Soft decorative pastel radial glow (pure CSS, light/dark friendly) */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-[var(--accent-teal-soft)]/55 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-16 bottom-0 h-44 w-44 rounded-full bg-[var(--accent-blue-soft)]/50 blur-3xl"
        />

        <CardContent className="relative p-5 sm:p-7 space-y-4">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4 sm:items-center">
              <div
                aria-hidden="true"
                className="flex h-16 w-16 sm:h-20 sm:w-20 shrink-0 items-center justify-center rounded-3xl border-2 border-[var(--accent-blue-border)] bg-[var(--accent-blue-soft)] text-2xl sm:text-3xl font-extrabold text-[var(--accent-blue-text)] shadow-xs"
              >
                {avatarInitial ? (
                  avatarInitial
                ) : (
                  <UserRound className="h-8 w-8 sm:h-9 sm:w-9" />
                )}
              </div>

              <div className="min-w-0 space-y-1.5">
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

                <div className="flex flex-wrap items-center gap-2.5">
                  <h1
                    data-testid="profile-display-name"
                    className="break-words text-2xl font-extrabold tracking-tight text-[var(--text-primary)] sm:text-3xl"
                  >
                    {displayName}
                  </h1>
                  {!editingName && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setDraftName(profile.displayName ?? '');
                        setNameFeedback(null);
                        setEditingName(true);
                      }}
                      className="h-8 rounded-lg px-2.5 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    >
                      <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                      {t('profile.editName')}
                    </Button>
                  )}
                </div>

                <p className="max-w-2xl text-sm leading-relaxed text-[var(--text-secondary)]">
                  {t('profile.subtitle')}
                </p>
              </div>
            </div>

            {/* Right Hero Action Slot (keeps primary next step immediate & reserves future mascot balance) */}
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <Link
                to={nextSuggestion?.targetPath ?? '/studio/two-sum'}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-[var(--accent-blue-solid)] px-4 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-[var(--accent-blue-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-blue)]"
              >
                {hasVerifiedActivity && nextSuggestion
                  ? nextSuggestion.ctaLabel
                  : t('profile.startFirstStudio')}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </div>

          {editingName && (
            <form
              onSubmit={handleSaveName}
              className="flex flex-wrap items-end gap-2.5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-subtle)] p-4"
            >
              <label className="min-w-[200px] flex-1 space-y-1 text-xs font-semibold text-[var(--text-primary)]">
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

          {/* Unobtrusive Local-Only Privacy Notice */}
          <p
            role="note"
            className="flex items-start gap-2 border-t border-[var(--border-subtle)]/80 pt-3 text-xs leading-relaxed text-[var(--text-secondary)]"
          >
            <Info
              className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--accent-sky-text)]"
              aria-hidden="true"
            />
            <span>{t('profile.localNotice')}</span>
          </p>
        </CardContent>
      </Card>

      {/* Friendly New-Learner Empty Banner */}
      {!hasVerifiedActivity && (
        <Card className="border-[var(--accent-blue-border)] bg-[var(--accent-blue-soft)]/35 p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-2xl space-y-1.5">
              <h2 className="text-lg font-extrabold text-[var(--text-primary)]">
                {t('profile.emptyTitle')}
              </h2>
              <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
                {t('profile.emptyDescription')}
              </p>
            </div>
            <Link
              to="/problems"
              className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-[var(--border-control)] bg-[var(--surface-card)] px-4 text-sm font-semibold text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-elevated)]"
            >
              {t('profile.exploreLibrary')}
            </Link>
          </div>
        </Card>
      )}

      {/* Evidence-based XP & Level summary card (durable browser-local ledger) */}
      <XpLevelCard
        levelProgress={xpSnapshot.levelProgress}
        warningMessage={xpSnapshot.warningMessage}
      />

      {/* Learning Journey Summary: Current Streak Spotlight + 3 Pastel KPI Cards */}
      <section aria-label={t('profile.summaryAria')}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Spotlight Card: Current Study Streak */}
          <Card
            className={`p-4 sm:p-5 transition-colors ${
              hasActiveStreak
                ? 'border-[var(--accent-coral-border)] bg-[var(--accent-coral-soft)]/45'
                : ''
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                {t('activity.kpi.currentStreak')}
              </span>
              <span
                aria-hidden="true"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-coral-soft)] text-[var(--accent-coral-text)] border border-[var(--accent-coral-border)]/70"
              >
                <Flame className="h-4 w-4" />
              </span>
            </div>
            <p
              data-testid="profile-current-streak"
              className="mt-2 font-mono text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)]"
            >
              {t('activity.days', { count: studyActivity.currentStreak })}
            </p>
            <p className="mt-1 text-xs leading-snug text-[var(--text-secondary)]">
              {studyActivity.practicedToday
                ? t('activity.kpi.practicedToday')
                : studyActivity.practicedYesterdayOnly
                  ? t('activity.kpi.practicedYesterday')
                  : t('activity.kpi.noCurrentStreak')}
            </p>
          </Card>

          <Card className="p-4 sm:p-5">
            <div className="flex items-start justify-between gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                {t('studyTime.totalLabel')}
              </span>
              <span
                aria-hidden="true"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-teal-soft)] text-[var(--accent-teal-text)] border border-[var(--accent-teal-border)]/70"
              >
                <Clock className="h-4 w-4" />
              </span>
            </div>
            <p
              data-testid="profile-active-study-time"
              className="mt-2 font-mono text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)]"
            >
              {formatStudyDuration(progressSummary.totalActiveStudySeconds, t)}
            </p>
            <p className="mt-1 text-xs leading-snug text-[var(--text-secondary)]">
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

          <Card className="p-4 sm:p-5">
            <div className="flex items-start justify-between gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                {t('activity.kpi.longestStreak')}
              </span>
              <span
                aria-hidden="true"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-amber-soft)] text-[var(--accent-amber-text)] border border-[var(--accent-amber-border)]/70"
              >
                <Trophy className="h-4 w-4" />
              </span>
            </div>
            <p
              data-testid="profile-longest-streak"
              className="mt-2 font-mono text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)]"
            >
              {t('activity.days', { count: studyActivity.longestObservedStreak })}
            </p>
            <p className="mt-1 text-xs leading-snug text-[var(--text-secondary)]">
              {t('activity.kpi.withinRetainedHistory')}
            </p>
          </Card>

          <Card className="p-4 sm:p-5">
            <div className="flex items-start justify-between gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                {t('activity.kpi.activeDays')}
              </span>
              <span
                aria-hidden="true"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-blue-soft)] text-[var(--accent-blue-text)] border border-[var(--accent-blue-border)]/70"
              >
                <CalendarDays className="h-4 w-4" />
              </span>
            </div>
            <p
              data-testid="profile-active-days"
              className="mt-2 font-mono text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)]"
            >
              {t('activity.days', { count: studyActivity.totalActiveDaysInRange })}
            </p>
            <p className="mt-1 text-xs leading-snug text-[var(--text-secondary)]">
              {t('activity.kpi.last52WeeksLocal')}
            </p>
          </Card>
        </div>
      </section>

      {/* Reusable 52-Week Activity Heatmap */}
      <ActivityHeatmap activity={studyActivity} />

      {/* Extensible Two-Column Dashboard: Verified Studio Activity + Continue Learning & Evidence */}
      <div className="grid gap-5 lg:grid-cols-[1.45fr_1fr]">
        {/* Verified Studio Activity */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <BookOpenCheck
                className="h-5 w-5 text-[var(--accent-teal-text)]"
                aria-hidden="true"
              />
              <CardTitle>{t('profile.topics.title')}</CardTitle>
            </div>
            <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
              {t('profile.topics.subtitle')}
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {studioSummaries.map((studioItem) => {
              const style = getTopicVisualStyle(studioItem.topic);
              const topicKey =
                studioItem.topic in TOPIC_I18N_KEYS
                  ? TOPIC_I18N_KEYS[
                      studioItem.topic as keyof typeof TOPIC_I18N_KEYS
                    ]
                  : null;
              const localizedTopic = topicKey ? t(topicKey) : studioItem.topic;
              const statusVariant =
                studioItem.status === 'practiced'
                  ? 'mint'
                  : studioItem.status === 'explored'
                    ? 'amber'
                    : 'neutral';
              const isNotStarted = studioItem.status === 'not-started';

              return (
                <div
                  key={studioItem.problemId}
                  data-testid={`profile-topic-${studioItem.problemId}`}
                  className={`overflow-hidden rounded-2xl border transition-colors ${
                    isNotStarted
                      ? 'border-dashed border-[var(--border-control)] bg-[var(--surface-subtle)]/75'
                      : 'border-[var(--border-subtle)] bg-[var(--surface-subtle)]'
                  }`}
                >
                  <div
                    className={`h-1.5 w-full ${style.accentBarClass} ${isNotStarted ? 'opacity-50' : ''}`}
                    aria-hidden="true"
                  />
                  <div className="flex flex-wrap items-center justify-between gap-3 p-4">
                    <div className="min-w-0 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={style.badgeVariant}>{localizedTopic}</Badge>
                        <Badge variant={statusVariant}>
                          <span
                            aria-hidden="true"
                            className={`h-1.5 w-1.5 rounded-full ${
                              studioItem.status === 'practiced'
                                ? 'bg-[var(--accent-teal-solid)]'
                                : studioItem.status === 'explored'
                                  ? 'bg-[var(--accent-amber)]'
                                  : 'bg-[var(--text-secondary)]'
                            }`}
                          />
                          {t(`profile.topics.status.${studioItem.status}`)}
                        </Badge>
                      </div>
                      <p className="text-base font-bold text-[var(--text-primary)]">
                        {studioItem.problemTitle}
                      </p>
                      <p className="text-xs text-[var(--text-secondary)]">
                        {t('profile.topics.stagesCount', {
                          best: studioItem.bestCompletedStages,
                          total: studioItem.totalStages,
                        })}
                        {' · '}
                        {t('profile.topics.sessionsCount', {
                          count: studioItem.totalSessionsCount,
                        })}
                        {studioItem.activeStudySeconds !== null && (
                          <>
                            {' · '}
                            {formatStudyDuration(studioItem.activeStudySeconds, t)}
                          </>
                        )}
                      </p>
                    </div>
                    <Link
                      to={studioItem.studioPath}
                      className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl border border-[var(--border-control)] bg-[var(--surface-card)] px-3.5 text-sm font-semibold text-[var(--text-primary)] transition-colors hover:border-[var(--accent-blue-border)] hover:text-[var(--accent-blue-text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-blue)]"
                    >
                      {studioItem.totalSessionsCount > 0
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
        <div className="space-y-5">
          <Card className="border-[var(--accent-blue-border)]/70">
            <CardHeader className="pb-3">
              <CardTitle>{t('profile.continue.title')}</CardTitle>
              <p className="text-xs text-[var(--text-secondary)]">
                {t('profile.continue.subtitle')}
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {nextSuggestion && (
                <div className="rounded-2xl border border-[var(--accent-blue-border)] bg-[var(--accent-blue-soft)]/55 p-4 space-y-2">
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-[var(--accent-blue-text)]">
                    <Sparkles className="h-3 w-3" aria-hidden="true" />
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
                    className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-[var(--accent-blue-solid)] px-3.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--accent-blue-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-blue)]"
                  >
                    {nextSuggestion.ctaLabel}
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </Link>
                </div>
              )}

              <div className="grid grid-cols-1 gap-2.5 text-sm sm:grid-cols-2">
                <Link
                  to="/history"
                  className="inline-flex items-center gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-subtle)] px-3 py-2.5 font-semibold text-[var(--text-primary)] transition-colors hover:border-[var(--accent-blue-border)] hover:bg-[var(--surface-elevated)]"
                >
                  <History className="h-4 w-4 shrink-0 text-[var(--accent-coral-text)]" aria-hidden="true" />
                  <span className="truncate">{t('profile.continue.viewHistory')}</span>
                </Link>
                <Link
                  to="/progress"
                  className="inline-flex items-center gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-subtle)] px-3 py-2.5 font-semibold text-[var(--text-primary)] transition-colors hover:border-[var(--accent-blue-border)] hover:bg-[var(--surface-elevated)]"
                >
                  <TrendingUp className="h-4 w-4 shrink-0 text-[var(--accent-green)]" aria-hidden="true" />
                  <span className="truncate">{t('profile.continue.viewProgress')}</span>
                </Link>
                <Link
                  to="/roadmap"
                  className="inline-flex items-center gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-subtle)] px-3 py-2.5 font-semibold text-[var(--text-primary)] transition-colors hover:border-[var(--accent-blue-border)] hover:bg-[var(--surface-elevated)]"
                >
                  <Compass className="h-4 w-4 shrink-0 text-[var(--accent-sky)]" aria-hidden="true" />
                  <span className="truncate">{t('profile.continue.viewRoadmap')}</span>
                </Link>
                <Link
                  to="/problems"
                  className="inline-flex items-center gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-subtle)] px-3 py-2.5 font-semibold text-[var(--text-primary)] transition-colors hover:border-[var(--accent-blue-border)] hover:bg-[var(--surface-elevated)]"
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
              <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
                {t('profile.evidence.subtitle')}
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              <dl className="divide-y divide-[var(--border-subtle)] text-xs">
                <div className="flex items-center justify-between gap-2 py-2 first:pt-0">
                  <dt className="text-[var(--text-secondary)]">
                    {t('profile.evidence.verifiedPractice')}
                  </dt>
                  <dd className="rounded-lg bg-[var(--accent-teal-soft)] px-2 py-0.5 font-mono font-bold text-[var(--accent-teal-text)]">
                    {studyActivity.totalEligibleSessions}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-2 py-2">
                  <dt className="text-[var(--text-secondary)]">
                    {t('profile.evidence.viewedOnly')}
                  </dt>
                  <dd className="rounded-lg bg-[var(--surface-elevated)] px-2 py-0.5 font-mono font-bold text-[var(--text-primary)]">
                    {viewedOnlyCount}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-2 py-2">
                  <dt className="text-[var(--text-secondary)]">
                    {t('profile.evidence.aiConceptual')}
                  </dt>
                  <dd className="rounded-lg bg-[var(--accent-blue-soft)] px-2 py-0.5 font-mono font-bold text-[var(--accent-blue-text)]">
                    {aiConceptualCount}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-2 py-2 last:pb-0">
                  <dt className="text-[var(--text-secondary)]">
                    {t('profile.evidence.bookmarks')}
                  </dt>
                  <dd className="rounded-lg bg-[var(--surface-elevated)] px-2 py-0.5 font-mono font-bold text-[var(--text-secondary)]">
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

      {/* Phase 7A: Miri Islands Prototype Showcase (extensible foundation for Phase 7B map) */}
      <MiriIslandsShowcase sessions={sessions} />
    </div>
  );
}
