import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Compass, Lock } from 'lucide-react';
import { DEMO_ROADMAP_MILESTONES } from '../domain/problems/demoCatalog';
import { DemoNotice } from '../components/DemoNotice';
import { Badge } from '../components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';

export function RoadmapPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <Compass className="h-5 w-5 text-[#645BE8]" aria-hidden="true" />
          <h1 className="text-2xl font-extrabold tracking-tight text-[#20253B] sm:text-3xl">
            Algorithm Learning Roadmap
          </h1>
          <Badge variant="demo">Demo Preview</Badge>
        </div>
        <p className="max-w-2xl text-sm leading-relaxed text-[#555D7A]">
          A structured path built around reusable problem-solving patterns and prerequisites — not memorizing random solutions.
        </p>
      </div>

      <DemoNotice
        badgeText="DEMO DATA"
        title="Roadmap preview only — personalization comes in a later phase"
        description="Stage 1 (Arrays & Hash Lookups with Two Sum) is available to explore in Learning Studio right now. Stages 2–6 preview the planned prerequisite path."
      />

      <ol className="grid gap-4 md:grid-cols-2">
        {DEMO_ROADMAP_MILESTONES.map((milestone) => {
          const isAvailable = milestone.status === 'available-demo';
          return (
            <li key={milestone.id}>
              <Card
                className={`h-full flex flex-col justify-between ${
                  isAvailable ? 'border-[#645BE8]/50' : 'opacity-95'
                }`}
              >
                <CardHeader>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-bold text-[#645BE8]">
                      Stage 0{milestone.stage}
                    </span>
                    <Badge variant={isAvailable ? 'mint' : 'neutral'}>
                      {isAvailable ? (
                        <>
                          <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                          Available Demo
                        </>
                      ) : (
                        <>
                          <Lock className="h-3 w-3" aria-hidden="true" />
                          Planned
                        </>
                      )}
                    </Badge>
                  </div>
                  <CardTitle className="mt-1 text-lg">
                    {milestone.title}
                  </CardTitle>
                </CardHeader>

                <CardContent className="flex flex-1 flex-col justify-between gap-4">
                  <p className="text-sm leading-relaxed text-[#555D7A]">
                    {milestone.description}
                  </p>

                  <div className="space-y-3 border-t border-[#E3E7F2] pt-3 text-xs">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-semibold text-[#20253B]">
                        Prerequisites:
                      </span>
                      {milestone.prerequisites.map((prereq) => (
                        <span
                          key={prereq}
                          className="rounded-md bg-[#F7F8FC] px-2 py-0.5 text-[#555D7A] border border-[#E3E7F2]"
                        >
                          {prereq}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-[#555D7A]">
                        Anchor problem:{' '}
                        <strong className="text-[#20253B]">
                          {milestone.sampleProblem}
                        </strong>
                      </span>

                      {isAvailable ? (
                        <Link
                          to="/studio"
                          className="inline-flex items-center gap-1 font-semibold text-[#645BE8] hover:text-[#4F46D8]"
                        >
                          Open Studio
                          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                        </Link>
                      ) : (
                        <span className="font-medium text-[#8B93B0]">
                          Future sprint
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
