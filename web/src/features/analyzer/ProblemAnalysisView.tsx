import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  Database,
  HelpCircle,
  Layers,
  ListChecks,
  MessageCircle,
  RotateCcw,
  Sparkles,
  WifiOff,
} from 'lucide-react';
import type { AnalyzeResponseDto } from '../../services/aiClient';
import { getVerifiedLibraryItems } from '../../domain/problems/libraryCatalog';
import {
  buildConceptualSteps,
  splitWalkthroughBeats,
} from './conceptualStepper';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';

type ReaderTab = 'walkthrough' | 'approaches' | 'details';

interface ProblemAnalysisViewProps {
  result: AnalyzeResponseDto;
  selectedStrategyName: string | null;
  isStale?: boolean;
  onReanalyze?: () => void;
  onSelectStrategy: (strategyName: string) => void;
  onOpenTutor?: () => void;
}

export function ProblemAnalysisView({
  result,
  selectedStrategyName,
  isStale = false,
  onReanalyze,
  onSelectStrategy,
  onOpenTutor,
}: ProblemAnalysisViewProps) {
  const { t, i18n } = useTranslation();
  const isEnglish = (i18n.resolvedLanguage ?? 'en').startsWith('en');
  const { analysis, verified_match: match, mode } = result;
  const isOffline = mode === 'offline-demo';
  const verifiedStudios = getVerifiedLibraryItems();

  const conceptualSteps = useMemo(
    () => buildConceptualSteps(analysis),
    [analysis],
  );
  const walkthroughBeats = useMemo(
    () => splitWalkthroughBeats(analysis.worked_example.walkthrough),
    [analysis.worked_example.walkthrough],
  );

  const [readerTab, setReaderTab] = useState<ReaderTab>('walkthrough');
  const [activeStepIdx, setActiveStepIdx] = useState(0);
  const [activeBeatIdx, setActiveBeatIdx] = useState(0);
  const readerTabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const stepTabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const readerTabOrder: ReaderTab[] = ['walkthrough', 'approaches', 'details'];
  const handleReaderTabKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    idx: number,
  ) => {
    let nextIdx: number | null = null;
    if (event.key === 'ArrowRight') nextIdx = (idx + 1) % readerTabOrder.length;
    else if (event.key === 'ArrowLeft')
      nextIdx = (idx - 1 + readerTabOrder.length) % readerTabOrder.length;
    else if (event.key === 'Home') nextIdx = 0;
    else if (event.key === 'End') nextIdx = readerTabOrder.length - 1;
    if (nextIdx === null) return;

    event.preventDefault();
    setReaderTab(readerTabOrder[nextIdx]);
    readerTabRefs.current[nextIdx]?.focus();
  };

  const handleStepTabKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    idx: number,
  ) => {
    const count = conceptualSteps.length;
    if (count === 0) return;
    let nextIdx: number | null = null;
    if (event.key === 'ArrowRight') nextIdx = (idx + 1) % count;
    else if (event.key === 'ArrowLeft') nextIdx = (idx - 1 + count) % count;
    else if (event.key === 'Home') nextIdx = 0;
    else if (event.key === 'End') nextIdx = count - 1;
    if (nextIdx === null) return;

    event.preventDefault();
    setActiveStepIdx(nextIdx);
    stepTabRefs.current[nextIdx]?.focus();
  };

  // Reset interactive state cleanly whenever a new analysis loads
  useEffect(() => {
    setReaderTab('walkthrough');
    setActiveStepIdx(0);
    setActiveBeatIdx(0);
  }, [analysis.title, analysis.plain_language_summary]);

  const activeStep = conceptualSteps[activeStepIdx] ?? conceptualSteps[0];
  const activeBeat = walkthroughBeats[activeBeatIdx] ?? walkthroughBeats[0] ?? '';

  const activeStrategy =
    analysis.candidate_strategies.find(
      (s) => s.name === selectedStrategyName,
    ) ?? analysis.candidate_strategies[0];

  const guidingQuestion =
    analysis.clarifications_or_ambiguities[0] ??
    (activeStrategy
      ? t('aiAnalysis.strategyQuestion', { name: activeStrategy.name })
      : t('aiAnalysis.fallbackQuestion'));

  // Compact, honest Offline AI state — never render a fake generic analysis page
  if (isOffline) {
    return (
      <div
        aria-label={t('aiAnalysis.offlineLabel')}
        className={`space-y-4 transition-opacity ${isStale ? 'opacity-85' : ''}`}
      >
        {isStale && (
          <div
            role="alert"
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#F2B84B] bg-[var(--accent-amber-soft)] px-5 py-3.5 text-sm text-[var(--accent-amber-text)]"
          >
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="font-semibold">
                {t('aiAnalysis.staleTitle')}
              </span>
            </div>
            {onReanalyze && (
              <Button variant="primary" size="sm" onClick={onReanalyze}>
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                {t('aiAnalysis.reanalyze')}
              </Button>
            )}
          </div>
        )}

        <Card className="p-6 sm:p-8 space-y-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="demo">
                <WifiOff className="h-3.5 w-3.5" aria-hidden="true" />
                {t('aiAnalysis.offlineBadge')}
              </Badge>
              {match.status === 'verified' && (
                <Badge variant="mint">
                  <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                  {t('aiAnalysis.verifiedBadge')}
                </Badge>
              )}
            </div>
            <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[var(--text-primary)]">
              {t('aiAnalysis.offlineTitle')}
            </h3>
            <p className="text-base leading-relaxed text-[var(--text-secondary)]">
              {t('aiAnalysis.offlineDescription')}
            </p>
          </div>

          {match.studio_path ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--accent-teal-border)] bg-[var(--accent-teal-soft)]/60 px-5 py-4">
              <p className="text-sm font-medium text-[var(--text-primary)]">
                {match.status === 'verified'
                  ? t('aiAnalysis.verifiedBadge')
                  : match.status === 'ambiguous'
                    ? t('aiAnalysis.ambiguousBadge')
                    : t('aiAnalysis.conceptualBadge')}
              </p>
              <Link
                to={match.studio_path}
                className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-xl bg-[var(--accent-teal-solid)] px-4 text-sm font-semibold text-white transition-colors hover:bg-[var(--accent-teal-hover)]"
              >
                {match.status === 'verified'
                  ? t('aiAnalysis.openVerified', { title: match.matched_problem_title ?? '' })
                  : t('aiAnalysis.inspectCurated', { title: match.matched_problem_title ?? '' })}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          ) : (
            <div className="space-y-3 border-t border-[var(--border-subtle)] pt-5">
              <p className="text-sm font-semibold text-[var(--text-primary)]">
                {t('aiAnalysis.tryVerified')}
              </p>
              <div className="flex flex-wrap gap-2.5">
                {verifiedStudios.map((studio) => (
                  <Link
                    key={studio.id}
                    to={studio.studioPath ?? `/studio/${studio.id}`}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-subtle)] px-4 py-2.5 text-sm font-semibold text-[var(--text-primary)] transition-colors hover:border-[#397BDB] hover:bg-[var(--accent-blue-soft)]/60 hover:text-[var(--accent-blue-text)]"
                  >
                    {studio.title}
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>
    );
  }

  // Interactive-First Pin-UI Reader Card with 3-Tab Progressive Disclosure
  return (
    <div
      aria-label={t('aiAnalysis.structuredLabel')}
      className={`space-y-5 transition-opacity ${isStale ? 'opacity-85' : ''}`}
    >
      {/* Stale Analysis Alert */}
      {isStale && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#F2B84B] bg-[var(--accent-amber-soft)] px-5 py-4 text-sm text-[var(--accent-amber-text)]"
        >
          <div className="flex items-start gap-2.5">
            <AlertTriangle
              className="h-5 w-5 shrink-0 mt-0.5"
              aria-hidden="true"
            />
            <div>
              <p className="font-bold">
                {t('aiAnalysis.staleTitle')}
              </p>
              <p className="mt-0.5 text-sm text-[var(--text-secondary)]">
                {t('aiAnalysis.staleDescription')}
              </p>
            </div>
          </div>
          {onReanalyze && (
            <Button variant="primary" size="sm" onClick={onReanalyze}>
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              {t('aiAnalysis.reanalyze')}
            </Button>
          )}
        </div>
      )}

      <Card className="overflow-hidden">
        {/* Compact Reader Header + 3-Tab Progressive Navigation */}
        <div className="border-b border-[var(--border-subtle)] bg-[var(--surface-card)] p-6 sm:p-8 pb-5 space-y-5">
          <div
            role="status"
            className="flex flex-wrap items-center justify-between gap-2 text-xs"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 font-semibold text-[var(--accent-blue-text)]">
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                {t('aiAnalysis.generatedBadge')}
              </span>
              <span className="text-[#C5CBE3]" aria-hidden="true">
                ·
              </span>
              {match.status === 'verified' && (
                <span className="inline-flex items-center gap-1 font-semibold text-[var(--accent-teal-text)]">
                  <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                  {t('aiAnalysis.verifiedBadge')}
                </span>
              )}
              {match.status === 'ambiguous' && (
                <span className="inline-flex items-center gap-1 font-semibold text-[var(--accent-amber-text)]">
                  <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
                  {t('aiAnalysis.ambiguousBadge')}
                </span>
              )}
              {match.status === 'conceptual_only' && (
                <span className="font-medium text-[var(--text-secondary)]">
                  {t('aiAnalysis.conceptualBadge')}
                </span>
              )}
            </div>
            <span className="font-medium text-[var(--text-secondary)]">
              {analysis.inferred_problem_type}
            </span>
          </div>

          <div className="space-y-2">
            <h3 className="text-2xl sm:text-[28px] font-extrabold tracking-tight text-[var(--text-primary)] leading-tight">
              {analysis.title}
            </h3>
            <p className="text-base leading-[1.7] text-[var(--text-primary)]">
              {analysis.plain_language_summary}
            </p>
          </div>

          {/* Pin-UI-Inspired Segmented Reader Tabs with WAI-ARIA roving keyboard nav */}
          <div
            role="tablist"
            aria-label={t('aiAnalysis.sections')}
            className="flex flex-wrap sm:inline-flex w-full sm:w-auto gap-1 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-subtle)] p-1"
          >
            <button
              ref={(el) => {
                readerTabRefs.current[0] = el;
              }}
              id="analysis-tab-walkthrough"
              type="button"
              role="tab"
              aria-selected={readerTab === 'walkthrough'}
              aria-controls="analysis-panel-walkthrough"
              tabIndex={readerTab === 'walkthrough' ? 0 : -1}
              onClick={() => setReaderTab('walkthrough')}
              onKeyDown={(e) => handleReaderTabKeyDown(e, 0)}
              className={`inline-flex flex-1 sm:flex-none items-center justify-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors cursor-pointer ${
                readerTab === 'walkthrough'
                  ? 'bg-[var(--surface-card)] text-[var(--text-primary)] shadow-xs ring-1 ring-[var(--border-subtle)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Sparkles
                className={`h-4 w-4 ${readerTab === 'walkthrough' ? 'text-[var(--accent-blue-link)]' : ''}`}
                aria-hidden="true"
              />
              {t('aiAnalysis.walkthrough')}
            </button>
            <button
              ref={(el) => {
                readerTabRefs.current[1] = el;
              }}
              id="analysis-tab-approaches"
              type="button"
              role="tab"
              aria-selected={readerTab === 'approaches'}
              aria-controls="analysis-panel-approaches"
              tabIndex={readerTab === 'approaches' ? 0 : -1}
              onClick={() => setReaderTab('approaches')}
              onKeyDown={(e) => handleReaderTabKeyDown(e, 1)}
              className={`inline-flex flex-1 sm:flex-none items-center justify-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors cursor-pointer ${
                readerTab === 'approaches'
                  ? 'bg-[var(--surface-card)] text-[var(--text-primary)] shadow-xs ring-1 ring-[var(--border-subtle)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Layers
                className={`h-4 w-4 ${readerTab === 'approaches' ? 'text-[var(--accent-teal-text)]' : ''}`}
                aria-hidden="true"
              />
              {t('aiAnalysis.approaches', { count: analysis.candidate_strategies.length })}
            </button>
            <button
              ref={(el) => {
                readerTabRefs.current[2] = el;
              }}
              id="analysis-tab-details"
              type="button"
              role="tab"
              aria-selected={readerTab === 'details'}
              aria-controls="analysis-panel-details"
              tabIndex={readerTab === 'details' ? 0 : -1}
              onClick={() => setReaderTab('details')}
              onKeyDown={(e) => handleReaderTabKeyDown(e, 2)}
              className={`inline-flex flex-1 sm:flex-none items-center justify-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors cursor-pointer ${
                readerTab === 'details'
                  ? 'bg-[var(--surface-card)] text-[var(--text-primary)] shadow-xs ring-1 ring-[var(--border-subtle)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <ListChecks
                className={`h-4 w-4 ${readerTab === 'details' ? 'text-[var(--accent-amber-text)]' : ''}`}
                aria-hidden="true"
              />
              {t('aiAnalysis.details')}
            </button>
          </div>
        </div>

        {/* TAB 1: Focused Interactive Walkthrough (Default Initial View) */}
        {readerTab === 'walkthrough' && (
          <div
            id="analysis-panel-walkthrough"
            role="tabpanel"
            aria-labelledby="analysis-tab-walkthrough"
            className="p-6 sm:p-8 space-y-7"
          >
            {/* Clear Input -> Output Example with Interactive Beats */}
            <div className="rounded-2xl bg-[var(--surface-subtle)] border border-[var(--border-subtle)] p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                  {t('aiAnalysis.workedExample')}
                </span>
                {walkthroughBeats.length > 1 && (
                  <div className="inline-flex items-center gap-1.5">
                    <button
                      type="button"
                      aria-label={t('aiAnalysis.previousExample')}
                      disabled={activeBeatIdx === 0}
                      onClick={() =>
                        setActiveBeatIdx((idx) => Math.max(0, idx - 1))
                      }
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-card)] text-[var(--text-primary)] hover:border-[#397BDB] disabled:opacity-40 cursor-pointer"
                    >
                      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                    </button>
                    <span className="min-w-[48px] text-center font-mono text-xs font-semibold text-[var(--text-secondary)]">
                      {activeBeatIdx + 1} / {walkthroughBeats.length}
                    </span>
                    <button
                      type="button"
                      aria-label={t('aiAnalysis.nextExample')}
                      disabled={activeBeatIdx >= walkthroughBeats.length - 1}
                      onClick={() =>
                        setActiveBeatIdx((idx) =>
                          Math.min(walkthroughBeats.length - 1, idx + 1),
                        )
                      }
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-card)] text-[var(--text-primary)] hover:border-[#397BDB] disabled:opacity-40 cursor-pointer"
                    >
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                )}
              </div>

              <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
                <div className="rounded-xl bg-[var(--surface-card)] border border-[var(--border-subtle)] px-4 py-3">
                  <span className="block text-xs font-semibold text-[var(--text-secondary)]">
                    {t('aiAnalysis.input')}
                  </span>
                  <p className="mt-1 font-mono text-sm font-semibold text-[var(--text-primary)] break-words">
                    {analysis.worked_example.input_summary}
                  </p>
                </div>
                <ArrowRight
                  className="hidden sm:block h-5 w-5 text-[var(--accent-blue-link)]"
                  aria-hidden="true"
                />
                <div className="rounded-xl bg-[var(--accent-teal-soft)]/60 border border-[var(--accent-teal-border)] px-4 py-3">
                  <span className="block text-xs font-semibold text-[var(--accent-teal-text)]">
                    {t('aiAnalysis.output')}
                  </span>
                  <p className="mt-1 font-mono text-sm font-bold text-[var(--accent-teal-deep)] break-words">
                    {analysis.worked_example.output_summary}
                  </p>
                </div>
              </div>

              {activeBeat && (
                <p
                  aria-live="polite"
                  className="rounded-xl bg-[var(--surface-card)] border border-[var(--border-subtle)] px-4 py-3.5 text-base leading-relaxed text-[var(--text-primary)]"
                >
                  {activeBeat}
                </p>
              )}
            </div>

            {/* One-Step-At-A-Time Conceptual Reasoning Stepper */}
            {activeStep && (
              <div
                aria-label={t('aiAnalysis.reasoningSteps')}
                className="space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h4 className="text-lg font-bold tracking-tight text-[var(--text-primary)]">
                      {t('aiAnalysis.logic')}
                    </h4>
                    <p className="text-sm text-[var(--text-secondary)]">
                      {t('aiAnalysis.stepProgress', { current: activeStep.stepNumber, total: conceptualSteps.length })}
                    </p>
                  </div>

                  <div
                    role="tablist"
                    aria-label={t('aiAnalysis.reasoningSteps')}
                    className="inline-flex flex-wrap items-center gap-1.5"
                  >
                    {conceptualSteps.map((step, idx) => {
                      const isActive = idx === activeStepIdx;
                      const isVisited = idx < activeStepIdx;
                      return (
                        <button
                          key={step.id}
                          ref={(el) => {
                            stepTabRefs.current[idx] = el;
                          }}
                          id={`conceptual-step-tab-${step.id}`}
                          type="button"
                          role="tab"
                          aria-selected={isActive}
                          aria-controls="conceptual-step-panel"
                          tabIndex={isActive ? 0 : -1}
                          onClick={() => setActiveStepIdx(idx)}
                          onKeyDown={(e) => handleStepTabKeyDown(e, idx)}
                          className={`h-8 min-w-[32px] rounded-lg px-2.5 font-mono text-xs font-bold transition-colors cursor-pointer ${
                            isActive
                              ? 'bg-[var(--accent-blue-solid)] text-white'
                              : isVisited
                                ? 'bg-[var(--accent-blue-soft)] text-[var(--accent-blue-text)] hover:bg-[var(--accent-blue-soft-hover)]'
                                : 'bg-[var(--surface-elevated)] text-[var(--text-secondary)] hover:bg-[var(--surface-elevated)]'
                          }`}
                        >
                          {step.stepNumber}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div
                  id="conceptual-step-panel"
                  role="tabpanel"
                  aria-labelledby={`conceptual-step-tab-${activeStep.id}`}
                  aria-live="polite"
                  className="rounded-2xl border border-[var(--accent-blue-border)] bg-[var(--surface-subtle)] p-5 sm:p-6 space-y-2.5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-2.5 text-base sm:text-lg font-bold text-[var(--text-primary)]">
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[var(--accent-blue-solid)] font-mono text-xs font-bold text-white">
                        {activeStep.stepNumber}
                      </span>
                      {activeStep.title}
                    </span>
                    {activeStep.dependsOn.length > 0 && (
                      <span className="text-xs font-medium text-[var(--accent-blue-text)]">
                        {t('aiAnalysis.buildsOn', { dependencies: activeStep.dependsOn.join(', ') })}
                      </span>
                    )}
                  </div>
                  <p className="text-base leading-[1.7] text-[var(--text-primary)] pl-9">
                    {activeStep.goal}
                  </p>
                </div>

                {/* One Primary Next Action Row */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={activeStepIdx === 0}
                    onClick={() => setActiveStepIdx((i) => Math.max(0, i - 1))}
                  >
                    <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                    {t('aiAnalysis.previous')}
                  </Button>

                  <div className="flex flex-wrap items-center gap-2.5">
                    {match.studio_path && (
                      <Link
                        to={match.studio_path}
                        className={`inline-flex h-10 shrink-0 items-center gap-2 rounded-xl px-4 text-sm font-semibold transition-colors ${
                          match.status === 'verified'
                            ? 'bg-[var(--accent-teal-solid)] text-white hover:bg-[var(--accent-teal-hover)]'
                            : 'border border-[#F2B84B] bg-[var(--accent-amber-soft)] text-[var(--accent-amber-text)] hover:bg-[var(--accent-amber-soft)]'
                        }`}
                      >
                        {match.status === 'verified'
                          ? t('aiAnalysis.openVerified', { title: match.matched_problem_title ?? '' })
                          : t('aiAnalysis.inspectCurated', { title: match.matched_problem_title ?? '' })}
                        <ArrowRight className="h-4 w-4" aria-hidden="true" />
                      </Link>
                    )}

                    {activeStepIdx < conceptualSteps.length - 1 ? (
                      <Button
                        type="button"
                        variant="primary"
                        size="md"
                        onClick={() =>
                          setActiveStepIdx((i) =>
                            Math.min(conceptualSteps.length - 1, i + 1),
                          )
                        }
                      >
                        {t('aiAnalysis.next')}
                        <ArrowRight className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    ) : !match.studio_path && onOpenTutor ? (
                      <Button
                        type="button"
                        variant="primary"
                        size="md"
                        onClick={onOpenTutor}
                      >
                        <MessageCircle className="h-4 w-4" aria-hidden="true" />
                        {t('aiAnalysis.askTutor')}
                      </Button>
                    ) : null}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Compact Selectable Approaches & Complexity */}
        {readerTab === 'approaches' && activeStrategy && (
          <div
            id="analysis-panel-approaches"
            role="tabpanel"
            aria-labelledby="analysis-tab-approaches"
            className="p-6 sm:p-8 space-y-5"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-[var(--text-secondary)]">
                {t('aiAnalysis.selectApproach')}
              </p>
              <div
                role="group"
                aria-label={t('aiAnalysis.selectableStrategies')}
                className="flex flex-wrap gap-2"
              >
                {analysis.candidate_strategies.map((strat) => {
                  const isSelected = activeStrategy.name === strat.name;
                  return (
                    <button
                      key={strat.name}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => onSelectStrategy(strat.name)}
                      className={`rounded-xl px-4 py-2 text-sm font-semibold transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-[var(--accent-blue-solid)] text-white'
                          : 'border border-[var(--border-subtle)] bg-[var(--surface-subtle)] text-[var(--text-primary)] hover:border-[#397BDB]'
                      }`}
                    >
                      {strat.name}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-subtle)] p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-bold text-[var(--accent-blue-text)]">
                  {activeStrategy.technique}
                </span>
                <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
                  <span className="inline-flex items-center gap-1 rounded-md bg-[var(--surface-card)] px-2.5 py-1 text-[var(--text-primary)] border border-[var(--border-subtle)]">
                    <Clock
                      className="h-3.5 w-3.5 text-[var(--accent-blue-link)]"
                      aria-hidden="true"
                    />
                    {t('aiAnalysis.time', { value: activeStrategy.time_complexity })}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-md bg-[var(--surface-card)] px-2.5 py-1 text-[var(--text-primary)] border border-[var(--border-subtle)]">
                    <Database
                      className="h-3.5 w-3.5 text-[var(--accent-teal-text)]"
                      aria-hidden="true"
                    />
                    {t('aiAnalysis.space', { value: activeStrategy.space_complexity })}
                  </span>
                </div>
              </div>

              <p className="text-base leading-relaxed text-[var(--text-primary)]">
                {activeStrategy.intuition}
              </p>
              <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
                {activeStrategy.why_it_applies}
              </p>

              <div className="grid gap-3 border-t border-[var(--border-subtle)] pt-4 text-sm sm:grid-cols-2">
                <div>
                  <span className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                    {t('aiAnalysis.assumptions')}
                  </span>
                  <p className="mt-1 text-[var(--text-primary)]">
                    {activeStrategy.complexity_assumptions}
                  </p>
                </div>
                <div>
                  <span className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                    {t('aiAnalysis.limitations')}
                  </span>
                  <p className="mt-1 text-[var(--text-secondary)]">
                    {activeStrategy.limitations}
                  </p>
                </div>
              </div>
            </div>

            {onOpenTutor && (
              <div className="flex justify-end">
                <Button variant="primary" size="md" onClick={onOpenTutor}>
                  <MessageCircle className="h-4 w-4" aria-hidden="true" />
                  {t('aiAnalysis.discuss', { name: activeStrategy.name })}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: Constraints, Edge Cases, Guiding Question & Prerequisites */}
        {readerTab === 'details' && (
          <div
            id="analysis-panel-details"
            role="tabpanel"
            aria-labelledby="analysis-tab-details"
            className="p-6 sm:p-8 space-y-6 text-sm"
          >
            <div className="rounded-xl border-l-4 border-[#397BDB] bg-[var(--surface-subtle)] px-5 py-4 space-y-1">
              <p className="flex items-center gap-2 text-sm font-bold text-[var(--accent-blue-text)]">
                <HelpCircle className="h-4 w-4" aria-hidden="true" />
                {t('aiAnalysis.checkIntuition')}
              </p>
              <p className="text-base leading-relaxed text-[var(--text-primary)]">
                {guidingQuestion}
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                  {t('aiAnalysis.inputs')}
                </h4>
                <ul className="space-y-1.5 text-sm text-[var(--text-primary)]">
                  {analysis.inputs.map((inp) => (
                    <li key={inp}>• {inp}</li>
                  ))}
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                  {t('aiAnalysis.outputs')}
                </h4>
                <ul className="space-y-1.5 text-sm text-[var(--text-primary)]">
                  {analysis.outputs.map((out) => (
                    <li key={out}>• {out}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                  {t('aiAnalysis.constraints')}
                </h4>
                <ul className="space-y-1.5 text-sm text-[var(--text-primary)]">
                  {analysis.constraints_and_assumptions.map((c) => (
                    <li key={c}>• {c}</li>
                  ))}
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                  {t('aiAnalysis.edgeCases')}
                </h4>
                <ul className="space-y-1.5 text-sm text-[var(--text-primary)]">
                  {analysis.edge_cases.map((e) => (
                    <li key={e}>• {e}</li>
                  ))}
                </ul>
              </div>
            </div>

            {analysis.prerequisite_concepts.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 border-t border-[var(--border-subtle)] pt-4">
                <span className="text-xs font-bold text-[var(--text-secondary)]">
                  {t('aiAnalysis.prerequisites')}
                </span>
                {analysis.prerequisite_concepts.map((concept) => (
                  <Badge key={concept} variant="neutral">
                    {concept}
                  </Badge>
                ))}
              </div>
            )}

            <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-subtle)] p-4 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                  {t('aiAnalysis.matchingSummaryTitle')}
                </h4>
                <span className="text-xs font-semibold text-[var(--text-primary)]">
                  {match.status === 'verified'
                    ? t('aiAnalysis.verifiedBadge')
                    : match.status === 'ambiguous'
                      ? t('aiAnalysis.ambiguousBadge')
                      : t('aiAnalysis.conceptualBadge')}
                </span>
              </div>
              <p className="text-sm leading-relaxed text-[var(--text-primary)]">
                {t(`aiAnalysis.matchingStatusSummary.${match.status}`, {
                  title: match.matched_problem_title ?? '',
                })}
              </p>
              {/* Backend compatibility_checks strings are currently English-only; render them only in English to avoid mixed-language UI or brittle string replacement. */}
              {isEnglish && match.compatibility_checks.length > 0 && (
                <div className="space-y-1 pt-1">
                  <span className="block text-xs font-semibold text-[var(--text-secondary)]">
                    {t('aiAnalysis.matchingChecksLabel')}
                  </span>
                  <ul className="space-y-1 text-xs text-[var(--text-secondary)]">
                    {match.compatibility_checks.map((check) => (
                      <li key={check}>• {check}</li>
                    ))}
                  </ul>
                </div>
              )}
              <p className="text-xs text-[var(--text-secondary)] pt-1 border-t border-[var(--border-subtle)]">
                {t('aiAnalysis.recognitionLimitation')}
              </p>
            </div>

            <p className="text-xs text-[var(--text-secondary)]">
              {analysis.confidence_notes}
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
