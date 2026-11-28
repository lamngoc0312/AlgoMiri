import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowRight,
  BookOpenCheck,
  Clock,
  Compass,
  Eye,
  Info,
  Sparkles,
  X,
} from 'lucide-react';
import type {
  IslandGrowthStage,
  MiriIslandProgress,
} from '../../domain/islands/islandProgress';
import {
  hasVisualGrowthStages,
  resolveIslandArtworkPath,
  type IslandVisualGrowthStage,
} from '../../domain/islands/islandRegistry';
import { formatStudyDuration } from '../../domain/learning/studyTimer';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

interface MiriIslandInspectorProps {
  entry: MiriIslandProgress | null;
  onClose: () => void;
}

const DEMO_GROWTH_STAGES: readonly IslandVisualGrowthStage[] = [
  'undiscovered',
  'explored',
  'developing',
  'flourishing',
];

function stageBadgeVariant(
  stage: IslandGrowthStage,
): 'mint' | 'indigo' | 'amber' | 'neutral' {
  switch (stage) {
    case 'flourishing':
      return 'mint';
    case 'developing':
      return 'indigo';
    case 'explored':
      return 'amber';
    default:
      return 'neutral';
  }
}

export function MiriIslandInspector({
  entry,
  onClose,
}: MiriIslandInspectorProps) {
  const { t } = useTranslation();
  const [failedSrcs, setFailedSrcs] = useState<Record<string, boolean>>({});
  const [demoStage, setDemoStage] = useState<IslandVisualGrowthStage | null>(
    null,
  );

  const activeIslandId = entry?.island.id ?? null;
  useEffect(() => {
    setFailedSrcs({});
    setDemoStage(null);
  }, [activeIslandId]);

  // Dismiss panel on Escape
  useEffect(() => {
    if (!entry) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [entry, onClose]);

  if (!entry) {
    return (
      <aside
        aria-label={t('islands.map.selectPromptTitle')}
        data-testid="miri-island-inspector-empty"
        className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-card)]/95 p-5 shadow-xs backdrop-blur-sm lg:sticky lg:top-20"
      >
        <div className="flex items-start gap-3">
          <span
            aria-hidden="true"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-blue-soft)] text-[var(--accent-blue-text)]"
          >
            <Compass className="h-5 w-5" />
          </span>
          <div className="space-y-1">
            <p className="text-sm font-bold text-[var(--text-primary)]">
              {t('islands.map.selectPromptTitle')}
            </p>
            <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
              {t('islands.map.selectPromptBody')}
            </p>
          </div>
        </div>
        <p className="mt-3 border-t border-[var(--border-subtle)] pt-3 text-[11px] leading-relaxed text-[var(--text-secondary)]">
          {t('islands.map.keyboardHint')}
        </p>
      </aside>
    );
  }

  const {
    island,
    stage,
    hasVerifiedStudio,
    relevantSessionsCount,
    eligiblePracticeSessionsCount,
    verifiedSkillEvidenceCount,
    relevantActiveStudySeconds,
    sharesMultiTopicStudio,
  } = entry;

  const supportsVisualGrowth = hasVisualGrowthStages(island);
  const displayedStage: IslandGrowthStage =
    supportsVisualGrowth && demoStage ? demoStage : stage;
  const preferredSrc = resolveIslandArtworkPath(island, displayedStage);
  const activeSrc =
    preferredSrc && !failedSrcs[preferredSrc]
      ? preferredSrc
      : island.artwork.assetPath && !failedSrcs[island.artwork.assetPath]
        ? island.artwork.assetPath
        : null;

  const stageReasonText = (() => {
    switch (stage) {
      case 'undiscovered':
        return t('islands.map.stageReasons.undiscovered');
      case 'explored':
        return sharesMultiTopicStudio
          ? t('islands.map.stageReasons.exploredMultiTopic', {
              count: relevantSessionsCount,
            })
          : t('islands.map.stageReasons.explored', {
              count: relevantSessionsCount,
            });
      case 'developing':
        return t('islands.map.stageReasons.developing', {
          count: eligiblePracticeSessionsCount,
        });
      case 'flourishing':
        return t('islands.map.stageReasons.flourishing', {
          count: eligiblePracticeSessionsCount,
        });
      default:
        return '';
    }
  })();

  return (
    <>
      {/* Mobile / tablet backdrop scrim (< 1024px only) so tapping outside closes the bottom sheet */}
      <div
        aria-hidden="true"
        data-testid="miri-island-sheet-backdrop"
        onClick={onClose}
        className="fixed inset-0 z-30 bg-slate-950/35 backdrop-blur-[1px] lg:hidden"
      />

      {/* Responsive Inspector: anchored bottom sheet on < 1024px, sticky right side panel on >= 1024px */}
      <aside
        aria-label={t('islands.map.inspectorAria', { name: t(island.nameKey) })}
        data-testid="miri-island-inspector"
        className="fixed inset-x-0 bottom-0 z-40 max-h-[82vh] overflow-y-auto rounded-t-3xl border-t border-x border-[var(--accent-blue-border)]/80 bg-[var(--surface-card)] shadow-2xl lg:static lg:inset-auto lg:z-auto lg:max-h-none lg:overflow-hidden lg:rounded-2xl lg:border lg:shadow-md lg:sticky lg:top-20"
      >
        <div
          className={`h-1.5 w-full ${island.palette.accentBarClass}`}
          aria-hidden="true"
        />

        {/* Subtle bottom-sheet handle pill on mobile/tablet */}
        <div
          aria-hidden="true"
          className="mx-auto mt-2.5 h-1 w-10 rounded-full bg-[var(--border-control)]/70 lg:hidden"
        />

        <div className="space-y-4 p-5">
          {/* Header with island name, close button, and compact badges */}
          <div className="flex items-start justify-between gap-2.5">
            <div className="min-w-0 space-y-1.5">
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge variant={island.palette.badgeVariant}>
                  {t(island.topicKey)}
                </Badge>
                <Badge variant={stageBadgeVariant(stage)}>
                  {t(`islands.stages.${stage}`)}
                </Badge>
              </div>
              <h2 className="text-lg font-extrabold leading-snug tracking-tight text-[var(--text-primary)]">
                {t(island.nameKey)}
              </h2>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              aria-label={t('islands.map.closeInspector')}
              className="h-9 w-9 shrink-0 rounded-xl p-0 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>

          {/* Island miniature artwork preview (reflects real growth stage, or clearly-labeled demo preview) */}
          <div className="relative flex h-36 w-full items-center justify-center overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-subtle)] p-2">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 opacity-70"
              style={{
                background: `radial-gradient(circle at 50% 45%, ${island.palette.accentHex}28 0%, transparent 72%)`,
              }}
            />
            {demoStage && (
              <span
                data-testid="growth-demo-active-pill"
                className="pointer-events-none absolute left-2.5 top-2 z-20 inline-flex items-center gap-1 rounded-full bg-[var(--surface-card)]/90 px-2 py-0.5 text-[10px] font-bold text-[var(--accent-blue-text)] shadow-2xs border border-[var(--accent-blue-border)]"
              >
                <Eye className="h-3 w-3" aria-hidden="true" />
                {t('islands.map.growthPreview.demoBadge')}
              </span>
            )}
            {activeSrc ? (
              <img
                src={activeSrc}
                alt={t(island.altKey)}
                data-testid="miri-inspector-artwork-img"
                width={island.artwork.dimensions.width}
                height={island.artwork.dimensions.height}
                onError={() =>
                  setFailedSrcs((prev) => ({ ...prev, [activeSrc]: true }))
                }
                style={{ filter: 'var(--miri-island-shadow)' }}
                className="relative z-10 h-full w-full object-contain"
              />
            ) : (
              <div
                role="img"
                aria-label={t(island.altKey)}
                className="relative z-10 flex flex-col items-center gap-1.5 text-center"
              >
                <Compass
                  className="h-7 w-7"
                  style={{ color: island.palette.accentHex }}
                  aria-hidden="true"
                />
                <span className="text-[11px] font-semibold text-[var(--text-secondary)]">
                  {t('islands.plannedArtLabel')}
                </span>
              </div>
            )}
          </div>

          {/* Optional Demo Growth Sequence Preview (Storage Harbor pilot — never alters real progress) */}
          {supportsVisualGrowth && (
            <div
              data-testid="growth-demo-preview"
              className="space-y-2 rounded-xl border border-dashed border-[var(--border-control)] bg-[var(--surface-subtle)]/80 p-3"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold text-[var(--text-primary)]">
                  {t('islands.map.growthPreview.title')}
                </span>
                {demoStage && (
                  <button
                    type="button"
                    onClick={() => setDemoStage(null)}
                    className="text-[11px] font-semibold text-[var(--accent-blue-link)] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-blue)] rounded"
                  >
                    {t('islands.map.growthPreview.resetActual')}
                  </button>
                )}
              </div>
              <div
                role="group"
                aria-label={t('islands.map.growthPreview.title')}
                className="grid grid-cols-2 gap-1.5"
              >
                {DEMO_GROWTH_STAGES.map((st) => {
                  const isPreviewing = displayedStage === st;
                  const isActual = stage === st;
                  return (
                    <button
                      key={st}
                      type="button"
                      data-testid={`growth-demo-btn-${st}`}
                      aria-pressed={isPreviewing}
                      onClick={() => setDemoStage(st === stage ? null : st)}
                      className={`rounded-lg border px-2 py-1 text-left text-[11px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--accent-blue)] ${
                        isPreviewing
                          ? 'border-[var(--accent-blue)] bg-[var(--accent-blue-soft)] text-[var(--accent-blue-text)]'
                          : 'border-[var(--border-subtle)] bg-[var(--surface-card)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      <span className="block truncate">
                        {t(`islands.stages.${st}`)}
                      </span>
                      {isActual && (
                        <span className="block text-[9px] font-bold uppercase tracking-wide opacity-80">
                          {t('islands.map.growthPreview.currentTag')}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              <p className="text-[10px] leading-snug text-[var(--text-secondary)]">
                {t('islands.map.growthPreview.disclaimer')}
              </p>
            </div>
          )}

          {/* Description & Availability */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge variant={hasVerifiedStudio ? 'teal' : 'neutral'}>
                {hasVerifiedStudio
                  ? t('islands.map.verifiedAvailability')
                  : t('islands.map.previewAvailability')}
              </Badge>
            </div>
            <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
              {t(island.taglineKey)}
            </p>
          </div>

          {/* Honest practice summary + stage explanation or AI preview disclaimer */}
          {hasVerifiedStudio ? (
            <div className="space-y-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-subtle)] p-3">
              <p
                data-testid="miri-inspector-stage-reason"
                className="text-xs leading-relaxed text-[var(--text-primary)]"
              >
                {stageReasonText}
              </p>
              <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1.5 border-t border-[var(--border-subtle)] pt-2 text-xs text-[var(--text-secondary)]">
                <span className="inline-flex items-center gap-1.5 font-semibold text-[var(--text-primary)]">
                  <BookOpenCheck
                    className="h-3.5 w-3.5 text-[var(--accent-teal-text)]"
                    aria-hidden="true"
                  />
                  {t('islands.evidenceSessions', {
                    count: eligiblePracticeSessionsCount,
                  })}
                </span>
                <span>
                  {t('islands.map.skillEvidenceCount', {
                    count: verifiedSkillEvidenceCount,
                  })}
                </span>
                {relevantActiveStudySeconds !== null && (
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                    {formatStudyDuration(relevantActiveStudySeconds, t)}
                  </span>
                )}
              </div>
              {sharesMultiTopicStudio && (
                <p className="flex items-start gap-1.5 text-xs leading-relaxed text-[var(--text-secondary)]">
                  <Info
                    className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--accent-amber-text)]"
                    aria-hidden="true"
                  />
                  <span>{t('islands.sharedStudioNote')}</span>
                </p>
              )}
            </div>
          ) : (
            <p className="flex items-start gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-subtle)] px-3 py-2.5 text-xs leading-relaxed text-[var(--text-secondary)]">
              <Sparkles
                className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--accent-sky-text)]"
                aria-hidden="true"
              />
              <span>{t('islands.map.previewDisclaimer')}</span>
            </p>
          )}

          {/* Primary navigation CTA (never triggers an AI request on selection) */}
          <Link
            to={island.destination.path}
            data-testid="miri-island-inspector-cta"
            className={`inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold shadow-xs transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-blue)] ${
              hasVerifiedStudio
                ? 'bg-[var(--accent-blue-solid)] text-white hover:bg-[var(--accent-blue-hover)]'
                : 'border border-[var(--border-control)] bg-[var(--surface-subtle)] text-[var(--text-primary)] hover:border-[var(--accent-blue-border)] hover:text-[var(--accent-blue-text)]'
            }`}
          >
            {hasVerifiedStudio
              ? t('islands.map.openStudioCta')
              : t('islands.map.explorePreviewCta')}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </aside>
    </>
  );
}
