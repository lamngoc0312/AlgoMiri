import { beforeEach, describe, expect, it } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import i18n from '../i18n';
import type { LearningAttempt, LearningSession } from '../domain/learning/types';
import {
  getLevelProgress,
  sanitizeXp,
  totalXpForLevel,
  xpRequiredForLevelStep,
} from '../domain/gamification/leveling';
import {
  XP_POLICY,
  extractSessionXpCandidates,
} from '../domain/gamification/xpPolicy';
import {
  LocalStorageXpLedgerRepository,
  XP_LEDGER_STORAGE_KEY,
  defaultXpLedgerRepository,
} from '../services/xpLedgerRepository';
import {
  LEARNING_STORAGE_KEY,
  LocalStorageLearningRepository,
  defaultLearningRepository,
} from '../services/learningRepository';
import { ProfilePage } from '../pages/ProfilePage';
import { MiriIslandsPage } from '../pages/MiriIslandsPage';

function makeAttempt(
  overrides: Partial<LearningAttempt> & { id: string; targetId: string },
): LearningAttempt {
  return {
    source: 'guided-stage',
    skillIds: ['hash-map-lookup'],
    correct: true,
    firstTry: true,
    retries: 0,
    hintsUsed: 0,
    skipped: false,
    evidenceLevel: 'first-try-correct',
    ...overrides,
  };
}

function makeSession(overrides: Partial<LearningSession> = {}): LearningSession {
  const completedAt = overrides.completedAt ?? '2026-06-15T10:00:00.000Z';
  return {
    sessionId: 'sess-1',
    problemId: 'two-sum',
    problemTitle: 'Two Sum',
    mode: 'guided',
    strategiesExplored: ['hash-map'],
    startedAt: completedAt,
    completedAt,
    stageStatuses: {},
    outcome: 'completed-guided',
    totalStages: 2,
    completedStagesCount: 2,
    skippedStagesCount: 0,
    attemptedStagesCount: 2,
    hintsUsed: 0,
    hintsByStage: {},
    skillEvidence: [],
    events: [],
    predictionSummary: {
      totalQuestions: 1,
      questionsAttempted: 1,
      firstTryCorrect: 1,
      solvedAfterRetry: 0,
      totalSolved: 1,
      totalRetries: 0,
      skippedCount: 0,
      skippedAfterAttempt: 0,
      skippedWithoutAttempt: 0,
      unresolvedAttempt: 0,
    },
    attempts: [
      makeAttempt({
        id: 'att-stage-1',
        targetId: 'stage-1',
        source: 'guided-stage',
        evidenceLevel: 'first-try-correct',
      }),
      makeAttempt({
        id: 'att-stage-2',
        targetId: 'stage-2',
        source: 'guided-stage',
        evidenceLevel: 'correct-with-assistance',
        firstTry: false,
        retries: 1,
      }),
      makeAttempt({
        id: 'att-pred-1',
        targetId: 'pred-1',
        source: 'trace-prediction',
        evidenceLevel: 'first-try-correct',
      }),
    ],
    ...overrides,
  };
}

function createMemoryStorage(): Storage {
  const store = new Map<string, string>();
  return {
    get length() {
      return store.size;
    },
    clear: () => store.clear(),
    getItem: (key: string) => store.get(key) ?? null,
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    removeItem: (key: string) => {
      store.delete(key);
    },
    setItem: (key: string, value: string) => {
      store.set(key, String(value));
    },
  };
}

