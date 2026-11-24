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
});
