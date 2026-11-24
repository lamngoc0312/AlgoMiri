import { describe, expect, it } from 'vitest';
import type { SolutionGraph } from '../domain/problems/types';
import { getAllProblemModules } from '../domain/problems/registry';
import { twoSumModule } from '../domain/problems/twoSumModule';
import {
  computeDagLayers,
  getActiveNodeIdsForStep,
  getMatchingStepIndicesForNode,
  validateSolutionGraph,
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
  it('validates all registered problem SolutionGraphs cleanly', () => {
    const modules = getAllProblemModules();
    expect(modules.length).toBeGreaterThanOrEqual(2);

    for (const mod of modules) {
      const graphs = Object.values(mod.solutionGraphs);
      expect(graphs.length).toBeGreaterThan(0);
      for (const graph of graphs) {
        const result = validateSolutionGraph(graph);
        expect(result.valid, `Graph ${graph.id}: ${result.errors.join('; ')}`).toBe(
          true,
        );
        expect(result.errors).toEqual([]);
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

    // Branching layer has 2 nodes; merge node has 2 incoming dependencies
    expect(layout.layers[1]).toHaveLength(2);
    expect(layout.incomingById['hm-check-and-store']).toHaveLength(2);
  });

  it('maps verified ExecutionSteps to conceptual nodes accurately', () => {
    const hashMapGraph = twoSumModule.solutionGraphs['hash-map'];
    const trace = twoSumModule.generateTrace('hash-map', {
      nums: [2, 7, 11, 15],
      target: 9,
    });

    // Final 'found' step maps to termination node
    const lastStep = trace.steps[trace.steps.length - 1];
    expect(getActiveNodeIdsForStep(hashMapGraph, lastStep)).toContain(
      'hm-terminate',
    );

    const terminateNode = hashMapGraph.nodes.find((n) => n.id === 'hm-terminate')!;
    expect(getMatchingStepIndicesForNode(terminateNode, trace.steps)).toEqual([
      lastStep.stepIndex,
    ]);
  });
});
