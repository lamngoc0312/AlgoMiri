import type {
  GenericExecutionStep,
  GenericTraceResult,
  StackItem,
  StackOperation,
  StackVisualState,
} from '../core/types';
import type { TraceStatus } from './types';
import type { ValidParenthesesInput } from './validParenthesesValidation';

const OPEN_TO_CLOSE: Record<string, string> = {
  '(': ')',
  '[': ']',
  '{': '}',
};

const CLOSE_TO_OPEN: Record<string, string> = {
  ')': '(',
  ']': '[',
  '}': '{',
};

function cloneStack(
  stack: StackItem[],
  topHighlight?: StackItem['highlight'],
): StackItem[] {
  return stack.map((item, idx) => ({
    ...item,
    highlight:
      topHighlight && idx === stack.length - 1 ? topHighlight : 'normal',
  }));
}

function createStep(params: {
  stepIndex: number;
  operation: StackOperation;
  actionTitle: string;
  input: string;
  currentIndex: number | null;
  currentChar: string | null;
  stack: StackItem[];
  comparingWith?: string | null;
  expectedBracket?: string | null;
  isValid: boolean | null;
  status: TraceStatus;
  activeGoalIndex: number;
  variables: Record<string, string | number | boolean | null>;
  explanation: string;
  isTerminal?: boolean;
}): GenericExecutionStep<StackVisualState> {
  const highlightedIndices =
    params.currentIndex !== null ? [params.currentIndex] : [];

  return {
    id: `vp-step-${params.stepIndex}`,
    stepIndex: params.stepIndex,
    action: params.operation,
    actionTitle: params.actionTitle,
    variables: { ...params.variables },
    visualState: {
      kind: 'stack',
      input: params.input,
      currentIndex: params.currentIndex,
      currentChar: params.currentChar,
      stack: params.stack.map((item) => ({ ...item })),
      operation: params.operation,
      comparingWith: params.comparingWith ?? null,
      expectedBracket: params.expectedBracket ?? null,
      isValid: params.isValid,
      status: params.status,
      activeGoalIndex: params.activeGoalIndex,
    },
    highlightedIndices,
    explanation: params.explanation,
    isTerminal: params.isTerminal,
  };
}

