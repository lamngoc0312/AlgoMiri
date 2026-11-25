import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowRight,
  Award,
  CheckCircle2,
  Compass,
  HardDrive,
  Info,
  Lightbulb,
  RotateCcw,
  Save,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import type { ProblemSpec } from '../../domain/problems/types';
import type { ProblemLesson } from '../../domain/core/types';
import type {
  PredictionSummaryStats,
  StageStatusMap,
} from '../../domain/learning/session';
import type { LearningSession } from '../../domain/learning/types';
import {
  localizeSessionOutcome,
  localizeSkillName,
} from '../../i18n/learningLocalization';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';

interface SessionSummaryCardProps {
  problem: ProblemSpec;
  lesson: ProblemLesson;
  strategiesExplored: Set<string>;
  stageStatuses: StageStatusMap;
  predictionStats: PredictionSummaryStats;
  hintsUsed: number;
  savedSession?: LearningSession | null;
  saveWarning?: string | null;
  onSaveSession?: () => void;
  onSwitchToExplore: () => void;
  onRestartLesson: () => void;
}

export function SessionSummaryCard({
  problem,
  lesson,
  strategiesExplored,
  stageStatuses,
  predictionStats,
  hintsUsed,
  savedSession = null,
  saveWarning = null,
  onSaveSession,
  onSwitchToExplore,
  onRestartLesson,
}: SessionSummaryCardProps) {
  const { t } = useTranslation();

  const verifiedStages = lesson.stages.filter(
    (s) => stageStatuses[s.id] === 'completed',
  );
  const skippedStages = lesson.stages.filter(
    (s) => stageStatuses[s.id] === 'skipped',
  );
  const skippedAfterAttemptStages = lesson.stages.filter(
    (s) => stageStatuses[s.id] === 'skipped-after-attempt',
  );
  const exploredStrategyObjects = problem.supportedStrategies.filter((s) =>
    strategiesExplored.has(s.id),
  );

  const uniquePracticedSkillIds = savedSession
    ? Array.from(
        new Set(
          savedSession.skillEvidence
            .filter((ev) => ev.evidenceLevel !== 'viewed')
            .map((ev) => ev.skillId),
        ),
      )
    : [];

  return (
    <Card className="border-[#15A897]/50">
      <CardHeader className="border-b border-[var(--border-subtle)] bg-[var(--accent-teal-soft)]/50">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Award
              className="h-5 w-5 text-[var(--accent-teal-text)]"
              aria-hidden="true"
            />
            <CardTitle className="text-lg">
              {t('guided.summary.title', { problem: problem.title })}
            </CardTitle>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {savedSession ? (
              <>
                <Badge variant="mint">
                  <HardDrive className="h-3 w-3" aria-hidden="true" />
                  {t('guided.summary.savedToBrowser')}
                </Badge>
                <Badge variant="indigo">
                  {localizeSessionOutcome(t, savedSession.outcome)}
                </Badge>
              </>
            ) : (
              <Badge variant="demo">
                {t('guided.summary.localOnlyBadge')}
              </Badge>
            )}
          </div>
        </div>
        <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
          {t('guided.summary.subtitle')}
        </p>
      </CardHeader>

      <CardContent className="space-y-5 pt-5">
        {saveWarning && (
          <div
            role="alert"
            className="rounded-xl border border-[#F2B84B] bg-[var(--accent-amber-soft)] px-3.5 py-2.5 text-xs text-[var(--accent-amber-text)]"
          >
            {saveWarning}
          </div>
        )}

        {/* Metrics Row */}
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-subtle)] p-3.5">
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
              {t('guided.summary.strategiesExplored')}
            </p>
            <p className="mt-1 font-mono text-xl font-extrabold text-[var(--text-primary)]">
              {exploredStrategyObjects.length} /{' '}
              {problem.supportedStrategies.length}
            </p>
          </div>

          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-subtle)] p-3.5">
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
              {t('guided.summary.predictionsAttempted')}
            </p>
            <p
              data-testid="summary-predictions-attempted"
              className="mt-1 font-mono text-xl font-extrabold text-[var(--text-primary)]"
            >
              {predictionStats.questionsAttempted}
            </p>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">
              <span className="font-semibold text-[var(--accent-teal-text)]">
                {t('guided.summary.firstTryCount', {
                  count: predictionStats.firstTryCorrect,
                })}
              </span>
              {predictionStats.solvedAfterRetry > 0 && (
                <>
                  {' · '}
                  {t('guided.summary.afterRetryCount', {
                    count: predictionStats.solvedAfterRetry,
                  })}
                </>
              )}
              {predictionStats.skippedCount > 0 && (
                <>
                  {' · '}
                  {t('guided.summary.skippedCount', {
                    count: predictionStats.skippedCount,
                  })}
                </>
              )}
            </p>
          </div>

          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-subtle)] p-3.5">
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
              {t('guided.summary.hintsUsed')}
            </p>
            <p
              data-testid="summary-hints-used"
              className="mt-1 flex items-center gap-1.5 font-mono text-xl font-extrabold text-[var(--text-primary)]"
            >
              <Lightbulb
                className="h-4 w-4 text-[#F2B84B]"
                aria-hidden="true"
              />
              {hintsUsed}
            </p>
          </div>
        </div>

        {/* Strategies Explored List */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
            {t('guided.summary.strategiesExplored')}
          </h3>
          <ul className="mt-2 space-y-1.5">
            {exploredStrategyObjects.map((strat) => (
              <li
                key={strat.id}
                className="flex items-center gap-2 text-xs font-medium text-[var(--text-primary)]"
              >
                <CheckCircle2
                  className="h-4 w-4 shrink-0 text-[var(--accent-teal-text)]"
                  aria-hidden="true"
                />
                {t('guided.summary.strategyComplexity', {
                  name: strat.name,
                  time: strat.timeComplexity,
                  space: strat.spaceComplexity,
                })}
              </li>
            ))}
          </ul>
        </div>

        {/* Verified Concepts Completed */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
            {t('guided.summary.verifiedConcepts', {
              completed: verifiedStages.length,
              total: lesson.stages.length,
            })}
          </h3>
          {verifiedStages.length > 0 ? (
            <ul className="mt-2 flex flex-wrap gap-2">
              {verifiedStages.map((stage) => (
                <li key={stage.id}>
                  <Badge variant="mint">{stage.conceptLearned}</Badge>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-1.5 text-xs text-[var(--text-secondary)]">
              {t('guided.summary.noVerifiedStages')}
            </p>
          )}
          {skippedStages.length > 0 && (
            <p className="mt-2 text-xs text-[var(--accent-amber-text)]">
              {t('guided.summary.skippedStagesNote', {
                count: skippedStages.length,
                stages: skippedStages.map((s) => s.shortTitle).join(', '),
              })}
            </p>
          )}
          {skippedAfterAttemptStages.length > 0 && (
            <p className="mt-1 text-xs text-[var(--accent-amber-text)]">
              {t('guided.summary.skippedAfterAttemptNote', {
                count: skippedAfterAttemptStages.length,
                stages: skippedAfterAttemptStages
                  .map((s) => s.shortTitle)
                  .join(', '),
              })}
            </p>
          )}
        </div>

        {/* Skills Practiced in This Session */}
        {uniquePracticedSkillIds.length > 0 && (
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
              {t('guided.summary.skillsPracticed')}
            </h3>
            <ul className="mt-2 flex flex-wrap gap-2">
              {uniquePracticedSkillIds.map((skillId) => (
                <li key={skillId}>
                  <Badge variant="indigo">
                    {localizeSkillName(t, skillId)}
                  </Badge>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Suggested Next Learning Activities */}
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-subtle)] p-4 space-y-2.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--text-primary)]">
            <Sparkles
              className="h-4 w-4 text-[var(--accent-blue-link)]"
              aria-hidden="true"
            />
            {t('guided.summary.suggestedNextTitle')}
          </div>
          <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
            {lesson.suggestedNextActivity}
          </p>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {!savedSession && onSaveSession && (
              <Button variant="primary" size="sm" onClick={onSaveSession}>
                <Save className="h-3.5 w-3.5" aria-hidden="true" />
                {t('guided.summary.saveToLocalHistory')}
              </Button>
            )}
            <Link
              to="/progress"
              className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-[var(--accent-blue-solid)] px-3.5 text-xs font-semibold text-white transition-colors hover:bg-[var(--accent-blue-hover)]"
            >
              <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />
              {t('guided.summary.viewLearningProgress')}
            </Link>
            <Button variant="outline" size="sm" onClick={onSwitchToExplore}>
              {t('guided.summary.tryFreeExploration')}
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Button>
            <Button variant="outline" size="sm" onClick={onRestartLesson}>
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              {t('guided.summary.restartLesson')}
            </Button>
            <Link
              to="/problems"
              className="inline-flex h-9 items-center gap-1.5 rounded-xl px-3 text-xs font-semibold text-[var(--accent-blue-text)] hover:bg-[var(--accent-blue-soft)]"
            >
              <Compass className="h-3.5 w-3.5" aria-hidden="true" />
              {t('guided.summary.tryAnotherProblem')}
            </Link>
          </div>
        </div>

        {/* Honest Mastery & Local Storage Disclaimer */}
        <div
          role="note"
          className="flex items-start gap-2 rounded-xl border border-[#F2B84B]/60 bg-[var(--accent-amber-soft)]/70 px-3.5 py-3 text-xs leading-relaxed text-[var(--text-primary)]"
        >
          <Info
            className="h-4 w-4 shrink-0 text-[var(--accent-amber-text)] mt-0.5"
            aria-hidden="true"
          />
          <p>
            <strong>{t('guided.summary.localDisclaimerLead')}</strong>{' '}
            {t('guided.summary.localDisclaimerBody')}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
