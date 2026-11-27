import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Compass, Layers, MapPin } from 'lucide-react';
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
  const [imageFailed, setImageFailed] = useState(false);

  const canRenderAsset =
    island.artwork.status === 'ready' &&
    Boolean(island.artwork.assetPath) &&
    !imageFailed;

  if (canRenderAsset && island.artwork.assetPath) {
    return (
      <div
        className={`relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-subtle)] ${
          compact ? 'p-1.5' : 'p-2'
        }`}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            background: `radial-gradient(circle at 50% 42%, ${island.palette.accentHex}22 0%, transparent 72%)`,
          }}
        />
        <img
          src={island.artwork.assetPath}
          alt={t(island.altKey)}
          width={island.artwork.dimensions.width}
          height={island.artwork.dimensions.height}
          loading="lazy"
          decoding="async"
          onError={() => setImageFailed(true)}
          className="relative z-10 h-full w-full object-contain drop-shadow-[0_10px_14px_rgba(15,23,42,0.16)] transition-transform duration-300 group-hover:scale-[1.03] dark:drop-shadow-[0_12px_18px_rgba(0,0,0,0.48)]"
        />
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
