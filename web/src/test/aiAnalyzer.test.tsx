import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AppRoutes } from '../app/App';
import type { AnalyzeResponseDto, TutorResponseDto } from '../services/aiClient';

const MOCK_ANALYZE_RESPONSE: AnalyzeResponseDto = {
  mode: 'ai',
  is_ai_generated: true,
  verified_execution: false,
  notice: null,
  analysis: {
    title: 'Minimum Coin Change',
    inferred_problem_type: 'Dynamic Programming / BFS',
    plain_language_summary:
      'Find the fewest coins needed to make up a target amount.',
    inputs: ['coins: array of positive coin denominations', 'amount: target integer'],
    outputs: ['Minimum number of coins, or -1 if impossible'],
    constraints_and_assumptions: ['Unlimited supply of each coin denomination'],
    clarifications_or_ambiguities: ['Assume amount = 0 requires 0 coins'],
    worked_example: {
      input_summary: 'coins = [1, 2, 5], amount = 11',
      output_summary: '3',
      walkthrough: '5 + 5 + 1 = 11 uses 3 coins.',
    },
    edge_cases: ['amount = 0', 'No combination reaches amount'],
    prerequisite_concepts: ['Subproblems', 'Optimal Substructure'],
    subproblem_decomposition: [
      {
        id: 'dp-1',
        title: 'Define dp[a]',
        goal: 'Represent minimum coins to reach sum a.',
        depends_on: [],
      },
    ],
    candidate_strategies: [
      {
        name: 'Bottom-Up Dynamic Programming',
        technique: 'Dynamic Programming',
        intuition: 'Build answers from amount 0 up to target.',
        why_it_applies: 'Greedy fails on coin systems like [1, 3, 4] for 6.',
        time_complexity: 'O(amount * len(coins))',
        space_complexity: 'O(amount)',
        complexity_assumptions: 'Assumes integer amount >= 0.',
        limitations: 'Large amount values require significant memory.',
      },
    ],
    confidence_notes: 'Conceptual analysis only; no code was executed.',
  },
  verified_match: {
    status: 'conceptual_only',
    matched_problem_id: null,
    matched_problem_title: null,
    studio_path: null,
    reason: 'No deterministic visualization engine exists for Coin Change yet.',
    compatibility_checks: ['No matching deterministic engine in ProblemRegistry.'],
    user_input_note: 'Conceptual analysis only — no trace fabricated.',
  },
};

const MOCK_TUTOR_RESPONSE: TutorResponseDto = {
  mode: 'ai',
  is_ai_generated: true,
  verified_execution: false,
  reply: 'Greedy picks the largest coin first, which can miss a smaller total count.',
  guiding_question: 'For coins [1, 3, 4] and amount 6, what does Greedy pick vs. optimal?',
  progressive_hint: 'Compare 4 + 1 + 1 (3 coins) with 3 + 3 (2 coins).',
  mastery_disclaimer:
    'AI tutoring supports conceptual understanding and does not verify code execution or measure long-term skill mastery.',
  notice: null,
};

