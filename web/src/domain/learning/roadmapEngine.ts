import { getAllProblemModules } from '../problems/registry';
import { aggregateLearningProgress } from './analytics';
import { SKILL_REGISTRY, getSkillDefinition } from './skills';
import {
  SKILL_PREREQUISITE_EDGES,
  validateSkillPrerequisiteGraph,
  type SkillGraphValidationResult,
  type SkillPrerequisiteEdge,
} from './skillGraph';
import type {
  EvidenceLevel,
  LearningSession,
  ProblemProgressSummary,
  SkillDefinition,
  SkillId,
} from './types';

/**
 * Cautious 5-state skill status for the Personalized Roadmap.
 * Explicitly NEVER calls any state "independent mastery".
 */
export type RoadmapSkillStatus =
  | 'Not Started'
  | 'Introduced'
  | 'Needs Practice'
  | 'Guided Progress'
  | 'Strong Guided Recall';

export interface RoadmapSkillNode {
  skill: SkillDefinition;
  status: RoadmapSkillStatus;
  counts: Record<EvidenceLevel, number>;
  firstTryCount: number;
  assistedCount: number;
  unresolvedOrWrongCount: number;
  skippedCount: number;
  hintsAssociated: number;
  lastPracticedAt: string | null;
  prerequisites: SkillId[];
  dependents: SkillId[];
  missingPrerequisites: SkillId[];
  prerequisitesMet: boolean;
  hasContradictoryEvidence: boolean;
  contradictionNote: string | null;
  statusReason: string;
  isRecommendedGoal: boolean;
}

export type RecommendationCategory =
  | 'starter'
  | 'resume-lesson'
  | 'review-weak-skill'
  | 'verify-recall'
  | 'next-topic'
  | 'edge-case-drill';

export interface RoadmapRecommendation {
  id: string;
  category: RecommendationCategory;
  title: string;
  summary: string;
  whyBullets: string[];
  targetProblemId: string;
  targetPath: string;
  ctaLabel: string;
  focusSkills: SkillId[];
}

export interface LearningPathStep {
  problemId: string;
  problemTitle: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  studioPath: string;
  status: RoadmapSkillStatus;
  focusSkills: SkillId[];
  prerequisiteSkills: SkillId[];
  missingPrerequisites: SkillId[];
  isRecommendedNext: boolean;
  progressSummary: ProblemProgressSummary;
  note: string;
  ctaLabel: string;
}

export interface PersonalizedRoadmap {
  isFirstTimeLearner: boolean;
  totalSessions: number;
  graphValidation: SkillGraphValidationResult;
  edges: readonly SkillPrerequisiteEdge[];
  skillNodes: RoadmapSkillNode[];
  recommendedNext: RoadmapRecommendation;
  alternativeActivities: RoadmapRecommendation[];
  learningPath: LearningPathStep[];
  skillsNeedingReview: RoadmapSkillNode[];
  practicedSkills: RoadmapSkillNode[];
  availableProblems: ProblemProgressSummary[];
}

const PROBLEM_PRIMARY_SKILLS: Record<string, SkillId[]> = {
  'two-sum': [
    'array-indexing',
    'brute-force',
    'hash-map-lookup',
    'time-space-complexity',
  ],
  'valid-parentheses': ['stack-lifo'],
  'split-array-largest-sum': [
    'greedy-feasibility',
    'binary-search-answer',
    'algorithm-composition',
  ],
};

function isReadyPrerequisiteStatus(status: RoadmapSkillStatus): boolean {
  return status === 'Guided Progress' || status === 'Strong Guided Recall';
}

