import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import i18n from '../i18n';
import {
  MIRI_ISLANDS_REGISTRY,
  getIslandById,
} from '../domain/islands/islandRegistry';
import { buildMiriIslandsSnapshot } from '../domain/islands/islandProgress';
import { buildLearningSession } from '../domain/learning/analytics';
import { LocalStorageLearningRepository } from '../services/learningRepository';
import { LocalStorageAiProblemHistoryRepository } from '../services/aiProblemHistoryRepository';
import { AppRoutes } from '../app/App';

function makeVerifiedSession(
  sessionId: string,
  problemId: 'two-sum' | 'valid-parentheses' | 'split-array-largest-sum',
  options?: {
    completedAll?: boolean;
    viewedOnly?: boolean;
    activeStudySeconds?: number;
  },
) {
  const titleMap = {
    'two-sum': 'Two Sum',
    'valid-parentheses': 'Valid Parentheses',
    'split-array-largest-sum': 'Split Array Largest Sum',
  };
  const strategyMap = {
    'two-sum': 'hash-map',
    'valid-parentheses': 'stack',
    'split-array-largest-sum': 'binary-search-greedy',
  };
  const stageIds = ['understand', 'strategy'];
  const stageStatuses = options?.viewedOnly
    ? { understand: 'viewed' as const, strategy: 'unvisited' as const }
    : options?.completedAll
      ? { understand: 'completed' as const, strategy: 'completed' as const }
      : { understand: 'completed' as const, strategy: 'viewed' as const };

  return buildLearningSession({
    sessionId,
    problemId,
    problemTitle: titleMap[problemId],
    mode: options?.viewedOnly ? 'explore' : 'guided',
    strategiesExplored: [strategyMap[problemId]],
    startedAt: '2026-11-26T09:00:00.000Z',
    completedAt: '2026-11-26T09:10:00.000Z',
    activeStudySeconds: options?.activeStudySeconds,
    stageIds,
    stageStatuses,
    hintsByStage: { understand: 0, strategy: 0 },
    predictionRecords: {},
  });
}

describe('Phase 7A — Miri Islands Registry & Evidence Mapping', () => {
  it('registers all 8 islands with stable IDs, prototype artwork slots, and topic-to-skill mappings', () => {
    expect(MIRI_ISLANDS_REGISTRY).toHaveLength(8);
    expect(MIRI_ISLANDS_REGISTRY.map((i) => i.id)).toEqual([
      'storage-harbor',
      'stack-spire',
      'twin-beacon-bay',
      'window-wharf',
      'halfway-lighthouse',
      'bridge-archipelago',
      'mosaic-meadow',
      'compass-cove',
    ]);

    // First 3 visual prototypes have original artwork assets
    const prototypes = MIRI_ISLANDS_REGISTRY.filter(
      (i) => i.artwork.status === 'prototype-ready',
    );
    expect(prototypes.map((i) => i.id)).toEqual([
      'storage-harbor',
      'stack-spire',
      'halfway-lighthouse',
    ]);
    for (const proto of prototypes) {
      expect(proto.artwork.assetPath).toMatch(/^\/assets\/islands\/.+\.jpg$/);
    }

    // Topic-to-skill mappings match verified SkillIds
    expect(getIslandById('storage-harbor')?.relatedSkillIds).toContain('hash-map-lookup');
    expect(getIslandById('stack-spire')?.relatedSkillIds).toContain('stack-lifo');
    expect(getIslandById('halfway-lighthouse')?.relatedSkillIds).toContain(
      'binary-search-answer',
    );
    expect(getIslandById('compass-cove')?.relatedSkillIds).toContain('greedy-feasibility');
  });

  it('handles empty learning history honestly with zero fake progression', () => {
    const snapshot = buildMiriIslandsSnapshot([]);
    expect(snapshot.globalTotals).toEqual({
      uniqueSavedSessions: 0,
      uniqueEligiblePracticeSessions: 0,
      totalActiveStudySeconds: null,
      verifiedIslandsCount: 4,
      practicedIslandsCount: 0,
    });
    expect(snapshot.islandsById['storage-harbor'].stage).toBe('undiscovered');
    expect(snapshot.islandsById['stack-spire'].stage).toBe('undiscovered');
    expect(snapshot.islandsById['halfway-lighthouse'].stage).toBe('undiscovered');
    expect(snapshot.islandsById['compass-cove'].stage).toBe('undiscovered');
    expect(snapshot.islandsById['twin-beacon-bay'].stage).toBe('preview');
    expect(snapshot.islandsById['window-wharf'].stage).toBe('preview');
    expect(snapshot.islandsById['bridge-archipelago'].stage).toBe('preview');
    expect(snapshot.islandsById['mosaic-meadow'].stage).toBe('preview');
  });

  it('maps Split Array Largest Sum to both Halfway Lighthouse and Compass Cove without double-counting global totals', () => {
    const splitSession = makeVerifiedSession(
      'split-1',
      'split-array-largest-sum',
      { completedAll: false, activeStudySeconds: 300 },
    );
    const snapshot = buildMiriIslandsSnapshot([splitSession]);

    // Both Binary Search and Greedy islands reflect the shared studio session
    expect(snapshot.islandsById['halfway-lighthouse'].stage).toBe('developing');
    expect(snapshot.islandsById['halfway-lighthouse'].sharesMultiTopicStudio).toBe(true);
    expect(snapshot.islandsById['compass-cove'].stage).toBe('developing');
    expect(snapshot.islandsById['compass-cove'].sharesMultiTopicStudio).toBe(true);

    // Global totals count the single Split Array session ONCE (never 2 sessions or 600s!)
    expect(snapshot.globalTotals.uniqueSavedSessions).toBe(1);
    expect(snapshot.globalTotals.uniqueEligiblePracticeSessions).toBe(1);
    expect(snapshot.globalTotals.totalActiveStudySeconds).toBe(300);
  });

  it('never promotes viewed-only sessions to developing/flourishing and keeps preview islands strictly preview', () => {
    const viewedTwoSum = makeVerifiedSession('ts-view', 'two-sum', {
      viewedOnly: true,
      activeStudySeconds: 45,
    });
    const completedStack = makeVerifiedSession('vp-done', 'valid-parentheses', {
      completedAll: true,
      activeStudySeconds: 180,
    });

    const snapshot = buildMiriIslandsSnapshot([viewedTwoSum, completedStack]);
    expect(snapshot.islandsById['storage-harbor'].stage).toBe('explored');
    expect(snapshot.islandsById['storage-harbor'].eligiblePracticeSessionsCount).toBe(0);
    expect(snapshot.islandsById['stack-spire'].stage).toBe('flourishing');
    expect(snapshot.islandsById['mosaic-meadow'].stage).toBe('preview');
    expect(snapshot.globalTotals.uniqueEligiblePracticeSessions).toBe(1);
  });
});

