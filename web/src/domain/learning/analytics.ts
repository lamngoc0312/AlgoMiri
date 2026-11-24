import { getAllProblemModules } from '../problems/registry';
import {
  summarizePredictions,
  type PredictionRecord,
  type StageStatusMap,
} from './session';
import {
  SKILL_REGISTRY,
  getSkillsForPrediction,
  getSkillsForStage,
  getSkillsForStrategy,
} from './skills';
import type {
  EvidenceLevel,
  LearningAttempt,
  LearningEvent,
  LearningProgressSummary,
  LearningSession,
  PracticeSuggestion,
  ProblemProgressSummary,
  SessionOutcome,
  SkillEvidence,
  SkillId,
  SkillProgressLabel,
  SkillProgressSummary,
} from './types';

let sessionCounter = 0;

export function createSessionId(problemId: string, now = Date.now()): string {
  sessionCounter += 1;
  const randomSuffix = Math.random().toString(36).slice(2, 8);
  return `${problemId}-${now}-${sessionCounter}-${randomSuffix}`;
}

export interface BuildSessionParams {
  sessionId: string;
  problemId: string;
  problemTitle: string;
  mode: 'guided' | 'explore';
  strategiesExplored: Iterable<string>;
  startedAt: string;
  completedAt?: string;
  stageIds: string[];
  stageStatuses: StageStatusMap;
  /** Optional explicit set of stage IDs that were skipped at any point in this session (preserved even if later revisited & completed). */
  previouslySkippedStageIds?: Iterable<string>;
  hintsByStage: Record<string, number>;
  predictionRecords: Record<string, PredictionRecord>;
  events?: LearningEvent[];
}

export function determineSessionOutcome(
  totalStages: number,
  completedStagesCount: number,
  skippedStagesCount: number,
  attemptedStagesCount: number,
  predictionsAttempted: number,
): SessionOutcome {
  if (totalStages > 0 && completedStagesCount === totalStages) {
    return 'completed-guided';
  }
  if (completedStagesCount > 0 && skippedStagesCount > 0) {
    return 'completed-with-skips';
  }
  if (
    completedStagesCount > 0 ||
    attemptedStagesCount > 0 ||
    predictionsAttempted > 0
  ) {
    return 'partial-attempt';
  }
  return 'viewed-only';
}

export function formatOutcomeLabel(outcome: SessionOutcome): string {
  switch (outcome) {
    case 'completed-guided':
      return 'Guided Lesson Completed';
    case 'completed-with-skips':
      return 'Completed with Skips';
    case 'partial-attempt':
      return 'Partial Practice';
    case 'viewed-only':
      return 'Viewed Only';
  }
}

/**
 * Pure deterministic builder converting live session.ts state into a persisted LearningSession
 * with honest LearningAttempt and SkillEvidence records.
 */
