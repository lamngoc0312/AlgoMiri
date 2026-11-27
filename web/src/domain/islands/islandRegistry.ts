import type { SkillId } from '../learning/types';

export type MiriIslandId =
  | 'storage-harbor'
  | 'stack-spire'
  | 'twin-beacon-bay'
  | 'window-wharf'
  | 'halfway-lighthouse'
  | 'bridge-archipelago'
  | 'mosaic-meadow'
  | 'compass-cove';

export type IslandArtworkStatus = 'prototype-ready' | 'planned';

export type IslandDestinationKind = 'verified-studio' | 'ai-guided-preview';

export interface MiriIslandPalette {
  accentHex: string;
  accentBarClass: string;
  badgeVariant: 'indigo' | 'teal' | 'mint' | 'amber' | 'sky' | 'coral' | 'neutral';
  softSurfaceClass: string;
}

export interface MiriIslandArtworkMeta {
  status: IslandArtworkStatus;
  /** Public asset URL when prototype artwork exists; null for planned Phase 7B slots. */
  assetPath: string | null;
  aspectRatio: '4:3';
  /** Short design note for future art/asset pipeline parity. */
  silhouetteSummary: string;
}

/**
 * Pure display & catalog metadata for a Miri Island.
 * Strictly separated from learner progress/evidence (computed in `islandProgress.ts`).
 */
export interface MiriIslandDefinition {
  id: MiriIslandId;
  order: number;
  nameKey: `islands.items.${MiriIslandId}.name`;
  topicKey: `islands.items.${MiriIslandId}.topic`;
  taglineKey: `islands.items.${MiriIslandId}.tagline`;
  altKey: `islands.items.${MiriIslandId}.alt`;
  palette: MiriIslandPalette;
  artwork: MiriIslandArtworkMeta;
  destination: {
    path: string;
    kind: IslandDestinationKind;
  };
  /** Verified deterministic Studio problem IDs that contribute evidence to this island. */
  verifiedProblemIds: readonly string[];
  /** Verified skill IDs associated with this island's topic. */
  relatedSkillIds: readonly SkillId[];
  /** Extensible slots for future Phase 7B+ cosmetic decorations (not rendered yet). */
  decorationSlots: readonly string[];
}