export function generateValidParenthesesTrace(
  input: ValidParenthesesInput,
): GenericTraceResult<ValidParenthesesInput, StackVisualState> {
  const s = input.brackets;
  const steps: GenericExecutionStep<StackVisualState>[] = [];
  const stack: StackItem[] = [];

  if (s.length === 0) {
    steps.push(
      createStep({
        stepIndex: 0,
        operation: 'valid',
        actionTitle: 'Empty string is balanced (Valid)',
        input: s,
        currentIndex: null,
        currentChar: null,
        stack: [],
        isValid: true,
        status: 'found',
        activeGoalIndex: 2,
        variables: { length: 0, stackSize: 0, result: 'Valid (true)' },
        explanation:
          'An empty string has no unmatched opening or closing brackets, and the stack is empty — so it is valid (true).',
        isTerminal: true,
      }),
    );

    return {
      problemId: 'valid-parentheses',
      strategyId: 'stack-matching',
      input: { brackets: s },
      steps,
      found: true,
      resultLabel: 'Valid (true)',
    };
  }

  for (let i = 0; i < s.length; i += 1) {
    const ch = s[i];
    const isOpening = ch in OPEN_TO_CLOSE;

    if (isOpening) {
      stack.push({ id: `item-${i}-${ch}`, char: ch, index: i });
      steps.push(
        createStep({
          stepIndex: steps.length,
          operation: 'push',
          actionTitle: `Index ${i}: Push "${ch}" onto stack`,
          input: s,
          currentIndex: i,
          currentChar: ch,
          stack: cloneStack(stack, 'new'),
          expectedBracket: OPEN_TO_CLOSE[ch],
          isValid: null,
          status: 'running',
          activeGoalIndex: 0,
          variables: {
            index: i,
            char: ch,
            action: 'push',
            stackSize: stack.length,
          },
          explanation: `"${ch}" is an opening bracket. Push it onto the TOP of the stack so we remember we still need a matching "${OPEN_TO_CLOSE[ch]}" later.`,
        }),
      );
      continue;
    }

    // Closing bracket
    const expectedOpen = CLOSE_TO_OPEN[ch];
    if (stack.length === 0) {
      steps.push(
        createStep({
          stepIndex: steps.length,
          operation: 'mismatch',
          actionTitle: `Index ${i}: "${ch}" has no matching opener (Invalid)`,
          input: s,
          currentIndex: i,
          currentChar: ch,
          stack: [],
          comparingWith: null,
          expectedBracket: expectedOpen,
          isValid: false,
          status: 'not-found',
          activeGoalIndex: 1,
          variables: {
            index: i,
            char: ch,
            top: 'empty',
            result: 'Invalid (false)',
          },
          explanation: `"${ch}" is a closing bracket that needs "${expectedOpen}", but the stack is empty! There is no opening bracket to match it, so return false immediately.`,
          isTerminal: true,
        }),
      );

      return {
        problemId: 'valid-parentheses',
        strategyId: 'stack-matching',
        input: { brackets: s },
        steps,
        found: false,
        resultLabel: 'Invalid (false)',
      };
    }

    const topItem = stack[stack.length - 1];
    const matches = topItem.char === expectedOpen;

    steps.push(
      createStep({
        stepIndex: steps.length,
        operation: 'check-match',
        actionTitle: `Index ${i}: Compare "${ch}" with TOP "${topItem.char}"`,
        input: s,
        currentIndex: i,
        currentChar: ch,
        stack: cloneStack(stack, matches ? 'matched' : 'mismatched'),
        comparingWith: topItem.char,
        expectedBracket: OPEN_TO_CLOSE[topItem.char],
        isValid: null,
        status: 'running',
        activeGoalIndex: 1,
        variables: {
          index: i,
          char: ch,
          top: topItem.char,
          matches,
        },
        explanation: matches
          ? `"${ch}" matches the most recent opening bracket "${topItem.char}" on TOP of the stack! Next, pop "${topItem.char}".`
          : `"${ch}" does NOT match TOP "${topItem.char}" (which expected "${OPEN_TO_CLOSE[topItem.char]}"). Nesting order is broken!`,
      }),
    );

    if (!matches) {
      steps.push(
        createStep({
          stepIndex: steps.length,
          operation: 'mismatch',
          actionTitle: `Mismatch: expected "${OPEN_TO_CLOSE[topItem.char]}", got "${ch}"`,
          input: s,
          currentIndex: i,
          currentChar: ch,
          stack: cloneStack(stack, 'mismatched'),
          comparingWith: topItem.char,
          expectedBracket: OPEN_TO_CLOSE[topItem.char],
          isValid: false,
          status: 'not-found',
          activeGoalIndex: 1,
          variables: {
            index: i,
            expected: OPEN_TO_CLOSE[topItem.char],
            actual: ch,
            result: 'Invalid (false)',
          },
          explanation: `Because "${topItem.char}" was opened most recently, it must be closed by "${OPEN_TO_CLOSE[topItem.char]}" before "${ch}". Stop early and return false.`,
          isTerminal: true,
        }),
      );

      return {
        problemId: 'valid-parentheses',
        strategyId: 'stack-matching',
        input: { brackets: s },
        steps,
        found: false,
        resultLabel: 'Invalid (false)',
      };
    }

    stack.pop();
    steps.push(
      createStep({
        stepIndex: steps.length,
        operation: 'pop',
        actionTitle: `Pop "${topItem.char}" (matched "${ch}")`,
        input: s,
        currentIndex: i,
        currentChar: ch,
        stack: cloneStack(stack),
        comparingWith: topItem.char,
        isValid: null,
        status: 'running',
        activeGoalIndex: 1,
        variables: {
          index: i,
          popped: topItem.char,
          stackSize: stack.length,
        },
        explanation: `Popped "${topItem.char}" from the stack because "${ch}" cleanly closed it. Remaining stack size: ${stack.length}.`,
      }),
    );
  }

  if (stack.length > 0) {
    steps.push(
      createStep({
        stepIndex: steps.length,
        operation: 'unclosed',
        actionTitle: `End of string: ${stack.length} unclosed bracket${stack.length > 1 ? 's' : ''} left`,
        input: s,
        currentIndex: null,
        currentChar: null,
        stack: cloneStack(stack, 'mismatched'),
        isValid: false,
        status: 'not-found',
        activeGoalIndex: 2,
        variables: {
          remaining: stack.map((item) => item.char).join(''),
          stackSize: stack.length,
          result: 'Invalid (false)',
        },
        explanation: `We finished scanning every character, but ${stack.length} opening bracket${stack.length > 1 ? 's remain' : ' remains'} on the stack without a closing match. Return false.`,
        isTerminal: true,
      }),
    );

    return {
      problemId: 'valid-parentheses',
      strategyId: 'stack-matching',
      input: { brackets: s },
      steps,
      found: false,
      resultLabel: 'Invalid (false)',
    };
  }

  steps.push(
    createStep({
      stepIndex: steps.length,
      operation: 'valid',
      actionTitle: 'Stack is empty: Valid brackets (true)',
      input: s,
      currentIndex: null,
      currentChar: null,
      stack: [],
      isValid: true,
      status: 'found',
      activeGoalIndex: 2,
      variables: {
        scanned: s.length,
        stackSize: 0,
        result: 'Valid (true)',
      },
      explanation:
        'Every closing bracket matched the most recent opening bracket, and the stack is completely empty at the end. Return true!',
      isTerminal: true,
    }),
  );

  return {
    problemId: 'valid-parentheses',
    strategyId: 'stack-matching',
    input: { brackets: s },
    steps,
    found: true,
    resultLabel: 'Valid (true)',
  };
}
