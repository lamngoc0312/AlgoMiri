import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AppRoutes } from '../app/App';

function renderAt(initialEntry: string) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <AppRoutes />
    </MemoryRouter>,
  );
}

describe('Phase A — Checkpoint Enforcement & Stage Status Integrity', () => {
  it('blocks Next and forward timeline seeking at unanswered guided checkpoints until answered or skipped', async () => {
    const user = userEvent.setup();
    renderAt('/studio/two-sum');

    // Step 1 has an unanswered checkpoint in Guided Mode
    const nextButton = screen.getByRole('button', { name: /^next step$/i });
    const playButton = screen.getByRole('button', { name: /play trace/i });
    const slider = screen.getByLabelText(
      /trace step timeline/i,
    ) as HTMLInputElement;

    expect(nextButton).toBeDisabled();
    expect(playButton).toBeDisabled();

    // Attempting to seek forward via timeline must NOT bypass checkpoint
    fireEvent.change(slider, { target: { value: '2' } });
    expect(screen.getByText(/step 1 of 3/i)).toBeInTheDocument();

    // Explicit Skip & Reveal advances to Step 2
    const predictSection = screen.getByRole('region', {
      name: /predict the next step/i,
    });
    await user.click(
      within(predictSection).getByRole('button', {
        name: /skip & reveal next step/i,
      }),
    );
    expect(screen.getByText(/step 2 of 3/i)).toBeInTheDocument();

    // Backward navigation (Prev) remains allowed even when Step 2 has a checkpoint
    await user.click(screen.getByRole('button', { name: /previous step/i }));
    expect(screen.getByText(/step 1 of 3/i)).toBeInTheDocument();
  });

  it('distinguishes attempted and skipped-after-attempt stage states in Session Summary', async () => {
    const user = userEvent.setup();
    renderAt('/studio/two-sum');

    // Answer Stage 1 INCORRECTLY -> marks stage as Attempted
    await user.click(
      screen.getByRole('radio', { name: /yes — index 0 adds to 6 with itself/i }),
    );
    expect(screen.getByText(/^attempted$/i)).toBeInTheDocument();

    // Skip Stage 1 without answering correctly -> becomes Skipped After Attempt
    await user.click(screen.getByRole('button', { name: /skip to stage 2/i }));
    await user.click(screen.getByRole('button', { name: /^summary$/i }));

    expect(
      screen.getByText(/verified concepts completed \(0 \/ 4\)/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/skipped after attempt \(1\): understand/i),
    ).toBeInTheDocument();
  });
});

describe('Multi-Problem Library, Routing & Valid Parentheses Studio', () => {
  it('renders Problem Library with supported problems and unavailable upcoming problems', () => {
    renderAt('/problems');

    expect(
      screen.getByRole('heading', { name: /problem library/i }),
    ).toBeInTheDocument();
    expect(screen.getByText('Two Sum')).toBeInTheDocument();
    expect(screen.getByText('Valid Parentheses')).toBeInTheDocument();
    expect(screen.getByText('Binary Search')).toBeInTheDocument();
    expect(screen.getAllByText(/unavailable yet/i).length).toBeGreaterThan(0);
  });

  it('renders Valid Parentheses Studio with vertical Stack canvas, validation, and 1 strategy', async () => {
    const user = userEvent.setup();
    renderAt('/studio/valid-parentheses?mode=explore');

    expect(
      screen.getByRole('heading', { name: /stack execution canvas/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText(/vertical stack visualization/i),
    ).toBeInTheDocument();
    expect(screen.getByText('TOP')).toBeInTheDocument();

    // Validate unsupported characters
    const input = screen.getByLabelText(/bracket string/i);
    await user.clear(input);
    await user.type(input, '(abc)');
    await user.click(screen.getByRole('button', { name: /apply/i }));
    expect(screen.getByRole('alert')).toHaveTextContent(
      /unsupported characters/i,
    );

    // Apply mismatch preset "(]" and seek to final terminal Invalid state
    await user.click(screen.getByRole('button', { name: /mismatch "\(]"/i }));
    const slider = screen.getByLabelText(
      /trace step timeline/i,
    ) as HTMLInputElement;
    fireEvent.change(slider, { target: { value: slider.max } });
    expect(screen.getByText(/invalid parentheses \(false\)/i)).toBeInTheDocument();
  });

  it('resets learning state cleanly when switching between Two Sum and Valid Parentheses', async () => {
    const user = userEvent.setup();
    renderAt('/studio/two-sum');

    // Reveal a hint on Two Sum
    await user.click(screen.getByRole('button', { name: /reveal hint 1 of 3/i }));
    expect(screen.getByText(/1 \/ 3 revealed/i)).toBeInTheDocument();

    // Switch to Valid Parentheses via Quick Problem Switcher
    const switcher = screen.getByRole('navigation', { name: /switch problem/i });
    await user.click(
      within(switcher).getByRole('link', { name: /valid parentheses/i }),
    );

    // State must be cleanly reset for Valid Parentheses
    expect(
      screen.getByRole('heading', {
        name: /stage 1: understand balanced brackets/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText(/0 \/ 3 revealed/i)).toBeInTheDocument();
  });

  it('shows honest unavailable state for unknown problem routes', () => {
    renderAt('/studio/dijkstra-shortest-path');
    expect(
      screen.getByRole('heading', { name: /problem not available yet/i }),
    ).toBeInTheDocument();
  });
});
