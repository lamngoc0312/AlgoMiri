import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, renderHook, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import i18n from '../i18n';
import { aggregateStudyActivity } from '../domain/learning/activityStreak';
import { buildLearningSession } from '../domain/learning/analytics';
import { LocalStorageLearningRepository } from '../services/learningRepository';
import { LocalStorageAiProblemHistoryRepository } from '../services/aiProblemHistoryRepository';
import {
  LOCAL_PROFILE_STORAGE_KEY,
  LocalStorageProfileRepository,
  sanitizeDisplayName,
} from '../services/profileRepository';
import { useLocalDateKey } from '../features/progress/useLocalDateKey';
import { AppRoutes } from '../app/App';

function makePracticeSession(
  sessionId: string,
  problemId: 'two-sum' | 'valid-parentheses' | 'split-array-largest-sum',
  completedAt: string,
  activeStudySeconds?: number,
) {
  const titleMap = {
    'two-sum': 'Two Sum',
    'valid-parentheses': 'Valid Parentheses',
    'split-array-largest-sum': 'Split Array Largest Sum',
  };
  return buildLearningSession({
    sessionId,
    problemId,
    problemTitle: titleMap[problemId],
    mode: 'guided',
    strategiesExplored: ['hash-map'],
    startedAt: completedAt,
    completedAt,
    activeStudySeconds,
    stageIds: ['understand', 'strategy'],
    stageStatuses: { understand: 'completed', strategy: 'completed' },
    hintsByStage: { understand: 0, strategy: 0 },
    predictionRecords: {},
  });
}

function makeViewedSession(
  sessionId: string,
  problemId: 'valid-parentheses',
  completedAt: string,
) {
  return buildLearningSession({
    sessionId,
    problemId,
    problemTitle: 'Valid Parentheses',
    mode: 'explore',
    strategiesExplored: ['stack'],
    startedAt: completedAt,
    completedAt,
    stageIds: ['understand'],
    stageStatuses: { understand: 'viewed' },
    hintsByStage: { understand: 0 },
    predictionRecords: {},
  });
}

describe('Phase 6A — Phase 5B reliability fixes & local profile storage', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('rejects same-day future completion timestamps later than actual current time', () => {
    const now = new Date(2026, 10, 27, 10, 0, 0, 0); // 10:00 AM local
    const twoHoursInFutureSameDay = new Date(2026, 10, 27, 12, 0, 0, 0).toISOString();
    const oneHourEarlierSameDay = new Date(2026, 10, 27, 9, 0, 0, 0).toISOString();

    const futureOnly = aggregateStudyActivity(
      [makePracticeSession('future-same-day', 'two-sum', twoHoursInFutureSameDay, 120)],
      { now },
    );
    expect(futureOnly.currentStreak).toBe(0);
    expect(futureOnly.totalEligibleSessions).toBe(0);
    expect(futureOnly.activeDateKeys).toEqual([]);

    const mixed = aggregateStudyActivity(
      [
        makePracticeSession('future-same-day', 'two-sum', twoHoursInFutureSameDay, 120),
        makePracticeSession('past-same-day', 'two-sum', oneHourEarlierSameDay, 90),
      ],
      { now },
    );
    expect(mixed.currentStreak).toBe(1);
    expect(mixed.totalEligibleSessions).toBe(1);
    expect(mixed.activityByDate['2026-11-27'].activeStudySeconds).toBe(90);
  });

  it('recalculates local date key when returning to a tab left open overnight', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 10, 26, 23, 55, 0));

    const { result } = renderHook(() => useLocalDateKey());
    expect(result.current).toBe('2026-11-26');

    // Simulate returning to the tab next morning after midnight
    act(() => {
      vi.setSystemTime(new Date(2026, 10, 27, 8, 15, 0));
      window.dispatchEvent(new Event('focus'));
    });
    expect(result.current).toBe('2026-11-27');
  });

  it('sanitizes and persists optional local display name separately from learning history', () => {
    expect(sanitizeDisplayName('   Minh\u0000   Nguyen  ')).toBe('Minh Nguyen');
    expect(sanitizeDisplayName('   ')).toBeNull();

    const repo = new LocalStorageProfileRepository();
    expect(repo.load().displayName).toBeNull();

    const tooLong = repo.saveDisplayName('A'.repeat(55));
    expect(tooLong.saved).toBe(false);
    expect(tooLong.error).toBe('invalid');

    const ok = repo.saveDisplayName('  Linh  ');
    expect(ok.saved).toBe(true);
    expect(ok.profile.displayName).toBe('Linh');
    expect(JSON.parse(window.localStorage.getItem(LOCAL_PROFILE_STORAGE_KEY)!)).toMatchObject({
      schemaVersion: 1,
      displayName: 'Linh',
    });

    // Reloading reads persisted name cleanly
    expect(new LocalStorageProfileRepository().load().displayName).toBe('Linh');
  });
});

