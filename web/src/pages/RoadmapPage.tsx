import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Compass,
  HardDrive,
  Info,
  Layers,
  Lock,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import {
  buildPersonalizedRoadmap,
  type RoadmapSkillStatus,
} from '../domain/learning/roadmapEngine';
import { getSkillDefinition } from '../domain/learning/skills';
import { DEMO_ROADMAP_MILESTONES } from '../domain/problems/demoCatalog';
import {
  defaultLearningRepository,
  type LearningRepository,
} from '../services/learningRepository';
import { InteractiveSkillMap } from '../features/roadmap/InteractiveSkillMap';
import { Badge } from '../components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';

interface RoadmapPageProps {
  repository?: LearningRepository;
}

function statusBadgeVariant(
  status: RoadmapSkillStatus,
): 'mint' | 'indigo' | 'amber' | 'neutral' {
  switch (status) {
    case 'Strong Guided Recall':
      return 'mint';
    case 'Guided Progress':
      return 'indigo';
    case 'Needs Practice':
      return 'amber';
    default:
      return 'neutral';
  }
}

export function RoadmapPage({
  repository = defaultLearningRepository,
}: RoadmapPageProps) {
  const [loadState] = useState(() => repository.loadSessions());
  const roadmap = useMemo(
    () => buildPersonalizedRoadmap(loadState.sessions),
    [loadState.sessions],
  );

  const plannedMilestones = DEMO_ROADMAP_MILESTONES.filter(
    (m) => m.status === 'planned',
  );

  const { recommendedNext } = roadmap;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <Compass className="h-5 w-5 text-[#645BE8]" aria-hidden="true" />
            <h1 className="text-2xl font-extrabold tracking-tight text-[#20253B] sm:text-3xl">
              Algorithm Learning Roadmap
            </h1>
            <Badge variant="indigo">
              <HardDrive className="h-3 w-3" aria-hidden="true" />
              Personalized · Local History
            </Badge>
            <Badge variant="neutral">Deterministic Rules</Badge>
          </div>
          <p className="max-w-2xl text-sm leading-relaxed text-[#555D7A]">
            Your next steps and skill prerequisites adapted transparently from your locally recorded Guided Learning and trace prediction evidence. All verified Studios remain open anytime.
          </p>
        </div>

        <Link
          to="/progress"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#D7DCEB] bg-white px-4 text-sm font-semibold text-[#20253B] transition-colors hover:bg-[#F7F8FC]"
        >
          <TrendingUp className="h-4 w-4 text-[#645BE8]" aria-hidden="true" />
          View Progress History
        </Link>
      </div>

      {/* Transparent Local-Only & Non-Mastery Notice */}
      <div
        role="note"
        className="flex items-start gap-2.5 rounded-2xl border border-[#D8DCFF] bg-[#EEF0FF]/55 px-4 py-3 text-xs leading-relaxed text-[#20253B]"
      >
        <Info
          className="h-4 w-4 shrink-0 text-[#4F46D8] mt-0.5"
          aria-hidden="true"
        />
        <p>
          <strong>Transparent local roadmap:</strong>{' '}
          {roadmap.isFirstTimeLearner
            ? 'No saved sessions yet in this browser — showing the recommended beginner starting path. Complete or finalize a Guided Learning session to personalize your path.'
            : `Personalized from ${roadmap.totalSessions} locally saved session${roadmap.totalSessions === 1 ? '' : 's'} in this browser (not synced across devices). Recommendations use deterministic rules over verified attempts — never AI mastery scores or viewing-only counts.`}
        </p>
      </div>

      {loadState.warningMessage && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-[#F1B34C] bg-[#FEF6E6] px-4 py-3 text-xs text-[#9A630A]"
        >
          <AlertTriangle
            className="h-4 w-4 shrink-0 mt-0.5"
            aria-hidden="true"
          />
          <span>{loadState.warningMessage}</span>
        </div>
      )}

      {/* Recommended Next Activity Hero Card */}
      <section aria-labelledby="recommended-next-heading">
        <Card className="border-2 border-[#645BE8]/50 bg-gradient-to-br from-white to-[#EEF0FF]/45">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Sparkles
                  className="h-4 w-4 text-[#645BE8]"
                  aria-hidden="true"
                />
                <span className="text-xs font-bold uppercase tracking-wider text-[#4F46D8]">
                  Recommended Next Activity
                </span>
              </div>
              <Badge variant="indigo">
                {roadmap.isFirstTimeLearner
                  ? 'Beginner Starting Path'
                  : recommendedNext.category === 'review-weak-skill' ||
                      recommendedNext.category === 'verify-recall'
                    ? 'Targeted Review'
                    : recommendedNext.category === 'resume-lesson'
                      ? 'Incomplete Stages'
                      : 'Next Milestone'}
              </Badge>
            </div>
            <CardTitle
              id="recommended-next-heading"
              className="text-xl sm:text-2xl mt-1"
            >
              {recommendedNext.title}
            </CardTitle>
            <p className="text-sm leading-relaxed text-[#555D7A]">
              {recommendedNext.summary}
            </p>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Explicit Explanation of Why Recommended */}
            <div className="rounded-xl border border-[#D8DCFF] bg-white p-4 space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#4F46D8]">
                Why this was recommended
              </h3>
              <ul className="space-y-1.5 text-xs leading-relaxed text-[#20253B]">
                {recommendedNext.whyBullets.map((bullet) => (
                  <li key={bullet} className="flex items-start gap-2">
                    <CheckCircle2
                      className="h-3.5 w-3.5 shrink-0 text-[#16B89D] mt-0.5"
                      aria-hidden="true"
                    />
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
              {recommendedNext.focusSkills.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[11px] font-semibold text-[#555D7A]">
                    Focus skills:
                  </span>
                  {recommendedNext.focusSkills.map((skillId) => (
                    <Badge key={skillId} variant="indigo">
                      {getSkillDefinition(skillId).name}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Primary CTA + Alternative Verified Problems (never locked out) */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <Link
                to={recommendedNext.targetPath}
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#645BE8] px-5 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-[#4F46D8]"
              >
                {recommendedNext.ctaLabel}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>

              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="font-semibold text-[#555D7A]">
                  Or choose another Studio:
                </span>
                {roadmap.alternativeActivities.map((alt) => (
                  <Link
                    key={alt.id}
                    to={alt.targetPath}
                    className="inline-flex h-9 items-center gap-1 rounded-xl border border-[#D7DCEB] bg-white px-3 font-semibold text-[#20253B] transition-colors hover:bg-[#F7F8FC]"
                  >
                    {alt.ctaLabel}
                  </Link>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Interactive Accessible Skill Prerequisite Map */}
      <section aria-label="Skill prerequisite map">
        <InteractiveSkillMap
          skillNodes={roadmap.skillNodes}
          graphValidation={roadmap.graphValidation}
          recommendedSkillIds={recommendedNext.focusSkills}
        />
      </section>

      {/* Current Learning Path Across Verified Studios */}
      <section aria-labelledby="learning-path-heading" className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2
              id="learning-path-heading"
              className="text-xl font-extrabold tracking-tight text-[#20253B]"
            >
              Current Learning Path
            </h2>
            <p className="text-xs text-[#555D7A]">
              All 3 verified interactive Studios are open anytime — prerequisites are shown as guidance, never lockouts.
            </p>
          </div>
          <Link
            to="/problems"
            className="text-xs font-semibold text-[#645BE8] hover:underline"
          >
            Browse Problem Library &rarr;
          </Link>
        </div>

        <ol className="grid gap-4 md:grid-cols-3">
          {roadmap.learningPath.map((step, idx) => (
            <li key={step.problemId}>
              <Card
                className={`h-full flex flex-col justify-between ${
                  step.isRecommendedNext
                    ? 'border-2 border-[#645BE8]/70'
                    : 'border-[#E3E7F2]'
                }`}
              >
                <CardHeader>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-mono text-xs font-bold text-[#645BE8]">
                      Step 0{idx + 1} · {step.difficulty}
                    </span>
                    <Badge variant={statusBadgeVariant(step.status)}>
                      {step.status}
                    </Badge>
                  </div>
                  <CardTitle className="mt-1 text-lg flex items-center gap-2">
                    {step.problemTitle}
                    {step.isRecommendedNext && (
                      <Badge variant="indigo" className="text-[10px]">
                        Next
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>

                <CardContent className="flex flex-1 flex-col justify-between gap-4">
                  <div className="space-y-3 text-xs">
                    <p className="text-[#555D7A] leading-relaxed">{step.note}</p>

                    <div>
                      <p className="font-semibold text-[#20253B]">
                        Skills practiced:
                      </p>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {step.focusSkills.map((skillId) => (
                          <span
                            key={skillId}
                            className="rounded-md border border-[#E3E7F2] bg-[#F7F8FC] px-2 py-0.5 text-[11px] text-[#20253B]"
                          >
                            {getSkillDefinition(skillId).name}
                          </span>
                        ))}
                      </div>
                    </div>

                    {step.prerequisiteSkills.length > 0 && (
                      <div>
                        <p className="font-semibold text-[#20253B]">
                          Suggested prerequisites:
                        </p>
                        <p className="mt-0.5 text-[11px] text-[#555D7A]">
                          {step.prerequisiteSkills
                            .map((id) => getSkillDefinition(id).name)
                            .join(', ')}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-[#E3E7F2] pt-3">
                    <Link
                      to={step.studioPath}
                      className={`inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-xl text-xs font-semibold transition-colors ${
                        step.isRecommendedNext
                          ? 'bg-[#645BE8] text-white hover:bg-[#4F46D8]'
                          : 'border border-[#D7DCEB] bg-[#F7F8FC] text-[#4F46D8] hover:bg-[#EEF0FF]'
                      }`}
                    >
                      {step.ctaLabel}
                      <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </li>
          ))}
        </ol>
      </section>

      {/* Skills Needing Review & Previously Practiced Concepts */}
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <AlertTriangle
                  className="h-4 w-4 text-[#C28219]"
                  aria-hidden="true"
                />
                <CardTitle>Skills Needing Review</CardTitle>
              </div>
              <Badge
                variant={
                  roadmap.skillsNeedingReview.length > 0 ? 'amber' : 'mint'
                }
              >
                {roadmap.skillsNeedingReview.length > 0
                  ? `${roadmap.skillsNeedingReview.length} to review`
                  : 'None flagged'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {roadmap.skillsNeedingReview.length > 0 ? (
              <ul className="space-y-3">
                {roadmap.skillsNeedingReview.map((node) => (
                  <li
                    key={node.skill.id}
                    className="rounded-xl border border-[#F1B34C]/60 bg-[#FEF6E6]/60 p-3.5 space-y-1.5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-sm font-bold text-[#20253B]">
                        {node.skill.name}
                      </span>
                      <Badge variant="amber">{node.status}</Badge>
                    </div>
                    <p className="text-xs text-[#555D7A] leading-relaxed">
                      {node.statusReason}
                    </p>
                    <Link
                      to={node.skill.recommendedStudioPath}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[#9A630A] hover:underline"
                    >
                      Review in Studio
                      <ArrowRight className="h-3 w-3" aria-hidden="true" />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs leading-relaxed text-[#555D7A]">
                {roadmap.isFirstTimeLearner
                  ? 'No skills flagged for review yet — start a Guided Learning session to collect real evidence.'
                  : 'No skills are currently flagged for repeated mistakes, heavy hint reliance, or contradictory evidence.'}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <BookOpen
                  className="h-4 w-4 text-[#16B89D]"
                  aria-hidden="true"
                />
                <CardTitle>Previously Practiced Concepts</CardTitle>
              </div>
              <Badge variant="indigo">
                {roadmap.practicedSkills.length} / {roadmap.skillNodes.length}{' '}
                active
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {roadmap.practicedSkills.length > 0 ? (
              <ul className="space-y-2.5">
                {roadmap.practicedSkills.map((node) => (
                  <li
                    key={node.skill.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#E3E7F2] bg-[#F7F8FC] px-3.5 py-2.5 text-xs"
                  >
                    <div>
                      <p className="font-bold text-[#20253B]">
                        {node.skill.name}
                      </p>
                      <p className="text-[11px] text-[#555D7A]">
                        {node.firstTryCount} first-try · {node.assistedCount}{' '}
                        assisted · {node.skippedCount} skipped
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={statusBadgeVariant(node.status)}>
                        {node.status}
                      </Badge>
                      <Link
                        to={node.skill.recommendedStudioPath}
                        className="font-semibold text-[#645BE8] hover:underline"
                      >
                        Revisit
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs leading-relaxed text-[#555D7A]">
                No concepts have active check or prediction evidence yet. Viewing a visualization alone introduces a concept, while answering stage checks and trace predictions records real practice.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Future Planned Curriculum (clearly separated from live verified Studios) */}
      <Card className="border-dashed border-[#D7DCEB]">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <Layers className="h-4 w-4 text-[#555D7A]" aria-hidden="true" />
              <CardTitle className="text-base">
                Planned Future Topics (Not Implemented Yet)
              </CardTitle>
            </div>
            <Badge variant="neutral">Future Sprints</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <ul className="grid gap-3 md:grid-cols-3 text-xs">
            {plannedMilestones.map((m) => (
              <li
                key={m.id}
                className="rounded-xl border border-[#E3E7F2] bg-[#F7F8FC]/60 p-3.5 space-y-1.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-[#20253B]">{m.title}</span>
                  <Lock
                    className="h-3.5 w-3.5 text-[#8B93B0]"
                    aria-hidden="true"
                  />
                </div>
                <p className="text-[#555D7A] leading-relaxed">{m.description}</p>
                <p className="text-[11px] text-[#8B93B0]">
                  Planned anchor: {m.sampleProblem}
                </p>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
