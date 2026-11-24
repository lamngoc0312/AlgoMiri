import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AppRoutes } from '../app/App';
import { defaultLearningRepository } from '../services/learningRepository';

describe('Sprint 8 — Studio Session Saving & Functional Progress Page Integration', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('shows honest empty state on Progress Page with zero fabricated metrics for new learners', () => {
    render(
      <MemoryRouter initialEntries={['/progress']}>
        <AppRoutes />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole('heading', { name: /learning progress/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/no learning sessions recorded yet/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/not synchronized across devices/i),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/illustrative sample/i),
    ).not.toBeInTheDocument();
  });

  it('saves a guided session once, preserves it on reload, creates a separate session on restart, and clears history cleanly', async () => {
    const user = userEvent.setup();
    const firstRender = render(
      <MemoryRouter initialEntries={['/studio/two-sum']}>
        <AppRoutes />
      </MemoryRouter>,
    );

    // Answer Stage 1 correctly & solve 1 prediction first-try
    await user.click(
      screen.getByRole('radio', {
        name: /no — the two indices must be distinct/i,
      }),
    );
    const predictSection = screen.getByRole('region', {
      name: /predict the next step/i,
    });
    await user.click(
      within(predictSection).getByRole('radio', { name: /index 1 \(value 7\)/i }),
    );

    // Finalize through remaining stages to Summary (triggers save once)
    await user.click(screen.getByRole('button', { name: /continue to stage 2/i }));
    await user.click(screen.getByRole('button', { name: /skip to stage 3/i }));
    await user.click(screen.getByRole('button', { name: /skip to stage 4/i }));
    await user.click(
      screen.getByRole('button', { name: /skip & view summary/i }),
    );

    expect(screen.getByText(/saved to this browser/i)).toBeInTheDocument();
    expect(screen.getByText(/completed with skips/i)).toBeInTheDocument();
    expect(defaultLearningRepository.loadSessions().sessions).toHaveLength(1);

    // Clicking Summary again does not duplicate the saved session
    await user.click(screen.getByRole('button', { name: /^summary$/i }));
    expect(defaultLearningRepository.loadSessions().sessions).toHaveLength(1);

    // Restarting lesson creates a brand new session without altering the previous saved record
    await user.click(
      screen.getByRole('button', { name: /restart guided lesson/i }),
    );
    await user.click(screen.getByRole('button', { name: /reveal hint 1 of 3/i }));
    await user.click(screen.getByRole('button', { name: /^summary$/i }));

    const savedAfterRestart = defaultLearningRepository.loadSessions().sessions;
    expect(savedAfterRestart).toHaveLength(2);
    expect(savedAfterRestart[0].sessionId).not.toBe(
      savedAfterRestart[1].sessionId,
    );

    // Navigate directly to Progress Page
    await user.click(
      screen.getByRole('link', { name: /view learning progress/i }),
    );
    expect(
      screen.getByTestId('progress-total-sessions'),
    ).toHaveTextContent('2');
    expect(
      screen.getByTestId('progress-problems-practiced'),
    ).toHaveTextContent('1 / 3');
    expect(
      screen.getByTestId('progress-prediction-accuracy'),
    ).toHaveTextContent('100%');
    expect(screen.getByTestId('progress-hints-used')).toHaveTextContent('1');

    // Simulate full browser reload by unmounting and remounting at /progress
    firstRender.unmount();
    render(
      <MemoryRouter initialEntries={['/progress']}>
        <AppRoutes />
      </MemoryRouter>,
    );
    expect(
      screen.getByTestId('progress-total-sessions'),
    ).toHaveTextContent('2');

    // Clear Local History with inline confirmation -> restores honest empty state
    await user.click(
      screen.getByRole('button', { name: /clear local history/i }),
    );
    await user.click(
      screen.getByRole('button', { name: /confirm clear history/i }),
    );

    expect(
      screen.getByText(/no learning sessions recorded yet/i),
    ).toBeInTheDocument();
    expect(defaultLearningRepository.loadSessions().sessions).toHaveLength(0);
  });
});
