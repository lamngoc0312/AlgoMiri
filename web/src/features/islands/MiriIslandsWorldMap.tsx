import { useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Compass, Sparkles } from 'lucide-react';
import type {
  IslandGrowthStage,
  MiriIslandProgress,
} from '../../domain/islands/islandProgress';
import {
  resolveIslandArtworkPath,
  type MiriIslandId,
} from '../../domain/islands/islandRegistry';
import {
  MAP_TRAVERSAL_ORDER,
  MIRI_ISLANDS_MAP_LAYOUT,
} from '../../domain/islands/islandMapLayout';

interface MiriIslandsWorldMapProps {
  islandsById: Record<MiriIslandId, MiriIslandProgress>;
  selectedIslandId: MiriIslandId | null;
  onSelectIsland: (
    id: MiriIslandId,
    triggerEl: HTMLButtonElement | null,
  ) => void;
}

function stageDotClass(stage: IslandGrowthStage): string {
  switch (stage) {
    case 'flourishing':
      return 'bg-[#15A897] ring-2 ring-[#15A897]/30';
    case 'developing':
      return 'bg-[#397BDB] ring-2 ring-[#397BDB]/30';
    case 'explored':
      return 'bg-[#F2B84B] ring-2 ring-[#F2B84B]/30';
    case 'undiscovered':
      return 'bg-slate-400 dark:bg-slate-500';
    case 'preview':
      return 'bg-[#83C8ED] ring-1 ring-[#83C8ED]/40';
  }
}

