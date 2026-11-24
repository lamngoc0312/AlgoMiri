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

describe('Split Array Largest Sum — Studio UI, Composition Inspector & Checkpoints', () => {
  it('renders 5-stage Guided Lesson, enforces checkpoints, and rejects negative custom input', async () => {
    const user = userEvent.setup();
    renderAt('/studio/split-array-largest-sum');

    expect(
      screen.getByRole('heading', {
        name: /stage 1: contiguous partitions & minimax goal/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText(/stage 1 of 5/i)).toBeInTheDocument();

    // Guided Predict checkpoint blocks Next and forward timeline jumps
    expect(screen.getByRole('button', { name: /^next step$/i })).toBeDisabled();

    // Negative input shows clear nonnegative rule alert
    const numsInput = screen.getByLabelText(/array \(nums/i);
    await user.clear(numsInput);
    await user.type(numsInput, '7, -3, 5');
    await user.click(screen.getByRole('button', { name: /apply/i }));
    expect(screen.getByRole('alert')).toHaveTextContent(/nonnegative/i);
  });

  it('synchronizes Micro View, Binary Search Iteration Inspector, and Macro Composition Map in Free Exploration', async () => {
    const user = userEvent.setup();
    renderAt('/studio/split-array-largest-sum?mode=explore');

    expect(
      screen.getByRole('heading', { name: /composition execution canvas/i }),
    ).toBeInTheDocument();

    // Seek to final converged step -> answer 18 + iteration inspector buttons appear
    const slider = screen.getByLabelText(
      /trace step timeline/i,
    ) as HTMLInputElement;
    fireEvent.change(slider, { target: { value: slider.max } });

    expect(
      screen.getByText(/minimized largest subarray sum: 18/i),
    ).toBeInTheDocument();

    // Click Iteration #1 in the Binary Search Iteration Inspector to inspect its subtrace
    const historyPanel = screen.getByLabelText(
      /binary search iteration history/i,
    );
    const iterButtons = within(historyPanel).getAllByRole('button');
    expect(iterButtons.length).toBeGreaterThan(0);
    await user.click(iterButtons[0]);
    expect(screen.getByText(/bs iter #1/i)).toBeInTheDocument();

    // Switch to Macro View -> shows Binary Search + Greedy Composition Map
    await user.click(
      screen.getByRole('button', { name: /macro view \(solution map\)/i }),
    );
    const graph = screen.getByLabelText(/interactive solution dependency graph/i);
    expect(
      within(graph).getByRole('button', {
        name: /binary search driver \(pick mid\)/i,
      }),
    ).toBeInTheDocument();
    expect(
      within(graph).getByRole('button', {
        name: /greedy feasibility checker/i,
      }),
    ).toBeInTheDocument();
  });
});
