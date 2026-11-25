import { useEffect, useRef, useState, type FormEvent } from 'react';
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
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';

interface AiTutorPanelProps {
  contextKey: string;
  problemAnalysis: ProblemAnalysisDto;
  selectedStrategy?: string | null;
  learningStage?: string | null;
  executionContext?: string | null;
}

const ESSENTIAL_TUTOR_ACTIONS: { id: TutorActionType; label: string }[] = [
  { id: 'simplify', label: 'Explain simply' },
  { id: 'hint', label: 'Give a hint' },
];

const ADVANCED_TUTOR_ACTIONS: { id: TutorActionType; label: string }[] = [
  { id: 'why_technique', label: 'Why might this technique work?' },
  { id: 'compare_strategies', label: 'Compare two approaches' },
  { id: 'explain_prerequisite', label: 'Explain a prerequisite' },
  { id: 'check_assumption', label: 'Check my assumption' },
];

export function AiTutorPanel({
  contextKey,
  problemAnalysis,
  selectedStrategy = null,
  learningStage = null,
  executionContext = null,
}: AiTutorPanelProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<TutorResponseDto | null>(null);
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
    setResponse(null);
    setCustomMessage('');
    setRequestFullSolution(false);
    setLastAction(null);
  }, [contextKey]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

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

    try {
      const res = await askTutor(
        {
          problem_analysis: problemAnalysis,
          action,
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
      setResponse(res);
    } catch (err) {
      if (seqRef.current !== requestSeq) {
        return;
      }
      if (err instanceof AiClientError) {
        if (err.kind === 'aborted') return;
        const retryHint = err.retryAfterSeconds
          ? ` (Suggested wait: ~${err.retryAfterSeconds}s)`
          : '';
        setError(`${err.message}${retryHint}`);
      } else {
        setError('Could not reach the AI Tutor. Please retry.');
      }
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
          <CardTitle className="text-xl">AI Tutor</CardTitle>
        </div>
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
          Get a simpler explanation, a gentle hint, or ask a specific question without spoiling the full solution.
        </p>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Essential Actions Only: Explain simply, Give a hint */}
        <div
          role="group"
          aria-label="Tutor quick actions"
          className="flex flex-wrap gap-2.5"
        >
          {ESSENTIAL_TUTOR_ACTIONS.map((item) => (
            <Button
              key={item.id}
              type="button"
              variant="secondary"
              size="md"
              disabled={loading}
              onClick={() => void runTutorAction(item.id)}
            >
              {item.label}
            </Button>
          ))}
        </div>

        {/* Ask a Question Form */}
        <form onSubmit={handleCustomSubmit} className="space-y-3">
          <div className="flex gap-2">
            <label htmlFor="tutor-question-input" className="sr-only">
              Ask a question
            </label>
            <input
              id="tutor-question-input"
              type="text"
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder="Ask a question about this problem..."
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
              Ask
            </Button>
          </div>
        </form>

        {/* Expandable Advanced Tutor Actions */}
        <details className="group rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-subtle)]">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
            <span>More tutor options</span>
            <ChevronDown
              className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180"
              aria-hidden="true"
            />
          </summary>
          <div className="border-t border-[var(--border-subtle)] px-4 py-3.5 space-y-3">
            <div className="flex flex-wrap gap-2">
              {ADVANCED_TUTOR_ACTIONS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  disabled={loading}
                  onClick={() => void runTutorAction(item.id)}
                  className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-card)] px-3 py-2 text-sm font-medium text-[var(--text-primary)] transition-colors hover:border-[#397BDB] hover:text-[var(--accent-blue-text)] cursor-pointer disabled:opacity-50"
                >
                  {item.label}
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
              Explicitly request a fuller solution outline
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
            Thinking through a beginner-friendly hint...
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
                Retry
              </Button>
            )}
          </div>
        )}

        {/* Structured Tutor Reply */}
        {response && !loading && (
          <div
            aria-label="AI Tutor response"
            className="space-y-4 border-t border-[var(--border-subtle)] pt-5"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Badge variant={response.mode === 'offline-demo' ? 'demo' : 'indigo'}>
                {response.mode === 'offline-demo'
                  ? 'Offline Demo Tutor'
                  : 'AI Tutor Reply'}
              </Badge>
              <span className="text-xs text-[var(--text-secondary)]">
                Conceptual guidance
              </span>
            </div>

            <p className="text-base leading-[1.7] text-[var(--text-primary)]">
              {response.reply}
            </p>

            <div className="rounded-xl border-l-4 border-[#397BDB] bg-[var(--surface-subtle)] px-4 py-3.5 text-sm space-y-1">
              <p className="flex items-center gap-1.5 font-bold text-[var(--accent-blue-text)]">
                <HelpCircle className="h-4 w-4" aria-hidden="true" />
                Guiding Question
              </p>
              <p className="text-base text-[var(--text-primary)] leading-relaxed">
                {response.guiding_question}
              </p>
            </div>

            {response.progressive_hint && (
              <div className="rounded-xl border-l-4 border-[#F2B84B] bg-[var(--accent-amber-soft)]/60 px-4 py-3.5 text-sm space-y-1">
                <p className="flex items-center gap-1.5 font-bold text-[var(--accent-amber-text)]">
                  <Lightbulb className="h-4 w-4" aria-hidden="true" />
                  Progressive Hint
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
        )}
      </CardContent>
    </Card>
  );
}