function stageRingStyle(
  stage: IslandGrowthStage,
  accentHex: string,
  isSelected: boolean,
): string | undefined {
  if (isSelected) {
    return `0 0 0 3px ${accentHex}, 0 18px 34px -10px ${accentHex}66`;
  }
  if (stage === 'flourishing') {
    return `0 0 0 2px #15A89780, 0 14px 26px -12px #15A89766`;
  }
  if (stage === 'developing') {
    return `0 0 0 2px ${accentHex}66`;
  }
  return undefined;
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

interface IslandNodeButtonProps {
  entry: MiriIslandProgress;
  scale: number;
  isSelected: boolean;
  onSelect: (triggerEl: HTMLButtonElement | null) => void;
  onKeyDown: (e: KeyboardEvent<HTMLButtonElement>) => void;
  buttonRef?: (el: HTMLButtonElement | null) => void;
  variant: 'desktop' | 'mobile';
}

function IslandNodeButton({
  entry,
  scale,
  isSelected,
  onSelect,
  onKeyDown,
  buttonRef,
  variant,
}: IslandNodeButtonProps) {
  const { t } = useTranslation();
  const { island, stage, hasVerifiedStudio } = entry;
  const preferredSrc = resolveIslandArtworkPath(island, stage);
  const [failedSrcs, setFailedSrcs] = useState<Record<string, boolean>>({});

  const activeSrc =
    preferredSrc && !failedSrcs[preferredSrc]
      ? preferredSrc
      : island.artwork.assetPath && !failedSrcs[island.artwork.assetPath]
        ? island.artwork.assetPath
        : null;

  const ariaLabel = t('islands.map.islandNodeAria', {
    name: t(island.nameKey),
    topic: t(island.topicKey),
    stage: t(`islands.stages.${stage}`),
  });

  const isPreview = stage === 'preview';
  const isFlourishing = stage === 'flourishing';

  return (
    <button
      ref={buttonRef}
      type="button"
      data-testid={
        variant === 'desktop'
          ? `world-island-${island.id}`
          : `world-island-mobile-${island.id}`
      }
      aria-label={ariaLabel}
      aria-pressed={isSelected}
      onClick={(e) => onSelect(e.currentTarget)}
      onKeyDown={onKeyDown}
      className={`group relative flex flex-col items-center text-center transition-transform duration-300 ease-out motion-reduce:transition-none motion-reduce:transform-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent-blue)] rounded-3xl ${
        variant === 'desktop'
          ? 'w-[154px] lg:w-[156px] xl:w-[196px]'
          : 'w-[236px] shrink-0 snap-center py-2'
      } ${
        isSelected
          ? '-translate-y-1.5 scale-[1.04]'
          : 'hover:-translate-y-1.5 hover:scale-[1.03]'
      }`}
    >
      {/* Tasteful subtle atmospheric halo beneath flourishing or selected islands */}
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute left-1/2 top-[44%] -z-10 h-20 w-36 -translate-x-1/2 -translate-y-1/2 rounded-full blur-xl transition-opacity duration-300 motion-reduce:transition-none ${
          isSelected
            ? 'opacity-80'
            : isFlourishing
              ? 'opacity-55'
              : 'opacity-0 group-hover:opacity-45'
        }`}
        style={{ backgroundColor: `${island.palette.accentHex}55` }}
      />

      {/* Transparent 2.5D island artwork with layout scale applied */}
      <div
        style={
          variant === 'desktop' && scale !== 1
            ? { transform: `scale(${scale})` }
            : undefined
        }
        className={`relative flex aspect-[4/3] w-full items-center justify-center ${
          isPreview && !isSelected ? 'opacity-95' : 'opacity-100'
        }`}
      >
        {activeSrc ? (
          <img
            src={activeSrc}
            alt={t(island.altKey)}
            width={island.artwork.dimensions.width}
            height={island.artwork.dimensions.height}
            decoding="async"
            onError={() =>
              setFailedSrcs((prev) => ({ ...prev, [activeSrc]: true }))
            }
            style={{
              filter: isSelected
                ? 'var(--miri-island-shadow-selected)'
                : 'var(--miri-island-shadow)',
            }}
            className="h-full w-full object-contain transition-[filter] duration-300 motion-reduce:transition-none"
          />
        ) : (
          <div
            role="img"
            aria-label={t(island.altKey)}
            className="flex h-24 w-32 flex-col items-center justify-center gap-1 rounded-2xl border border-dashed border-[var(--border-control)] bg-[var(--surface-card)]/85 px-2 text-center shadow-xs"
          >
            <Compass
              className="h-6 w-6"
              style={{ color: island.palette.accentHex }}
              aria-hidden="true"
            />
            <span className="text-[10px] font-semibold text-[var(--text-secondary)]">
              {t('islands.plannedArtLabel')}
            </span>
          </div>
        )}

        {/* Small floating sparkle indicator for Flourishing guided islands */}
        {isFlourishing && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute right-2 top-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#15A897] text-white shadow-sm"
          >
            <Sparkles className="h-3.5 w-3.5" />
          </span>
        )}
      </div>

      {/* Compact, visually secondary single-line name pill (zero ellipsis; full topic in Inspector) */}
      <div
        data-testid={`world-island-label-${island.id}`}
        style={{
          backgroundColor: isSelected
            ? 'var(--surface-card)'
            : hasVerifiedStudio
              ? 'var(--miri-plaque-bg)'
              : 'var(--miri-plaque-preview-bg)',
          borderColor: isSelected
            ? 'var(--accent-blue)'
            : hasVerifiedStudio
              ? 'var(--miri-plaque-border)'
              : 'var(--miri-plaque-preview-border)',
          boxShadow: stageRingStyle(stage, island.palette.accentHex, isSelected),
        }}
        className={`mt-1 inline-flex items-center justify-center gap-1.5 rounded-full border px-2.5 py-1 backdrop-blur-md transition-colors text-[var(--text-primary)] ${
          !hasVerifiedStudio && !isSelected ? 'border-dashed' : ''
        }`}
      >
        <span
          aria-hidden="true"
          className={`h-2 w-2 shrink-0 rounded-full ${stageDotClass(stage)}`}
        />
        <span className="whitespace-nowrap text-[11px] xl:text-xs font-bold leading-none tracking-tight text-[var(--text-primary)]">
          {t(island.nameKey)}
        </span>
      </div>
    </button>
  );
}

export function MiriIslandsWorldMap({
  islandsById,
  selectedIslandId,
  onSelectIsland,
}: MiriIslandsWorldMapProps) {
  const { t } = useTranslation();
  const desktopRefs = useRef<Partial<Record<MiriIslandId, HTMLButtonElement | null>>>({});
  const mobileRefs = useRef<Partial<Record<MiriIslandId, HTMLButtonElement | null>>>({});

  // Single unified order across desktop archipelago, mobile carousel, and mobile quick-jump pills
  const orderedIslands = useMemo(
    () =>
      MAP_TRAVERSAL_ORDER.map((id) => islandsById[id]).filter(
        (entry): entry is MiriIslandProgress => Boolean(entry),
      ),
    [islandsById],
  );

  const handleKeyDown = (
    currentId: MiriIslandId,
    variant: 'desktop' | 'mobile',
    event: KeyboardEvent<HTMLButtonElement>,
  ) => {
    const idx = MAP_TRAVERSAL_ORDER.indexOf(currentId);
    if (idx === -1) return;

    let nextIdx: number | null = null;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      nextIdx = (idx + 1) % MAP_TRAVERSAL_ORDER.length;
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      nextIdx = (idx - 1 + MAP_TRAVERSAL_ORDER.length) % MAP_TRAVERSAL_ORDER.length;
    }

    if (nextIdx !== null) {
      event.preventDefault();
      const nextId = MAP_TRAVERSAL_ORDER[nextIdx];
      const targetRef =
        variant === 'desktop'
          ? desktopRefs.current[nextId]
          : mobileRefs.current[nextId];
      targetRef?.focus();
      if (variant === 'mobile' && targetRef && typeof targetRef.scrollIntoView === 'function') {
        targetRef.scrollIntoView({
          behavior: prefersReducedMotion() ? 'auto' : 'smooth',
          inline: 'center',
          block: 'nearest',
        });
      }
    }
  };

  return (
    <div
      role="region"
      aria-label={t('islands.map.canvasAria')}
      data-testid="miri-islands-world-canvas"
      style={{ background: 'var(--miri-sky-bg)' }}
      className="relative overflow-hidden rounded-3xl border border-[var(--border-subtle)] shadow-md"
    >
      {/* Atmospheric Sky Backdrop SVG (clouds, soft sunlit glow, twilight stars, decorative sky currents) */}
      <svg
        aria-hidden="true"
        viewBox="0 0 1200 700"
        preserveAspectRatio="xMidYMid slice"
        className="pointer-events-none absolute inset-0 h-full w-full"
      >
        <defs>
          <radialGradient id="miri-sun-glow" cx="18%" cy="14%" r="42%">
            <stop offset="0%" stopColor="#FFF7DB" stopOpacity="0.85" />
            <stop offset="55%" stopColor="#FDECC8" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="miri-moon-glow" cx="84%" cy="14%" r="36%">
            <stop offset="0%" stopColor="#83C8ED" stopOpacity="0.26" />
            <stop offset="60%" stopColor="#397BDB" stopOpacity="0.09" />
            <stop offset="100%" stopColor="#0F172A" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Daytime warm glow (Light) & twilight moon glow (Dark) */}
        <rect
          width="1200"
          height="700"
          fill="url(#miri-sun-glow)"
          style={{ opacity: 'var(--miri-sun-opacity)' }}
        />
        <rect
          width="1200"
          height="700"
          fill="url(#miri-moon-glow)"
          style={{ opacity: 'var(--miri-moon-opacity)' }}
        />

        {/* Subtle twilight starlight dots (Dark Mode only) */}
        <g style={{ opacity: 'var(--miri-star-opacity)' }} fill="#E2EEFF">
          <circle cx="95" cy="64" r="1.8" />
          <circle cx="210" cy="42" r="1.4" />
          <circle cx="345" cy="76" r="1.6" />
          <circle cx="510" cy="36" r="2.0" />
          <circle cx="670" cy="54" r="1.4" />
          <circle cx="820" cy="40" r="1.8" />
          <circle cx="965" cy="70" r="1.5" />
          <circle cx="1090" cy="48" r="2.0" />
          <circle cx="1145" cy="140" r="1.4" />
          <circle cx="60" cy="290" r="1.5" />
          <circle cx="585" cy="335" r="1.4" />
          <circle cx="1135" cy="380" r="1.6" />
        </g>

        {/* Delicate decorative breeze curves (pure atmosphere, never prerequisite arrows) */}
        <g
          fill="none"
          strokeWidth="2"
          strokeDasharray="6 10"
          strokeLinecap="round"
          style={{ stroke: 'var(--miri-breeze-stroke)' }}
        >
          <path d="M 110 215 Q 290 120, 470 175 T 850 185 T 1090 220" />
          <path d="M 135 510 Q 340 595, 560 520 T 980 540" />
        </g>

        {/* Soft layered pastel clouds */}
        <g style={{ fill: 'var(--miri-cloud-fill)' }}>
          <ellipse cx="145" cy="95" rx="76" ry="22" />
          <ellipse cx="185" cy="84" rx="44" ry="18" />
          <ellipse cx="545" cy="86" rx="88" ry="22" />
          <ellipse cx="595" cy="76" rx="48" ry="17" />
          <ellipse cx="975" cy="108" rx="82" ry="21" />
          <ellipse cx="1015" cy="96" rx="44" ry="16" />
          <ellipse cx="335" cy="370" rx="92" ry="22" />
          <ellipse cx="875" cy="355" rx="86" ry="20" />
          <ellipse cx="120" cy="635" rx="95" ry="24" />
          <ellipse cx="620" cy="655" rx="108" ry="24" />
          <ellipse cx="1065" cy="640" rx="90" ry="22" />
        </g>
      </svg>

      {/* DESKTOP & TABLET (>= 768px): Organic Floating-Island Constellation */}
      <div className="relative hidden md:block min-h-[560px] lg:min-h-[590px] xl:min-h-[630px] w-full">
        {orderedIslands.map((entry) => {
          const id = entry.island.id;
          const layout = MIRI_ISLANDS_MAP_LAYOUT[id];
          if (!layout) return null;
          return (
            <div
              key={id}
              style={{
                left: `${layout.xPct}%`,
                top: `${layout.yPct}%`,
                zIndex: selectedIslandId === id ? 25 : layout.zIndex,
              }}
              className="absolute -translate-x-1/2 -translate-y-1/2"
            >
              <IslandNodeButton
                entry={entry}
                scale={layout.scale}
                isSelected={selectedIslandId === id}
                onSelect={(triggerEl) => onSelectIsland(id, triggerEl)}
                onKeyDown={(e) => handleKeyDown(id, 'desktop', e)}
                buttonRef={(el) => {
                  desktopRefs.current[id] = el;
                }}
                variant="desktop"
              />
            </div>
          );
        })}
      </div>

      {/* MOBILE (< 768px): Touch-Friendly Panoramic Horizontal Sky Explorer (unified traversal order) */}
      <div className="relative md:hidden">
        <div className="px-4 pt-4 pb-1">
          <p className="text-xs font-semibold text-[var(--text-secondary)]">
            {t('islands.map.mobileSwipeHint')}
          </p>
        </div>

        <div
          data-testid="miri-islands-mobile-carousel"
          className="flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 py-5"
          tabIndex={0}
          aria-label={t('islands.map.mobileScrollerAria')}
        >
          {orderedIslands.map((entry) => {
            const id = entry.island.id;
            const layout = MIRI_ISLANDS_MAP_LAYOUT[id];
            return (
              <IslandNodeButton
                key={id}
                entry={entry}
                scale={layout?.scale ?? 1}
                isSelected={selectedIslandId === id}
                onSelect={(triggerEl) => onSelectIsland(id, triggerEl)}
                onKeyDown={(e) => handleKeyDown(id, 'mobile', e)}
                buttonRef={(el) => {
                  mobileRefs.current[id] = el;
                }}
                variant="mobile"
              />
            );
          })}
        </div>

        {/* Compact touch-friendly quick-jump pills matching the exact carousel order */}
        <div
          data-testid="miri-islands-mobile-quickjump"
          style={{ backgroundColor: 'var(--miri-mobile-bar-bg)' }}
          className="flex flex-wrap items-center justify-center gap-1.5 border-t border-[var(--border-subtle)] px-3 py-3 backdrop-blur-xs"
        >
          {orderedIslands.map((entry) => {
            const id = entry.island.id;
            const active = selectedIslandId === id;
            return (
              <button
                key={id}
                type="button"
                data-testid={`world-island-pill-${id}`}
                aria-pressed={active}
                onClick={(e) => {
                  onSelectIsland(id, e.currentTarget);
                  const target = mobileRefs.current[id];
                  if (target && typeof target.scrollIntoView === 'function') {
                    target.scrollIntoView({
                      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
                      inline: 'center',
                      block: 'nearest',
                    });
                  }
                }}
                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-blue)] ${
                  active
                    ? 'border-[var(--accent-blue)] bg-[var(--accent-blue-solid)] text-white'
                    : 'border-[var(--border-control)] bg-[var(--surface-card)]/90 text-[var(--text-primary)]'
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`h-1.5 w-1.5 rounded-full ${
                    active ? 'bg-white' : stageDotClass(entry.stage)
                  }`}
                />
                <span>{t(entry.island.nameKey)}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
