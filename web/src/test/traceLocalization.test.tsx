import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AppRoutes } from '../app/App';
import { twoSumModule } from '../domain/problems/twoSumModule';
import { validParenthesesModule } from '../domain/problems/validParenthesesModule';
import { splitArrayModule } from '../domain/problems/splitArrayModule';
import type { AnyProblemModule } from '../domain/problems/registry';
import i18n from '../i18n';
import {
  localizeExecutionStep,
  localizePredictionPrompt,
} from '../i18n/traceLocalization';

function verifyTraceAndPredictionsBilingual(
  mod: AnyProblemModule,
  strategyId: string,
  input: unknown,
) {
  const tEn = i18n.getFixedT('en');
  const tVi = i18n.getFixedT('vi');
  const trace = mod.generateTrace(strategyId, input);
  expect(trace.steps.length).toBeGreaterThan(0);

  trace.steps.forEach((step, idx) => {
    const enStep = localizeExecutionStep(tEn, mod.id, strategyId, step);
    const viStep = localizeExecutionStep(tVi, mod.id, strategyId, step);

    // Deterministic identity & algorithm state strictly preserved
    expect(viStep.id).toBe(step.id);
    expect(viStep.stepIndex).toBe(step.stepIndex);
    expect(viStep.action).toBe(step.action);
    expect(viStep.variables).toEqual(step.variables);
    expect(viStep.highlightedIndices).toEqual(step.highlightedIndices);
    expect(viStep.isTerminal).toBe(step.isTerminal);

    // Every step has distinct Vietnamese narration (zero silent English fallback)
    expect(viStep.actionTitle).toBeTruthy();
    expect(viStep.explanation).toBeTruthy();
    expect(viStep.actionTitle).not.toBe(enStep.actionTitle);
    expect(viStep.explanation).not.toBe(enStep.explanation);

    // Every generated prediction checkpoint preserves IDs & correctness while localizing text
    const prompt = mod.generatePrediction(
      trace.steps,
      idx,
      strategyId,
      'test-ctx',
    );
    if (prompt) {
      const enPrompt = localizePredictionPrompt(
        tEn,
        mod.id,
        strategyId,
        trace.steps,
        idx,
        prompt,
      );
      const viPrompt = localizePredictionPrompt(
        tVi,
        mod.id,
        strategyId,
        trace.steps,
        idx,
        prompt,
      );

      expect(viPrompt.id).toBe(prompt.id);
      expect(viPrompt.stepIndex).toBe(prompt.stepIndex);
      expect(viPrompt.question).not.toBe(enPrompt.question);
      expect(viPrompt.options.length).toBe(prompt.options.length);

      prompt.options.forEach((origOpt, optIdx) => {
        const enOpt = enPrompt.options[optIdx];
        const viOpt = viPrompt.options[optIdx];
        expect(viOpt.id).toBe(origOpt.id);
        expect(viOpt.isCorrect).toBe(origOpt.isCorrect);
        expect(viOpt.feedback).not.toBe(enOpt.feedback);
        // Pure math/index labels like "[0, 1]" or "mid = 21" intentionally stay identical
        const isPureMathLabel = /^(\[\d+,\s*\d+\]|mid = \d+)$/.test(
          enOpt.label.trim(),
        );
        if (!isPureMathLabel) {
          expect(viOpt.label).not.toBe(enOpt.label);
        }
      });
    }
  });

  return trace;
}

