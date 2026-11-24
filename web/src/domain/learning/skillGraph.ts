import { SKILL_REGISTRY } from './skills';
import type { SkillDefinition, SkillId } from './types';

export interface SkillPrerequisiteEdge {
  id: string;
  source: SkillId;
  target: SkillId;
  reason: string;
}

/**
 * Genuine conceptual prerequisite edges across the 8 skills in SKILL_REGISTRY.
 * Notice: Stack / LIFO and Array Indexing are independent roots (not forced into a linear chain).
 */
export const SKILL_PREREQUISITE_EDGES: readonly SkillPrerequisiteEdge[] = [
  {
    id: 'array-indexing->brute-force',
    source: 'array-indexing',
    target: 'brute-force',
    reason:
      'Enumerating distinct pairs (i, j) safely requires reasoning about 0-based array positions and bounds.',
  },
  {
    id: 'brute-force->time-space-complexity',
    source: 'brute-force',
    target: 'time-space-complexity',
    reason:
      'Comparing runtime and memory tradeoffs becomes concrete after analyzing a baseline O(n²) scan.',
  },
  {
    id: 'array-indexing->hash-map-lookup',
    source: 'array-indexing',
    target: 'hash-map-lookup',
    reason:
      'Hash Map solutions map array values to their 0-based indices while preserving distinct-index checks.',
  },
  {
    id: 'brute-force->hash-map-lookup',
    source: 'brute-force',
    target: 'hash-map-lookup',
    reason:
      'Complement lookup is motivated directly by eliminating the repeated inner scan of Brute Force.',
  },
  {
    id: 'array-indexing->greedy-feasibility',
    source: 'array-indexing',
    target: 'greedy-feasibility',
    reason:
      'Greedy contiguous subarray packing scans array indices sequentially while tracking running sums.',
  },
  {
    id: 'time-space-complexity->binary-search-answer',
    source: 'time-space-complexity',
    target: 'binary-search-answer',
    reason:
      'Binary Search on Answer is motivated by cutting an O(n · S) candidate scan down to O(n log S).',
  },
  {
    id: 'binary-search-answer->algorithm-composition',
    source: 'binary-search-answer',
    target: 'algorithm-composition',
    reason:
      'Binary Search acts as the outer driver that proposes candidate answers and halves [low, high].',
  },
  {
    id: 'greedy-feasibility->algorithm-composition',
    source: 'greedy-feasibility',
    target: 'algorithm-composition',
    reason:
      'Greedy acts as the inner feasibility subroutine answering whether Binary Search’s candidate mid works.',
  },
] as const;

export interface SkillGraphValidationResult {
  valid: boolean;
  errors: string[];
  topologicalOrder: SkillId[];
  /** Skills grouped by DAG layer depth (layer 0 = foundational roots with no prerequisites). */
  layers: SkillId[][];
  dependentsBySkill: Record<SkillId, SkillId[]>;
}

/**
 * Validates skill prerequisite references, duplicate edges, self-loops,
 * symmetry between SkillDefinition.prerequisites and edges, and acyclicity (DAG).
 */
