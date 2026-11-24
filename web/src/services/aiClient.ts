import type { AnyProblemModule } from '../domain/problems/registry';

export interface WorkedExampleDto {
  input_summary: string;
  output_summary: string;
  walkthrough: string;
}

export interface DecompositionStepDto {
  id: string;
  title: string;
  goal: string;
  depends_on: string[];
}

export interface CandidateStrategyDto {
  name: string;
  technique: string;
  intuition: string;
  why_it_applies: string;
  time_complexity: string;
  space_complexity: string;
  complexity_assumptions: string;
  limitations: string;
}

export interface ProblemAnalysisDto {
  title: string;
  inferred_problem_type: string;
  plain_language_summary: string;
  inputs: string[];
  outputs: string[];
  constraints_and_assumptions: string[];
  clarifications_or_ambiguities: string[];
  worked_example: WorkedExampleDto;
  edge_cases: string[];
  prerequisite_concepts: string[];
  subproblem_decomposition: DecompositionStepDto[];
  candidate_strategies: CandidateStrategyDto[];
  confidence_notes: string;
}

export interface VerifiedMatchInfoDto {
  status: 'verified' | 'ambiguous' | 'conceptual_only';
  matched_problem_id:
    | 'two-sum'
    | 'valid-parentheses'
    | 'split-array-largest-sum'
    | null;
  matched_problem_title: string | null;
  studio_path: string | null;
  reason: string;
  compatibility_checks: string[];
  user_input_note: string;
}

export interface AnalyzeResponseDto {
  mode: 'ai' | 'offline-demo';
  is_ai_generated: boolean;
  verified_execution: false;
  analysis: ProblemAnalysisDto;
  verified_match: VerifiedMatchInfoDto;
  notice: string | null;
}

export type TutorActionType =
  | 'simplify'
  | 'hint'
  | 'why_technique'
  | 'compare_strategies'
  | 'explain_prerequisite'
  | 'check_assumption'
  | 'custom_question';

export interface TutorRequestDto {
  problem_analysis: ProblemAnalysisDto;
  action: TutorActionType;
  selected_strategy?: string | null;
  learning_stage?: string | null;
  execution_context?: string | null;
  learner_message?: string | null;
  explicitly_request_solution?: boolean;
}

export interface TutorResponseDto {
  mode: 'ai' | 'offline-demo';
  is_ai_generated: boolean;
  verified_execution: false;
  reply: string;
  guiding_question: string;
  progressive_hint: string | null;
  mastery_disclaimer: string;
  notice: string | null;
}

export class AiClientError extends Error {
  readonly kind: 'timeout' | 'network' | 'validation' | 'server';
  readonly status?: number;

  constructor(
    kind: 'timeout' | 'network' | 'validation' | 'server',
    message: string,
    status?: number,
  ) {
    super(message);
    this.name = 'AiClientError';
    this.kind = kind;
    this.status = status;
  }
}

const DEFAULT_API_BASE_URL = 'http://localhost:8000';
const DEFAULT_TIMEOUT_MS = 28000;

export function getApiBaseUrl(): string {
  const configured = import.meta.env.VITE_API_BASE_URL;
  if (typeof configured === 'string' && configured.trim().length > 0) {
    return configured.trim().replace(/\/+$/, '');
  }
  return DEFAULT_API_BASE_URL;
}

async function postJson<TResponse>(
  path: string,
  body: unknown,
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<TResponse> {
  const controller = new AbortController();
  const timerId = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${getApiBaseUrl()}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!response.ok) {
      let detail = `Request failed (${response.status}).`;
      try {
        const errBody = (await response.json()) as { detail?: string };
        if (typeof errBody.detail === 'string' && errBody.detail.trim()) {
          detail = errBody.detail;
        }
      } catch {
        // Keep safe fallback message
      }

      if (response.status === 504) {
        throw new AiClientError('timeout', detail, response.status);
      }
      if (response.status === 413 || response.status === 422 || response.status === 400) {
        throw new AiClientError('validation', detail, response.status);
      }
      throw new AiClientError('server', detail, response.status);
    }

    return (await response.json()) as TResponse;
  } catch (err) {
    if (err instanceof AiClientError) {
      throw err;
    }
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new AiClientError(
        'timeout',
        'The request timed out while waiting for the AlgoMiri API. Please retry.',
      );
    }
    throw new AiClientError(
      'network',
      'Could not reach the AlgoMiri API backend (expected at http://localhost:8000). Start the FastAPI server or use the built-in verified Learning Studio.',
    );
  } finally {
    window.clearTimeout(timerId);
  }
}

export async function analyzeProblem(
  problemStatement: string,
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<AnalyzeResponseDto> {
  return postJson<AnalyzeResponseDto>(
    '/api/analyze',
    { problem_statement: problemStatement },
    timeoutMs,
  );
}

export async function askTutor(
  request: TutorRequestDto,
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<TutorResponseDto> {
  return postJson<TutorResponseDto>('/api/tutor', request, timeoutMs);
}

/**
 * Adapts a built-in ProblemModule into a ProblemAnalysisDto so learners can ask the
 * AI Tutor questions inside the verified Learning Studio using explicit context.
 */
export function buildProblemAnalysisFromModule(
  mod: AnyProblemModule,
): ProblemAnalysisDto {
  const { spec } = mod;
  const ex = spec.examples[0];
  return {
    title: spec.title,
    inferred_problem_type: spec.supportedStrategies
      .flatMap((s) => s.techniques)
      .join(', '),
    plain_language_summary: spec.statement,
    inputs: [spec.inputSchema],
    outputs: [spec.outputSchema],
    constraints_and_assumptions: spec.constraints,
    clarifications_or_ambiguities: [],
    worked_example: {
      input_summary: ex?.input ?? spec.inputSchema,
      output_summary: ex?.output ?? spec.outputSchema,
      walkthrough: ex?.explanation ?? spec.statement,
    },
    edge_cases: spec.constraints.slice(0, 3),
    prerequisite_concepts: spec.supportedStrategies.flatMap((s) => s.techniques),
    subproblem_decomposition: Object.values(mod.solutionGraphs)[0].nodes.map(
      (n) => ({
        id: n.id,
        title: n.title,
        goal: n.learningGoal,
        depends_on: [],
      }),
    ),
    candidate_strategies: spec.supportedStrategies.map((s) => ({
      name: s.name,
      technique: s.techniques.join(' + '),
      intuition: s.intuition,
      why_it_applies: s.intuition,
      time_complexity: s.timeComplexity,
      space_complexity: s.spaceComplexity,
      complexity_assumptions: s.tradeoffs,
      limitations: s.tradeoffs,
    })),
    confidence_notes:
      'Derived from AlgoMiri curated ProblemSpec for Studio tutoring context.',
  };
}
