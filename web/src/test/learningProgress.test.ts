import { beforeEach, describe, expect, it } from 'vitest';
import {
  aggregateLearningProgress,
  buildLearningSession,
  createSessionId,
} from '../domain/learning/analytics';
import {
  createInitialHintsByStage,
  createInitialStageStatuses,
  markStageSkippedIfIncomplete,
  markStageViewed,
  recordPredictionAnswer,
  recordPredictionSkip,
  recordStageAnswer,
} from '../domain/learning/session';
import { SKILL_REGISTRY } from '../domain/learning/skills';
import type { LearningSession } from '../domain/learning/types';
import {
  LEARNING_SCHEMA_VERSION,
  LEARNING_STORAGE_KEY,
  LocalStorageLearningRepository,
  sanitizeStoredSession,
} from '../services/learningRepository';
import { buildProblemAnalysisFromModule } from '../services/aiClient';
import { twoSumModule } from '../domain/problems/twoSumModule';
import { validParenthesesModule } from '../domain/problems/validParenthesesModule';
import { splitArrayModule } from '../domain/problems/splitArrayModule';

class MemoryStorage implements Storage {
  private map = new Map<string, string>();
  public throwOnSet = false;

  get length(): number {
    return this.map.size;
  }

  clear(): void {
    this.map.clear();
  }

  getItem(key: string): string | null {
    return this.map.get(key) ?? null;
  }

  key(index: number): string | null {
    return Array.from(this.map.keys())[index] ?? null;
  }

  removeItem(key: string): void {
    this.map.delete(key);
  }

  setItem(key: string, value: string): void {
    if (this.throwOnSet) {
      throw new DOMException('Quota exceeded', 'QuotaExceededError');
    }
    this.map.set(key, value);
  }
}

describe('Phase A — buildProblemAnalysisFromModule real SolutionGraph edges', () => {
  it('populates subproblem_decomposition depends_on from real SolutionGraph edges across all modules', () => {
    const twoSumAnalysis = buildProblemAnalysisFromModule(
      twoSumModule,
      'hash-map',
    );
    const twoSumGraph = twoSumModule.solutionGraphs['hash-map'];
    for (const step of twoSumAnalysis.subproblem_decomposition) {
      const expectedDeps = twoSumGraph.edges
        .filter((e) => e.target === step.id)
        .map((e) => e.source);
      expect(step.depends_on).toEqual(expectedDeps);
    }
    expect(
      twoSumAnalysis.subproblem_decomposition.some(
        (d) => d.depends_on.length > 0,
      ),
    ).toBe(true);

    const vpAnalysis = buildProblemAnalysisFromModule(validParenthesesModule);
    const finalEmpty = vpAnalysis.subproblem_decomposition.find(
      (d) => d.id === 'vp-final-empty',
    );
    expect(finalEmpty?.depends_on).toEqual(['vp-push-open', 'vp-match-close']);

    const saAnalysis = buildProblemAnalysisFromModule(splitArrayModule);
    const monoUpdate = saAnalysis.subproblem_decomposition.find(
      (d) => d.id === 'sa-monotonic-update',
    );
    expect(monoUpdate?.depends_on).toEqual(['sa-bs-driver', 'sa-greedy-check']);
  });
});