describe('Phase 8A.1 — Level progression module', () => {
  it('starts at Level 1 with 0 XP and follows exact progressive thresholds', () => {
    expect(totalXpForLevel(1)).toBe(0);
    expect(totalXpForLevel(2)).toBe(100);
    expect(totalXpForLevel(3)).toBe(250);
    expect(totalXpForLevel(4)).toBe(450);
    expect(totalXpForLevel(5)).toBe(700);
    expect(totalXpForLevel(6)).toBe(1000);

    expect(xpRequiredForLevelStep(1)).toBe(100);
    expect(xpRequiredForLevelStep(2)).toBe(150);
    expect(xpRequiredForLevelStep(3)).toBe(200);

    const lv1Zero = getLevelProgress(0);
    expect(lv1Zero.level).toBe(1);
    expect(lv1Zero.xpIntoLevel).toBe(0);
    expect(lv1Zero.xpForNextLevel).toBe(100);
    expect(lv1Zero.xpRemainingToNextLevel).toBe(100);
    expect(lv1Zero.progressPercent).toBe(0);

    const lv1Edge = getLevelProgress(99);
    expect(lv1Edge.level).toBe(1);
    expect(lv1Edge.xpIntoLevel).toBe(99);
    expect(lv1Edge.xpRemainingToNextLevel).toBe(1);
    expect(lv1Edge.progressPercent).toBe(99);

    const lv2Exact = getLevelProgress(100);
    expect(lv2Exact.level).toBe(2);
    expect(lv2Exact.xpIntoLevel).toBe(0);
    expect(lv2Exact.xpForNextLevel).toBe(150);
    expect(lv2Exact.xpRemainingToNextLevel).toBe(150);
    expect(lv2Exact.progressPercent).toBe(0);

    const lv3Exact = getLevelProgress(250);
    expect(lv3Exact.level).toBe(3);
    expect(lv3Exact.xpIntoLevel).toBe(0);
    expect(lv3Exact.xpForNextLevel).toBe(200);
  });

  it('handles large XP values and invalid inputs safely', () => {
    expect(sanitizeXp(-500)).toBe(0);
    expect(sanitizeXp(Number.NaN)).toBe(0);
    expect(sanitizeXp(Number.POSITIVE_INFINITY)).toBe(0);
    expect(sanitizeXp(42.9)).toBe(42);

    const invalid = getLevelProgress(Number.NaN);
    expect(invalid.level).toBe(1);
    expect(invalid.totalXp).toBe(0);

    const huge = getLevelProgress(10_000_000);
    expect(huge.level).toBeGreaterThan(600);
    expect(huge.totalXp).toBe(10_000_000);
    expect(huge.totalXp).toBeGreaterThanOrEqual(huge.currentLevelFloorXp);
    expect(huge.totalXp).toBeLessThan(huge.nextLevelThresholdXp);
  });
});

describe('Phase 8A.1 — Deterministic XP policy', () => {
  it('awards 0 XP for viewed-only and skipped-without-attempt sessions', () => {
    const viewedOnly = makeSession({
      sessionId: 'sess-viewed',
      outcome: 'viewed-only',
      completedStagesCount: 0,
      attemptedStagesCount: 0,
      attempts: [],
      predictionSummary: {
        totalQuestions: 2,
        questionsAttempted: 0,
        firstTryCorrect: 0,
        solvedAfterRetry: 0,
        totalSolved: 0,
        totalRetries: 0,
        skippedCount: 0,
        skippedAfterAttempt: 0,
        skippedWithoutAttempt: 0,
        unresolvedAttempt: 0,
      },
    });
    expect(extractSessionXpCandidates(viewedOnly)).toEqual([]);

    const skippedOnly = makeSession({
      sessionId: 'sess-skipped',
      outcome: 'completed-with-skips',
      completedStagesCount: 0,
      skippedStagesCount: 2,
      attemptedStagesCount: 0,
      attempts: [
        makeAttempt({
          id: 's1',
          targetId: 'stage-1',
          correct: false,
          firstTry: false,
          skipped: true,
          evidenceLevel: 'viewed',
        }),
      ],
      predictionSummary: {
        totalQuestions: 1,
        questionsAttempted: 0,
        firstTryCorrect: 0,
        solvedAfterRetry: 0,
        totalSolved: 0,
        totalRetries: 0,
        skippedCount: 1,
        skippedAfterAttempt: 0,
        skippedWithoutAttempt: 1,
        unresolvedAttempt: 0,
      },
    });
    expect(extractSessionXpCandidates(skippedOnly)).toEqual([]);
  });

  it('awards fair XP for first-try, assisted, attempted, and completion evidence', () => {
    const session = makeSession();
    // stage-1 (15) + stage-2 (10) + pred-1 (10) + completed-guided (25) = 60 XP
    const candidates = extractSessionXpCandidates(session);
    const total = candidates.reduce((acc, c) => acc + c.baseXp, 0);
    expect(total).toBe(
      XP_POLICY.guidedStage.firstTryCorrect +
        XP_POLICY.guidedStage.correctWithAssistance +
        XP_POLICY.tracePrediction.firstTryCorrect +
        XP_POLICY.completionBonus.completedGuided,
    );
    expect(total).toBe(60);
  });

  it('evaluates multi-topic Split Array once without doubling XP', () => {
    const storage = createMemoryStorage();
    const ledger = new LocalStorageXpLedgerRepository('test.xp.split', storage);

    const splitArraySession = makeSession({
      sessionId: 'sess-split-1',
      problemId: 'split-array-largest-sum',
      problemTitle: 'Split Array Largest Sum',
      attempts: [
        makeAttempt({
          id: 'bs-1',
          targetId: 'stage-bs',
          skillIds: ['binary-search-answer'],
          evidenceLevel: 'first-try-correct',
        }),
        makeAttempt({
          id: 'gr-1',
          targetId: 'stage-greedy',
          skillIds: ['greedy-feasibility'],
          evidenceLevel: 'first-try-correct',
        }),
      ],
    });

    const result = ledger.recordSession(splitArraySession);
    // 15 + 15 + 25 = 55 XP (never doubled to 110)
    expect(result.xpAwarded).toBe(55);
    expect(result.totalXp).toBe(55);
  });
});