function classifyRoadmapSkill(metrics: {
  counts: Record<EvidenceLevel, number>;
  retriesAndMistakes: number;
  skippedAttempts: number;
  skippedUnattempted: number;
  hintsAssociated: number;
  guidedCorrect: number;
  predictionAttempted: number;
  predictionFirstTry: number;
  predictionSkipped: number;
}): {
  status: RoadmapSkillStatus;
  hasContradictoryEvidence: boolean;
  contradictionNote: string | null;
  statusReason: string;
} {
  const {
    counts,
    retriesAndMistakes,
    skippedAttempts,
    skippedUnattempted,
    hintsAssociated,
    guidedCorrect,
    predictionAttempted,
    predictionFirstTry,
    predictionSkipped,
  } = metrics;

  const firstTry = counts['first-try-correct'];
  const assisted = counts['correct-with-assistance'];
  const attempted = counts.attempted;
  const viewed = counts.viewed;

  const totalActiveChecks = firstTry + assisted + attempted;

  // Detect contradictory evidence:
  // e.g., learner completed guided checks, yet struggled heavily or skipped on trace predictions
  const predictionAccuracy =
    predictionAttempted > 0 ? predictionFirstTry / predictionAttempted : null;
  const hasContradictoryEvidence =
    (guidedCorrect >= 1 &&
      predictionAttempted >= 2 &&
      predictionAccuracy !== null &&
      predictionAccuracy < 0.5) ||
    (guidedCorrect >= 1 &&
      predictionSkipped >= 2 &&
      predictionFirstTry === 0) ||
    (firstTry >= 2 && retriesAndMistakes >= 3);

  const contradictionNote = hasContradictoryEvidence
    ? guidedCorrect >= 1 && predictionAttempted >= 2 && (predictionAccuracy ?? 1) < 0.5
      ? `Mixed signals: guided checks passed (${guidedCorrect}), but first-try trace prediction accuracy was ${Math.round((predictionAccuracy ?? 0) * 100)}% (${predictionFirstTry}/${predictionAttempted}).`
      : guidedCorrect >= 1 && predictionSkipped >= 2 && predictionFirstTry === 0
        ? `Mixed signals: guided checks passed (${guidedCorrect}), but ${predictionSkipped} trace prediction(s) were skipped without first-try verification.`
        : `Mixed signals: ${firstTry} first-try check(s) alongside ${retriesAndMistakes} retry/mistake(s) — a quick review will stabilize recall.`
    : null;

  if (totalActiveChecks === 0 && viewed === 0 && skippedUnattempted === 0) {
    return {
      status: 'Not Started',
      hasContradictoryEvidence: false,
      contradictionNote: null,
      statusReason: 'No recorded activity on this skill yet.',
    };
  }

  if (totalActiveChecks === 0) {
    return {
      status: 'Introduced',
      hasContradictoryEvidence: false,
      contradictionNote: null,
      statusReason:
        skippedUnattempted > 0
          ? `Viewed only (${skippedUnattempted} skipped prediction(s) without attempting). Active checks are needed to build recall.`
          : `Introduced in ${viewed} step(s) only — viewing visuals does not prove understanding yet.`,
    };
  }

  const totalFriction = retriesAndMistakes + skippedAttempts + Math.floor(hintsAssociated / 2);
  const heavyMistakesOrUnresolved =
    attempted >= 1 && firstTry === 0 && assisted === 0;
  const frictionOutweighsSuccess =
    retriesAndMistakes + skippedAttempts > firstTry + assisted ||
    (assisted >= 2 && firstTry === 0) ||
    (hintsAssociated >= 3 && firstTry <= 1);

  if (heavyMistakesOrUnresolved || frictionOutweighsSuccess || hasContradictoryEvidence) {
    return {
      status: 'Needs Practice',
      hasContradictoryEvidence,
      contradictionNote,
      statusReason:
        contradictionNote ??
        `Recorded ${retriesAndMistakes} mistake/retry(s), ${skippedAttempts} skipped attempt(s), and ${hintsAssociated} hint(s) across ${totalActiveChecks} check(s).`,
    };
  }

  // Strong Guided Recall requires >= 2 first-try correct checks, low friction, and no unresolved skips/attempts
  if (
    firstTry >= 2 &&
    attempted === 0 &&
    skippedAttempts === 0 &&
    totalFriction <= 1 &&
    hintsAssociated <= 1
  ) {
    return {
      status: 'Strong Guided Recall',
      hasContradictoryEvidence: false,
      contradictionNote: null,
      statusReason: `${firstTry} first-try guided/prediction check(s) with low hint reliance. (Guided recall only — not independent mastery.)`,
    };
  }

  return {
    status: 'Guided Progress',
    hasContradictoryEvidence: false,
    contradictionNote: null,
    statusReason: `${firstTry} first-try and ${assisted} assisted check(s) completed. Additional unassisted predictions will strengthen recall.`,
  };
}

/**
 * Pure deterministic personalized roadmap engine grounded strictly in local LearningSession[].
 */
