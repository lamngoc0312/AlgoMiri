import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowRight,
  Layers,
  RotateCcw,
} from 'lucide-react';
import {
  getAiGuidedProblemById,
  getVerifiedLibraryItems,
} from '../domain/problems/libraryCatalog';
import {
  AiClientError,
  analyzeProblem,
  type AnalyzeResponseDto,
} from '../services/aiClient';
import { formatAiErrorMessage } from '../services/aiErrorMessages';
import { ProblemComposer } from '../features/composer/ProblemComposer';
import { ProblemAnalysisView } from '../features/analyzer/ProblemAnalysisView';
import { SaveAiHistoryPanel } from '../features/analyzer/SaveAiHistoryPanel';
import { AiTutorPanel } from '../features/analyzer/AiTutorPanel';
import { getTopicVisualStyle } from '../styles/topicColors';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { DEFAULT_LANGUAGE, isSupportedLanguage, type SupportedLanguage } from '../i18n';
import { defaultAiProblemHistoryRepository } from '../services/aiProblemHistoryRepository';

/**
 * Strict curated shortcut matcher for the secondary "Open Curated Studio" action.
 * Rejects incompatible variants (3Sum, Two Sum II, counting pairs, Remove Invalid
 * Parentheses, wildcard '*', negative or unknown-sign Split Array) so arbitrary
 * pasted problems are analyzed conceptually instead of misrouted.
 */
function matchCuratedStudioRoute(text: string): string | null {
  const raw = text.trim().toLowerCase();

  if (
    /split\s+array\s+largest\s+sum|minimiz\w+\s+the\s+(largest|maximum)\s+(subarray\s+)?sum/.test(
      raw,
    )
  ) {
    const rawForNegativeCheck = raw.replace(
      /\b(?:non[-\s]?negative|no\s+negative|not\s+negative)\b/g,
      '',
    );
    const allowsNegatives =
      /\bnegative\s+(numbers?|integers?|values?)\b|may\s+(?:contain|include|have|be)\s+negative|can\s+(?:contain|include|have)\s+negative/.test(
        rawForNegativeCheck,
      );
    const hasNonNegative =
      /\bnon[-\s]?negative\b|\bpositive\s+(integers?|numbers?|values?)\b|>=\s*0/.test(
        raw,
      );
    if (!allowsNegatives && hasNonNegative) {
      return '/studio/split-array-largest-sum';
    }
    return null;
  }

  if (/valid\s+parenthes|balanced\s+(brackets?|parenthes)/.test(raw)) {
    const incompatible =
      /remove\s+invalid|longest\s+valid|generate|minimum\s+(removals?|insertions?)|wildcard|\*/.test(
        raw,
      );
    if (!incompatible) {
      return '/studio/valid-parentheses';
    }
    return null;
  }

  const hasTwoSumPair =
    /(two|pair).{0,50}(indices|index).{0,60}(sum|add\s+up)\s+to/.test(raw) ||
    (/\btwo\s*[- ]?sum\b/.test(raw) && /\bindices\b/.test(raw));
  if (hasTwoSumPair) {
    const incompatible =
      /\b(3sum|three\s+sum|4sum|four\s+sum|two\s+sum\s+ii|1-indexed|sorted|subarray\s+sum|count|how\s+many|all\s+pairs|triplets)\b/.test(
        raw,
      );
    if (!incompatible) {
      return '/studio/two-sum';
    }
  }

  return null;
}