describe('Phase 3B.2B — Bilingual Execution Traces & Prediction Checkpoints', () => {
  it('localizes Two Sum Brute Force & Hash Map traces and predictions across success, duplicates, no-solution, and empty inputs', () => {
    // 1. Successful pair
    const bfSuccess = verifyTraceAndPredictionsBilingual(
      twoSumModule,
      'brute-force',
      { nums: [2, 7, 11, 15], target: 9 },
    );
    expect(bfSuccess.found).toBe(true);
    expect(bfSuccess.resultLabel).toBe('[0, 1]');

    const hmSuccess = verifyTraceAndPredictionsBilingual(
      twoSumModule,
      'hash-map',
      { nums: [2, 7, 11, 15], target: 9 },
    );
    expect(hmSuccess.found).toBe(true);
    expect(hmSuccess.resultLabel).toBe('[0, 1]');

    // 2. Duplicate values
    const hmDup = verifyTraceAndPredictionsBilingual(twoSumModule, 'hash-map', {
      nums: [3, 3],
      target: 6,
    });
    expect(hmDup.found).toBe(true);
    expect(hmDup.resultLabel).toBe('[0, 1]');

    // 3. No solution
    const bfNoSol = verifyTraceAndPredictionsBilingual(
      twoSumModule,
      'brute-force',
      { nums: [1, 2, 3], target: 100 },
    );
    expect(bfNoSol.found).toBe(false);

    const hmNoSol = verifyTraceAndPredictionsBilingual(
      twoSumModule,
      'hash-map',
      { nums: [1, 2, 3], target: 100 },
    );
    expect(hmNoSol.found).toBe(false);

    // 4. Empty array & single element
    verifyTraceAndPredictionsBilingual(twoSumModule, 'brute-force', {
      nums: [],
      target: 5,
    });
    verifyTraceAndPredictionsBilingual(twoSumModule, 'hash-map', {
      nums: [4],
      target: 8,
    });
  });

  it('localizes Valid Parentheses traces and predictions across balanced, mismatched, empty-stack, unclosed, and empty inputs', () => {
    const balanced = verifyTraceAndPredictionsBilingual(
      validParenthesesModule,
      'stack-matching',
      { brackets: '{[]}' },
    );
    expect(balanced.found).toBe(true);

    const mismatched = verifyTraceAndPredictionsBilingual(
      validParenthesesModule,
      'stack-matching',
      { brackets: '([)]' },
    );
    expect(mismatched.found).toBe(false);

    const emptyStack = verifyTraceAndPredictionsBilingual(
      validParenthesesModule,
      'stack-matching',
      { brackets: ']' },
    );
    expect(emptyStack.found).toBe(false);

    const unclosed = verifyTraceAndPredictionsBilingual(
      validParenthesesModule,
      'stack-matching',
      { brackets: '((' },
    );
    expect(unclosed.found).toBe(false);

    const emptyInput = verifyTraceAndPredictionsBilingual(
      validParenthesesModule,
      'stack-matching',
      { brackets: '' },
    );
    expect(emptyInput.found).toBe(true);
  });

  it('localizes Split Array Largest Sum Binary Search + Greedy traces, group cuts, bound updates, and final answer', () => {
    const trace = verifyTraceAndPredictionsBilingual(
      splitArrayModule,
      'bs-greedy-composition',
      { nums: [7, 2, 5, 10, 8], k: 2 },
    );
    expect(trace.found).toBe(true);
    expect(trace.resultLabel).toBe('18');

    const tVi = i18n.getFixedT('vi');
    const actions = new Set(trace.steps.map((s) => s.action));
    expect(actions.has('greedy-new-group')).toBe(true);
    expect(actions.has('bs-update-bounds')).toBe(true);
    expect(actions.has('bs-converged')).toBe(true);

    const finalStep = localizeExecutionStep(
      tVi,
      splitArrayModule.id,
      'bs-greedy-composition',
      trace.steps[trace.steps.length - 1],
    );
    expect(finalStep.actionTitle).toContain('Hội tụ tại low = high = 18');
    expect(finalStep.visualState.boundDecision).toContain('Hội tụ: đáp án = 18');
  });

  it('switches language mid-playback at an active checkpoint without resetting step, trace, or answered prediction state', async () => {
    const user = userEvent.setup();
    await i18n.changeLanguage('vi');

    render(
      <MemoryRouter initialEntries={['/studio/two-sum']}>
        <AppRoutes />
      </MemoryRouter>,
    );

    // Step 1 trace explanation & prediction prompt appear in Vietnamese
    expect(screen.getAllByText('Chọn mốc i = 0').length).toBeGreaterThan(0);
    expect(
      screen.getByText(
        /Mốc i đang ở chỉ số 0 \(giá trị 2\)\. Con trỏ ghép j sẽ kiểm tra chỉ số nào tiếp theo\?/i,
      ),
    ).toBeInTheDocument();

    // Answer the active prediction checkpoint in Vietnamese
    await user.click(
      screen.getByRole('radio', { name: 'Chỉ số 1 (giá trị 7)' }),
    );
    expect(screen.getByText('Dự đoán chính xác!')).toBeInTheDocument();
    expect(screen.getByText('Đã xác nhận')).toBeInTheDocument();

    // Switch to English at the active checkpoint -> step 1 and answered state stay intact
    await user.selectOptions(screen.getAllByLabelText('Ngôn ngữ')[0], 'en');
    expect((await screen.findAllByText('Select anchor i = 0')).length).toBeGreaterThan(0);
    expect(screen.getByText('Correct prediction!')).toBeInTheDocument();
    expect(screen.getByText('Verified')).toBeInTheDocument();
    expect(screen.getByText('Step 1 of 3')).toBeInTheDocument();

    // Switch back to Vietnamese and advance to Step 2
    await user.selectOptions(screen.getAllByLabelText('Language')[0], 'vi');
    expect((await screen.findAllByText('Chọn mốc i = 0')).length).toBeGreaterThan(0);
    await user.click(
      screen.getByRole('button', {
        name: /Chuyển sang trạng thái đã kiểm chứng/i,
      }),
    );

    // Step 2 explanation and prediction prompt update cleanly in Vietnamese
    expect(screen.getAllByText('Bước 2 / 3').length).toBeGreaterThan(0);
    expect(
      screen.getAllByText('Kiểm tra cặp (0, 1): 2 + 7 = 9').length,
    ).toBeGreaterThan(0);
  });
});
