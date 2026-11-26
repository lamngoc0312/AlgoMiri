import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import i18n from '../i18n';
import { buildLearningSession } from '../domain/learning/analytics';
import { groupLearningSessionsByProblem } from '../domain/history/problemHistory';
import {
  AI_PROBLEM_HISTORY_SCHEMA_VERSION,
  AI_PROBLEM_HISTORY_STORAGE_KEY,
  LocalStorageAiProblemHistoryRepository,
} from '../services/aiProblemHistoryRepository';
import { defaultLearningRepository } from '../services/learningRepository';
import { AppRoutes } from '../app/App';
import { SaveAiHistoryPanel } from '../features/analyzer/SaveAiHistoryPanel';
import type { AnalyzeResponseDto } from '../services/aiClient';

function learningSession(sessionId: string, completedAt: string) {
  return buildLearningSession({
    sessionId,
    problemId: 'two-sum',
    problemTitle: 'Two Sum',
    mode: 'guided',
    strategiesExplored: ['hash-map'],
    startedAt: completedAt,
    completedAt,
    stageIds: ['understand', 'strategy'],
    stageStatuses: { understand: 'completed', strategy: 'completed' },
    hintsByStage: { understand: 0, strategy: 0 },
    predictionRecords: {},
  });
}

function mockAnalyzeResponse(overrides?: Partial<AnalyzeResponseDto>): AnalyzeResponseDto {
  return {
    mode: 'ai',
    is_ai_generated: true,
    verified_execution: false,
    notice: null,
    analysis: {
      title: 'Custom Coin Minimizer',
      inferred_problem_type: 'Dynamic Programming',
      plain_language_summary: 'Find the fewest coins needed to reach target amount.',
      inputs: ['coins', 'amount'],
      outputs: ['minimum coin count'],
      constraints_and_assumptions: ['Unlimited coins of each type.'],
      clarifications_or_ambiguities: ['Assume amount = 0 returns 0.'],
      worked_example: {
        input_summary: 'coins = [1, 2, 5], amount = 11',
        output_summary: '3',
        walkthrough: '5 + 5 + 1 = 11.',
      },
      edge_cases: ['amount = 0'],
      prerequisite_concepts: ['Dynamic Programming'],
      subproblem_decomposition: [
        { id: 's1', title: 'Define dp[a]', goal: 'Track fewest coins for sum a.', depends_on: [] },
      ],
      candidate_strategies: [
        {
          name: 'Bottom-Up DP',
          technique: 'Dynamic Programming',
          intuition: 'Build from 0 up to amount.',
          why_it_applies: 'Overlapping subproblems.',
          time_complexity: 'O(amount * n)',
          space_complexity: 'O(amount)',
          complexity_assumptions: 'n denominations.',
          limitations: 'Memory scales with amount.',
        },
      ],
      confidence_notes: 'Conceptual analysis only.',
    },
    verified_match: {
      status: 'conceptual_only',
      matched_problem_id: null,
      matched_problem_title: null,
      studio_path: null,
      reason: 'No deterministic studio matches this problem.',
      compatibility_checks: [],
      user_input_note: 'Conceptual analysis only.',
    },
    ...overrides,
  };
}

