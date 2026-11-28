import { useTranslation } from 'react-i18next';
import { Award, HardDrive, Info, Sparkles } from 'lucide-react';
import type { LevelProgress } from '../../domain/gamification/leveling';
import { Badge } from '../../components/ui/Badge';
import { Card, CardContent } from '../../components/ui/Card';

interface XpLevelCardProps {
  levelProgress: LevelProgress;
  warningMessage?: string | null;
}

export function XpLevelCard({
  levelProgress,
  warningMessage = null,
}: XpLevelCardProps) {
  const { t } = useTranslation();
  const nextLevel = levelProgress.level + 1;

  return (
    <Card
      data-testid="profile-xp-level-card"
      className="border-[var(--border-subtle)] bg-[var(--surface-card)] shadow-xs"
    >
      <CardContent className="p-4 sm:p-5 space-y-3.5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3.5">
            <div
              aria-hidden="true"
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[var(--accent-amber-border)] bg-[var(--accent-amber-soft)] text-[var(--accent-amber-text)] shadow-xs"
            >
              <Award className="h-6 w-6" />
            </div>
            <div className="min-w-0 space-y-0.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                  {t('gamification.xpCard.title')}
                </span>
                <Badge variant="amber" data-testid="xp-level-badge">
                  <Sparkles className="h-3 w-3" aria-hidden="true" />
                  {t('gamification.levelLabel', { level: levelProgress.level })}
                </Badge>
              </div>
              <p
                data-testid="xp-total-value"
                className="font-mono text-xl sm:text-2xl font-extrabold tracking-tight text-[var(--text-primary)]"
              >
                {t('gamification.totalXpValue', { xp: levelProgress.totalXp })}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            <Badge variant="neutral">
              <HardDrive className="h-3 w-3" aria-hidden="true" />
              {t('gamification.localBadge')}
            </Badge>
          </div>
        </div>

        {/* Progress toward next level */}
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <span
              data-testid="xp-level-progress-text"
              className="font-semibold text-[var(--text-primary)]"
            >
              {t('gamification.xpCard.progressRatio', {
                current: levelProgress.xpIntoLevel,
                target: levelProgress.xpForNextLevel,
              })}
            </span>
            <span className="font-medium text-[var(--text-secondary)]">
              {t('gamification.xpCard.toNextLevel', {
                remaining: levelProgress.xpRemainingToNextLevel,
                nextLevel,
              })}
            </span>
          </div>

          <div
            role="progressbar"
            aria-label={t('gamification.xpCard.progressAria', {
              level: levelProgress.level,
              nextLevel,
            })}
            aria-valuenow={levelProgress.xpIntoLevel}
            aria-valuemin={0}
            aria-valuemax={levelProgress.xpForNextLevel}
            className="h-2.5 w-full overflow-hidden rounded-full bg-[var(--surface-subtle)] border border-[var(--border-subtle)]"
          >
            <div
              data-testid="xp-progress-bar-fill"
              className="h-full rounded-full bg-gradient-to-r from-[#397BDB] via-[#15A897] to-[#F2B84B] transition-[width] duration-300 motion-reduce:transition-none"
              style={{ width: `${levelProgress.progressPercent}%` }}
            />
          </div>
        </div>

        {/* Concise honest policy & local-storage note */}
        <p className="flex items-start gap-2 text-xs leading-relaxed text-[var(--text-secondary)]">
          <Info
            className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--accent-sky-text)]"
            aria-hidden="true"
          />
          <span>{t('gamification.xpCard.howItWorks')}</span>
        </p>

        {warningMessage && (
          <p
            role="status"
            className="rounded-lg border border-[var(--accent-amber-border)] bg-[var(--accent-amber-soft)]/50 px-3 py-2 text-xs text-[var(--text-primary)]"
          >
            {warningMessage}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
