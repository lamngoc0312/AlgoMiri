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

export type IslandArtworkStatus = 'ready' | 'planned';

export type IslandDestinationKind = 'verified-studio' | 'ai-guided-preview';

export interface MiriIslandPalette {
  accentHex: string;
  accentBarClass: string;
  badgeVariant: 'indigo' | 'teal' | 'mint' | 'amber' | 'sky' | 'coral' | 'neutral';
  softSurfaceClass: string;
}

export interface MiriIslandArtworkMeta {
  status: IslandArtworkStatus;
  /** Production Cozy Fantasy v2 800x600 (4:3) alpha-transparent WebP asset for map & inspector. */
  assetPath: string | null;
  /** High-resolution Cozy Fantasy v2 1024x1024 source master preserved for archival reference. */
  originalAssetPath: string | null;
  /** Preserved Phase 7B.1 v1 transparent WebP asset for reversible comparison. */
  legacyAssetPath: string | null;
  aspectRatio: '4:3';
  dimensions: { width: number; height: number };
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
  /**
   * Distinguishing topic-specific SkillIds required for a multi-topic Studio session
   * (e.g. Split Array Largest Sum) to advance this specific island's practice stage.
   */
  primarySkillIds: readonly SkillId[];
  /** Verified skill IDs associated with this island's topic (including shared composition skills). */
  relatedSkillIds: readonly SkillId[];
  /** Extensible slots for future Phase 7C+ cosmetic decorations (not rendered yet). */
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
      status: 'ready',
      assetPath: '/assets/islands/v2/transparent/storage-harbor.webp',
      originalAssetPath: '/assets/islands/v2/storage-harbor.jpg',
      legacyAssetPath: '/assets/islands/transparent/storage-harbor.webp',
      aspectRatio: '4:3',
      dimensions: { width: 800, height: 600 },
      silhouetteSummary:
        'Organic crescent trading harbor curving around a turquoise bay with dock, sailboat, crane, and indexed pastel cubbies.',
    },
    destination: {
      path: '/studio/two-sum',
      kind: 'verified-studio',
    },
    verifiedProblemIds: ['two-sum'],
    primarySkillIds: ['array-indexing', 'hash-map-lookup', 'brute-force'],
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
      status: 'ready',
      assetPath: '/assets/islands/v2/transparent/stack-spire.webp',
      originalAssetPath: '/assets/islands/v2/stack-spire.jpg',
      legacyAssetPath: '/assets/islands/transparent/stack-spire.webp',
      aspectRatio: '4:3',
      dimensions: { width: 800, height: 600 },
      silhouetteSummary:
        'Tall, narrow vertically tapered floating rocky pinnacle with stacked teal-and-cream clay rings and lavender spiral steps.',
    },
    destination: {
      path: '/studio/valid-parentheses',
      kind: 'verified-studio',
    },
    verifiedProblemIds: ['valid-parentheses'],
    primarySkillIds: ['stack-lifo'],
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
      status: 'ready',
      assetPath: '/assets/islands/v2/transparent/twin-beacon-bay.webp',
      originalAssetPath: '/assets/islands/v2/twin-beacon-bay.jpg',
      legacyAssetPath: '/assets/islands/transparent/twin-beacon-bay.webp',
      aspectRatio: '4:3',
      dimensions: { width: 800, height: 600 },
      silhouetteSummary:
        'Two separate rocky headland islets with matching coral-roofed signal towers linked across open sky by a curved arch bridge.',
    },
    destination: {
      path: '/?prefill=sorted-pair-sum',
      kind: 'ai-guided-preview',
    },
    verifiedProblemIds: [],
    primarySkillIds: [],
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
      status: 'ready',
      assetPath: '/assets/islands/v2/transparent/window-wharf.webp',
      originalAssetPath: '/assets/islands/v2/window-wharf.jpg',
      legacyAssetPath: '/assets/islands/transparent/window-wharf.webp',
      aspectRatio: '4:3',
      dimensions: { width: 800, height: 600 },
      silhouetteSummary:
        'Elongated diagonal peninsula wharf with boardwalk, garden bed sequence, and movable translucent glass greenhouse on wheels.',
    },
    destination: {
      path: '/?prefill=longest-subarray-under-budget',
      kind: 'ai-guided-preview',
    },
    verifiedProblemIds: [],
    primarySkillIds: [],
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
      status: 'ready',
      assetPath: '/assets/islands/v2/transparent/halfway-lighthouse.webp',
      originalAssetPath: '/assets/islands/v2/halfway-lighthouse.jpg',
      legacyAssetPath: '/assets/islands/transparent/halfway-lighthouse.webp',
      aspectRatio: '4:3',
      dimensions: { width: 800, height: 600 },
      silhouetteSummary:
        'Asymmetric twin-cliff coastal island with central midpoint lighthouse dividing a sunlit meadow terrace from a pine headland.',
    },
    destination: {
      path: '/studio/split-array-largest-sum',
      kind: 'verified-studio',
    },
    verifiedProblemIds: ['split-array-largest-sum'],
    primarySkillIds: ['binary-search-answer'],
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
      status: 'ready',
      assetPath: '/assets/islands/v2/transparent/bridge-archipelago.webp',
      originalAssetPath: '/assets/islands/v2/bridge-archipelago.jpg',
      legacyAssetPath: '/assets/islands/transparent/bridge-archipelago.webp',
      aspectRatio: '4:3',
      dimensions: { width: 800, height: 600 },
      silhouetteSummary:
        'Six separate floating rocky islets linked across open air by arched bridges radiating in BFS layers from a central gazebo hub.',
    },
    destination: {
      path: '/?prefill=shortest-grid-path',
      kind: 'ai-guided-preview',
    },
    verifiedProblemIds: [],
    primarySkillIds: [],
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
      status: 'ready',
      assetPath: '/assets/islands/v2/transparent/mosaic-meadow.webp',
      originalAssetPath: '/assets/islands/v2/mosaic-meadow.jpg',
      legacyAssetPath: '/assets/islands/transparent/mosaic-meadow.webp',
      aspectRatio: '4:3',
      dimensions: { width: 800, height: 600 },
      silhouetteSummary:
        'Curved organically terraced hillside amphitheater of interlocking pastel mosaic tiles climbing to a sunlit hilltop pavilion.',
    },
    destination: {
      path: '/?prefill=minimum-coin-change',
      kind: 'ai-guided-preview',
    },
    verifiedProblemIds: [],
    primarySkillIds: [],
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
      status: 'ready',
      assetPath: '/assets/islands/v2/transparent/compass-cove.webp',
      originalAssetPath: '/assets/islands/v2/compass-cove.jpg',
      legacyAssetPath: '/assets/islands/transparent/compass-cove.webp',
      aspectRatio: '4:3',
      dimensions: { width: 800, height: 600 },
      silhouetteSummary:
        'Irregular windswept coastal cliff jutting over a turquoise cove with gold-and-teal compass plaza, supply carts, and lookout trail.',
    },
    destination: {
      path: '/studio/split-array-largest-sum',
      kind: 'verified-studio',
    },
    verifiedProblemIds: ['split-array-largest-sum'],
    primarySkillIds: ['greedy-feasibility'],
    relatedSkillIds: ['greedy-feasibility', 'algorithm-composition'],
    decorationSlots: ['compass-plaza', 'trail-markers'],
  },
] as const;

export function getIslandById(id: MiriIslandId): MiriIslandDefinition | undefined {
  return MIRI_ISLANDS_REGISTRY.find((island) => island.id === id);
}
