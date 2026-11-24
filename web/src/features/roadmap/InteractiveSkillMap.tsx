import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react';
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
  SKILL_PREREQUISITE_EDGES,
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

interface ConnectorLine {
  id: string;
  source: SkillId;
  target: SkillId;
  path: string;
}

const LAYER_TITLES = [
  'Foundations',
  'Core Patterns',
  'Optimization',
  'Answer Search',
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
  const [connectors, setConnectors] = useState<ConnectorLine[]>([]);
  const [svgSize, setSvgSize] = useState<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const nodeButtonRefs = useRef<Partial<Record<SkillId, HTMLButtonElement | null>>>(
    {},
  );

  const nodeById = new Map<SkillId, RoadmapSkillNode>(
    skillNodes.map((n) => [n.skill.id, n]),
  );
  const selectedNode = nodeById.get(selectedSkillId) ?? skillNodes[0];

  const orderedIds = graphValidation.topologicalOrder;

  const computeConnectors = useCallback(() => {
    const container = mapContainerRef.current;
    if (!container || viewMode !== 'map') {
      setConnectors([]);
      return;
    }
    const containerRect = container.getBoundingClientRect();
    if (containerRect.width === 0 || containerRect.height === 0) {
      setConnectors([]);
      return;
    }

    const nextLines: ConnectorLine[] = [];
    for (const edge of SKILL_PREREQUISITE_EDGES) {
      const sourceEl = nodeButtonRefs.current[edge.source];
      const targetEl = nodeButtonRefs.current[edge.target];
      if (!sourceEl || !targetEl) continue;

      const sRect = sourceEl.getBoundingClientRect();
      const tRect = targetEl.getBoundingClientRect();
      // Only draw horizontal Bezier connectors when target sits to the right of source (desktop multi-column layout)
      if (tRect.left <= sRect.right - 4) continue;

      const x1 = sRect.right - containerRect.left;
      const y1 = sRect.top + sRect.height / 2 - containerRect.top;
      const x2 = tRect.left - containerRect.left;
      const y2 = tRect.top + tRect.height / 2 - containerRect.top;
      const dx = Math.max(24, (x2 - x1) * 0.48);

      nextLines.push({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        path: `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`,
      });
    }

    setSvgSize({
      width: Math.ceil(containerRect.width),
      height: Math.ceil(containerRect.height),
    });
    setConnectors(nextLines);
  }, [viewMode]);

  useLayoutEffect(() => {
    computeConnectors();
    const container = mapContainerRef.current;
    if (!container || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => computeConnectors());
    observer.observe(container);
    return () => observer.disconnect();
  }, [computeConnectors, skillNodes]);

  const selectAndFocusSkill = (nextId: SkillId) => {
    setSelectedSkillId(nextId);
    nodeButtonRefs.current[nextId]?.focus();
  };

  const handleNodeKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    currentId: SkillId,
  ) => {
    const idx = orderedIds.indexOf(currentId);
    if (idx === -1) return;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault();
      selectAndFocusSkill(orderedIds[(idx + 1) % orderedIds.length]);
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault();
      selectAndFocusSkill(
        orderedIds[(idx - 1 + orderedIds.length) % orderedIds.length],
      );
    } else if (event.key === 'Home') {
      event.preventDefault();
      selectAndFocusSkill(orderedIds[0]);
    } else if (event.key === 'End') {
      event.preventDefault();
      selectAndFocusSkill(orderedIds[orderedIds.length - 1]);
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
              Shows genuine learning prerequisites between concepts (not an algorithm execution trace). Select any skill with mouse or arrow keys to highlight its connections, evidence, and linked Studios.
            </p>
          </div>

          <div
            role="group"
            aria-label="Skill map view mode"
            className="inline-flex rounded-xl border border-[#E3E7F2] bg-[#F7F8FC] p-1"
          >
            <button
              type="button"
              aria-pressed={viewMode === 'map'}
              onClick={() => setViewMode('map')}
              className={`inline-flex min-h-[36px] items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
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
              className={`inline-flex min-h-[36px] items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
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
        {/* Top: Full-width 5-layer Prerequisite Flow (no awkward 5th-layer wrap on desktop!) or Accessible List */}
        {viewMode === 'map' ? (
          <div
            ref={mapContainerRef}
            role="region"
            aria-label="Layered skill prerequisite map"
            className="relative"
          >
            {/* Subtle SVG prerequisite connectors on multi-column desktop layouts */}
            {connectors.length > 0 && (
              <svg
                aria-hidden="true"
                width={svgSize.width}
                height={svgSize.height}
                className="pointer-events-none absolute inset-0 z-0 overflow-visible"
              >
                <defs>
                  <marker
                    id="skill-arrow-muted"
                    viewBox="0 0 8 8"
                    refX="7"
                    refY="4"
                    markerWidth="5"
                    markerHeight="5"
                    orient="auto-start-reverse"
                  >
                    <path d="M 0 1 L 7 4 L 0 7 z" fill="#B8C0E0" />
                  </marker>
                  <marker
                    id="skill-arrow-active"
                    viewBox="0 0 8 8"
                    refX="7"
                    refY="4"
                    markerWidth="6"
                    markerHeight="6"
                    orient="auto-start-reverse"
                  >
                    <path d="M 0 1 L 7 4 L 0 7 z" fill="#645BE8" />
                  </marker>
                </defs>
                {connectors.map((line) => {
                  const isHighlighted =
                    selectedNode &&
                    (line.source === selectedNode.skill.id ||
                      line.target === selectedNode.skill.id);
                  return (
                    <path
                      key={line.id}
                      d={line.path}
                      fill="none"
                      stroke={isHighlighted ? '#645BE8' : '#C5CCE8'}
                      strokeWidth={isHighlighted ? 2.25 : 1.5}
                      strokeOpacity={isHighlighted ? 0.9 : 0.65}
                      markerEnd={
                        isHighlighted
                          ? 'url(#skill-arrow-active)'
                          : 'url(#skill-arrow-muted)'
                      }
                    />
                  );
                })}
              </svg>
            )}

            <div className="relative z-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {graphValidation.layers.map((layerIds, layerIndex) => (
                <div
                  key={layerIndex}
                  className="rounded-2xl border border-[#E3E7F2] bg-[#F7F8FC]/75 p-3 space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#555D7A]">
                      {layerIndex + 1}. {LAYER_TITLES[layerIndex] ?? 'Advanced'}
                    </span>
                  </div>

                  <div className="space-y-2.5">
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
                          ref={(el) => {
                            nodeButtonRefs.current[skillId] = el;
                          }}
                          type="button"
                          tabIndex={isSelected ? 0 : -1}
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

                          <div className="mt-2 flex flex-wrap items-center gap-1.5">
                            <Badge variant={badgeVariantForStatus(node.status)}>
                              {node.status}
                            </Badge>
                            {isRecommended && (
                              <Badge variant="indigo">Goal</Badge>
                            )}
                          </div>

                          {node.prerequisites.length > 0 ? (
                            <p className="mt-2 text-xs text-[#555D7A] leading-snug">
                              Needs:{' '}
                              {node.prerequisites
                                .map((id) => getSkillDefinition(id).name)
                                .join(', ')}
                            </p>
                          ) : (
                            <p className="mt-2 text-xs text-[#0D7D6A] font-medium">
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
            <ol className="space-y-2.5">
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
                        className="inline-flex min-h-[36px] items-center rounded-lg px-2.5 text-xs font-semibold text-[#645BE8] hover:bg-[#EEF0FF] cursor-pointer"
                      >
                        {isSelected ? 'Inspecting' : 'Inspect details'}
                      </button>
                    </div>
                    <p className="mt-1 text-xs text-[#555D7A]">
                      {node.skill.description}
                    </p>
                    <p className="mt-1.5 text-xs text-[#555D7A]">
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

        {/* Bottom: Clean Horizontal Live Skill Inspector Panel */}
        {selectedNode && (
          <aside
            aria-label={`Skill details for ${selectedNode.skill.name}`}
            className="rounded-2xl border border-[#D8DCFF] bg-[#F7F8FC] p-4 sm:p-5 grid gap-5 lg:grid-cols-[1.15fr_1fr]"
          >
            <div className="space-y-3">
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#555D7A]">
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

              <div className="rounded-xl border border-[#E3E7F2] bg-white p-3.5 space-y-2 text-xs">
                <p className="font-semibold text-[#20253B]">Recorded Evidence</p>
                <p className="text-[#555D7A] leading-relaxed">
                  {selectedNode.statusReason}
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1 font-mono text-xs text-[#555D7A]">
                  <span className="rounded bg-[#F7F8FC] px-2 py-0.5 border border-[#E3E7F2]">
                    First-try: {selectedNode.firstTryCount}
                  </span>
                  <span className="rounded bg-[#F7F8FC] px-2 py-0.5 border border-[#E3E7F2]">
                    Assisted: {selectedNode.assistedCount}
                  </span>
                  <span className="rounded bg-[#F7F8FC] px-2 py-0.5 border border-[#E3E7F2]">
                    Mistakes: {selectedNode.unresolvedOrWrongCount}
                  </span>
                  <span className="rounded bg-[#F7F8FC] px-2 py-0.5 border border-[#E3E7F2]">
                    Skips: {selectedNode.skippedCount}
                  </span>
                  <span className="rounded bg-[#F7F8FC] px-2 py-0.5 border border-[#E3E7F2]">
                    Hints: {selectedNode.hintsAssociated}
                  </span>
                </div>
                {selectedNode.hasContradictoryEvidence &&
                  selectedNode.contradictionNote && (
                    <div className="mt-2 flex items-start gap-1.5 rounded-lg border border-[#F1B34C] bg-[#FEF6E6] p-2.5 text-xs text-[#9A630A]">
                      <AlertTriangle
                        className="h-4 w-4 shrink-0 mt-0.5"
                        aria-hidden="true"
                      />
                      <span>{selectedNode.contradictionNote}</span>
                    </div>
                  )}
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                {selectedNode.skill.relatedProblemIds.map((problemId) => {
                  const mod = getProblemModule(problemId);
                  return (
                    <Link
                      key={problemId}
                      to={`/studio/${problemId}`}
                      className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl bg-[#645BE8] px-3.5 text-xs font-semibold text-white transition-colors hover:bg-[#4F46D8]"
                    >
                      Open {mod?.spec.title ?? problemId}
                      <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="space-y-4">
              {/* Prerequisites with Rationale */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#555D7A]">
                  Prerequisites ({selectedNode.prerequisites.length})
                </h4>
                {selectedNode.prerequisites.length > 0 ? (
                  <ul className="space-y-2">
                    {selectedNode.prerequisites.map((prereqId) => {
                      const preNode = nodeById.get(prereqId);
                      const rationale = getPrerequisiteRationale(
                        prereqId,
                        selectedNode.skill.id,
                      );
                      return (
                        <li
                          key={prereqId}
                          className="rounded-xl border border-[#E3E7F2] bg-white p-3 text-xs space-y-1"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <button
                              type="button"
                              onClick={() => selectAndFocusSkill(prereqId)}
                              className="inline-flex min-h-[34px] items-center font-bold text-[#4F46D8] hover:underline cursor-pointer"
                            >
                              {getSkillDefinition(prereqId).name}
                            </button>
                            {preNode && (
                              <Badge variant={badgeVariantForStatus(preNode.status)}>
                                {preNode.status}
                              </Badge>
                            )}
                          </div>
                          {rationale && (
                            <p className="text-xs text-[#555D7A] leading-relaxed">
                              {rationale}
                            </p>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="flex items-center gap-1.5 text-xs text-[#0D7D6A]">
                    <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                    Independent foundation — no prerequisites required.
                  </p>
                )}
              </div>

              {/* Dependent Skills */}
              {selectedNode.dependents.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#555D7A]">
                    Prepares You For
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedNode.dependents.map((depId) => (
                      <button
                        key={depId}
                        type="button"
                        onClick={() => selectAndFocusSkill(depId)}
                        className="inline-flex min-h-[36px] items-center rounded-xl border border-[#D8DCFF] bg-white px-3 py-1.5 text-xs font-semibold text-[#4F46D8] hover:bg-[#EEF0FF] cursor-pointer"
                      >
                        {getSkillDefinition(depId).name} &rarr;
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </aside>
        )}

        <div className="flex items-start gap-2 rounded-xl border border-[#E3E7F2] bg-[#F7F8FC] px-3.5 py-2.5 text-xs text-[#555D7A]">
          <Info className="h-4 w-4 shrink-0 text-[#645BE8] mt-0.5" aria-hidden="true" />
          <p>
            <strong>Cautious labels:</strong> &ldquo;Strong Guided Recall&rdquo; reflects consistent first-try answers inside Guided Learning and trace predictions — it does <strong>not</strong> claim independent mastery without a future unassisted assessment.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