describe('Phase 4A & 4B — AI problem history repository', () => {
  beforeEach(async () => {
    window.localStorage.clear();
    await i18n.changeLanguage('en');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('saves explicit conceptual metadata, updates only via stable recordId or identical stored statement, and never implies verified execution', () => {
    const repo = new LocalStorageAiProblemHistoryRepository();
    const first = repo.save({
      title: 'Top-K Values',
      source: 'custom-pasted',
      problemId: null,
      topic: 'Hashing',
      locale: 'en',
      problemStatement: 'Private custom statement',
      consentToStoreStatement: false,
    });

    expect(first.saved).toBe(true);
    expect(first.record).toMatchObject({ status: 'ai-conceptual' });
    expect(first.record).not.toHaveProperty('problemStatement');
    expect(JSON.parse(localStorage.getItem(AI_PROBLEM_HISTORY_STORAGE_KEY)!))
      .not.toHaveProperty('verified_execution');

    const reloaded = new LocalStorageAiProblemHistoryRepository().load();
    expect(reloaded.records).toHaveLength(1);

    // Updating the same record intentionally via stable recordId succeeds cleanly
    const update = repo.save({
      recordId: first.record!.id,
      title: 'Top-K Values',
      source: 'custom-pasted',
      topic: 'Hashing & Frequency',
      locale: 'en',
      problemStatement: 'Private custom statement',
      consentToStoreStatement: true,
    });
    expect(update.wasDuplicateUpdate).toBe(true);
    expect(repo.load().records).toHaveLength(1);
    expect(repo.load().records[0].problemStatement).toBe('Private custom statement');
  });

  it('keeps different custom problems with identical titles as separate records', () => {
    const repo = new LocalStorageAiProblemHistoryRepository();

    // Two custom problems with identical AI title and NO stored statement (no consent)
    const noConsentA = repo.save({
      title: 'Maximum Subarray',
      source: 'custom-pasted',
      problemId: null,
      topic: 'Dynamic Programming',
      locale: 'en',
      problemStatement: 'Find the maximum sum of a contiguous subarray.',
      consentToStoreStatement: false,
    });
    const noConsentB = repo.save({
      title: 'Maximum Subarray',
      source: 'custom-pasted',
      problemId: null,
      topic: 'Dynamic Programming',
      locale: 'en',
      problemStatement: 'Find the maximum product of a circular subarray.',
      consentToStoreStatement: false,
    });

    expect(noConsentA.record!.id).not.toBe(noConsentB.record!.id);
    expect(noConsentB.wasDuplicateUpdate).toBe(false);

    // Two custom problems with identical AI title and DIFFERENT stored statements
    const consentA = repo.save({
      title: 'Maximum Subarray',
      source: 'custom-pasted',
      problemId: null,
      topic: 'Sliding Window',
      locale: 'en',
      problemStatement: 'Find max sum of subarray with length at most k.',
      consentToStoreStatement: true,
    });
    const consentB = repo.save({
      title: 'Maximum Subarray',
      source: 'custom-pasted',
      problemId: null,
      topic: 'Sliding Window',
      locale: 'en',
      problemStatement: 'Find max sum of subarray with all positive numbers.',
      consentToStoreStatement: true,
    });

    expect(consentA.record!.id).not.toBe(consentB.record!.id);
    expect(consentB.wasDuplicateUpdate).toBe(false);
    expect(repo.load().records).toHaveLength(4);
  });

  it('keeps different custom statements mapped to the same verified problem family separate while deduplicating curated IDs', () => {
    const repo = new LocalStorageAiProblemHistoryRepository();

    const twoSumVariant1 = repo.save({
      title: 'Two Sum (Count All Pairs)',
      source: 'custom-pasted',
      problemId: 'two-sum',
      topic: 'Arrays & Hash Map',
      locale: 'en',
      problemStatement: 'Count how many pairs in nums sum to target.',
      consentToStoreStatement: true,
    });
    const twoSumVariant2 = repo.save({
      title: 'Two Sum (Return Values)',
      source: 'custom-pasted',
      problemId: 'two-sum',
      topic: 'Arrays & Hash Map',
      locale: 'en',
      problemStatement: 'Return the actual two values that sum to target in sorted order.',
      consentToStoreStatement: true,
    });
    const twoSumNoConsent = repo.save({
      title: 'Two Sum (Count All Pairs)',
      source: 'custom-pasted',
      problemId: 'two-sum',
      topic: 'Arrays & Hash Map',
      locale: 'en',
      problemStatement: 'Another Two Sum variant without statement consent.',
      consentToStoreStatement: false,
    });

    expect(twoSumVariant1.record!.id).not.toBe(twoSumVariant2.record!.id);
    expect(twoSumVariant2.wasDuplicateUpdate).toBe(false);
    expect(twoSumNoConsent.wasDuplicateUpdate).toBe(false);
    expect(repo.load().records).toHaveLength(3);

    // Genuine curated problem IDs still deduplicate cleanly within the same locale
    const curated1 = repo.save({
      title: 'Top-K Most Frequent Values',
      source: 'curated-ai',
      problemId: 'top-k-frequent-values',
      topic: 'Hashing & Frequency',
      locale: 'en',
      consentToStoreStatement: false,
    });
    const curated2 = repo.save({
      title: 'Top-K Most Frequent Values',
      source: 'curated-ai',
      problemId: 'top-k-frequent-values',
      topic: 'Hashing & Frequency',
      locale: 'en',
      consentToStoreStatement: false,
    });

    expect(curated1.record!.id).toBe(curated2.record!.id);
    expect(curated2.wasDuplicateUpdate).toBe(true);
    expect(repo.load().records).toHaveLength(4);
  });

  it('recovers from corrupt storage, handles blocked/quota storage gracefully, and deletes only the intended record', () => {
    const repo = new LocalStorageAiProblemHistoryRepository();
    localStorage.setItem(AI_PROBLEM_HISTORY_STORAGE_KEY, '{broken');
    expect(repo.load()).toMatchObject({ records: [], recoveredFromError: true });

    // Quota / blocked storage fails gracefully without throwing
    const throwingStorage = {
      getItem: () => null,
      setItem: () => {
        throw new Error('QuotaExceededError');
      },
      removeItem: () => undefined,
      clear: () => undefined,
      key: () => null,
      length: 0,
    } as Storage;
    const blockedRepo = new LocalStorageAiProblemHistoryRepository(
      AI_PROBLEM_HISTORY_STORAGE_KEY,
      throwingStorage,
    );
    expect(
      blockedRepo.save({
        title: 'Blocked Test',
        source: 'curated-ai',
        problemId: 'top-k-frequent-values',
        locale: 'en',
        consentToStoreStatement: false,
      }),
    ).toMatchObject({ saved: false, warning: 'storage-write-failed' });

    localStorage.removeItem(AI_PROBLEM_HISTORY_STORAGE_KEY);
    const one = repo.save({
      title: 'One', source: 'curated-ai', problemId: 'one', topic: 'Arrays',
      locale: 'en', consentToStoreStatement: false,
    }).record!;
    const two = repo.save({
      title: 'Two', source: 'curated-ai', problemId: 'two', topic: 'Graphs',
      locale: 'en', consentToStoreStatement: false,
    }).record!;

    expect(repo.remove(one.id).removed).toBe(true);
    expect(repo.load().records.map((record) => record.id)).toEqual([two.id]);
  });

  it('loads existing Phase 4A schema v1 records cleanly without migration loss', () => {
    const phase4aEnvelope = {
      schemaVersion: AI_PROBLEM_HISTORY_SCHEMA_VERSION,
      updatedAt: '2026-11-25T10:00:00.000Z',
      records: [
        {
          id: 'ai-phase4a-legacy-1',
          title: 'Legacy Phase 4A Custom',
          source: 'custom-pasted',
          problemId: null,
          topic: 'Graphs',
          locale: 'en',
          savedAt: '2026-11-25T09:00:00.000Z',
          updatedAt: '2026-11-25T10:00:00.000Z',
          status: 'ai-conceptual',
        },
      ],
    };
    localStorage.setItem(AI_PROBLEM_HISTORY_STORAGE_KEY, JSON.stringify(phase4aEnvelope));

    const loaded = new LocalStorageAiProblemHistoryRepository().load();
    expect(loaded.recoveredFromError).toBe(false);
    expect(loaded.records).toHaveLength(1);
    expect(loaded.records[0]).toMatchObject({
      id: 'ai-phase4a-legacy-1',
      title: 'Legacy Phase 4A Custom',
      status: 'ai-conceptual',
    });
  });

  it('requires an explicit second action and consent before passing custom statement storage', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(
      <MemoryRouter>
        <SaveAiHistoryPanel
          isCustomProblem
          saved={false}
          saving={false}
          error={false}
          onSave={onSave}
        />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('button', { name: /save to history/i }));
    expect(onSave).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: /confirm save/i }));
    expect(onSave).toHaveBeenLastCalledWith(false);
    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: /confirm save/i }));
    expect(onSave).toHaveBeenLastCalledWith(true);
  });
});

