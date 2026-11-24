import { describe, expect, it } from 'vitest';
import type { SolutionGraph } from '../domain/problems/types';
import { getAllProblemModules } from '../domain/problems/registry';
import { twoSumModule } from '../domain/problems/twoSumModule';
import { splitArrayModule } from '../domain/problems/splitArrayModule';
import {
  computeDagLayers,
  getActiveNodeIdsForStep,
  getMatchingStepIndicesForNode,
  validateSolutionGraph,
  validateTraceNodeReferences,
} from '../domain/solutions/graphValidator';

function makeNode(id: string) {
  return {
    id,
    title: `Node ${id}`,
    category: 'operation' as const,
    learningGoal: `Goal ${id}`,
    explanation: `Explanation ${id}`,
    rationale: `Rationale ${id}`,
    skills: ['Test Skill'],
    mappedActions: ['compare-pair'],
  };
}

describe('SolutionGraph validation & topological layout', () => {
  it('validates all registered problem SolutionGraphs and trace node references cleanly', () => {
    const modules = getAllProblemModules();
    expect(modules.length).toBeGreaterThanOrEqual(3);

    for (const mod of modules) {
      const graphs = Object.values(mod.solutionGraphs);
      expect(graphs.length).toBeGreaterThan(0);
      for (const graph of graphs) {
        const result = validateSolutionGraph(graph);
        expect(result.valid, `Graph ${graph.id}: ${result.errors.join('; ')}`).toBe(
          true,
        );
        expect(result.errors).toEqual([]);

        const trace = mod.generateTrace(graph.strategyId, mod.defaultInput);
        const refCheck = validateTraceNodeReferences(graph, trace.steps);
        expect(
          refCheck.valid,
          `Trace refs for ${graph.id}: ${refCheck.errors.join('; ')}`,
        ).toBe(true);
      }
    }
  });

  it('detects duplicate node IDs, missing references, self-dependencies, and cycles', () => {
    const brokenGraph: SolutionGraph = {
      id: 'broken',
      strategyId: 'test',
      title: 'Broken',
      summary: 'Broken graph',
      requiresDag: true,
      nodes: [makeNode('a'), makeNode('a'), makeNode('b')],
      edges: [
        { id: 'e1', source: 'a', target: 'missing', reason: 'missing target' },
        { id: 'e2', source: 'b', target: 'b', reason: 'self loop' },
      ],
    };

    const brokenResult = validateSolutionGraph(brokenGraph);
    expect(brokenResult.valid).toBe(false);
    expect(brokenResult.errors.some((e) => /duplicate node id/i.test(e))).toBe(true);
    expect(brokenResult.errors.some((e) => /missing target/i.test(e))).toBe(true);
    expect(brokenResult.errors.some((e) => /self-dependency/i.test(e))).toBe(true);

    const cyclicGraph: SolutionGraph = {
      id: 'cyclic',
      strategyId: 'test',
      title: 'Cyclic',
      summary: 'Cycle test',
      requiresDag: true,
      nodes: [makeNode('a'), makeNode('b'), makeNode('c')],
      edges: [
        { id: 'e1', source: 'a', target: 'b', reason: 'a->b' },
        { id: 'e2', source: 'b', target: 'c', reason: 'b->c' },
        { id: 'e3', source: 'c', target: 'a', reason: 'c->a cycle' },
      ],
    };

    const cycleResult = validateSolutionGraph(cyclicGraph);
    expect(cycleResult.valid).toBe(false);
    expect(cycleResult.errors.some((e) => /cycle/i.test(e))).toBe(true);
  });

  it('computes branching-and-merging topological layers from edges regardless of node array order', () => {
    const hashMapGraph = twoSumModule.solutionGraphs['hash-map'];
    const reversedOrderGraph: SolutionGraph = {
      ...hashMapGraph,
      nodes: [...hashMapGraph.nodes].reverse(),
    };

    const layout = computeDagLayers(reversedOrderGraph);
    expect(layout.layerIndexById['hm-reformulate']).toBe(0);
    expect(layout.layerIndexById['hm-memory-map']).toBe(1);
    expect(layout.layerIndexById['hm-distinct-rule']).toBe(1);
    expect(layout.layerIndexById['hm-check-and-store']).toBe(2);
    expect(layout.layerIndexById['hm-terminate']).toBe(3);

    expect(layout.layers[1]).toHaveLength(2);
    expect(layout.incomingById['hm-check-and-store']).toHaveLength(2);
  });

  it('prefers explicit conceptualNodeIds, validates unknown node IDs, and never silently falls back to the first node', () => {
    const graph = splitArrayModule.solutionGraphs['bs-greedy-composition'];
    const trace = splitArrayModule.generateTrace('bs-greedy-composition', {
      nums: [7, 2, 5, 10, 8],
      k: 2,
    });

    // Explicit conceptualNodeIds map accurately
    const selectMidStep = trace.steps.find((s) => s.action === 'bs-select-mid')!;
    expect(getActiveNodeIdsForStep(graph, selectMidStep)).toEqual(['sa-bs-driver']);

    const driverNode = graph.nodes.find((n) => n.id === 'sa-bs-driver')!;
    expect(getMatchingStepIndicesForNode(driverNode, trace.steps)).toContain(
      selectMidStep.stepIndex,
    );

    // Unrelated step without matching action or conceptualNodeIds returns [] (NEVER nodes[0])
    const unrelatedStep = {
      ...trace.steps[0],
      action: 'push' as const,
      conceptualNodeIds: undefined,
    };
    expect(getActiveNodeIdsForStep(graph, unrelatedStep)).toEqual([]);

    // Invalid explicit node ID is caught by validateTraceNodeReferences
    const badRefStep = {
      ...trace.steps[0],
      conceptualNodeIds: ['nonexistent-node-id'],
    };
    const badValidation = validateTraceNodeReferences(graph, [badRefStep]);
    expect(badValidation.valid).toBe(false);
    expect(badValidation.errors[0]).toMatch(/unknown node id/i);
  });
});