export function buildLearningSession(
  params: BuildSessionParams,
): LearningSession {
  const completedAt = params.completedAt ?? new Date().toISOString();
  const strategiesExplored = Array.from(new Set(params.strategiesExplored));
  const predictionSummary = summarizePredictions(params.predictionRecords);

  const stageStatusesCopy: StageStatusMap = {};
  for (const stageId of params.stageIds) {
    stageStatusesCopy[stageId] = params.stageStatuses[stageId] ?? 'unvisited';
  }

  let completedStagesCount = 0;
  let skippedStagesCount = 0;
  let attemptedStagesCount = 0;

  for (const stageId of params.stageIds) {
    const status = stageStatusesCopy[stageId];
    if (status === 'completed') {
      completedStagesCount += 1;
    } else if (status === 'skipped' || status === 'skipped-after-attempt') {
      skippedStagesCount += 1;
      if (status === 'skipped-after-attempt') {
        attemptedStagesCount += 1;
      }
    } else if (status === 'attempted') {
      attemptedStagesCount += 1;
    }
  }

  const hintsByStageCopy: Record<string, number> = {};
  let hintsUsed = 0;
  for (const [stageId, count] of Object.entries(params.hintsByStage)) {
    const safeCount = Math.max(0, Math.floor(count));
    hintsByStageCopy[stageId] = safeCount;
    hintsUsed += safeCount;
  }

  const attempts: LearningAttempt[] = [];
  const skillEvidence: SkillEvidence[] = [];
  let evidenceIndex = 0;

  const pushEvidence = (
    skillIds: SkillId[],
    source: SkillEvidence['source'],
    evidenceLevel: EvidenceLevel,
  ) => {
    for (const skillId of skillIds) {
      evidenceIndex += 1;
      skillEvidence.push({
        id: `${params.sessionId}:ev-${evidenceIndex}`,
        skillId,
        sessionId: params.sessionId,
        problemId: params.problemId,
        source,
        evidenceLevel,
        recordedAt: completedAt,
      });
    }
  };

  const previouslySkippedSet = new Set<string>(
    params.previouslySkippedStageIds ?? [],
  );
  for (const ev of params.events ?? []) {
    if (ev.type === 'stage-skipped' && ev.stageId) {
      previouslySkippedSet.add(ev.stageId);
    }
  }

  // 1. Guided stage attempts & views (never awards 'independently-demonstrated')
  for (const stageId of params.stageIds) {
    const status = stageStatusesCopy[stageId];
    if (status === 'unvisited') continue;

    const skillIds = getSkillsForStage(params.problemId, stageId);
    const stageHints = hintsByStageCopy[stageId] ?? 0;

    if (status === 'completed') {
      const stageEvents = (params.events ?? []).filter(
        (e) => e.type === 'stage-answered' && e.stageId === stageId,
      );
      const wrongAnswersBeforeComplete = stageEvents.filter(
        (e) => e.correct === false,
      ).length;
      const wasPreviouslySkipped = previouslySkippedSet.has(stageId);
      // Revisiting a previously skipped stage and answering correctly must NOT inflate first-try evidence
      const hadAssistance =
        stageHints > 0 || wrongAnswersBeforeComplete > 0 || wasPreviouslySkipped;
      const evidenceLevel: EvidenceLevel = hadAssistance
        ? 'correct-with-assistance'
        : 'first-try-correct';

      attempts.push({
        id: `${params.sessionId}:stage:${stageId}`,
        source: 'guided-stage',
        targetId: stageId,
        skillIds,
        correct: true,
        firstTry: !hadAssistance,
        retries:
          wrongAnswersBeforeComplete + (wasPreviouslySkipped ? 1 : 0),
        hintsUsed: stageHints,
        skipped: false,
        evidenceLevel,
      });
      pushEvidence(skillIds, 'guided-stage', evidenceLevel);
    } else if (status === 'attempted' || status === 'skipped-after-attempt') {
      attempts.push({
        id: `${params.sessionId}:stage:${stageId}`,
        source: 'guided-stage',
        targetId: stageId,
        skillIds,
        correct: false,
        firstTry: false,
        retries: 1,
        hintsUsed: stageHints,
        skipped: status === 'skipped-after-attempt',
        evidenceLevel: 'attempted',
      });
      pushEvidence(skillIds, 'guided-stage', 'attempted');
    } else if (status === 'viewed' || status === 'skipped') {
      // Viewed or skipped without attempt only records 'viewed' exposure (not understanding)
      pushEvidence(skillIds, 'guided-stage', 'viewed');
    }
  }

  // 2. Trace prediction attempts (directly from verified deterministic trace steps)
  for (const record of Object.values(params.predictionRecords)) {
    const skillIds = getSkillsForPrediction(
      params.problemId,
      record.strategyId,
      record.nextStepAction,
      record.stepAction,
    );

    // Skipping WITHOUT attempting must NOT count as active practice ('attempted');
    // it records 'viewed' exposure only while marking skipped: true on the record.
    if (record.lastSelectedOptionId === null && record.skipped) {
      attempts.push({
        id: `${params.sessionId}:pred:${record.questionId}`,
        source: 'trace-prediction',
        targetId: record.questionId,
        skillIds,
        correct: false,
        firstTry: false,
        retries: 0,
        hintsUsed: 0,
        skipped: true,
        evidenceLevel: 'viewed',
      });
      pushEvidence(skillIds, 'trace-prediction', 'viewed');
      continue;
    }

    if (record.lastSelectedOptionId !== null) {
      let evidenceLevel: EvidenceLevel = 'attempted';
      if (record.firstAttemptCorrect && !record.wasEverSkipped) {
        evidenceLevel = 'first-try-correct';
      } else if (record.solved) {
        evidenceLevel = 'correct-with-assistance';
      }

      attempts.push({
        id: `${params.sessionId}:pred:${record.questionId}`,
        source: 'trace-prediction',
        targetId: record.questionId,
        skillIds,
        correct: record.solved,
        firstTry: Boolean(record.firstAttemptCorrect && !record.wasEverSkipped),
        retries: record.retryCount,
        hintsUsed: 0,
        skipped: record.skipped && !record.solved,
        evidenceLevel,
      });
      pushEvidence(skillIds, 'trace-prediction', evidenceLevel);
    }
  }

  // 3. Strategy exploration records strictly 'viewed' exposure only
  for (const stratId of strategiesExplored) {
    const stratSkills = getSkillsForStrategy(params.problemId, stratId);
    pushEvidence(stratSkills, 'strategy-view', 'viewed');
  }

  const outcome = determineSessionOutcome(
    params.stageIds.length,
    completedStagesCount,
    skippedStagesCount,
    attemptedStagesCount,
    predictionSummary.questionsAttempted,
  );

  const baseEvents = params.events ? [...params.events] : [];
  baseEvents.push({
    id: `${params.sessionId}:finalized`,
    type: 'session-finalized',
    timestamp: completedAt,
  });

  return {
    sessionId: params.sessionId,
    problemId: params.problemId,
    problemTitle: params.problemTitle,
    mode: params.mode,
    strategiesExplored,
    startedAt: params.startedAt,
    completedAt,
    stageStatuses: stageStatusesCopy,
    totalStages: params.stageIds.length,
    completedStagesCount,
    skippedStagesCount,
    attemptedStagesCount,
    predictionSummary,
    hintsUsed,
    hintsByStage: hintsByStageCopy,
    attempts,
    skillEvidence,
    events: baseEvents,
    outcome,
  };
}

