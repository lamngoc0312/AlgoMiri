import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import i18n from '../i18n';
import {
  addCalendarDays,
  aggregateStudyActivity,
  isEligiblePracticeSession,
  toLocalDateKey,
} from '../domain/learning/activityStreak';
import { buildLearningSession } from '../domain/learning/analytics';
import {
  LEARNING_STORAGE_KEY,
  LocalStorageLearningRepository,
} from '../services/learningRepository';
import { LocalStorageAiProblemHistoryRepository } from '../services/aiProblemHistoryRepository';
import { AppRoutes } from '../app/App';

function localIso(year: number, month: number, day: number, hour = 14, minute = 0): string {
  return new Date(year, month - 1, day, hour, minute, 0, 0).toISOString();
}

function makePracticeSession(
  sessionId: string,
  completedAt: string,
  activeStudySeconds?: number,
) {
  return buildLearningSession({
    sessionId,
    problemId: 'two-sum',
    problemTitle: 'Two Sum',
    mode: 'guided',
    strategiesExplored: ['hash-map'],
    startedAt: completedAt,
    completedAt,
    activeStudySeconds,
    stageIds: ['understand', 'strategy'],
    stageStatuses: { understand: 'completed', strategy: 'viewed' },
    hintsByStage: { understand: 0, strategy: 0 },
    predictionRecords: {},
  });
}

function makePredictionOnlySession(sessionId: string, completedAt: string) {
  return buildLearningSession({
    sessionId,
    problemId: 'valid-parentheses',
    problemTitle: 'Valid Parentheses',
    mode: 'guided',
    strategiesExplored: ['stack'],
    startedAt: completedAt,
    completedAt,
    stageIds: ['understand'],
    stageStatuses: { understand: 'viewed' },
    hintsByStage: { understand: 0 },
    predictionRecords: {
      'pred-1': {
        questionId: 'pred-1',
        strategyId: 'stack',
        stepAction: 'push',
        stepIndex: 0,
        retryCount: 0,
        solved: true,
        firstAttemptCorrect: true,
        skipped: false,
        wasEverSkipped: false,
        lastSelectedOptionId: 'opt-a',
      },
    },
  });
}

function makeViewedOnlySession(sessionId: string, completedAt: string) {
  return buildLearningSession({
    sessionId,
    problemId: 'two-sum',
    problemTitle: 'Two Sum',
    mode: 'explore',
    strategiesExplored: ['brute-force'],
    startedAt: completedAt,
    completedAt,
    stageIds: ['understand'],
    stageStatuses: { understand: 'viewed' },
    hintsByStage: { understand: 0 },
    predictionRecords: {},
  });
}

function makeSkippedOnlySession(sessionId: string, completedAt: string) {
  return buildLearningSession({
    sessionId,
    problemId: 'two-sum',
    problemTitle: 'Two Sum',
    mode: 'guided',
    strategiesExplored: ['brute-force'],
    startedAt: completedAt,
    completedAt,
    stageIds: ['understand', 'strategy'],
    stageStatuses: { understand: 'skipped', strategy: 'skipped' },
    hintsByStage: { understand: 0, strategy: 0 },
    predictionRecords: {
      'pred-skip': {
        questionId: 'pred-skip',
        strategyId: 'brute-force',
        stepAction: 'check',
        stepIndex: 1,
        retryCount: 0,
        solved: false,
        firstAttemptCorrect: false,
        skipped: true,
        wasEverSkipped: true,
        lastSelectedOptionId: null,
      },
    },
  });
}