describe('Phase 8A.1 — Durable XP ledger, idempotency, caps, and eviction safety', () => {
  it('awards 0 duplicate XP on identical re-save and only incremental XP on in-place update', () => {
    const storage = createMemoryStorage();
    const ledger = new LocalStorageXpLedgerRepository('test.xp.idemp', storage);

    const partial = makeSession({
      sessionId: 'sess-growing',
      outcome: 'partial-attempt',
      completedStagesCount: 1,
      attempts: [
        makeAttempt({
          id: 'a1',
          targetId: 'stage-1',
          evidenceLevel: 'first-try-correct',
        }),
      ],
    });

    const first = ledger.recordSession(partial);
    expect(first.xpAwarded).toBe(15);

    // Re-saving exact same session -> 0 duplicate XP
    const duplicate = ledger.recordSession(partial);
    expect(duplicate.xpAwarded).toBe(0);
    expect(duplicate.totalXp).toBe(15);

    // Updating session in place with stage-2 + completion -> awards stage-2 (10) + completion (25) = 35
    const completed = makeSession({
      ...partial,
      outcome: 'completed-guided',
      completedStagesCount: 2,
      attempts: [
        ...partial.attempts,
        makeAttempt({
          id: 'a2',
          targetId: 'stage-2',
          evidenceLevel: 'correct-with-assistance',
          firstTry: false,
          retries: 1,
        }),
      ],
    });

    const updated = ledger.recordSession(completed);
    expect(updated.xpAwarded).toBe(35);
    expect(updated.totalXp).toBe(50);

    // Re-saving completed session again -> 0 duplicate completion bonus
    const repeatCompleted = ledger.recordSession(completed);
    expect(repeatCompleted.xpAwarded).toBe(0);
    expect(repeatCompleted.totalXp).toBe(50);
  });

  it('enforces per-session, per-problem-day, and global daily anti-farming caps', () => {
    const storage = createMemoryStorage();
    const ledger = new LocalStorageXpLedgerRepository('test.xp.caps', storage);

    // 1. Per-session cap (100 XP)
    const hugeSession = makeSession({
      sessionId: 'sess-huge',
      problemId: 'two-sum',
      completedAt: '2026-06-15T09:00:00.000Z',
      attempts: Array.from({ length: 12 }, (_, idx) =>
        makeAttempt({
          id: `g-${idx}`,
          targetId: `stage-${idx}`,
          evidenceLevel: 'first-try-correct',
        }),
      ),
    });
    const r1 = ledger.recordSession(hugeSession);
    expect(r1.xpAwarded).toBe(XP_POLICY.caps.maxXpPerSession); // 100

    // 2. Per-problem daily cap (120 XP): second two-sum session same day can only add 20 XP
    const secondSameProblem = makeSession({
      sessionId: 'sess-two-sum-2',
      problemId: 'two-sum',
      completedAt: '2026-06-15T10:00:00.000Z',
    });
    const r2 = ledger.recordSession(secondSameProblem);
    expect(r2.xpAwarded).toBe(20);
    expect(r2.totalXp).toBe(120);

    // Third two-sum session same day -> 0 XP
    const thirdSameProblem = makeSession({
      sessionId: 'sess-two-sum-3',
      problemId: 'two-sum',
      completedAt: '2026-06-15T11:00:00.000Z',
    });
    expect(ledger.recordSession(thirdSameProblem).xpAwarded).toBe(0);

    // 3. Global daily cap (250 XP) across other Studios on the same day
    const stackBig = makeSession({
      sessionId: 'sess-stack-1',
      problemId: 'valid-parentheses',
      completedAt: '2026-06-15T12:00:00.000Z',
      attempts: Array.from({ length: 8 }, (_, idx) =>
        makeAttempt({
          id: `st-${idx}`,
          targetId: `stage-${idx}`,
          evidenceLevel: 'first-try-correct',
        }),
      ),
    });
    expect(ledger.recordSession(stackBig).xpAwarded).toBe(100); // day total: 220

    const splitSameDay = makeSession({
      sessionId: 'sess-split-day',
      problemId: 'split-array-largest-sum',
      completedAt: '2026-06-15T13:00:00.000Z',
    });
    // Remaining global daily room is 250 - 220 = 30 XP
    expect(ledger.recordSession(splitSameDay).xpAwarded).toBe(30);
    expect(ledger.load().totalXp).toBe(XP_POLICY.caps.maxXpPerDay);
  });

  it('preserves earned XP when LearningRepository evicts sessions past its 100-session cap', () => {
    const storage = createMemoryStorage();
    const xpLedger = new LocalStorageXpLedgerRepository(
      XP_LEDGER_STORAGE_KEY,
      storage,
    );
    const learningRepo = new LocalStorageLearningRepository(
      LEARNING_STORAGE_KEY,
      storage,
      xpLedger,
    );

    // Save 105 distinct sessions across 105 days (1 session/day = 40 XP each: 15 + 25)
    const baseMs = Date.UTC(2025, 0, 1, 12, 0, 0);
    for (let i = 0; i < 105; i += 1) {
      const completedAt = new Date(baseMs + i * 86_400_000).toISOString();
      learningRepo.saveSession(
        makeSession({
          sessionId: `evict-sess-${i}`,
          completedAt,
          totalStages: 1,
          completedStagesCount: 1,
          attempts: [
            makeAttempt({
              id: `att-${i}`,
              targetId: 'stage-1',
              evidenceLevel: 'first-try-correct',
            }),
          ],
        }),
      );
    }

    // LearningRepository only retains 100 most recent sessions
    const retained = learningRepo.loadSessions();
    expect(retained.sessions).toHaveLength(100);

    // Durable XP ledger MUST retain all 105 * 40 = 4200 XP
    const ledgerState = xpLedger.load();
    expect(ledgerState.totalXp).toBe(105 * 40);

    // Re-syncing the 100 retained sessions does not drop or duplicate XP
    const afterSync = xpLedger.syncSessions(retained.sessions);
    expect(afterSync.xpAwarded).toBe(0);
    expect(afterSync.totalXp).toBe(105 * 40);
  });

  it('reconciles existing retained history on first use without duplicating on reload', () => {
    const storage = createMemoryStorage();
    // Simulate pre-8A.1 user with 2 saved sessions and no XP ledger yet
    const legacyRepo = new LocalStorageLearningRepository(
      LEARNING_STORAGE_KEY,
      storage,
      null,
    );
    legacyRepo.saveSession(
      makeSession({
        sessionId: 'pre-8a-1',
        completedAt: '2026-06-10T10:00:00.000Z',
      }),
    );
    legacyRepo.saveSession(
      makeSession({
        sessionId: 'pre-8a-2',
        completedAt: '2026-06-11T10:00:00.000Z',
      }),
    );

    const xpLedger = new LocalStorageXpLedgerRepository(
      XP_LEDGER_STORAGE_KEY,
      storage,
    );
    expect(xpLedger.load().initialized).toBe(false);

    const firstSync = xpLedger.syncSessions(legacyRepo.loadSessions().sessions);
    expect(firstSync.xpAwarded).toBe(120);
    expect(firstSync.totalXp).toBe(120);

    // Second sync on reload awards 0
    const secondSync = xpLedger.syncSessions(legacyRepo.loadSessions().sessions);
    expect(secondSync.xpAwarded).toBe(0);
    expect(secondSync.totalXp).toBe(120);
  });

  it('handles multi-tab writes, explicit history clear, corruption, and future schema safely', () => {
    const storage = createMemoryStorage();
    const tabA = new LocalStorageXpLedgerRepository(XP_LEDGER_STORAGE_KEY, storage);
    const tabB = new LocalStorageXpLedgerRepository(XP_LEDGER_STORAGE_KEY, storage);

    tabA.recordSession(makeSession({ sessionId: 'tab-a-1' }));
    tabB.recordSession(
      makeSession({
        sessionId: 'tab-b-1',
        completedAt: '2026-06-16T10:00:00.000Z',
      }),
    );
    expect(tabA.load().totalXp).toBe(120);

    // Privacy check: persisted JSON contains no problemTitle or user text
    const rawSaved = storage.getItem(XP_LEDGER_STORAGE_KEY) ?? '';
    expect(rawSaved).not.toContain('Two Sum');

    // Explicit history clear resets both learning history and XP ledger
    const learningRepo = new LocalStorageLearningRepository(
      LEARNING_STORAGE_KEY,
      storage,
      tabA,
    );
    learningRepo.clearHistory();
    expect(tabA.load().totalXp).toBe(0);
    expect(tabA.load().levelProgress.level).toBe(1);

    // Corrupted JSON recovers cleanly
    storage.setItem(XP_LEDGER_STORAGE_KEY, '{broken-json');
    const corrupted = tabA.load();
    expect(corrupted.recoveredFromError).toBe(true);
    expect(corrupted.totalXp).toBe(0);

    // Future schema version is read-only and never overwritten
    const futurePayload = JSON.stringify({
      schemaVersion: 99,
      initialized: true,
      entries: [],
    });
    storage.setItem(XP_LEDGER_STORAGE_KEY, futurePayload);
    const futureLoad = tabA.load();
    expect(futureLoad.readOnlyFutureSchema).toBe(true);
    const futureSync = tabA.recordSession(makeSession({ sessionId: 'ignored' }));
    expect(futureSync.persisted).toBe(false);
    expect(storage.getItem(XP_LEDGER_STORAGE_KEY)).toBe(futurePayload);

    // Unavailable storage does not crash
    const noStorageLedger = new LocalStorageXpLedgerRepository(
      XP_LEDGER_STORAGE_KEY,
      null,
    );
    expect(noStorageLedger.load().totalXp).toBe(0);
    expect(noStorageLedger.recordSession(makeSession()).persisted).toBe(false);
  });
});

