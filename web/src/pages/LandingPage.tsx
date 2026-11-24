import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  Layers,
  Loader2,
  RotateCcw,
  Sparkles,
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
import { ProblemAnalysisView } from '../features/analyzer/ProblemAnalysisView';
import { AiTutorPanel } from '../features/analyzer/AiTutorPanel';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';

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
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const prefillId = searchParams.get('prefill');
  const prefillProblem = prefillId ? getAiGuidedProblemById(prefillId) : undefined;

  const [problemInput, setProblemInput] = useState(
    () => prefillProblem?.originalPrompt ?? '',
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
  const [analysisRevision, setAnalysisRevision] = useState(0);
  const [selectedStrategyName, setSelectedStrategyName] = useState<
    string | null
  >(null);

  const analyzeSeqRef = useRef(0);
  const analyzeAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (prefillProblem?.originalPrompt) {
      setProblemInput(prefillProblem.originalPrompt);
      setFeedback(null);
    }
  }, [prefillProblem]);

  useEffect(() => {
    return () => {
      analyzeAbortRef.current?.abort();
    };
  }, []);

  const isAnalysisStale = Boolean(
    analysisResult &&
      analyzedStatement !== null &&
      problemInput.trim() !== analyzedStatement,
  );

  const runAiAnalysis = async () => {
    const trimmed = problemInput.trim();
    if (trimmed.length < 10) {
      setFeedback({
        type: 'empty',
        message:
          'Paste at least 10 characters describing a programming problem (or load a sample below).',
      });
      return;
    }

    analyzeAbortRef.current?.abort();
    const controller = new AbortController();
    analyzeAbortRef.current = controller;
    const requestSeq = analyzeSeqRef.current + 1;
    analyzeSeqRef.current = requestSeq;

    setAnalyzing(true);
    setFeedback(null);

    try {
      const response = await analyzeProblem(trimmed, {
        signal: controller.signal,
      });

      if (analyzeSeqRef.current !== requestSeq) {
        return;
      }

      setAnalysisResult(response);
      setAnalyzedStatement(trimmed);
      setAnalysisRevision((rev) => rev + 1);
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
      const message =
        err instanceof AiClientError
          ? `${err.message}${err.retryAfterSeconds ? ` (Suggested wait: ~${err.retryAfterSeconds}s)` : ''}`
          : 'Could not complete problem analysis. Please retry.';
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
        message:
          'Paste a problem statement first, or choose a curated Studio below.',
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
      message:
        'Not supported in current demo for direct deterministic Studio playback (curated Studios only run built-in verified modules). Click "Analyze Problem (AI)" for a conceptual breakdown.',
    });
  };

  const handleInputChange = (nextText: string) => {
    setProblemInput(nextText);
    if (feedback) setFeedback(null);
    if (nextText.trim() === '' && analysisResult) {
      setAnalysisResult(null);
      setAnalyzedStatement(null);
      setSelectedStrategyName(null);
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

  const verifiedStudios = getVerifiedLibraryItems();

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 space-y-16">
      {/* Focused Single-Column Hero & Main Problem Input */}
      <section className="mx-auto max-w-3xl space-y-7 text-center">
        <div className="space-y-3.5">
          <h1 className="text-4xl font-extrabold tracking-tight text-[#181B2E] sm:text-5xl leading-[1.12]">
            Understand the logic{' '}
            <span className="text-[#645BE8]">before you code.</span>
          </h1>
          <p className="mx-auto max-w-2xl text-base leading-relaxed text-[#4E5672] sm:text-lg">
            Paste any programming problem for a step-by-step conceptual breakdown,
            or practice interactively in a verified visual studio.
          </p>
        </div>

        <Card className="text-left p-6 sm:p-7 shadow-[0_8px_30px_rgba(24,27,46,0.05)]">
          <form onSubmit={handleOpenInStudioSubmit} className="space-y-4">
            {prefillProblem && (
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#D8DCFF] bg-[#EEF0FF]/50 px-4 py-2.5 text-sm text-[#181B2E]">
                <span>
                  Loaded original practice problem:{' '}
                  <strong>{prefillProblem.title}</strong> ({prefillProblem.topic})
                </span>
                <Badge variant="indigo">AI-Guided · Conceptual</Badge>
              </div>
            )}

            <div>
              <label htmlFor="problem-input" className="sr-only">
                Paste a problem statement
              </label>
              <textarea
                id="problem-input"
                rows={4}
                value={problemInput}
                onChange={(e) => handleInputChange(e.target.value)}
                placeholder="Paste any algorithm problem statement to analyze its inputs, approach, and intuition..."
                className="w-full rounded-xl border border-[#D7DCEB] bg-[#F8F9FC] p-4 text-base leading-relaxed text-[#181B2E] placeholder:text-[#4E5672]/75 focus:border-[#645BE8] focus:bg-white focus:outline-none"
              />
            </div>

            {analyzing && (
              <div
                role="status"
                className="flex items-center gap-2 rounded-xl border border-[#D8DCFF] bg-[#EEF0FF]/60 px-3.5 py-3 text-xs font-medium text-[#4F46D8]"
              >
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Analyzing problem structure, constraints, and candidate strategies...
              </div>
            )}

            {feedback && (
              <div
                role="alert"
                className="flex items-start justify-between gap-2.5 rounded-xl border border-[#F1B34C] bg-[#FEF6E6] p-3.5 text-xs leading-relaxed text-[#20253B]"
              >
                <div className="flex items-start gap-2">
                  <AlertCircle
                    className="h-4 w-4 shrink-0 text-[#9A630A] mt-0.5"
                    aria-hidden="true"
                  />
                  <div className="space-y-1">
                    <p className="font-semibold text-[#9A630A]">
                      {feedback.type === 'unsupported'
                        ? 'Not supported in current demo'
                        : feedback.type === 'error'
                          ? 'Analysis request failed'
                          : 'Add a problem statement'}
                    </p>
                    <p className="text-[#555D7A]">{feedback.message}</p>
                  </div>
                </div>
                {feedback.canRetry && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => void runAiAnalysis()}
                  >
                    <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                    Retry
                  </Button>
                )}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 pt-0.5">
              <div className="flex flex-wrap items-center gap-1 text-xs text-[#555D7A]">
                <span className="font-medium pr-1">Try sample:</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleFillTwoSum}
                >
                  Load Two Sum sample
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleFillValidParentheses}
                >
                  Valid Parentheses
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleFillSplitArray}
                >
                  Split Array
                </Button>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="submit"
                  variant="ghost"
                  size="sm"
                  title="Opens a built-in curated Studio example if your statement strictly matches one"
                >
                  Open Curated Studio
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  disabled={analyzing}
                  onClick={() => void runAiAnalysis()}
                >
                  <Sparkles className="h-4 w-4" aria-hidden="true" />
                  Analyze Problem (AI)
                </Button>
              </div>
            </div>
          </form>
        </Card>
      </section>

      {/* Live AI Analysis + Beginner Tutor Section (progressive — appears only when analyzing) */}
      {analysisResult && (
        <section
          className="space-y-5"
          aria-labelledby="ai-analysis-heading"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2
              id="ai-analysis-heading"
              className="text-2xl font-extrabold tracking-tight text-[#181B2E]"
            >
              Problem Analysis &amp; Beginner Tutor
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setAnalysisResult(null);
                setAnalyzedStatement(null);
                setSelectedStrategyName(null);
              }}
            >
              Clear Analysis
            </Button>
          </div>

          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
            <ProblemAnalysisView
              result={analysisResult}
              selectedStrategyName={selectedStrategyName}
              isStale={isAnalysisStale}
              onReanalyze={() => void runAiAnalysis()}
              onSelectStrategy={setSelectedStrategyName}
            />
            <AiTutorPanel
              contextKey={`landing-analysis-${analysisRevision}`}
              problemAnalysis={analysisResult.analysis}
              selectedStrategy={selectedStrategyName}
            />
          </div>
        </section>
      )}

      {/* Compact Curated Visual Studios Section */}
      <section aria-labelledby="curated-studios-heading" className="space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2
              id="curated-studios-heading"
              className="text-2xl font-extrabold tracking-tight text-[#181B2E]"
            >
              Curated Visual Studios
            </h2>
            <p className="mt-1 text-base text-[#4E5672]">
              Step through verified, deterministic visualizations before writing code.
            </p>
          </div>
          <Link
            to="/problems"
            className="inline-flex min-h-[36px] items-center gap-1 text-sm font-semibold text-[#645BE8] hover:text-[#4F46D8]"
          >
            Browse Problem Library
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {verifiedStudios.map((studio) => (
            <Card
              key={studio.id}
              className="flex flex-col justify-between transition-colors hover:border-[#645BE8]/50"
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="mint">Verified Studio</Badge>
                  <span className="text-xs font-medium text-[#4E5672]">
                    {studio.topic}
                  </span>
                </div>
                <CardTitle className="mt-2.5 text-xl">{studio.title}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col justify-between gap-5">
                <p className="text-sm leading-relaxed text-[#4E5672]">
                  {studio.summary}
                </p>
                <div className="flex items-center justify-between border-t border-[#E4E7F1] pt-3.5">
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#4E5672]">
                    <Layers className="h-4 w-4 text-[#645BE8]" aria-hidden="true" />
                    {studio.stagesCount}-stage lesson
                  </span>
                  <Link
                    to={studio.studioPath ?? `/studio/${studio.id}`}
                    className="inline-flex min-h-[36px] items-center gap-1 text-sm font-semibold text-[#645BE8] hover:text-[#4F46D8]"
                  >
                    Open Studio
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