export function buildPersonalizedRoadmap(
  sessions: LearningSession[],
): PersonalizedRoadmap {
  const graphValidation = validateSkillPrerequisiteGraph();
  const progress = aggregateLearningProgress(sessions);
  const modules = getAllProblemModules();
  const sortedSessions = progress.recentSessions;

  // Gather fine-grained per-skill evidence across all saved sessions
  const perSkillData = new Map<
    SkillId,
    {
      counts: Record<EvidenceLevel, number>;
      retriesAndMistakes: number;
      skippedAttempts: number;
      skippedUnattempted: number;
      hintsAssociated: number;
      guidedCorrect: number;
      predictionAttempted: number;
      predictionFirstTry: number;
      predictionSkipped: number;
      lastPracticedAt: string | null;
    }
  >();

  for (const def of SKILL_REGISTRY) {
    perSkillData.set(def.id, {
      counts: {
        viewed: 0,
        attempted: 0,
        'correct-with-assistance': 0,
        'first-try-correct': 0,
        'independently-demonstrated': 0,
      },
      retriesAndMistakes: 0,
      skippedAttempts: 0,
      skippedUnattempted: 0,
      hintsAssociated: 0,
      guidedCorrect: 0,
      predictionAttempted: 0,
      predictionFirstTry: 0,
      predictionSkipped: 0,
      lastPracticedAt: null,
    });
  }

  for (const session of sortedSessions) {
    for (const ev of session.skillEvidence) {
      const data = perSkillData.get(ev.skillId);
      if (!data) continue;
      data.counts[ev.evidenceLevel] += 1;
      if (
        !data.lastPracticedAt ||
        session.completedAt > data.lastPracticedAt
      ) {
        data.lastPracticedAt = session.completedAt;
      }
    }

    for (const attempt of session.attempts) {
      for (const skillId of attempt.skillIds) {
        const data = perSkillData.get(skillId);
        if (!data) continue;

        data.hintsAssociated += attempt.hintsUsed;

        if (attempt.source === 'guided-stage') {
          if (attempt.correct) data.guidedCorrect += 1;
          if (!attempt.correct || attempt.retries > 0) {
            data.retriesAndMistakes += Math.max(
              attempt.correct ? 0 : 1,
              attempt.retries,
            );
          }
          if (attempt.skipped) {
            data.skippedAttempts += 1;
          }
        } else if (attempt.source === 'trace-prediction') {
          const wasUnattemptedSkip =
            attempt.skipped && attempt.evidenceLevel === 'viewed';
          if (wasUnattemptedSkip) {
            data.skippedUnattempted += 1;
            data.predictionSkipped += 1;
          } else {
            data.predictionAttempted += 1;
            if (attempt.firstTry) {
              data.predictionFirstTry += 1;
            }
            if (attempt.skipped) {
              data.skippedAttempts += 1;
              data.predictionSkipped += 1;
            }
            if (!attempt.correct || attempt.retries > 0) {
              data.retriesAndMistakes += Math.max(
                attempt.correct ? 0 : 1,
                attempt.retries,
              );
            }
          }
        }
      }
    }
  }

  // First pass: classify every skill
  const prelimStatus = new Map<SkillId, RoadmapSkillStatus>();
  const prelimClassifications = new Map<
    SkillId,
    ReturnType<typeof classifyRoadmapSkill>
  >();
  for (const def of SKILL_REGISTRY) {
    const d = perSkillData.get(def.id)!;
    const classified = classifyRoadmapSkill(d);
    prelimStatus.set(def.id, classified.status);
    prelimClassifications.set(def.id, classified);
  }

  // Second pass: assemble RoadmapSkillNode[] with prerequisite readiness
  const skillNodes: RoadmapSkillNode[] = SKILL_REGISTRY.map((skill) => {
    const d = perSkillData.get(skill.id)!;
    const classified = prelimClassifications.get(skill.id)!;
    const missingPrerequisites = skill.prerequisites.filter(
      (prereqId) =>
        !isReadyPrerequisiteStatus(prelimStatus.get(prereqId) ?? 'Not Started'),
    );
    return {
      skill,
      status: classified.status,
      counts: d.counts,
      firstTryCount: d.counts['first-try-correct'],
      assistedCount: d.counts['correct-with-assistance'],
      unresolvedOrWrongCount: d.retriesAndMistakes,
      skippedCount: d.skippedAttempts + d.skippedUnattempted,
      hintsAssociated: d.hintsAssociated,
      lastPracticedAt: d.lastPracticedAt,
      prerequisites: [...skill.prerequisites],
      dependents: [...(graphValidation.dependentsBySkill[skill.id] ?? [])],
      missingPrerequisites,
      prerequisitesMet: missingPrerequisites.length === 0,
      hasContradictoryEvidence: classified.hasContradictoryEvidence,
      contradictionNote: classified.contradictionNote,
      statusReason: classified.statusReason,
      isRecommendedGoal: false,
    };
  });

  const nodeById = new Map<SkillId, RoadmapSkillNode>(
    skillNodes.map((n) => [n.skill.id, n]),
  );
  const problemSummaryById = new Map<string, ProblemProgressSummary>(
    progress.problemSummaries.map((p) => [p.problemId, p]),
  );

  const skillsNeedingReview = skillNodes.filter(
    (n) => n.status === 'Needs Practice',
  );
  const practicedSkills = skillNodes.filter(
    (n) =>
      n.status === 'Guided Progress' ||
      n.status === 'Strong Guided Recall' ||
      n.status === 'Needs Practice',
  );

  // Build deterministic primary recommendation + alternatives
  const isFirstTimeLearner = sortedSessions.length === 0;
  let recommendedNext: RoadmapRecommendation;

  const twoSumSummary = problemSummaryById.get('two-sum')!;
  const vpSummary = problemSummaryById.get('valid-parentheses')!;
  const saSummary = problemSummaryById.get('split-array-largest-sum')!;

  // Priority 1: First-time learner -> honest beginner starting path
  if (isFirstTimeLearner) {
    recommendedNext = {
      id: 'rec-beginner-two-sum',
      category: 'starter',
      title: 'Start with Two Sum Guided Learning',
      summary:
        'Build foundational Array Indexing, Brute Force reasoning, and O(1) Hash Map Lookup before tackling harder patterns.',
      whyBullets: [
        'No local learning sessions are recorded in this browser yet.',
        'Two Sum introduces 4 foundational skills (Array Indexing, Brute Force, Time & Space Complexity, Hash Map Lookup) that unlock later optimization topics.',
        'Valid Parentheses (Stack / LIFO) has no prerequisites and is also immediately open if you prefer starting with Stacks.',
      ],
      targetProblemId: 'two-sum',
      targetPath: '/studio/two-sum',
      ctaLabel: 'Start Two Sum Guided Lesson',
      focusSkills: ['array-indexing', 'brute-force', 'hash-map-lookup'],
    };
  } else {
    // Check for weak/needs-practice foundational skills first (ordered topologically so missing prerequisites are addressed first!)
    const orderedWeakSkills = graphValidation.topologicalOrder
      .map((id) => nodeById.get(id)!)
      .filter((n) => n.status === 'Needs Practice');

    // Check for incomplete guided lessons (started, but best verified stages < total stages)
    const incompleteProblem = progress.problemSummaries.find(
      (p) => p.totalSessions > 0 && p.bestVerifiedStages < p.totalStages,
    );

    // Check for heavy unattempted skipping on a practiced problem
    const skippedOnlyProblem = progress.problemSummaries.find(
      (p) =>
        p.totalSessions > 0 &&
        p.predictionsSkipped >= 2 &&
        p.predictionsFirstTry === 0,
    );

    if (orderedWeakSkills.length > 0) {
      const topWeak = orderedWeakSkills[0];
      const targetProblemId = topWeak.skill.relatedProblemIds[0] ?? 'two-sum';
      const targetMod = modules.find((m) => m.id === targetProblemId) ?? modules[0];
      const dependentNames = topWeak.dependents.map(
        (id) => getSkillDefinition(id).name,
      );

      const whyBullets: string[] = [
        `${topWeak.skill.name} is currently marked "Needs Practice" (${topWeak.statusReason}).`,
      ];
      if (topWeak.hasContradictoryEvidence && topWeak.contradictionNote) {
        whyBullets.push(topWeak.contradictionNote);
      }
      if (dependentNames.length > 0) {
        whyBullets.push(
          `Strengthening ${topWeak.skill.name} prepares you for ${dependentNames.join(', ')}.`,
        );
      } else {
        whyBullets.push(
          `Re-practicing ${targetMod.spec.title} with Predict Mode enabled will build stronger first-try recall.`,
        );
      }

      recommendedNext = {
        id: `rec-review-${topWeak.skill.id}`,
        category: topWeak.hasContradictoryEvidence
          ? 'verify-recall'
          : 'review-weak-skill',
        title: `Review ${topWeak.skill.name} in ${targetMod.spec.title}`,
        summary: topWeak.hasContradictoryEvidence
          ? `Your guided checks and trace predictions show mixed results on ${topWeak.skill.name}. Revisit the Studio in Predict Mode to test recall without hints.`
          : `Focus on ${topWeak.skill.name} before moving to more complex combinations.`,
        whyBullets,
        targetProblemId: targetMod.id,
        targetPath: `/studio/${targetMod.id}`,
        ctaLabel: `Review ${targetMod.spec.title}`,
        focusSkills: [topWeak.skill.id],
      };
    } else if (incompleteProblem) {
      const focusSkills = PROBLEM_PRIMARY_SKILLS[incompleteProblem.problemId] ?? [];
      recommendedNext = {
        id: `rec-resume-${incompleteProblem.problemId}`,
        category: 'resume-lesson',
        title: `Complete Remaining Stages in ${incompleteProblem.problemTitle}`,
        summary: `You have verified ${incompleteProblem.bestVerifiedStages} of ${incompleteProblem.totalStages} guided stages in ${incompleteProblem.problemTitle}.`,
        whyBullets: [
          `Your best saved session on ${incompleteProblem.problemTitle} verified ${incompleteProblem.bestVerifiedStages}/${incompleteProblem.totalStages} guided stages.`,
          incompleteProblem.predictionsSkipped > 0
            ? `${incompleteProblem.predictionsSkipped} trace prediction(s) were skipped — answering them directly builds verifiable evidence.`
            : 'Finishing all guided stages ensures every core concept for this problem has recorded evidence.',
        ],
        targetProblemId: incompleteProblem.problemId,
        targetPath: incompleteProblem.studioPath,
        ctaLabel: `Resume ${incompleteProblem.problemTitle}`,
        focusSkills,
      };
    } else if (skippedOnlyProblem) {
      const focusSkills = PROBLEM_PRIMARY_SKILLS[skippedOnlyProblem.problemId] ?? [];
      recommendedNext = {
        id: `rec-verify-${skippedOnlyProblem.problemId}`,
        category: 'verify-recall',
        title: `Practice Trace Predictions in ${skippedOnlyProblem.problemTitle}`,
        summary: `You explored ${skippedOnlyProblem.problemTitle}, but skipped ${skippedOnlyProblem.predictionsSkipped} prediction(s) without first-try verification.`,
        whyBullets: [
          `Recorded ${skippedOnlyProblem.predictionsSkipped} skipped prediction(s) and 0 first-try predictions in ${skippedOnlyProblem.problemTitle}.`,
          'Skipping without attempting records exposure only — actively predicting transitions tests real recall.',
        ],
        targetProblemId: skippedOnlyProblem.problemId,
        targetPath: skippedOnlyProblem.studioPath,
        ctaLabel: `Practice ${skippedOnlyProblem.problemTitle} Predictions`,
        focusSkills,
      };
    } else if (twoSumSummary.totalSessions === 0) {
      recommendedNext = {
        id: 'rec-next-two-sum',
        category: 'next-topic',
        title: 'Build Core Foundations in Two Sum',
        summary:
          'Practice Array Indexing, Brute Force, Time & Space Complexity, and Hash Map Lookup to unlock Split Array prerequisites.',
        whyBullets: [
          'Two Sum has not been practiced yet in your local history.',
          'Its foundational skills (Array Indexing, Brute Force, Time & Space Complexity) are prerequisites for Greedy Feasibility and Binary Search on Answer.',
        ],
        targetProblemId: 'two-sum',
        targetPath: '/studio/two-sum',
        ctaLabel: 'Start Two Sum',
        focusSkills: ['array-indexing', 'brute-force', 'hash-map-lookup'],
      };
    } else if (vpSummary.totalSessions === 0) {
      recommendedNext = {
        id: 'rec-next-valid-parentheses',
        category: 'next-topic',
        title: 'Learn Stack / LIFO Reasoning in Valid Parentheses',
        summary:
          'Expand into Last-In-First-Out data structures with a dedicated vertical Stack visualization and edge-case checks.',
        whyBullets: [
          `You already practiced Two Sum (${twoSumSummary.bestVerifiedStages}/${twoSumSummary.totalStages} stages verified).`,
          'Stack / LIFO is an independent foundational skill with 0 missing prerequisites and has not been practiced yet.',
        ],
        targetProblemId: 'valid-parentheses',
        targetPath: '/studio/valid-parentheses',
        ctaLabel: 'Start Valid Parentheses',
        focusSkills: ['stack-lifo'],
      };
    } else if (saSummary.totalSessions === 0) {
      const compNode = nodeById.get('algorithm-composition')!;
      const bsNode = nodeById.get('binary-search-answer')!;
      const greedyNode = nodeById.get('greedy-feasibility')!;
      const missingForSa = Array.from(
        new Set([
          ...bsNode.missingPrerequisites,
          ...greedyNode.missingPrerequisites,
        ]),
      );
      recommendedNext = {
        id: 'rec-next-split-array',
        category: 'next-topic',
        title: 'Advance to Algorithm Composition: Split Array Largest Sum',
        summary:
          'Combine Binary Search on Answer with a nested O(n) Greedy feasibility subroutine.',
        whyBullets: [
          missingForSa.length === 0
            ? 'Your foundational prerequisites (Array Indexing, Brute Force, Time & Space Complexity) show solid guided progress.'
            : `Note: reviewing ${missingForSa.map((id) => getSkillDefinition(id).name).join(', ')} first can help, though Split Array is unlocked anytime.`,
          `Split Array introduces ${compNode.skill.name}, Binary Search on Answer, and Greedy Feasibility.`,
        ],
        targetProblemId: 'split-array-largest-sum',
        targetPath: '/studio/split-array-largest-sum',
        ctaLabel: 'Start Split Array Largest Sum',
        focusSkills: [
          'greedy-feasibility',
          'binary-search-answer',
          'algorithm-composition',
        ],
      };
    } else {
      // All 3 verified problems have been completed with no weak flags -> recommend Free Exploration edge-case drills
      const lowestPredictionProblem = [...progress.problemSummaries].sort(
        (a, b) => {
          const rateA =
            a.predictionsAttempted > 0
              ? a.predictionsFirstTry / a.predictionsAttempted
              : 0;
          const rateB =
            b.predictionsAttempted > 0
              ? b.predictionsFirstTry / b.predictionsAttempted
              : 0;
          return rateA - rateB;
        },
      )[0];

      recommendedNext = {
        id: `rec-drill-${lowestPredictionProblem.problemId}`,
        category: 'edge-case-drill',
        title: `Test Custom Edge Cases in ${lowestPredictionProblem.problemTitle}`,
        summary:
          'You have completed guided sessions across all 3 verified Studios with strong guided recall. Challenge yourself with custom edge-case inputs in Free Exploration.',
        whyBullets: [
          `All ${modules.length} currently available verified Studios have completed guided sessions in this browser.`,
          'Guided recall is a strong foundation, though independent mastery still requires solving fresh problems without step-by-step scaffolding.',
          `${lowestPredictionProblem.problemTitle} is a great next edge-case drill (try negatives, duplicates, empty/minimal inputs, or custom arrays).`,
        ],
        targetProblemId: lowestPredictionProblem.problemId,
        targetPath: `${lowestPredictionProblem.studioPath}?mode=explore`,
        ctaLabel: `Explore ${lowestPredictionProblem.problemTitle} Edge Cases`,
        focusSkills: PROBLEM_PRIMARY_SKILLS[lowestPredictionProblem.problemId] ?? [],
      };
    }
  }

  // Highlight recommended goal skills on the interactive map
  for (const focusId of recommendedNext.focusSkills) {
    const node = nodeById.get(focusId);
    if (node) {
      node.isRecommendedGoal = true;
    }
  }

  // Alternative activities: always expose the other verified Studios so learners are never locked out
  const alternativeActivities: RoadmapRecommendation[] = modules
    .filter((mod) => mod.id !== recommendedNext.targetProblemId)
    .map((mod) => {
      const pSum = problemSummaryById.get(mod.id)!;
      const focusSkills = PROBLEM_PRIMARY_SKILLS[mod.id] ?? [];
      return {
        id: `alt-${mod.id}`,
        category: pSum.totalSessions > 0 ? 'review-weak-skill' : 'next-topic',
        title: mod.spec.title,
        summary:
          pSum.totalSessions > 0
            ? `Revisit ${mod.spec.title} (${pSum.totalSessions} saved session${pSum.totalSessions === 1 ? '' : 's'}, best ${pSum.bestVerifiedStages}/${pSum.totalStages} stages).`
            : `Jump directly into ${mod.spec.title} (${mod.spec.difficulty}) — open anytime without prerequisites lockouts.`,
        whyBullets: [
          `Covers: ${focusSkills.map((id) => getSkillDefinition(id).name).join(', ')}.`,
        ],
        targetProblemId: mod.id,
        targetPath: `/studio/${mod.id}`,
        ctaLabel: pSum.totalSessions > 0 ? `Revisit ${mod.spec.title}` : `Try ${mod.spec.title}`,
        focusSkills,
      };
    });

  // Build ordered Learning Path across the 3 verified Studios
  const learningPath: LearningPathStep[] = modules.map((mod) => {
    const pSum = problemSummaryById.get(mod.id)!;
    const focusSkills = PROBLEM_PRIMARY_SKILLS[mod.id] ?? [];
    const prerequisiteSkills = Array.from(
      new Set(
        focusSkills.flatMap((id) =>
          getSkillDefinition(id).prerequisites.filter(
            (pre) => !focusSkills.includes(pre),
          ),
        ),
      ),
    );
    const missingPrerequisites = prerequisiteSkills.filter(
      (pre) => !isReadyPrerequisiteStatus(nodeById.get(pre)?.status ?? 'Not Started'),
    );

    const skillStatuses = focusSkills.map(
      (id) => nodeById.get(id)?.status ?? 'Not Started',
    );
    let stepStatus: RoadmapSkillStatus = 'Not Started';
    if (skillStatuses.includes('Needs Practice')) {
      stepStatus = 'Needs Practice';
    } else if (
      pSum.totalSessions > 0 &&
      pSum.bestVerifiedStages === pSum.totalStages &&
      skillStatuses.every((st) => st === 'Strong Guided Recall')
    ) {
      stepStatus = 'Strong Guided Recall';
    } else if (
      pSum.bestVerifiedStages > 0 ||
      skillStatuses.some(
        (st) => st === 'Guided Progress' || st === 'Strong Guided Recall',
      )
    ) {
      stepStatus = 'Guided Progress';
    } else if (
      pSum.totalSessions > 0 ||
      skillStatuses.includes('Introduced')
    ) {
      stepStatus = 'Introduced';
    }

    const isRecommendedNext = recommendedNext.targetProblemId === mod.id;
    let ctaLabel = `Start ${mod.spec.title}`;
    if (pSum.totalSessions > 0) {
      ctaLabel =
        stepStatus === 'Needs Practice'
          ? `Review ${mod.spec.title}`
          : pSum.bestVerifiedStages < pSum.totalStages
            ? `Resume ${mod.spec.title}`
            : `Revisit ${mod.spec.title}`;
    }

    const note =
      pSum.totalSessions === 0
        ? missingPrerequisites.length > 0
          ? `Suggested prerequisites: ${missingPrerequisites.map((id) => getSkillDefinition(id).name).join(', ')} (still open anytime).`
          : 'Ready to start whenever you like.'
        : `Best verified stages: ${pSum.bestVerifiedStages}/${pSum.totalStages} · Predictions: ${pSum.predictionsFirstTry}/${pSum.predictionsAttempted} first-try.`;

    return {
      problemId: mod.id,
      problemTitle: mod.spec.title,
      difficulty: mod.spec.difficulty,
      studioPath: `/studio/${mod.id}`,
      status: stepStatus,
      focusSkills,
      prerequisiteSkills,
      missingPrerequisites,
      isRecommendedNext,
      progressSummary: pSum,
      note,
      ctaLabel,
    };
  });

  return {
    isFirstTimeLearner,
    totalSessions: sortedSessions.length,
    graphValidation,
    edges: SKILL_PREREQUISITE_EDGES,
    skillNodes,
    recommendedNext,
    alternativeActivities,
    learningPath,
    skillsNeedingReview,
    practicedSkills,
    availableProblems: progress.problemSummaries,
  };
}
