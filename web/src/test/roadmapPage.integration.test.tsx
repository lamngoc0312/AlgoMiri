import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AppRoutes } from '../app/App';
import { buildLearningSession } from '../domain/learning/analytics';
import { recordPredictionAnswer } from '../domain/learning/session';
import { twoSumModule } from '../domain/problems/twoSumModule';
import { defaultLearningRepository } from '../services/learningRepository';

describe('Sprint 9 — Functional Personalized Roadmap Page & Interactive Skill Map', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('shows beginner roadmap on empty history, supports Visual Map / Accessible List toggle, keyboard navigation, and skill inspection without lockouts', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/roadmap']}>
        <AppRoutes />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole('heading', { name: /algorithm learning roadmap/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /start with two sum guided learning/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/why this was recommended/i),
    ).toBeInTheDocument();

    // All 3 verified Studios are immediately accessible (no lockouts)
    expect(
      screen.getByRole('link', { name: /try valid parentheses/i }),
    ).toHaveAttribute('href', '/studio/valid-parentheses');
    expect(
      screen.getByRole('link', { name: /try split array largest sum/i }),
    ).toHaveAttribute('href', '/studio/split-array-largest-sum');

    // Interactive Skill Map: click Algorithm Composition to inspect prerequisites
    const visualMap = screen.getByRole('region', {
      name: /layered skill prerequisite map/i,
    });
    const compBtn = within(visualMap).getByRole('button', {
      name: /algorithm composition/i,
    });
    await user.click(compBtn);

    const inspector = screen.getByRole('complementary', {
      name: /skill details for algorithm composition/i,
    });
    expect(
      within(inspector).getByRole('button', { name: /binary search on answer/i }),
    ).toBeInTheDocument();
    expect(
      within(inspector).getByRole('button', { name: /greedy feasibility/i }),
    ).toBeInTheDocument();

    // Keyboard navigation with ArrowRight moves focus/selection to next skill in topological order
    compBtn.focus();
    await user.keyboard('{ArrowRight}');
    expect(
      screen.getByRole('complementary', {
        name: /skill details for array indexing/i,
      }),
    ).toBeInTheDocument();

    // Accessible List fallback toggle works cleanly for mobile & screen readers
    await user.click(screen.getByRole('button', { name: /accessible list/i }));
    expect(
      screen.getByRole('region', { name: /accessible skill prerequisite list/i }),
    ).toBeInTheDocument();
  });

  it('updates personalized recommendations dynamically from saved local history and persists across reload', () => {
    let preds = recordPredictionAnswer({}, 'p1', 'ok', true, {
      strategyId: 'brute-force',
      nextStepAction: 'compare-pair',
    });
    preds = recordPredictionAnswer(preds, 'p2', 'ok', true, {
      strategyId: 'hash-map',
      nextStepAction: 'lookup-hit',
    });
    preds = recordPredictionAnswer(preds, 'p3', 'ok', true, {
      strategyId: 'hash-map',
      nextStepAction: 'store-value',
    });

    const completedTwoSum = buildLearningSession({
      sessionId: 'saved-two-sum-1',
      problemId: 'two-sum',
      problemTitle: 'Two Sum',
      mode: 'guided',
      strategiesExplored: ['brute-force', 'hash-map'],
      startedAt: '2026-11-24T05:00:00.000Z',
      completedAt: '2026-11-24T05:10:00.000Z',
      stageIds: twoSumModule.lesson.stages.map((s) => s.id),
      stageStatuses: {
        understand: 'completed',
        'discover-brute-force': 'completed',
        'discover-optimization': 'completed',
        'build-solution': 'completed',
      },
      hintsByStage: {},
      predictionRecords: preds,
    });
    defaultLearningRepository.saveSession(completedTwoSum);

    const firstMount = render(
      <MemoryRouter initialEntries={['/roadmap']}>
        <AppRoutes />
      </MemoryRouter>,
    );

    // Recommendation advances from Two Sum -> Valid Parentheses!
    expect(
      screen.getByRole('heading', {
        name: /learn stack \/ lifo reasoning in valid parentheses/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/personalized from 1 locally saved session/i),
    ).toBeInTheDocument();
    expect(
      screen.getAllByText(/strong guided recall/i).length,
    ).toBeGreaterThan(0);

    // Simulate reload by unmounting and remounting /roadmap
    firstMount.unmount();
    render(
      <MemoryRouter initialEntries={['/roadmap']}>
        <AppRoutes />
      </MemoryRouter>,
    );
    expect(
      screen.getByRole('heading', {
        name: /learn stack \/ lifo reasoning in valid parentheses/i,
      }),
    ).toBeInTheDocument();
  });
});
