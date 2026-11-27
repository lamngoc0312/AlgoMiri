import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Compass } from 'lucide-react';
import type { LearningSession } from '../../domain/learning/types';
import {
  buildMiriIslandsSnapshot,
  type IslandGrowthStage,
} from '../../domain/islands/islandProgress';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';

interface MiriIslandsShowcaseProps {
  sessions: LearningSession[];
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

/**
 * Compact Profile teaser linking to the full interactive Miri Islands World Map (`/islands`).
 * Preserves honest verified progression counts without duplicating the full 8-island map.
 */
export function MiriIslandsShowcase({ sessions }: MiriIslandsShowcaseProps) {
  const { t } = useTranslation();
  const snapshot = useMemo(() => buildMiriIslandsSnapshot(sessions), [sessions]);
  const [failedIds, setFailedIds] = useState<Record<string, boolean>>({});

  const verifiedIslands = snapshot.islands.filter(
    (entry) => entry.hasVerifiedStudio,
  );
  const previewIslands = snapshot.islands.filter(
    (entry) => !entry.hasVerifiedStudio,
  );

  return (
    <Card className="overflow-hidden border-[var(--border-subtle)] shadow-sm">
      <div
        style={{ background: 'var(--miri-teaser-bg)' }}
        className="relative p-5 sm:p-6"
      >
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl space-y-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="indigo">
                <Compass className="h-3 w-3" aria-hidden="true" />
                {t('islands.badge')}
              </Badge>
              <Badge variant="mint" data-testid="miri-islands-practiced-badge">
                {t('islands.verifiedCount', {
                  practiced: snapshot.globalTotals.practicedIslandsCount,
                  total: snapshot.globalTotals.verifiedIslandsCount,
                })}
              </Badge>
            </div>

            <h2 className="text-xl font-extrabold tracking-tight text-[var(--text-primary)]">
              {t('islands.title')}
            </h2>
            <p className="text-xs leading-relaxed text-[var(--text-secondary)] sm:text-sm">
              {t('islands.teaserSubtitle')}
            </p>

            {/* Compact verified island status strip */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {verifiedIslands.map((entry) => (
                <span
                  key={entry.island.id}
                  data-testid={`miri-island-${entry.island.id}`}
                  style={{
                    backgroundColor: 'var(--miri-plaque-bg)',
                    borderColor: 'var(--miri-plaque-border)',
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1 text-xs font-semibold text-[var(--text-primary)] shadow-2xs"
                >
                  <span>{t(entry.island.nameKey)}</span>
                  <Badge variant={stageBadgeVariant(entry.stage)}>
                    {t(`islands.stages.${entry.stage}`)}
                  </Badge>
                </span>
              ))}
            </div>

            <p className="text-[11px] text-[var(--text-secondary)]">
              {t('islands.teaserPreviewCount', {
                count: previewIslands.length,
              })}
            </p>
          </div>

          {/* Right visual preview cluster + primary CTA to /islands */}
          <div className="flex flex-col items-stretch gap-3 sm:items-end">
            <div
              aria-hidden="true"
              style={{
                backgroundColor: 'var(--miri-mobile-bar-bg)',
                borderColor: 'var(--miri-plaque-border)',
              }}
              className="grid grid-cols-4 gap-2 rounded-2xl border p-2.5 backdrop-blur-xs"
            >
              {verifiedIslands.map((entry) => (
                <div
                  key={entry.island.id}
                  className="flex h-14 w-16 items-center justify-center sm:h-16 sm:w-20"
                >
                  {entry.island.artwork.assetPath &&
                  !failedIds[entry.island.id] ? (
                    <img
                      src={entry.island.artwork.assetPath}
                      alt=""
                      width={800}
                      height={600}
                      loading="lazy"
                      onError={() =>
                        setFailedIds((prev) => ({
                          ...prev,
                          [entry.island.id]: true,
                        }))
                      }
                      className="h-full w-full object-contain drop-shadow-[0_6px_8px_rgba(15,23,42,0.16)] dark:drop-shadow-[0_8px_10px_rgba(0,0,0,0.45)]"
                    />
                  ) : (
                    <Compass
                      className="h-5 w-5"
                      style={{ color: entry.island.palette.accentHex }}
                    />
                  )}
                </div>
              ))}
            </div>

            <Link
              to="/islands"
              data-testid="explore-miri-islands-cta"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[var(--accent-blue-solid)] px-5 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-[var(--accent-blue-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-blue)]"
            >
              <Compass className="h-4 w-4" aria-hidden="true" />
              {t('islands.exploreWorldCta')}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    </Card>
  );
}
