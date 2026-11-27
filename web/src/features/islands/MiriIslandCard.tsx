import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight } from 'lucide-react';
import type {
  IslandGrowthStage,
  MiriIslandProgress,
} from '../../domain/islands/islandProgress';
import { MiriIslandArtwork } from './MiriIslandArtwork';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';

interface MiriIslandCardProps {
  entry: MiriIslandProgress;
  compact?: boolean;
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

export function MiriIslandCard({ entry, compact = false }: MiriIslandCardProps) {
  const { t } = useTranslation();
  const { island, stage, eligiblePracticeSessionsCount, sharesMultiTopicStudio } =
    entry;

  return (
    <Card
      data-testid={`miri-island-${island.id}`}
      className="group flex flex-col overflow-hidden transition-colors hover:border-[var(--accent-blue-border)]"
    >
      <div className={`h-1 w-full ${island.palette.accentBarClass}`} aria-hidden="true" />
      <div className={`flex flex-1 flex-col ${compact ? 'p-4 gap-3' : 'p-4 sm:p-5 gap-3.5'}`}>
        <MiriIslandArtwork island={island} compact={compact} />

        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant={island.palette.badgeVariant}>
              {t(island.topicKey)}
            </Badge>
            <Badge variant={stageBadgeVariant(stage)}>
              {t(`islands.stages.${stage}`)}
            </Badge>
          </div>
          <h3 className="text-base font-extrabold tracking-tight text-[var(--text-primary)]">
            {t(island.nameKey)}
          </h3>
          <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
            {t(island.taglineKey)}
          </p>
        </div>

        <div className="mt-auto space-y-2.5 border-t border-[var(--border-subtle)] pt-3">
          <p className="text-[11px] leading-snug text-[var(--text-secondary)]">
            {entry.hasVerifiedStudio
              ? t('islands.evidenceSessions', {
                  count: eligiblePracticeSessionsCount,
                })
              : t('islands.previewOnlyNote')}
          </p>
          {sharesMultiTopicStudio && (
            <p className="text-[11px] leading-snug text-[var(--text-secondary)]">
              {t('islands.sharedStudioNote')}
            </p>
          )}
          <Link
            to={island.destination.path}
            className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-xl border border-[var(--border-control)] bg-[var(--surface-subtle)] px-3 text-xs font-semibold text-[var(--text-primary)] transition-colors hover:border-[var(--accent-blue-border)] hover:text-[var(--accent-blue-text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-blue)]"
          >
            {island.destination.kind === 'verified-studio'
              ? t('islands.openStudio')
              : t('islands.explorePreview')}
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </Card>
  );
}
