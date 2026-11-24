import { useState, type KeyboardEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  GitBranch,
  Info,
  List,
  Network,
  Sparkles,
} from 'lucide-react';
import type {
  RoadmapSkillNode,
  RoadmapSkillStatus,
} from '../../domain/learning/roadmapEngine';
import {
  getPrerequisiteRationale,
  type SkillGraphValidationResult,
} from '../../domain/learning/skillGraph';
import { getSkillDefinition } from '../../domain/learning/skills';
import type { SkillId } from '../../domain/learning/types';
import { getProblemModule } from '../../domain/problems/registry';
import { Badge } from '../../components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';

interface InteractiveSkillMapProps {
  skillNodes: RoadmapSkillNode[];
  graphValidation: SkillGraphValidationResult;
  recommendedSkillIds: SkillId[];
}

const LAYER_TITLES = [
  'Foundations',
  'Core Techniques',
  'Optimization & Analysis',
  'Composition',
];

function badgeVariantForStatus(
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

function nodeBorderClasses(
  status: RoadmapSkillStatus,
  isSelected: boolean,
  isRecommended: boolean,
): string {
  if (isSelected) {
    return 'border-[#645BE8] bg-[#EEF0FF]/70 ring-2 ring-[#645BE8]/35';
  }
  if (isRecommended) {
    return 'border-[#645BE8]/70 bg-[#EEF0FF]/35 hover:bg-[#EEF0FF]/60';
  }
  switch (status) {
    case 'Strong Guided Recall':
      return 'border-[#16B89D]/60 bg-[#E6F8F4]/45 hover:bg-[#E6F8F4]/75';
    case 'Needs Practice':
      return 'border-[#F1B34C] bg-[#FEF6E6]/65 hover:bg-[#FEF6E6]';
    case 'Guided Progress':
      return 'border-[#D8DCFF] bg-white hover:bg-[#F7F8FC]';
    default:
      return 'border-[#E3E7F2] bg-white hover:bg-[#F7F8FC]';
  }
}

export function InteractiveSkillMap({
  skillNodes,
  graphValidation,
  recommendedSkillIds,
}: InteractiveSkillMapProps) {
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const defaultSelectedId: SkillId =
    recommendedSkillIds[0] ?? skillNodes[0]?.skill.id ?? 'array-indexing';
  const [selectedSkillId, setSelectedSkillId] =
    useState<SkillId>(defaultSelectedId);

  const nodeById = new Map<SkillId, RoadmapSkillNode>(
    skillNodes.map((n) => [n.skill.id, n]),
  );
  const selectedNode =
    nodeById.get(selectedSkillId) ?? skillNodes[0];

  const orderedIds = graphValidation.topologicalOrder;

  const handleNodeKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    currentId: SkillId,
  ) => {
    const idx = orderedIds.indexOf(currentId);
    if (idx === -1) return;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault();
      const nextId = orderedIds[(idx + 1) % orderedIds.length];
      setSelectedSkillId(nextId);
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault();
      const prevId =
        orderedIds[(idx - 1 + orderedIds.length) % orderedIds.length];
      setSelectedSkillId(prevId);
    }
  };

  return (
    <Card>
      <CardHeader className="border-b border-[#E3E7F2]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <GitBranch className="h-4 w-4 text-[#645BE8]" aria-hidden="true" />
              <CardTitle>Interactive Skill Prerequisite Map</CardTitle>
              <Badge variant="neutral">Conceptual Dependencies</Badge>
            </div>
            <p className="text-xs leading-relaxed text-[#555D7A]">
              Shows genuine learning prerequisites between concepts (not an algorithm execution trace). Select any skill with mouse or arrow keys to inspect its evidence, dependencies, and linked Studios.
            </p>
          </div>

          <div
            role="group"
            aria-label="Skill map view mode"
            className="inline-flex rounded-xl border border-[#E3E7F2] bg-[#F7F8FC] p-0.5"
          >
            <button
              type="button"
              aria-pressed={viewMode === 'map'}
              onClick={() => setViewMode('map')}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                viewMode === 'map'
                  ? 'bg-[#645BE8] text-white shadow-2xs'
                  : 'text-[#555D7A] hover:text-[#20253B]'
              }`}
            >
              <Network className="h-3.5 w-3.5" aria-hidden="true" />
              Visual Map
            </button>
            <button
              type="button"
              aria-pressed={viewMode === 'list'}
              onClick={() => setViewMode('list')}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-[#645BE8] text-white shadow-2xs'
                  : 'text-[#555D7A] hover:text-[#20253B]'
              }`}
            >
              <List className="h-3.5 w-3.5" aria-hidden="true" />
              Accessible List
            </button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-5 space-y-5">
        <div className="grid gap-5 lg:grid-cols-[1.45fr_0.95fr] lg:items-start">
          {/* Left: Layered Visual DAG or Readable List Fallback */}
          {viewMode === 'map' ? (
            <div
              role="region"
              aria-label="Layered skill prerequisite map"
              className="space-y-4"
            >
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {graphValidation.layers.map((layerIds, layerIndex) => (
                  <div
                    key={layerIndex}
                    className="rounded-2xl border border-[#E3E7F2] bg-[#F7F8FC]/60 p-3 space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#555D7A]">
                        Layer {layerIndex + 1} ·{' '}
                        {LAYER_TITLES[layerIndex] ?? 'Advanced'}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {layerIds.map((skillId) => {
                        const node = nodeById.get(skillId);
                        if (!node) return null;
                        const isSelected = selectedNode?.skill.id === skillId;
                        const isRecommended = node.isRecommendedGoal;
                        const isRelatedToSelected =
                          selectedNode &&
                          (selectedNode.prerequisites.includes(skillId) ||
                            selectedNode.dependents.includes(skillId));

                        return (
                          <button
                            key={skillId}
                            type="button"
                            aria-pressed={isSelected}
                            onClick={() => setSelectedSkillId(skillId)}
                            onKeyDown={(e) => handleNodeKeyDown(e, skillId)}
                            className={`w-full rounded-xl border p-3 text-left transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#645BE8] ${nodeBorderClasses(
                              node.status,
                              isSelected,
                              isRecommended,
                            )} ${
                              isRelatedToSelected && !isSelected
                                ? 'ring-1 ring-[#645BE8]/45'
                                : ''
                            }`}
                          >
                            <div className="flex items-start justify-between gap-1.5">
                              <span className="text-xs font-bold text-[#20253B] leading-snug">
                                {node.skill.name}
                              </span>
                              {isRecommended && (
                                <Sparkles
                                  className="h-3.5 w-3.5 shrink-0 text-[#645BE8]"
                                  aria-label="Recommended goal"
                                />
                              )}
                            </div>

                            <div className="mt-1.5 flex flex-wrap items-center gap-1">
                              <Badge
                                variant={badgeVariantForStatus(node.status)}
                                className="text-[10px] px-2 py-0"
                              >
                                {node.status}
                              </Badge>
                              {isRecommended && (
                                <Badge
                                  variant="indigo"
                                  className="text-[10px] px-1.5 py-0"
                                >
                                  Goal
                                </Badge>
                              )}
                            </div>

                            {node.prerequisites.length > 0 ? (
                              <p className="mt-2 text-[10px] text-[#555D7A] leading-tight">
                                Needs:{' '}
                                {node.prerequisites
                                  .map((id) => getSkillDefinition(id).name)
                                  .join(', ')}
                              </p>
                            ) : (
                              <p className="mt-2 text-[10px] text-[#0D7D6A] font-medium">
                                Independent foundation
                              </p>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div
              role="region"
              aria-label="Accessible skill prerequisite list"
              className="space-y-2.5"
            >
              <ol className="space-y-2">
                {orderedIds.map((skillId) => {
                  const node = nodeById.get(skillId);
                  if (!node) return null;
                  const isSelected = selectedNode?.skill.id === skillId;

                  return (
                    <li
                      key={skillId}
                      className={`rounded-xl border p-3.5 transition-colors ${nodeBorderClasses(
                        node.status,
                        isSelected,
                        node.isRecommendedGoal,
                      )}`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-bold text-[#20253B]">
                            {node.skill.name}
                          </span>
                          <Badge variant={badgeVariantForStatus(node.status)}>
                            {node.status}
                          </Badge>
                          {node.isRecommendedGoal && (
                            <Badge variant="indigo">Recommended Goal</Badge>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedSkillId(skillId)}
                          className="text-xs font-semibold text-[#645BE8] hover:underline cursor-pointer"
                        >
                          {isSelected ? 'Inspecting' : 'Inspect details'}
                        </button>
                      </div>
                      <p className="mt-1 text-xs text-[#555D7A]">
                        {node.skill.description}
                      </p>
                      <p className="mt-1.5 text-[11px] text-[#555D7A]">
                        <strong>Prerequisites:</strong>{' '}
                        {node.prerequisites.length > 0
                          ? node.prerequisites
                              .map((id) => getSkillDefinition(id).name)
                              .join(', ')
                          : 'None (independent foundation)'}
                        {node.dependents.length > 0 && (
                          <>
                            {' · '}
                            <strong>Unlocks:</strong>{' '}
                            {node.dependents
                              .map((id) => getSkillDefinition(id).name)
                              .join(', ')}
                          </>
                        )}
                      </p>
                    </li>
                  );
                })}
              </ol>
            </div>
          )}

          {/* Right: Live Skill Inspector Panel */}
          {selectedNode && (
            <aside
              aria-label={`Skill details for ${selectedNode.skill.name}`}
              className="rounded-2xl border border-[#D8DCFF] bg-[#F7F8FC] p-4 space-y-4"
            >
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#555D7A]">
                    {selectedNode.skill.category}
                  </span>
                  <Badge variant={badgeVariantForStatus(selectedNode.status)}>
                    {selectedNode.status}
                  </Badge>
                </div>
                <h3 className="text-base font-extrabold text-[#20253B]">
                  {selectedNode.skill.name}
                </h3>
                <p className="text-xs leading-relaxed text-[#555D7A]">
                  {selectedNode.skill.description}
                </p>
              </div>

              {/* Status Reason & Contradiction Warning */}
              <div className="rounded-xl border border-[#E3E7F2] bg-white p-3 space-y-1.5 text-xs">
                <p className="font-semibold text-[#20253B]">
                  Recorded Evidence
                </p>
                <p className="text-[#555D7A] leading-relaxed">
                  {selectedNode.statusReason}
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1 font-mono text-[10px] text-[#555D7A]">
                  <span className="rounded bg-[#F7F8FC] px-1.5 py-0.5 border border-[#E3E7F2]">
                    First-try: {selectedNode.firstTryCount}
                  </span>
                  <span className="rounded bg-[#F7F8FC] px-1.5 py-0.5 border border-[#E3E7F2]">
                    Assisted: {selectedNode.assistedCount}
                  </span>
                  <span className="rounded bg-[#F7F8FC] px-1.5 py-0.5 border border-[#E3E7F2]">
                    Mistakes/Retries: {selectedNode.unresolvedOrWrongCount}
                  </span>
                  <span className="rounded bg-[#F7F8FC] px-1.5 py-0.5 border border-[#E3E7F2]">
                    Skips: {selectedNode.skippedCount}
                  </span>
                  <span className="rounded bg-[#F7F8FC] px-1.5 py-0.5 border border-[#E3E7F2]">
                    Hints: {selectedNode.hintsAssociated}
                  </span>
                </div>
                {selectedNode.hasContradictoryEvidence &&
                  selectedNode.contradictionNote && (
                    <div className="mt-2 flex items-start gap-1.5 rounded-lg border border-[#F1B34C] bg-[#FEF6E6] p-2 text-[11px] text-[#9A630A]">
                      <AlertTriangle
                        className="h-3.5 w-3.5 shrink-0 mt-0.5"
                        aria-hidden="true"
                      />
                      <span>{selectedNode.contradictionNote}</span>
                    </div>
                  )}
              </div>

              {/* Prerequisites with Rationale */}
              <div className="space-y-2">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#555D7A]">
                  Prerequisites ({selectedNode.prerequisites.length})
                </h4>
                {selectedNode.prerequisites.length > 0 ? (
                  <ul className="space-y-1.5">
                    {selectedNode.prerequisites.map((prereqId) => {
                      const preNode = nodeById.get(prereqId);
                      const rationale = getPrerequisiteRationale(
                        prereqId,
                        selectedNode.skill.id,
                      );
                      return (
                        <li
                          key={prereqId}
                          className="rounded-xl border border-[#E3E7F2] bg-white p-2.5 text-xs space-y-1"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <button
                              type="button"
                              onClick={() => setSelectedSkillId(prereqId)}
                              className="font-bold text-[#4F46D8] hover:underline cursor-pointer"
                            >
                              {getSkillDefinition(prereqId).name}
                            </button>
                            {preNode && (
                              <Badge
                                variant={badgeVariantForStatus(preNode.status)}
                                className="text-[10px]"
                              >
                                {preNode.status}
                              </Badge>
                            )}
                          </div>
                          {rationale && (
                            <p className="text-[11px] text-[#555D7A]">
                              {rationale}
                            </p>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="flex items-center gap-1.5 text-xs text-[#0D7D6A]">
                    <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                    Independent foundation — no prerequisites required.
                  </p>
                )}
              </div>

              {/* Dependent Skills */}
              {selectedNode.dependents.length > 0 && (
                <div className="space-y-1.5">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#555D7A]">
                    Prepares You For
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedNode.dependents.map((depId) => (
                      <button
                        key={depId}
                        type="button"
                        onClick={() => setSelectedSkillId(depId)}
                        className="rounded-lg border border-[#D8DCFF] bg-white px-2.5 py-1 text-xs font-semibold text-[#4F46D8] hover:bg-[#EEF0FF] cursor-pointer"
                      >
                        {getSkillDefinition(depId).name} &rarr;
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Direct Studio Links */}
              <div className="space-y-1.5 border-t border-[#E3E7F2] pt-3">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#555D7A]">
                  Practice in Verified Studio
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selectedNode.skill.relatedProblemIds.map((problemId) => {
                    const mod = getProblemModule(problemId);
                    return (
                      <Link
                        key={problemId}
                        to={`/studio/${problemId}`}
                        className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-[#645BE8] px-3 text-xs font-semibold text-white transition-colors hover:bg-[#4F46D8]"
                      >
                        Open {mod?.spec.title ?? problemId}
                        <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                      </Link>
                    );
                  })}
                </div>
              </div>
            </aside>
          )}
        </div>

        <div className="flex items-start gap-2 rounded-xl border border-[#E3E7F2] bg-[#F7F8FC] px-3.5 py-2.5 text-[11px] text-[#555D7A]">
          <Info className="h-3.5 w-3.5 shrink-0 text-[#645BE8] mt-0.5" aria-hidden="true" />
          <p>
            <strong>Cautious labels:</strong> &ldquo;Strong Guided Recall&rdquo; reflects consistent first-try answers inside Guided Learning and trace predictions — it does <strong>not</strong> claim independent mastery without a future unassisted assessment.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
