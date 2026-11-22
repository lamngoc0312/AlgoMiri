import { describe, expect, it, vi, afterEach } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AppRoutes } from '../app/App';

function renderStudio() {
  return render(
    <MemoryRouter initialEntries={['/studio']}>
      <AppRoutes />
    </MemoryRouter>,
  );
}

describe('Learning Studio interactive controls', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('applies valid custom input and reaches terminal found state', async () => {
    const user = userEvent.setup();
    renderStudio();

    const numsInput = screen.getByLabelText(/array \(nums\)/i);
    const targetInput = screen.getByLabelText(/^target$/i);

    await user.clear(numsInput);
    await user.type(numsInput, '-3, 4, 3, 90');
    await user.clear(targetInput);
    await user.type(targetInput, '0');
    await user.click(screen.getByRole('button', { name: /apply/i }));

    // Seek to last step via timeline slider
    const slider = screen.getByLabelText(/trace step timeline/i) as HTMLInputElement;
    fireEvent.change(slider, { target: { value: slider.max } });

    expect(screen.getByText(/solution found: indices \[0, 2\]/i)).toBeInTheDocument();
  });

  it('shows validation error for invalid custom input without breaking current trace', async () => {
    const user = userEvent.setup();
    renderStudio();

    const numsInput = screen.getByLabelText(/array \(nums\)/i);
    await user.clear(numsInput);
    await user.type(numsInput, '2, hello, 7');
    await user.click(screen.getByRole('button', { name: /apply/i }));

    expect(screen.getByRole('alert')).toHaveTextContent(/not a valid integer/i);
    // Original default array still rendered cleanly
    expect(screen.getByText(/step 1 of 4/i)).toBeInTheDocument();
  });

  it('handles no-solution and empty-array presets cleanly', async () => {
    const user = userEvent.setup();
    renderStudio();

    await user.click(screen.getByRole('button', { name: /no match \[1, 2, 3\]/i }));
    const slider = screen.getByLabelText(/trace step timeline/i) as HTMLInputElement;
    fireEvent.change(slider, { target: { value: slider.max } });
    expect(screen.getByRole('status')).toHaveTextContent(/no valid pair found/i);

    await user.click(screen.getByRole('button', { name: /empty \[\]/i }));
    expect(screen.getByText(/empty array \(\[\]\)/i)).toBeInTheDocument();
    expect(screen.getByText(/step 1 of 1/i)).toBeInTheDocument();
  });

  it('supports Prev, Next, Reset, Speed, and Strategy switching reset', async () => {
    const user = userEvent.setup();
    renderStudio();

    expect(screen.getByText(/step 1 of 4/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /next step/i }));
    expect(screen.getByText(/step 2 of 4/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /previous step/i }));
    expect(screen.getByText(/step 1 of 4/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /next step/i }));
    await user.click(screen.getByRole('button', { name: /reset trace/i }));
    expect(screen.getByText(/step 1 of 4/i)).toBeInTheDocument();

    const speedSelect = screen.getByLabelText(/playback speed/i);
    await user.selectOptions(speedSelect, '2');
    expect((speedSelect as HTMLSelectElement).value).toBe('2');

    // Advance then switch strategy -> must reset to Step 1
    await user.click(screen.getByRole('button', { name: /next step/i }));
    await user.click(
      screen.getByRole('radio', { name: /brute force pair check/i }),
    );
    expect(screen.getByText(/step 1 of 3/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/seen hash map visualization/i)).not.toBeInTheDocument();
  });

  it('auto-plays steps when Play is clicked and stops cleanly on Pause or unmount', () => {
    vi.useFakeTimers();
    const { unmount } = renderStudio();

    expect(screen.getByText(/step 1 of 4/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /play trace/i }));
    expect(screen.getByRole('button', { name: /pause trace/i })).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getByText(/step 2 of 4/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /pause trace/i }));
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    // Still on Step 2 after pausing
    expect(screen.getByText(/step 2 of 4/i)).toBeInTheDocument();

    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});
