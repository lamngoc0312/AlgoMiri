import type { TFunction } from 'i18next';
import type {
  PracticeSuggestion,
  ProblemProgressSummary,
  SessionOutcome,
  SkillId,
  SkillProgressLabel,
  SkillProgressSummary,
} from '../domain/learning/types';
import type {
  LearningPathStep,
  PersonalizedRoadmap,
  RoadmapRecommendation,
  RoadmapSkillNode,
  RoadmapSkillStatus,
} from '../domain/learning/roadmapEngine';
import type { RoadmapMilestone } from '../domain/problems/demoCatalog';
import { getSkillDefinition } from '../domain/learning/skills';

export function localizeSkillName(t: TFunction, skillId: SkillId): string {
  return t(`skills.items.${skillId}.name`, {
    defaultValue: getSkillDefinition(skillId).name,
  });
}

export function localizeSkillDescription(
  t: TFunction,
  skillId: SkillId,
): string {
  return t(`skills.items.${skillId}.description`, {
    defaultValue: getSkillDefinition(skillId).description,
  });
}

export function localizeSkillCategory(t: TFunction, category: string): string {
  return t(`skills.categories.${category}`, { defaultValue: category });
}

export function localizePrerequisiteRationale(
  t: TFunction,
  source: SkillId,
  target: SkillId,
  fallback: string | null,
): string | null {
  if (!fallback) return null;
  return t(`skills.edges.${source}->${target}`, { defaultValue: fallback });
}

export function localizeRoadmapStatus(
  t: TFunction,
  status: RoadmapSkillStatus,
): string {
  return t(`skills.roadmapStatus.${status}`, { defaultValue: status });
}

export function localizeSkillProgressLabel(
  t: TFunction,
  label: SkillProgressLabel,
): string {
  return t(`skills.progressLabel.${label}`, { defaultValue: label });
}

export function localizeSessionOutcome(
  t: TFunction,
  outcome: SessionOutcome,
): string {
  return t(`progress.outcomes.${outcome}`, { defaultValue: outcome });
}

export function localizeDifficulty(
  t: TFunction,
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced',
): string {
  if (difficulty === 'Beginner') return t('common.beginner');
  if (difficulty === 'Intermediate') return t('common.intermediate');
  return t('common.advanced');
}

export function localizeSkillEvidenceNote(
  t: TFunction,
  item: SkillProgressSummary,
): string {
  const {
    viewed,
    attempted,
    'correct-with-assistance': assisted,
    'first-try-correct': firstTry,
    'independently-demonstrated': independent,
  } = item.counts;

  if (independent >= 2) {
    return t('progress.skillTracking.notes.independent', { count: independent });
  }
  if (firstTry >= 2 && firstTry >= item.mistakesAndSkips) {
    return assisted > 0
      ? t('progress.skillTracking.notes.strongWithAssisted', {
          firstTry,
          assisted,
        })
      : t('progress.skillTracking.notes.strongFirstTry', { firstTry });
  }
  if (firstTry >= 1 || assisted >= 1) {
    return attempted > 0
      ? t('progress.skillTracking.notes.guidedWithUnresolved', {
          firstTry,
          assisted,
          attempted,
        })
      : t('progress.skillTracking.notes.guidedProgress', {
          firstTry,
          assisted,
        });
  }
  if (attempted >= 1) {
    return t('progress.skillTracking.notes.attemptedOnly', { attempted });
  }
  if (viewed >= 1) {
    return t('progress.skillTracking.notes.viewedOnly', { viewed });
  }
  return t('progress.skillTracking.notes.notStarted');
}

