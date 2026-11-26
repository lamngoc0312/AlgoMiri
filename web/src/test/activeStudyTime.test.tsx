import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, renderHook, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import i18n from '../i18n';
import {
  ActiveStudyTimer,
  DEFAULT_INACTIVITY_TIMEOUT_MS,
  MAX_SESSION_ACTIVE_DURATION_SECONDS,
  formatStudyDuration,
  sanitizeActiveStudySeconds,
} from '../domain/learning/studyTimer';
import {
  aggregateLearningProgress,
  buildLearningSession,
} from '../domain/learning/analytics';
import {
  LEARNING_SCHEMA_VERSION,
  LEARNING_STORAGE_KEY,
  LocalStorageLearningRepository,
  sanitizeStoredSession,
} from '../services/learningRepository';
import { LocalStorageAiProblemHistoryRepository } from '../services/aiProblemHistoryRepository';
import { groupLearningSessionsByProblem } from '../domain/history/problemHistory';
import { useActiveStudyTimer } from '../features/studio/useActiveStudyTimer';
import { AppRoutes } from '../app/App';

function setDocumentVisibility(state: 'visible' | 'hidden') {
  Object.defineProperty(document, 'visibilityState', {
    configurable: true,
    value: state,
  });
}

function makeSession(
  sessionId: string,
  completedAt: string,
  activeStudySeconds?: number,
  problemId: 'two-sum' | 'valid-parentheses' = 'two-sum',
) {
  return buildLearningSession({
    sessionId,
    problemId,
    problemTitle: problemId === 'two-sum' ? 'Two Sum' : 'Valid Parentheses',
    mode: 'guided',
    strategiesExplored: [problemId === 'two-sum' ? 'hash-map' : 'stack'],
    startedAt: '2026-11-26T08:00:00.000Z',
    completedAt,
    activeStudySeconds,
    stageIds: ['understand', 'strategy'],
    stageStatuses: { understand: 'completed', strategy: 'completed' },
    hintsByStage: { understand: 0, strategy: 0 },
    predictionRecords: {},
  });
}

describe('Phase 5A — Pure ActiveStudyTimer engine & formatting', () => {
  it('counts time only while visible, focused, not paused, and active within 2 minutes', () => {
    let clock = 1_000;
    const timer = new ActiveStudyTimer({
      now: () => clock,
      inactivityTimeoutMs: DEFAULT_INACTIVITY_TIMEOUT_MS,
    });

    // 1. Active visible + focused
    timer.start(true, true);
    clock += 45_000;
    expect(timer.getElapsedSeconds()).toBe(45);

    // 2. Hidden browser tab pauses accumulation
    timer.setVisibility(false);
    clock += 60_000;
    expect(timer.getElapsedSeconds()).toBe(45);
    timer.setVisibility(true);
    clock += 15_000;
    expect(timer.getElapsedSeconds()).toBe(60);

    // 3. Window blur pauses and focus resumes
    timer.setFocus(false);
    clock += 30_000;
    expect(timer.getElapsedSeconds()).toBe(60);
    timer.setFocus(true);
    timer.recordActivity();
    clock += 20_000;
    expect(timer.getElapsedSeconds()).toBe(80);

    // 4. Waiting for AI response (paused) does not count
    timer.setPaused(true);
    clock += 25_000;
    expect(timer.getElapsedSeconds()).toBe(80);
    timer.setPaused(false);
    clock += 10_000;
    expect(timer.getElapsedSeconds()).toBe(90);

    // 5. Inactivity timeout: after 2 minutes without interaction, stops at exact deadline
    // Last activity was at 20s + 25s + 10s = 55s ago -> remaining idle budget is 65s
    clock += 300_000;
    expect(timer.getElapsedSeconds()).toBe(155);
    expect(timer.isRunning()).toBe(false);

    // 6. Meaningful activity resumes after inactivity
    timer.recordActivity();
    expect(timer.isRunning()).toBe(true);
    clock += 30_000;
    expect(timer.getElapsedSeconds()).toBe(185);
  });

  it('caps implausibly large durations and rejects malformed values', () => {
    let clock = 0;
    const timer = new ActiveStudyTimer({
      now: () => clock,
      inactivityTimeoutMs: 100_000_000,
    });
    timer.start(true, true);
    clock += 100_000_000;
    expect(timer.getElapsedSeconds()).toBe(MAX_SESSION_ACTIVE_DURATION_SECONDS);

    expect(sanitizeActiveStudySeconds(undefined)).toBeUndefined();
    expect(sanitizeActiveStudySeconds(null)).toBeUndefined();
    expect(sanitizeActiveStudySeconds(-10)).toBeUndefined();
    expect(sanitizeActiveStudySeconds(Number.NaN)).toBeUndefined();
    expect(sanitizeActiveStudySeconds(Number.POSITIVE_INFINITY)).toBeUndefined();
    expect(sanitizeActiveStudySeconds('120')).toBeUndefined();
    expect(sanitizeActiveStudySeconds(MAX_SESSION_ACTIVE_DURATION_SECONDS + 1)).toBeUndefined();
    expect(sanitizeActiveStudySeconds(0)).toBe(0);
    expect(sanitizeActiveStudySeconds(45.9)).toBe(45);
  });

  it('formats durations cleanly in EN and VI and distinguishes unknown from 0 seconds', async () => {
    await i18n.changeLanguage('en');
    const tEn = i18n.t.bind(i18n);
    expect(formatStudyDuration(undefined, tEn)).toBe('Not recorded');
    expect(formatStudyDuration(null, tEn)).toBe('Not recorded');
    expect(formatStudyDuration(0, tEn)).toBe('0 seconds');
    expect(formatStudyDuration(45, tEn)).toBe('45 seconds');
    expect(formatStudyDuration(12 * 60, tEn)).toBe('12 minutes');
    expect(formatStudyDuration(80 * 60, tEn)).toBe('1 hour 20 minutes');

    await i18n.changeLanguage('vi');
    const tVi = i18n.t.bind(i18n);
    expect(formatStudyDuration(undefined, tVi)).toBe('Chưa ghi nhận');
    expect(formatStudyDuration(0, tVi)).toBe('0 giây');
    expect(formatStudyDuration(45, tVi)).toBe('45 giây');
    expect(formatStudyDuration(12 * 60, tVi)).toBe('12 phút');
    expect(formatStudyDuration(80 * 60, tVi)).toBe('1 giờ 20 phút');
  });
});

