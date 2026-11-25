import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AppRoutes } from '../app/App';
import type { TutorResponseDto } from '../services/aiClient';

const MOCK_STUDIO_TUTOR_RESPONSE: TutorResponseDto = {
  mode: 'ai',
  is_ai_generated: true,
  verified_execution: false,
  reply:
    'The Hash Map stores previously visited numbers so each complement lookup takes O(1) average time.',
  guiding_question:
    'When nums[i] is 7 and target is 9, which complement do we look up in seen?',
  progressive_hint: 'Check target - nums[i] = 9 - 7 = 2.',
  mastery_disclaimer:
    'AI tutoring supports conceptual understanding and does not verify code execution or measure long-term skill mastery.',
  notice: null,
};

describe('Phase 2.1 — Studio AI Tutor Persistence & Accessible WAI-ARIA Tabs', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('preserves AI Tutor response and draft input when switching between Step Explanation and Ask AI Tutor, and resets when strategy changes', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => MOCK_STUDIO_TUTOR_RESPONSE,
    } as Response);

    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/studio/two-sum?mode=explore']}>
        <AppRoutes />
      </MemoryRouter>,
    );

    const explanationTab = screen.getByRole('tab', {
      name: /^step explanation$/i,
    });
    const tutorTab = screen.getByRole('tab', { name: /^ask ai tutor$/i });

    // Verify WAI-ARIA tab/tabpanel linkage and roving tabIndex
    expect(explanationTab).toHaveAttribute(
      'aria-controls',
      'studio-dock-panel-explanation',
    );
    expect(tutorTab).toHaveAttribute('aria-controls', 'studio-dock-panel-tutor');
    expect(explanationTab).toHaveAttribute('tabindex', '0');
    expect(tutorTab).toHaveAttribute('tabindex', '-1');

    // Keyboard navigation with ArrowRight activates Ask AI Tutor and moves focus
    explanationTab.focus();
    await user.keyboard('{ArrowRight}');
    expect(tutorTab).toHaveFocus();
    expect(tutorTab).toHaveAttribute('aria-selected', 'true');
    expect(tutorTab).toHaveAttribute('tabindex', '0');

    // Generate an AI Tutor response and type a follow-up draft question
    await user.click(screen.getByRole('button', { name: /give a hint/i }));
    expect(
      await screen.findByText(/check target - nums\[i\] = 9 - 7 = 2/i),
    ).toBeInTheDocument();

    const draftInput = screen.getByLabelText(/ask a question/i);
    await user.type(draftInput, 'What if duplicates appear?');
    expect(draftInput).toHaveValue('What if duplicates appear?');

    // Switch back to Step Explanation using ArrowLeft
    tutorTab.focus();
    await user.keyboard('{ArrowLeft}');
    expect(explanationTab).toHaveFocus();
    expect(explanationTab).toHaveAttribute('aria-selected', 'true');

    // Switch back to Ask AI Tutor -> previous reply and draft must still be intact
    await user.click(tutorTab);
    expect(
      screen.getByText(/check target - nums\[i\] = 9 - 7 = 2/i),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/ask a question/i)).toHaveValue(
      'What if duplicates appear?',
    );

    // Change strategy from Hash Map -> Brute Force => incompatible context resets Tutor state
    await user.click(
      screen.getByRole('radio', { name: /brute force pair check/i }),
    );
    expect(
      screen.queryByText(/check target - nums\[i\] = 9 - 7 = 2/i),
    ).not.toBeInTheDocument();
    expect(screen.getByLabelText(/ask a question/i)).toHaveValue('');
  });
});
