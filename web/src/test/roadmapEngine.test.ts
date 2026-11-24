import { describe, expect, it } from 'vitest';
import {
  buildLearningSession,
  createSessionId,
} from '../domain/learning/analytics';
import {
  createInitialStageStatuses,
  recordPredictionAnswer,
  recordPredictionSkip,
} from '../domain/learning/session';
import { buildPersonalizedRoadmap } from '../domain/learning/roadmapEngine';
import {
  SKILL_PREREQUISITE_EDGES,
  validateSkillPrerequisiteGraph,
} from '../domain/learning/skillGraph';
import { SKILL_REGISTRY } from '../domain/learning/skills';
import { twoSumModule } from '../domain/problems/twoSumModule';
import { validParenthesesModule } from '../domain/problems/validParenthesesModule';
import { splitArrayModule } from '../domain/problems/splitArrayModule';

describe('Phase B — Skill Prerequisite Graph Validation', () => {
  it('validates the built-in 8-skill prerequisite DAG with genuine non-linear roots', () => {
    const res = validateSkillPrerequisiteGraph();
    expect(res.valid).toBe(true);
    expect(res.errors).toEqual([]);
    expect(res.topologicalOrder).toHaveLength(8);
    // Genuine non-linear roots: Array Indexing and Stack / LIFO both start at layer 0
    expect(res.layers[0]).toEqual(
      expect.arrayContaining(['array-indexing', 'stack-lifo']),
    );
    // Algorithm Composition depends on both Binary Search on Answer and Greedy Feasibility
    const compSkill = SKILL_REGISTRY.find(
      (s) => s.id === 'algorithm-composition',
    )!;
    expect(compSkill.prerequisites).toEqual([
      'binary-search-answer',
      'greedy-feasibility',
    ]);
  });

  it('detects cycles, self-loops, unknown references, and duplicate edges', () => {
    const cycleSkills = SKILL_REGISTRY.map((s) =>
      s.id === 'array-indexing'
        ? { ...s, prerequisites: ['brute-force' as const] }
        : s,
    );
    const cycleEdges = [
      ...SKILL_PREREQUISITE_EDGES,
      {
        id: 'cycle-edge',
        source: 'brute-force' as const,
        target: 'array-indexing' as const,
        reason: 'Invalid cycle',
      },
    ];
    const cycleRes = validateSkillPrerequisiteGraph(cycleSkills, cycleEdges);
    expect(cycleRes.valid).toBe(false);
    expect(cycleRes.errors.some((e) => /cycle/i.test(e))).toBe(true);

    const selfLoopRes = validateSkillPrerequisiteGraph(SKILL_REGISTRY, [
      ...SKILL_PREREQUISITE_EDGES,
      {
        id: 'self-loop',
        source: 'stack-lifo',
        target: 'stack-lifo',
        reason: 'Invalid self-loop',
      },
    ]);
    expect(selfLoopRes.valid).toBe(false);
    expect(selfLoopRes.errors.some((e) => /self-loop/i.test(e))).toBe(true);

    const dupRes = validateSkillPrerequisiteGraph(SKILL_REGISTRY, [
      ...SKILL_PREREQUISITE_EDGES,
      SKILL_PREREQUISITE_EDGES[0],
    ]);
    expect(dupRes.valid).toBe(false);
    expect(dupRes.errors.some((e) => /duplicate/i.test(e))).toBe(true);
  });
});