describe('Phase 5A — useActiveStudyTimer hook lifecycle & listener cleanup', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    setDocumentVisibility('visible');
    vi.spyOn(document, 'hasFocus').mockReturnValue(true);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    setDocumentVisibility('visible');
  });

  it('ignores mousemove, pauses on visibility/blur/inactivity, resumes on keydown, resets on new sessionKey, and cleans up listeners', () => {
    const addWinSpy = vi.spyOn(window, 'addEventListener');
    const removeWinSpy = vi.spyOn(window, 'removeEventListener');
    const addDocSpy = vi.spyOn(document, 'addEventListener');
    const removeDocSpy = vi.spyOn(document, 'removeEventListener');

    const { result, rerender, unmount } = renderHook(
      ({ sessionKey, paused }) => useActiveStudyTimer({ sessionKey, paused }),
      { initialProps: { sessionKey: 'session-1', paused: false } },
    );

    // Active for 30s
    act(() => {
      vi.advanceTimersByTime(30_000);
    });
    expect(result.current.getActiveStudySeconds()).toBe(30);

    // Mousemove alone does NOT reset inactivity deadline
    act(() => {
      vi.advanceTimersByTime(60_000); // 90s elapsed
      window.dispatchEvent(new MouseEvent('mousemove'));
      vi.advanceTimersByTime(90_000); // 180s since start -> capped at 120s inactivity timeout
    });
    expect(result.current.getActiveStudySeconds()).toBe(120);

    // Meaningful keydown resumes counting
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
      vi.advanceTimersByTime(20_000);
    });
    expect(result.current.getActiveStudySeconds()).toBe(140);

    // Tab hidden pauses counting
    act(() => {
      setDocumentVisibility('hidden');
      document.dispatchEvent(new Event('visibilitychange'));
      vi.advanceTimersByTime(45_000);
    });
    expect(result.current.getActiveStudySeconds()).toBe(140);

    // Tab visible resumes
    act(() => {
      setDocumentVisibility('visible');
      document.dispatchEvent(new Event('visibilitychange'));
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
      vi.advanceTimersByTime(10_000);
    });
    expect(result.current.getActiveStudySeconds()).toBe(150);

    // Window blur pauses, focus resumes
    act(() => {
      window.dispatchEvent(new Event('blur'));
      vi.advanceTimersByTime(25_000);
    });
    expect(result.current.getActiveStudySeconds()).toBe(150);

    act(() => {
      window.dispatchEvent(new Event('focus'));
      vi.advanceTimersByTime(15_000);
    });
    expect(result.current.getActiveStudySeconds()).toBe(165);

    // Starting a genuinely new session resets timer to 0
    rerender({ sessionKey: 'session-2', paused: false });
    expect(result.current.getActiveStudySeconds()).toBe(0);

    act(() => {
      vi.advanceTimersByTime(10_000);
    });
    expect(result.current.getActiveStudySeconds()).toBe(10);

    // Unmount cleans up all window & document listeners
    unmount();
    expect(removeDocSpy).toHaveBeenCalledWith('visibilitychange', expect.any(Function));
    expect(removeWinSpy).toHaveBeenCalledWith('focus', expect.any(Function));
    expect(removeWinSpy).toHaveBeenCalledWith('blur', expect.any(Function));
    expect(addWinSpy.mock.calls.length).toBeGreaterThan(0);
    expect(addDocSpy.mock.calls.length).toBeGreaterThan(0);

    // Advancing time after unmount does not increase duration
    act(() => {
      vi.advanceTimersByTime(30_000);
    });
    expect(result.current.getActiveStudySeconds()).toBe(10);
  });
});