describe('Phase B & C — Evidence-Based Session Builder & Skill Tracking', () => {
  it('distinguishes viewed, attempted, assisted, and first-try evidence and never awards independent mastery from guided lessons', () => {
    const stageIds = twoSumModule.lesson.stages.map((s) => s.id);
    let statuses = createInitialStageStatuses(twoSumModule.lesson.stages);
    statuses = recordStageAnswer(statuses, 'understand', true); // First-try correct (no hints, no wrong attempts)
    statuses = markStageViewed(statuses, 'discover-brute-force');
    statuses = recordStageAnswer(statuses, 'discover-brute-force', true); // With hint -> correct-with-assistance
    statuses = markStageViewed(statuses, 'discover-optimization');
    statuses = recordStageAnswer(statuses, 'discover-optimization', false);
    statuses = markStageSkippedIfIncomplete(statuses, 'discover-optimization'); // skipped-after-attempt -> attempted
    statuses = markStageViewed(statuses, 'build-solution');
    statuses = markStageSkippedIfIncomplete(statuses, 'build-solution'); // skipped without attempt -> viewed only

    const hintsByStage = {
      ...createInitialHintsByStage(twoSumModule.lesson.stages),
      'discover-brute-force': 2,
    };

    let preds = recordPredictionAnswer({}, 'q1', 'opt-a', true, {
      strategyId: 'hash-map',
      stepAction: 'lookup-miss',
    });
    preds = recordPredictionAnswer(preds, 'q2', 'wrong', false, {
      strategyId: 'hash-map',
      stepAction: 'store-value',
    });
    preds = recordPredictionAnswer(preds, 'q2', 'right', true, {
      strategyId: 'hash-map',
      stepAction: 'store-value',
    });
    preds = recordPredictionSkip(preds, 'q3', {
      strategyId: 'brute-force',
      stepAction: 'select-anchor',
    });

    const session = buildLearningSession({
      sessionId: 'ts-session-1',
      problemId: 'two-sum',
      problemTitle: 'Two Sum',
      mode: 'guided',
      strategiesExplored: ['brute-force', 'hash-map'],
      startedAt: '2026-11-24T04:00:00.000Z',
      completedAt: '2026-11-24T04:10:00.000Z',
      stageIds,
      stageStatuses: statuses,
      hintsByStage,
      predictionRecords: preds,
    });

    expect(session.outcome).toBe('completed-with-skips');
    expect(session.completedStagesCount).toBe(2);
    expect(session.skippedStagesCount).toBe(2);
    expect(session.hintsUsed).toBe(2);
    expect(session.predictionSummary.questionsAttempted).toBe(2);
    expect(session.predictionSummary.firstTryCorrect).toBe(1);
    expect(session.predictionSummary.solvedAfterRetry).toBe(1);
    expect(session.predictionSummary.skippedCount).toBe(1);

    // Guided session must NEVER emit 'independently-demonstrated'
    expect(
      session.skillEvidence.every(
        (ev) => ev.evidenceLevel !== 'independently-demonstrated',
      ),
    ).toBe(true);

    const understandAttempt = session.attempts.find(
      (a) => a.targetId === 'understand',
    );
    expect(understandAttempt?.evidenceLevel).toBe('first-try-correct');

    const bruteStageAttempt = session.attempts.find(
      (a) => a.targetId === 'discover-brute-force',
    );
    expect(bruteStageAttempt?.evidenceLevel).toBe('correct-with-assistance');

    const optAttempt = session.attempts.find(
      (a) => a.targetId === 'discover-optimization',
    );
    expect(optAttempt?.evidenceLevel).toBe('attempted');
    expect(optAttempt?.skipped).toBe(true);
  });

  it('keeps viewing-only sessions at "Introduced (Viewed Only)" and never inflates mastery', () => {
    const stageIds = validParenthesesModule.lesson.stages.map((s) => s.id);
    const statuses = createInitialStageStatuses(
      validParenthesesModule.lesson.stages,
    );
    const session = buildLearningSession({
      sessionId: 'vp-viewed-only',
      problemId: 'valid-parentheses',
      problemTitle: 'Valid Parentheses',
      mode: 'guided',
      strategiesExplored: ['stack-matching'],
      startedAt: '2026-11-24T04:00:00.000Z',
      completedAt: '2026-11-24T04:01:00.000Z',
      stageIds,
      stageStatuses: statuses,
      hintsByStage: createInitialHintsByStage(
        validParenthesesModule.lesson.stages,
      ),
      predictionRecords: {},
    });

    expect(session.outcome).toBe('viewed-only');
    const summary = aggregateLearningProgress([session]);
    const stackSkill = summary.skillSummaries.find(
      (s) => s.skill.id === 'stack-lifo',
    );
    expect(stackSkill?.label).toBe('Introduced (Viewed Only)');
    expect(stackSkill?.indicatorPercent).toBeLessThanOrEqual(20);
    expect(summary.skillsPracticedCount).toBe(0);
    expect(summary.firstTryAccuracyPercent).toBeNull();
  });
});