function classifySkillProgress(
  counts: Record<EvidenceLevel, number>,
  mistakesAndSkips: number,
): {
  label: SkillProgressLabel;
  indicatorPercent: number;
  evidenceNote: string;
  needsPractice: boolean;
} {
  const {
    viewed,
    attempted,
    'correct-with-assistance': assisted,
    'first-try-correct': firstTry,
    'independently-demonstrated': independent,
  } = counts;

  if (independent >= 2) {
    return {
      label: 'Independently Demonstrated',
      indicatorPercent: 100,
      evidenceNote: `${independent} independent assessment check(s) passed.`,
      needsPractice: false,
    };
  }

  if (firstTry >= 2 && firstTry >= mistakesAndSkips) {
    // Deliberately capped at 80% because guided sessions never prove independent mastery
    return {
      label: 'Strong Guided Recall (First-Try)',
      indicatorPercent: Math.min(80, 60 + firstTry * 5),
      evidenceNote: `${firstTry} first-try guided/prediction check(s) correct${assisted > 0 ? `, ${assisted} with assistance` : ''}. Independent mastery requires a future unassisted assessment.`,
      needsPractice: false,
    };
  }

  if (firstTry >= 1 || assisted >= 1) {
    const totalCorrect = firstTry + assisted;
    const struggled = mistakesAndSkips > totalCorrect || assisted > firstTry;
    return {
      label: 'Guided Progress (With Assistance)',
      indicatorPercent: Math.min(60, 35 + totalCorrect * 8),
      evidenceNote: `${firstTry} first-try correct, ${assisted} solved with retries/hints${attempted > 0 ? `, ${attempted} unresolved attempt(s)` : ''}.`,
      needsPractice: struggled,
    };
  }

  if (attempted >= 1) {
    return {
      label: 'Practicing (Attempted)',
      indicatorPercent: 25,
      evidenceNote: `${attempted} attempt(s) or skip(s) recorded — revisit guided checks and trace predictions to build accuracy.`,
      needsPractice: true,
    };
  }

  if (viewed >= 1) {
    return {
      label: 'Introduced (Viewed Only)',
      indicatorPercent: 12,
      evidenceNote: `Viewed in ${viewed} session step(s) only. Viewing a visualization does not prove understanding yet.`,
      needsPractice: false,
    };
  }

  return {
    label: 'Not Yet Practiced',
    indicatorPercent: 0,
    evidenceNote: 'No recorded activity yet in this browser.',
    needsPractice: false,
  };
}

