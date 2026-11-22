import { Link } from 'react-router-dom';
import { ArrowRight, Award, Calendar, CheckCircle2, TrendingUp } from 'lucide-react';
import {
  DEMO_PROGRESS_SKILLS,
  DEMO_RECENT_SESSIONS,
} from '../domain/problems/demoCatalog';
import { DemoNotice } from '../components/DemoNotice';
import { Badge } from '../components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';

export function ProgressPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <TrendingUp className="h-5 w-5 text-[#645BE8]" aria-hidden="true" />
            <h1 className="text-2xl font-extrabold tracking-tight text-[#20253B] sm:text-3xl">
              Learning Progress
            </h1>
            <Badge variant="demo">Demo Data</Badge>
          </div>
          <p className="text-sm text-[#555D7A]">
            Preview of how AlgoMiri will track reasoning skills, prediction accuracy, and review history.
          </p>
        </div>

        <Link
          to="/studio"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#645BE8] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#4F46D8]"
        >
          Practice Two Sum
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>

      <DemoNotice
        badgeText="DEMO DATA"
        title="Sample progress preview — no account or database is connected yet"
        description="All numbers below are illustrative placeholder data. In future releases, mastery will require active prediction and recall evidence — viewing a visualization alone will never count as mastery."
      />

      {/* Summary Metrics */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#555D7A]">
              Strategies Explored
            </span>
            <Award className="h-4 w-4 text-[#645BE8]" aria-hidden="true" />
          </div>
          <p className="mt-2 font-mono text-2xl font-extrabold text-[#20253B]">
            2 <span className="text-xs font-sans font-medium text-[#555D7A]">(Demo)</span>
          </p>
          <p className="mt-1 text-xs text-[#555D7A]">
            Brute Force &amp; Hash Map on Two Sum
          </p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#555D7A]">
              Prediction Checks
            </span>
            <CheckCircle2 className="h-4 w-4 text-[#16B89D]" aria-hidden="true" />
          </div>
          <p className="mt-2 font-mono text-2xl font-extrabold text-[#20253B]">
            Sprint 3
          </p>
          <p className="mt-1 text-xs text-[#555D7A]">
            Next-step prediction prompts arrive in Sprint 3
          </p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#555D7A]">
              Account Sync
            </span>
            <Calendar className="h-4 w-4 text-[#F1B34C]" aria-hidden="true" />
          </div>
          <p className="mt-2 font-mono text-2xl font-extrabold text-[#20253B]">
            Local Only
          </p>
          <p className="mt-1 text-xs text-[#555D7A]">
            No login or remote persistence in v0.1
          </p>
        </Card>
      </div>

      {/* Demo Skill Mastery Bars */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle>Skill Evidence Preview</CardTitle>
            <Badge variant="demo">Illustrative Sample</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {DEMO_PROGRESS_SKILLS.map((item) => (
            <div key={item.skill} className="space-y-1.5">
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className="font-semibold text-[#20253B]">{item.skill}</span>
                <span className="font-mono text-xs font-semibold text-[#4F46D8]">
                  {item.levelLabel} · {item.progressPercent}%
                </span>
              </div>
              <div
                role="progressbar"
                aria-label={`${item.skill} demo progress`}
                aria-valuenow={item.progressPercent}
                aria-valuemin={0}
                aria-valuemax={100}
                className="h-2.5 w-full overflow-hidden rounded-full bg-[#EEF0FF]"
              >
                <div
                  className="h-full rounded-full bg-[#645BE8]"
                  style={{ width: `${item.progressPercent}%` }}
                />
              </div>
              <p className="text-xs text-[#555D7A]">{item.evidenceNote}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Demo Activity Log */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <CardTitle>Recent Activity (Demo)</CardTitle>
            <Badge variant="neutral">Sample entries</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <ul className="divide-y divide-[#E3E7F2]">
            {DEMO_RECENT_SESSIONS.map((session) => (
              <li
                key={session.id}
                className="flex flex-wrap items-center justify-between gap-2 py-3 first:pt-0 last:pb-0 text-sm"
              >
                <div>
                  <p className="font-semibold text-[#20253B]">
                    {session.problem}{' '}
                    <span className="font-normal text-[#555D7A]">
                      — {session.strategy}
                    </span>
                  </p>
                  <p className="text-xs text-[#555D7A]">{session.outcome}</p>
                </div>
                <span className="text-xs font-medium text-[#8B93B0]">
                  {session.dateLabel}
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
