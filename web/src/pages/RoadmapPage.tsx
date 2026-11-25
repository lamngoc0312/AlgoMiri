import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Compass,
  HardDrive,
  Info,
  Layers,
  Lock,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import {
  buildPersonalizedRoadmap,
  type RoadmapSkillStatus,
} from '../domain/learning/roadmapEngine';
import { DEMO_ROADMAP_MILESTONES } from '../domain/problems/demoCatalog';
import {
  defaultLearningRepository,
  type LearningRepository,
} from '../services/learningRepository';
import {
  localizeAlternativeActivityCta,
  localizeDifficulty,
  localizeLearningPathStep,
  localizePlannedMilestone,
  localizeRoadmapRecommendation,
  localizeRoadmapSkillStatusReason,
  localizeRoadmapStatus,
  localizeSkillName,
} from '../i18n/learningLocalization';
import { InteractiveSkillMap } from '../features/roadmap/InteractiveSkillMap';
import { Badge } from '../components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';

interface RoadmapPageProps {
  repository?: LearningRepository;
}

function statusBadgeVariant(
  status: RoadmapSkillStatus,
): 'mint' | 'indigo' | 'amber' | 'neutral' {
  switch (status) {
    case 'Strong Guided Recall':
      return 'mint';
    case 'Guided Progress':
      return 'indigo';
    case 'Needs Practice':
      return 'amber';
    default:
      return 'neutral';
  }
}