export const MIRI_ISLANDS_REGISTRY: readonly MiriIslandDefinition[] = [
  {
    id: 'storage-harbor',
    order: 1,
    nameKey: 'islands.items.storage-harbor.name',
    topicKey: 'islands.items.storage-harbor.topic',
    taglineKey: 'islands.items.storage-harbor.tagline',
    altKey: 'islands.items.storage-harbor.alt',
    palette: {
      accentHex: '#397BDB',
      accentBarClass: 'bg-[#397BDB]',
      badgeVariant: 'indigo',
      softSurfaceClass: 'bg-[var(--accent-blue-soft)]/50',
    },
    artwork: {
      status: 'prototype-ready',
      assetPath: '/assets/islands/storage-harbor.jpg',
      aspectRatio: '4:3',
      silhouetteSummary: 'Harbor dock with indexed pastel storage crates, crane, and cove.',
    },
    destination: {
      path: '/studio/two-sum',
      kind: 'verified-studio',
    },
    verifiedProblemIds: ['two-sum'],
    relatedSkillIds: ['array-indexing', 'hash-map-lookup', 'brute-force'],
    decorationSlots: ['harbor-lantern', 'crate-banner', 'sailboat-flag'],
  },
  {
    id: 'stack-spire',
    order: 2,
    nameKey: 'islands.items.stack-spire.name',
    topicKey: 'islands.items.stack-spire.topic',
    taglineKey: 'islands.items.stack-spire.tagline',
    altKey: 'islands.items.stack-spire.alt',
    palette: {
      accentHex: '#15A897',
      accentBarClass: 'bg-[#15A897]',
      badgeVariant: 'teal',
      softSurfaceClass: 'bg-[var(--accent-teal-soft)]/50',
    },
    artwork: {
      status: 'prototype-ready',
      assetPath: '/assets/islands/stack-spire.jpg',
      aspectRatio: '4:3',
      silhouetteSummary: 'Tiered pastel-teal stacked ring spire with spiral steps and top lantern.',
    },
    destination: {
      path: '/studio/valid-parentheses',
      kind: 'verified-studio',
    },
    verifiedProblemIds: ['valid-parentheses'],
    relatedSkillIds: ['stack-lifo'],
    decorationSlots: ['spire-beacon', 'balcony-planter', 'arch-crest'],
  },
  {
    id: 'twin-beacon-bay',
    order: 3,
    nameKey: 'islands.items.twin-beacon-bay.name',
    topicKey: 'islands.items.twin-beacon-bay.topic',
    taglineKey: 'islands.items.twin-beacon-bay.tagline',
    altKey: 'islands.items.twin-beacon-bay.alt',
    palette: {
      accentHex: '#83C8ED',
      accentBarClass: 'bg-[#83C8ED]',
      badgeVariant: 'sky',
      softSurfaceClass: 'bg-[var(--accent-sky-soft)]/55',
    },
    artwork: {
      status: 'planned',
      assetPath: null,
      aspectRatio: '4:3',
      silhouetteSummary: 'Twin coastal signal beacons on opposite sides of a crescent bay.',
    },
    destination: {
      path: '/?prefill=sorted-pair-sum',
      kind: 'ai-guided-preview',
    },
    verifiedProblemIds: [],
    relatedSkillIds: [],
    decorationSlots: ['west-beacon', 'east-beacon'],
  },
  {
    id: 'window-wharf',
    order: 4,
    nameKey: 'islands.items.window-wharf.name',
    topicKey: 'islands.items.window-wharf.topic',
    taglineKey: 'islands.items.window-wharf.tagline',
    altKey: 'islands.items.window-wharf.alt',
    palette: {
      accentHex: '#74BF88',
      accentBarClass: 'bg-[#74BF88]',
      badgeVariant: 'mint',
      softSurfaceClass: 'bg-[var(--accent-green-soft)]/55',
    },
    artwork: {
      status: 'planned',
      assetPath: null,
      aspectRatio: '4:3',
      silhouetteSummary: 'Boardwalk wharf with a sliding glass greenhouse pavilion on wooden rails.',
    },
    destination: {
      path: '/?prefill=longest-subarray-under-budget',
      kind: 'ai-guided-preview',
    },
    verifiedProblemIds: [],
    relatedSkillIds: [],
    decorationSlots: ['rail-frame', 'garden-beds'],
  },
  {
    id: 'halfway-lighthouse',
    order: 5,
    nameKey: 'islands.items.halfway-lighthouse.name',
    topicKey: 'islands.items.halfway-lighthouse.topic',
    taglineKey: 'islands.items.halfway-lighthouse.tagline',
    altKey: 'islands.items.halfway-lighthouse.alt',
    palette: {
      accentHex: '#F2B84B',
      accentBarClass: 'bg-[#F2B84B]',
      badgeVariant: 'amber',
      softSurfaceClass: 'bg-[var(--accent-amber-soft)]/55',
    },
    artwork: {
      status: 'prototype-ready',
      assetPath: '/assets/islands/halfway-lighthouse.jpg',
      aspectRatio: '4:3',
      silhouetteSummary: 'Striped amber-and-cream lighthouse centered on a midpoint stepping-stone path.',
    },
    destination: {
      path: '/studio/split-array-largest-sum',
      kind: 'verified-studio',
    },
    verifiedProblemIds: ['split-array-largest-sum'],
    relatedSkillIds: ['binary-search-answer', 'algorithm-composition'],
    decorationSlots: ['lighthouse-lens', 'midpoint-stones', 'cottage-garden'],
  },
  {
    id: 'bridge-archipelago',
    order: 6,
    nameKey: 'islands.items.bridge-archipelago.name',
    topicKey: 'islands.items.bridge-archipelago.topic',
    taglineKey: 'islands.items.bridge-archipelago.tagline',
    altKey: 'islands.items.bridge-archipelago.alt',
    palette: {
      accentHex: '#397BDB',
      accentBarClass: 'bg-[#397BDB]',
      badgeVariant: 'indigo',
      softSurfaceClass: 'bg-[var(--accent-blue-soft)]/50',
    },
    artwork: {
      status: 'planned',
      assetPath: null,
      aspectRatio: '4:3',
      silhouetteSummary: 'Cluster of tiny islets linked by concentric rounded arch bridges.',
    },
    destination: {
      path: '/?prefill=shortest-grid-path',
      kind: 'ai-guided-preview',
    },
    verifiedProblemIds: [],
    relatedSkillIds: [],
    decorationSlots: ['central-plaza', 'outer-bridges'],
  },
  {
    id: 'mosaic-meadow',
    order: 7,
    nameKey: 'islands.items.mosaic-meadow.name',
    topicKey: 'islands.items.mosaic-meadow.topic',
    taglineKey: 'islands.items.mosaic-meadow.tagline',
    altKey: 'islands.items.mosaic-meadow.alt',
    palette: {
      accentHex: '#F47768',
      accentBarClass: 'bg-[#F47768]',
      badgeVariant: 'coral',
      softSurfaceClass: 'bg-[var(--accent-coral-soft)]/50',
    },
    artwork: {
      status: 'planned',
      assetPath: null,
      aspectRatio: '4:3',
      silhouetteSummary: 'Terraced pastel mosaic tile hillside rising to a sunlit pavilion.',
    },
    destination: {
      path: '/?prefill=minimum-coin-change',
      kind: 'ai-guided-preview',
    },
    verifiedProblemIds: [],
    relatedSkillIds: [],
    decorationSlots: ['foundation-tiles', 'summit-pavilion'],
  },
  {
    id: 'compass-cove',
    order: 8,
    nameKey: 'islands.items.compass-cove.name',
    topicKey: 'islands.items.compass-cove.topic',
    taglineKey: 'islands.items.compass-cove.tagline',
    altKey: 'islands.items.compass-cove.alt',
    palette: {
      accentHex: '#F2B84B',
      accentBarClass: 'bg-[#F2B84B]',
      badgeVariant: 'amber',
      softSurfaceClass: 'bg-[var(--accent-amber-soft)]/55',
    },
    artwork: {
      status: 'planned',
      assetPath: null,
      aspectRatio: '4:3',
      silhouetteSummary: 'Sunlit coastal cliff with clay compass rose plaza and supply trails.',
    },
    destination: {
      path: '/studio/split-array-largest-sum',
      kind: 'verified-studio',
    },
    verifiedProblemIds: ['split-array-largest-sum'],
    relatedSkillIds: ['greedy-feasibility', 'algorithm-composition'],
    decorationSlots: ['compass-plaza', 'trail-markers'],
  },
] as const;

export function getIslandById(id: MiriIslandId): MiriIslandDefinition | undefined {
  return MIRI_ISLANDS_REGISTRY.find((island) => island.id === id);
}