export function localizePracticeSuggestion(
  t: TFunction,
  suggestion: PracticeSuggestion,
  skillSummaries: SkillProgressSummary[],
  problemSummaries: ProblemProgressSummary[],
): { title: string; reason: string; ctaLabel: string } {
  const skillById = new Map(skillSummaries.map((s) => [s.skill.id, s]));
  const probById = new Map(problemSummaries.map((p) => [p.problemId, p]));

  if (suggestion.id === 'starter-two-sum') {
    return {
      title: t('progress.suggestionsCard.items.starterTwoSumTitle'),
      reason: t('progress.suggestionsCard.items.starterTwoSumReason'),
      ctaLabel: t('progress.suggestionsCard.items.starterTwoSumCta'),
    };
  }
  if (suggestion.id === 'starter-valid-parentheses') {
    return {
      title: t('progress.suggestionsCard.items.starterVpTitle'),
      reason: t('progress.suggestionsCard.items.starterVpReason'),
      ctaLabel: t('progress.suggestionsCard.items.starterVpCta'),
    };
  }
  if (suggestion.id === 'revisit-hash-map') {
    const hashMap = skillById.get('hash-map-lookup');
    return {
      title: t('progress.suggestionsCard.items.revisitHashMapTitle'),
      reason: t('progress.suggestionsCard.items.revisitHashMapReason', {
        mistakes: hashMap?.mistakesAndSkips ?? 0,
        assisted: hashMap?.counts['correct-with-assistance'] ?? 0,
      }),
      ctaLabel: t('progress.suggestionsCard.items.revisitHashMapCta'),
    };
  }
  if (suggestion.id === 'revisit-stack-lifo') {
    const stackLifo = skillById.get('stack-lifo');
    return {
      title: t('progress.suggestionsCard.items.revisitStackTitle'),
      reason: t('progress.suggestionsCard.items.revisitStackReason', {
        mistakes: stackLifo?.mistakesAndSkips ?? 0,
        assisted: stackLifo?.counts['correct-with-assistance'] ?? 0,
      }),
      ctaLabel: t('progress.suggestionsCard.items.revisitStackCta'),
    };
  }
  if (suggestion.id === 'revisit-composition') {
    const composition = skillById.get('algorithm-composition');
    const bsAnswer = skillById.get('binary-search-answer');
    const greedy = skillById.get('greedy-feasibility');
    const mistakes =
      (composition?.mistakesAndSkips ?? 0) +
      (bsAnswer?.mistakesAndSkips ?? 0) +
      (greedy?.mistakesAndSkips ?? 0);
    return {
      title: t('progress.suggestionsCard.items.revisitCompositionTitle'),
      reason: t('progress.suggestionsCard.items.revisitCompositionReason', {
        mistakes,
      }),
      ctaLabel: t('progress.suggestionsCard.items.revisitCompositionCta'),
    };
  }
  if (suggestion.id.startsWith('finish-stages-')) {
    const prob = probById.get(suggestion.targetProblemId);
    const problem = prob?.problemTitle ?? suggestion.targetProblemId;
    return {
      title: t('progress.suggestionsCard.items.finishStagesTitle', { problem }),
      reason: t('progress.suggestionsCard.items.finishStagesReason', {
        best: prob?.bestVerifiedStages ?? 0,
        total: prob?.totalStages ?? 0,
      }),
      ctaLabel: t('progress.suggestionsCard.items.finishStagesCta', { problem }),
    };
  }
  if (suggestion.id.startsWith('explore-')) {
    const prob = probById.get(suggestion.targetProblemId);
    const problem = prob?.problemTitle ?? suggestion.targetProblemId;
    return {
      title: t('progress.suggestionsCard.items.exploreTitle', { problem }),
      reason: t('progress.suggestionsCard.items.exploreReason', { problem }),
      ctaLabel: t('progress.suggestionsCard.items.exploreCta', { problem }),
    };
  }

  return {
    title: suggestion.title,
    reason: suggestion.reason,
    ctaLabel: suggestion.ctaLabel,
  };
}

export function localizeRoadmapContradictionNote(
  t: TFunction,
  node: RoadmapSkillNode,
): string | null {
  if (!node.hasContradictoryEvidence || !node.contradictionNote) return null;
  if (node.contradictionNote.includes('trace prediction accuracy was')) {
    return t('roadmap.engine.statusReasons.mixedPredictionAccuracy');
  }
  if (node.contradictionNote.includes('skipped without first-try verification')) {
    return t('roadmap.engine.statusReasons.mixedPredictionSkips');
  }
  return t('roadmap.engine.statusReasons.mixedRetries', {
    firstTry: node.firstTryCount,
    mistakes: node.unresolvedOrWrongCount,
  });
}

