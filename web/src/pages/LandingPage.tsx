import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  BrainCircuit,
  Code2,
  Eye,
  GitBranch,
  Layers,
  Loader2,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { SAMPLE_PROBLEMS } from '../domain/problems/demoCatalog';
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

const LEARNING_STEPS = [
  {
    step: '01',
    title: 'Understand the Problem',
    description:
      'Break down inputs, outputs, and edge cases visually before thinking about syntax.',
    icon: BrainCircuit,
  },
  {
    step: '02',
    title: 'Compare Strategies',
    description:
      'See why a naive approach works and what insight unlocks a faster solution.',
    icon: GitBranch,
  },
  {
    step: '03',
    title: 'Trace Step-by-Step',
    description:
      'Watch deterministic visuals update pointers, stacks, partitions, and data structures.',
    icon: Eye,
  },
  {
    step: '04',
    title: 'Move to Code Confidently',
    description:
      'Transition from clear reasoning to pseudocode and your own implementation.',
    icon: Code2,
  },
];

/**
 * Strict curated shortcut matcher for the direct "Open Curated Studio" action.
 * Rejects incompatible variants (3Sum, Two Sum II, counting pairs, Remove Invalid
 * Parentheses, wildcard '*', negative or unknown-sign Split Array) so arbitrary
 * pasted problems are analyzed conceptually instead of misrouted.
 */