/**
 * Generates transparent, deterministic practice suggestions based strictly on
 * recorded local evidence (never marketed as an AI recommendation model).
 */
export function buildPracticeSuggestions(
  sessions: LearningSession[],
  skillSummaries: SkillProgressSummary[],
  problemSummaries: ProblemProgressSummary[],
): PracticeSuggestion[] {
  const suggestions: PracticeSuggestion[] = [];

  if (sessions.length === 0) {
    return [
      {
        id: 'starter-two-sum',
        title: 'Start with Two Sum Guided Learning',
        reason:
          'You have no saved sessions yet. Two Sum introduces array indexing, Brute Force pair enumeration, and O(1) Hash Map lookups.',
        targetProblemId: 'two-sum',
        targetPath: '/studio/two-sum',
        ctaLabel: 'Start Two Sum Lesson',
        relatedSkills: ['array-indexing', 'brute-force', 'hash-map-lookup'],
        priority: 'starter',
      },
      {
        id: 'starter-valid-parentheses',
        title: 'Try Stack LIFO Reasoning in Valid Parentheses',
        reason:
          'Great beginner problem for practicing Last-In-First-Out stack push/pop transitions and edge-case checking.',
        targetProblemId: 'valid-parentheses',
        targetPath: '/studio/valid-parentheses',
        ctaLabel: 'Start Valid Parentheses',
        relatedSkills: ['stack-lifo'],
        priority: 'starter',
      },
    ];
  }

  const skillById = new Map<SkillId, SkillProgressSummary>(
    skillSummaries.map((s) => [s.skill.id, s]),
  );

  // Rule 1: Hash Map prediction/check difficulties -> revisit Two Sum Hash Map
  const hashMap = skillById.get('hash-map-lookup');
  if (
    hashMap &&
    (hashMap.needsPractice ||
      hashMap.mistakesAndSkips >= 1 ||
      hashMap.counts['correct-with-assistance'] >
        hashMap.counts['first-try-correct'])
  ) {
    suggestions.push({
      id: 'revisit-hash-map',
      title: 'Revisit Two Sum · Hash Map Complement Lookup',
      reason: `Recorded ${hashMap.mistakesAndSkips} mistake/skip(s) and ${hashMap.counts['correct-with-assistance']} assisted check(s) on Hash Map Lookup. Practicing lookup-before-insert predictions will solidify this pattern.`,
      targetProblemId: 'two-sum',
      targetPath: '/studio/two-sum',
      ctaLabel: 'Practice Two Sum Hash Map',
      relatedSkills: ['hash-map-lookup', 'time-space-complexity'],
      priority: 'high',
    });
  }

  // Rule 2: Stack / LIFO difficulties -> practice Valid Parentheses
  const stackLifo = skillById.get('stack-lifo');
  if (
    stackLifo &&
    (stackLifo.needsPractice ||
      stackLifo.mistakesAndSkips >= 1 ||
      stackLifo.counts['correct-with-assistance'] >
        stackLifo.counts['first-try-correct'])
  ) {
    suggestions.push({
      id: 'revisit-stack-lifo',
      title: 'Practice Stack / LIFO Transitions in Valid Parentheses',
      reason: `Recorded ${stackLifo.mistakesAndSkips} mistake/skip(s) and ${stackLifo.counts['correct-with-assistance']} assisted check(s) on Stack / LIFO. Step through crossed ("([)]") and unclosed ("((") presets with Predict Mode enabled.`,
      targetProblemId: 'valid-parentheses',
      targetPath: '/studio/valid-parentheses',
      ctaLabel: 'Practice Valid Parentheses',
      relatedSkills: ['stack-lifo'],
      priority: 'high',
    });
  }

  // Rule 3: Algorithm Composition / Binary Search / Greedy difficulties -> revisit Split Array Largest Sum
  const composition = skillById.get('algorithm-composition');
  const bsAnswer = skillById.get('binary-search-answer');
  const greedy = skillById.get('greedy-feasibility');
  const compositionStruggle =
    (composition?.mistakesAndSkips ?? 0) +
    (bsAnswer?.mistakesAndSkips ?? 0) +
    (greedy?.mistakesAndSkips ?? 0);
  const compositionNeedsWork =
    Boolean(composition?.needsPractice) ||
    Boolean(bsAnswer?.needsPractice) ||
    Boolean(greedy?.needsPractice) ||
    compositionStruggle >= 1;

  if (compositionNeedsWork) {
    suggestions.push({
      id: 'revisit-composition',
      title: 'Revisit Split Array Largest Sum · Binary Search + Greedy',
      reason: `Recorded ${compositionStruggle} mistake/skip(s) across Binary Search on Answer, Greedy Feasibility, and Algorithm Composition. Inspect the Binary Search Iteration Inspector to trace how Greedy verdicts narrow [low, high].`,
      targetProblemId: 'split-array-largest-sum',
      targetPath: '/studio/split-array-largest-sum',
      ctaLabel: 'Revisit Split Array Studio',
      relatedSkills: [
        'binary-search-answer',
        'greedy-feasibility',
        'algorithm-composition',
      ],
      priority: 'high',
    });
  }

  // Rule 4: Problems with incomplete or skipped guided stages
  for (const prob of problemSummaries) {
    if (
      prob.totalSessions > 0 &&
      prob.bestVerifiedStages < prob.totalStages &&
      !suggestions.some((s) => s.targetProblemId === prob.problemId)
    ) {
      suggestions.push({
        id: `finish-stages-${prob.problemId}`,
        title: `Complete Remaining Guided Stages in ${prob.problemTitle}`,
        reason: `Your best session verified ${prob.bestVerifiedStages} of ${prob.totalStages} guided stages. Completing the remaining checks builds stronger recall.`,
        targetProblemId: prob.problemId,
        targetPath: prob.studioPath,
        ctaLabel: `Continue ${prob.problemTitle}`,
        relatedSkills: [],
        priority: 'medium',
      });
    }
  }

  // Rule 5: Unexplored verified problems
  for (const prob of problemSummaries) {
    if (prob.totalSessions === 0) {
      suggestions.push({
        id: `explore-${prob.problemId}`,
        title: `Try ${prob.problemTitle}`,
        reason: `You have not recorded a session on ${prob.problemTitle} yet. Exploring a new problem family broadens your algorithmic toolkit.`,
        targetProblemId: prob.problemId,
        targetPath: prob.studioPath,
        ctaLabel: `Open ${prob.problemTitle}`,
        relatedSkills: [],
        priority: 'medium',
      });
    }
  }

  return suggestions.slice(0, 4);
}

