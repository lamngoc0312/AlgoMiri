import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
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

const REAL_STAGE_IDS = {
  'two-sum': [
    'understand',
    'discover-brute-force',
    'discover-optimization',
    'build-solution',
  ],
  'valid-parentheses': [
    'vp-understand',
    'vp-why-stack',
    'vp-trace-ops',
    'vp-build-pseudo',
  ],
  'split-array-largest-sum': [
    'sa-stage-1-understand',
    'sa-stage-2-feasibility',
    'sa-stage-3-greedy',
    'sa-stage-4-bs-answer',
    'sa-stage-5-compose',
  ],
} as const;

function makeVerifiedSession(
  sessionId: string,
  problemId: 'two-sum' | 'valid-parentheses' | 'split-array-largest-sum',
  options?: {
    completedAll?: boolean;
    viewedOnly?: boolean;
    activeStudySeconds?: number;
    completedStageIds?: string[];
    customStageIds?: string[];
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
  const stageIds = options?.customStageIds ?? [...REAL_STAGE_IDS[problemId]];
  const stageStatuses: Record<string, 'completed' | 'viewed' | 'unvisited'> = {};
  const hintsByStage: Record<string, number> = {};

  for (const id of stageIds) {
    hintsByStage[id] = 0;
    if (options?.viewedOnly) {
      stageStatuses[id] = id === stageIds[0] ? 'viewed' : 'unvisited';
    } else if (options?.completedAll) {
      stageStatuses[id] = 'completed';
    } else if (options?.completedStageIds) {
      stageStatuses[id] = options.completedStageIds.includes(id)
        ? 'completed'
        : 'viewed';
    } else {
      stageStatuses[id] = id === stageIds[0] ? 'completed' : 'viewed';
    }
  }

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
    hintsByStage,
    predictionRecords: {},
  });
}

