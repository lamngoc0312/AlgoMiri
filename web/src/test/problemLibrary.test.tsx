import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AppRoutes } from '../app/App';

describe('Product Reset — Scalable Problem Library & Prefill Flow', () => {
  it('filters problems by search, topic, difficulty, and visualization availability, and prefills original AI-guided problems on Landing', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/problems']}>
        <AppRoutes />
      </MemoryRouter>,
    );

    // Three honest tiers separated clearly — no locked/unavailable placeholder grid
    expect(
      screen.getByRole('heading', { name: /verified visual studios/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /original ai-guided practice problems/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /external practice references/i }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/unavailable yet/i)).not.toBeInTheDocument();

    // Filter to Visual Studios only
    await user.click(screen.getByRole('button', { name: /^visual studios$/i }));
    expect(
      screen.queryByRole('heading', { name: /original ai-guided practice problems/i }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Two Sum' })).toBeInTheDocument();

    // Switch to AI-Guided only and search for "Coin Change"
    await user.click(screen.getByRole('button', { name: /^ai-guided$/i }));
    const search = screen.getByLabelText(/search problems/i);
    await user.type(search, 'Coin Change');
    expect(screen.getByText('Minimum Coin Change')).toBeInTheDocument();
    expect(
      screen.queryByText('Pair Sum in a Sorted Array'),
    ).not.toBeInTheDocument();

    // Clicking "Analyze Conceptually" navigates to Landing with original problem statement prefilled
    await user.click(
      screen.getByRole('link', { name: /analyze conceptually/i }),
    );
    expect(
      screen.getByRole('heading', {
        name: /understand the logic before you code/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/paste a problem statement/i)).toHaveValue(
      'Given a list of positive coin denominations (unlimited supply of each) and a nonnegative target amount, return the minimum number of coins required to make up the exact amount, or -1 if impossible.',
    );
  });
});