describe('Phase C — Deterministic Personalized Roadmap Engine', () => {
  it('generates a beginner starting roadmap for first-time learners with zero history', () => {
    const roadmap = buildPersonalizedRoadmap([]);
    expect(roadmap.isFirstTimeLearner).toBe(true);
    expect(roadmap.recommendedNext.category).toBe('starter');
    expect(roadmap.recommendedNext.targetProblemId).toBe('two-sum');
    expect(roadmap.recommendedNext.whyBullets.length).toBeGreaterThanOrEqual(2);
    expect(roadmap.skillNodes.every((n) => n.status === 'Not Started')).toBe(
      true,
    );
    // Never locks learners out: all 3 verified Studios are listed in learningPath
    expect(roadmap.learningPath).toHaveLength(3);
    expect(roadmap.alternativeActivities).toHaveLength(2);
  });

  it('recommends resuming an incomplete lesson when stages remain unfinished', () => {
    const incompleteSession = buildLearningSession({
      sessionId: createSessionId('two-sum', 100),
      problemId: 'two-sum',
      problemTitle: 'Two Sum',
      mode: 'guided',
      strategiesExplored: ['brute-force'],
      startedAt: '2026-11-24T04:00:00.000Z',
      completedAt: '2026-11-24T04:04:00.000Z',
      stageIds: twoSumModule.lesson.stages.map((s) => s.id),
      stageStatuses: {
        understand: 'completed',
        'discover-brute-force': 'completed',
        'discover-optimization': 'skipped',
        'build-solution': 'unvisited',
      },
      hintsByStage: {},
      predictionRecords: recordPredictionAnswer({}, 'p1', 'ok', true, {
        strategyId: 'brute-force',
        nextStepAction: 'compare-pair',
      }),
    });

    const roadmap = buildPersonalizedRoadmap([incompleteSession]);
    expect(roadmap.isFirstTimeLearner).toBe(false);
    expect(roadmap.recommendedNext.category).toBe('resume-lesson');
    expect(roadmap.recommendedNext.targetProblemId).toBe('two-sum');
    expect(roadmap.recommendedNext.summary).toMatch(/2 of 4/);
    // Sprint 10 Phase A: never use misleading "Resume" wording where no mid-session resume exists
    expect(roadmap.recommendedNext.ctaLabel).not.toMatch(/resume/i);
    expect(roadmap.recommendedNext.summary).toMatch(/fresh session/i);
    for (const step of roadmap.learningPath) {
      expect(step.ctaLabel).not.toMatch(/resume/i);
    }
  });

  it('progresses cleanly on high first-try accuracy and never claims independent mastery', () => {
    let tsPreds = recordPredictionAnswer({}, 'ts-p1', 'ok', true, {
      strategyId: 'brute-force',
      nextStepAction: 'compare-pair',
    });
    tsPreds = recordPredictionAnswer(tsPreds, 'ts-p2', 'ok', true, {
      strategyId: 'hash-map',
      nextStepAction: 'lookup-hit',
    });
    tsPreds = recordPredictionAnswer(tsPreds, 'ts-p3', 'ok', true, {
      strategyId: 'hash-map',
      nextStepAction: 'store-value',
    });

    const strongTwoSum = buildLearningSession({
      sessionId: 'strong-ts',
      problemId: 'two-sum',
      problemTitle: 'Two Sum',
      mode: 'guided',
      strategiesExplored: ['brute-force', 'hash-map'],
      startedAt: '2026-11-24T04:00:00.000Z',
      completedAt: '2026-11-24T04:10:00.000Z',
      stageIds: twoSumModule.lesson.stages.map((s) => s.id),
      stageStatuses: {
        understand: 'completed',
        'discover-brute-force': 'completed',
        'discover-optimization': 'completed',
        'build-solution': 'completed',
      },
      hintsByStage: {},
      predictionRecords: tsPreds,
    });

    const roadmapAfterTwoSum = buildPersonalizedRoadmap([strongTwoSum]);
    expect(roadmapAfterTwoSum.recommendedNext.category).toBe('next-topic');
    expect(roadmapAfterTwoSum.recommendedNext.targetProblemId).toBe(
      'valid-parentheses',
    );
    const hashMapNode = roadmapAfterTwoSum.skillNodes.find(
      (n) => n.skill.id === 'hash-map-lookup',
    )!;
    expect(hashMapNode.status).toBe('Strong Guided Recall');
    // Verify no node ever uses "independent mastery" as a status label
    for (const node of roadmapAfterTwoSum.skillNodes) {
      expect(node.status).not.toMatch(/mastery|independent/i);
    }

    // Adding a strong Valid Parentheses session changes recommendation to Split Array Largest Sum!
    let vpPreds = recordPredictionAnswer({}, 'vp-p1', 'ok', true, {
      strategyId: 'stack-matching',
      nextStepAction: 'push',
    });
    vpPreds = recordPredictionAnswer(vpPreds, 'vp-p2', 'ok', true, {
      strategyId: 'stack-matching',
      nextStepAction: 'pop',
    });
    const strongVp = buildLearningSession({
      sessionId: 'strong-vp',
      problemId: 'valid-parentheses',
      problemTitle: 'Valid Parentheses',
      mode: 'guided',
      strategiesExplored: ['stack-matching'],
      startedAt: '2026-11-24T04:15:00.000Z',
      completedAt: '2026-11-24T04:20:00.000Z',
      stageIds: validParenthesesModule.lesson.stages.map((s) => s.id),
      stageStatuses: {
        'vp-understand': 'completed',
        'vp-why-stack': 'completed',
        'vp-trace-ops': 'completed',
        'vp-build-pseudo': 'completed',
      },
      hintsByStage: {},
      predictionRecords: vpPreds,
    });

    const roadmapAfterVp = buildPersonalizedRoadmap([strongTwoSum, strongVp]);
    expect(roadmapAfterVp.recommendedNext.targetProblemId).toBe(
      'split-array-largest-sum',
    );

    // Completing Split Array cleanly transitions to edge-case drills
    let saPreds = recordPredictionAnswer({}, 'sa-p1', 'ok', true, {
      strategyId: 'bs-greedy-composition',
      nextStepAction: 'bs-select-mid',
    });
    saPreds = recordPredictionAnswer(saPreds, 'sa-p2', 'ok', true, {
      strategyId: 'bs-greedy-composition',
      nextStepAction: 'greedy-result',
    });
    saPreds = recordPredictionAnswer(saPreds, 'sa-p3', 'ok', true, {
      strategyId: 'bs-greedy-composition',
      nextStepAction: 'bs-update-bounds',
    });
    const strongSa = buildLearningSession({
      sessionId: 'strong-sa',
      problemId: 'split-array-largest-sum',
      problemTitle: 'Split Array Largest Sum',
      mode: 'guided',
      strategiesExplored: ['bs-greedy-composition'],
      startedAt: '2026-11-24T04:25:00.000Z',
      completedAt: '2026-11-24T04:35:00.000Z',
      stageIds: splitArrayModule.lesson.stages.map((s) => s.id),
      stageStatuses: {
        'sa-stage-1-understand': 'completed',
        'sa-stage-2-feasibility': 'completed',
        'sa-stage-3-greedy': 'completed',
        'sa-stage-4-bs-answer': 'completed',
        'sa-stage-5-compose': 'completed',
      },
      hintsByStage: {},
      predictionRecords: saPreds,
    });

    const roadmapAllThree = buildPersonalizedRoadmap([
      strongTwoSum,
      strongVp,
      strongSa,
    ]);
    expect(roadmapAllThree.recommendedNext.category).toBe('edge-case-drill');
    // Sprint 10 Phase A: edge-case drill suggestions must respect each problem's actual constraints
    const drillText = roadmapAllThree.recommendedNext.whyBullets.join(' ');
    if (
      roadmapAllThree.recommendedNext.targetProblemId ===
      'split-array-largest-sum'
    ) {
      expect(drillText).not.toMatch(/try negatives/i);
      expect(drillText).toMatch(/nonnegative/i);
    } else if (
      roadmapAllThree.recommendedNext.targetProblemId === 'valid-parentheses'
    ) {
      expect(drillText).toMatch(/brackets/i);
    } else {
      expect(drillText).toMatch(/\[3, 3\]/);
    }
  });

  it('tailors Split Array edge-case drill strictly to nonnegative arrays without suggesting negatives', () => {
    const strongTwoSum = buildLearningSession({
      sessionId: 's-ts',
      problemId: 'two-sum',
      problemTitle: 'Two Sum',
      mode: 'guided',
      strategiesExplored: ['brute-force', 'hash-map'],
      startedAt: '2026-11-24T04:00:00.000Z',
      completedAt: '2026-11-24T04:05:00.000Z',
      stageIds: twoSumModule.lesson.stages.map((s) => s.id),
      stageStatuses: {
        understand: 'completed',
        'discover-brute-force': 'completed',
        'discover-optimization': 'completed',
        'build-solution': 'completed',
      },
      hintsByStage: {},
      predictionRecords: recordPredictionAnswer({}, 'ts-1', 'ok', true, {
        strategyId: 'hash-map',
        nextStepAction: 'lookup-hit',
      }),
    });
    const strongVp = buildLearningSession({
      sessionId: 's-vp',
      problemId: 'valid-parentheses',
      problemTitle: 'Valid Parentheses',
      mode: 'guided',
      strategiesExplored: ['stack-matching'],
      startedAt: '2026-11-24T04:06:00.000Z',
      completedAt: '2026-11-24T04:10:00.000Z',
      stageIds: validParenthesesModule.lesson.stages.map((s) => s.id),
      stageStatuses: {
        'vp-understand': 'completed',
        'vp-why-stack': 'completed',
        'vp-trace-ops': 'completed',
        'vp-build-pseudo': 'completed',
      },
      hintsByStage: {},
      predictionRecords: recordPredictionAnswer({}, 'vp-1', 'ok', true, {
        strategyId: 'stack-matching',
        nextStepAction: 'pop',
      }),
    });
    // Split Array has 0 predictions attempted (lowest rate = 0), so it is selected for the edge-case drill
    const strongSa = buildLearningSession({
      sessionId: 's-sa',
      problemId: 'split-array-largest-sum',
      problemTitle: 'Split Array Largest Sum',
      mode: 'guided',
      strategiesExplored: ['bs-greedy-composition'],
      startedAt: '2026-11-24T04:11:00.000Z',
      completedAt: '2026-11-24T04:15:00.000Z',
      stageIds: splitArrayModule.lesson.stages.map((s) => s.id),
      stageStatuses: {
        'sa-stage-1-understand': 'completed',
        'sa-stage-2-feasibility': 'completed',
        'sa-stage-3-greedy': 'completed',
        'sa-stage-4-bs-answer': 'completed',
        'sa-stage-5-compose': 'completed',
      },
      hintsByStage: {},
      predictionRecords: {},
    });

    const roadmap = buildPersonalizedRoadmap([strongTwoSum, strongVp, strongSa]);
    expect(roadmap.recommendedNext.category).toBe('edge-case-drill');
    expect(roadmap.recommendedNext.targetProblemId).toBe(
      'split-array-largest-sum',
    );
    const drillReason = roadmap.recommendedNext.whyBullets.join(' ');
    expect(drillReason).not.toMatch(/negatives/i);
    expect(drillReason).toMatch(/nonnegative/i);
  });

  it('flags frequent hints and retries as Needs Practice and recommends targeted review', () => {
    let preds = recordPredictionAnswer({}, 'vp-1', 'wrong1', false, {
      strategyId: 'stack-matching',
      nextStepAction: 'pop',
    });
    preds = recordPredictionAnswer(preds, 'vp-1', 'wrong2', false, {
      strategyId: 'stack-matching',
      nextStepAction: 'pop',
    });
    preds = recordPredictionAnswer(preds, 'vp-1', 'right', true, {
      strategyId: 'stack-matching',
      nextStepAction: 'pop',
    });

    const assistedVp = buildLearningSession({
      sessionId: 'assisted-vp',
      problemId: 'valid-parentheses',
      problemTitle: 'Valid Parentheses',
      mode: 'guided',
      strategiesExplored: ['stack-matching'],
      startedAt: '2026-11-24T04:00:00.000Z',
      completedAt: '2026-11-24T04:10:00.000Z',
      stageIds: validParenthesesModule.lesson.stages.map((s) => s.id),
      stageStatuses: {
        'vp-understand': 'completed',
        'vp-why-stack': 'completed',
        'vp-trace-ops': 'completed',
        'vp-build-pseudo': 'completed',
      },
      hintsByStage: {
        'vp-understand': 2,
        'vp-why-stack': 3,
        'vp-trace-ops': 2,
      },
      predictionRecords: preds,
    });

    const roadmap = buildPersonalizedRoadmap([assistedVp]);
    const stackNode = roadmap.skillNodes.find(
      (n) => n.skill.id === 'stack-lifo',
    )!;
    expect(stackNode.status).toBe('Needs Practice');
    expect(roadmap.skillsNeedingReview.map((n) => n.skill.id)).toContain(
      'stack-lifo',
    );
    expect(roadmap.recommendedNext.targetProblemId).toBe('valid-parentheses');
  });

  it('handles skipped-only predictions honestly without marking them as Guided Progress', () => {
    let skips = recordPredictionSkip({}, 'sk-1', {
      strategyId: 'stack-matching',
      nextStepAction: 'push',
    });
    skips = recordPredictionSkip(skips, 'sk-2', {
      strategyId: 'stack-matching',
      nextStepAction: 'pop',
    });

    const skippedSession = buildLearningSession({
      sessionId: 'skipped-vp',
      problemId: 'valid-parentheses',
      problemTitle: 'Valid Parentheses',
      mode: 'guided',
      strategiesExplored: ['stack-matching'],
      startedAt: '2026-11-24T04:00:00.000Z',
      completedAt: '2026-11-24T04:02:00.000Z',
      stageIds: validParenthesesModule.lesson.stages.map((s) => s.id),
      stageStatuses: createInitialStageStatuses(
        validParenthesesModule.lesson.stages,
      ),
      hintsByStage: {},
      predictionRecords: skips,
    });

    const roadmap = buildPersonalizedRoadmap([skippedSession]);
    const stackNode = roadmap.skillNodes.find(
      (n) => n.skill.id === 'stack-lifo',
    )!;
    expect(stackNode.status).toBe('Introduced');
    expect(roadmap.practicedSkills).toHaveLength(0);
  });

  it('detects contradictory evidence (guided stages passed, trace predictions failed) and recommends recall verification', () => {
    // Passed all Two Sum guided stages, yet missed 3 Hash Map trace predictions!
    let mixedPreds = recordPredictionAnswer({}, 'hm-1', 'wrong', false, {
      strategyId: 'hash-map',
      nextStepAction: 'lookup-miss',
    });
    mixedPreds = recordPredictionAnswer(mixedPreds, 'hm-1', 'right', true, {
      strategyId: 'hash-map',
      nextStepAction: 'lookup-miss',
    });
    mixedPreds = recordPredictionAnswer(mixedPreds, 'hm-2', 'wrong', false, {
      strategyId: 'hash-map',
      nextStepAction: 'store-value',
    });
    mixedPreds = recordPredictionSkip(mixedPreds, 'hm-2', {
      strategyId: 'hash-map',
      nextStepAction: 'store-value',
    });
    mixedPreds = recordPredictionAnswer(mixedPreds, 'hm-3', 'wrong', false, {
      strategyId: 'hash-map',
      nextStepAction: 'lookup-hit',
    });
    mixedPreds = recordPredictionSkip(mixedPreds, 'hm-3', {
      strategyId: 'hash-map',
      nextStepAction: 'lookup-hit',
    });

    const contradictorySession = buildLearningSession({
      sessionId: 'contra-ts',
      problemId: 'two-sum',
      problemTitle: 'Two Sum',
      mode: 'guided',
      strategiesExplored: ['brute-force', 'hash-map'],
      startedAt: '2026-11-24T04:00:00.000Z',
      completedAt: '2026-11-24T04:12:00.000Z',
      stageIds: twoSumModule.lesson.stages.map((s) => s.id),
      stageStatuses: {
        understand: 'completed',
        'discover-brute-force': 'completed',
        'discover-optimization': 'completed',
        'build-solution': 'completed',
      },
      hintsByStage: {},
      predictionRecords: mixedPreds,
    });

    const roadmap = buildPersonalizedRoadmap([contradictorySession]);
    const hashMapNode = roadmap.skillNodes.find(
      (n) => n.skill.id === 'hash-map-lookup',
    )!;
    expect(hashMapNode.hasContradictoryEvidence).toBe(true);
    expect(hashMapNode.contradictionNote).toMatch(/mixed signals/i);
    expect(hashMapNode.status).toBe('Needs Practice');
    expect(roadmap.recommendedNext.category).toBe('verify-recall');
    expect(roadmap.recommendedNext.targetProblemId).toBe('two-sum');
  });
});