describe('Phase 7B.1 — Miri Islands Registry, Complete Artwork & Topic-Specific Evidence', () => {
  it('registers all 8 islands with production transparent WebP artwork, preserved originals, and primary skill mappings', () => {
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

    for (const island of MIRI_ISLANDS_REGISTRY) {
      expect(island.artwork.status).toBe('ready');
      expect(island.artwork.assetPath).toBe(
        `/assets/islands/transparent/${island.id}.webp`,
      );
      expect(island.artwork.originalAssetPath).toBe(
        `/assets/islands/${island.id}.jpg`,
      );
      expect(island.artwork.dimensions).toEqual({ width: 800, height: 600 });
    }

    // Topic-specific primary skills distinguish Halfway Lighthouse vs Compass Cove
    expect(getIslandById('storage-harbor')?.primarySkillIds).toContain(
      'hash-map-lookup',
    );
    expect(getIslandById('stack-spire')?.primarySkillIds).toEqual(['stack-lifo']);
    expect(getIslandById('halfway-lighthouse')?.primarySkillIds).toEqual([
      'binary-search-answer',
    ]);
    expect(getIslandById('compass-cove')?.primarySkillIds).toEqual([
      'greedy-feasibility',
    ]);
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

  it('promotes ONLY Halfway Lighthouse (and NOT Compass Cove) when only Binary Search is practiced in Split Array', () => {
    const bsOnlySession = makeVerifiedSession(
      'split-bs-only',
      'split-array-largest-sum',
      {
        completedStageIds: ['sa-stage-4-bs-answer'],
        activeStudySeconds: 210,
      },
    );
    const snapshot = buildMiriIslandsSnapshot([bsOnlySession]);

    expect(snapshot.islandsById['halfway-lighthouse'].stage).toBe('developing');
    expect(
      snapshot.islandsById['halfway-lighthouse'].eligiblePracticeSessionsCount,
    ).toBe(1);
    expect(
      snapshot.islandsById['halfway-lighthouse'].verifiedSkillEvidenceCount,
    ).toBeGreaterThanOrEqual(1);

    // Compass Cove must NOT be promoted merely because Binary Search + algorithm-composition were practiced
    expect(snapshot.islandsById['compass-cove'].stage).toBe('explored');
    expect(
      snapshot.islandsById['compass-cove'].eligiblePracticeSessionsCount,
    ).toBe(0);
    expect(snapshot.islandsById['compass-cove'].verifiedSkillEvidenceCount).toBe(
      0,
    );
    expect(snapshot.islandsById['compass-cove'].relevantActiveStudySeconds).toBeNull();

    // Global totals count the session and study time ONCE
    expect(snapshot.globalTotals.uniqueSavedSessions).toBe(1);
    expect(snapshot.globalTotals.uniqueEligiblePracticeSessions).toBe(1);
    expect(snapshot.globalTotals.totalActiveStudySeconds).toBe(210);
    expect(snapshot.globalTotals.practicedIslandsCount).toBe(1);
  });

  it('promotes ONLY Compass Cove (and NOT Halfway Lighthouse) when only Greedy is practiced in Split Array', () => {
    const greedyOnlySession = makeVerifiedSession(
      'split-greedy-only',
      'split-array-largest-sum',
      {
        completedStageIds: ['sa-stage-3-greedy'],
        activeStudySeconds: 185,
      },
    );
    const snapshot = buildMiriIslandsSnapshot([greedyOnlySession]);

    expect(snapshot.islandsById['compass-cove'].stage).toBe('developing');
    expect(
      snapshot.islandsById['compass-cove'].eligiblePracticeSessionsCount,
    ).toBe(1);

    // Halfway Lighthouse must NOT be promoted from Greedy-only practice
    expect(snapshot.islandsById['halfway-lighthouse'].stage).toBe('explored');
    expect(
      snapshot.islandsById['halfway-lighthouse'].eligiblePracticeSessionsCount,
    ).toBe(0);

    expect(snapshot.globalTotals.uniqueSavedSessions).toBe(1);
    expect(snapshot.globalTotals.uniqueEligiblePracticeSessions).toBe(1);
    expect(snapshot.globalTotals.totalActiveStudySeconds).toBe(185);
    expect(snapshot.globalTotals.practicedIslandsCount).toBe(1);
  });

  it('promotes both Halfway Lighthouse and Compass Cove on a full Split Array lesson without double-counting global totals', () => {
    const fullSplitSession = makeVerifiedSession(
      'split-full-1',
      'split-array-largest-sum',
      { completedAll: true, activeStudySeconds: 360 },
    );
    const snapshot = buildMiriIslandsSnapshot([fullSplitSession]);

    expect(snapshot.islandsById['halfway-lighthouse'].stage).toBe('flourishing');
    expect(snapshot.islandsById['halfway-lighthouse'].sharesMultiTopicStudio).toBe(
      true,
    );
    expect(snapshot.islandsById['compass-cove'].stage).toBe('flourishing');
    expect(snapshot.islandsById['compass-cove'].sharesMultiTopicStudio).toBe(true);

    // Global totals count the single Split Array session ONCE (never 2 sessions or 720s!)
    expect(snapshot.globalTotals.uniqueSavedSessions).toBe(1);
    expect(snapshot.globalTotals.uniqueEligiblePracticeSessions).toBe(1);
    expect(snapshot.globalTotals.totalActiveStudySeconds).toBe(360);
    expect(snapshot.globalTotals.practicedIslandsCount).toBe(2);
  });

  it('handles legacy multi-topic sessions with missing/unmapped skillEvidence conservatively', () => {
    const legacySplitSession = makeVerifiedSession(
      'split-legacy',
      'split-array-largest-sum',
      {
        customStageIds: ['legacy-stage-a', 'legacy-stage-b'],
        completedAll: true,
        activeStudySeconds: 120,
      },
    );
    // Confirm this legacy session has zero mapped primary skillEvidence
    expect(legacySplitSession.skillEvidence.filter((e) => e.evidenceLevel !== 'viewed')).toHaveLength(0);

    const snapshot = buildMiriIslandsSnapshot([legacySplitSession]);
    // Conservative: stays 'explored' rather than falsely claiming both Binary Search and Greedy practice
    expect(snapshot.islandsById['halfway-lighthouse'].stage).toBe('explored');
    expect(snapshot.islandsById['compass-cove'].stage).toBe('explored');
    expect(snapshot.globalTotals.uniqueSavedSessions).toBe(1);
    expect(snapshot.globalTotals.totalActiveStudySeconds).toBe(120);
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
    expect(
      snapshot.islandsById['storage-harbor'].eligiblePracticeSessionsCount,
    ).toBe(0);
    expect(snapshot.islandsById['stack-spire'].stage).toBe('flourishing');
    expect(snapshot.islandsById['mosaic-meadow'].stage).toBe('preview');
    expect(snapshot.globalTotals.uniqueEligiblePracticeSessions).toBe(1);
  });
});

describe('Phase 7B.1 — Miri Islands UI Showcase on ProfilePage (All 8 Islands, EN/VI, Dark Mode, Fallback)', () => {
  beforeEach(async () => {
    window.localStorage.clear();
    document.documentElement.dataset.theme = 'light';
    await i18n.changeLanguage('en');
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  it('renders all 8 islands with accessible artwork, excludes AI bookmarks, supports fallback on error, and localizes in VI and Dark Mode', async () => {
    const learningRepo = new LocalStorageLearningRepository();
    learningRepo.saveSession(
      makeVerifiedSession('ts-1', 'two-sum', {
        completedAll: true,
        activeStudySeconds: 240,
      }),
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

    // Accessible alt text exists on ALL 8 island images
    const expectedAltPatterns = [
      /storage harbor/i,
      /stack spire/i,
      /twin beacon bay/i,
      /window wharf/i,
      /halfway lighthouse/i,
      /bridge archipelago/i,
      /mosaic meadow/i,
      /compass cove/i,
    ];
    for (const pattern of expectedAltPatterns) {
      expect(screen.getByAltText(pattern)).toBeInTheDocument();
    }

    // Verify clean accessible fallback when an image asset fails to load
    const compassImg = screen.getByAltText(/compass cove/i);
    fireEvent.error(compassImg);
    expect(screen.queryByAltText(/compass cove/i)).not.toBeInTheDocument();
    expect(screen.getByRole('img', { name: /compass cove/i })).toBeInTheDocument();

    // Switch to Vietnamese & Dark Mode
    await user.click(screen.getAllByRole('button', { name: /dark mode/i })[0]);
    expect(document.documentElement.dataset.theme).toBe('dark');
    await user.selectOptions(screen.getAllByLabelText(/language/i)[0], 'vi');

    expect(
      screen.getByText(/xem trước thế giới quần đảo miri/i),
    ).toBeInTheDocument();
    expect(screen.getByTestId('miri-island-storage-harbor')).toHaveTextContent(
      /cảng lưu trữ/i,
    );
    expect(screen.getByTestId('miri-island-twin-beacon-bay')).toHaveTextContent(
      /vịnh đèn đôi/i,
    );
    expect(screen.getByTestId('miri-island-compass-cove')).toHaveTextContent(
      /vịnh la bàn/i,
    );
  });
});