export function validateSkillPrerequisiteGraph(
  skills: readonly SkillDefinition[] = SKILL_REGISTRY,
  edges: readonly SkillPrerequisiteEdge[] = SKILL_PREREQUISITE_EDGES,
): SkillGraphValidationResult {
  const errors: string[] = [];
  const skillIds = new Set<SkillId>(skills.map((s) => s.id));

  const dependentsBySkill = {} as Record<SkillId, SkillId[]>;
  const inDegree = new Map<SkillId, number>();
  const adjacency = new Map<SkillId, SkillId[]>();
  const prereqsFromEdges = new Map<SkillId, Set<SkillId>>();

  for (const skill of skills) {
    dependentsBySkill[skill.id] = [];
    inDegree.set(skill.id, 0);
    adjacency.set(skill.id, []);
    prereqsFromEdges.set(skill.id, new Set());
  }

  const seenEdgeKeys = new Set<string>();
  for (const edge of edges) {
    if (!skillIds.has(edge.source)) {
      errors.push(`Edge "${edge.id}" references unknown source skill "${edge.source}".`);
      continue;
    }
    if (!skillIds.has(edge.target)) {
      errors.push(`Edge "${edge.id}" references unknown target skill "${edge.target}".`);
      continue;
    }
    if (edge.source === edge.target) {
      errors.push(`Edge "${edge.id}" cannot form a self-loop on "${edge.source}".`);
      continue;
    }
    const key = `${edge.source}->${edge.target}`;
    if (seenEdgeKeys.has(key)) {
      errors.push(`Duplicate prerequisite edge detected: ${key}.`);
      continue;
    }
    seenEdgeKeys.add(key);

    adjacency.get(edge.source)!.push(edge.target);
    dependentsBySkill[edge.source].push(edge.target);
    inDegree.set(edge.target, (inDegree.get(edge.target) ?? 0) + 1);
    prereqsFromEdges.get(edge.target)!.add(edge.source);
  }

  // Verify every skill.prerequisites entry matches the edge list and points to known skills
  for (const skill of skills) {
    for (const prereq of skill.prerequisites) {
      if (!skillIds.has(prereq)) {
        errors.push(`Skill "${skill.id}" lists unknown prerequisite "${prereq}".`);
      } else if (!prereqsFromEdges.get(skill.id)?.has(prereq)) {
        errors.push(
          `Skill "${skill.id}" declares prerequisite "${prereq}" missing from SKILL_PREREQUISITE_EDGES.`,
        );
      }
    }
    for (const edgeSource of prereqsFromEdges.get(skill.id) ?? []) {
      if (!skill.prerequisites.includes(edgeSource)) {
        errors.push(
          `Edge "${edgeSource}->${skill.id}" is not listed in SkillDefinition.prerequisites for "${skill.id}".`,
        );
      }
    }
  }

  // Kahn's topological sort + longest-path layer depth computation
  const queue: SkillId[] = [];
  const depth = new Map<SkillId, number>();
  for (const skill of skills) {
    if ((inDegree.get(skill.id) ?? 0) === 0) {
      queue.push(skill.id);
      depth.set(skill.id, 0);
    }
  }

  const topologicalOrder: SkillId[] = [];
  while (queue.length > 0) {
    const current = queue.shift()!;
    topologicalOrder.push(current);
    const currentDepth = depth.get(current) ?? 0;

    for (const next of adjacency.get(current) ?? []) {
      depth.set(next, Math.max(depth.get(next) ?? 0, currentDepth + 1));
      const nextIn = (inDegree.get(next) ?? 1) - 1;
      inDegree.set(next, nextIn);
      if (nextIn === 0) {
        queue.push(next);
      }
    }
  }

  if (topologicalOrder.length !== skills.length) {
    const cycleNodes = skills
      .map((s) => s.id)
      .filter((id) => !topologicalOrder.includes(id));
    errors.push(
      `Cycle detected in skill prerequisite graph involving: ${cycleNodes.join(', ')}.`,
    );
  }

  const maxDepth = Math.max(0, ...Array.from(depth.values()));
  const layers: SkillId[][] = Array.from({ length: maxDepth + 1 }, () => []);
  for (const id of topologicalOrder) {
    const d = depth.get(id) ?? 0;
    layers[d].push(id);
  }

  return {
    valid: errors.length === 0,
    errors,
    topologicalOrder,
    layers,
    dependentsBySkill,
  };
}

export function getPrerequisiteRationale(
  source: SkillId,
  target: SkillId,
): string | null {
  const edge = SKILL_PREREQUISITE_EDGES.find(
    (e) => e.source === source && e.target === target,
  );
  return edge?.reason ?? null;
}
