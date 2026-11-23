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
  it('generates valid predictions with distinct trace-context IDs across custom inputs', () => {
    const customInputs = [
      { nums: [-3, 4, 3, 90], target: 0 },
      { nums: [3, 3], target: 6 },
      { nums: [1, 2, 3], target: 100 },
    ];

    for (const input of customInputs) {
      for (const strategyId of ['brute-force', 'hash-map'] as const) {
        const trace = generateTwoSumTrace(strategyId, input);
        const ctxA = `s1:${strategyId}:${input.nums.join(',')}:${input.target}`;
        const ctxB = `s2:${strategyId}:${input.nums.join(',')}:${input.target}`;

        for (let i = 0; i < trace.steps.length - 1; i += 1) {
          const promptA = generatePredictionPrompt(trace.steps, i, strategyId, ctxA);
          const promptB = generatePredictionPrompt(trace.steps, i, strategyId, ctxB);
          expect(promptA).not.toBeNull();
          expect(promptA!.id).not.toBe(promptB!.id);
          const correctOptions = promptA!.options.filter((o) => o.isCorrect);
          expect(correctOptions).toHaveLength(1);
        }

        expect(
          generatePredictionPrompt(trace.steps, trace.steps.length - 1, strategyId, ctxA),
        ).toBeNull();
      }
    }
  });
});