describe('Phase 7A — Miri Islands UI Showcase on ProfilePage (EN/VI, Light/Dark, Accessibility)', () => {
  beforeEach(async () => {
    window.localStorage.clear();
    document.documentElement.dataset.theme = 'light';
    await i18n.changeLanguage('en');
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  it('renders all 8 islands with accessible artwork, excludes AI bookmarks from island progress, and localizes in VI and Dark Mode', async () => {
    const learningRepo = new LocalStorageLearningRepository();
    learningRepo.saveSession(
      makeVerifiedSession('ts-1', 'two-sum', { completedAll: true, activeStudySeconds: 240 }),
    );

    // AI bookmark MUST NOT grant Miri Island progress
    new LocalStorageAiProblemHistoryRepository().save({
      title: 'Minimum Coin Change',
      source: 'curated-ai',
      problemId: 'minimum-coin-change',
      topic: 'Dynamic Programming',
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

    expect(screen.getByTestId('miri-islands-practiced-badge')).toHaveTextContent(
      /1\/4 verified islands practiced/i,
    );
    expect(screen.getByTestId('miri-island-storage-harbor')).toHaveTextContent(
      /flourishing \(guided\)/i,
    );
    expect(screen.getByTestId('miri-island-mosaic-meadow')).toHaveTextContent(
      /preview · ai-guided/i,
    );

    // Accessible alt text exists on all 3 prototype images
    expect(screen.getByAltText(/storage harbor/i)).toBeInTheDocument();
    expect(screen.getByAltText(/stack spire/i)).toBeInTheDocument();
    expect(screen.getByAltText(/halfway lighthouse/i)).toBeInTheDocument();

    // Switch to Vietnamese & Dark Mode
    await user.click(screen.getAllByRole('button', { name: /dark mode/i })[0]);
    expect(document.documentElement.dataset.theme).toBe('dark');
    await user.selectOptions(screen.getAllByLabelText(/language/i)[0], 'vi');

    expect(screen.getByText(/xem trước thế giới quần đảo miri/i)).toBeInTheDocument();
    expect(screen.getByTestId('miri-island-storage-harbor')).toHaveTextContent(
      /cảng lưu trữ/i,
    );
    expect(screen.getByTestId('miri-island-stack-spire')).toHaveTextContent(
      /tháp ngăn xếp/i,
    );
    expect(screen.getByTestId('miri-island-halfway-lighthouse')).toHaveTextContent(
      /hải đăng trung điểm/i,
    );
  });
});
