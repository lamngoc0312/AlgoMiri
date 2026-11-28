import type { MiriIslandId } from './islandRegistry';

export interface IslandMapNodeLayout {
  id: MiriIslandId;
  /** Horizontal center percentage on desktop/tablet world canvas (0–100). */
  xPct: number;
  /** Vertical center percentage on desktop/tablet world canvas (0–100). */
  yPct: number;
  /** Applied visual scale multiplier to keep all eight organic island silhouettes balanced. */
  scale: number;
  /** Layering order for natural atmospheric depth. */
  zIndex: number;
}

/**
 * Pure spatial layout for the 8 floating islands arranged as an organic fantasy
 * archipelago constellation (intentionally avoiding a rigid 4×2 grid).
 *
 * Design notes:
 * - Varied elevation pockets (`yPct` spanning 16%–78%) create open sky breathing room
 *   and natural visual flow across `768px`, `1024px`, `125%` zoom, and `1440px`.
 * - Placement is aesthetic/spatial only; decorative sky trails never imply unsupported
 *   learning prerequisites.
 */
export const MIRI_ISLANDS_MAP_LAYOUT: Record<MiriIslandId, IslandMapNodeLayout> = {
  'storage-harbor': {
    id: 'storage-harbor',
    xPct: 16,
    yPct: 26,
    scale: 1.05,
    zIndex: 12,
  },
  'stack-spire': {
    id: 'stack-spire',
    xPct: 40,
    yPct: 17,
    scale: 1.03,
    zIndex: 11,
  },
  'twin-beacon-bay': {
    id: 'twin-beacon-bay',
    xPct: 64,
    yPct: 30,
    scale: 1.06,
    zIndex: 13,
  },
  'window-wharf': {
    id: 'window-wharf',
    xPct: 86,
    yPct: 18,
    scale: 1.02,
    zIndex: 11,
  },
  'halfway-lighthouse': {
    id: 'halfway-lighthouse',
    xPct: 17,
    yPct: 73,
    scale: 1.06,
    zIndex: 16,
  },
  'compass-cove': {
    id: 'compass-cove',
    xPct: 43,
    yPct: 57,
    scale: 1.04,
    zIndex: 14,
  },
  'bridge-archipelago': {
    id: 'bridge-archipelago',
    xPct: 65,
    yPct: 77,
    scale: 1.08,
    zIndex: 17,
  },
  'mosaic-meadow': {
    id: 'mosaic-meadow',
    xPct: 86,
    yPct: 59,
    scale: 1.03,
    zIndex: 15,
  },
};

/**
 * Unified traversal and display order shared by the desktop constellation, mobile carousel,
 * and mobile quick-jump pills so keyboard arrows and Tab order always match visible flow.
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
