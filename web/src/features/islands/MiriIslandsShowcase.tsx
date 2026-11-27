import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Compass } from 'lucide-react';
import type { LearningSession } from '../../domain/learning/types';
import { buildMiriIslandsSnapshot } from '../../domain/islands/islandProgress';
import { MiriIslandCard } from './MiriIslandCard';
import { Badge } from '../../components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';

interface MiriIslandsShowcaseProps {
  sessions: LearningSession[];
}

/**
 * Reusable Miri Islands showcase displaying all 8 cohesive 2.5D pastel islands,
 * separated honestly into Verified Studio Islands (driven strictly by verified
 * topic-specific practice evidence) and Discovery Preview Islands (AI-guided).
 * Designed to evolve into the Phase 7B.2 interactive world map without rewriting evidence logic.
 */
export function MiriIslandsShowcase({ sessions }: MiriIslandsShowcaseProps) {
  const { t } = useTranslation();
  const snapshot = useMemo(() => buildMiriIslandsSnapshot(sessions), [sessions]);

  const verifiedIslands = snapshot.islands.filter(
    (entry) => entry.hasVerifiedStudio,
  );
  const previewIslands = snapshot.islands.filter(
    (entry) => !entry.hasVerifiedStudio,
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <Compass
              className="h-5 w-5 text-[var(--accent-blue-link)]"
              aria-hidden="true"
            />
            <CardTitle>{t('islands.title')}</CardTitle>
            <Badge variant="indigo">{t('islands.badge')}</Badge>
          </div>
          <Badge variant="mint" data-testid="miri-islands-practiced-badge">
            {t('islands.verifiedCount', {
              practiced: snapshot.globalTotals.practicedIslandsCount,
              total: snapshot.globalTotals.verifiedIslandsCount,
            })}
          </Badge>
        </div>
        <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
          {t('islands.subtitle')}
        </p>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* 4 Verified Studio Islands */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {verifiedIslands.map((entry) => (
            <MiriIslandCard key={entry.island.id} entry={entry} />
          ))}
        </div>

        {/* 4 Discovery Preview Islands (AI-Guided) */}
        <div className="space-y-3 border-t border-[var(--border-subtle)] pt-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
            {t('islands.upcomingTitle')}
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {previewIslands.map((entry) => (
              <MiriIslandCard key={entry.island.id} entry={entry} compact />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
