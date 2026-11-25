import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
import type { SkillId } from '../../domain/learning/types';
import { getProblemModule } from '../../domain/problems/registry';
import {
  localizePrerequisiteRationale,
  localizeRoadmapContradictionNote,
  localizeRoadmapSkillStatusReason,
  localizeRoadmapStatus,
  localizeSkillCategory,
  localizeSkillDescription,
  localizeSkillName,
} from '../../i18n/learningLocalization';
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
    return 'border-[#397BDB] bg-[var(--accent-blue-soft)]/70 ring-2 ring-[#397BDB]/35';
  }
  if (isRecommended) {
    return 'border-[#397BDB]/70 bg-[var(--accent-blue-soft)]/35 hover:bg-[var(--accent-blue-soft)]/60';
  }
  switch (status) {
    case 'Strong Guided Recall':
      return 'border-[#15A897]/60 bg-[var(--accent-teal-soft)]/45 hover:bg-[var(--accent-teal-soft)]/75';
    case 'Needs Practice':
      return 'border-[#F2B84B] bg-[var(--accent-amber-soft)]/65 hover:bg-[var(--accent-amber-soft)]';
    case 'Guided Progress':
      return 'border-[var(--accent-blue-border)] bg-[var(--surface-card)] hover:bg-[var(--surface-elevated)]';
    default:
      return 'border-[var(--border-subtle)] bg-[var(--surface-card)] hover:bg-[var(--surface-elevated)]';
  }
}

