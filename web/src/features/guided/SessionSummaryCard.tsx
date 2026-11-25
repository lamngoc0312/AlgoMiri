import { Link } from 'react-router-dom';
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
import { formatOutcomeLabel } from '../../domain/learning/analytics';
import { getSkillDefinition } from '../../domain/learning/skills';
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
            <Award className="h-5 w-5 text-[var(--accent-teal-text)]" aria-hidden="true" />
            <CardTitle className="text-lg">
              Local Session Summary · {problem.title}
            </CardTitle>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {savedSession ? (
              <>
                <Badge variant="mint">
                  <HardDrive className="h-3 w-3" aria-hidden="true" />
                  Saved to This Browser
                </Badge>
                <Badge variant="indigo">
                  {formatOutcomeLabel(savedSession.outcome)}
                </Badge>
              </>
            ) : (
              <Badge variant="demo">Local Session Only</Badge>
            )}
          </div>
        </div>
        <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
          Verified activity from this browser session. Skipped stages, viewing visuals alone, and repeated clicks are never counted as completed.
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
              Strategies Explored
            </p>
            <p className="mt-1 font-mono text-xl font-extrabold text-[var(--text-primary)]">
              {exploredStrategyObjects.length} / {problem.supportedStrategies.length}
            </p>
          </div>

          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-subtle)] p-3.5">
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
              Predictions Attempted
            </p>
            <p
              data-testid="summary-predictions-attempted"
              className="mt-1 font-mono text-xl font-extrabold text-[var(--text-primary)]"
            >
              {predictionStats.questionsAttempted}
            </p>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">
              <span className="font-semibold text-[var(--accent-teal-text)]">
                {predictionStats.firstTryCorrect} first-try
              </span>
              {predictionStats.solvedAfterRetry > 0 && (
                <> · {predictionStats.solvedAfterRetry} after retry</>
              )}
              {predictionStats.skippedCount > 0 && (
                <> · {predictionStats.skippedCount} skipped</>
              )}
            </p>
          </div>

          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-subtle)] p-3.5">
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
              Hints Used
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
            Strategies Explored
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
                {strat.name} · {strat.timeComplexity} time /{' '}
                {strat.spaceComplexity} space
              </li>
            ))}
          </ul>
        </div>

        {/* Verified Concepts Completed */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
            Verified Concepts Completed ({verifiedStages.length} /{' '}
            {lesson.stages.length})
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
              No guided stage checks completed yet. Answer a stage check correctly to record it here.
            </p>
          )}
          {skippedStages.length > 0 && (
            <p className="mt-2 text-xs text-[var(--accent-amber-text)]">
              Skipped stages ({skippedStages.length}):{' '}
              {skippedStages.map((s) => s.shortTitle).join(', ')} — revisit anytime to complete them.
            </p>
          )}
          {skippedAfterAttemptStages.length > 0 && (
            <p className="mt-1 text-xs text-[var(--accent-amber-text)]">
              Skipped after attempt ({skippedAfterAttemptStages.length}):{' '}
              {skippedAfterAttemptStages.map((s) => s.shortTitle).join(', ')} — retry anytime for verified completion.
            </p>
          )}
        </div>

        {/* Skills Practiced in This Session */}
        {uniquePracticedSkillIds.length > 0 && (
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
              Skills with Recorded Practice Evidence
            </h3>
            <ul className="mt-2 flex flex-wrap gap-2">
              {uniquePracticedSkillIds.map((skillId) => (
                <li key={skillId}>
                  <Badge variant="indigo">
                    {getSkillDefinition(skillId).name}
                  </Badge>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Suggested Next Learning Activities */}
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-subtle)] p-4 space-y-2.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--text-primary)]">
            <Sparkles className="h-4 w-4 text-[var(--accent-blue-link)]" aria-hidden="true" />
            Suggested Next Learning Activity
          </div>
          <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
            {lesson.suggestedNextActivity}
          </p>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {!savedSession && onSaveSession && (
              <Button variant="primary" size="sm" onClick={onSaveSession}>
                <Save className="h-3.5 w-3.5" aria-hidden="true" />
                Save Session to Local History
              </Button>
            )}
            <Link
              to="/progress"
              className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-[var(--accent-blue-solid)] px-3.5 text-xs font-semibold text-white transition-colors hover:bg-[var(--accent-blue-hover)]"
            >
              <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />
              View Learning Progress
            </Link>
            <Button variant="outline" size="sm" onClick={onSwitchToExplore}>
              Try Edge Cases in Free Exploration
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Button>
            <Button variant="outline" size="sm" onClick={onRestartLesson}>
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              Restart Guided Lesson
            </Button>
            <Link
              to="/problems"
              className="inline-flex h-9 items-center gap-1.5 rounded-xl px-3 text-xs font-semibold text-[var(--accent-blue-text)] hover:bg-[var(--accent-blue-soft)]"
            >
              <Compass className="h-3.5 w-3.5" aria-hidden="true" />
              Try Another Problem
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
            <strong>Local browser history only:</strong> Saved sessions are stored
            only in this browser and are not synced across devices. Finishing a
            guided lesson records guided progress, not independent mastery. Restarting
            begins a fresh session without altering previously saved records.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
