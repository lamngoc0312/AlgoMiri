import { useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { CalendarDays, Info } from 'lucide-react';
import {
  parseLocalDateKey,
  type HeatmapDayCell,
  type HeatmapIntensity,
  type StudyActivitySummary,
} from '../../domain/learning/activityStreak';
import { formatStudyDuration } from '../../domain/learning/studyTimer';
import { Badge } from '../../components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';

interface ActivityHeatmapProps {
  activity: StudyActivitySummary;
}

const INTENSITY_STYLE: Record<HeatmapIntensity, string> = {
  0: 'bg-[var(--heatmap-0)] border border-[var(--border-subtle)]/70',
  1: 'bg-[var(--heatmap-1)]',
  2: 'bg-[var(--heatmap-2)]',
  3: 'bg-[var(--heatmap-3)]',
  4: 'bg-[var(--heatmap-4)]',
};

function formatLocalizedDate(dateKey: string, language: string): string {
  const date = parseLocalDateKey(dateKey);
  return new Intl.DateTimeFormat(language === 'vi' ? 'vi-VN' : 'en-US', {
    dateStyle: 'medium',
  }).format(date);
}

function formatMonthShort(
  year: number,
  monthIndex: number,
  language: string,
): string {
  const date = new Date(year, monthIndex, 1, 12, 0, 0);
  return new Intl.DateTimeFormat(language === 'vi' ? 'vi-VN' : 'en-US', {
    month: 'short',
  }).format(date);
}

export function ActivityHeatmap({ activity }: ActivityHeatmapProps) {
  const { t, i18n } = useTranslation();
  const language = (i18n.resolvedLanguage ?? 'en').startsWith('vi') ? 'vi' : 'en';

  const defaultSelectedKey =
    activity.activeDateKeys[activity.activeDateKeys.length - 1] ??
    activity.todayDateKey;
  const [selectedDateKey, setSelectedDateKey] = useState<string>(defaultSelectedKey);
  const cellRefs = useRef<Map<string, HTMLButtonElement | null>>(new Map());

  const flatVisibleCells = useMemo(() => {
    const map = new Map<string, { weekIdx: number; dayIdx: number; cell: HeatmapDayCell }>();
    activity.weeks.forEach((week, weekIdx) => {
      week.forEach((cell, dayIdx) => {
        if (!cell.isFuture) {
          map.set(cell.dateKey, { weekIdx, dayIdx, cell });
        }
      });
    });
    return map;
  }, [activity.weeks]);

  const selectedCell: HeatmapDayCell =
    flatVisibleCells.get(selectedDateKey)?.cell ??
    flatVisibleCells.get(activity.todayDateKey)?.cell ??
    activity.weeks[activity.weeks.length - 1][0];

  const monthByWeekIndex = useMemo(() => {
    const map = new Map<number, string>();
    for (const label of activity.monthLabels) {
      map.set(
        label.weekIndex,
        formatMonthShort(label.year, label.monthIndex, language),
      );
    }
    return map;
  }, [activity.monthLabels, language]);

  const weekdayLabels = useMemo(() => {
    // Localized short labels for Mon (1), Wed (3), Fri (5)
    const fmt = new Intl.DateTimeFormat(language === 'vi' ? 'vi-VN' : 'en-US', {
      weekday: 'short',
    });
    // 2026-01-04 is a Sunday
    return [1, 3, 5].map((dayOffset) => ({
      dayIdx: dayOffset,
      label: fmt.format(new Date(2026, 0, 4 + dayOffset, 12, 0, 0)),
    }));
  }, [language]);

  const handleCellKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    weekIdx: number,
    dayIdx: number,
  ) => {
    let nextWeek = weekIdx;
    let nextDay = dayIdx;
    if (event.key === 'ArrowRight') nextWeek += 1;
    else if (event.key === 'ArrowLeft') nextWeek -= 1;
    else if (event.key === 'ArrowDown') nextDay += 1;
    else if (event.key === 'ArrowUp') nextDay -= 1;
    else return;

    if (nextDay < 0) {
      nextDay = 6;
      nextWeek -= 1;
    } else if (nextDay > 6) {
      nextDay = 0;
      nextWeek += 1;
    }

    const targetWeek = activity.weeks[nextWeek];
    const targetCell = targetWeek?.[nextDay];
    if (!targetCell || targetCell.isFuture) return;

    event.preventDefault();
    setSelectedDateKey(targetCell.dateKey);
    cellRefs.current.get(targetCell.dateKey)?.focus();
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CalendarDays
              className="h-5 w-5 text-[var(--accent-teal-text)]"
              aria-hidden="true"
            />
            <CardTitle>{t('activity.heatmap.title')}</CardTitle>
          </div>
          <Badge variant="mint" data-testid="heatmap-active-days-badge">
            {t('activity.heatmap.activeDaysSummary', {
              count: activity.totalActiveDaysInRange,
            })}
          </Badge>
        </div>
        <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
          {t('activity.heatmap.subtitle')}
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {activity.totalActiveDaysInRange === 0 && (
          <div
            role="note"
            className="flex items-start gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-subtle)] px-3.5 py-2.5 text-xs leading-relaxed text-[var(--text-secondary)]"
          >
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent-blue-link)]" aria-hidden="true" />
            <span>{t('activity.heatmap.emptyNotice')}</span>
          </div>
        )}

        {/* Horizontally scrollable container keeps 52-week grid clean on desktop and 0px page overflow on mobile */}
        <div
          className="overflow-x-auto pb-2"
          role="region"
          aria-label={t('activity.heatmap.gridAria')}
        >
          <div className="inline-flex flex-col gap-1.5 min-w-max">
            {/* Month header row */}
            <div className="flex items-center pl-9 gap-[3px]">
              {activity.weeks.map((_, weekIdx) => {
                const label = monthByWeekIndex.get(weekIdx);
                return (
                  <span
                    key={`month-${weekIdx}`}
                    className="w-3 text-[10px] font-semibold text-[var(--text-secondary)] whitespace-nowrap overflow-visible"
                  >
                    {label ?? ''}
                  </span>
                );
              })}
            </div>

            {/* Weekday labels + 52 week columns */}
            <div className="flex items-start gap-2">
              <div
                aria-hidden="true"
                className="grid grid-rows-7 gap-[3px] w-7 text-[10px] font-medium text-[var(--text-secondary)] leading-3"
              >
                {Array.from({ length: 7 }, (_, dayIdx) => {
                  const found = weekdayLabels.find((w) => w.dayIdx === dayIdx);
                  return (
                    <span
                      key={`wd-${dayIdx}`}
                      className="flex h-3 items-center justify-end pr-0.5"
                    >
                      {found?.label ?? ''}
                    </span>
                  );
                })}
              </div>

              <div
                role="grid"
                aria-label={t('activity.heatmap.gridAria')}
                className="flex gap-[3px]"
              >
                {activity.weeks.map((week, weekIdx) => (
                  <div
                    key={`week-${weekIdx}`}
                    role="row"
                    className="grid grid-rows-7 gap-[3px]"
                  >
                    {week.map((cell, dayIdx) => {
                      if (cell.isFuture) {
                        return (
                          <span
                            key={cell.dateKey}
                            aria-hidden="true"
                            className="h-3 w-3 rounded-[3px] bg-transparent"
                          />
                        );
                      }
                      const formattedDate = formatLocalizedDate(
                        cell.dateKey,
                        language,
                      );
                      const cellAria =
                        cell.eligibleSessionCount === 0
                          ? t('activity.heatmap.cellZeroAria', {
                              date: formattedDate,
                            })
                          : t('activity.heatmap.cellActiveAria', {
                              date: formattedDate,
                              count: cell.eligibleSessionCount,
                            });
                      const isSelected = selectedCell.dateKey === cell.dateKey;

                      return (
                        <button
                          key={cell.dateKey}
                          ref={(el) => {
                            cellRefs.current.set(cell.dateKey, el);
                          }}
                          type="button"
                          role="gridcell"
                          aria-label={cellAria}
                          aria-pressed={isSelected}
                          title={cellAria}
                          tabIndex={isSelected ? 0 : -1}
                          onClick={() => setSelectedDateKey(cell.dateKey)}
                          onFocus={() => setSelectedDateKey(cell.dateKey)}
                          onKeyDown={(e) => handleCellKeyDown(e, weekIdx, dayIdx)}
                          className={`h-3 w-3 rounded-[3px] transition-transform cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--accent-blue)] ${
                            INTENSITY_STYLE[cell.intensity]
                          } ${
                            isSelected
                              ? 'ring-2 ring-[var(--accent-blue)] ring-offset-1 ring-offset-[var(--surface-card)]'
                              : ''
                          }`}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Selected day live details + intensity legend */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border-subtle)] pt-3 text-xs">
          <div
            aria-live="polite"
            data-testid="heatmap-selected-day"
            className="text-[var(--text-primary)]"
          >
            <span className="font-bold">
              {formatLocalizedDate(selectedCell.dateKey, language)}
            </span>
            {' — '}
            <span className="text-[var(--text-secondary)]">
              {selectedCell.eligibleSessionCount === 0
                ? t('activity.heatmap.noEligibleOnDay')
                : t('activity.heatmap.sessionsOnDay', {
                    count: selectedCell.eligibleSessionCount,
                  })}
            </span>
            {selectedCell.eligibleSessionCount > 0 && (
              <span className="text-[var(--text-secondary)]">
                {' · '}
                {t('studyTime.sessionLabel')}{' '}
                <strong className="text-[var(--text-primary)]">
                  {formatStudyDuration(selectedCell.activeStudySeconds, t)}
                </strong>
              </span>
            )}
          </div>

          <div
            className="inline-flex items-center gap-1.5 text-[var(--text-secondary)]"
            aria-label={t('activity.heatmap.legendAria')}
          >
            <span>{t('activity.heatmap.less')}</span>
            {([0, 1, 2, 3, 4] as const).map((level) => (
              <span
                key={`legend-${level}`}
                aria-hidden="true"
                className={`inline-block h-3 w-3 rounded-[3px] ${INTENSITY_STYLE[level]}`}
              />
            ))}
            <span>{t('activity.heatmap.more')}</span>
          </div>
        </div>

        <p className="text-[11px] leading-relaxed text-[var(--text-secondary)]">
          {t('activity.heatmap.honestNote')}
        </p>
      </CardContent>
    </Card>
  );
}
