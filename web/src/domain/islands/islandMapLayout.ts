import type { MiriIslandId } from './islandRegistry';

export interface IslandMapNodeLayout {
  id: MiriIslandId;
  /** Horizontal center percentage on desktop world canvas (0–100). */
  xPct: number;
  /** Vertical center percentage on desktop world canvas (0–100). */
  yPct: number;
  /** Subtle visual scale multiplier to keep silhouettes balanced across all 8 islands. */
  scale: number;
  /** Layering order for natural atmospheric depth. */
  zIndex: number;
  /** Subtle ambient float phase offset (only applied when user allows motion). */
  floatDelaySec: number;
}

/**
 * Pure spatial layout for the 8 floating islands on the desktop Miri Islands World Map.
 *
 * Design notes:
 * - Arranged as an organic two-band floating archipelago with ~23–25% horizontal clearance
 *   and ~42% vertical clearance so no islands clip and no EN/VI labels overlap.
 * - Placement is aesthetic/spatial only; decorative sky trails never imply unsupported
 *   learning prerequisites.
 */
export const MIRI_ISLANDS_MAP_LAYOUT: Record<MiriIslandId, IslandMapNodeLayout> = {
  'storage-harbor': {
    id: 'storage-harbor',
    xPct: 14.5,
    yPct: 24,
    scale: 1.02,
    zIndex: 12,
    floatDelaySec: 0,
  },
  'stack-spire': {
    id: 'stack-spire',
    xPct: 38.5,
    yPct: 19,
    scale: 1.0,
    zIndex: 11,
    floatDelaySec: 0.6,
  },
  'twin-beacon-bay': {
    id: 'twin-beacon-bay',
    xPct: 63.5,
    yPct: 22,
    scale: 1.02,
    zIndex: 11,
    floatDelaySec: 1.2,
  },
  'window-wharf': {
    id: 'window-wharf',
    xPct: 86,
    yPct: 26,
    scale: 1.0,
    zIndex: 12,
    floatDelaySec: 1.8,
  },
  'halfway-lighthouse': {
    id: 'halfway-lighthouse',
    xPct: 17,
    yPct: 68,
    scale: 1.04,
    zIndex: 15,
    floatDelaySec: 0.4,
  },
  'compass-cove': {
    id: 'compass-cove',
    xPct: 41.5,
    yPct: 73,
    scale: 1.02,
    zIndex: 16,
    floatDelaySec: 1.0,
  },
  'bridge-archipelago': {
    id: 'bridge-archipelago',
    xPct: 65.5,
    yPct: 66,
    scale: 1.03,
    zIndex: 15,
    floatDelaySec: 1.5,
  },
  'mosaic-meadow': {
    id: 'mosaic-meadow',
    xPct: 86.5,
    yPct: 72,
    scale: 1.0,
    zIndex: 16,
    floatDelaySec: 2.1,
  },
};

/** Keyboard left/right traversal order matching the visual archipelago sweep. */
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