/**
 * Pure deterministic aggregator turning saved LearningSession[] into LearningProgressSummary.
 */
export function aggregateLearningProgress(
  sessions: LearningSession[],
): LearningProgressSummary {
  const modules = getAllProblemModules();
  const sortedSessions = [...sessions].sort((a, b) =>
    b.completedAt.localeCompare(a.completedAt),
  );

  const uniqueProblemIds = new Set<string>();
  const uniqueStrategyKeys = new Set<string>();
  let totalPredictionsAttempted = 0;
  let totalPredictionsFirstTry = 0;
  let totalPredictionsSolvedAfterRetry = 0;
  let totalPredictionsSolved = 0;
  let totalPredictionsSkipped = 0;
  let totalPredictionsSkippedAfterAttempt = 0;
  let totalPredictionsSkippedWithoutAttempt = 0;
  let totalPredictionsUnresolved = 0;
  let totalPredictionQuestions = 0;
  let totalHintsUsed = 0;

  for (const session of sortedSessions) {
    uniqueProblemIds.add(session.problemId);
    for (const stratId of session.strategiesExplored) {
      uniqueStrategyKeys.add(`${session.problemId}:${stratId}`);
    }
    const ps = session.predictionSummary;
    const firstTry = ps.firstTryCorrect;
    const afterRetry = ps.solvedAfterRetry;
    const solved = firstTry + afterRetry;
    // Derive mutually exclusive buckets safely even for pre-Sprint-9 persisted sessions
    const skippedAfterAttempt =
      typeof ps.skippedAfterAttempt === 'number'
        ? ps.skippedAfterAttempt
        : Math.min(ps.skippedCount, Math.max(0, ps.questionsAttempted - solved));
    const skippedWithoutAttempt =
      typeof ps.skippedWithoutAttempt === 'number'
        ? ps.skippedWithoutAttempt
        : Math.max(0, ps.skippedCount - skippedAfterAttempt);
    const unresolvedAttempt =
      typeof ps.unresolvedAttempt === 'number'
        ? ps.unresolvedAttempt
        : Math.max(0, ps.questionsAttempted - solved - skippedAfterAttempt);
    const attempted = solved + skippedAfterAttempt + unresolvedAttempt;
    const totalQ = attempted + skippedWithoutAttempt;

    totalPredictionsAttempted += attempted;
    totalPredictionsFirstTry += firstTry;
    totalPredictionsSolvedAfterRetry += afterRetry;
    totalPredictionsSolved += solved;
    totalPredictionsSkipped += skippedAfterAttempt + skippedWithoutAttempt;
    totalPredictionsSkippedAfterAttempt += skippedAfterAttempt;
    totalPredictionsSkippedWithoutAttempt += skippedWithoutAttempt;
    totalPredictionsUnresolved += unresolvedAttempt;
    totalPredictionQuestions += totalQ;
    totalHintsUsed += session.hintsUsed;
  }

  // Per-skill aggregation
  const skillCounts = new Map<SkillId, Record<EvidenceLevel, number>>();
  const skillMistakesAndSkips = new Map<SkillId, number>();
  for (const def of SKILL_REGISTRY) {
    skillCounts.set(def.id, {
      viewed: 0,
      attempted: 0,
      'correct-with-assistance': 0,
      'first-try-correct': 0,
      'independently-demonstrated': 0,
    });
    skillMistakesAndSkips.set(def.id, 0);
  }

  for (const session of sortedSessions) {
    for (const ev of session.skillEvidence) {
      const bucket = skillCounts.get(ev.skillId);
      if (bucket) {
        bucket[ev.evidenceLevel] += 1;
      }
    }
    for (const attempt of session.attempts) {
      const hadMistakeOrSkip =
        !attempt.correct || attempt.skipped || attempt.retries > 0;
      if (hadMistakeOrSkip) {
        for (const skillId of attempt.skillIds) {
          skillMistakesAndSkips.set(
            skillId,
            (skillMistakesAndSkips.get(skillId) ?? 0) +
              (attempt.skipped ? 1 : Math.max(1, attempt.retries)),
          );
        }
      }
    }
  }

  const skillSummaries: SkillProgressSummary[] = SKILL_REGISTRY.map((skill) => {
    const counts = skillCounts.get(skill.id)!;
    const mistakesAndSkips = skillMistakesAndSkips.get(skill.id) ?? 0;
    const totalAttempts =
      counts.attempted +
      counts['correct-with-assistance'] +
      counts['first-try-correct'] +
      counts['independently-demonstrated'];
    const classified = classifySkillProgress(counts, mistakesAndSkips);
    return {
      skill,
      ...classified,
      counts,
      totalAttempts,
      mistakesAndSkips,
    };
  });

  const skillsPracticedCount = skillSummaries.filter(
    (s) => s.totalAttempts > 0,
  ).length;

  const areasNeedingPractice = skillSummaries.filter((s) => s.needsPractice);

  // Per-problem aggregation
  const problemSummaries: ProblemProgressSummary[] = modules.map((mod) => {
    const matching = sortedSessions.filter((s) => s.problemId === mod.id);
    const explored = new Set<string>();
    let bestVerifiedStages = 0;
    let predictionsAttempted = 0;
    let predictionsFirstTry = 0;
    let predictionsSolved = 0;
    let predictionsSkipped = 0;
    let hintsUsed = 0;

    for (const s of matching) {
      for (const strat of s.strategiesExplored) {
        explored.add(strat);
      }
      bestVerifiedStages = Math.max(bestVerifiedStages, s.completedStagesCount);
      predictionsAttempted += s.predictionSummary.questionsAttempted;
      predictionsFirstTry += s.predictionSummary.firstTryCorrect;
      predictionsSolved += s.predictionSummary.totalSolved;
      predictionsSkipped += s.predictionSummary.skippedCount;
      hintsUsed += s.hintsUsed;
    }

    return {
      problemId: mod.id,
      problemTitle: mod.spec.title,
      studioPath: `/studio/${mod.id}`,
      totalSessions: matching.length,
      strategiesExplored: Array.from(explored),
      totalStrategiesAvailable: mod.spec.supportedStrategies.length,
      bestVerifiedStages,
      totalStages: mod.lesson.stages.length,
      predictionsAttempted,
      predictionsFirstTry,
      predictionsSolved,
      predictionsSkipped,
      hintsUsed,
      lastPracticedAt: matching[0]?.completedAt ?? null,
      lastOutcome: matching[0]?.outcome ?? null,
    };
  });

  const totalAvailableStrategies = modules.reduce(
    (sum, mod) => sum + mod.spec.supportedStrategies.length,
    0,
  );

  const firstTryAccuracyPercent =
    totalPredictionsAttempted > 0
      ? Math.round((totalPredictionsFirstTry / totalPredictionsAttempted) * 100)
      : null;

  const overallSolvedPercent =
    totalPredictionsAttempted > 0
      ? Math.round((totalPredictionsSolved / totalPredictionsAttempted) * 100)
      : null;

  const suggestions = buildPracticeSuggestions(
    sortedSessions,
    skillSummaries,
    problemSummaries,
  );

  return {
    totalSessions: sortedSessions.length,
    problemsPracticedCount: uniqueProblemIds.size,
    totalAvailableProblems: modules.length,
    uniqueStrategiesExploredCount: uniqueStrategyKeys.size,
    totalAvailableStrategies,
    totalPredictionsAttempted,
    totalPredictionsFirstTry,
    totalPredictionsSolvedAfterRetry,
    totalPredictionsSolved,
    totalPredictionsSkipped,
    totalPredictionsSkippedAfterAttempt,
    totalPredictionsSkippedWithoutAttempt,
    totalPredictionsUnresolved,
    totalPredictionQuestions,
    firstTryAccuracyPercent,
    overallSolvedPercent,
    totalHintsUsed,
    skillsPracticedCount,
    skillSummaries,
    problemSummaries,
    areasNeedingPractice,
    recentSessions: sortedSessions,
    suggestions,
  };
}
