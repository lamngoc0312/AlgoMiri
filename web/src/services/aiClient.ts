import type { AnyProblemModule } from '../domain/problems/registry';
import {
  DEFAULT_LANGUAGE,
  isSupportedLanguage,
  type SupportedLanguage,
} from '../i18n';

export interface AnalyzeRequestDto {
  problem_statement: string;
  locale: SupportedLanguage;
}

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
  locale: SupportedLanguage;
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

export type UrlRetrievalStatus =
  | 'fetched'
  | 'restricted_source'
  | 'manual_input_required'
  | 'fetch_failed';

export interface InspectUrlResponseDto {
  original_url: string;
  canonical_url: string;
  source_name: string;
  slug: string | null;
  display_title: string | null;
  retrieval_status: UrlRetrievalStatus;
  message: string;
  extracted_text: string | null;
  verified_match: VerifiedMatchInfoDto | null;
}

export type AllowedImageMimeType = 'image/png' | 'image/jpeg' | 'image/webp';

export interface ImageInputDto {
  filename: string;
  mime_type: AllowedImageMimeType;
  data_base64: string;
}

export interface ImageExtractionResponseDto {
  mode: 'ai' | 'offline-demo';
  is_ai_generated: boolean;
  extracted_text: string;
  diagram_notes: string[];
  uncertain_regions: string[];
  needs_confirmation: true;
  notice: string | null;
}

export type AiClientErrorKind =
  | 'aborted'
  | 'timeout'
  | 'rate_limit'
  | 'network'
  | 'validation'
  | 'server';

export class AiClientError extends Error {
  readonly kind: AiClientErrorKind;
  readonly status?: number;
  readonly retryAfterSeconds?: number;

  constructor(
    kind: AiClientErrorKind,
    message: string,
    status?: number,
    retryAfterSeconds?: number,
  ) {
    super(message);
    this.name = 'AiClientError';
    this.kind = kind;
    this.status = status;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export interface RequestOptions {
  timeoutMs?: number;
  signal?: AbortSignal;
  locale?: unknown;
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
  options?: RequestOptions,
): Promise<TResponse> {
  const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const externalSignal = options?.signal;
  const controller = new AbortController();
  let timedOut = false;

  const onExternalAbort = () => controller.abort();
  if (externalSignal) {
    if (externalSignal.aborted) {
      throw new AiClientError('aborted', 'Request was cancelled.');
    }
    externalSignal.addEventListener('abort', onExternalAbort, { once: true });
  }

  const timerId = window.setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

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

      const rawRetry = response.headers?.get?.('Retry-After');
      const retryAfter = rawRetry ? Number.parseInt(rawRetry, 10) : undefined;
      const validRetry =
        retryAfter !== undefined && Number.isFinite(retryAfter) && retryAfter > 0
          ? retryAfter
          : undefined;

      if (response.status === 429) {
        throw new AiClientError('rate_limit', detail, response.status, validRetry);
      }
      if (response.status === 504) {
        throw new AiClientError('timeout', detail, response.status);
      }
      if (
        response.status === 413 ||
        response.status === 422 ||
        response.status === 400
      ) {
        throw new AiClientError('validation', detail, response.status);
      }
      throw new AiClientError('server', detail, response.status);
    }

    return (await response.json()) as TResponse;
  } catch (err) {
    if (err instanceof AiClientError) {
      throw err;
    }
    if (
      (err instanceof DOMException && err.name === 'AbortError') ||
      controller.signal.aborted
    ) {
      if (timedOut) {
        throw new AiClientError(
          'timeout',
          'The request timed out while waiting for the AlgoMiri API. Please retry.',
        );
      }
      throw new AiClientError('aborted', 'Request was superseded or cancelled.');
    }
    throw new AiClientError(
      'network',
      'Could not reach the AlgoMiri API backend (expected at http://localhost:8000). Start the FastAPI server or use the built-in verified Learning Studio.',
    );
  } finally {
    window.clearTimeout(timerId);
    if (externalSignal) {
      externalSignal.removeEventListener('abort', onExternalAbort);
    }
  }
}

export async function analyzeProblem(
  problemStatement: string,
  options?: RequestOptions,
): Promise<AnalyzeResponseDto> {
  const locale = isSupportedLanguage(options?.locale)
    ? options.locale
    : DEFAULT_LANGUAGE;
  return postJson<AnalyzeResponseDto>(
    '/api/analyze',
    { problem_statement: problemStatement, locale } satisfies AnalyzeRequestDto,
    options,
  );
}

export async function askTutor(
  request: TutorRequestDto,
  options?: RequestOptions,
): Promise<TutorResponseDto> {
  const locale = isSupportedLanguage(request.locale)
    ? request.locale
    : DEFAULT_LANGUAGE;
  return postJson<TutorResponseDto>(
    '/api/tutor',
    { ...request, locale },
    options,
  );
}

export async function inspectProblemUrl(
  url: string,
  options?: RequestOptions,
): Promise<InspectUrlResponseDto> {
  return postJson<InspectUrlResponseDto>('/api/inspect-url', { url }, options);
}

export async function extractProblemFromImages(
  images: ImageInputDto[],
  options?: RequestOptions,
): Promise<ImageExtractionResponseDto> {
  return postJson<ImageExtractionResponseDto>(
    '/api/extract-image',
    { images },
    { ...options, timeoutMs: options?.timeoutMs ?? 40000 },
  );
}

/**
 * Adapts a built-in ProblemModule into a ProblemAnalysisDto so learners can ask the
 * AI Tutor questions inside the verified Learning Studio using explicit context.
 */
export function buildProblemAnalysisFromModule(
  mod: AnyProblemModule,
  strategyId?: string,
): ProblemAnalysisDto {
  const { spec } = mod;
  const ex = spec.examples[0];
  const graph =
    (strategyId ? mod.solutionGraphs[strategyId] : undefined) ??
    mod.solutionGraphs[mod.defaultStrategyId] ??
    Object.values(mod.solutionGraphs)[0];

  const dependenciesByNode = new Map<string, string[]>();
  for (const edge of graph?.edges ?? []) {
    const existing = dependenciesByNode.get(edge.target) ?? [];
    if (!existing.includes(edge.source)) {
      existing.push(edge.source);
    }
    dependenciesByNode.set(edge.target, existing);
  }

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
    subproblem_decomposition: (graph?.nodes ?? []).map((n) => ({
      id: n.id,
      title: n.title,
      goal: n.learningGoal,
      depends_on: dependenciesByNode.get(n.id) ?? [],
    })),
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