export function localizeRoadmapSkillStatusReason(
  t: TFunction,
  node: RoadmapSkillNode,
): string {
  const totalActiveChecks =
    node.firstTryCount + node.assistedCount + node.counts.attempted;

  if (node.status === 'Not Started') {
    return t('roadmap.engine.statusReasons.notStarted');
  }
  if (node.status === 'Introduced') {
    if (node.skippedCount > 0) {
      return t('roadmap.engine.statusReasons.viewedWithSkips', {
        skips: node.skippedCount,
      });
    }
    return t('roadmap.engine.statusReasons.viewedOnly', {
      views: node.counts.viewed,
    });
  }
  if (node.status === 'Needs Practice') {
    const contradiction = localizeRoadmapContradictionNote(t, node);
    if (contradiction) return contradiction;
    return t('roadmap.engine.statusReasons.needsPracticeDefault', {
      mistakes: node.unresolvedOrWrongCount,
      skips: node.skippedCount,
      hints: node.hintsAssociated,
      checks: totalActiveChecks,
    });
  }
  if (node.status === 'Strong Guided Recall') {
    return t('roadmap.engine.statusReasons.strongGuidedRecall', {
      firstTry: node.firstTryCount,
    });
  }
  return t('roadmap.engine.statusReasons.guidedProgress', {
    firstTry: node.firstTryCount,
    assisted: node.assistedCount,
  });
}

