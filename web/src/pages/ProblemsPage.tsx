import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Compass,
  GraduationCap,
  Layers,
  Lock,
} from 'lucide-react';
import { SAMPLE_PROBLEMS } from '../domain/problems/demoCatalog';
import { getProblemModule } from '../domain/problems/registry';
import { Badge } from '../components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';

export function ProblemsPage() {
  const supported = SAMPLE_PROBLEMS.filter((p) => p.status === 'live-demo');
  const unavailable = SAMPLE_PROBLEMS.filter((p) => p.status !== 'live-demo');

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <BookOpen className="h-5 w-5 text-[#645BE8]" aria-hidden="true" />
          <h1 className="text-2xl font-extrabold tracking-tight text-[#20253B] sm:text-3xl">
            Problem Library
          </h1>
          <Badge variant="mint">{supported.length} Live Interactive</Badge>
        </div>
        <p className="max-w-2xl text-sm leading-relaxed text-[#555D7A]">
          Choose a verified visual problem below. Every supported problem includes deterministic step-by-step execution traces, guided reasoning stages, progressive hints, and next-step predictions.
        </p>
      </div>

      {/* Supported Interactive Problems */}
      <section aria-labelledby="supported-problems-heading" className="space-y-4">
        <h2
          id="supported-problems-heading"
          className="text-lg font-extrabold tracking-tight text-[#20253B]"
        >
          Supported Interactive Problems
        </h2>

        <div className="grid gap-5 md:grid-cols-2">
          {supported.map((problem) => (
            <Card
              key={problem.id}
              className="flex flex-col justify-between border-[#645BE8]/40"
            >
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="mint">
                      <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                      Live Interactive
                    </Badge>
                    <Badge variant="indigo">{problem.difficulty}</Badge>
                  </div>
                  <span className="text-xs font-semibold text-[#555D7A]">
                    {problem.pattern}
                  </span>
                </div>
                <CardTitle className="mt-2 text-xl">{problem.title}</CardTitle>
              </CardHeader>

              <CardContent className="flex flex-1 flex-col justify-between gap-5">
                <p className="text-sm leading-relaxed text-[#555D7A]">
                  {problem.summary}
                </p>

                <div className="space-y-3 border-t border-[#E3E7F2] pt-4">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-[#555D7A]">
                    <Layers className="h-3.5 w-3.5 text-[#645BE8]" aria-hidden="true" />
                    {problem.strategiesCount}{' '}
                    {problem.strategiesCount === 1
                      ? 'verified strategy'
                      : 'verified strategies'}{' '}
                    ·{' '}
                    {getProblemModule(problem.id)?.lesson.stages.length ?? 4}
                    -stage Guided Lesson
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5">
                    <Link
                      to={problem.studioPath ?? `/studio/${problem.id}`}
                      className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-[#645BE8] px-4 text-xs font-semibold text-white transition-colors hover:bg-[#4F46D8]"
                    >
                      <GraduationCap className="h-4 w-4" aria-hidden="true" />
                      Start Guided Lesson
                      <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </Link>

                    <Link
                      to={`${problem.studioPath ?? `/studio/${problem.id}`}?mode=explore`}
                      className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-[#D7DCEB] bg-white px-4 text-xs font-semibold text-[#20253B] transition-colors hover:bg-[#F7F8FC]"
                    >
                      <Compass className="h-4 w-4 text-[#645BE8]" aria-hidden="true" />
                      Free Exploration
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Unavailable / Upcoming Problems */}
      <section aria-labelledby="upcoming-problems-heading" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2
            id="upcoming-problems-heading"
            className="text-lg font-extrabold tracking-tight text-[#20253B]"
          >
            Upcoming Problems (Unavailable Yet)
          </h2>
          <Badge variant="demo">Planned · Not Implemented</Badge>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {unavailable.map((problem) => (
            <Card key={problem.id} className="bg-white/75 opacity-90">
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="neutral">
                    <Lock className="h-3 w-3" aria-hidden="true" />
                    Unavailable Yet
                  </Badge>
                  <span className="text-xs font-medium text-[#555D7A]">
                    {problem.pattern}
                  </span>
                </div>
                <CardTitle className="mt-2 text-lg text-[#555D7A]">
                  {problem.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm leading-relaxed text-[#555D7A]">
                  {problem.summary}
                </p>
                <p className="text-xs font-medium text-[#555D7A]">
                  Deterministic visual engine and guided lesson planned for a future sprint.
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