describe('Frontend AI Problem Analyzer & Beginner Tutor', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders structured AI conceptual analysis and supports AI Tutor interaction', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => MOCK_ANALYZE_RESPONSE,
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => MOCK_TUTOR_RESPONSE,
      } as Response);

    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/']}>
        <AppRoutes />
      </MemoryRouter>,
    );

    const textarea = screen.getByLabelText(/paste a problem statement/i);
    await user.type(
      textarea,
      'Given coin denominations and a target amount, find the minimum coins needed.',
    );
    await user.click(
      screen.getByRole('button', { name: /analyze problem \(ai\)/i }),
    );

    expect(
      await screen.findByText(/ai-generated · conceptual \(not verified\)/i),
    ).toBeInTheDocument();
    expect(screen.getByText('Minimum Coin Change')).toBeInTheDocument();
    expect(screen.getByText(/^conceptual analysis only$/i)).toBeInTheDocument();

    // Ask AI Tutor for a conceptual hint
    await user.click(
      screen.getByRole('button', { name: /give a conceptual hint/i }),
    );
    expect(
      await screen.findByText(/compare 4 \+ 1 \+ 1/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/does not verify code execution/i),
    ).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('handles timeout/error gracefully and supports retry', async () => {
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce({
        ok: false,
        status: 504,
        json: async () => ({ detail: 'AI analysis timed out. Please retry.' }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => MOCK_ANALYZE_RESPONSE,
      } as Response);

    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/']}>
        <AppRoutes />
      </MemoryRouter>,
    );

    const textarea = screen.getByLabelText(/paste a problem statement/i);
    await user.type(
      textarea,
      'Given coin denominations and a target amount, find the minimum coins needed.',
    );
    await user.click(
      screen.getByRole('button', { name: /analyze problem \(ai\)/i }),
    );

    expect(await screen.findByRole('alert')).toHaveTextContent(/timed out/i);

    await user.click(screen.getByRole('button', { name: /retry/i }));
    expect(await screen.findByText('Minimum Coin Change')).toBeInTheDocument();
  });

  it('flags stale analysis when problem text changes, re-analyzes, and resets AI Tutor state', async () => {
    const secondAnalysis: AnalyzeResponseDto = {
      ...MOCK_ANALYZE_RESPONSE,
      analysis: {
        ...MOCK_ANALYZE_RESPONSE.analysis,
        title: 'Longest Increasing Subsequence',
      },
    };

    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => MOCK_ANALYZE_RESPONSE,
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => MOCK_TUTOR_RESPONSE,
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => secondAnalysis,
      } as Response);

    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/']}>
        <AppRoutes />
      </MemoryRouter>,
    );

    const textarea = screen.getByLabelText(/paste a problem statement/i);
    await user.type(
      textarea,
      'Given coin denominations and a target amount, find the minimum coins needed.',
    );
    await user.click(
      screen.getByRole('button', { name: /analyze problem \(ai\)/i }),
    );
    expect(await screen.findByText('Minimum Coin Change')).toBeInTheDocument();

    // Generate a Tutor message under the first analysis
    await user.click(
      screen.getByRole('button', { name: /give a conceptual hint/i }),
    );
    expect(await screen.findByText(/compare 4 \+ 1 \+ 1/i)).toBeInTheDocument();

    // Edit problem statement in place -> stale warning must appear
    await user.type(textarea, ' Also handle negative coins or unbounded amount.');

    expect(
      screen.getByText(/outdated analysis — problem statement changed/i),
    ).toBeInTheDocument();

    // Click Re-analyze Updated Text -> new analysis replaces old and clears old Tutor messages
    await user.click(
      screen.getByRole('button', { name: /re-analyze updated text/i }),
    );
    expect(
      await screen.findByText('Longest Increasing Subsequence'),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/outdated analysis — problem statement changed/i),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/compare 4 \+ 1 \+ 1/i)).not.toBeInTheDocument();
  });

  it('prevents an older slow analysis response from overwriting a newer rapid request', async () => {
    let resolveSlowFirst!: (res: Response) => void;
    const slowFirstPromise = new Promise<Response>((resolve) => {
      resolveSlowFirst = resolve;
    });

    const newerResponse: AnalyzeResponseDto = {
      ...MOCK_ANALYZE_RESPONSE,
      analysis: {
        ...MOCK_ANALYZE_RESPONSE.analysis,
        title: 'Newer Problem Wins',
      },
    };
    const staleSlowResponse: AnalyzeResponseDto = {
      ...MOCK_ANALYZE_RESPONSE,
      analysis: {
        ...MOCK_ANALYZE_RESPONSE.analysis,
        title: 'Older Slow Problem Should Be Ignored',
      },
    };

    vi.spyOn(globalThis, 'fetch')
      // Initial baseline analysis
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => MOCK_ANALYZE_RESPONSE,
      } as Response)
      // Re-analyze #1 (slow, resolves last)
      .mockImplementationOnce(() => slowFirstPromise)
      // Re-analyze #2 (fast, resolves first)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => newerResponse,
      } as Response);

    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/']}>
        <AppRoutes />
      </MemoryRouter>,
    );

    const textarea = screen.getByLabelText(/paste a problem statement/i);
    await user.type(
      textarea,
      'Given coin denominations and a target amount, find the minimum coins needed.',
    );
    await user.click(
      screen.getByRole('button', { name: /analyze problem \(ai\)/i }),
    );
    expect(await screen.findByText('Minimum Coin Change')).toBeInTheDocument();

    // Edit and fire Re-analyze #1 (slow)
    await user.type(textarea, ' Variant 1');
    await user.click(
      screen.getByRole('button', { name: /re-analyze updated text/i }),
    );

    // Edit again and fire Re-analyze #2 (fast) before #1 completes
    await user.type(textarea, ' Variant 2');
    await user.click(
      screen.getByRole('button', { name: /re-analyze updated text/i }),
    );

    expect(await screen.findByText('Newer Problem Wins')).toBeInTheDocument();

    // Now resolve the slow earlier request and verify it does NOT clobber the newer result
    resolveSlowFirst({
      ok: true,
      status: 200,
      json: async () => staleSlowResponse,
    } as Response);

    await new Promise((r) => setTimeout(r, 20));
    expect(screen.getByText('Newer Problem Wins')).toBeInTheDocument();
    expect(
      screen.queryByText('Older Slow Problem Should Be Ignored'),
    ).not.toBeInTheDocument();
  });

  it('clearly distinguishes Verified and Ambiguous matches from Conceptual-Only results', async () => {
    const verifiedResponse: AnalyzeResponseDto = {
      ...MOCK_ANALYZE_RESPONSE,
      analysis: {
        ...MOCK_ANALYZE_RESPONSE.analysis,
        title: 'Two Sum',
      },
      verified_match: {
        status: 'verified',
        matched_problem_id: 'two-sum',
        matched_problem_title: 'Two Sum',
        studio_path: '/studio/two-sum',
        reason: 'Matches our verified Two Sum deterministic engine.',
        compatibility_checks: ['Distinct 0-based indices confirmed.'],
        user_input_note:
          'Opening the Studio loads curated examples; pasted text is not executed.',
      },
    };
    const ambiguousResponse: AnalyzeResponseDto = {
      ...MOCK_ANALYZE_RESPONSE,
      analysis: {
        ...MOCK_ANALYZE_RESPONSE.analysis,
        title: 'Split Array Largest Sum (Sign Unspecified)',
      },
      verified_match: {
        status: 'ambiguous',
        matched_problem_id: 'split-array-largest-sum',
        matched_problem_title: 'Split Array Largest Sum',
        studio_path: '/studio/split-array-largest-sum',
        reason: 'Nonnegative constraint is not explicitly stated.',
        compatibility_checks: ['Missing nonnegative integer constraint.'],
        user_input_note: 'Inspect curated Studio only if numbers are nonnegative.',
      },
    };

    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => verifiedResponse,
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ambiguousResponse,
      } as Response);

    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/']}>
        <AppRoutes />
      </MemoryRouter>,
    );

    const textarea = screen.getByLabelText(/paste a problem statement/i);
    await user.type(
      textarea,
      'Two Sum: Given an array of integers nums and target, find two distinct indices summing to target.',
    );
    await user.click(
      screen.getByRole('button', { name: /analyze problem \(ai\)/i }),
    );

    expect(
      await screen.findByText(/verified deterministic studio available/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /open verified two sum studio/i }),
    ).toBeInTheDocument();
    // AI conceptual label remains visibly distinct from verified execution
    expect(
      screen.getByText(/ai-generated · conceptual \(not verified\)/i),
    ).toBeInTheDocument();

    // Clearing textarea dismisses stale analysis cleanly; typing new statement enables fresh Analyze
    await user.clear(textarea);
    expect(
      screen.queryByText(/verified deterministic studio available/i),
    ).not.toBeInTheDocument();

    await user.type(
      textarea,
      'Split Array Largest Sum: Given an array of integers nums and integer k, minimize the largest subarray sum.',
    );
    await user.click(
      screen.getByRole('button', { name: /analyze problem \(ai\)/i }),
    );

    expect(
      await screen.findByText(/ambiguous match — please choose/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', {
        name: /inspect curated split array largest sum studio/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/verified deterministic studio available/i),
    ).not.toBeInTheDocument();
  });

  it('displays rate-limit retry guidance (429) and backend-unavailable network recovery', async () => {
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce({
        ok: false,
        status: 429,
        headers: new Headers({ 'Retry-After': '15' }),
        json: async () => ({
          detail: 'Rate limit exceeded. Please wait before sending another request.',
        }),
      } as Response)
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => MOCK_ANALYZE_RESPONSE,
      } as Response);

    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/']}>
        <AppRoutes />
      </MemoryRouter>,
    );

    const textarea = screen.getByLabelText(/paste a problem statement/i);
    await user.type(
      textarea,
      'Given coin denominations and a target amount, find the minimum coins needed.',
    );
    await user.click(
      screen.getByRole('button', { name: /analyze problem \(ai\)/i }),
    );

    const rateAlert = await screen.findByRole('alert');
    expect(rateAlert).toHaveTextContent(/rate limit exceeded/i);
    expect(rateAlert).toHaveTextContent(/~15s/i);

    // Retry hits backend-unavailable network error
    await user.click(screen.getByRole('button', { name: /retry/i }));
    const networkAlert = await screen.findByRole('alert');
    expect(networkAlert).toHaveTextContent(/could not reach the algomiri api/i);

    // Second retry recovers cleanly
    await user.click(screen.getByRole('button', { name: /retry/i }));
    expect(await screen.findByText('Minimum Coin Change')).toBeInTheDocument();
  });
});