function matchCuratedStudioRoute(text: string): string | null {
  const raw = text.trim().toLowerCase();

  // Split Array Largest Sum (must explicitly state non-negative/nonnegative/positive and disallow negatives)
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

  // Valid Parentheses (reject remove invalid, longest, generate, wildcard)
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

  // Two Sum (must specify two distinct indices and reject 3Sum / Two Sum II / count / subarray)
  const hasTwoSumPair =
    /(two|pair).{0,50}(indices|index).{0,60}(sum|add\s+up)\s+to/.test(raw) ||
    (/\btwo\s*[- ]?sum\b/.test(raw) && /\bindices\b/.test(raw));
  if (hasTwoSumPair) {
    const incompatible =
      /\b(3sum|three\s+sum|4sum|two\s+sum\s+ii|1-indexed|sorted|subarray\s+sum|count|how\s+many|all\s+pairs|triplets)\b/.test(
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
  const [problemInput, setProblemInput] = useState('');
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
  const [comingSoonNote, setComingSoonNote] = useState<string | null>(null);

  // Sequence + AbortController prevent rapid consecutive requests from racing or overwriting newer results
  const analyzeSeqRef = useRef(0);
  const analyzeAbortRef = useRef<AbortController | null>(null);

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
          'Please paste at least 10 characters describing a programming problem (or load a sample below).',
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
          'Paste a problem statement first, or load a curated sample below to open its verified Studio.',
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
        'Not supported in current demo for direct deterministic Studio playback (curated Studios only run built-in verified modules, never pasted text directly). Click "Analyze Problem (AI)" to check compatibility and explore a conceptual breakdown.',
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

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      {/* Hero Section */}
      <section className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div className="space-y-6">
          <Badge variant="indigo" className="px-3 py-1 text-xs">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            Beginner-First Visual Algorithm Learning
          </Badge>

          <h1 className="text-4xl font-extrabold tracking-tight text-[#20253B] sm:text-5xl leading-[1.12]">
            Understand the logic{' '}
            <span className="text-[#645BE8]">before you code.</span>
          </h1>

          <p className="max-w-xl text-base leading-relaxed text-[#555D7A] sm:text-lg">
            Paste any algorithm problem for a beginner-friendly AI breakdown, or
            explore verified deterministic visual studios for Two Sum, Valid
            Parentheses, and Split Array Largest Sum.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Link
              to="/problems"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#645BE8] px-6 text-base font-semibold text-white shadow-xs transition-colors hover:bg-[#4F46D8]"
            >
              Browse Problem Library
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>

            <Link
              to="/studio/split-array-largest-sum"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-[#D7DCEB] bg-white px-5 text-sm font-semibold text-[#20253B] transition-colors hover:bg-[#F7F8FC]"
            >
              Try Composition Studio
            </Link>
          </div>
        </div>

        {/* Real Problem Analyzer + Curated Studio Card */}
        <Card className="p-6 shadow-[0_8px_30px_rgba(32,37,59,0.06)]">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-base font-bold text-[#20253B]">
              Analyze a Problem Statement
            </h2>
            <Badge variant="mint">3 Verified Studios + AI Analyzer</Badge>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-[#555D7A]">
            <strong>Analyze Problem (AI)</strong> gives an AI-generated conceptual
            breakdown (not executed). <strong>Open Curated Studio</strong> opens
            a built-in deterministic example Studio if your statement strictly matches one.
          </p>

          <form onSubmit={handleOpenInStudioSubmit} className="mt-4 space-y-3">
            <div>
              <label htmlFor="problem-input" className="sr-only">
                Paste a problem statement
              </label>
              <textarea
                id="problem-input"
                rows={4}
                value={problemInput}
                onChange={(e) => handleInputChange(e.target.value)}
                placeholder="Paste a programming problem statement (e.g., Two Sum, Valid Parentheses, Split Array Largest Sum, or any new problem for conceptual AI analysis)..."
                className="w-full rounded-xl border border-[#D7DCEB] bg-[#F7F8FC] p-3.5 text-sm text-[#20253B] placeholder:text-[#7E86A3] focus:border-[#645BE8] focus:bg-white focus:outline-none"
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

            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1">
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
                  type="button"
                  variant="primary"
                  size="sm"
                  disabled={analyzing}
                  onClick={() => void runAiAnalysis()}
                >
                  <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                  Analyze Problem (AI)
                </Button>
                <Button
                  type="submit"
                  variant="outline"
                  size="sm"
                  title="Opens a built-in curated Studio example (does not execute pasted text)"
                >
                  Open Curated Studio
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
            </div>
          </form>
        </Card>
      </section>

      {/* Live AI Analysis + Beginner Tutor Section (rendered when analysis completes) */}
      {analysisResult && (
        <section
          className="mt-12 space-y-6"
          aria-labelledby="ai-analysis-heading"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2
              id="ai-analysis-heading"
              className="text-2xl font-extrabold tracking-tight text-[#20253B]"
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

          <div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr] lg:items-start">
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

      {/* Sample Problems Section */}
      <section className="mt-16" aria-labelledby="samples-heading">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2
              id="samples-heading"
              className="text-2xl font-extrabold tracking-tight text-[#20253B]"
            >
              Verified Interactive Studios
            </h2>
            <p className="mt-1 text-sm text-[#555D7A]">
              Deterministic visual execution traces backed by unit-tested algorithms.
            </p>
          </div>
          <Link
            to="/problems"
            className="text-sm font-semibold text-[#645BE8] hover:text-[#4F46D8]"
          >
            View full library &rarr;
          </Link>
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-3">
          {SAMPLE_PROBLEMS.slice(0, 3).map((sample) => {
            const isLive = sample.status === 'live-demo';
            return (
              <Card
                key={sample.id}
                className={`flex flex-col justify-between transition-colors ${
                  isLive ? 'border-[#645BE8]/40' : ''
                }`}
              >
                <CardHeader>
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant={isLive ? 'mint' : 'neutral'}>
                      {isLive ? 'Verified Studio' : 'Coming Soon'}
                    </Badge>
                    <span className="text-xs font-medium text-[#555D7A]">
                      {sample.pattern}
                    </span>
                  </div>
                  <CardTitle className="mt-2 text-lg">{sample.title}</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col justify-between gap-4">
                  <p className="text-sm leading-relaxed text-[#555D7A]">
                    {sample.summary}
                  </p>
                  <div className="flex items-center justify-between border-t border-[#E3E7F2] pt-3">
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#555D7A]">
                      <Layers className="h-3.5 w-3.5 text-[#645BE8]" aria-hidden="true" />
                      {sample.strategiesCount}{' '}
                      {sample.strategiesCount === 1 ? 'strategy' : 'strategies'}
                    </span>
                    {isLive ? (
                      <Link
                        to={sample.studioPath ?? `/studio/${sample.id}`}
                        className="inline-flex items-center gap-1 text-sm font-semibold text-[#645BE8] hover:text-[#4F46D8]"
                      >
                        Open Studio
                        <ArrowRight className="h-4 w-4" aria-hidden="true" />
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={() =>
                          setComingSoonNote(
                            `${sample.title} (${sample.pattern}) is planned for a later sprint.`,
                          )
                        }
                        className="text-xs font-semibold text-[#555D7A] hover:text-[#20253B] cursor-pointer"
                      >
                        Preview status
                      </button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {comingSoonNote && (
          <div
            role="status"
            className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#D8DCFF] bg-[#EEF0FF]/70 px-4 py-3 text-xs text-[#20253B]"
          >
            <span>{comingSoonNote}</span>
            <Link
              to="/problems"
              className="font-semibold text-[#4F46D8] hover:underline"
            >
              Browse supported problems &rarr;
            </Link>
          </div>
        )}
      </section>

      {/* Feature Overview: Problem First, Code Last */}
      <section className="mt-16" aria-labelledby="how-it-works-heading">
        <div className="max-w-2xl">
          <h2
            id="how-it-works-heading"
            className="text-2xl font-extrabold tracking-tight text-[#20253B]"
          >
            Problem first, code last
          </h2>
          <p className="mt-1 text-sm text-[#555D7A]">
            AI explains concepts and hints; verified visual steps always come from deterministic, tested code.
          </p>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {LEARNING_STEPS.map(({ step, title, description, icon: Icon }) => (
            <Card key={step} className="p-5">
              <div className="flex items-center justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EEF0FF] text-[#645BE8]">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="font-mono text-xs font-bold text-[#8B93B0]">
                  {step}
                </span>
              </div>
              <h3 className="mt-4 text-sm font-bold text-[#20253B]">{title}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-[#555D7A]">
                {description}
              </p>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
