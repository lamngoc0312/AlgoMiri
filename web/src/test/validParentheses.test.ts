import { describe, expect, it } from 'vitest';
import { generateValidParenthesesTrace } from '../domain/traces/validParenthesesStack';
import {
  MAX_BRACKETS_LENGTH,
  parseAndValidateBracketsInput,
} from '../domain/traces/validParenthesesValidation';
import { generateValidParenthesesPrediction } from '../domain/problems/validParenthesesModule';

const REQUIRED_CASES: { brackets: string; expected: boolean; label: string }[] = [
  { brackets: '()', expected: true, label: '"()" -> true' },
  { brackets: '()[]{}', expected: true, label: '"()[]{}" -> true' },
  { brackets: '(]', expected: false, label: '"(]" -> false' },
  { brackets: '([)]', expected: false, label: '"([)]" -> false' },
  { brackets: '{[]}', expected: true, label: '"{[]}" -> true' },
  { brackets: '((', expected: false, label: '"((" -> false' },
  { brackets: ']', expected: false, label: '"]" -> false' },
  { brackets: '', expected: true, label: '"" -> true' },
];

describe('Valid Parentheses deterministic trace generator', () => {
  it.each(REQUIRED_CASES)(
    'returns deterministic result and valid invariants for $label',
    ({ brackets, expected }) => {
      const trace = generateValidParenthesesTrace({ brackets });

      expect(trace.found).toBe(expected);
      expect(trace.steps.length).toBeGreaterThan(0);

      trace.steps.forEach((step, idx) => {
        expect(step.stepIndex).toBe(idx);
        expect(step.visualState.kind).toBe('stack');
        if (step.visualState.currentIndex !== null) {
          expect(step.visualState.currentIndex).toBeGreaterThanOrEqual(0);
          expect(step.visualState.currentIndex).toBeLessThan(brackets.length);
        }
      });

      const lastStep = trace.steps[trace.steps.length - 1];
      expect(lastStep.isTerminal).toBe(true);
      expect(lastStep.visualState.isValid).toBe(expected);
    },
  );

  it('produces immutable stack snapshots across steps', () => {
    const trace = generateValidParenthesesTrace({ brackets: '{[]}' });
    expect(trace.steps.length).toBeGreaterThan(2);

    const step0 = trace.steps[0];
    const step1 = trace.steps[1];
    const originalStep1Stack = step1.visualState.stack.map((item) => item.char);

    step0.visualState.stack.push({
      id: 'mutated',
      char: 'X',
      index: 99,
    });

    expect(step1.visualState.stack.map((item) => item.char)).toEqual(
      originalStep1Stack,
    );
  });

  it('generates dynamic predictions with exactly one correct option for non-terminal steps', () => {
    for (const brackets of ['{[]}', '([)]', '((']) {
      const trace = generateValidParenthesesTrace({ brackets });
      for (let i = 0; i < trace.steps.length - 1; i += 1) {
        const prompt = generateValidParenthesesPrediction(
          trace.steps,
          i,
          'stack-matching',
          `ctx:${brackets}`,
        );
        expect(prompt).not.toBeNull();
        expect(prompt!.options.filter((o) => o.isCorrect)).toHaveLength(1);
      }
      expect(
        generateValidParenthesesPrediction(
          trace.steps,
          trace.steps.length - 1,
          'stack-matching',
          `ctx:${brackets}`,
        ),
      ).toBeNull();
    }
  });
});

describe('Valid Parentheses input validation', () => {
  it('accepts valid bracket strings including empty string', () => {
    expect(parseAndValidateBracketsInput('{[]}')).toEqual({
      ok: true,
      value: { brackets: '{[]}' },
    });
    expect(parseAndValidateBracketsInput('')).toEqual({
      ok: true,
      value: { brackets: '' },
    });
  });

  it('rejects unsupported characters and oversized strings', () => {
    const invalid = parseAndValidateBracketsInput('(a+b)');
    expect(invalid.ok).toBe(false);
    if (!invalid.ok) {
      expect(invalid.error).toMatch(/unsupported character/i);
    }

    const tooLong = '('.repeat(MAX_BRACKETS_LENGTH + 1);
    expect(parseAndValidateBracketsInput(tooLong).ok).toBe(false);
  });
});
