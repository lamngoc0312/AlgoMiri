import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  BookOpenCheck,
  BrainCircuit,
  CalendarDays,
  History,
  Search,
  Trash2,
} from 'lucide-react';
import { groupLearningSessionsByProblem } from '../domain/history/problemHistory';
import { defaultLearningRepository } from '../services/learningRepository';
import {
  defaultAiProblemHistoryRepository,
  type AiProblemHistoryRecord,
} from '../services/aiProblemHistoryRepository';
import { getAiGuidedProblemById } from '../domain/problems/libraryCatalog';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { getTopicVisualStyle } from '../styles/topicColors';

type HistoryFilter = 'all' | 'verified' | 'ai' | 'curated' | 'custom';

function formatDate(value: string, locale: string, fallback: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? fallback
    : new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(date);
}

function aiReviewPath(record: AiProblemHistoryRecord): string | null {
  if (record.source === 'curated-ai' && record.problemId) {
    return `/?prefill=${encodeURIComponent(record.problemId)}`;
  }
  if (record.problemStatement) {
    return `/?historyRecord=${encodeURIComponent(record.id)}`;
  }
  return null;
}

export function HistoryPage() {
  const { t, i18n } = useTranslation();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<HistoryFilter>('all');
  const learningLoad = useMemo(() => defaultLearningRepository.loadSessions(), []);
  const [aiLoad, setAiLoad] = useState(() => defaultAiProblemHistoryRepository.load());
  const verifiedProblems = useMemo(
    () => groupLearningSessionsByProblem(learningLoad.sessions),
    [learningLoad.sessions],
  );
  const normalizedQuery = query.trim().toLocaleLowerCase(i18n.resolvedLanguage ?? 'en');
  const matches = (...values: Array<string | null>) =>
    !normalizedQuery ||
    values.some((value) =>
      value?.toLocaleLowerCase(i18n.resolvedLanguage ?? 'en').includes(normalizedQuery),
    );

  const visibleVerified =
    filter === 'all' || filter === 'verified'
      ? verifiedProblems.filter((item) =>
          matches(item.problemTitle, item.problemId, ...item.strategiesExplored),
        )
      : [];
  const visibleAi =
    filter === 'all' || filter === 'ai' || filter === 'curated' || filter === 'custom'
      ? aiLoad.records.filter(
          (record) =>
            (filter !== 'curated' || record.source === 'curated-ai') &&
            (filter !== 'custom' || record.source === 'custom-pasted') &&
            matches(record.title, record.problemId, record.topic),
        )
      : [];

  const removeRecord = (record: AiProblemHistoryRecord) => {
    if (!window.confirm(t('history.deleteConfirm', { title: record.title }))) return;
    const result = defaultAiProblemHistoryRepository.remove(record.id);
    if (result.removed) setAiLoad(defaultAiProblemHistoryRepository.load());
  };

  const locale = i18n.resolvedLanguage ?? 'en';
  const hasAnyHistory = verifiedProblems.length > 0 || aiLoad.records.length > 0;

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <header className="max-w-3xl space-y-3">
        <Badge variant="indigo">
          <History className="h-3.5 w-3.5" aria-hidden="true" />
          {t('history.badge')}
        </Badge>
        <h1 className="text-3xl font-extrabold tracking-tight text-[var(--text-primary)] sm:text-4xl">
          {t('history.title')}
        </h1>
        <p className="text-base leading-relaxed text-[var(--text-secondary)]">
          {t('history.description')}
        </p>
      </header>

      <div className="rounded-2xl border border-[var(--accent-sky-border)] bg-[var(--accent-sky-soft)]/50 p-4 text-sm text-[var(--text-secondary)]">
        <p className="font-semibold text-[var(--text-primary)]">{t('history.localOnlyTitle')}</p>
        <p className="mt-1">{t('history.localOnlyDescription')}</p>
      </div>

      {(learningLoad.warningMessage || aiLoad.warning) && (
        <div role="alert" className="flex items-start gap-3 rounded-2xl border border-[var(--accent-amber-border)] bg-[var(--accent-amber-soft)] p-4 text-sm text-[var(--accent-amber-text)]">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{t('history.storageWarning')}</span>
        </div>
      )}

      <div className="grid gap-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-4 sm:grid-cols-[1fr_220px]">
        <label className="space-y-1.5 text-sm font-semibold text-[var(--text-primary)]">
          <span>{t('history.searchLabel')}</span>
          <span className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-secondary)]" aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t('history.searchPlaceholder')}
              className="h-11 w-full rounded-xl border border-[var(--border-control)] bg-[var(--surface-subtle)] pl-10 pr-3 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-blue-border)] focus:ring-2 focus:ring-[var(--accent-blue-soft)]"
            />
          </span>
        </label>
        <label className="space-y-1.5 text-sm font-semibold text-[var(--text-primary)]">
          <span>{t('history.filterLabel')}</span>
          <select
            value={filter}
            onChange={(event) => setFilter(event.target.value as HistoryFilter)}
            className="h-11 w-full rounded-xl border border-[var(--border-control)] bg-[var(--surface-subtle)] px-3 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-blue-border)]"
          >
            <option value="all">{t('history.filters.all')}</option>
            <option value="verified">{t('history.filters.verified')}</option>
            <option value="ai">{t('history.filters.ai')}</option>
            <option value="curated">{t('history.filters.curated')}</option>
            <option value="custom">{t('history.filters.custom')}</option>
          </select>
        </label>
      </div>

      {!hasAnyHistory ? (
        <Card className="p-8 text-center sm:p-12">
          <History className="mx-auto h-10 w-10 text-[var(--accent-blue-link)]" aria-hidden="true" />
          <h2 className="mt-4 text-xl font-bold text-[var(--text-primary)]">{t('history.emptyTitle')}</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-[var(--text-secondary)]">{t('history.emptyDescription')}</p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Link to="/problems" className="inline-flex h-10 items-center rounded-xl bg-[var(--accent-blue-solid)] px-4 text-sm font-semibold text-white">{t('history.browseProblems')}</Link>
            <Link to="/" className="inline-flex h-10 items-center rounded-xl border border-[var(--border-control)] px-4 text-sm font-semibold text-[var(--text-primary)]">{t('history.analyzeProblem')}</Link>
          </div>
        </Card>
      ) : (
        <>
          <section aria-labelledby="verified-history-title" className="space-y-4">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div>
                <h2 id="verified-history-title" className="flex items-center gap-2 text-2xl font-extrabold text-[var(--text-primary)]">
                  <BookOpenCheck className="h-6 w-6 text-[var(--accent-teal-text)]" aria-hidden="true" />
                  {t('history.verified.title')}
                </h2>
                <p className="mt-1 max-w-3xl text-sm text-[var(--text-secondary)]">{t('history.verified.description')}</p>
              </div>
              <Badge variant="mint">{t('history.problemCount', { count: visibleVerified.length })}</Badge>
            </div>
            {visibleVerified.length === 0 ? (
              <Card className="p-6 text-sm text-[var(--text-secondary)]">{t('history.noMatchingVerified')}</Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {visibleVerified.map((problem) => (
                  <Card key={problem.problemId} className="flex flex-col overflow-hidden">
                    <div className="h-1.5 bg-[var(--accent-teal-solid)]" />
                    <div className="flex flex-1 flex-col p-5">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <h3 className="text-lg font-bold text-[var(--text-primary)]">{problem.problemTitle}</h3>
                        <Badge variant="mint">{t('history.verified.status')}</Badge>
                      </div>
                      <p className="mt-2 text-xs leading-relaxed text-[var(--text-secondary)]">{t('history.verified.notSolved')}</p>
                      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                        <div className="rounded-xl bg-[var(--surface-subtle)] p-3">
                          <dt className="text-xs text-[var(--text-secondary)]">{t('history.sessions')}</dt>
                          <dd className="mt-1 font-mono font-bold text-[var(--text-primary)]">{problem.sessionCount}</dd>
                        </div>
                        <div className="rounded-xl bg-[var(--surface-subtle)] p-3">
                          <dt className="text-xs text-[var(--text-secondary)]">{t('history.bestStages')}</dt>
                          <dd className="mt-1 font-mono font-bold text-[var(--text-primary)]">{problem.bestCompletedStages}/{problem.totalStages}</dd>
                        </div>
                      </dl>
                      <p className="mt-4 inline-flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
                        <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
                        {t('history.recentActivity', { date: formatDate(problem.latestActivityAt, locale, t('history.unknownDate')) })}
                      </p>
                      <Link to={problem.studioPath} className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[var(--accent-teal-solid)] px-4 text-sm font-semibold text-white">
                        {t('history.reopenStudio')} <ArrowRight className="h-4 w-4" aria-hidden="true" />
                      </Link>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </section>

          <section aria-labelledby="ai-history-title" className="space-y-4">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div>
                <h2 id="ai-history-title" className="flex items-center gap-2 text-2xl font-extrabold text-[var(--text-primary)]">
                  <BrainCircuit className="h-6 w-6 text-[var(--accent-blue-link)]" aria-hidden="true" />
                  {t('history.ai.title')}
                </h2>
                <p className="mt-1 max-w-3xl text-sm text-[var(--text-secondary)]">{t('history.ai.description')}</p>
              </div>
              <Badge variant="indigo">{t('history.problemCount', { count: visibleAi.length })}</Badge>
            </div>
            {visibleAi.length === 0 ? (
              <Card className="p-6 text-sm text-[var(--text-secondary)]">{t('history.noMatchingAi')}</Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {visibleAi.map((record) => {
                  const topic = record.topic ?? t('history.ai.unknownTopic');
                  const style = getTopicVisualStyle(topic);
                  const reviewPath = aiReviewPath(record);
                  const verifiedStudioPath = record.problemId && !getAiGuidedProblemById(record.problemId)
                    ? `/studio/${record.problemId}`
                    : null;
                  return (
                    <Card key={record.id} className="flex flex-col overflow-hidden">
                      <div className={`h-1.5 ${style.accentBarClass}`} />
                      <div className="flex flex-1 flex-col p-5">
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="indigo">{t('history.ai.status')}</Badge>
                          <Badge variant={style.badgeVariant}>{topic}</Badge>
                        </div>
                        <h3 className="mt-3 text-lg font-bold text-[var(--text-primary)]">{record.title}</h3>
                        <p className="mt-1 text-xs text-[var(--text-secondary)]">
                          {record.source === 'curated-ai' ? t('history.ai.curatedSource') : t('history.ai.customSource')}
                        </p>
                        <p className="mt-3 text-xs leading-relaxed text-[var(--text-secondary)]">{t('history.ai.notSolved')}</p>
                        <p className="mt-4 inline-flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
                          <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
                          {t('history.savedOn', { date: formatDate(record.updatedAt, locale, t('history.unknownDate')) })}
                        </p>
                        <p className="mt-1 text-xs text-[var(--text-secondary)]">
                          {record.problemStatement ? t('history.ai.statementStored') : t('history.ai.metadataOnly')}
                        </p>
                        <div className="mt-5 flex flex-wrap gap-2">
                          {reviewPath ? (
                            <Link to={reviewPath} className="inline-flex h-9 flex-1 items-center justify-center rounded-xl bg-[var(--accent-blue-solid)] px-3 text-sm font-semibold text-white">{t('history.review')}</Link>
                          ) : (
                            <span className="inline-flex min-h-9 flex-1 items-center text-xs text-[var(--text-secondary)]">{t('history.ai.reviewUnavailable')}</span>
                          )}
                          {verifiedStudioPath && (
                            <Link to={verifiedStudioPath} className="inline-flex h-9 items-center justify-center rounded-xl border border-[var(--border-control)] px-3 text-sm font-semibold text-[var(--text-primary)]">{t('history.openStudio')}</Link>
                          )}
                          <Button variant="ghost" size="sm" aria-label={t('history.removeAria', { title: record.title })} onClick={() => removeRecord(record)}>
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                            {t('history.remove')}
                          </Button>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