describe('Guided Learning Integrity & Stability (Sprint 3.1)', () => {
  it('starts beginners in Guided Learning without immediately spoiling Hash Map', () => {
    renderGuidedStudio();

    expect(
      screen.getByRole('heading', { name: /stage 1: understand the problem/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/unlocks in stage 3/i)).toBeInTheDocument();
    expect(
      screen.queryByRole('radio', { name: /hash map complement lookup/i }),
    ).not.toBeInTheDocument();
  });

  it('does NOT mark skipped stages as completed in Session Summary', async () => {
    const user = userEvent.setup();
    renderGuidedStudio();

    // Skip all 4 stages without answering any stage check
    await user.click(screen.getByRole('button', { name: /skip to stage 2/i }));
    await user.click(screen.getByRole('button', { name: /skip to stage 3/i }));
    await user.click(screen.getByRole('button', { name: /skip to stage 4/i }));
    await user.click(screen.getByRole('button', { name: /skip & view summary/i }));

    expect(
      screen.getByRole('heading', { name: /local session summary/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/verified concepts completed \(0 \/ 4\)/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/skipped stages \(4\)/i)).toBeInTheDocument();
  });

  it('supports 4-stage navigation, unlocking Hash Map in Stage 3, and progressive pseudocode reveal in Stage 4', async () => {
    const user = userEvent.setup();
    renderGuidedStudio();

    // Answer Stage 1 correctly -> becomes Completed
    await user.click(
      screen.getByRole('radio', { name: /no — the two indices must be distinct/i }),
    );
    await user.click(screen.getByRole('button', { name: /continue to stage 2/i }));
    expect(
      screen.getByRole('heading', { name: /stage 2: discover pair enumeration/i }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /skip to stage 3/i }));
    expect(
      screen.getByRole('heading', { name: /stage 3: discover complement lookup/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText(/seen hash map visualization/i),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /skip to stage 4/i }));
    expect(
      screen.getByRole('heading', { name: /stage 4: build the solution/i }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/create empty map seen/i)).not.toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: /reveal next pseudocode step/i }),
    );
    expect(screen.getByText(/create empty map seen/i)).toBeInTheDocument();
  });

  it('prevents repeated answer clicks from inflating prediction stats and separates first attempts from retries', async () => {
    const user = userEvent.setup();
    renderGuidedStudio();

    const predictSection = screen.getByRole('region', {
      name: /predict the next step/i,
    });

    // Click wrong answer twice -> should still count as 1 question attempted (not inflated)
    const wrongOption = within(predictSection).getByRole('radio', {
      name: /same as anchor i/i,
    });
    await user.click(wrongOption);
    await user.click(wrongOption);

    // Retry with correct answer, then click correct answer 3 more times
    const rightOption = within(predictSection).getByRole('radio', {
      name: /index 1 \(value 7\)/i,
    });
    await user.click(rightOption);
    await user.click(rightOption);
    await user.click(rightOption);

    // Advance to Step 2 and solve Step 2 on first try
    await user.click(
      within(predictSection).getByRole('button', {
        name: /step to verified state/i,
      }),
    );
    const step2Correct = within(predictSection).getByRole('radio', {
      name: /confirm match and return \[0, 1\]/i,
    });
    await user.click(step2Correct);
    await user.click(step2Correct);

    // Check Session Summary: 2 questions attempted, 1 first-try, 1 after retry
    await user.click(screen.getByRole('button', { name: /summary/i }));
    expect(screen.getByTestId('summary-predictions-attempted')).toHaveTextContent('2');
    expect(screen.getByText(/1 first-try/i)).toBeInTheDocument();
    expect(screen.getByText(/1 after retry/i)).toBeInTheDocument();
  });

  it('resets prediction selection when input changes and pauses autoplay at guided checkpoints', async () => {
    const user = userEvent.setup();
    renderGuidedStudio();

    // At Step 1 in Guided Predict Mode, Play is paused/disabled at the unanswered checkpoint
    const playButton = screen.getByRole('button', { name: /play trace/i });
    expect(playButton).toBeDisabled();
    expect(screen.getByText(/checkpoint paused/i)).toBeInTheDocument();

    // Select an answer on default input
    const predictSection = screen.getByRole('region', {
      name: /predict the next step/i,
    });
    const wrongOption = within(predictSection).getByRole('radio', {
      name: /same as anchor i/i,
    });
    await user.click(wrongOption);
    expect(wrongOption).toHaveAttribute('aria-checked', 'true');

    // Change input via preset -> prediction selection must reset cleanly
    await user.click(
      screen.getByRole('button', { name: /negatives \[-3, 4, 3, 90\]/i }),
    );
    expect(
      within(predictSection).queryByText(/not quite/i),
    ).not.toBeInTheDocument();

    // Explicit Skip & Reveal advances to Step 2 without counting as correct
    await user.click(
      within(predictSection).getByRole('button', {
        name: /skip & reveal next step/i,
      }),
    );
    expect(screen.getByText(/step 2 of/i)).toBeInTheDocument();
  });

  it('resets all lesson state, hints, predictions, pseudocode, and inputs on Restart Guided Lesson', async () => {
    const user = userEvent.setup();
    renderGuidedStudio();

    // 1. Reveal a hint & answer Stage 1 correctly
    await user.click(screen.getByRole('button', { name: /reveal hint 1 of 3/i }));
    await user.click(
      screen.getByRole('radio', { name: /no — the two indices must be distinct/i }),
    );

    // 2. Make a prediction & change input to Negatives
    const predictSection = screen.getByRole('region', {
      name: /predict the next step/i,
    });
    await user.click(
      within(predictSection).getByRole('radio', { name: /index 1 \(value 7\)/i }),
    );
    await user.click(
      screen.getByRole('button', { name: /negatives \[-3, 4, 3, 90\]/i }),
    );

    // 3. Jump to Stage 4 and reveal pseudocode
    await user.click(screen.getByRole('button', { name: /4 build code/i }));
    await user.click(
      screen.getByRole('button', { name: /reveal next pseudocode step/i }),
    );
    expect(screen.getByText(/create empty map seen/i)).toBeInTheDocument();

    // 4. Open Summary -> Restart Guided Lesson
    await user.click(screen.getByRole('button', { name: /^summary$/i }));
    expect(screen.getByTestId('summary-hints-used')).toHaveTextContent('1');
    expect(screen.getByTestId('summary-predictions-attempted')).toHaveTextContent('1');

    await user.click(screen.getByRole('button', { name: /restart guided lesson/i }));

    // Verify fresh clean session
    expect(
      screen.getByRole('heading', { name: /stage 1: understand the problem/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/array \(nums\)/i)).toHaveValue('2, 7, 11, 15');
    expect(screen.getByLabelText(/^target$/i)).toHaveValue('9');
    expect(screen.getByText(/0 \/ 3 revealed/i)).toBeInTheDocument();

    // Re-check Stage 4 -> pseudocode must be hidden again
    await user.click(screen.getByRole('button', { name: /4 build code/i }));
    expect(screen.queryByText(/create empty map seen/i)).not.toBeInTheDocument();

    // Re-open Summary immediately -> all metrics must be 0
    await user.click(screen.getByRole('button', { name: /^summary$/i }));
    expect(screen.getByTestId('summary-hints-used')).toHaveTextContent('0');
    expect(screen.getByTestId('summary-predictions-attempted')).toHaveTextContent('0');
    expect(
      screen.getByText(/verified concepts completed \(0 \/ 4\)/i),
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
