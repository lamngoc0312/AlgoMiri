import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Compass,
  ExternalLink,
  GraduationCap,
  Layers,
  Search,
  Sparkles,
} from 'lucide-react';
import {
  EXTERNAL_REFERENCE_LINKS,
  getAllLibraryItems,
  type LibraryDifficulty,
  type ProblemAvailability,
} from '../domain/problems/libraryCatalog';
import { getTopicVisualStyle } from '../styles/topicColors';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';

type AvailabilityFilter = 'all' | ProblemAvailability;
type DifficultyFilter = 'all' | LibraryDifficulty;

export function ProblemsPage() {
  const allItems = useMemo(() => getAllLibraryItems(), []);
  const topics = useMemo(
    () => Array.from(new Set(allItems.map((item) => item.topic))).sort(),
    [allItems],
  );

  const [query, setQuery] = useState('');
  const [selectedTopic, setSelectedTopic] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] =
    useState<DifficultyFilter>('all');
  const [availabilityFilter, setAvailabilityFilter] =
    useState<AvailabilityFilter>('all');

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allItems.filter((item) => {
      if (availabilityFilter !== 'all' && item.availability !== availabilityFilter) {
        return false;
      }
      if (selectedTopic !== 'all' && item.topic !== selectedTopic) {
        return false;
      }
      if (selectedDifficulty !== 'all' && item.difficulty !== selectedDifficulty) {
        return false;
      }
      if (q) {
        const hay = `${item.title} ${item.topic} ${item.summary}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [allItems, availabilityFilter, selectedTopic, selectedDifficulty, query]);

  const verifiedItems = filteredItems.filter(
    (item) => item.availability === 'verified-studio',
  );
  const aiGuidedItems = filteredItems.filter(
    (item) => item.availability === 'ai-guided',
  );

  const hasActiveFilters =
    query.trim() !== '' ||
    selectedTopic !== 'all' ||
    selectedDifficulty !== 'all' ||
    availabilityFilter !== 'all';

  const resetFilters = () => {
    setQuery('');
    setSelectedTopic('all');
    setSelectedDifficulty('all');
    setAvailabilityFilter('all');
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <BookOpen className="h-5 w-5 text-[#2664C2]" aria-hidden="true" />
            <h1 className="text-2xl font-extrabold tracking-tight text-[#202B3B] sm:text-3xl">
              Problem Library
            </h1>
          </div>
          <p className="max-w-2xl text-base leading-relaxed text-[#526075]">
            Practice in verified deterministic visual studios, explore original AI-guided practice problems, or paste your own problem statement on the Home page.
          </p>
        </div>

        <Link
          to="/"
          className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-[#D7DCEB] bg-white px-4 text-xs font-semibold text-[#202B3B] hover:bg-[#F7F9FC]"
        >
          <Sparkles className="h-3.5 w-3.5 text-[#2664C2]" aria-hidden="true" />
          Paste Custom Problem
        </Link>
      </div>

      {/* Scalable Search & Filter Bar */}
      <Card className="p-4">
        <div className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#526075]"
              aria-hidden="true"
            />
            <label htmlFor="library-search" className="sr-only">
              Search problems
            </label>
            <input
              id="library-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by title, topic, or pattern..."
              className="h-10 w-full rounded-xl border border-[#D7DCEB] bg-[#F7F9FC] pl-9 pr-3 text-sm text-[#202B3B] placeholder:text-[#526075]/80 focus:border-[#397BDB] focus:bg-white focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <label htmlFor="topic-filter" className="sr-only">
              Filter by topic
            </label>
            <select
              id="topic-filter"
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
              aria-label="Filter by topic"
              className="h-10 rounded-xl border border-[#D7DCEB] bg-white px-3 text-xs font-semibold text-[#202B3B] focus:border-[#397BDB] focus:outline-none cursor-pointer"
            >
              <option value="all">All Topics</option>
              {topics.map((topic) => (
                <option key={topic} value={topic}>
                  {topic}
                </option>
              ))}
            </select>

            <label htmlFor="difficulty-filter" className="sr-only">
              Filter by difficulty
            </label>
            <select
              id="difficulty-filter"
              value={selectedDifficulty}
              onChange={(e) =>
                setSelectedDifficulty(e.target.value as DifficultyFilter)
              }
              aria-label="Filter by difficulty"
              className="h-10 rounded-xl border border-[#D7DCEB] bg-white px-3 text-xs font-semibold text-[#202B3B] focus:border-[#397BDB] focus:outline-none cursor-pointer"
            >
              <option value="all">All Difficulties</option>
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
            </select>
          </div>

          <div
            role="group"
            aria-label="Filter by visualization availability"
            className="inline-flex rounded-xl border border-[#E2E8F0] bg-[#F7F9FC] p-1"
          >
            {(
              [
                { id: 'all', label: 'All' },
                { id: 'verified-studio', label: 'Visual Studios' },
                { id: 'ai-guided', label: 'AI-Guided' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                aria-pressed={availabilityFilter === opt.id}
                onClick={() => setAvailabilityFilter(opt.id)}
                className={`min-h-[34px] rounded-lg px-3 text-xs font-semibold transition-colors cursor-pointer ${
                  availabilityFilter === opt.id
                    ? 'bg-[#2B6CC9] text-white shadow-2xs'
                    : 'text-[#526075] hover:text-[#202B3B]'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {hasActiveFilters && (
          <div className="mt-3 flex items-center justify-between border-t border-[#E2E8F0] pt-2.5 text-xs text-[#526075]">
            <span>
              Showing <strong>{filteredItems.length}</strong> of {allItems.length}{' '}
              problems
            </span>
            <Button variant="ghost" size="sm" onClick={resetFilters}>
              Reset filters
            </Button>
          </div>
        )}
      </Card>

      {/* Empty Filter State */}
      {filteredItems.length === 0 && (
        <Card className="p-8 text-center space-y-3">
          <p className="text-sm font-bold text-[#202B3B]">
            No library problems match your current filters.
          </p>
          <p className="text-xs text-[#526075]">
            Reset filters or paste any custom problem statement directly into the AI Problem Analyzer.
          </p>
          <div className="flex justify-center gap-2 pt-1">
            <Button variant="outline" size="sm" onClick={resetFilters}>
              Reset filters
            </Button>
            <Link
              to="/"
              className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-[#2B6CC9] px-3.5 text-xs font-semibold text-white hover:bg-[#2257A8]"
            >
              Analyze Custom Problem
            </Link>
          </div>
        </Card>
      )}

      {/* Tier 1: Verified Deterministic Visual Studios */}
      {verifiedItems.length > 0 && (
        <section
          aria-labelledby="verified-studios-heading"
          className="space-y-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2
                id="verified-studios-heading"
                className="text-lg font-extrabold tracking-tight text-[#202B3B]"
              >
                Verified Visual Studios
              </h2>
              <p className="text-xs text-[#526075]">
                Deterministic step-by-step execution traces, interactive Solution Maps, and guided checkpoints.
              </p>
            </div>
            <Badge variant="mint">{verifiedItems.length} Live</Badge>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {verifiedItems.map((problem) => {
              const topicStyle = getTopicVisualStyle(problem.topic);
              return (
                <Card
                  key={problem.id}
                  className="overflow-hidden flex flex-col justify-between"
                >
                  <div className={`h-1 w-full ${topicStyle.accentBarClass}`} aria-hidden="true" />
                  <CardHeader className="pb-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <Badge variant="teal">
                        <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                        Verified Visual
                      </Badge>
                      <span className="text-xs font-medium text-[#526075]">
                        {problem.difficulty}
                      </span>
                    </div>
                    <CardTitle className="mt-2 text-lg">{problem.title}</CardTitle>
                    <div className="pt-1">
                      <Badge variant={topicStyle.badgeVariant}>{problem.topic}</Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="flex flex-1 flex-col justify-between gap-4">
                    <p className="text-sm leading-relaxed text-[#526075]">
                      {problem.summary}
                    </p>

                    <div className="space-y-3 border-t border-[#E2E8F0] pt-3">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-[#526075]">
                        <Layers
                          className="h-3.5 w-3.5 text-[#2664C2]"
                          aria-hidden="true"
                        />
                        {problem.strategiesCount}{' '}
                        {problem.strategiesCount === 1
                          ? 'verified strategy'
                          : 'verified strategies'}{' '}
                        · {problem.stagesCount}-stage Guided Lesson
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          to={problem.studioPath ?? `/studio/${problem.id}`}
                          className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#2B6CC9] px-3 text-xs font-semibold text-white transition-colors hover:bg-[#2B64B8]"
                        >
                          <GraduationCap className="h-3.5 w-3.5" aria-hidden="true" />
                          Start Guided Lesson
                        </Link>
                        <Link
                          to={`${problem.studioPath ?? `/studio/${problem.id}`}?mode=explore`}
                          className="inline-flex h-9 items-center justify-center gap-1 rounded-xl border border-[#D7E0EC] bg-white px-3 text-xs font-semibold text-[#202B3B] transition-colors hover:bg-[#F7F9FC]"
                        >
                          <Compass className="h-3.5 w-3.5 text-[#0D7A6E]" aria-hidden="true" />
                          Explore
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      )}

      {/* Tier 2: Original AI-Guided Practice Problems */}
      {aiGuidedItems.length > 0 && (
        <section aria-labelledby="ai-guided-heading" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2
                id="ai-guided-heading"
                className="text-lg font-extrabold tracking-tight text-[#202B3B]"
              >
                Original AI-Guided Practice Problems
              </h2>
              <p className="text-xs text-[#526075]">
                Original AlgoMiri prompts for conceptual AI breakdown and Socratic tutoring (no deterministic visual engine yet).
              </p>
            </div>
            <Badge variant="indigo">Conceptual · AI-Guided</Badge>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {aiGuidedItems.map((problem) => {
              const topicStyle = getTopicVisualStyle(problem.topic);
              return (
                <Card key={problem.id} className="overflow-hidden flex flex-col justify-between">
                  <div className={`h-1 w-full ${topicStyle.accentBarClass}`} aria-hidden="true" />
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant={topicStyle.badgeVariant}>{problem.topic}</Badge>
                      <span className="text-xs font-medium text-[#526075]">
                        {problem.difficulty}
                      </span>
                    </div>
                    <CardTitle className="mt-2 text-base">
                      {problem.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-1 flex-col justify-between gap-4">
                    <p className="text-sm leading-relaxed text-[#526075]">
                      {problem.summary}
                    </p>
                    <div className="border-t border-[#E2E8F0] pt-3">
                      <Link
                        to={`/?prefill=${problem.id}`}
                        className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-xl border border-[#C2DAFA] bg-[#EAF2FD]/55 px-3 text-xs font-semibold text-[#2257A8] transition-colors hover:bg-[#EAF2FD]"
                      >
                        <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                        Analyze Conceptually
                        <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      )}

      {/* Tier 3: Compact External Reference Links (IDs/Links Only — Zero Scraped Statements) */}
      <section aria-labelledby="external-refs-heading" className="space-y-3">
        <div>
          <h2
            id="external-refs-heading"
            className="text-sm font-extrabold uppercase tracking-wider text-[#526075]"
          >
            External Practice References
          </h2>
          <p className="text-xs text-[#526075]">
            Links to related public problem IDs for independent coding practice. AlgoMiri never scrapes or hosts copyrighted problem statements.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {EXTERNAL_REFERENCE_LINKS.map((ref) => (
            <a
              key={ref.id}
              href={ref.url}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-xl border border-[#E2E8F0] bg-white px-3 py-1.5 text-xs font-semibold text-[#202B3B] transition-colors hover:border-[#397BDB]/50 hover:text-[#2257A8]"
            >
              <span>{ref.title}</span>
              <span className="font-mono text-[#526075]">
                ({ref.referenceId})
              </span>
              <ExternalLink className="h-3 w-3 text-[#526075]" aria-hidden="true" />
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
