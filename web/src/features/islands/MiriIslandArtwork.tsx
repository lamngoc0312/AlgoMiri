import { useTranslation } from 'react-i18next';
import { Compass, Layers, MapPin, Sparkles } from 'lucide-react';
import type { MiriIslandDefinition } from '../../domain/islands/islandRegistry';

interface MiriIslandArtworkProps {
  island: MiriIslandDefinition;
  compact?: boolean;
}

export function MiriIslandArtwork({
  island,
  compact = false,
}: MiriIslandArtworkProps) {
  const { t } = useTranslation();

  if (island.artwork.status === 'prototype-ready' && island.artwork.assetPath) {
    return (
      <div
        className={`relative overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[#F7F9FC] ${
          compact ? 'aspect-[4/3]' : 'aspect-[4/3]'
        }`}
      >
        <img
          src={island.artwork.assetPath}
          alt={t(island.altKey)}
          loading="lazy"
          className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-[1.03]"
        />
        <span className="pointer-events-none absolute right-2.5 top-2.5 inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-0.5 text-[11px] font-semibold text-[#202B3B] shadow-xs backdrop-blur-xs">
          <Sparkles className="h-3 w-3 text-[#2B6CC9]" aria-hidden="true" />
          {t('islands.prototypeBadge')}
        </span>
      </div>
    );
  }

  return (
    <div
      role="img"
      aria-label={t(island.altKey)}
      className={`relative flex aspect-[4/3] flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl border border-dashed border-[var(--border-control)] ${island.palette.softSurfaceClass} p-4 text-center`}
    >
      <span
        aria-hidden="true"
        className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--surface-card)]/90 text-[var(--text-primary)] shadow-xs"
      >
        {island.verifiedProblemIds.length > 0 ? (
          <Compass className="h-5 w-5" style={{ color: island.palette.accentHex }} />
        ) : island.order % 2 === 0 ? (
          <Layers className="h-5 w-5" style={{ color: island.palette.accentHex }} />
        ) : (
          <MapPin className="h-5 w-5" style={{ color: island.palette.accentHex }} />
        )}
      </span>
      <span className="text-[11px] font-semibold text-[var(--text-secondary)]">
        {t('islands.plannedArtLabel')}
      </span>
    </div>
  );
}
