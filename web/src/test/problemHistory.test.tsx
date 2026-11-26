import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { buildLearningSession } from '../domain/learning/analytics';
import { groupLearningSessionsByProblem } from '../domain/history/problemHistory';
import {
  AI_PROBLEM_HISTORY_STORAGE_KEY,
  LocalStorageAiProblemHistoryRepository,
} from '../services/aiProblemHistoryRepository';
import { defaultLearningRepository } from '../services/learningRepository';
import { AppRoutes } from '../app/App';
import { SaveAiHistoryPanel } from '../features/analyzer/SaveAiHistoryPanel';

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

describe('Phase 4A — AI problem history repository', () => {
  beforeEach(() => window.localStorage.clear());

  it('saves explicit conceptual metadata, persists after reload, deduplicates, and never implies verified execution', () => {
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

    const update = repo.save({
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

  it('recovers from corrupt storage and deletes only the intended record', () => {
    const repo = new LocalStorageAiProblemHistoryRepository();
    localStorage.setItem(AI_PROBLEM_HISTORY_STORAGE_KEY, '{broken');
    expect(repo.load()).toMatchObject({ records: [], recoveredFromError: true });

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

describe('Phase 4A — problem-oriented history page', () => {
  beforeEach(() => window.localStorage.clear());

  it('groups multiple sessions by problem and shows bilingual, separated evidence sections', async () => {
    defaultLearningRepository.saveSession(
      learningSession('session-1', '2026-11-24T04:00:00.000Z'),
    );
    defaultLearningRepository.saveSession(
      learningSession('session-2', '2026-11-25T04:00:00.000Z'),
    );
    new LocalStorageAiProblemHistoryRepository().save({
      title: 'Top-K Most Frequent Values',
      source: 'curated-ai',
      problemId: 'top-k-frequent-values',
      topic: 'Hashing & Frequency',
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
    expect(screen.getByText(/does not prove the coding problem was solved independently/i)).toBeInTheDocument();
    expect(screen.getByText(/ai conceptual · not verified/i)).toBeInTheDocument();

    await user.selectOptions(screen.getByRole('combobox', { name: /language/i }), 'vi');
    expect(await screen.findByRole('heading', { name: /lịch sử bài toán/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /bài toán ai đã lưu/i })).toBeInTheDocument();
  });
});