describe('Phase D — Versioned LocalStorageLearningRepository', () => {
  let storage: MemoryStorage;
  let repo: LocalStorageLearningRepository;

  beforeEach(() => {
    storage = new MemoryStorage();
    repo = new LocalStorageLearningRepository(LEARNING_STORAGE_KEY, storage);
  });

  function makeSession(
    sessionId: string,
    problemId: 'two-sum' | 'valid-parentheses' | 'split-array-largest-sum',
    completedAt: string,
  ): LearningSession {
    return buildLearningSession({
      sessionId,
      problemId,
      problemTitle:
        problemId === 'two-sum'
          ? 'Two Sum'
          : problemId === 'valid-parentheses'
            ? 'Valid Parentheses'
            : 'Split Array Largest Sum',
      mode: 'guided',
      strategiesExplored: [
        problemId === 'two-sum'
          ? 'hash-map'
          : problemId === 'valid-parentheses'
            ? 'stack-matching'
            : 'bs-greedy-composition',
      ],
      startedAt: completedAt,
      completedAt,
      stageIds: ['understand'],
      stageStatuses: { understand: 'completed' },
      hintsByStage: { understand: 0 },
      predictionRecords: {},
    });
  }

  it('saves sessions, prevents duplicates by sessionId, and survives reload', () => {
    const s1 = makeSession('sess-1', 'two-sum', '2026-11-24T04:10:00.000Z');
    const firstSave = repo.saveSession(s1);
    expect(firstSave.saved).toBe(true);
    expect(firstSave.wasDuplicateUpdate).toBe(false);

    // Saving the exact same sessionId again updates in place without duplicating
    const secondSave = repo.saveSession({ ...s1, hintsUsed: 2 });
    expect(secondSave.saved).toBe(true);
    expect(secondSave.wasDuplicateUpdate).toBe(true);

    // Simulate full page reload by creating a fresh repository over the same storage
    const reloadedRepo = new LocalStorageLearningRepository(
      LEARNING_STORAGE_KEY,
      storage,
    );
    const loaded = reloadedRepo.loadSessions();
    expect(loaded.recoveredFromError).toBe(false);
    expect(loaded.sessions).toHaveLength(1);
    expect(loaded.sessions[0].sessionId).toBe('sess-1');
    expect(loaded.sessions[0].hintsUsed).toBe(2);
  });

  it('migrates legacy v0 raw-array storage to v1 versioned envelope', () => {
    const legacySession = makeSession(
      'legacy-1',
      'valid-parentheses',
      '2026-11-24T03:00:00.000Z',
    );
    storage.setItem(LEARNING_STORAGE_KEY, JSON.stringify([legacySession]));

    const loaded = repo.loadSessions();
    expect(loaded.migratedFromVersion).toBe(0);
    expect(loaded.sessions).toHaveLength(1);
    expect(loaded.sessions[0].sessionId).toBe('legacy-1');

    // Verify upgraded envelope is persisted in storage
    const persisted = JSON.parse(storage.getItem(LEARNING_STORAGE_KEY) ?? '{}');
    expect(persisted.schemaVersion).toBe(LEARNING_SCHEMA_VERSION);
    expect(persisted.sessions).toHaveLength(1);
  });

  it('handles corrupted JSON, future schema versions, unavailable storage, and quota errors safely', () => {
    storage.setItem(LEARNING_STORAGE_KEY, '{corrupted-json');
    const corruptRes = repo.loadSessions();
    expect(corruptRes.sessions).toEqual([]);
    expect(corruptRes.recoveredFromError).toBe(true);
    expect(corruptRes.warningMessage).toMatch(/corrupted/i);

    storage.setItem(
      LEARNING_STORAGE_KEY,
      JSON.stringify({ schemaVersion: 99, sessions: [] }),
    );
    const futureRes = repo.loadSessions();
    expect(futureRes.sessions).toEqual([]);
    expect(futureRes.recoveredFromError).toBe(true);

    storage.clear();
    storage.throwOnSet = true;
    const quotaRes = repo.saveSession(
      makeSession('q-1', 'two-sum', '2026-11-24T04:00:00.000Z'),
    );
    expect(quotaRes.saved).toBe(false);
    expect(quotaRes.warningMessage).toMatch(/quota|could not save/i);

    const noStorageRepo = new LocalStorageLearningRepository(
      LEARNING_STORAGE_KEY,
      null,
    );
    expect(noStorageRepo.getStorageInfo().available).toBe(false);
    expect(noStorageRepo.loadSessions().sessions).toEqual([]);
  });

  it('enforces privacy boundaries by stripping unexpected fields and rejecting unverified problem IDs, and clears cleanly', () => {
    const dirtyRaw = {
      ...makeSession('priv-1', 'two-sum', '2026-11-24T04:00:00.000Z'),
      apiKey: 'secret-gemini-key',
      pastedProblemStatement: 'Private interview prompt',
      aiTutorTranscript: [{ role: 'user', text: 'secret question' }],
    };
    const sanitized = sanitizeStoredSession(dirtyRaw);
    expect(sanitized).not.toBeNull();
    const serialized = JSON.stringify(sanitized);
    expect(serialized).not.toContain('secret-gemini-key');
    expect(serialized).not.toContain('Private interview prompt');
    expect(serialized).not.toContain('aiTutorTranscript');

    // Unverified/unknown problemId must be rejected
    const unknownProblem = sanitizeStoredSession({
      ...dirtyRaw,
      problemId: 'custom-pasted-problem',
    });
    expect(unknownProblem).toBeNull();

    // Clear history removes storage cleanly
    repo.saveSession(sanitized!);
    expect(repo.loadSessions().sessions).toHaveLength(1);
    expect(repo.clearHistory().cleared).toBe(true);
    expect(repo.loadSessions().sessions).toEqual([]);
  });
});

