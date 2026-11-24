import type {
  SolutionGraph,
  SolutionGraphEdge,
  SolutionGraphNode,
} from '../problems/types';
import type { GenericExecutionStep } from '../core/types';

export interface GraphValidationResult {
  valid: boolean;
  errors: string[];
}

export interface DagLayoutResult {
  layers: SolutionGraphNode[][];
  layerIndexById: Record<string, number>;
  incomingById: Record<string, SolutionGraphEdge[]>;
  outgoingById: Record<string, SolutionGraphEdge[]>;
}

/**
 * Validates a conceptual SolutionGraph for structural integrity:
 * - Duplicate node IDs
 * - Duplicate edge IDs
 * - Missing source/target node references
 * - Self-dependencies
 * - Cycles (when requiresDag !== false)
 */
export function validateSolutionGraph(
  graph: SolutionGraph,
): GraphValidationResult {
  const errors: string[] = [];
  const nodeIds = new Set<string>();
  const edgeIds = new Set<string>();

  for (const node of graph.nodes) {
    if (!node.id.trim()) {
      errors.push('Found node with empty ID.');
      continue;
    }
    if (nodeIds.has(node.id)) {
      errors.push(`Duplicate node ID: "${node.id}".`);
    } else {
      nodeIds.add(node.id);
    }
  }

  const adjacency = new Map<string, string[]>();
  const inDegree = new Map<string, number>();
  for (const id of nodeIds) {
    adjacency.set(id, []);
    inDegree.set(id, 0);
  }

  for (const edge of graph.edges) {
    if (edgeIds.has(edge.id)) {
      errors.push(`Duplicate edge ID: "${edge.id}".`);
    } else {
      edgeIds.add(edge.id);
    }

    if (!nodeIds.has(edge.source)) {
      errors.push(
        `Edge "${edge.id}" references missing source node "${edge.source}".`,
      );
    }
    if (!nodeIds.has(edge.target)) {
      errors.push(
        `Edge "${edge.id}" references missing target node "${edge.target}".`,
      );
    }
    if (edge.source === edge.target) {
      errors.push(
        `Edge "${edge.id}" creates a self-dependency on node "${edge.source}".`,
      );
    }

    if (
      nodeIds.has(edge.source) &&
      nodeIds.has(edge.target) &&
      edge.source !== edge.target
    ) {
      adjacency.get(edge.source)!.push(edge.target);
      inDegree.set(edge.target, (inDegree.get(edge.target) ?? 0) + 1);
    }
  }

  // Kahn's topological sort for DAG cycle detection
  const requiresDag = graph.requiresDag !== false;
  if (requiresDag && nodeIds.size > 0 && errors.length === 0) {
    const queue: string[] = [];
    for (const [id, deg] of inDegree.entries()) {
      if (deg === 0) queue.push(id);
    }

    let visitedCount = 0;
    while (queue.length > 0) {
      const current = queue.shift()!;
      visitedCount += 1;
      for (const neighbor of adjacency.get(current) ?? []) {
        const nextDeg = (inDegree.get(neighbor) ?? 1) - 1;
        inDegree.set(neighbor, nextDeg);
        if (nextDeg === 0) {
          queue.push(neighbor);
        }
      }
    }

    if (visitedCount < nodeIds.size) {
      errors.push(
        `Graph "${graph.id}" contains a cycle, which violates its DAG requirement.`,
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validates that every explicit `conceptualNodeIds` annotation on a trace's ExecutionSteps
 * exists in the selected SolutionGraph.
 */
export function validateTraceNodeReferences(
  graph: SolutionGraph,
  steps: GenericExecutionStep[],
): GraphValidationResult {
  const validNodeIds = new Set(graph.nodes.map((n) => n.id));
  const errors: string[] = [];

  for (const step of steps) {
    if (!step.conceptualNodeIds) continue;
    for (const refId of step.conceptualNodeIds) {
      if (!validNodeIds.has(refId)) {
        errors.push(
          `Step ${step.stepIndex} ("${step.id}") references unknown node ID "${refId}" in graph "${graph.id}".`,
        );
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Computes topological layers from actual dependency edges (never relying on node array order).
 * Supports branching and merging DAGs cleanly.
 */
export function computeDagLayers(graph: SolutionGraph): DagLayoutResult {
  const nodeById = new Map<string, SolutionGraphNode>();
  const incomingById: Record<string, SolutionGraphEdge[]> = {};
  const outgoingById: Record<string, SolutionGraphEdge[]> = {};
  const inDegree = new Map<string, number>();

  for (const node of graph.nodes) {
    nodeById.set(node.id, node);
    incomingById[node.id] = [];
    outgoingById[node.id] = [];
    inDegree.set(node.id, 0);
  }

  for (const edge of graph.edges) {
    if (
      nodeById.has(edge.source) &&
      nodeById.has(edge.target) &&
      edge.source !== edge.target
    ) {
      outgoingById[edge.source].push(edge);
      incomingById[edge.target].push(edge);
      inDegree.set(edge.target, (inDegree.get(edge.target) ?? 0) + 1);
    }
  }

  const layerIndexById: Record<string, number> = {};
  const queue: string[] = [];

  for (const node of graph.nodes) {
    if ((inDegree.get(node.id) ?? 0) === 0) {
      layerIndexById[node.id] = 0;
      queue.push(node.id);
    }
  }

  const processed = new Set<string>();
  while (queue.length > 0) {
    const id = queue.shift()!;
    processed.add(id);
    const currentLayer = layerIndexById[id] ?? 0;

    for (const edge of outgoingById[id] ?? []) {
      const nextLayer = Math.max(
        layerIndexById[edge.target] ?? 0,
        currentLayer + 1,
      );
      layerIndexById[edge.target] = nextLayer;
      const remaining = (inDegree.get(edge.target) ?? 1) - 1;
      inDegree.set(edge.target, remaining);
      if (remaining === 0) {
        queue.push(edge.target);
      }
    }
  }

  for (const node of graph.nodes) {
    if (!processed.has(node.id)) {
      layerIndexById[node.id] = 0;
    }
  }

  const maxLayer = Math.max(0, ...Object.values(layerIndexById));
  const layers: SolutionGraphNode[][] = Array.from(
    { length: maxLayer + 1 },
    () => [],
  );

  for (const node of graph.nodes) {
    const layer = layerIndexById[node.id] ?? 0;
    layers[layer].push(node);
  }

  return {
    layers,
    layerIndexById,
    incomingById,
    outgoingById,
  };
}

function stepSupportsNode(
  step: GenericExecutionStep,
  node: SolutionGraphNode,
): boolean {
  if (step.conceptualNodeIds !== undefined) {
    return step.conceptualNodeIds.includes(node.id);
  }
  return node.mappedActions.includes(step.action);
}

/**
 * Maps a verified ExecutionStep to the conceptual SolutionGraph node ID(s) it supports.
 * Prefers explicit `step.conceptualNodeIds` (validated against the graph), falling back
 * to `node.mappedActions`. Never silently assigns unrelated steps to the first node.
 */
export function getActiveNodeIdsForStep(
  graph: SolutionGraph,
  step: GenericExecutionStep,
): string[] {
  if (step.conceptualNodeIds !== undefined) {
    const validIds = new Set(graph.nodes.map((n) => n.id));
    return step.conceptualNodeIds.filter((id) => validIds.has(id));
  }

  return graph.nodes
    .filter((node) => node.mappedActions.includes(step.action))
    .map((node) => node.id);
}

/**
 * Returns all verified step indices in the current trace that support a given conceptual node.
 */
export function getMatchingStepIndicesForNode(
  node: SolutionGraphNode,
  steps: GenericExecutionStep[],
): number[] {
  return steps
    .filter((step) => stepSupportsNode(step, node))
    .map((step) => step.stepIndex);
}
