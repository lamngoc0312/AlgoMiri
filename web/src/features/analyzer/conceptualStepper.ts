import type { ProblemAnalysisDto } from '../../services/aiClient';

export interface ConceptualStepItem {
  id: string;
  stepNumber: number;
  title: string;
  goal: string;
  dependsOn: string[];
}

/**
 * Splits a conceptual example walkthrough into discrete grounded sentences
 * without inventing any new steps or claims.
 */
export function splitWalkthroughBeats(walkthrough: string): string[] {
  const cleaned = walkthrough.trim();
  if (!cleaned) return [];

  // Split on sentence boundaries followed by whitespace while preserving decimals/numbers
  const rawSentences = cleaned
    .split(/(?<=[.!?])\s+(?=[A-Z0-9`'"])/)
    .map((part) => part.trim())
    .filter((part) => part.length > 0);

  return rawSentences.length > 0 ? rawSentences : [cleaned];
}

/**
 * Builds ordered conceptual reasoning steps directly from the grounded
 * AI ProblemAnalysis payload (never fabricating runtime execution steps).
 */
export function buildConceptualSteps(
  analysis: ProblemAnalysisDto,
): ConceptualStepItem[] {
  return analysis.subproblem_decomposition.map((step, index) => ({
    id: step.id,
    stepNumber: index + 1,
    title: step.title,
    goal: step.goal,
    dependsOn: step.depends_on,
  }));
}
