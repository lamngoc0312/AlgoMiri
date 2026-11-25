import { useMemo, useState } from 'react';
import {
  ArrowRight,
  GitBranch,
  HelpCircle,
  Info,
  Layers,
  List,
  Network,
  Sparkles,
} from 'lucide-react';
import type {
  SolutionGraph,
  SolutionGraphNode,
  SolutionNodeCategory,
} from '../../domain/problems/types';
import type { GenericExecutionStep } from '../../domain/core/types';
import {
  computeDagLayers,
  getActiveNodeIdsForStep,
  getMatchingStepIndicesForNode,
} from '../../domain/solutions/graphValidator';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';

interface InteractiveSolutionMapProps {
  graph: SolutionGraph;
  steps: GenericExecutionStep[];
  currentStep: GenericExecutionStep;
  maxAllowedStepIndex: number;
  onSelectStep: (stepIndex: number) => void;
  onSwitchToMicro?: () => void;
}

const CATEGORY_LABELS: Record<SolutionNodeCategory, string> = {
  'input-model': 'Input Model',
  invariant: 'Invariant',
  operation: 'Operation',
  decision: 'Decision',
  technique: 'Technique',
  termination: 'Termination',
};

const NODE_WIDTH = 176;
const NODE_HEIGHT = 76;
const COL_GAP = 56;
const ROW_GAP = 26;
const PAD_X = 20;
const PAD_Y = 20;

