import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AlertCircle,
  ChevronDown,
  HelpCircle,
  Info,
  Lightbulb,
  Loader2,
  MessageCircle,
  RotateCcw,
  Send,
} from 'lucide-react';
import {
  AiClientError,
  askTutor,
  type ProblemAnalysisDto,
  type TutorActionType,
  type TutorResponseDto,
} from '../../services/aiClient';
import { formatAiErrorMessage } from '../../services/aiErrorMessages';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { DEFAULT_LANGUAGE, isSupportedLanguage, type SupportedLanguage } from '../../i18n';

interface AiTutorPanelProps {
  contextKey: string;
  problemAnalysis: ProblemAnalysisDto;
  selectedStrategy?: string | null;
  learningStage?: string | null;
  executionContext?: string | null;
  /** Optional callback so Studio active-study timer can pause while waiting for AI replies. */
  onLoadingChange?: (loading: boolean) => void;
}

const ESSENTIAL_TUTOR_ACTIONS: TutorActionType[] = ['simplify', 'hint'];

const ADVANCED_TUTOR_ACTIONS: TutorActionType[] = [
  'why_technique', 'compare_strategies', 'explain_prerequisite', 'check_assumption',
];

export function AiTutorPanel({
  contextKey,
  problemAnalysis,
  selectedStrategy = null,
  learningStage = null,
  executionContext = null,
  onLoadingChange,
}: AiTutorPanelProps) {
  const { t, i18n } = useTranslation();
  const language: SupportedLanguage = isSupportedLanguage(i18n.resolvedLanguage)
    ? i18n.resolvedLanguage
    : DEFAULT_LANGUAGE;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [responses, setResponses] = useState<
    Array<{ response: TutorResponseDto; locale: SupportedLanguage }>
  >([]);
  const [customMessage, setCustomMessage] = useState('');
  const [requestFullSolution, setRequestFullSolution] = useState(false);
  const [lastAction, setLastAction] = useState<TutorActionType | null>(null);

  const seqRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);

  // Reset AI Tutor messages, inputs, errors, and abort any in-flight call when context changes
  useEffect(() => {
    seqRef.current += 1;
    abortRef.current?.abort();
    abortRef.current = null;
    setLoading(false);
    setError(null);
    setResponses([]);
    setCustomMessage('');
    setRequestFullSolution(false);
    setLastAction(null);
  }, [contextKey]);

  useEffect(() => {
    onLoadingChange?.(loading);
  }, [loading, onLoadingChange]);

  useEffect(() => {
    return () => {
      onLoadingChange?.(false);
      seqRef.current += 1;
      abortRef.current?.abort();
      abortRef.current = null;
    };
  }, [onLoadingChange]);

  const runTutorAction = async (
    action: TutorActionType,
    message?: string,
  ) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const requestSeq = seqRef.current + 1;
    seqRef.current = requestSeq;

    setLoading(true);
    setError(null);
    setLastAction(action);
    const requestLocale = language;

    try {
      const res = await askTutor(
        {
          problem_analysis: problemAnalysis,
          action,
          locale: requestLocale,
          selected_strategy: selectedStrategy,
          learning_stage: learningStage,
          execution_context: executionContext,
          learner_message: message?.trim() || null,
          explicitly_request_solution: requestFullSolution,
        },
        { signal: controller.signal },
      );

      if (seqRef.current !== requestSeq) {
        return;
      }
      setResponses((current) => [...current, { response: res, locale: requestLocale }]);
    } catch (err) {
      if (seqRef.current !== requestSeq) {
        return;
      }
      if (err instanceof AiClientError && err.kind === 'aborted') {
        return;
      }
      setError(
        formatAiErrorMessage(err, t, {
          fallbackKey: 'aiTutor.error',
          suggestedWaitKey: 'aiTutor.suggestedWait',
        }),
      );
    } finally {
      if (seqRef.current === requestSeq) {
        setLoading(false);
      }
    }
  };

  const handleCustomSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!customMessage.trim()) return;
    void runTutorAction('custom_question', customMessage);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <MessageCircle
            className="h-5 w-5 text-[var(--accent-blue-link)]"
            aria-hidden="true"
          />
          <CardTitle className="text-xl">{t('aiTutor.title')}</CardTitle>
        </div>
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
          {t('aiTutor.description')}
        </p>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Essential Actions Only: Explain simply, Give a hint */}
        <div
          role="group"
          aria-label={t('aiTutor.quickActions')}
          className="flex flex-wrap gap-2.5"
        >
          {ESSENTIAL_TUTOR_ACTIONS.map((action) => (
            <Button
              key={action}
              type="button"
              variant="secondary"
              size="md"
              disabled={loading}
              onClick={() => void runTutorAction(action)}
            >
              {t(`aiTutor.actions.${action}`)}
            </Button>
          ))}
        </div>

        {/* Ask a Question Form */}
        <form onSubmit={handleCustomSubmit} className="space-y-3">
          <div className="flex gap-2">
            <label htmlFor="tutor-question-input" className="sr-only">
              {t('aiTutor.askLabel')}
            </label>
            <input
              id="tutor-question-input"
              type="text"
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder={t('aiTutor.placeholder')}
              className="h-11 flex-1 rounded-xl border border-[var(--border-control)] bg-[var(--surface-card)] px-4 text-base text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:border-[#397BDB] focus:outline-none"
            />
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={loading || !customMessage.trim()}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Send className="h-4 w-4" aria-hidden="true" />
              )}
              {t('aiTutor.ask')}
            </Button>
          </div>
        </form>

        {/* Expandable Advanced Tutor Actions */}
        <details className="group rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-subtle)]">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
            <span>{t('aiTutor.moreOptions')}</span>
            <ChevronDown
              className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180"
              aria-hidden="true"
            />
          </summary>
          <div className="border-t border-[var(--border-subtle)] px-4 py-3.5 space-y-3">
            <div className="flex flex-wrap gap-2">
              {ADVANCED_TUTOR_ACTIONS.map((action) => (
                <button
                  key={action}
                  type="button"
                  disabled={loading}
                  onClick={() => void runTutorAction(action)}
                  className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-card)] px-3 py-2 text-sm font-medium text-[var(--text-primary)] transition-colors hover:border-[#397BDB] hover:text-[var(--accent-blue-text)] cursor-pointer disabled:opacity-50"
                >
                  {t(`aiTutor.actions.${action}`)}
                </button>
              ))}
            </div>
            <label className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] cursor-pointer">
              <input
                type="checkbox"
                checked={requestFullSolution}
                onChange={(e) => setRequestFullSolution(e.target.checked)}
                className="rounded border-[var(--border-control)] accent-[#397BDB]"
              />
              {t('aiTutor.fullSolution')}
            </label>
          </div>
        </details>

        {/* Loading State */}
        {loading && (
          <div
            role="status"
            className="flex items-center gap-2.5 rounded-xl bg-[var(--accent-blue-soft)]/60 px-4 py-3 text-sm text-[var(--accent-blue-text)]"
          >
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            {t('aiTutor.loading')}
          </div>
        )}

        {/* Error & Retry State */}
        {error && (
          <div
            role="alert"
            className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#F2B84B] bg-[var(--accent-amber-soft)] px-4 py-3 text-sm text-[var(--accent-amber-text)]"
          >
            <div className="flex items-start gap-2">
              <AlertCircle
                className="h-4 w-4 shrink-0 mt-0.5"
                aria-hidden="true"
              />
              <span>{error}</span>
            </div>
            {lastAction && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => void runTutorAction(lastAction, customMessage)}
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                {t('common.retry')}
              </Button>
            )}
          </div>
        )}

        {/* Structured Tutor Reply */}
        {responses.length > 0 && (
          <div
            aria-label={t('aiTutor.responseLabel')}
            className="space-y-4 border-t border-[var(--border-subtle)] pt-5"
          >
            {responses.map(({ response, locale }, index) => (
            <div key={`${locale}-${index}`} className="space-y-4 rounded-xl border border-[var(--border-subtle)] p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Badge variant={response.mode === 'offline-demo' ? 'demo' : 'indigo'}>
                {response.mode === 'offline-demo'
                  ? t('aiTutor.offlineBadge')
                  : t('aiTutor.replyBadge')}
              </Badge>
              <span className="text-xs text-[var(--text-secondary)]">
                {t('aiTutor.conceptualGuidance')} · {locale.toUpperCase()}
              </span>
            </div>

            <p className="text-base leading-[1.7] text-[var(--text-primary)]">
              {response.reply}
            </p>

            <div className="rounded-xl border-l-4 border-[#397BDB] bg-[var(--surface-subtle)] px-4 py-3.5 text-sm space-y-1">
              <p className="flex items-center gap-1.5 font-bold text-[var(--accent-blue-text)]">
                <HelpCircle className="h-4 w-4" aria-hidden="true" />
                {t('aiTutor.guidingQuestion')}
              </p>
              <p className="text-base text-[var(--text-primary)] leading-relaxed">
                {response.guiding_question}
              </p>
            </div>

            {response.progressive_hint && (
              <div className="rounded-xl border-l-4 border-[#F2B84B] bg-[var(--accent-amber-soft)]/60 px-4 py-3.5 text-sm space-y-1">
                <p className="flex items-center gap-1.5 font-bold text-[var(--accent-amber-text)]">
                  <Lightbulb className="h-4 w-4" aria-hidden="true" />
                  {t('aiTutor.progressiveHint')}
                </p>
                <p className="text-base text-[var(--text-primary)] leading-relaxed">
                  {response.progressive_hint}
                </p>
              </div>
            )}

            <p className="flex items-start gap-1.5 text-xs text-[var(--text-secondary)] leading-relaxed">
              <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" aria-hidden="true" />
              <span>{response.mastery_disclaimer}</span>
            </p>
            </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