export function InteractiveSkillMap({
  skillNodes,
  graphValidation,
  recommendedSkillIds,
}: InteractiveSkillMapProps) {
  const { t } = useTranslation();
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
  const nodeButtonRefs = useRef<
    Partial<Record<SkillId, HTMLButtonElement | null>>
  >({});

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

  const getLayerTitle = (layerIndex: number) =>
    t(`roadmap.skillMap.layers.${layerIndex}`, {
      defaultValue: t('roadmap.skillMap.layers.fallback'),
    });

  const selectedContradiction = selectedNode
    ? localizeRoadmapContradictionNote(t, selectedNode)
    : null;

  return (
    <Card>
      <CardHeader className="border-b border-[var(--border-subtle)]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <GitBranch
                className="h-4 w-4 text-[var(--accent-blue-link)]"
                aria-hidden="true"
              />
              <CardTitle>{t('roadmap.skillMap.title')}</CardTitle>
              <Badge variant="neutral">{t('roadmap.skillMap.badge')}</Badge>
            </div>
            <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
              {t('roadmap.skillMap.description')}
            </p>
          </div>

          <div
            role="group"
            aria-label={t('roadmap.skillMap.viewModeLabel')}
            className="inline-flex rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-subtle)] p-1"
          >
            <button
              type="button"
              aria-pressed={viewMode === 'map'}
              onClick={() => setViewMode('map')}
              className={`inline-flex min-h-[36px] items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                viewMode === 'map'
                  ? 'bg-[var(--accent-blue-solid)] text-white shadow-2xs'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Network className="h-3.5 w-3.5" aria-hidden="true" />
              {t('roadmap.skillMap.visualMap')}
            </button>
            <button
              type="button"
              aria-pressed={viewMode === 'list'}
              onClick={() => setViewMode('list')}
              className={`inline-flex min-h-[36px] items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-[var(--accent-blue-solid)] text-white shadow-2xs'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <List className="h-3.5 w-3.5" aria-hidden="true" />
              {t('roadmap.skillMap.accessibleList')}
            </button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-5 space-y-5">
        {/* Top: Full-width 5-layer Prerequisite Flow or Accessible List */}
        {viewMode === 'map' ? (
          <div
            ref={mapContainerRef}
            role="region"
            aria-label={t('roadmap.skillMap.layeredRegion')}
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
                    <path d="M 0 1 L 7 4 L 0 7 z" fill="#397BDB" />
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
                      stroke={isHighlighted ? '#397BDB' : '#C5CCE8'}
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
                  className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-subtle)]/75 p-3 space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                      {layerIndex + 1}. {getLayerTitle(layerIndex)}
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
                          className={`w-full rounded-xl border p-3 text-left transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#397BDB] ${nodeBorderClasses(
                            node.status,
                            isSelected,
                            isRecommended,
                          )} ${
                            isRelatedToSelected && !isSelected
                              ? 'ring-1 ring-[#397BDB]/45'
                              : ''
                          }`}
                        >
                          <div className="flex items-start justify-between gap-1.5">
                            <span className="text-xs font-bold text-[var(--text-primary)] leading-snug">
                              {localizeSkillName(t, node.skill.id)}
                            </span>
                            {isRecommended && (
                              <Sparkles
                                className="h-3.5 w-3.5 shrink-0 text-[var(--accent-blue-link)]"
                                aria-label={t(
                                  'roadmap.skillMap.recommendedGoalAria',
                                )}
                              />
                            )}
                          </div>

                          <div className="mt-2 flex flex-wrap items-center gap-1.5">
                            <Badge variant={badgeVariantForStatus(node.status)}>
                              {localizeRoadmapStatus(t, node.status)}
                            </Badge>
                            {isRecommended && (
                              <Badge variant="indigo">
                                {t('roadmap.skillMap.goalBadge')}
                              </Badge>
                            )}
                          </div>

                          {node.prerequisites.length > 0 ? (
                            <p className="mt-2 text-xs text-[var(--text-secondary)] leading-snug">
                              {t('roadmap.skillMap.needs', {
                                skills: node.prerequisites
                                  .map((id) => localizeSkillName(t, id))
                                  .join(', '),
                              })}
                            </p>
                          ) : (
                            <p className="mt-2 text-xs text-[var(--accent-teal-text)] font-medium">
                              {t('roadmap.skillMap.independentFoundation')}
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
            aria-label={t('roadmap.skillMap.listRegion')}
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
                        <span className="text-sm font-bold text-[var(--text-primary)]">
                          {localizeSkillName(t, node.skill.id)}
                        </span>
                        <Badge variant={badgeVariantForStatus(node.status)}>
                          {localizeRoadmapStatus(t, node.status)}
                        </Badge>
                        {node.isRecommendedGoal && (
                          <Badge variant="indigo">
                            {t('roadmap.skillMap.recommendedGoalBadge')}
                          </Badge>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedSkillId(skillId)}
                        className="inline-flex min-h-[36px] items-center rounded-lg px-2.5 text-xs font-semibold text-[var(--accent-blue-link)] hover:bg-[var(--accent-blue-soft)] cursor-pointer"
                      >
                        {isSelected
                          ? t('roadmap.skillMap.inspecting')
                          : t('roadmap.skillMap.inspectDetails')}
                      </button>
                    </div>
                    <p className="mt-1 text-xs text-[var(--text-secondary)]">
                      {localizeSkillDescription(t, node.skill.id)}
                    </p>
                    <p className="mt-1.5 text-xs text-[var(--text-secondary)]">
                      <strong>{t('roadmap.skillMap.prerequisitesLabel')}</strong>{' '}
                      {node.prerequisites.length > 0
                        ? node.prerequisites
                            .map((id) => localizeSkillName(t, id))
                            .join(', ')
                        : t('roadmap.skillMap.noneIndependent')}
                      {node.dependents.length > 0 && (
                        <>
                          {' · '}
                          <strong>{t('roadmap.skillMap.unlocksLabel')}</strong>{' '}
                          {node.dependents
                            .map((id) => localizeSkillName(t, id))
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
            aria-label={t('roadmap.skillMap.detailsAria', {
              skill: localizeSkillName(t, selectedNode.skill.id),
            })}
            className="rounded-2xl border border-[var(--accent-blue-border)] bg-[var(--surface-subtle)] p-4 sm:p-5 grid gap-5 lg:grid-cols-[1.15fr_1fr]"
          >
            <div className="space-y-3">
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                    {localizeSkillCategory(t, selectedNode.skill.category)}
                  </span>
                  <Badge variant={badgeVariantForStatus(selectedNode.status)}>
                    {localizeRoadmapStatus(t, selectedNode.status)}
                  </Badge>
                </div>
                <h3 className="text-base font-extrabold text-[var(--text-primary)]">
                  {localizeSkillName(t, selectedNode.skill.id)}
                </h3>
                <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
                  {localizeSkillDescription(t, selectedNode.skill.id)}
                </p>
              </div>

              <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-3.5 space-y-2 text-xs">
                <p className="font-semibold text-[var(--text-primary)]">
                  {t('roadmap.skillMap.recordedEvidence')}
                </p>
                <p className="text-[var(--text-secondary)] leading-relaxed">
                  {localizeRoadmapSkillStatusReason(t, selectedNode)}
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1 font-mono text-xs text-[var(--text-secondary)]">
                  <span className="rounded bg-[var(--surface-subtle)] px-2 py-0.5 border border-[var(--border-subtle)]">
                    {t('roadmap.skillMap.firstTry', {
                      count: selectedNode.firstTryCount,
                    })}
                  </span>
                  <span className="rounded bg-[var(--surface-subtle)] px-2 py-0.5 border border-[var(--border-subtle)]">
                    {t('roadmap.skillMap.assisted', {
                      count: selectedNode.assistedCount,
                    })}
                  </span>
                  <span className="rounded bg-[var(--surface-subtle)] px-2 py-0.5 border border-[var(--border-subtle)]">
                    {t('roadmap.skillMap.mistakes', {
                      count: selectedNode.unresolvedOrWrongCount,
                    })}
                  </span>
                  <span className="rounded bg-[var(--surface-subtle)] px-2 py-0.5 border border-[var(--border-subtle)]">
                    {t('roadmap.skillMap.skips', {
                      count: selectedNode.skippedCount,
                    })}
                  </span>
                  <span className="rounded bg-[var(--surface-subtle)] px-2 py-0.5 border border-[var(--border-subtle)]">
                    {t('roadmap.skillMap.hints', {
                      count: selectedNode.hintsAssociated,
                    })}
                  </span>
                </div>
                {selectedContradiction && (
                  <div className="mt-2 flex items-start gap-1.5 rounded-lg border border-[#F2B84B] bg-[var(--accent-amber-soft)] p-2.5 text-xs text-[var(--accent-amber-text)]">
                    <AlertTriangle
                      className="h-4 w-4 shrink-0 mt-0.5"
                      aria-hidden="true"
                    />
                    <span>{selectedContradiction}</span>
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
                      className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl bg-[var(--accent-blue-solid)] px-3.5 text-xs font-semibold text-white transition-colors hover:bg-[var(--accent-blue-hover)]"
                    >
                      {t('roadmap.skillMap.openProblem', {
                        problem: mod?.spec.title ?? problemId,
                      })}
                      <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="space-y-4">
              {/* Prerequisites with Rationale */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                  {t('roadmap.skillMap.prerequisitesCount', {
                    count: selectedNode.prerequisites.length,
                  })}
                </h4>
                {selectedNode.prerequisites.length > 0 ? (
                  <ul className="space-y-2">
                    {selectedNode.prerequisites.map((prereqId) => {
                      const preNode = nodeById.get(prereqId);
                      const rationale = localizePrerequisiteRationale(
                        t,
                        prereqId,
                        selectedNode.skill.id,
                        getPrerequisiteRationale(
                          prereqId,
                          selectedNode.skill.id,
                        ),
                      );
                      return (
                        <li
                          key={prereqId}
                          className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-3 text-xs space-y-1"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <button
                              type="button"
                              onClick={() => selectAndFocusSkill(prereqId)}
                              className="inline-flex min-h-[34px] items-center font-bold text-[var(--accent-blue-text)] hover:underline cursor-pointer"
                            >
                              {localizeSkillName(t, prereqId)}
                            </button>
                            {preNode && (
                              <Badge
                                variant={badgeVariantForStatus(preNode.status)}
                              >
                                {localizeRoadmapStatus(t, preNode.status)}
                              </Badge>
                            )}
                          </div>
                          {rationale && (
                            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                              {rationale}
                            </p>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="flex items-center gap-1.5 text-xs text-[var(--accent-teal-text)]">
                    <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                    {t('roadmap.skillMap.independentNoPrereqs')}
                  </p>
                )}
              </div>

              {/* Dependent Skills */}
              {selectedNode.dependents.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                    {t('roadmap.skillMap.preparesYouFor')}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedNode.dependents.map((depId) => (
                      <button
                        key={depId}
                        type="button"
                        onClick={() => selectAndFocusSkill(depId)}
                        className="inline-flex min-h-[36px] items-center rounded-xl border border-[var(--accent-blue-border)] bg-[var(--surface-card)] px-3 py-1.5 text-xs font-semibold text-[var(--accent-blue-text)] hover:bg-[var(--accent-blue-soft)] cursor-pointer"
                      >
                        {localizeSkillName(t, depId)} &rarr;
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </aside>
        )}

        <div className="flex items-start gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-subtle)] px-3.5 py-2.5 text-xs text-[var(--text-secondary)]">
          <Info
            className="h-4 w-4 shrink-0 text-[var(--accent-blue-link)] mt-0.5"
            aria-hidden="true"
          />
          <p>
            <strong>{t('roadmap.skillMap.cautiousLead')}</strong>{' '}
            {t('roadmap.skillMap.cautiousBody')}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