describe('Phase 6A — Personal Learning Profile page & navigation', () => {
  beforeEach(async () => {
    window.localStorage.clear();
    document.documentElement.dataset.theme = 'light';
    await i18n.changeLanguage('en');
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  it('navigates to /profile from the compact header button and shows honest empty state for new learners', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/']}>
        <AppRoutes />
      </MemoryRouter>,
    );

    const profileLink = screen.getByRole('link', { name: /learning profile/i });
    await user.click(profileLink);

    expect(await screen.findByTestId('profile-display-name')).toHaveTextContent(
      'Algorithm Learner',
    );
    expect(
      screen.getByText(/ready to begin your visual algorithm journey/i),
    ).toBeInTheDocument();
    expect(screen.getByTestId('profile-active-study-time')).toHaveTextContent(
      'Not recorded',
    );
    expect(screen.getByTestId('profile-current-streak')).toHaveTextContent('0 days');
    expect(screen.getByTestId('profile-longest-streak')).toHaveTextContent('0 days');
    expect(screen.getByTestId('profile-active-days')).toHaveTextContent('0 days');
  });

  it('displays real learning stats consistent with Progress, evidence-based topic statuses, display name persistence, VI/EN, and Dark Mode', async () => {
    const now = new Date();
    const todayIso = new Date(now.getTime() - 60_000).toISOString();
    const yesterdayIso = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - 1,
      12,
      0,
      0,
    ).toISOString();

    const learningRepo = new LocalStorageLearningRepository();
    // Two Sum: Practiced (eligible attempts across 2 consecutive days, 12 minutes total)
    learningRepo.saveSession(makePracticeSession('ts-1', 'two-sum', todayIso, 420));
    learningRepo.saveSession(makePracticeSession('ts-2', 'two-sum', yesterdayIso, 300));
    // Valid Parentheses: Explored only (viewed-only session -> NOT practiced, NOT in streak)
    learningRepo.saveSession(makeViewedSession('vp-view', 'valid-parentheses', todayIso));
    // Split Array: Not yet explored (0 sessions)

    // Saved AI conceptual + offline bookmark kept strictly separate
    const aiRepo = new LocalStorageAiProblemHistoryRepository();
    aiRepo.save({
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
      <MemoryRouter initialEntries={['/profile']}>
        <AppRoutes />
      </MemoryRouter>,
    );

    // Stats match Progress identically
    expect(screen.getByTestId('profile-active-study-time')).toHaveTextContent('12 minutes');
    expect(screen.getByTestId('profile-current-streak')).toHaveTextContent('2 days');
    expect(screen.getByTestId('profile-longest-streak')).toHaveTextContent('2 days');
    expect(screen.getByTestId('profile-active-days')).toHaveTextContent('2 days');

    // Topic-level evidence statuses
    expect(screen.getByTestId('profile-topic-two-sum')).toHaveTextContent(/practiced/i);
    expect(screen.getByTestId('profile-topic-valid-parentheses')).toHaveTextContent(/explored/i);
    expect(
      screen.getByTestId('profile-topic-split-array-largest-sum'),
    ).toHaveTextContent(/not yet explored/i);

    // Edit & persist optional display name
    await user.click(screen.getByRole('button', { name: /edit display name/i }));
    const nameInput = screen.getByLabelText(/optional display name/i);
    await user.type(nameInput, 'Ngoc Lam');
    await user.click(screen.getByRole('button', { name: /^save$/i }));
    expect(screen.getByTestId('profile-display-name')).toHaveTextContent('Ngoc Lam');
    expect(new LocalStorageProfileRepository().load().displayName).toBe('Ngoc Lam');

    // Switch to Vietnamese + Dark Mode
    await user.click(screen.getAllByRole('button', { name: /dark mode/i })[0]);
    expect(document.documentElement.dataset.theme).toBe('dark');
    await user.selectOptions(screen.getAllByLabelText(/language/i)[0], 'vi');

    expect(screen.getByTestId('profile-active-study-time')).toHaveTextContent('12 phút');
    expect(screen.getByTestId('profile-current-streak')).toHaveTextContent('2 ngày');
    expect(screen.getByTestId('profile-topic-two-sum')).toHaveTextContent(/đã luyện tập/i);
    expect(screen.getByTestId('profile-topic-valid-parentheses')).toHaveTextContent(
      /đã khám phá/i,
    );
    expect(
      screen.getByTestId('profile-topic-split-array-largest-sum'),
    ).toHaveTextContent(/chưa khám phá/i);
  });
});
