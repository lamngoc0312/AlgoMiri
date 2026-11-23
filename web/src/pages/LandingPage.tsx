import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  BrainCircuit,
  Code2,
  Eye,
  GitBranch,
  Layers,
  Sparkles,
} from 'lucide-react';
import { SAMPLE_PROBLEMS } from '../domain/problems/demoCatalog';
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
      'Watch deterministic visuals update pointers, stacks, comparisons, and data structures.',
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

function matchSupportedProblemRoute(text: string): string | null {
  const normalized = text.trim().toLowerCase();
  if (
    normalized.includes('two sum') ||
    normalized.includes('twosum') ||
    normalized.includes('two-sum') ||
    (normalized.includes('target') && normalized.includes('nums'))
  ) {
    return '/studio/two-sum';
  }
  if (
    normalized.includes('valid parentheses') ||
    normalized.includes('valid-parentheses') ||
    normalized.includes('balanced brackets') ||
    normalized.includes('parentheses')
  ) {
    return '/studio/valid-parentheses';
  }
  return null;
}

export function LandingPage() {
  const navigate = useNavigate();
  const [problemInput, setProblemInput] = useState('');
  const [feedback, setFeedback] = useState<{
    type: 'empty' | 'unsupported';
    message: string;
  } | null>(null);
  const [comingSoonNote, setComingSoonNote] = useState<string | null>(null);

  const handleAnalyzeSubmit = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = problemInput.trim();

    if (!trimmed) {
      setFeedback({
        type: 'empty',
        message:
          'Paste a problem statement first, or load a supported sample below to jump straight into the Studio.',
      });
      return;
    }

    const matchedRoute = matchSupportedProblemRoute(trimmed);
    if (matchedRoute) {
      setFeedback(null);
      navigate(matchedRoute);
      return;
    }

    setFeedback({
      type: 'unsupported',
      message:
        'Demo Scope: Arbitrary problem statements and external URLs are not parsed yet, and no AI API is connected. Right now, Two Sum and Valid Parentheses are supported with verified deterministic traces.',
    });
  };

  const handleFillTwoSum = () => {
    setProblemInput(
      'Two Sum: Given an array of integers nums and an integer target, find two distinct indices whose values add up to target.',
    );
    setFeedback(null);
  };

  const handleFillValidParentheses = () => {
    setProblemInput(
      'Valid Parentheses: Given a string containing (), [], and {}, determine if the brackets are balanced in proper nested order.',
    );
    setFeedback(null);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      {/* Hero Section */}
      <section className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
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
            AlgoMiri helps you move from reading a problem statement to choosing a
            strategy and tracing every step visually — without staring at a blank
            code editor first.
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
              to="/studio/two-sum"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-[#D7DCEB] bg-white px-5 text-sm font-semibold text-[#20253B] transition-colors hover:bg-[#F7F8FC]"
            >
              Try Two Sum Studio
            </Link>
          </div>
        </div>

        {/* Paste Problem Card */}
        <Card className="p-6 shadow-[0_8px_30px_rgba(32,37,59,0.06)]">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-base font-bold text-[#20253B]">
              Start with a problem
            </h2>
            <Badge variant="mint">2 Live Problems</Badge>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-[#555D7A]">
            Paste a problem statement below. Two Sum and Valid Parentheses open directly in Learning Studio; other problems show an honest unsupported-demo notice.
          </p>

          <form onSubmit={handleAnalyzeSubmit} className="mt-4 space-y-3">
            <div>
              <label htmlFor="problem-input" className="sr-only">
                Paste a problem statement
              </label>
              <textarea
                id="problem-input"
                rows={4}
                value={problemInput}
                onChange={(e) => {
                  setProblemInput(e.target.value);
                  if (feedback) setFeedback(null);
                }}
                placeholder="Paste a problem statement (try Two Sum or Valid Parentheses, or paste another problem to see how unsupported inputs are handled honestly)..."
                className="w-full rounded-xl border border-[#D7DCEB] bg-[#F7F8FC] p-3.5 text-sm text-[#20253B] placeholder:text-[#7E86A3] focus:border-[#645BE8] focus:bg-white focus:outline-none"
              />
            </div>

            {feedback && (
              <div
                role="alert"
                className="flex items-start gap-2.5 rounded-xl border border-[#F1B34C] bg-[#FEF6E6] p-3.5 text-xs leading-relaxed text-[#20253B]"
              >
                <AlertCircle
                  className="h-4 w-4 shrink-0 text-[#9A630A] mt-0.5"
                  aria-hidden="true"
                />
                <div className="space-y-1.5">
                  <p className="font-semibold text-[#9A630A]">
                    {feedback.type === 'unsupported'
                      ? 'Not supported in current demo'
                      : 'Add a problem statement'}
                  </p>
                  <p className="text-[#555D7A]">{feedback.message}</p>
                  {feedback.type === 'unsupported' && (
                    <Link
                      to="/problems"
                      className="inline-flex items-center gap-1 font-semibold text-[#4F46D8] hover:underline"
                    >
                      Browse supported interactive problems
                      <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </Link>
                  )}
                </div>
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
                  Load Valid Parentheses
                </Button>
              </div>
              <Button type="submit" variant="primary" size="md">
                Open in Studio
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
          </form>
        </Card>
      </section>

      {/* Sample Problems Section */}
      <section className="mt-16" aria-labelledby="samples-heading">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2
              id="samples-heading"
              className="text-2xl font-extrabold tracking-tight text-[#20253B]"
            >
              Sample Problems
            </h2>
            <p className="mt-1 text-sm text-[#555D7A]">
              Explore our verified interactive visual lessons. Additional patterns are planned for future sprints.
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
                      {isLive ? 'Live Demo' : 'Coming Soon'}
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
                            `${sample.title} (${sample.pattern}) is planned for a later sprint. Try Two Sum or Valid Parentheses in Learning Studio today!`,
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
            Every visual step in AlgoMiri comes from tested, deterministic logic — never unverified guesswork.
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
