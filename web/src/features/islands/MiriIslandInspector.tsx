import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowRight,
  BookOpenCheck,
  Clock,
  Compass,
  Info,
  Sparkles,
  X,
} from 'lucide-react';
import type {
  IslandGrowthStage,
  MiriIslandProgress,
} from '../../domain/islands/islandProgress';
import { formatStudyDuration } from '../../domain/learning/studyTimer';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

interface MiriIslandInspectorProps {
  entry: MiriIslandProgress | null;
  onClose: () => void;
}

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
  const [imgFailed, setImgFailed] = useState(false);

  // Reset image error state when switching to a different island
  const activeIslandId = entry?.island.id ?? null;
  useEffect(() => {
    setImgFailed(false);
  }, [activeIslandId]);

  // Dismiss panel on Escape
  useEffect(() => {
    if (!entry) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [entry, onClose]);

  if (!entry) {
    return (
      <div
        data-testid="miri-island-inspector-empty"
        className="flex flex-col items-start justify-between gap-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-card)]/90 px-5 py-4 shadow-xs backdrop-blur-sm sm:flex-row sm:items-center"
      >
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-blue-soft)] text-[var(--accent-blue-text)]"
          >
            <Compass className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-bold text-[var(--text-primary)]">
              {t('islands.map.selectPromptTitle')}
            </p>
            <p className="text-xs text-[var(--text-secondary)]">
              {t('islands.map.selectPromptBody')}
            </p>
          </div>
        </div>
        <p className="text-[11px] font-medium text-[var(--text-secondary)]">
          {t('islands.map.keyboardHint')}
        </p>
      </div>
    );
  }

  const {
    island,
    stage,
    hasVerifiedStudio,
    eligiblePracticeSessionsCount,
    verifiedSkillEvidenceCount,
    relevantActiveStudySeconds,
    sharesMultiTopicStudio,
  } = entry;

  return (
    <section
      aria-label={t('islands.map.inspectorAria', { name: t(island.nameKey) })}
      data-testid="miri-island-inspector"
      className="relative overflow-hidden rounded-2xl border border-[var(--accent-blue-border)]/80 bg-[var(--surface-card)] shadow-md"
    >
      <div
        className={`h-1.5 w-full ${island.palette.accentBarClass}`}
        aria-hidden="true"
      />
      <div className="p-5 sm:p-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-center">
          {/* Island miniature artwork preview */}
          <div className="relative flex h-32 w-full shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-subtle)] p-2 md:h-36 md:w-48">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 opacity-70"
              style={{
                background: `radial-gradient(circle at 50% 45%, ${island.palette.accentHex}28 0%, transparent 72%)`,
              }}
            />
            {island.artwork.assetPath && !imgFailed ? (
              <img
                src={island.artwork.assetPath}
                alt={t(island.altKey)}
                width={island.artwork.dimensions.width}
                height={island.artwork.dimensions.height}
                onError={() => setImgFailed(true)}
                className="relative z-10 h-full w-full object-contain drop-shadow-[0_10px_14px_rgba(15,23,42,0.18)] dark:drop-shadow-[0_12px_18px_rgba(0,0,0,0.5)]"
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

          {/* Core metadata & honest progress summary */}
          <div className="min-w-0 flex-1 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge variant={island.palette.badgeVariant}>
                    {t(island.topicKey)}
                  </Badge>
                  <Badge variant={stageBadgeVariant(stage)}>
                    {t(`islands.stages.${stage}`)}
                  </Badge>
                  <Badge variant={hasVerifiedStudio ? 'teal' : 'neutral'}>
                    {hasVerifiedStudio
                      ? t('islands.map.verifiedAvailability')
                      : t('islands.map.previewAvailability')}
                  </Badge>
                </div>
                <h2 className="text-xl font-extrabold tracking-tight text-[var(--text-primary)]">
                  {t(island.nameKey)}
                </h2>
                <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
                  {t(island.taglineKey)}
                </p>
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

            {hasVerifiedStudio ? (
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-[var(--text-secondary)]">
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
              <p className="flex items-start gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-subtle)] px-3 py-2 text-xs leading-relaxed text-[var(--text-secondary)]">
                <Sparkles
                  className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--accent-sky-text)]"
                  aria-hidden="true"
                />
                <span>{t('islands.map.previewDisclaimer')}</span>
              </p>
            )}
          </div>

          {/* Primary navigation CTA (never triggers an AI request on selection) */}
          <div className="flex shrink-0 flex-col gap-2 md:items-end">
            <Link
              to={island.destination.path}
              data-testid="miri-island-inspector-cta"
              className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold shadow-xs transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-blue)] ${
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
        </div>
      </div>
    </section>
  );
}