export function RoadmapPage({
  repository = defaultLearningRepository,
}: RoadmapPageProps) {
  const { t } = useTranslation();
  const [loadState] = useState(() => repository.loadSessions());
  const roadmap = useMemo(
    () => buildPersonalizedRoadmap(loadState.sessions),
    [loadState.sessions],
  );

  const plannedMilestones = DEMO_ROADMAP_MILESTONES.filter(
    (m) => m.status === 'planned',
  );

  const { recommendedNext } = roadmap;
  const localizedRec = localizeRoadmapRecommendation(
    t,
    recommendedNext,
    roadmap,
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <Compass
              className="h-5 w-5 text-[var(--accent-blue-link)]"
              aria-hidden="true"
            />
            <h1 className="text-2xl font-extrabold tracking-tight text-[var(--text-primary)] sm:text-3xl">
              {t('roadmap.title')}
            </h1>
            <Badge variant="indigo">
              <HardDrive className="h-3 w-3" aria-hidden="true" />
              {t('roadmap.personalizedBadge')}
            </Badge>
            <Badge variant="neutral">{t('roadmap.deterministicBadge')}</Badge>
          </div>
          <p className="max-w-2xl text-base leading-relaxed text-[var(--text-secondary)]">
            {t('roadmap.subtitle')}
          </p>
        </div>

        <Link
          to="/progress"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[var(--border-control)] bg-[var(--surface-card)] px-4 text-sm font-semibold text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-elevated)]"
        >
          <TrendingUp
            className="h-4 w-4 text-[var(--accent-blue-link)]"
            aria-hidden="true"
          />
          {t('roadmap.viewProgressHistory')}
        </Link>
      </div>

      {/* Transparent Local-Only & Non-Mastery Notice */}
      <div
        role="note"
        className="flex items-start gap-2.5 rounded-2xl border border-[var(--accent-blue-border)] bg-[var(--accent-blue-soft)]/55 px-4 py-3 text-xs leading-relaxed text-[var(--text-primary)]"
      >
        <Info
          className="h-4 w-4 shrink-0 text-[var(--accent-blue-text)] mt-0.5"
          aria-hidden="true"
        />
        <p>
          <strong>{t('roadmap.noticeLead')}</strong>{' '}
          {roadmap.isFirstTimeLearner
            ? t('roadmap.noticeFirstTime')
            : t('roadmap.noticePersonalized', { count: roadmap.totalSessions })}
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

      {/* Recommended Next Activity Hero Card */}
      <section aria-labelledby="recommended-next-heading">
        <Card className="border-2 border-[#397BDB]/50 bg-gradient-to-br from-[var(--surface-card)] to-[var(--accent-blue-soft)]/55">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Sparkles
                  className="h-4 w-4 text-[var(--accent-blue-link)]"
                  aria-hidden="true"
                />
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--accent-blue-text)]">
                  {t('roadmap.recommendedLabel')}
                </span>
              </div>
              <Badge variant="indigo">
                {roadmap.isFirstTimeLearner
                  ? t('roadmap.badges.starter')
                  : recommendedNext.category === 'review-weak-skill' ||
                      recommendedNext.category === 'verify-recall'
                    ? t('roadmap.badges.review')
                    : recommendedNext.category === 'resume-lesson'
                      ? t('roadmap.badges.incomplete')
                      : t('roadmap.badges.next')}
              </Badge>
            </div>
            <CardTitle
              id="recommended-next-heading"
              className="text-xl sm:text-2xl mt-1"
            >
              {localizedRec.title}
            </CardTitle>
            <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
              {localizedRec.summary}
            </p>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Explicit Explanation of Why Recommended */}
            <div className="rounded-xl border border-[var(--accent-blue-border)] bg-[var(--surface-card)] p-4 space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--accent-blue-text)]">
                {t('roadmap.whyRecommended')}
              </h3>
              <ul className="space-y-1.5 text-xs leading-relaxed text-[var(--text-primary)]">
                {localizedRec.whyBullets.map((bullet) => (
                  <li key={bullet} className="flex items-start gap-2">
                    <CheckCircle2
                      className="h-3.5 w-3.5 shrink-0 text-[var(--accent-teal-text)] mt-0.5"
                      aria-hidden="true"
                    />
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
              {recommendedNext.focusSkills.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-xs font-semibold text-[var(--text-secondary)]">
                    {t('roadmap.focusSkills')}
                  </span>
                  {recommendedNext.focusSkills.map((skillId) => (
                    <Badge key={skillId} variant="indigo">
                      {localizeSkillName(t, skillId)}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Primary CTA + Alternative Verified Problems (never locked out) */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <Link
                to={recommendedNext.targetPath}
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-[var(--accent-blue-solid)] px-5 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-[var(--accent-blue-hover)]"
              >
                {localizedRec.ctaLabel}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>

              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="font-semibold text-[var(--text-secondary)]">
                  {t('roadmap.orChooseAnother')}
                </span>
                {roadmap.alternativeActivities.map((alt) => (
                  <Link
                    key={alt.id}
                    to={alt.targetPath}
                    className="inline-flex h-9 items-center gap-1 rounded-xl border border-[var(--border-control)] bg-[var(--surface-card)] px-3 font-semibold text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-elevated)]"
                  >
                    {localizeAlternativeActivityCta(t, alt, roadmap)}
                  </Link>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Interactive Accessible Skill Prerequisite Map */}
      <section aria-label={t('roadmap.skillMapRegion')}>
        <InteractiveSkillMap
          skillNodes={roadmap.skillNodes}
          graphValidation={roadmap.graphValidation}
          recommendedSkillIds={recommendedNext.focusSkills}
        />
      </section>

      {/* Current Learning Path Across Verified Studios */}
      <section aria-labelledby="learning-path-heading" className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2
              id="learning-path-heading"
              className="text-xl font-extrabold tracking-tight text-[var(--text-primary)]"
            >
              {t('roadmap.learningPathHeading')}
            </h2>
            <p className="text-xs text-[var(--text-secondary)]">
              {t('roadmap.learningPathDescription')}
            </p>
          </div>
          <Link
            to="/problems"
            className="text-xs font-semibold text-[var(--accent-blue-link)] hover:underline"
          >
            {t('roadmap.browseLibrary')} &rarr;
          </Link>
        </div>

        <ol className="grid gap-4 md:grid-cols-3">
          {roadmap.learningPath.map((step, idx) => {
            const localizedStep = localizeLearningPathStep(t, step);
            return (
              <li key={step.problemId}>
                <Card
                  className={`h-full flex flex-col justify-between ${
                    step.isRecommendedNext
                      ? 'border-2 border-[#397BDB]/70'
                      : 'border-[var(--border-subtle)]'
                  }`}
                >
                  <CardHeader>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-mono text-xs font-bold text-[var(--accent-blue-link)]">
                        {t('roadmap.stepLabel', {
                          index: idx + 1,
                          difficulty: localizeDifficulty(t, step.difficulty),
                        })}
                      </span>
                      <Badge variant={statusBadgeVariant(step.status)}>
                        {localizeRoadmapStatus(t, step.status)}
                      </Badge>
                    </div>
                    <CardTitle className="mt-1 text-lg flex items-center gap-2">
                      {step.problemTitle}
                      {step.isRecommendedNext && (
                        <Badge variant="indigo" className="text-xs">
                          {t('roadmap.nextBadge')}
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="flex flex-1 flex-col justify-between gap-4">
                    <div className="space-y-3 text-xs">
                      <p className="text-[var(--text-secondary)] leading-relaxed">
                        {localizedStep.note}
                      </p>

                      <div>
                        <p className="font-semibold text-[var(--text-primary)]">
                          {t('roadmap.skillsPracticed')}
                        </p>
                        <div className="mt-1 flex flex-wrap gap-1.5">
                          {step.focusSkills.map((skillId) => (
                            <span
                              key={skillId}
                              className="rounded-md border border-[var(--border-subtle)] bg-[var(--surface-subtle)] px-2 py-0.5 text-xs text-[var(--text-primary)]"
                            >
                              {localizeSkillName(t, skillId)}
                            </span>
                          ))}
                        </div>
                      </div>

                      {step.prerequisiteSkills.length > 0 && (
                        <div>
                          <p className="font-semibold text-[var(--text-primary)]">
                            {t('roadmap.suggestedPrerequisites')}
                          </p>
                          <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
                            {step.prerequisiteSkills
                              .map((id) => localizeSkillName(t, id))
                              .join(', ')}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="border-t border-[var(--border-subtle)] pt-3">
                      <Link
                        to={step.studioPath}
                        className={`inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-xl text-xs font-semibold transition-colors ${
                          step.isRecommendedNext
                            ? 'bg-[var(--accent-blue-solid)] text-white hover:bg-[var(--accent-blue-hover)]'
                            : 'border border-[var(--border-control)] bg-[var(--surface-subtle)] text-[var(--accent-blue-text)] hover:bg-[var(--accent-blue-soft)]'
                        }`}
                      >
                        {localizedStep.ctaLabel}
                        <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </li>
            );
          })}
        </ol>
      </section>

      {/* Skills Needing Review & Previously Practiced Concepts */}
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <AlertTriangle
                  className="h-4 w-4 text-[#C28219]"
                  aria-hidden="true"
                />
                <CardTitle>{t('roadmap.needsReviewTitle')}</CardTitle>
              </div>
              <Badge
                variant={
                  roadmap.skillsNeedingReview.length > 0 ? 'amber' : 'mint'
                }
              >
                {roadmap.skillsNeedingReview.length > 0
                  ? t('roadmap.toReviewCount', {
                      count: roadmap.skillsNeedingReview.length,
                    })
                  : t('roadmap.noneFlagged')}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {roadmap.skillsNeedingReview.length > 0 ? (
              <ul className="space-y-3">
                {roadmap.skillsNeedingReview.map((node) => (
                  <li
                    key={node.skill.id}
                    className="rounded-xl border border-[#F2B84B]/60 bg-[var(--accent-amber-soft)]/60 p-3.5 space-y-1.5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-sm font-bold text-[var(--text-primary)]">
                        {localizeSkillName(t, node.skill.id)}
                      </span>
                      <Badge variant="amber">
                        {localizeRoadmapStatus(t, node.status)}
                      </Badge>
                    </div>
                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                      {localizeRoadmapSkillStatusReason(t, node)}
                    </p>
                    <Link
                      to={node.skill.recommendedStudioPath}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--accent-amber-text)] hover:underline"
                    >
                      {t('roadmap.reviewInStudio')}
                      <ArrowRight className="h-3 w-3" aria-hidden="true" />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
                {roadmap.isFirstTimeLearner
                  ? t('roadmap.noReviewFirstTime')
                  : t('roadmap.noReviewReturning')}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <BookOpen
                  className="h-4 w-4 text-[var(--accent-teal-text)]"
                  aria-hidden="true"
                />
                <CardTitle>{t('roadmap.practicedConceptsTitle')}</CardTitle>
              </div>
              <Badge variant="indigo">
                {t('roadmap.activeSkillsCount', {
                  active: roadmap.practicedSkills.length,
                  total: roadmap.skillNodes.length,
                })}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {roadmap.practicedSkills.length > 0 ? (
              <ul className="space-y-2.5">
                {roadmap.practicedSkills.map((node) => (
                  <li
                    key={node.skill.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-subtle)] px-3.5 py-2.5 text-xs"
                  >
                    <div>
                      <p className="font-bold text-[var(--text-primary)]">
                        {localizeSkillName(t, node.skill.id)}
                      </p>
                      <p className="text-xs text-[var(--text-secondary)]">
                        {t('roadmap.practicedSummary', {
                          firstTry: node.firstTryCount,
                          assisted: node.assistedCount,
                          skipped: node.skippedCount,
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={statusBadgeVariant(node.status)}>
                        {localizeRoadmapStatus(t, node.status)}
                      </Badge>
                      <Link
                        to={node.skill.recommendedStudioPath}
                        className="font-semibold text-[var(--accent-blue-link)] hover:underline"
                      >
                        {t('roadmap.revisit')}
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
                {t('roadmap.noPracticedConcepts')}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Future Planned Curriculum (clearly separated from live verified Studios) */}
      <Card className="border-dashed border-[var(--border-control)]">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <Layers
                className="h-4 w-4 text-[var(--text-secondary)]"
                aria-hidden="true"
              />
              <CardTitle className="text-base">
                {t('roadmap.plannedTitle')}
              </CardTitle>
            </div>
            <Badge variant="neutral">{t('roadmap.plannedBadge')}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <ul className="grid gap-3 md:grid-cols-3 text-xs">
            {plannedMilestones.map((m) => {
              const localized = localizePlannedMilestone(t, m);
              return (
                <li
                  key={m.id}
                  className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-subtle)]/60 p-3.5 space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-[var(--text-primary)]">
                      {localized.title}
                    </span>
                    <Lock
                      className="h-3.5 w-3.5 text-[var(--text-secondary)]"
                      aria-hidden="true"
                    />
                  </div>
                  <p className="text-[var(--text-secondary)] leading-relaxed">
                    {localized.description}
                  </p>
                  <p className="text-xs font-medium text-[var(--text-secondary)]">
                    {t('roadmap.plannedAnchor', { problem: m.sampleProblem })}
                  </p>
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