export function localizeRoadmapRecommendation(
  t: TFunction,
  rec: RoadmapRecommendation,
  roadmap: PersonalizedRoadmap,
): { title: string; summary: string; whyBullets: string[]; ctaLabel: string } {
  const probById = new Map(
    roadmap.availableProblems.map((p) => [p.problemId, p]),
  );
  const nodeById = new Map(roadmap.skillNodes.map((n) => [n.skill.id, n]));
  const prob = probById.get(rec.targetProblemId);
  const problemTitle = prob?.problemTitle ?? rec.targetProblemId;

  if (rec.id === 'rec-beginner-two-sum') {
    return {
      title: t('roadmap.engine.recommendations.starterTitle'),
      summary: t('roadmap.engine.recommendations.starterSummary'),
      whyBullets: [
        t('roadmap.engine.recommendations.starterBullet1'),
        t('roadmap.engine.recommendations.starterBullet2'),
        t('roadmap.engine.recommendations.starterBullet3'),
      ],
      ctaLabel: t('roadmap.engine.cta.startGuidedLesson', {
        problem: 'Two Sum',
      }),
    };
  }

  if (rec.id.startsWith('rec-review-')) {
    const skillId = rec.focusSkills[0];
    const node = skillId ? nodeById.get(skillId) : undefined;
    const skillName = skillId ? localizeSkillName(t, skillId) : '';
    const statusText = localizeRoadmapStatus(t, 'Needs Practice');
    const reasonText = node ? localizeRoadmapSkillStatusReason(t, node) : '';
    const whyBullets: string[] = [
      t('roadmap.engine.recommendations.reviewBulletMarked', {
        skill: skillName,
        status: statusText,
        reason: reasonText,
      }),
    ];
    const contradiction = node ? localizeRoadmapContradictionNote(t, node) : null;
    if (contradiction) {
      whyBullets.push(contradiction);
    }
    if (node && node.dependents.length > 0) {
      whyBullets.push(
        t('roadmap.engine.recommendations.reviewBulletPrepares', {
          skill: skillName,
          dependents: node.dependents
            .map((id) => localizeSkillName(t, id))
            .join(', '),
        }),
      );
    } else {
      whyBullets.push(
        t('roadmap.engine.recommendations.reviewBulletPredict', {
          problem: problemTitle,
        }),
      );
    }
    return {
      title: t('roadmap.engine.recommendations.reviewTitle', {
        skill: skillName,
        problem: problemTitle,
      }),
      summary: node?.hasContradictoryEvidence
        ? t('roadmap.engine.recommendations.reviewContradictorySummary', {
            skill: skillName,
          })
        : t('roadmap.engine.recommendations.reviewWeakSummary', {
            skill: skillName,
          }),
      whyBullets,
      ctaLabel: t('roadmap.engine.cta.review', { problem: problemTitle }),
    };
  }

  if (rec.id.startsWith('rec-resume-')) {
    const best = prob?.bestVerifiedStages ?? 0;
    const total = prob?.totalStages ?? 0;
    const skipped = prob?.predictionsSkipped ?? 0;
    return {
      title: t('roadmap.engine.recommendations.resumeTitle', {
        problem: problemTitle,
      }),
      summary: t('roadmap.engine.recommendations.resumeSummary', {
        best,
        total,
        problem: problemTitle,
      }),
      whyBullets: [
        t('roadmap.engine.recommendations.resumeBulletBest', {
          problem: problemTitle,
          best,
          total,
        }),
        skipped > 0
          ? t('roadmap.engine.recommendations.resumeBulletSkipped', { skipped })
          : t('roadmap.engine.recommendations.resumeBulletComplete'),
      ],
      ctaLabel: t('roadmap.engine.cta.practiceAgain', { problem: problemTitle }),
    };
  }

  if (rec.id.startsWith('rec-verify-')) {
    const skipped = prob?.predictionsSkipped ?? 0;
    return {
      title: t('roadmap.engine.recommendations.verifyTitle', {
        problem: problemTitle,
      }),
      summary: t('roadmap.engine.recommendations.verifySummary', {
        problem: problemTitle,
        skipped,
      }),
      whyBullets: [
        t('roadmap.engine.recommendations.verifyBulletCount', {
          skipped,
          problem: problemTitle,
        }),
        t('roadmap.engine.recommendations.verifyBulletReason'),
      ],
      ctaLabel: t('roadmap.engine.cta.practicePredictions', {
        problem: problemTitle,
      }),
    };
  }

  if (rec.id === 'rec-next-two-sum') {
    return {
      title: t('roadmap.engine.recommendations.nextTwoSumTitle'),
      summary: t('roadmap.engine.recommendations.nextTwoSumSummary'),
      whyBullets: [
        t('roadmap.engine.recommendations.nextTwoSumBullet1'),
        t('roadmap.engine.recommendations.nextTwoSumBullet2'),
      ],
      ctaLabel: t('roadmap.engine.cta.start', { problem: 'Two Sum' }),
    };
  }

  if (rec.id === 'rec-next-valid-parentheses') {
    const twoSum = probById.get('two-sum');
    return {
      title: t('roadmap.engine.recommendations.nextValidParenthesesTitle'),
      summary: t('roadmap.engine.recommendations.nextValidParenthesesSummary'),
      whyBullets: [
        t('roadmap.engine.recommendations.nextValidParenthesesBullet1', {
          best: twoSum?.bestVerifiedStages ?? 0,
          total: twoSum?.totalStages ?? 4,
        }),
        t('roadmap.engine.recommendations.nextValidParenthesesBullet2'),
      ],
      ctaLabel: t('roadmap.engine.cta.start', { problem: 'Valid Parentheses' }),
    };
  }

  if (rec.id === 'rec-next-split-array') {
    const bsNode = nodeById.get('binary-search-answer');
    const greedyNode = nodeById.get('greedy-feasibility');
    const missingForSa = Array.from(
      new Set([
        ...(bsNode?.missingPrerequisites ?? []),
        ...(greedyNode?.missingPrerequisites ?? []),
      ]),
    );
    return {
      title: t('roadmap.engine.recommendations.nextSplitArrayTitle'),
      summary: t('roadmap.engine.recommendations.nextSplitArraySummary'),
      whyBullets: [
        missingForSa.length === 0
          ? t('roadmap.engine.recommendations.nextSplitArrayBulletReady')
          : t('roadmap.engine.recommendations.nextSplitArrayBulletMissing', {
              skills: missingForSa
                .map((id) => localizeSkillName(t, id))
                .join(', '),
            }),
        t('roadmap.engine.recommendations.nextSplitArrayBulletIntro'),
      ],
      ctaLabel: t('roadmap.engine.cta.start', {
        problem: 'Split Array Largest Sum',
      }),
    };
  }

  if (rec.id.startsWith('rec-drill-')) {
    const hintKey =
      rec.targetProblemId === 'two-sum' ||
      rec.targetProblemId === 'valid-parentheses' ||
      rec.targetProblemId === 'split-array-largest-sum'
        ? rec.targetProblemId
        : 'fallback';
    const hint = t(`roadmap.engine.recommendations.drillHints.${hintKey}`);
    return {
      title: t('roadmap.engine.recommendations.drillTitle', {
        problem: problemTitle,
      }),
      summary: t('roadmap.engine.recommendations.drillSummary'),
      whyBullets: [
        t('roadmap.engine.recommendations.drillBullet1', {
          count: roadmap.availableProblems.length,
        }),
        t('roadmap.engine.recommendations.drillBullet2'),
        t('roadmap.engine.recommendations.drillBullet3', {
          problem: problemTitle,
          hint,
        }),
      ],
      ctaLabel: t('roadmap.engine.cta.exploreEdgeCases', {
        problem: problemTitle,
      }),
    };
  }

  return {
    title: rec.title,
    summary: rec.summary,
    whyBullets: rec.whyBullets,
    ctaLabel: rec.ctaLabel,
  };
}

