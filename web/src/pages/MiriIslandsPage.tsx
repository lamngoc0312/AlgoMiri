import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Compass } from 'lucide-react';
import { defaultLearningRepository } from '../services/learningRepository';
import { buildMiriIslandsSnapshot } from '../domain/islands/islandProgress';
import type { MiriIslandId } from '../domain/islands/islandRegistry';
import { MiriIslandsWorldMap } from '../features/islands/MiriIslandsWorldMap';
import { MiriIslandInspector } from '../features/islands/MiriIslandInspector';
import { Badge } from '../components/ui/Badge';

export function MiriIslandsPage() {
  const { t } = useTranslation();
  const learningLoad = useMemo(() => defaultLearningRepository.loadSessions(), []);
  const snapshot = useMemo(
    () => buildMiriIslandsSnapshot(learningLoad.sessions),
    [learningLoad.sessions],
  );

  const [selectedIslandId, setSelectedIslandId] = useState<MiriIslandId | null>(
    null,
  );

  const selectedEntry = selectedIslandId
    ? snapshot.islandsById[selectedIslandId]
    : null;

  return (
    <div className="mx-auto max-w-7xl space-y-5 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      {/* Compact World Map Header */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to="/profile"
              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-control)] bg-[var(--surface-card)] px-2.5 py-1 text-xs font-semibold text-[var(--text-secondary)] transition-colors hover:border-[var(--accent-blue-border)] hover:text-[var(--text-primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-blue)]"
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
              {t('islands.map.backToProfile')}
            </Link>
            <Badge variant="indigo">
              <Compass className="h-3 w-3" aria-hidden="true" />
              {t('islands.map.badge')}
            </Badge>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-[var(--text-primary)] sm:text-3xl">
            {t('islands.map.title')}
          </h1>
          <p className="max-w-3xl text-sm leading-relaxed text-[var(--text-secondary)]">
            {t('islands.map.subtitle')}
          </p>
        </div>

        {/* Honest Summary & Stage Legend */}
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <Badge variant="mint" data-testid="world-map-practiced-badge">
            {t('islands.verifiedCount', {
              practiced: snapshot.globalTotals.practicedIslandsCount,
              total: snapshot.globalTotals.verifiedIslandsCount,
            })}
          </Badge>
          <Badge variant="neutral">
            {t('islands.map.studioHonestyNote')}
          </Badge>
        </div>
      </header>

      {/* Main Cohesive Floating-Island World Canvas */}
      <MiriIslandsWorldMap
        islands={snapshot.islands}
        islandsById={snapshot.islandsById}
        selectedIslandId={selectedIslandId}
        onSelectIsland={(id) =>
          setSelectedIslandId((prev) => (prev === id ? null : id))
        }
      />

      {/* Interactive Island Inspector Panel (Escape dismissible) */}
      <MiriIslandInspector
        entry={selectedEntry}
        onClose={() => setSelectedIslandId(null)}
      />
    </div>
  );
}
