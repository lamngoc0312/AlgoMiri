import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
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

describe('AlgoMiri smoke tests', () => {
  it('renders the Landing page hero and handles unsupported pasted problems honestly', async () => {
    const user = userEvent.setup();
    renderAt('/');

    expect(
      screen.getByRole('heading', {
        name: /understand the logic before you code/i,
      }),
    ).toBeInTheDocument();

    const textarea = screen.getByLabelText(/paste a problem statement/i);
    await user.type(textarea, 'Find the shortest path in a weighted graph using Dijkstra');
    await user.click(screen.getByRole('button', { name: /open curated studio/i }));

    expect(screen.getByRole('alert')).toHaveTextContent(
      /not supported in current demo/i,
    );
  });

  it('rejects incompatible variants like 3Sum from direct curated studio routing', async () => {
    const user = userEvent.setup();
    renderAt('/');

    const textarea = screen.getByLabelText(/paste a problem statement/i);
    await user.type(
      textarea,
      '3Sum: Given an integer array nums, return all unique triplets of three indices that sum to 0.',
    );
    await user.click(screen.getByRole('button', { name: /open curated studio/i }));

    expect(screen.getByRole('alert')).toHaveTextContent(
      /not supported in current demo/i,
    );
  });

  it('navigates to Studio when Two Sum is submitted on Landing', async () => {
    const user = userEvent.setup();
    renderAt('/');

    await user.click(screen.getByRole('button', { name: /load two sum sample/i }));
    await user.click(screen.getByRole('button', { name: /open curated studio/i }));

    expect(
      screen.getByRole('heading', { name: /learning studio/i }),
    ).toBeInTheDocument();
  });

  it('redirects legacy /studio?mode=explore and steps through both Two Sum strategies', async () => {
    const user = userEvent.setup();
    renderAt('/studio?mode=explore');

    expect(screen.getByText(/step 1 of 4/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /next step/i }));
    expect(screen.getByText(/step 2 of 4/i)).toBeInTheDocument();

    // Switch to Brute Force strategy — should reset step index to Step 1 of 3
    await user.click(
      screen.getByRole('radio', { name: /brute force pair check/i }),
    );
    expect(screen.getByText(/step 1 of 3/i)).toBeInTheDocument();
  });

  it('routes hyphenated non-negative Split Array statements to the curated Studio', async () => {
    const user = userEvent.setup();
    renderAt('/');

    const textarea = screen.getByLabelText(/paste a problem statement/i);
    await user.type(
      textarea,
      'Split Array Largest Sum: Given an array of non-negative integers nums and k, minimize the largest subarray sum.',
    );
    await user.click(screen.getByRole('button', { name: /open curated studio/i }));

    expect(
      screen.getByRole('heading', { name: /learning studio/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', {
        name: /stage 1: contiguous partitions & minimax goal/i,
      }),
    ).toBeInTheDocument();
  });

  it('displays personalized local history notices on Roadmap and Progress pages', () => {
    window.localStorage.clear();
    const { unmount } = renderAt('/roadmap');
    expect(
      screen.getByText(/personalized · local history/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /algorithm learning roadmap/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/start with two sum guided learning/i),
    ).toBeInTheDocument();
    unmount();

    renderAt('/progress');
    expect(screen.getByText(/local browser history/i)).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /learning progress/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/no learning sessions recorded yet/i),
    ).toBeInTheDocument();
  });
});
