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
 * Reusable Phase 7A Miri Islands preview showcase.
 * Displays the 3 prototype-ready islands prominently and the remaining 5 planned/discovery
 * islands below, driven strictly by verified Studio evidence. Designed to evolve into the
 * Phase 7B interactive world map without rewriting evidence logic.
 */
export function MiriIslandsShowcase({ sessions }: MiriIslandsShowcaseProps) {
  const { t } = useTranslation();
  const snapshot = useMemo(() => buildMiriIslandsSnapshot(sessions), [sessions]);

  const prototypeIslands = snapshot.islands.filter(
    (entry) => entry.island.artwork.status === 'prototype-ready',
  );
  const upcomingIslands = snapshot.islands.filter(
    (entry) => entry.island.artwork.status === 'planned',
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
        {/* 3 Original 2.5D Pastel Prototype Islands */}
        <div className="grid gap-4 md:grid-cols-3">
          {prototypeIslands.map((entry) => (
            <MiriIslandCard key={entry.island.id} entry={entry} />
          ))}
        </div>

        {/* 5 Remaining Islands (Honest Discovery Previews & Multi-Topic Greedy Cove) */}
        <div className="space-y-3 border-t border-[var(--border-subtle)] pt-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
            {t('islands.upcomingTitle')}
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {upcomingIslands.map((entry) => (
              <MiriIslandCard key={entry.island.id} entry={entry} compact />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
