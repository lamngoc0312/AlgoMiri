import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import i18n from '../i18n';
import {
  MIRI_ISLANDS_REGISTRY,
  getIslandById,
  hasVisualGrowthStages,
  resolveIslandArtworkPath,
} from '../domain/islands/islandRegistry';
import { MAP_TRAVERSAL_ORDER } from '../domain/islands/islandMapLayout';
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
        `/assets/islands/v2/transparent/${island.id}.webp`,
      );
      expect(island.artwork.originalAssetPath).toBe(
        `/assets/islands/v2/${island.id}.jpg`,
      );
      expect(island.artwork.legacyAssetPath).toBe(
        `/assets/islands/transparent/${island.id}.webp`,
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

describe('Phase 7B.2 — Profile Teaser & Interactive Miri Islands World Map (/islands)', () => {
  beforeEach(async () => {
    window.localStorage.clear();
    document.documentElement.dataset.theme = 'light';
    await i18n.changeLanguage('en');
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  it('shows compact Miri Islands teaser on Profile and navigates to /islands', async () => {
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

    const exploreCta = screen.getByTestId('explore-miri-islands-cta');
    expect(exploreCta).toHaveTextContent(/explore miri islands/i);
    await user.click(exploreCta);

    expect(
      screen.getByRole('heading', { name: /miri islands world map/i }),
    ).toBeInTheDocument();
    expect(screen.getByTestId('miri-islands-world-canvas')).toBeInTheDocument();
  }, 15_000);

  it('supports selecting verified & preview islands, Escape dismissal, keyboard arrows, artwork fallback, EN/VI, and Dark Mode on /islands without triggering AI fetches', async () => {
    const learningRepo = new LocalStorageLearningRepository();
    learningRepo.saveSession(
      makeVerifiedSession('ts-done', 'two-sum', {
        completedAll: true,
        activeStudySeconds: 240,
      }),
    );
    learningRepo.saveSession(
      makeVerifiedSession('sa-bs-only', 'split-array-largest-sum', {
        completedStageIds: ['sa-stage-4-bs-answer'],
        activeStudySeconds: 180,
      }),
    );

    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={['/islands']}>
        <AppRoutes />
      </MemoryRouter>,
    );

    expect(screen.getByTestId('world-map-practiced-badge')).toHaveTextContent(
      /2\/4 verified islands practiced/i,
    );

    // All 8 islands render with accessible alt text
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
      expect(screen.getAllByAltText(pattern).length).toBeGreaterThanOrEqual(1);
    }

    // Select Halfway Lighthouse (Binary Search practiced -> Developing)
    const halfwayBtn = screen.getByTestId('world-island-halfway-lighthouse');
    await user.click(halfwayBtn);
    const inspector = screen.getByTestId('miri-island-inspector');
    expect(inspector).toHaveTextContent(/halfway lighthouse/i);
    expect(inspector).toHaveTextContent(/developing/i);
    expect(screen.getByTestId('miri-island-inspector-cta')).toHaveTextContent(
      /open studio/i,
    );
    expect(screen.getByTestId('miri-island-inspector-cta')).toHaveAttribute(
      'href',
      '/studio/split-array-largest-sum',
    );

    // Select Compass Cove (Greedy NOT practiced -> Explored, NOT Developing)
    await user.click(screen.getByTestId('world-island-compass-cove'));
    expect(screen.getByTestId('miri-island-inspector')).toHaveTextContent(
      /explored \(viewed only\)/i,
    );

    // Select Preview island (Mosaic Meadow) — shows honest AI disclaimer and triggers ZERO AI requests
    await user.click(screen.getByTestId('world-island-mosaic-meadow'));
    expect(screen.getByTestId('miri-island-inspector')).toHaveTextContent(
      /preview · ai-guided/i,
    );
    expect(screen.getByTestId('miri-island-inspector')).toHaveTextContent(
      /offline demo mode/i,
    );
    expect(screen.getByTestId('miri-island-inspector-cta')).toHaveTextContent(
      /explore ai-guided preview/i,
    );
    expect(screen.getByTestId('miri-island-inspector-cta')).toHaveAttribute(
      'href',
      '/?prefill=minimum-coin-change',
    );
    expect(fetchSpy).not.toHaveBeenCalled();

    // Escape dismisses the inspector panel
    await user.keyboard('{Escape}');
    expect(screen.queryByTestId('miri-island-inspector')).not.toBeInTheDocument();
    expect(
      screen.getByTestId('miri-island-inspector-empty'),
    ).toBeInTheDocument();

    // ArrowRight moves focus along the archipelago
    const storageBtn = screen.getByTestId('world-island-storage-harbor');
    storageBtn.focus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByTestId('world-island-stack-spire')).toHaveFocus();

    // Graceful artwork fallback on error
    const firstCompassImg = screen.getAllByAltText(/compass cove/i)[0];
    fireEvent.error(firstCompassImg);
    expect(
      screen.getAllByRole('img', { name: /compass cove/i }).length,
    ).toBeGreaterThanOrEqual(1);

    // Switch to Vietnamese & Dark Mode
    await user.click(screen.getAllByRole('button', { name: /dark mode/i })[0]);
    expect(document.documentElement.dataset.theme).toBe('dark');
    await user.selectOptions(screen.getAllByLabelText(/language/i)[0], 'vi');

    expect(
      screen.getByRole('heading', { name: /bản đồ thế giới quần đảo miri/i }),
    ).toBeInTheDocument();
    await user.click(screen.getByTestId('world-island-mosaic-meadow'));
    expect(screen.getByTestId('miri-island-inspector-cta')).toHaveTextContent(
      /khám phá bản xem trước ai/i,
    );

    // Phase 7B.4: Vietnamese island labels must be Vietnamese-only (no English parentheticals) and unclipped (no truncate)
    for (const island of MIRI_ISLANDS_REGISTRY) {
      const labelEl = screen.getAllByTestId(`world-island-label-${island.id}`)[0];
      expect(labelEl.textContent?.trim()).toBeTruthy();
      expect(labelEl.textContent).not.toMatch(/\(/);
      expect(labelEl.innerHTML).not.toContain('truncate');
    }

    fetchSpy.mockRestore();
  }, 15_000);

  it('keeps mobile carousel and quick-jump pills in MAP_TRAVERSAL_ORDER, restores focus on Escape/close, announces selections, and honors prefers-reduced-motion scrollIntoView', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/islands']}>
        <AppRoutes />
      </MemoryRouter>,
    );

    // 1. Verify mobile carousel and quick-jump pills strictly match MAP_TRAVERSAL_ORDER
    const carousel = screen.getByTestId('miri-islands-mobile-carousel');
    const carouselIds = Array.from(carousel.querySelectorAll('button')).map(
      (btn) => btn.getAttribute('data-testid')?.replace('world-island-mobile-', ''),
    );
    expect(carouselIds).toEqual([...MAP_TRAVERSAL_ORDER]);

    const quickJump = screen.getByTestId('miri-islands-mobile-quickjump');
    const pillIds = Array.from(quickJump.querySelectorAll('button')).map((btn) =>
      btn.getAttribute('data-testid')?.replace('world-island-pill-', ''),
    );
    expect(pillIds).toEqual([...MAP_TRAVERSAL_ORDER]);

    // 2. Keyboard Enter selects island, announces to screen readers, and Escape restores focus to the trigger button
    const stackBtn = screen.getByTestId('world-island-stack-spire');
    stackBtn.focus();
    await user.keyboard('{Enter}');
    expect(screen.getByTestId('miri-island-inspector')).toHaveTextContent(
      /stack spire/i,
    );
    expect(screen.getByTestId('miri-islands-live-region')).toHaveTextContent(
      /selected stack spire/i,
    );

    // Move focus inside inspector (e.g. close button) then press Escape -> focus returns to stackBtn
    const closeBtn = screen.getByRole('button', { name: /close island details/i });
    closeBtn.focus();
    await user.keyboard('{Escape}');
    expect(screen.queryByTestId('miri-island-inspector')).not.toBeInTheDocument();
    expect(stackBtn).toHaveFocus();
    expect(screen.getByTestId('miri-islands-live-region')).toHaveTextContent(
      /closed island details/i,
    );

    // 3. Clicking close button also restores focus to triggering button
    await user.click(stackBtn);
    await user.click(
      screen.getByRole('button', { name: /close island details/i }),
    );
    expect(stackBtn).toHaveFocus();

    // 4. Reduced-motion preference uses behavior: 'auto' instead of 'smooth' on mobile quick-jump scrollIntoView
    const originalMatchMedia = window.matchMedia;
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query === '(prefers-reduced-motion: reduce)',
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
    const mobileCompassNode = screen.getByTestId(
      'world-island-mobile-compass-cove',
    );
    const scrollSpy = vi.fn();
    mobileCompassNode.scrollIntoView = scrollSpy;

    await user.click(screen.getByTestId('world-island-pill-compass-cove'));
    expect(scrollSpy).toHaveBeenCalledWith(
      expect.objectContaining({ behavior: 'auto' }),
    );
    window.matchMedia = originalMatchMedia;
  }, 15_000);
});

