import { useTranslation } from 'react-i18next';
import {
  CheckCircle2,
  ChevronDown,
  Clock,
  Database,
  Layers,
  Lock,
} from 'lucide-react';
import type { ProblemSpec } from '../../domain/problems/types';
import { localizeDifficulty } from '../../i18n/learningLocalization';
import { Badge } from '../../components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';

interface ProblemPaneProps {
  problem: ProblemSpec;
  selectedStrategyId: string;
  onSelectStrategy: (strategyId: string) => void;
  hideStrategySelector?: boolean;
  lockedStrategyIds?: string[];
  /** Progressive disclosure: collapse full problem statement in Guided Mode so the active task stays primary. */
  defaultStatementExpanded?: boolean;
}

export function ProblemPane({
  problem,
  selectedStrategyId,
  onSelectStrategy,
  hideStrategySelector = false,
  lockedStrategyIds = [],
  defaultStatementExpanded = true,
}: ProblemPaneProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-4">
      {!hideStrategySelector && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Layers
                className="h-4 w-4 text-[var(--accent-blue-link)]"
                aria-hidden="true"
              />
              <CardTitle className="text-lg">
                {t('studio.problemPane.strategyTitle')}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div
              role="radiogroup"
              aria-label={t('studio.problemPane.strategySelector')}
              className="flex flex-col gap-2.5"
            >
              {problem.supportedStrategies.map((strategy) => {
                const isSelected = strategy.id === selectedStrategyId;
                const isLocked = lockedStrategyIds.includes(strategy.id);

                if (isLocked) {
                  return (
                    <div
                      key={strategy.id}
                      className="w-full rounded-xl border border-dashed border-[var(--border-control)] bg-[var(--surface-subtle)] p-3.5 text-left"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-bold text-[var(--text-secondary)]">
                          {t('studio.problemPane.optimizedStrategy')}
                        </span>
                        <Badge variant="neutral">
                          <Lock className="h-3 w-3" aria-hidden="true" />
                          {t('studio.problemPane.stageUnlockBadge')}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm text-[var(--text-secondary)] leading-relaxed">
                        {t('studio.problemPane.lockedHint')}
                      </p>
                    </div>
                  );
                }

                return (
                  <button
                    key={strategy.id}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => onSelectStrategy(strategy.id)}
                    className={`w-full rounded-xl border p-3.5 text-left transition-colors cursor-pointer ${
                      isSelected
                        ? 'border-[#397BDB] bg-[var(--accent-blue-soft)]/55 ring-1 ring-[#397BDB]/30'
                        : 'border-[var(--border-subtle)] bg-[var(--surface-card)] hover:border-[var(--border-control)] hover:bg-[var(--surface-elevated)]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-base font-bold text-[var(--text-primary)]">
                        {strategy.name}
                      </span>
                      {isSelected && (
                        <CheckCircle2
                          className="h-4 w-4 shrink-0 text-[var(--accent-blue-link)] mt-0.5"
                          aria-hidden="true"
                        />
                      )}
                    </div>
                    <p className="mt-1 text-sm leading-relaxed text-[var(--text-secondary)]">
                      {strategy.intuition}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-2 font-mono text-xs">
                      <span className="inline-flex items-center gap-1 rounded-md bg-[var(--surface-card)] px-2.5 py-0.5 text-[var(--text-primary)] border border-[var(--border-subtle)]">
                        <Clock
                          className="h-3.5 w-3.5 text-[var(--accent-blue-link)]"
                          aria-hidden="true"
                        />
                        {strategy.timeComplexity}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-md bg-[var(--surface-card)] px-2.5 py-0.5 text-[var(--text-primary)] border border-[var(--border-subtle)]">
                        <Database
                          className="h-3.5 w-3.5 text-[var(--accent-teal-text)]"
                          aria-hidden="true"
                        />
                        {strategy.spaceComplexity}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Progressive Disclosure for Problem Statement, Examples & Key Rules */}
      <Card>
        <details open={defaultStatementExpanded} className="group">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-6 py-4 text-sm font-bold text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] rounded-2xl">
            <span className="flex items-center gap-2">
              <span>
                {t('studio.problemPane.problemAndRules', {
                  title: problem.title,
                })}
              </span>
              <Badge variant="mint">
                {localizeDifficulty(t, problem.difficulty)}
              </Badge>
            </span>
            <ChevronDown
              className="h-4 w-4 shrink-0 text-[var(--text-secondary)] transition-transform group-open:rotate-180"
              aria-hidden="true"
            />
          </summary>

          <CardContent className="space-y-5 border-t border-[var(--border-subtle)] pt-5">
            <p className="text-base leading-relaxed text-[var(--text-primary)]">
              {problem.statement}
            </p>

            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                {t('studio.problemPane.examples')}
              </h3>
              <div className="mt-2.5 space-y-2.5">
                {problem.examples.map((ex, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl border-l-4 border-[#397BDB] bg-[var(--surface-subtle)] px-4 py-3 text-sm"
                  >
                    <p className="font-mono font-medium text-[var(--text-primary)]">
                      {ex.input}
                    </p>
                    <p className="mt-1 font-mono text-[var(--accent-teal-text)] font-semibold">
                      {t('studio.problemPane.outputPrefix', {
                        output: ex.output,
                      })}
                    </p>
                    <p className="mt-1 text-[var(--text-secondary)] leading-relaxed">
                      {ex.explanation}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                {t('studio.problemPane.keyRules')}
              </h3>
              <ul className="mt-2.5 space-y-2 text-sm text-[var(--text-secondary)]">
                {problem.constraints.map((rule) => (
                  <li key={rule} className="flex items-start gap-2.5">
                    <span
                      className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#397BDB]"
                      aria-hidden="true"
                    />
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </details>
      </Card>
    </div>
  );
}