describe('Phase E & G — Cross-Problem Aggregation & Deterministic Suggestions', () => {
  it('returns honest empty progress summary with starter suggestions when history is empty', () => {
    const empty = aggregateLearningProgress([]);
    expect(empty.totalSessions).toBe(0);
    expect(empty.problemsPracticedCount).toBe(0);
    expect(empty.firstTryAccuracyPercent).toBeNull();
    expect(empty.skillSummaries).toHaveLength(SKILL_REGISTRY.length);
    expect(
      empty.skillSummaries.every((s) => s.label === 'Not Yet Practiced'),
    ).toBe(true);
    expect(empty.suggestions.length).toBeGreaterThanOrEqual(1);
    expect(empty.suggestions[0].reason.length).toBeGreaterThan(10);
  });

  it('aggregates across Two Sum, Valid Parentheses, and Split Array and generates targeted deterministic suggestions', () => {
    // 1. Two Sum with Hash Map prediction mistakes
    let tsPreds = recordPredictionAnswer({}, 'hm-1', 'wrong', false, {
      strategyId: 'hash-map',
      stepAction: 'lookup-miss',
    });
    tsPreds = recordPredictionAnswer(tsPreds, 'hm-1', 'right', true, {
      strategyId: 'hash-map',
      stepAction: 'lookup-miss',
    });
    tsPreds = recordPredictionSkip(tsPreds, 'hm-2', {
      strategyId: 'hash-map',
      stepAction: 'store-value',
    });
    const tsSession = buildLearningSession({
      sessionId: createSessionId('two-sum', 1000),
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
        'discover-optimization': 'attempted',
        'build-solution': 'skipped',
      },
      hintsByStage: { 'discover-optimization': 2 },
      predictionRecords: tsPreds,
    });

    // 2. Valid Parentheses with Stack/LIFO mistakes
    let vpPreds = recordPredictionAnswer({}, 'vp-1', 'wrong', false, {
      strategyId: 'stack-matching',
      stepAction: 'check-match',
    });
    vpPreds = recordPredictionSkip(vpPreds, 'vp-1', {
      strategyId: 'stack-matching',
      stepAction: 'check-match',
    });
    const vpSession = buildLearningSession({
      sessionId: createSessionId('valid-parentheses', 2000),
      problemId: 'valid-parentheses',
      problemTitle: 'Valid Parentheses',
      mode: 'guided',
      strategiesExplored: ['stack-matching'],
      startedAt: '2026-11-24T04:10:00.000Z',
      completedAt: '2026-11-24T04:15:00.000Z',
      stageIds: validParenthesesModule.lesson.stages.map((s) => s.id),
      stageStatuses: {
        'vp-understand': 'completed',
        'vp-why-stack': 'skipped-after-attempt',
        'vp-trace-ops': 'skipped',
        'vp-build-pseudo': 'unvisited',
      },
      hintsByStage: { 'vp-why-stack': 1 },
      predictionRecords: vpPreds,
    });

    // 3. Split Array with Composition mistakes
    const saPreds = recordPredictionAnswer({}, 'sa-1', 'wrong', false, {
      strategyId: 'bs-greedy-composition',
      stepAction: 'bs-update-bounds',
    });
    const saSession = buildLearningSession({
      sessionId: createSessionId('split-array-largest-sum', 3000),
      problemId: 'split-array-largest-sum',
      problemTitle: 'Split Array Largest Sum',
      mode: 'guided',
      strategiesExplored: ['bs-greedy-composition'],
      startedAt: '2026-11-24T04:20:00.000Z',
      completedAt: '2026-11-24T04:25:00.000Z',
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

    const summary = aggregateLearningProgress([tsSession, vpSession, saSession]);
    expect(summary.totalSessions).toBe(3);
    expect(summary.problemsPracticedCount).toBe(3);
    expect(summary.uniqueStrategiesExploredCount).toBe(4);
    expect(summary.totalHintsUsed).toBe(3);
    expect(summary.totalPredictionsAttempted).toBe(3);
    expect(summary.totalPredictionsSolved).toBe(1);
    expect(summary.totalPredictionsSkipped).toBe(2);

    // Deterministic targeted suggestions with explanations
    const suggestionIds = summary.suggestions.map((s) => s.id);
    expect(suggestionIds).toContain('revisit-hash-map');
    expect(suggestionIds).toContain('revisit-stack-lifo');
    expect(suggestionIds).toContain('revisit-composition');
    for (const s of summary.suggestions) {
      expect(s.reason.length).toBeGreaterThan(20);
    }
  });
});