describe('Phase 7C.1 & 7C.2 — Visual Island Growth Across All Four Verified Islands', () => {
  beforeEach(async () => {
    window.localStorage.clear();
    document.documentElement.dataset.theme = 'light';
    await i18n.changeLanguage('en');
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  it('resolves all four growth stage assets for all four verified islands and preserves base artwork for the four AI preview islands', () => {
    const verifiedIds = [
      'storage-harbor',
      'stack-spire',
      'halfway-lighthouse',
      'compass-cove',
    ] as const;

    for (const id of verifiedIds) {
      const island = getIslandById(id)!;
      expect(hasVisualGrowthStages(island)).toBe(true);
      expect(resolveIslandArtworkPath(island, 'undiscovered')).toBe(
        `/assets/islands/v2/growth/${id}/undiscovered.webp`,
      );
      expect(resolveIslandArtworkPath(island, 'explored')).toBe(
        `/assets/islands/v2/growth/${id}/explored.webp`,
      );
      expect(resolveIslandArtworkPath(island, 'developing')).toBe(
        `/assets/islands/v2/growth/${id}/developing.webp`,
      );
      expect(resolveIslandArtworkPath(island, 'flourishing')).toBe(
        `/assets/islands/v2/growth/${id}/flourishing.webp`,
      );
    }

    const previewIds = [
      'twin-beacon-bay',
      'window-wharf',
      'bridge-archipelago',
      'mosaic-meadow',
    ] as const;
    for (const id of previewIds) {
      const island = getIslandById(id)!;
      expect(hasVisualGrowthStages(island)).toBe(false);
      expect(resolveIslandArtworkPath(island, 'flourishing')).toBe(
        island.artwork.assetPath,
      );
    }
  });

  it('keeps Halfway Lighthouse and Compass Cove visual growth strictly independent on multi-topic Split Array sessions', async () => {
    const user = userEvent.setup();
    const repo = new LocalStorageLearningRepository();

    // 1. Binary Search ONLY -> Halfway Lighthouse = developing.webp, Compass Cove = explored.webp (NOT developing!)
    repo.saveSession(
      makeVerifiedSession('sa-bs-only-7c2', 'split-array-largest-sum', {
        completedStageIds: ['sa-stage-4-bs-answer'],
        activeStudySeconds: 180,
      }),
    );

    const bsRender = render(
      <MemoryRouter initialEntries={['/islands']}>
        <AppRoutes />
      </MemoryRouter>,
    );
    expect(
      screen.getByTestId('world-island-halfway-lighthouse').querySelector('img'),
    ).toHaveAttribute(
      'src',
      '/assets/islands/v2/growth/halfway-lighthouse/developing.webp',
    );
    expect(
      screen.getByTestId('world-island-compass-cove').querySelector('img'),
    ).toHaveAttribute(
      'src',
      '/assets/islands/v2/growth/compass-cove/explored.webp',
    );

    // Demo preview on Compass Cove must not mutate saved records or world map image
    await user.click(screen.getByTestId('world-island-compass-cove'));
    await user.click(screen.getByTestId('growth-demo-btn-flourishing'));
    expect(screen.getByTestId('miri-inspector-artwork-img')).toHaveAttribute(
      'src',
      '/assets/islands/v2/growth/compass-cove/flourishing.webp',
    );
    expect(
      screen.getByTestId('world-island-compass-cove').querySelector('img'),
    ).toHaveAttribute(
      'src',
      '/assets/islands/v2/growth/compass-cove/explored.webp',
    );
    bsRender.unmount();

    // 2. Greedy ONLY -> Compass Cove = developing.webp, Halfway Lighthouse = explored.webp (NOT developing!)
    window.localStorage.clear();
    repo.saveSession(
      makeVerifiedSession('sa-greedy-only-7c2', 'split-array-largest-sum', {
        completedStageIds: ['sa-stage-3-greedy'],
        activeStudySeconds: 150,
      }),
    );

    const greedyRender = render(
      <MemoryRouter initialEntries={['/islands']}>
        <AppRoutes />
      </MemoryRouter>,
    );
    expect(
      screen.getByTestId('world-island-compass-cove').querySelector('img'),
    ).toHaveAttribute(
      'src',
      '/assets/islands/v2/growth/compass-cove/developing.webp',
    );
    expect(
      screen.getByTestId('world-island-halfway-lighthouse').querySelector('img'),
    ).toHaveAttribute(
      'src',
      '/assets/islands/v2/growth/halfway-lighthouse/explored.webp',
    );
    greedyRender.unmount();

    // 3. Stack Spire completed -> flourishing.webp, legacy Split Array -> both explored.webp
    window.localStorage.clear();
    repo.saveSession(
      makeVerifiedSession('vp-full-7c2', 'valid-parentheses', {
        completedAll: true,
        activeStudySeconds: 200,
      }),
    );
    repo.saveSession(
      makeVerifiedSession('sa-legacy-7c2', 'split-array-largest-sum', {
        customStageIds: ['old-stage-1'],
        completedAll: true,
        activeStudySeconds: 90,
      }),
    );

    render(
      <MemoryRouter initialEntries={['/islands']}>
        <AppRoutes />
      </MemoryRouter>,
    );
    expect(
      screen.getByTestId('world-island-stack-spire').querySelector('img'),
    ).toHaveAttribute(
      'src',
      '/assets/islands/v2/growth/stack-spire/flourishing.webp',
    );
    expect(
      screen.getByTestId('world-island-halfway-lighthouse').querySelector('img'),
    ).toHaveAttribute(
      'src',
      '/assets/islands/v2/growth/halfway-lighthouse/explored.webp',
    );
    expect(
      screen.getByTestId('world-island-compass-cove').querySelector('img'),
    ).toHaveAttribute(
      'src',
      '/assets/islands/v2/growth/compass-cove/explored.webp',
    );
  }, 15_000);

  it('renders Storage Harbor artwork matching real learning evidence across undiscovered, explored, developing, and flourishing stages, supports demo preview without mutating records, and falls back gracefully on missing assets', async () => {
    const user = userEvent.setup();

    // 1. Empty history -> undiscovered
    const { unmount } = render(
      <MemoryRouter initialEntries={['/islands']}>
        <AppRoutes />
      </MemoryRouter>,
    );
    const mapImgUndiscovered = screen
      .getByTestId('world-island-storage-harbor')
      .querySelector('img');
    expect(mapImgUndiscovered).toHaveAttribute(
      'src',
      '/assets/islands/v2/growth/storage-harbor/undiscovered.webp',
    );

    await user.click(screen.getByTestId('world-island-storage-harbor'));
    expect(screen.getByTestId('miri-inspector-stage-reason')).toHaveTextContent(
      /no verified studio sessions recorded/i,
    );
    expect(screen.getByTestId('miri-inspector-artwork-img')).toHaveAttribute(
      'src',
      '/assets/islands/v2/growth/storage-harbor/undiscovered.webp',
    );

    // Demo preview switches ONLY inspector preview, never map or saved storage
    await user.click(screen.getByTestId('growth-demo-btn-flourishing'));
    expect(screen.getByTestId('growth-demo-active-pill')).toBeInTheDocument();
    expect(screen.getByTestId('miri-inspector-artwork-img')).toHaveAttribute(
      'src',
      '/assets/islands/v2/growth/storage-harbor/flourishing.webp',
    );
    expect(
      screen.getByTestId('world-island-storage-harbor').querySelector('img'),
    ).toHaveAttribute(
      'src',
      '/assets/islands/v2/growth/storage-harbor/undiscovered.webp',
    );
    expect(new LocalStorageLearningRepository().loadSessions().sessions).toHaveLength(
      0,
    );

    // Two-tier missing-asset fallback: stage asset error -> base v2 asset -> accessible icon fallback
    fireEvent.error(screen.getByTestId('miri-inspector-artwork-img'));
    expect(screen.getByTestId('miri-inspector-artwork-img')).toHaveAttribute(
      'src',
      '/assets/islands/v2/transparent/storage-harbor.webp',
    );
    fireEvent.error(screen.getByTestId('miri-inspector-artwork-img'));
    expect(
      screen.queryByTestId('miri-inspector-artwork-img'),
    ).not.toBeInTheDocument();
    unmount();

    // 2. Viewed-only session -> explored
    const repo = new LocalStorageLearningRepository();
    repo.saveSession(
      makeVerifiedSession('ts-view-only', 'two-sum', { viewedOnly: true }),
    );
    const viewRender = render(
      <MemoryRouter initialEntries={['/islands']}>
        <AppRoutes />
      </MemoryRouter>,
    );
    expect(
      screen.getByTestId('world-island-storage-harbor').querySelector('img'),
    ).toHaveAttribute(
      'src',
      '/assets/islands/v2/growth/storage-harbor/explored.webp',
    );
    viewRender.unmount();

    // 3. Partial genuine attempt (including legacy stage IDs) -> developing
    window.localStorage.clear();
    repo.saveSession(
      makeVerifiedSession('ts-dev-legacy', 'two-sum', {
        customStageIds: ['legacy-stage-1', 'legacy-stage-2'],
        completedStageIds: ['legacy-stage-1'],
      }),
    );
    const devRender = render(
      <MemoryRouter initialEntries={['/islands']}>
        <AppRoutes />
      </MemoryRouter>,
    );
    expect(
      screen.getByTestId('world-island-storage-harbor').querySelector('img'),
    ).toHaveAttribute(
      'src',
      '/assets/islands/v2/growth/storage-harbor/developing.webp',
    );
    devRender.unmount();

    // 4. Completed guided session -> flourishing
    window.localStorage.clear();
    repo.saveSession(
      makeVerifiedSession('ts-complete', 'two-sum', { completedAll: true }),
    );
    render(
      <MemoryRouter initialEntries={['/islands']}>
        <AppRoutes />
      </MemoryRouter>,
    );
    expect(
      screen.getByTestId('world-island-storage-harbor').querySelector('img'),
    ).toHaveAttribute(
      'src',
      '/assets/islands/v2/growth/storage-harbor/flourishing.webp',
    );
    await user.click(screen.getByTestId('world-island-storage-harbor'));
    expect(screen.getByTestId('miri-inspector-stage-reason')).toHaveTextContent(
      /flourishing from a completed guided session/i,
    );
  }, 15_000);
});