describe('Phase 8A.1 — Profile & Miri Islands UI integration', () => {
  beforeEach(async () => {
    window.localStorage.clear();
    defaultLearningRepository.clearHistory();
    defaultXpLedgerRepository.reset();
    await i18n.changeLanguage('en');
  });

  it('renders Level 1 and 0 XP cleanly for a new learner on Profile in EN and VI', async () => {
    const { rerender } = render(
      <MemoryRouter>
        <ProfilePage />
      </MemoryRouter>,
    );

    expect(screen.getByTestId('profile-xp-level-card')).toBeInTheDocument();
    expect(screen.getByTestId('xp-level-badge')).toHaveTextContent('Level 1');
    expect(screen.getByTestId('xp-total-value')).toHaveTextContent('0 XP');
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');

    await act(async () => {
      await i18n.changeLanguage('vi');
    });
    rerender(
      <MemoryRouter>
        <ProfilePage />
      </MemoryRouter>,
    );
    expect(screen.getByTestId('xp-level-badge')).toHaveTextContent('Cấp 1');
    expect(screen.getByTestId('xp-total-value')).toHaveTextContent('0 XP');
  });

  it('reflects earned XP & Level on Profile and /islands, while demo preview grants 0 XP', () => {
    // Save 2 verified sessions across 2 days -> 60 + 60 = 120 XP -> Level 2 (20 / 150)
    defaultLearningRepository.saveSession(
      makeSession({
        sessionId: 'ui-sess-1',
        completedAt: '2026-06-14T10:00:00.000Z',
      }),
    );
    defaultLearningRepository.saveSession(
      makeSession({
        sessionId: 'ui-sess-2',
        completedAt: '2026-06-15T10:00:00.000Z',
      }),
    );

    const { unmount } = render(
      <MemoryRouter>
        <ProfilePage />
      </MemoryRouter>,
    );

    expect(screen.getByTestId('xp-level-badge')).toHaveTextContent('Level 2');
    expect(screen.getByTestId('xp-total-value')).toHaveTextContent('120 XP');
    expect(screen.getByTestId('xp-level-progress-text')).toHaveTextContent(
      '20 / 150 XP',
    );
    unmount();

    // Render /islands and verify compact Level pill + demo preview grants 0 XP
    render(
      <MemoryRouter>
        <MiriIslandsPage />
      </MemoryRouter>,
    );

    expect(screen.getByTestId('world-map-level-badge')).toHaveTextContent(
      'Lv. 2 · 120 XP',
    );

    // Click Storage Harbor and toggle demo stage preview
    fireEvent.click(screen.getByTestId('world-island-storage-harbor'));
    const developingPreviewBtn = screen.getByTestId('growth-demo-btn-developing');
    fireEvent.click(developingPreviewBtn);

    // Demo preview must NEVER add XP
    expect(defaultXpLedgerRepository.load().totalXp).toBe(120);
    expect(screen.getByTestId('world-map-level-badge')).toHaveTextContent(
      'Lv. 2 · 120 XP',
    );
  });
});