export function LandingPage() {
  const { t, i18n } = useTranslation();
  const language: SupportedLanguage = isSupportedLanguage(i18n.resolvedLanguage)
    ? i18n.resolvedLanguage
    : DEFAULT_LANGUAGE;
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const prefillId = searchParams.get('prefill');
  const prefillProblem = prefillId ? getAiGuidedProblemById(prefillId) : undefined;
  const historyRecordId = searchParams.get('historyRecord');
  const historyRecord = historyRecordId
    ? defaultAiProblemHistoryRepository
        .load()
        .records.find((record) => record.id === historyRecordId)
    : undefined;

  const [problemInput, setProblemInput] = useState(
    () => prefillProblem?.originalPrompt ?? historyRecord?.problemStatement ?? '',
  );
  const [feedback, setFeedback] = useState<{
    type: 'empty' | 'unsupported' | 'error';
    message: string;
    canRetry?: boolean;
  } | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] =
    useState<AnalyzeResponseDto | null>(null);
  const [analyzedStatement, setAnalyzedStatement] = useState<string | null>(
    null,
  );
  const [analysisLocale, setAnalysisLocale] = useState<SupportedLanguage | null>(null);
  const [analysisRevision, setAnalysisRevision] = useState(0);
  const [historySaveState, setHistorySaveState] = useState<
    'idle' | 'saving' | 'saved' | 'error'
  >('idle');
  const [selectedStrategyName, setSelectedStrategyName] = useState<
    string | null
  >(null);
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<
    'analysis' | 'tutor'
  >('analysis');

  const analyzeSeqRef = useRef(0);
  const analyzeAbortRef = useRef<AbortController | null>(null);
  const workspaceTabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const previousLanguageRef = useRef(language);

  const handleWorkspaceTabKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    idx: number,
  ) => {
    const order: Array<'analysis' | 'tutor'> = ['analysis', 'tutor'];
    let nextIdx: number | null = null;
    if (event.key === 'ArrowRight') nextIdx = (idx + 1) % order.length;
    else if (event.key === 'ArrowLeft')
      nextIdx = (idx - 1 + order.length) % order.length;
    else if (event.key === 'Home') nextIdx = 0;
    else if (event.key === 'End') nextIdx = order.length - 1;
    if (nextIdx === null) return;

    event.preventDefault();
    setActiveWorkspaceTab(order[nextIdx]);
    workspaceTabRefs.current[nextIdx]?.focus();
  };

  useEffect(() => {
    if (prefillProblem?.originalPrompt) {
      setProblemInput(prefillProblem.originalPrompt);
      setFeedback(null);
    } else if (historyRecord?.problemStatement) {
      setProblemInput(historyRecord.problemStatement);
      setFeedback(null);
    }
  }, [historyRecord?.problemStatement, prefillProblem]);

  useEffect(() => {
    return () => {
      analyzeSeqRef.current += 1;
      analyzeAbortRef.current?.abort();
      analyzeAbortRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (previousLanguageRef.current === language) return;
    previousLanguageRef.current = language;
    analyzeSeqRef.current += 1;
    analyzeAbortRef.current?.abort();
    analyzeAbortRef.current = null;
    setAnalyzing(false);
  }, [language]);

  const isAnalysisStale = Boolean(
    analysisResult &&
      analyzedStatement !== null &&
      problemInput.trim() !== analyzedStatement,
  );
  const isAnalysisLocaleMismatch = Boolean(
    analysisResult && analysisLocale && analysisLocale !== language,
  );

  const runAiAnalysis = async (overrideText?: string) => {
    const trimmed = (overrideText ?? problemInput).trim();
    if (trimmed.length < 10) {
      setFeedback({
        type: 'empty',
        message: t('landing.validation.minimumLength'),
      });
      return;
    }

    analyzeAbortRef.current?.abort();
    const controller = new AbortController();
    analyzeAbortRef.current = controller;
    const requestSeq = analyzeSeqRef.current + 1;
    analyzeSeqRef.current = requestSeq;
    const requestLocale = language;

    setAnalyzing(true);
    setFeedback(null);

    try {
      const response = await analyzeProblem(trimmed, {
        signal: controller.signal,
        locale: requestLocale,
      });

      if (analyzeSeqRef.current !== requestSeq) {
        return;
      }

      setAnalysisResult(response);
      setAnalyzedStatement(trimmed);
      setAnalysisLocale(requestLocale);
      setAnalysisRevision((rev) => rev + 1);
      setHistorySaveState('idle');
      setActiveWorkspaceTab('analysis');
      setSelectedStrategyName(
        response.analysis.candidate_strategies[0]?.name ?? null,
      );
    } catch (err) {
      if (analyzeSeqRef.current !== requestSeq) {
        return;
      }
      if (err instanceof AiClientError && err.kind === 'aborted') {
        return;
      }
      const message = formatAiErrorMessage(err, t, {
        fallbackKey: 'landing.validation.analysisFailed',
        suggestedWaitKey: 'landing.validation.suggestedWait',
      });
      setFeedback({
        type: 'error',
        message,
        canRetry: true,
      });
    } finally {
      if (analyzeSeqRef.current === requestSeq) {
        setAnalyzing(false);
      }
    }
  };

  const handleOpenInStudioSubmit = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = problemInput.trim();

    if (!trimmed) {
      setFeedback({
        type: 'empty',
        message: t('landing.validation.statementRequired'),
      });
      return;
    }

    const matchedRoute = matchCuratedStudioRoute(trimmed);
    if (matchedRoute) {
      setFeedback(null);
      navigate(matchedRoute);
      return;
    }

    setFeedback({
      type: 'unsupported',
      message: t('landing.validation.unsupported'),
    });
  };

  const handleClearAnalysis = () => {
    analyzeSeqRef.current += 1;
    analyzeAbortRef.current?.abort();
    analyzeAbortRef.current = null;
    setAnalyzing(false);
    setAnalysisResult(null);
    setAnalyzedStatement(null);
    setAnalysisLocale(null);
    setSelectedStrategyName(null);
    setActiveWorkspaceTab('analysis');
    setFeedback(null);
    setHistorySaveState('idle');
  };

  const handleInputChange = (nextText: string) => {
    setProblemInput(nextText);
    if (feedback) setFeedback(null);
    if (nextText.trim() === '' && (analysisResult || analyzing)) {
      handleClearAnalysis();
    }
  };

  const handleFillTwoSum = () => {
    handleInputChange(
      'Two Sum: Given an array of integers nums and an integer target, find two distinct indices whose values add up to target.',
    );
  };

  const handleFillValidParentheses = () => {
    handleInputChange(
      'Valid Parentheses: Given a string containing (), [], and {}, determine if the brackets are balanced in proper nested order.',
    );
  };

  const handleFillSplitArray = () => {
    handleInputChange(
      'Split Array Largest Sum: Given an array of nonnegative integers nums and an integer k, split nums into k nonempty contiguous subarrays to minimize the largest subarray sum.',
    );
  };

  const handleSaveAiHistory = (consentToStoreStatement: boolean) => {
    if (!analysisResult || analysisResult.mode === 'offline-demo') return;
    setHistorySaveState('saving');
    const result = defaultAiProblemHistoryRepository.save({
      title: analysisResult.analysis.title,
      source: prefillProblem ? 'curated-ai' : 'custom-pasted',
      problemId:
        prefillProblem?.id ?? analysisResult.verified_match.matched_problem_id,
      topic: prefillProblem?.topic ?? analysisResult.analysis.inferred_problem_type,
      locale: analysisLocale ?? language,
      problemStatement: analyzedStatement,
      consentToStoreStatement,
    });
    setHistorySaveState(result.saved ? 'saved' : 'error');
  };

  const verifiedStudios = getVerifiedLibraryItems();
  const studioSummaryKeys = {
    'two-sum': 'library.problemSummaries.twoSum',
    'valid-parentheses': 'library.problemSummaries.validParentheses',
    'split-array-largest-sum': 'library.problemSummaries.splitArray',
  } as const;

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 space-y-16">
      {/* Focused Single-Column Hero & Main Problem Input */}
      <section className="mx-auto max-w-3xl space-y-7 text-center">
        <div className="space-y-3.5">
          <h1 className="text-4xl font-extrabold tracking-tight text-[var(--text-primary)] sm:text-5xl leading-[1.12]">
            {t('landing.heroPrefix')}{' '}
            <span className="text-[var(--accent-blue-link)]">{t('landing.heroAccent')}</span>
          </h1>
          <p className="mx-auto max-w-2xl text-base leading-relaxed text-[var(--text-secondary)] sm:text-lg">
            {t('landing.heroDescription')}
          </p>
        </div>

        <ProblemComposer
          problemInput={problemInput}
          prefillProblem={prefillProblem}
          analyzing={analyzing}
          feedback={feedback}
          onProblemInputChange={handleInputChange}
          onAnalyzeText={(overrideText) => void runAiAnalysis(overrideText)}
          onOpenCuratedStudio={handleOpenInStudioSubmit}
          onFillTwoSum={handleFillTwoSum}
          onFillValidParentheses={handleFillValidParentheses}
          onFillSplitArray={handleFillSplitArray}
        />
      </section>

      {/* Focused Single-Column Analysis / Ask AI Tutor Workspace */}
      {analysisResult && (
        <section
          className="mx-auto max-w-3xl space-y-5"
          aria-labelledby="ai-analysis-heading"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2
              id="ai-analysis-heading"
              className="text-xl sm:text-2xl font-extrabold tracking-tight text-[var(--text-primary)]"
            >
              {analysisResult.mode === 'offline-demo'
                ? t('landing.analysisStatus')
                : t('landing.problemBreakdown')}
            </h2>

            <div className="flex items-center gap-2">
              {analysisResult.mode !== 'offline-demo' && (
                <div
                  role="tablist"
                  aria-label={t('landing.workspaceLabel')}
                  className="inline-flex rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-1"
                >
                  <button
                    ref={(el) => {
                      workspaceTabRefs.current[0] = el;
                    }}
                    id="landing-workspace-tab-analysis"
                    type="button"
                    role="tab"
                    aria-selected={activeWorkspaceTab === 'analysis'}
                    aria-controls="landing-workspace-panel-analysis"
                    tabIndex={activeWorkspaceTab === 'analysis' ? 0 : -1}
                    onClick={() => setActiveWorkspaceTab('analysis')}
                    onKeyDown={(e) => handleWorkspaceTabKeyDown(e, 0)}
                    className={`rounded-lg px-3.5 py-1.5 text-sm font-semibold transition-colors cursor-pointer ${
                      activeWorkspaceTab === 'analysis'
                        ? 'bg-[var(--accent-blue-solid)] text-white'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    {t('landing.analysisTab')}
                  </button>
                  <button
                    ref={(el) => {
                      workspaceTabRefs.current[1] = el;
                    }}
                    id="landing-workspace-tab-tutor"
                    type="button"
                    role="tab"
                    aria-selected={activeWorkspaceTab === 'tutor'}
                    aria-controls="landing-workspace-panel-tutor"
                    tabIndex={activeWorkspaceTab === 'tutor' ? 0 : -1}
                    onClick={() => setActiveWorkspaceTab('tutor')}
                    onKeyDown={(e) => handleWorkspaceTabKeyDown(e, 1)}
                    className={`rounded-lg px-3.5 py-1.5 text-sm font-semibold transition-colors cursor-pointer ${
                      activeWorkspaceTab === 'tutor'
                        ? 'bg-[var(--accent-blue-solid)] text-white'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    {t('landing.tutorTab')}
                  </button>
                </div>
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearAnalysis}
              >
                {t('common.clear')}
              </Button>
            </div>
          </div>

          <div
            id="landing-workspace-panel-analysis"
            role="tabpanel"
            aria-labelledby="landing-workspace-tab-analysis"
            hidden={
              analysisResult.mode !== 'offline-demo' &&
              activeWorkspaceTab !== 'analysis'
            }
            className={
              analysisResult.mode === 'offline-demo' ||
              activeWorkspaceTab === 'analysis'
                ? ''
                : 'hidden'
            }
          >
            {isAnalysisLocaleMismatch && (
              <div role="alert" className="mb-4 rounded-2xl border border-[#F2B84B] bg-[var(--accent-amber-soft)] px-5 py-4 text-sm">
                <p className="font-bold text-[var(--accent-amber-text)]">
                  {t('aiAnalysis.localeMismatchTitle', {
                    language: t(`common.${analysisLocale === 'vi' ? 'vietnamese' : 'english'}`),
                  })}
                </p>
                <p className="mt-1 text-[var(--text-secondary)]">
                  {t('aiAnalysis.localeMismatchDescription', {
                    selectedLanguage: t(`common.${language === 'vi' ? 'vietnamese' : 'english'}`),
                  })}
                </p>
                <Button
                  className="mt-3"
                  variant="primary"
                  size="sm"
                  disabled={analyzing}
                  onClick={() => void runAiAnalysis(analyzedStatement ?? problemInput)}
                >
                  <RotateCcw className="h-4 w-4" aria-hidden="true" />
                  {t('aiAnalysis.regenerateLanguage', {
                    language: t(`common.${language === 'vi' ? 'vietnamese' : 'english'}`),
                  })}
                </Button>
              </div>
            )}
            <ProblemAnalysisView
              result={analysisResult}
              selectedStrategyName={selectedStrategyName}
              isStale={
                isAnalysisStale &&
                (analysisResult.mode === 'offline-demo' ||
                  activeWorkspaceTab === 'analysis')
              }
              onReanalyze={() => void runAiAnalysis()}
              onSelectStrategy={setSelectedStrategyName}
              onOpenTutor={() => setActiveWorkspaceTab('tutor')}
            />
            {analysisResult.mode !== 'offline-demo' && !isAnalysisStale && (
              <div className="mt-4">
                <SaveAiHistoryPanel
                  key={`ai-history-save-${analysisRevision}`}
                  isCustomProblem={!prefillProblem}
                  saved={historySaveState === 'saved'}
                  saving={historySaveState === 'saving'}
                  error={historySaveState === 'error'}
                  onSave={handleSaveAiHistory}
                />
              </div>
            )}
          </div>

          {analysisResult.mode !== 'offline-demo' && (
            <div
              id="landing-workspace-panel-tutor"
              role="tabpanel"
              aria-labelledby="landing-workspace-tab-tutor"
              hidden={activeWorkspaceTab !== 'tutor'}
              className={
                activeWorkspaceTab === 'tutor' ? 'space-y-4' : 'hidden'
              }
            >
              {isAnalysisStale && activeWorkspaceTab === 'tutor' && (
                <div
                  role="alert"
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#F2B84B] bg-[var(--accent-amber-soft)] px-5 py-3.5 text-sm text-[var(--accent-amber-text)]"
                >
                  <span className="font-bold">
                    {t('landing.staleTitle')}
                  </span>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => void runAiAnalysis()}
                  >
                    <RotateCcw className="h-4 w-4" aria-hidden="true" />
                    {t('landing.reanalyze')}
                  </Button>
                </div>
              )}
              <AiTutorPanel
                contextKey={`landing-analysis-${analysisRevision}`}
                problemAnalysis={analysisResult.analysis}
                selectedStrategy={selectedStrategyName}
              />
            </div>
          )}
        </section>
      )}

      {/* Compact Curated Visual Studios Section */}
      <section aria-labelledby="curated-studios-heading" className="space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2
              id="curated-studios-heading"
              className="text-2xl font-extrabold tracking-tight text-[var(--text-primary)]"
            >
              {t('landing.curatedTitle')}
            </h2>
            <p className="mt-1 text-base text-[var(--text-secondary)]">
              {t('landing.curatedDescription')}
            </p>
          </div>
          <Link
            to="/problems"
            className="inline-flex min-h-[36px] items-center gap-1 text-sm font-semibold text-[var(--accent-blue-link)] hover:text-[var(--accent-blue-text)]"
          >
            {t('landing.browseLibrary')}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {verifiedStudios.map((studio) => {
            const topicStyle = getTopicVisualStyle(studio.topic);
            return (
              <Card
                key={studio.id}
                className="overflow-hidden flex flex-col justify-between transition-colors hover:border-[#397BDB]/60"
              >
                <div
                  className={`h-1 w-full ${topicStyle.accentBarClass}`}
                  aria-hidden="true"
                />
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="teal">{t('common.verifiedStudio')}</Badge>
                    <Badge variant={topicStyle.badgeVariant}>{studio.topic}</Badge>
                  </div>
                  <CardTitle className="mt-2.5 text-xl">{studio.title}</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col justify-between gap-5">
                  <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
                    {studioSummaryKeys[studio.id as keyof typeof studioSummaryKeys]
                      ? t(studioSummaryKeys[studio.id as keyof typeof studioSummaryKeys])
                      : studio.summary}
                  </p>
                  <div className="flex items-center justify-between border-t border-[var(--border-subtle)] pt-3.5">
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--text-secondary)]">
                      <Layers className="h-4 w-4 text-[var(--accent-blue-link)]" aria-hidden="true" />
                      {t('landing.stageLesson', { count: studio.stagesCount ?? 0 })}
                    </span>
                    <Link
                      to={studio.studioPath ?? `/studio/${studio.id}`}
                      className="inline-flex min-h-[36px] items-center gap-1 text-sm font-semibold text-[var(--accent-blue-link)] hover:text-[var(--accent-blue-text)]"
                    >
                      {t('common.openStudio')}
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}