describe('Phase 4A & 4B — History Page, Prefill Classification, Reopen & Offline Bookmarking', () => {
  beforeEach(async () => {
    window.localStorage.clear();
    await i18n.changeLanguage('en');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('groups multiple sessions by problem, shows Reopen Problem labels, and explains unavailable custom reopen in EN and VI', async () => {
    defaultLearningRepository.saveSession(
      learningSession('session-1', '2026-11-24T04:00:00.000Z'),
    );
    defaultLearningRepository.saveSession(
      learningSession('session-2', '2026-11-25T04:00:00.000Z'),
    );
    const repo = new LocalStorageAiProblemHistoryRepository();
    repo.save({
      title: 'Top-K Most Frequent Values',
      source: 'curated-ai',
      problemId: 'top-k-frequent-values',
      topic: 'Hashing & Frequency',
      locale: 'en',
      consentToStoreStatement: false,
    });
    repo.save({
      title: 'Private Metadata-Only Problem',
      source: 'custom-pasted',
      problemId: null,
      topic: 'Graphs',
      locale: 'en',
      consentToStoreStatement: false,
    });

    expect(groupLearningSessionsByProblem(defaultLearningRepository.loadSessions().sessions))
      .toMatchObject([{ problemId: 'two-sum', sessionCount: 2 }]);

    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/history']}>
        <AppRoutes />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: /problem history/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /verified learning/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /saved ai problems/i })).toBeInTheDocument();
    expect(screen.getByText('2', { selector: 'dd' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /reopen problem/i })).toBeInTheDocument();
    expect(
      screen.getByText(/reopen unavailable — custom statement text was not stored/i),
    ).toBeInTheDocument();

    await user.selectOptions(screen.getByRole('combobox', { name: /language/i }), 'vi');
    expect(await screen.findByRole('heading', { name: /lịch sử bài toán/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /mở lại đề bài/i })).toBeInTheDocument();
    expect(
      screen.getByText(/không thể mở lại — nội dung đề bài tùy chỉnh chưa được lưu/i),
    ).toBeInTheDocument();
  });

  it('reclassifies an edited curated prefilled problem as custom-pasted and shows custom consent UI', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockAnalyzeResponse(),
    } as Response);

    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/?prefill=top-k-frequent-values']}>
        <AppRoutes />
      </MemoryRouter>,
    );

    const textarea = screen.getByLabelText(/paste a problem statement/i);
    await user.clear(textarea);
    await user.type(
      textarea,
      'Given coin denominations and a target amount, find the minimum coins required.',
    );
    await user.click(screen.getByRole('button', { name: /analyze problem \(ai\)/i }));
    expect(await screen.findByText('Custom Coin Minimizer')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /save to history/i }));
    // Because the curated prompt was edited, custom-statement consent MUST appear
    const consentCheckbox = screen.getByRole('checkbox', {
      name: /also store my pasted problem statement/i,
    });
    expect(consentCheckbox).toBeInTheDocument();
    await user.click(consentCheckbox);
    await user.click(screen.getByRole('button', { name: /confirm save/i }));

    const savedRecords = new LocalStorageAiProblemHistoryRepository().load().records;
    expect(savedRecords).toHaveLength(1);
    expect(savedRecords[0]).toMatchObject({
      source: 'custom-pasted',
      problemId: null,
      title: 'Custom Coin Minimizer',
      topic: 'Dynamic Programming',
      status: 'ai-conceptual',
      problemStatement:
        'Given coin denominations and a target amount, find the minimum coins required.',
    });
  });

  it('reopens a stored custom statement and a curated exercise without calling Gemini automatically', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const repo = new LocalStorageAiProblemHistoryRepository();
    const customRecord = repo.save({
      title: 'My Custom Interval Problem',
      source: 'custom-pasted',
      problemId: null,
      topic: 'Intervals',
      locale: 'en',
      problemStatement: 'Merge all overlapping intervals from a list of [start, end] pairs.',
      consentToStoreStatement: true,
    }).record!;
    repo.save({
      title: 'Top-K Most Frequent Values',
      source: 'curated-ai',
      problemId: 'top-k-frequent-values',
      topic: 'Hashing & Frequency',
      locale: 'en',
      consentToStoreStatement: false,
    });

    const user = userEvent.setup();
    const firstRender = render(
      <MemoryRouter initialEntries={['/history']}>
        <AppRoutes />
      </MemoryRouter>,
    );

    // Reopen curated exercise
    const reopenLinks = screen.getAllByRole('link', { name: /reopen problem/i });
    expect(reopenLinks).toHaveLength(2);
    const curatedLink = reopenLinks.find((link) =>
      link.getAttribute('href')?.includes('prefill=top-k-frequent-values'),
    )!;
    await user.click(curatedLink);

    const textareaAfterCurated = await screen.findByLabelText(/paste a problem statement/i);
    expect((textareaAfterCurated as HTMLTextAreaElement).value.length).toBeGreaterThan(20);
    expect(fetchSpy).not.toHaveBeenCalled();

    firstRender.unmount();

    // Navigate to reopen stored custom statement
    render(
      <MemoryRouter initialEntries={[`/?historyRecord=${encodeURIComponent(customRecord.id)}`]}>
        <AppRoutes />
      </MemoryRouter>,
    );
    const customTextarea = screen.getByLabelText(/paste a problem statement/i);
    expect((customTextarea as HTMLTextAreaElement).value).toBe(
      'Merge all overlapping intervals from a list of [start, end] pairs.',
    );
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('offers honest curated Bookmark Problem in Offline Demo Mode without claiming Gemini analysis or verified learning', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () =>
        mockAnalyzeResponse({
          mode: 'offline-demo',
          is_ai_generated: false,
          notice: 'Offline Demo Mode',
        }),
    } as Response);

    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/?prefill=top-k-frequent-values']}>
        <AppRoutes />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('button', { name: /analyze problem \(ai\)/i }));
    expect(
      await screen.findByText(/live ai analysis is not enabled on this server/i),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /bookmark problem/i }));
    expect(
      screen.getByText(/bookmarked locally — not analyzed by gemini/i),
    ).toBeInTheDocument();

    const saved = new LocalStorageAiProblemHistoryRepository().load().records;
    expect(saved).toHaveLength(1);
    expect(saved[0]).toMatchObject({
      source: 'curated-ai',
      problemId: 'top-k-frequent-values',
      status: 'bookmarked',
    });

    await user.click(screen.getByRole('link', { name: /view history/i }));
    expect(await screen.findByText(/bookmarked · not analyzed/i)).toBeInTheDocument();
    expect(
      screen.getByText(/saved as a local bookmark only — not analyzed by gemini/i),
    ).toBeInTheDocument();
    // Verified Learning stays empty — bookmark never counts as verified learning
    expect(
      screen.getByText(/no guided learning problems match/i),
    ).toBeInTheDocument();
  });
});