export function localizeAlternativeActivityCta(
  t: TFunction,
  alt: RoadmapRecommendation,
  roadmap: PersonalizedRoadmap,
): string {
  const prob = roadmap.availableProblems.find(
    (p) => p.problemId === alt.targetProblemId,
  );
  const problem = prob?.problemTitle ?? alt.title;
  return (prob?.totalSessions ?? 0) > 0
    ? t('roadmap.engine.cta.revisit', { problem })
    : t('roadmap.engine.cta.try', { problem });
}

export function localizeLearningPathStep(
  t: TFunction,
  step: LearningPathStep,
): { note: string; ctaLabel: string } {
  const pSum = step.progressSummary;
  const note =
    pSum.totalSessions === 0
      ? step.missingPrerequisites.length > 0
        ? t('roadmap.engine.stepNotes.suggestedPrereqs', {
            skills: step.missingPrerequisites
              .map((id) => localizeSkillName(t, id))
              .join(', '),
          })
        : t('roadmap.engine.stepNotes.ready')
      : t('roadmap.engine.stepNotes.progress', {
          best: pSum.bestVerifiedStages,
          total: pSum.totalStages,
          firstTry: pSum.predictionsFirstTry,
          attempted: pSum.predictionsAttempted,
        });

  let ctaLabel: string = t('roadmap.engine.cta.start', {
    problem: step.problemTitle,
  });
  if (pSum.totalSessions > 0) {
    ctaLabel =
      step.status === 'Needs Practice'
        ? t('roadmap.engine.cta.review', { problem: step.problemTitle })
        : pSum.bestVerifiedStages < pSum.totalStages
          ? t('roadmap.engine.cta.practiceAgain', { problem: step.problemTitle })
          : t('roadmap.engine.cta.revisit', { problem: step.problemTitle });
  }

  return { note, ctaLabel };
}

export function localizePlannedMilestone(
  t: TFunction,
  milestone: RoadmapMilestone,
): { title: string; description: string } {
  return {
    title: t(`roadmap.plannedTopics.${milestone.id}.title`, {
      defaultValue: milestone.title,
    }),
    description: t(`roadmap.plannedTopics.${milestone.id}.description`, {
      defaultValue: milestone.description,
    }),
  };
}
