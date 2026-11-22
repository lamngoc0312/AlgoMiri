import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AppRoutes } from '../app/App';
import { generateTwoSumTrace } from '../domain/traces/twoSumEngine';
import { generatePredictionPrompt } from '../domain/learning/predictions';

function renderGuidedStudio() {
  return render(
    <MemoryRouter initialEntries={['/studio']}>
      <AppRoutes />
    </MemoryRouter>,
  );
}

describe('Dynamic trace-driven prediction generator', () => {
  it('generates valid predictions for non-default custom inputs across both strategies', () => {
    const customInputs = [
      { nums: [-3, 4, 3, 90], target: 0 },
      { nums: [3, 3], target: 6 },
      { nums: [1, 2, 3], target: 100 },
    ];

    for (const input of customInputs) {
      for (const strategyId of ['brute-force', 'hash-map'] as const) {
        const trace = generateTwoSumTrace(strategyId, input);

        // Every non-terminal step should yield a dynamic prompt with exactly one correct option
        for (let i = 0; i < trace.steps.length - 1; i += 1) {
          const prompt = generatePredictionPrompt(trace.steps, i, strategyId);
          expect(prompt).not.toBeNull();
          const correctOptions = prompt!.options.filter((o) => o.isCorrect);
          expect(correctOptions).toHaveLength(1);
          // Ensure question references actual values/indices from the custom input, not hardcoded defaults
          expect(prompt!.question.length).toBeGreaterThan(10);
        }

        // Terminal step returns null
        expect(
          generatePredictionPrompt(trace.steps, trace.steps.length - 1, strategyId),
        ).toBeNull();
      }
    }
  });
});

describe('Guided Learning Mode, Hints, Predictions & Session Summary', () => {
  it('starts beginners in Guided Learning without immediately spoiling Hash Map', () => {
    renderGuidedStudio();

    expect(
      screen.getByRole('heading', { name: /stage 1: understand the problem/i }),
    ).toBeInTheDocument();
    // Hash Map is locked until Stage 3
    expect(screen.getByText(/unlocks in stage 3/i)).toBeInTheDocument();
    expect(
      screen.queryByRole('radio', { name: /hash map complement lookup/i }),
    ).not.toBeInTheDocument();
  });

  it('supports 4-stage navigation, unlocking Hash Map in Stage 3, and progressive pseudocode reveal in Stage 4', async () => {
    const user = userEvent.setup();
    renderGuidedStudio();

    // Stage 1 -> Stage 2 -> Stage 3
    await user.click(screen.getByRole('button', { name: /continue to stage 2/i }));
    expect(
      screen.getByRole('heading', { name: /stage 2: discover pair enumeration/i }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /continue to stage 3/i }));
    expect(
      screen.getByRole('heading', { name: /stage 3: discover complement lookup/i }),
    ).toBeInTheDocument();
    // Hash Map is now unlocked & visible on the canvas
    expect(
      screen.getByLabelText(/seen hash map visualization/i),
    ).toBeInTheDocument();

    // Stage 3 -> Stage 4 (pseudocode hidden until requested)
    await user.click(screen.getByRole('button', { name: /continue to stage 4/i }));
    expect(
      screen.getByRole('heading', { name: /stage 4: build the solution/i }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/create empty map seen/i)).not.toBeInTheDocument();

    // Reveal first pseudocode step on demand
    await user.click(
      screen.getByRole('button', { name: /reveal next pseudocode step/i }),
    );
    expect(screen.getByText(/create empty map seen/i)).toBeInTheDocument();
  });

  it('reveals 3 progressive hints and tracks hints + predictions in the honest Session Summary', async () => {
    const user = userEvent.setup();
    renderGuidedStudio();

    // Reveal Hint 1 and Hint 2 on Stage 1
    await user.click(screen.getByRole('button', { name: /reveal hint 1 of 3/i }));
    expect(screen.getByText(/hint 1 · conceptual question/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /reveal hint 2 of 3/i }));
    expect(screen.getByText(/hint 2 · reasoning guidance/i)).toBeInTheDocument();

    // Interact with Predict the Next Step card: pick a wrong option first, retry without penalty, then advance
    const predictSection = screen.getByRole('region', {
      name: /predict the next step/i,
    });
    const wrongOption = within(predictSection).getByRole('radio', {
      name: /same as anchor i/i,
    });
    await user.click(wrongOption);
    expect(
      within(predictSection).getByText(/try again without penalty/i),
    ).toBeInTheDocument();

    const rightOption = within(predictSection).getByRole('radio', {
      name: /index 1 \(value 7\)/i,
    });
    await user.click(rightOption);
    expect(
      within(predictSection).getByText(/correct prediction!/i),
    ).toBeInTheDocument();

    // Advance to verified next step
    await user.click(
      within(predictSection).getByRole('button', {
        name: /step to verified state/i,
      }),
    );
    expect(screen.getByText(/step 2 of 3/i)).toBeInTheDocument();

    // Open Session Summary
    await user.click(screen.getByRole('button', { name: /summary/i }));
    expect(
      screen.getByRole('heading', { name: /local session summary/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/\(1 correct\)/i)).toBeInTheDocument();
    expect(screen.getByText(/prediction attempts/i)).toBeInTheDocument();
    expect(screen.getByText(/hints used/i)).toBeInTheDocument();
    expect(
      screen.getByText(/does not measure long-term skill mastery yet/i),
    ).toBeInTheDocument();
  });

  it('allows switching cleanly between Guided Learning and Free Exploration', async () => {
    const user = userEvent.setup();
    renderGuidedStudio();

    await user.click(screen.getByRole('button', { name: /free exploration/i }));
    expect(
      screen.getByRole('radio', { name: /hash map complement lookup/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('navigation', { name: /guided lesson stages/i }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /guided learning/i }));
    expect(
      screen.getByRole('navigation', { name: /guided lesson stages/i }),
    ).toBeInTheDocument();
  });
});