describe('Phase 5B — Pure activity & streak aggregation rules', () => {
  it('computes consecutive streaks, handles missing days, and distinguishes practiced today vs yesterday', () => {
    const now = new Date(2026, 10, 26, 15, 0, 0); // Nov 26, 2026 local

    // Practiced today + yesterday + 2 days ago -> current streak 3, longest 3
    const activeToday = aggregateStudyActivity(
      [
        makePracticeSession('s1', localIso(2026, 11, 24), 120),
        makePracticeSession('s2', localIso(2026, 11, 25), 180),
        makePracticeSession('s3', localIso(2026, 11, 26), 90),
      ],
      { now },
    );
    expect(activeToday.currentStreak).toBe(3);
    expect(activeToday.longestObservedStreak).toBe(3);
    expect(activeToday.practicedToday).toBe(true);
    expect(activeToday.practicedYesterdayOnly).toBe(false);
    expect(activeToday.totalActiveDaysInRange).toBe(3);

    // Practiced yesterday (Nov 25) and Nov 24, NOT today -> streak preserved at 2 until today ends
    const activeYesterday = aggregateStudyActivity(
      [
        makePracticeSession('s1', localIso(2026, 11, 24)),
        makePracticeSession('s2', localIso(2026, 11, 25)),
      ],
      { now },
    );
    expect(activeYesterday.currentStreak).toBe(2);
    expect(activeYesterday.practicedToday).toBe(false);
    expect(activeYesterday.practicedYesterdayOnly).toBe(true);

    // Missed yesterday and today -> current streak 0, longest observed streak preserved at 4
    const broken = aggregateStudyActivity(
      [
        makePracticeSession('s1', localIso(2026, 11, 10)),
        makePracticeSession('s2', localIso(2026, 11, 11)),
        makePracticeSession('s3', localIso(2026, 11, 12)),
        makePracticeSession('s4', localIso(2026, 11, 13)),
        makePracticeSession('s5', localIso(2026, 11, 20)),
      ],
      { now },
    );
    expect(broken.currentStreak).toBe(0);
    expect(broken.longestObservedStreak).toBe(4);
    expect(broken.totalActiveDaysInRange).toBe(5);
  });

  it('excludes viewed-only and skipped-only sessions while including genuine question and prediction attempts', () => {
    const now = new Date(2026, 10, 26, 15, 0, 0);
    const viewed = makeViewedOnlySession('v1', localIso(2026, 11, 26));
    const skipped = makeSkippedOnlySession('sk1', localIso(2026, 11, 25));
    const predOnly = makePredictionOnlySession('p1', localIso(2026, 11, 26));

    expect(isEligiblePracticeSession(viewed)).toBe(false);
    expect(isEligiblePracticeSession(skipped)).toBe(false);
    expect(isEligiblePracticeSession(predOnly)).toBe(true);

    const summary = aggregateStudyActivity([viewed, skipped, predOnly], { now });
    expect(summary.totalEligibleSessions).toBe(1);
    expect(summary.currentStreak).toBe(1);
    expect(summary.activeDateKeys).toEqual(['2026-11-26']);
  });

  it('counts multiple sessions on one date as one active day and deduplicates repeated session IDs', () => {
    const now = new Date(2026, 10, 26, 18, 0, 0);
    const summary = aggregateStudyActivity(
      [
        makePracticeSession('same-id', localIso(2026, 11, 26, 10, 0), 60),
        makePracticeSession('same-id', localIso(2026, 11, 26, 10, 5), 95),
        makePracticeSession('other-id', localIso(2026, 11, 26, 14, 0), 120),
      ],
      { now },
    );
    expect(summary.totalEligibleSessions).toBe(2);
    expect(summary.totalActiveDaysInRange).toBe(1);
    expect(summary.currentStreak).toBe(1);
    expect(summary.activityByDate['2026-11-26']).toMatchObject({
      eligibleSessionCount: 2,
      activeStudySeconds: 215, // 95 + 120 (not double-counted 60+95)
    });
  });

  it('ignores invalid and future-dated timestamps so streaks cannot be inflated', () => {
    const now = new Date(2026, 10, 26, 12, 0, 0);
    const invalidSession = {
      ...makePracticeSession('bad-date', localIso(2026, 11, 26)),
      completedAt: 'not-a-valid-date',
    };
    const futureSession = makePracticeSession('future', localIso(2026, 11, 28));
    const validToday = makePracticeSession('valid', localIso(2026, 11, 26, 11, 0));

    const summary = aggregateStudyActivity(
      [invalidSession, futureSession, validToday],
      { now },
    );
    expect(summary.currentStreak).toBe(1);
    expect(summary.longestObservedStreak).toBe(1);
    expect(summary.activeDateKeys).toEqual(['2026-11-26']);
  });

  it('handles month boundaries, year boundaries, leap day, DST transitions, and local cross-midnight completion dates', () => {
    // Leap day 2024-02-28 -> 2024-02-29 -> 2024-03-01
    expect(addCalendarDays('2024-02-28', 1)).toBe('2024-02-29');
    expect(addCalendarDays('2024-02-29', 1)).toBe('2024-03-01');
    // Year boundary 2025-12-31 -> 2026-01-01
    expect(addCalendarDays('2025-12-31', 1)).toBe('2026-01-01');
    // DST spring-forward and fall-back boundaries
    expect(addCalendarDays('2026-03-07', 1)).toBe('2026-03-08');
    expect(addCalendarDays('2026-03-08', 1)).toBe('2026-03-09');
    expect(addCalendarDays('2026-10-31', 1)).toBe('2026-11-01');
    expect(addCalendarDays('2026-11-01', 1)).toBe('2026-11-02');

    // Cross-midnight session: started 23:50 on Dec 31, completed 00:10 on Jan 1 -> counts on Jan 1
    const crossMidnight = {
      ...makePracticeSession('cm-1', localIso(2026, 1, 1, 0, 10)),
      startedAt: localIso(2025, 12, 31, 23, 50),
    };
    const dec31 = makePracticeSession('dec31', localIso(2025, 12, 31, 22, 0));
    const now = new Date(2026, 0, 1, 10, 0, 0);
    const summary = aggregateStudyActivity([dec31, crossMidnight], { now });
    expect(summary.activeDateKeys).toEqual(['2025-12-31', '2026-01-01']);
    expect(summary.currentStreak).toBe(2);
    expect(summary.longestObservedStreak).toBe(2);
  });

  it('flags retention cap honestly when 100 sessions are stored and counts legacy v1 sessions without fabricating duration', () => {
    const legacyV1 = {
      schemaVersion: 1,
      updatedAt: localIso(2026, 11, 26),
      sessions: [
        makePracticeSession('legacy-v1-1', localIso(2026, 11, 26), undefined),
      ],
    };
    window.localStorage.setItem(LEARNING_STORAGE_KEY, JSON.stringify(legacyV1));
    const loaded = new LocalStorageLearningRepository().loadSessions();
    const summary = aggregateStudyActivity(loaded.sessions, {
      now: new Date(2026, 10, 26, 16, 0, 0),
    });
    expect(summary.currentStreak).toBe(1);
    expect(summary.activityByDate['2026-11-26'].activeStudySeconds).toBeNull();
    expect(summary.isRetentionCapped).toBe(false);

    // 100 sessions triggers isRetentionCapped
    const hundred = Array.from({ length: 100 }, (_, i) =>
      makePracticeSession(`cap-${i}`, localIso(2026, 11, 26, 8, i % 60)),
    );
    const capped = aggregateStudyActivity(hundred, {
      now: new Date(2026, 10, 26, 18, 0, 0),
    });
    expect(capped.isRetentionCapped).toBe(true);
  });
});

