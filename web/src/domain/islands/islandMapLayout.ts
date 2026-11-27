import type { MiriIslandId } from './islandRegistry';

export interface IslandMapNodeLayout {
  id: MiriIslandId;
  /** Horizontal center percentage on desktop/tablet world canvas (0–100). */
  xPct: number;
  /** Vertical center percentage on desktop/tablet world canvas (0–100). */
  yPct: number;
  /** Applied visual scale multiplier to keep all eight island silhouettes balanced. */
  scale: number;
  /** Layering order for natural atmospheric depth. */
  zIndex: number;
}

/**
 * Pure spatial layout for the 8 floating islands on the desktop/tablet Miri Islands World Map.
 *
 * Design notes:
 * - Arranged as an organic two-band floating archipelago with balanced clearance so no islands
 *   clip and no EN/VI labels overlap at 768px, 1024px, 125% zoom, or 1440px.
 * - Placement is aesthetic/spatial only; decorative sky trails never imply unsupported
 *   learning prerequisites.
 */
export const MIRI_ISLANDS_MAP_LAYOUT: Record<MiriIslandId, IslandMapNodeLayout> = {
  'storage-harbor': {
    id: 'storage-harbor',
    xPct: 14,
    yPct: 24,
    scale: 1.0,
    zIndex: 12,
  },
  'stack-spire': {
    id: 'stack-spire',
    xPct: 38,
    yPct: 19,
    scale: 0.98,
    zIndex: 11,
  },
  'twin-beacon-bay': {
    id: 'twin-beacon-bay',
    xPct: 63,
    yPct: 22,
    scale: 1.02,
    zIndex: 11,
  },
  'window-wharf': {
    id: 'window-wharf',
    xPct: 86,
    yPct: 26,
    scale: 1.0,
    zIndex: 12,
  },
  'halfway-lighthouse': {
    id: 'halfway-lighthouse',
    xPct: 16,
    yPct: 68,
    scale: 1.04,
    zIndex: 15,
  },
  'compass-cove': {
    id: 'compass-cove',
    xPct: 40.5,
    yPct: 73,
    scale: 1.02,
    zIndex: 16,
  },
  'bridge-archipelago': {
    id: 'bridge-archipelago',
    xPct: 65,
    yPct: 66,
    scale: 1.02,
    zIndex: 15,
  },
  'mosaic-meadow': {
    id: 'mosaic-meadow',
    xPct: 86.5,
    yPct: 72,
    scale: 1.0,
    zIndex: 16,
  },
};

/**
 * Unified traversal and display order shared by the desktop map, mobile carousel,
 * and mobile quick-jump pills so keyboard arrows and Tab order always match what is visible.
 */
export const MAP_TRAVERSAL_ORDER: readonly MiriIslandId[] = [
  'storage-harbor',
  'stack-spire',
  'twin-beacon-bay',
  'window-wharf',
  'halfway-lighthouse',
  'compass-cove',
  'bridge-archipelago',
  'mosaic-meadow',
];
