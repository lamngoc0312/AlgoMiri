import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AppRoutes } from '../app/App';
import type {
  AnalyzeResponseDto,
  ImageExtractionResponseDto,
  InspectUrlResponseDto,
} from '../services/aiClient';

const MOCK_LEETCODE_URL_RESPONSE: InspectUrlResponseDto = {
  original_url: 'https://leetcode.com/problems/reverse-integer/description/',
  canonical_url: 'https://leetcode.com/problems/reverse-integer/',
  source_name: 'LeetCode',
  slug: 'reverse-integer',
  display_title: 'Reverse Integer',
  retrieval_status: 'restricted_source',
  message:
    'Recognized LeetCode problem “Reverse Integer” (reverse-integer). AlgoMiri does not scrape or fetch copyrighted LeetCode statements automatically. Paste the problem statement or upload a screenshot to analyze it.',
  extracted_text: null,
  verified_match: null,
};

const MOCK_IMAGE_EXTRACTION: ImageExtractionResponseDto = {
  mode: 'ai',
  is_ai_generated: true,
  extracted_text:
    'Reverse Integer: Given a signed 32-bit integer x, return x with its digits reversed. Range: [-2^31, 2^31 - 1].',
  diagram_notes: ['Example box shows Input: x = -123 -> Output: -321'],
  uncertain_regions: ['Bottom-right constraint line is partially cropped'],
  needs_confirmation: true,
  notice: null,
};

const MOCK_REVERSE_INT_ANALYSIS: AnalyzeResponseDto = {
  mode: 'ai',
  is_ai_generated: true,
  verified_execution: false,
  notice: null,
  analysis: {
    title: 'Reverse Integer',
    inferred_problem_type: 'Math & Overflow Guard',
    plain_language_summary:
      'Reverse the digits of a signed 32-bit integer and return 0 if the result overflows.',
    inputs: ['x: signed 32-bit integer'],
    outputs: ['Reversed 32-bit integer or 0 on overflow'],
    constraints_and_assumptions: ['No 64-bit integer storage allowed.'],
    clarifications_or_ambiguities: [
      'How do you detect overflow before multiplying rev by 10?',
    ],
    worked_example: {
      input_summary: 'x = -123',
      output_summary: '-321',
      walkthrough: 'Pop digits with % 10 and push onto rev.',
    },
    edge_cases: ['x = 0', 'Trailing zeros like 120', 'Overflow values'],
    prerequisite_concepts: ['Modulo arithmetic', '32-bit bounds'],
    subproblem_decomposition: [
      {
        id: 'step-1',
        title: 'Pop last digit',
        goal: 'Use x % 10 to peel off the rightmost digit.',
        depends_on: [],
      },
    ],
    candidate_strategies: [
      {
        name: 'Digit Pop & Push',
        technique: 'Base-10 Math',
        intuition: 'Build reversed integer digit by digit.',
        why_it_applies: 'O(1) space and respects 32-bit limits.',
        time_complexity: 'O(log10 |x|)',
        space_complexity: 'O(1)',
        complexity_assumptions: 'At most 10 digits.',
        limitations: 'Requires careful negative modulo handling.',
      },
    ],
    confidence_notes: 'Conceptual analysis only.',
  },
  verified_match: {
    status: 'conceptual_only',
    matched_problem_id: null,
    matched_problem_title: null,
    studio_path: null,
    reason: 'No deterministic visualization engine exists for Reverse Integer yet.',
    compatibility_checks: [],
    user_input_note: 'Conceptual analysis only.',
  },
};

describe('Unified Problem Composer — URL Inspection & Image Understanding', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('recognizes a LeetCode URL safely without scraping and guides the learner to text or screenshot input', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => MOCK_LEETCODE_URL_RESPONSE,
    } as Response);

    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/']}>
        <AppRoutes />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('tab', { name: /problem url/i }));
    await user.type(
      screen.getByLabelText(/paste a problem url/i),
      'https://leetcode.com/problems/reverse-integer/description/',
    );
    await user.click(screen.getByRole('button', { name: /inspect url/i }));

    expect(
      await screen.findByRole('heading', { name: 'Reverse Integer' }),
    ).toBeInTheDocument();
    expect(screen.getByText('reverse-integer')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /open original problem/i }),
    ).toHaveAttribute('href', 'https://leetcode.com/problems/reverse-integer/');
    expect(
      screen.getByText(/does not scrape or fetch copyrighted leetcode/i),
    ).toBeInTheDocument();
  });

  it('uploads a screenshot, shows extracted math/diagrams/uncertainties for confirmation, and analyzes on confirm', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => MOCK_IMAGE_EXTRACTION,
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => MOCK_REVERSE_INT_ANALYSIS,
      } as Response);

    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/']}>
        <AppRoutes />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('tab', { name: /screenshot/i }));
    const fileInput = screen.getByLabelText(/choose screenshot files/i);
    const pngFile = new File([new Uint8Array([137, 80, 78, 71])], 'reverse-int.png', {
      type: 'image/png',
    });
    await user.upload(fileInput, pngFile);

    expect(await screen.findByText('reverse-int.png')).toBeInTheDocument();
    await user.click(
      screen.getByRole('button', { name: /extract problem text/i }),
    );

    // Confirmation step displays extracted math notation, diagram notes, and uncertain regions
    const confirmBox = await screen.findByLabelText(
      /confirm extracted problem text/i,
    );
    expect(confirmBox).toHaveValue(MOCK_IMAGE_EXTRACTION.extracted_text);
    expect(
      screen.getByText(/input: x = -123 -> output: -321/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/bottom-right constraint line is partially cropped/i),
    ).toBeInTheDocument();

    // Confirm & Analyze triggers /api/analyze and renders Reader Card
    await user.click(screen.getByRole('button', { name: /confirm & analyze/i }));
    expect(
      await screen.findByRole('heading', { name: 'Reverse Integer' }),
    ).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
