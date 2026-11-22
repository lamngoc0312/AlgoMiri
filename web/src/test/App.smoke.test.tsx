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
    await user.click(screen.getByRole('button', { name: /open in studio/i }));

    expect(screen.getByRole('alert')).toHaveTextContent(
      /not supported in sprint 1 demo/i,
    );
  });

  it('navigates to Studio when Two Sum is submitted on Landing', async () => {
    const user = userEvent.setup();
    renderAt('/');

    await user.click(screen.getByRole('button', { name: /load two sum sample/i }));
    await user.click(screen.getByRole('button', { name: /open in studio/i }));

    expect(
      screen.getByRole('heading', { name: /learning studio/i }),
    ).toBeInTheDocument();
  });

  it('switches strategies and steps through the Two Sum trace in Studio', async () => {
    const user = userEvent.setup();
    renderAt('/studio');

    expect(screen.getByText(/step 1 of 4/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /next step/i }));
    expect(screen.getByText(/step 2 of 4/i)).toBeInTheDocument();

    // Switch to Brute Force strategy — should reset step index to Step 1 of 3
    await user.click(
      screen.getByRole('radio', { name: /brute force pair check/i }),
    );
    expect(screen.getByText(/step 1 of 3/i)).toBeInTheDocument();
  });

  it('displays explicit Demo Data notices on Roadmap and Progress previews', () => {
    const { unmount } = renderAt('/roadmap');
    expect(screen.getByText(/demo data/i)).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /algorithm learning roadmap/i }),
    ).toBeInTheDocument();
    unmount();

    renderAt('/progress');
    expect(screen.getAllByText(/demo data/i).length).toBeGreaterThan(0);
    expect(
      screen.getByRole('heading', { name: /learning progress/i }),
    ).toBeInTheDocument();
  });
});