export function InteractiveSolutionMap({
  graph,
  steps,
  currentStep,
  maxAllowedStepIndex,
  onSelectStep,
  onSwitchToMicro,
}: InteractiveSolutionMapProps) {
  const [displayMode, setDisplayMode] = useState<'graph' | 'list'>('graph');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [showWhy, setShowWhy] = useState(false);

  const layout = useMemo(() => computeDagLayers(graph), [graph]);
  const activeNodeIds = useMemo(
    () => getActiveNodeIdsForStep(graph, currentStep),
    [graph, currentStep],
  );

  const effectiveSelectedId =
    selectedNodeId && graph.nodes.some((n) => n.id === selectedNodeId)
      ? selectedNodeId
      : (activeNodeIds[0] ?? graph.nodes[0]?.id ?? null);

  const selectedNode: SolutionGraphNode | null =
    graph.nodes.find((n) => n.id === effectiveSelectedId) ?? null;

  const nodeById = useMemo(() => {
    const map = new Map<string, SolutionGraphNode>();
    for (const node of graph.nodes) {
      map.set(node.id, node);
    }
    return map;
  }, [graph.nodes]);

  // Compute SVG coordinates for the topological layers
  const graphGeometry = useMemo(() => {
    const maxRows = Math.max(1, ...layout.layers.map((l) => l.length));
    const totalCols = Math.max(1, layout.layers.length);
    const width =
      PAD_X * 2 + totalCols * NODE_WIDTH + Math.max(0, totalCols - 1) * COL_GAP;
    const height =
      PAD_Y * 2 + maxRows * NODE_HEIGHT + Math.max(0, maxRows - 1) * ROW_GAP;

    const coords: Record<string, { x: number; y: number }> = {};

    layout.layers.forEach((layerNodes, colIdx) => {
      const colHeight =
        layerNodes.length * NODE_HEIGHT +
        Math.max(0, layerNodes.length - 1) * ROW_GAP;
      const startY = (height - colHeight) / 2;

      layerNodes.forEach((node, rowIdx) => {
        coords[node.id] = {
          x: PAD_X + colIdx * (NODE_WIDTH + COL_GAP),
          y: startY + rowIdx * (NODE_HEIGHT + ROW_GAP),
        };
      });
    });

    return { width, height, coords };
  }, [layout.layers]);

  const handleSelectNode = (nodeId: string) => {
    setSelectedNodeId(nodeId);
    setShowWhy(false);
  };

  const incomingEdges = selectedNode
    ? (layout.incomingById[selectedNode.id] ?? [])
    : [];
  const outgoingEdges = selectedNode
    ? (layout.outgoingById[selectedNode.id] ?? [])
    : [];
  const matchingStepIndices = selectedNode
    ? getMatchingStepIndicesForNode(selectedNode, steps)
    : [];

  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b border-[#E2E8F0] bg-white">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <GitBranch className="h-4 w-4 text-[#2664C2]" aria-hidden="true" />
            <CardTitle>{graph.title}</CardTitle>
            <Badge variant="indigo">Macro View · Conceptual DAG</Badge>
          </div>

          <div
            role="group"
            aria-label="Solution map display mode"
            className="inline-flex rounded-xl border border-[#E2E8F0] bg-[#F7F9FC] p-0.5"
          >
            <button
              type="button"
              aria-pressed={displayMode === 'graph'}
              onClick={() => setDisplayMode('graph')}
              className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors cursor-pointer ${
                displayMode === 'graph'
                  ? 'bg-white text-[#2257A8] shadow-2xs'
                  : 'text-[#526075] hover:text-[#202B3B]'
              }`}
            >
              <Network className="h-3.5 w-3.5" aria-hidden="true" />
              Graph
            </button>
            <button
              type="button"
              aria-pressed={displayMode === 'list'}
              onClick={() => setDisplayMode('list')}
              className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors cursor-pointer ${
                displayMode === 'list'
                  ? 'bg-white text-[#2257A8] shadow-2xs'
                  : 'text-[#526075] hover:text-[#202B3B]'
              }`}
            >
              <List className="h-3.5 w-3.5" aria-hidden="true" />
              List Fallback
            </button>
          </div>
        </div>
        <p className="text-xs leading-relaxed text-[#526075]">
          {graph.summary} Click any node to inspect why it is necessary, what it depends on, and which verified trace steps support it.
        </p>
      </CardHeader>

      <CardContent className="space-y-5 pt-5">
        {displayMode === 'graph' ? (
          <div
            aria-label="Interactive solution dependency graph"
            className="overflow-x-auto rounded-2xl border border-[#E2E8F0] bg-[#F7F9FC] p-3"
          >
            <div
              className="relative mx-auto"
              style={{
                width: `${graphGeometry.width}px`,
                height: `${graphGeometry.height}px`,
              }}
            >
              {/* Dependency Edges SVG Layer */}
              <svg
                width={graphGeometry.width}
                height={graphGeometry.height}
                className="pointer-events-none absolute inset-0"
                aria-hidden="true"
              >
                <defs>
                  <marker
                    id="dag-arrow-default"
                    viewBox="0 0 10 10"
                    refX="9"
                    refY="5"
                    markerWidth="6"
                    markerHeight="6"
                    orient="auto-start-reverse"
                  >
                    <path d="M 0 1 L 10 5 L 0 9 z" fill="#9AA3BF" />
                  </marker>
                  <marker
                    id="dag-arrow-active"
                    viewBox="0 0 10 10"
                    refX="9"
                    refY="5"
                    markerWidth="6"
                    markerHeight="6"
                    orient="auto-start-reverse"
                  >
                    <path d="M 0 1 L 10 5 L 0 9 z" fill="#397BDB" />
                  </marker>
                </defs>

                {graph.edges.map((edge) => {
                  const from = graphGeometry.coords[edge.source];
                  const to = graphGeometry.coords[edge.target];
                  if (!from || !to) return null;

                  const x1 = from.x + NODE_WIDTH;
                  const y1 = from.y + NODE_HEIGHT / 2;
                  const x2 = to.x - 2;
                  const y2 = to.y + NODE_HEIGHT / 2;
                  const midX = (x1 + x2) / 2;

                  const isRelatedToSelected =
                    edge.source === effectiveSelectedId ||
                    edge.target === effectiveSelectedId;

                  return (
                    <path
                      key={edge.id}
                      d={`M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`}
                      fill="none"
                      stroke={isRelatedToSelected ? '#397BDB' : '#B5BDD6'}
                      strokeWidth={isRelatedToSelected ? 2.25 : 1.75}
                      markerEnd={
                        isRelatedToSelected
                          ? 'url(#dag-arrow-active)'
                          : 'url(#dag-arrow-default)'
                      }
                    />
                  );
                })}
              </svg>

              {/* Interactive Accessible Node Buttons */}
              {graph.nodes.map((node) => {
                const pos = graphGeometry.coords[node.id];
                if (!pos) return null;
                const isSelected = node.id === effectiveSelectedId;
                const isActiveForStep = activeNodeIds.includes(node.id);

                return (
                  <button
                    key={node.id}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => handleSelectNode(node.id)}
                    style={{
                      left: `${pos.x}px`,
                      top: `${pos.y}px`,
                      width: `${NODE_WIDTH}px`,
                      height: `${NODE_HEIGHT}px`,
                    }}
                    className={`absolute flex flex-col justify-between rounded-xl border-2 px-3 py-2 text-left transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? 'border-[#397BDB] bg-white shadow-sm ring-2 ring-[#397BDB]/25'
                        : isActiveForStep
                          ? 'border-[#15A897] bg-[#E6F7F5] shadow-2xs'
                          : 'border-[#DCE1F0] bg-white hover:border-[#397BDB]/60'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#526075] truncate">
                        {CATEGORY_LABELS[node.category]}
                      </span>
                      {isActiveForStep && (
                        <span className="rounded-full bg-[#0F8477] px-1.5 py-0.5 text-[9px] font-bold text-white shrink-0">
                          Active Step
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-bold leading-snug text-[#202B3B] line-clamp-2">
                      {node.title}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          /* Accessible List Fallback */
          <ol
            aria-label="Accessible solution dependency list"
            className="space-y-2.5"
          >
            {layout.layers.flat().map((node) => {
              const isSelected = node.id === effectiveSelectedId;
              const isActiveForStep = activeNodeIds.includes(node.id);
              const deps = layout.incomingById[node.id] ?? [];

              return (
                <li key={node.id}>
                  <button
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => handleSelectNode(node.id)}
                    className={`w-full rounded-xl border p-3 text-left transition-colors cursor-pointer ${
                      isSelected
                        ? 'border-[#397BDB] bg-[#EAF2FD]/50'
                        : 'border-[#E2E8F0] bg-white hover:bg-[#F7F9FC]'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-bold text-[#202B3B]">
                        {node.title}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <Badge variant="neutral">
                          {CATEGORY_LABELS[node.category]}
                        </Badge>
                        {isActiveForStep && (
                          <Badge variant="mint">Active Step</Badge>
                        )}
                      </div>
                    </div>
                    <p className="mt-1 text-xs text-[#526075]">
                      {node.learningGoal}
                    </p>
                    {deps.length > 0 && (
                      <p className="mt-1.5 text-xs font-medium text-[#2257A8]">
                        Depends on:{' '}
                        {deps
                          .map((d) => nodeById.get(d.source)?.title ?? d.source)
                          .join(', ')}
                      </p>
                    )}
                  </button>
                </li>
              );
            })}
          </ol>
        )}

        {/* Selected Node Interactive Inspector */}
        {selectedNode && (
          <section
            aria-label="Selected reasoning node details"
            className="rounded-2xl border border-[#C2DAFA] bg-[#F7F9FC] p-4 space-y-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="indigo">
                    {CATEGORY_LABELS[selectedNode.category]}
                  </Badge>
                  {activeNodeIds.includes(selectedNode.id) && (
                    <Badge variant="mint">Supports Current Step</Badge>
                  )}
                </div>
                <h3 className="mt-1.5 text-base font-extrabold text-[#202B3B]">
                  {selectedNode.title}
                </h3>
              </div>

              <Button
                variant="secondary"
                size="sm"
                aria-expanded={showWhy}
                onClick={() => setShowWhy((prev) => !prev)}
              >
                <HelpCircle className="h-3.5 w-3.5" aria-hidden="true" />
                Why is this step necessary?
              </Button>
            </div>

            <p className="text-sm leading-relaxed text-[#202B3B]">
              {selectedNode.explanation}
            </p>

            {showWhy && (
              <div
                role="region"
                aria-label="Step rationale"
                className="rounded-xl border border-[#397BDB]/40 bg-[#EAF2FD]/70 p-3 text-xs leading-relaxed text-[#202B3B]"
              >
                <p className="font-bold text-[#2257A8]">
                  Why this reasoning step matters:
                </p>
                <p className="mt-1">{selectedNode.rationale}</p>
              </div>
            )}

            {/* Dependencies & Downstream Connections */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-[#E2E8F0] bg-white p-3 space-y-1.5">
                <p className="text-xs font-bold uppercase tracking-wider text-[#526075]">
                  Depends On
                </p>
                {incomingEdges.length > 0 ? (
                  <ul className="space-y-1.5 text-xs">
                    {incomingEdges.map((edge) => {
                      const src = nodeById.get(edge.source);
                      return (
                        <li key={edge.id} className="space-y-0.5">
                          <button
                            type="button"
                            onClick={() => handleSelectNode(edge.source)}
                            className="font-semibold text-[#2257A8] hover:underline cursor-pointer"
                          >
                            {src?.title ?? edge.source}
                          </button>
                          <p className="text-xs text-[#526075]">
                            {edge.reason}
                          </p>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="text-xs text-[#526075]">
                    Entry reasoning goal (no upstream graph dependency).
                  </p>
                )}
              </div>

              <div className="rounded-xl border border-[#E2E8F0] bg-white p-3 space-y-1.5">
                <p className="text-xs font-bold uppercase tracking-wider text-[#526075]">
                  Enables
                </p>
                {outgoingEdges.length > 0 ? (
                  <ul className="space-y-1.5 text-xs">
                    {outgoingEdges.map((edge) => {
                      const tgt = nodeById.get(edge.target);
                      return (
                        <li key={edge.id} className="space-y-0.5">
                          <button
                            type="button"
                            onClick={() => handleSelectNode(edge.target)}
                            className="font-semibold text-[#2257A8] hover:underline cursor-pointer"
                          >
                            {tgt?.title ?? edge.target}
                          </button>
                          <p className="text-xs text-[#526075]">
                            {edge.reason}
                          </p>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="text-xs text-[#526075]">
                    Final outcome goal for this strategy.
                  </p>
                )}
              </div>
            </div>

            {/* Optional Data Contract */}
            {selectedNode.ioContract && (
              <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[#E2E8F0] bg-white px-3 py-2.5 text-xs">
                <span className="font-bold text-[#202B3B]">Data Flow:</span>
                <span className="font-mono text-[#526075]">
                  {selectedNode.ioContract.inputs.join(' + ')}
                </span>
                <ArrowRight className="h-3.5 w-3.5 text-[#2664C2]" aria-hidden="true" />
                <span className="font-mono font-semibold text-[#0D7A6E]">
                  {selectedNode.ioContract.outputs.join(', ')}
                </span>
              </div>
            )}

            {/* Relevant Verified Execution Steps */}
            <div className="rounded-xl border border-[#E2E8F0] bg-white p-3 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#202B3B]">
                  <Sparkles
                    className="h-3.5 w-3.5 text-[#2664C2]"
                    aria-hidden="true"
                  />
                  Relevant Verified Execution Steps
                </div>
                {onSwitchToMicro && (
                  <button
                    type="button"
                    onClick={onSwitchToMicro}
                    className="text-xs font-semibold text-[#2257A8] hover:underline cursor-pointer"
                  >
                    Inspect in Micro View &rarr;
                  </button>
                )}
              </div>

              {matchingStepIndices.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {matchingStepIndices.map((idx) => {
                    const isCurrent = idx === currentStep.stepIndex;
                    const isLockedByCheckpoint = idx > maxAllowedStepIndex;

                    return (
                      <button
                        key={idx}
                        type="button"
                        disabled={isLockedByCheckpoint}
                        title={
                          isLockedByCheckpoint
                            ? 'Complete or skip earlier guided checkpoints to jump here'
                            : `Jump to verified Step ${idx + 1}`
                        }
                        onClick={() => onSelectStep(idx)}
                        className={`rounded-lg px-2.5 py-1 font-mono text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                          isCurrent
                            ? 'bg-[#0F8477] text-white'
                            : 'border border-[#DCE1F0] bg-[#F7F9FC] text-[#202B3B] hover:border-[#397BDB] hover:text-[#2257A8]'
                        }`}
                      >
                        Step {idx + 1}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-[#526075]">
                  No steps in the current input trace trigger this node (try another preset to observe it).
                </p>
              )}
            </div>

            {/* Skills & Prerequisites + Honest Non-Mastery Disclaimer */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
              <div className="flex flex-wrap items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-[#2664C2]" aria-hidden="true" />
                <span className="font-semibold text-[#202B3B]">Skills:</span>
                {selectedNode.skills.map((skill) => (
                  <Badge key={skill} variant="neutral">
                    {skill}
                  </Badge>
                ))}
              </div>
              <span className="inline-flex items-center gap-1 text-xs text-[#526075]">
                <Info className="h-3.5 w-3.5 text-[#8B93B0]" aria-hidden="true" />
                Viewing a node builds intuition; it does not count as skill mastery.
              </span>
            </div>
          </section>
        )}
      </CardContent>
    </Card>
  );
}