describe('Phase 5B — ProgressPage streak KPIs, ActivityHeatmap UI, VI/EN, Dark Mode & keyboard navigation', () => {
  beforeEach(async () => {
    window.localStorage.clear();
    document.documentElement.dataset.theme = 'light';
    await i18n.changeLanguage('en');
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  it('renders streak KPIs and 52-week heatmap, excludes AI bookmarks, supports keyboard day inspection, VI/EN, and Dark Mode', async () => {
    const now = new Date();
    const todayIso = now.toISOString();
    const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 12, 0, 0);
    const yesterdayIso = yesterday.toISOString();

    const learningRepo = new LocalStorageLearningRepository();
    learningRepo.saveSession(makePracticeSession('today-1', todayIso, 180));
    learningRepo.saveSession(makePracticeSession('yesterday-1', yesterdayIso, undefined));

    // AI bookmarks MUST NOT inflate streak or active days
    new LocalStorageAiProblemHistoryRepository().save({
      title: 'Top-K Most Frequent Values',
      source: 'curated-ai',
      problemId: 'top-k-frequent-values',
      topic: 'Hashing & Frequency',
      locale: 'en',
      status: 'bookmarked',
      consentToStoreStatement: false,
    });

    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/progress']}>
        <AppRoutes />
      </MemoryRouter>,
    );

    expect(screen.getByTestId('progress-current-streak')).toHaveTextContent('2 days');
    expect(screen.getByTestId('progress-longest-streak')).toHaveTextContent('2 days');
    expect(screen.getByTestId('progress-active-days')).toHaveTextContent('2 days');
    expect(screen.getByTestId('heatmap-active-days-badge')).toHaveTextContent(
      /2 active days in the last 52 weeks/i,
    );
    expect(screen.getByTestId('heatmap-selected-day')).toHaveTextContent(/3 minutes/i);

    // Keyboard navigation from selected today cell -> ArrowUp moves to yesterday (legacy untimed -> Not recorded)
    const todayKey = toLocalDateKey(now);
    const grid = screen.getByRole('grid', { name: /52-week learning activity heatmap/i });
    const cells = grid.querySelectorAll('button[role="gridcell"]');
    expect(cells.length).toBeGreaterThanOrEqual(358);
    const activeCell = Array.from(cells).find(
      (btn) => btn.getAttribute('aria-pressed') === 'true',
    ) as HTMLButtonElement;
    expect(activeCell).toBeDefined();
    activeCell.focus();
    await user.keyboard('{ArrowUp}');
    expect(screen.getByTestId('heatmap-selected-day')).toHaveTextContent(/not recorded/i);
    expect(todayKey).toMatch(/^\d{4}-\d{2}-\d{2}$/);

    // Switch to Vietnamese and Dark Mode
    await user.click(screen.getAllByRole('button', { name: /dark mode/i })[0]);
    expect(document.documentElement.dataset.theme).toBe('dark');
    await user.selectOptions(screen.getAllByLabelText(/language/i)[0], 'vi');

    expect(screen.getByTestId('progress-current-streak')).toHaveTextContent('2 ngày');
    expect(screen.getByTestId('progress-longest-streak')).toHaveTextContent('2 ngày');
    expect(screen.getByTestId('progress-active-days')).toHaveTextContent('2 ngày');
    expect(screen.getByText(/biểu đồ hoạt động học tập/i)).toBeInTheDocument();
  });
});