describe('Phase 5A — Persistence, migration, aggregation & UI integration', () => {
  beforeEach(async () => {
    window.localStorage.clear();
    document.documentElement.dataset.theme = 'light';
    await i18n.changeLanguage('en');
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    setDocumentVisibility('visible');
  });

  it('migrates Phase 4 v1 sessions without timing as unknown (never fabricating from timestamps) and rejects corrupted durations', () => {
    const legacyV1Envelope = {
      schemaVersion: 1,
      updatedAt: '2026-11-25T10:00:00.000Z',
      sessions: [
        {
          // 2 hours wall-clock difference MUST NOT become activeStudySeconds
          ...makeSession('legacy-1', '2026-11-26T10:00:00.000Z'),
          activeStudySeconds: undefined,
        },
        {
          ...makeSession('corrupt-1', '2026-11-26T10:05:00.000Z'),
          activeStudySeconds: 999_999,
        },
      ],
    };
    localStorage.setItem(LEARNING_STORAGE_KEY, JSON.stringify(legacyV1Envelope));

    const repo = new LocalStorageLearningRepository();
    const loaded = repo.loadSessions();

    expect(loaded.migratedFromVersion).toBe(1);
    expect(loaded.sessions).toHaveLength(2);
    expect(loaded.sessions[0].activeStudySeconds).toBeUndefined();
    expect(loaded.sessions[1].activeStudySeconds).toBeUndefined();

    const storedAfterMigration = JSON.parse(localStorage.getItem(LEARNING_STORAGE_KEY)!);
    expect(storedAfterMigration.schemaVersion).toBe(LEARNING_SCHEMA_VERSION);

    const summary = aggregateLearningProgress(loaded.sessions);
    expect(summary.totalActiveStudySeconds).toBeNull();
    expect(summary.timedSessionsCount).toBe(0);

    // Direct sanitization check on negative / NaN / string
    expect(
      sanitizeStoredSession({
        ...makeSession('bad-neg', '2026-11-26T10:00:00.000Z'),
        activeStudySeconds: -5,
      })?.activeStudySeconds,
    ).toBeUndefined();
  });

  it('updates the same sessionId without double-counting and aggregates multiple sessions accurately', () => {
    const repo = new LocalStorageLearningRepository();

    // First save of session-1 at 60s
    const first = repo.saveSession(makeSession('session-1', '2026-11-26T08:10:00.000Z', 60));
    expect(first.saved).toBe(true);
    expect(first.wasDuplicateUpdate).toBe(false);

    // Re-saving the same session-1 at 95s updates in-place (total is 95s, NOT 155s)
    const updated = repo.saveSession(makeSession('session-1', '2026-11-26T08:11:00.000Z', 95));
    expect(updated.saved).toBe(true);
    expect(updated.wasDuplicateUpdate).toBe(true);
    expect(repo.loadSessions().sessions).toHaveLength(1);
    expect(repo.loadSessions().sessions[0].activeStudySeconds).toBe(95);

    // Second distinct session at 145s + legacy untimed session
    repo.saveSession(
      makeSession('session-2', '2026-11-26T09:00:00.000Z', 145, 'valid-parentheses'),
    );
    repo.saveSession(makeSession('session-legacy', '2026-11-25T09:00:00.000Z', undefined));

    const sessions = repo.loadSessions().sessions;
    const summary = aggregateLearningProgress(sessions);
    expect(summary.totalSessions).toBe(3);
    expect(summary.timedSessionsCount).toBe(2);
    expect(summary.totalActiveStudySeconds).toBe(240); // 95 + 145 = 4 minutes

    const grouped = groupLearningSessionsByProblem(sessions);
    expect(grouped.find((p) => p.problemId === 'two-sum')?.totalActiveStudySeconds).toBe(95);
    expect(
      grouped.find((p) => p.problemId === 'valid-parentheses')?.totalActiveStudySeconds,
    ).toBe(145);
  });

  it('preserves active study time across VI/EN and strategy switches in Studio, and resets on Restart', async () => {
    let perfNow = 1_000;
    vi.spyOn(performance, 'now').mockImplementation(() => perfNow);
    setDocumentVisibility('visible');
    vi.spyOn(document, 'hasFocus').mockReturnValue(true);

    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={['/studio/two-sum']}>
        <AppRoutes />
      </MemoryRouter>,
    );

    // 25s active study in English
    perfNow += 25_000;

    // Switch language to Vietnamese -> timer must preserve 25s
    await user.selectOptions(screen.getAllByLabelText(/language/i)[0], 'vi');
    perfNow += 20_000;

    // Switch mode to Free Exploration and switch strategy -> timer preserves 45s
    await user.click(screen.getByRole('button', { name: /tự do khám phá/i }));
    await user.click(screen.getByRole('radio', { name: /bảng băm|hash map/i }));
    perfNow += 15_000;

    // Return to Guided Learning, skip/continue stage 1 so hasRecordedActivity is true, then open Summary
    await user.click(screen.getByRole('button', { name: /học có hướng dẫn/i }));
    await user.click(screen.getByRole('button', { name: /bỏ qua sang giai đoạn 2/i }));

    const repo = new LocalStorageLearningRepository();
    await user.click(screen.getByRole('button', { name: /tổng kết/i }));
    const saved = repo.loadSessions().sessions;
    expect(saved).toHaveLength(1);
    expect(saved[0].activeStudySeconds).toBe(60);

    // Restart Guided Lesson -> resets timer to 0 and creates a fresh session
    await user.click(screen.getByRole('button', { name: /học lại từ đầu/i }));
    perfNow += 12_000;
    await user.click(screen.getByRole('button', { name: /bỏ qua sang giai đoạn 2/i }));
    await user.click(screen.getByRole('button', { name: /tổng kết/i }));
    const savedAfterRestart = repo.loadSessions().sessions;
    expect(savedAfterRestart).toHaveLength(2);
    expect(
      savedAfterRestart.some((s) => s.activeStudySeconds === 12),
    ).toBe(true);
  });

  it('displays active study time in Progress and History in EN/VI and Dark Mode, without inventing time for offline bookmarks', async () => {
    const learningRepo = new LocalStorageLearningRepository();
    learningRepo.saveSession(makeSession('timed-1', '2026-11-26T09:00:00.000Z', 720)); // 12 minutes
    learningRepo.saveSession(makeSession('legacy-1', '2026-11-25T09:00:00.000Z', undefined));

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

    // 1. Check ProgressPage in EN + Dark Mode
    const progressView = render(
      <MemoryRouter initialEntries={['/progress']}>
        <AppRoutes />
      </MemoryRouter>,
    );
    expect(screen.getByTestId('progress-active-study-time')).toHaveTextContent('12 minutes');
    expect(screen.getByText(/measured in 1\/2 sessions/i)).toBeInTheDocument();
    expect(screen.getByText(/^not recorded$/i)).toBeInTheDocument();

    // Toggle Dark Mode & Vietnamese
    await user.click(screen.getAllByRole('button', { name: /dark mode/i })[0]);
    expect(document.documentElement.dataset.theme).toBe('dark');
    await user.selectOptions(screen.getAllByLabelText(/language/i)[0], 'vi');
    expect(screen.getByTestId('progress-active-study-time')).toHaveTextContent('12 phút');
    expect(screen.getByText(/^chưa ghi nhận$/i)).toBeInTheDocument();
    progressView.unmount();

    // 2. Check HistoryPage: Verified Learning shows 12 phút, Offline Bookmark has NO invented study time
    render(
      <MemoryRouter initialEntries={['/history']}>
        <AppRoutes />
      </MemoryRouter>,
    );
    expect(screen.getByTestId('history-active-study-total')).toHaveTextContent('12 phút');
    expect(screen.getByText(/đã đánh dấu · chưa phân tích ai/i)).toBeInTheDocument();
    // Only the Verified Learning card shows "Thời gian học chủ động", never the bookmarked AI card
    expect(screen.getAllByText(/thời gian học chủ động/i)).toHaveLength(1);
  });
});
