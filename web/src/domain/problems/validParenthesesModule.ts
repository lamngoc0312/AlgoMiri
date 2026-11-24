import type {
  GenericExecutionStep,
  PredictionPrompt,
  ProblemModule,
  StackVisualState,
} from '../core/types';
import { generateValidParenthesesTrace } from '../traces/validParenthesesStack';
import type { ValidParenthesesInput } from '../traces/validParenthesesValidation';

export const DEFAULT_VALID_PARENTHESES_INPUT: ValidParenthesesInput = {
  brackets: '{[]}',
};

export function generateValidParenthesesPrediction(
  steps: GenericExecutionStep<StackVisualState>[],
  currentStepIndex: number,
  _strategyId: string,
  traceContextId = 'default',
): PredictionPrompt | null {
  const current = steps[currentStepIndex];
  const next = steps[currentStepIndex + 1];

  if (!current || !next) {
    return null;
  }

  const questionId = `${traceContextId}:step-${current.stepIndex}:${current.action}`;

  if (next.action === 'push') {
    const ch = next.visualState.currentChar ?? '(';
    return {
      id: questionId,
      stepIndex: current.stepIndex,
      question: `Next character at index ${next.visualState.currentIndex} is "${ch}". What should the stack do?`,
      options: [
        {
          id: 'push-open',
          label: `Push "${ch}" onto the TOP of the stack`,
          isCorrect: true,
          feedback: `Correct! "${ch}" is an opening bracket, so we push it onto TOP to wait for its matching closer.`,
        },
        {
          id: 'pop-stack',
          label: 'Pop the TOP item from the stack',
          isCorrect: false,
          feedback: `We only pop when a matching closing bracket arrives. "${ch}" opens a new pair.`,
        },
        {
          id: 'return-false',
          label: 'Stop immediately and return Invalid (false)',
          isCorrect: false,
          feedback: `An opening bracket "${ch}" never causes an immediate mismatch — push it and keep scanning.`,
        },
      ],
    };
  }

  if (next.action === 'check-match') {
    const ch = next.visualState.currentChar ?? ')';
    const topChar = next.visualState.comparingWith ?? '(';
    const willMatch = next.variables.matches === true;

    return {
      id: questionId,
      stepIndex: current.stepIndex,
      question: `Next character is closing bracket "${ch}", and TOP of the stack is "${topChar}". Will they match?`,
      options: [
        {
          id: 'yes-match',
          label: `Yes — "${topChar}" and "${ch}" form a valid pair`,
          isCorrect: willMatch,
          feedback: willMatch
            ? `Spot on! "${ch}" cleanly closes the most recent opener "${topChar}".`
            : `Not quite — "${topChar}" expects "${next.visualState.expectedBracket}", not "${ch}".`,
        },
        {
          id: 'no-mismatch',
          label: `No — "${ch}" mismatches TOP "${topChar}"`,
          isCorrect: !willMatch,
          feedback: !willMatch
            ? `Correct! "${topChar}" must be closed by "${next.visualState.expectedBracket}" before "${ch}".`
            : `Look closely: "${topChar}" and "${ch}" are matching brackets!`,
        },
      ],
    };
  }

  if (next.action === 'pop') {
    const topChar = next.visualState.comparingWith ?? '(';
    return {
      id: questionId,
      stepIndex: current.stepIndex,
      question: `TOP "${topChar}" matched "${current.visualState.currentChar}". What happens to the stack next?`,
      options: [
        {
          id: 'pop-top',
          label: `Pop "${topChar}" off the TOP of the stack`,
          isCorrect: true,
          feedback: `Yes! Popping "${topChar}" resolves that pair and exposes the next outer bracket beneath it.`,
        },
        {
          id: 'push-close',
          label: `Push "${current.visualState.currentChar}" onto the stack`,
          isCorrect: false,
          feedback: `Closing brackets are never pushed — they cancel out the matching opener on TOP.`,
        },
        {
          id: 'clear-all',
          label: 'Clear the entire stack immediately',
          isCorrect: false,
          feedback: `Only the single matched TOP bracket is popped; outer brackets below it still need their own closers.`,
        },
      ],
    };
  }

  if (next.action === 'mismatch') {
    return {
      id: questionId,
      stepIndex: current.stepIndex,
      question: `What is the next outcome after checking "${next.visualState.currentChar}"?`,
      options: [
        {
          id: 'report-invalid',
          label: 'Detect mismatch and return Invalid (false)',
          isCorrect: true,
          feedback:
            'Correct! Once a closing bracket fails to match TOP (or the stack is empty), the string cannot be valid.',
        },
        {
          id: 'ignore-continue',
          label: 'Ignore the mismatch and keep scanning',
          isCorrect: false,
          feedback:
            'Every closing bracket must match immediately in LIFO order — a mismatch invalidates the entire string.',
        },
      ],
    };
  }

  if (next.action === 'unclosed') {
    return {
      id: questionId,
      stepIndex: current.stepIndex,
      question: `We reached the end of the string, and ${next.visualState.stack.length} bracket(s) are still on the stack. Is the string valid?`,
      options: [
        {
          id: 'invalid-unclosed',
          label: 'No — unclosed brackets remain, so return Invalid (false)',
          isCorrect: true,
          feedback:
            'Exactly! A valid string must leave the stack completely empty when scanning finishes.',
        },
        {
          id: 'valid-anyway',
          label: 'Yes — no mismatches occurred while scanning',
          isCorrect: false,
          feedback:
            'Careful! Unclosed opening brackets like "((" never trigger a mismatch, so checking stack.length === 0 at the end is essential.',
        },
      ],
    };
  }

  if (next.action === 'valid') {
    return {
      id: questionId,
      stepIndex: current.stepIndex,
      question:
        'We reached the end of the string and the stack is empty. What is the final result?',
      options: [
        {
          id: 'final-valid',
          label: 'Return Valid (true)',
          isCorrect: true,
          feedback:
            'Yes! Every opener was closed in proper LIFO order and nothing was left unclosed on the stack.',
        },
        {
          id: 'final-invalid',
          label: 'Return Invalid (false)',
          isCorrect: false,
          feedback:
            'With zero mismatches and an empty stack at the end, the bracket string is completely balanced (true).',
        },
      ],
    };
  }

  return null;
}

export const validParenthesesModule: ProblemModule<
  ValidParenthesesInput,
  StackVisualState
> = {
  id: 'valid-parentheses',
  visualKind: 'stack',
  spec: {
    id: 'valid-parentheses',
    provider: 'algomiri-original',
    title: 'Valid Parentheses',
    difficulty: 'Beginner',
    statement:
      'Given a string containing only the bracket characters (, ), [, ], {, and }, determine whether the brackets are balanced: every opening bracket must be closed by the same type of bracket in the correct nested order.',
    constraints: [
      'Only (), [], and {} characters are allowed.',
      'An empty string "" is considered valid (true).',
      'Every closing bracket must match the most recently opened unclosed bracket.',
      'No opening brackets may remain unclosed at the end of the string.',
    ],
    examples: [
      {
        input: 's = "{[]}"',
        output: 'true',
        explanation: '"[" closes before "{", matching Last-In-First-Out nesting.',
      },
      {
        input: 's = "([)]"',
        output: 'false',
        explanation: '")" arrives while "[" is still open on top.',
      },
    ],
    inputSchema: 'brackets: string (only ()[]{})',
    outputSchema: 'boolean',
    supportedVisualization: true,
    supportedStrategies: [
      {
        id: 'stack-matching',
        problemId: 'valid-parentheses',
        name: 'Stack Bracket Matching',
        shortLabel: 'Stack (LIFO)',
        intuition:
          'Push each opening bracket onto a stack. Whenever a closing bracket arrives, it must match the bracket sitting on TOP of the stack — then pop it.',
        tradeoffs:
          'Single O(n) pass using O(n) stack space in the worst case (when all characters are opening brackets).',
        timeComplexity: 'O(n)',
        spaceComplexity: 'O(n)',
        techniques: ['Stack (LIFO)', 'Early Mismatch Exit'],
        learningGraphId: 'valid-parentheses-stack-graph',
      },
    ],
  },
  defaultStrategyId: 'stack-matching',
  guidedInitialStrategyId: 'stack-matching',
  defaultInput: DEFAULT_VALID_PARENTHESES_INPUT,
  presets: [
    { id: 'nested', label: 'Nested "{[]}"', input: { brackets: '{[]}' } },
    { id: 'simple', label: 'Simple "()"', input: { brackets: '()' } },
    { id: 'sequence', label: 'All Types "()[]{}"', input: { brackets: '()[]{}' } },
    { id: 'mismatch', label: 'Mismatch "(]"', input: { brackets: '(]' } },
    { id: 'crossed', label: 'Crossed "([)]"', input: { brackets: '([)]' } },
    { id: 'unclosed', label: 'Unclosed "(("', input: { brackets: '((' } },
    { id: 'lonely-close', label: 'Closer Only "]"', input: { brackets: ']' } },
    { id: 'empty', label: 'Empty ""', input: { brackets: '' } },
  ],
  formatInputKey: (input) => input.brackets,
  generateTrace: (_strategyId, input) => generateValidParenthesesTrace(input),
  solutionGraphs: {
    'stack-matching': {
      id: 'valid-parentheses-stack-graph',
      strategyId: 'stack-matching',
      title: 'Stack LIFO Bracket Decomposition',
      summary:
        'Model nested brackets as Last-In-First-Out, handle opening and closing brackets through two distinct branches, and merge at the final empty-stack check.',
      requiresDag: true,
      nodes: [
        {
          id: 'vp-lifo-rule',
          title: 'Model nesting as LIFO',
          category: 'invariant',
          learningGoal:
            'Recognize that the most recently opened bracket must always be the first to close.',
          explanation:
            'Because inner brackets must close before outer brackets, a Last-In-First-Out Stack naturally tracks pending openers.',
          rationale:
            'Simple counters fail on crossed brackets like "([)]"; a Stack preserves exact nesting order.',
          skills: ['LIFO Invariant', 'Problem Modeling'],
          prerequisites: ['Balanced Bracket Rules'],
          techniques: ['Stack (LIFO)'],
          ioContract: {
            inputs: ['bracket stream s'],
            outputs: ['LIFO stack of unclosed openers'],
          },
          mappedActions: ['push', 'check-match'],
        },
        {
          id: 'vp-push-open',
          title: 'Push opening brackets',
          category: 'operation',
          learningGoal:
            'Place each "(", "[", or "{" onto TOP of the stack as a pending obligation.',
          explanation:
            'When scanning an opening bracket, push it onto TOP so the next closing bracket can inspect it in O(1) time.',
          rationale:
            'Pushing preserves the exact reverse order in which openers must be closed.',
          skills: ['Stack Push'],
          prerequisites: ['LIFO Invariant'],
          techniques: ['Stack'],
          ioContract: {
            inputs: ['opening char ch'],
            outputs: ['updated stack with ch at TOP'],
          },
          mappedActions: ['push'],
        },
        {
          id: 'vp-match-close',
          title: 'Match closer against TOP & pop',
          category: 'decision',
          learningGoal:
            'Reject empty stack or wrong TOP immediately; otherwise pop the matched opener.',
          explanation:
            'When scanning ")", "]", or "}", check that the stack is non-empty and TOP is its matching opener, then pop TOP.',
          rationale:
            'An empty stack or mismatched TOP immediately proves the bracket sequence is invalid.',
          skills: ['Stack Pop', 'Early Mismatch Exit'],
          prerequisites: ['LIFO Invariant'],
          techniques: ['Bracket Pair Lookup'],
          ioContract: {
            inputs: ['closing char ch', 'stack TOP'],
            outputs: ['popped stack | immediate false'],
          },
          mappedActions: ['check-match', 'pop', 'mismatch'],
        },
        {
          id: 'vp-final-empty',
          title: 'Verify stack is empty at end',
          category: 'termination',
          learningGoal:
            'Return true only if every pushed opener was cleanly popped and nothing remains unclosed.',
          explanation:
            'After scanning all characters without a mismatch, check stack.length === 0 to catch leftover openers like "((".',
          rationale:
            'Without this final boundary check, unclosed opening brackets would falsely return true.',
          skills: ['Boundary Invariant', 'Edge-Case Handling'],
          prerequisites: ['Stack Push', 'Stack Pop'],
          techniques: ['Final State Verification'],
          ioContract: {
            inputs: ['final stack after scan'],
            outputs: ['isValid: boolean'],
          },
          mappedActions: ['valid', 'unclosed'],
        },
      ],
      edges: [
        {
          id: 'vp-e1',
          source: 'vp-lifo-rule',
          target: 'vp-push-open',
          reason: 'Opening brackets become the newest item on TOP of the LIFO stack.',
        },
        {
          id: 'vp-e2',
          source: 'vp-lifo-rule',
          target: 'vp-match-close',
          reason: 'Closing brackets must cancel the most recent opener sitting on TOP.',
        },
        {
          id: 'vp-e3',
          source: 'vp-push-open',
          target: 'vp-final-empty',
          reason: 'Every pushed opener must eventually be matched and popped.',
        },
        {
          id: 'vp-e4',
          source: 'vp-match-close',
          target: 'vp-final-empty',
          reason: 'If no mismatch occurred, remaining stack size decides validity.',
        },
      ],
    },
  },
  lesson: {
    stages: [
      {
        id: 'vp-understand',
        stageNumber: 1,
        shortTitle: 'Balanced Rules',
        title: 'Stage 1: Understand Balanced Brackets',
        goal: 'See why counting openers vs. closers is not enough — nesting order matters.',
        conceptLearned: 'Nested Bracket Order (LIFO Rule)',
        narrative:
          'Balanced brackets must match both in TYPE and in ORDER. The most recently opened bracket is always the first one that must close.',
        recommendedStrategy: 'stack-matching',
        lockedStrategyIds: [],
        question: {
          prompt:
            'Look at "([)]". It has one "(", one ")", one "[", and one "]". Is it valid?',
          options: [
            {
              id: 'vp-q1-valid',
              label: 'Yes — every opening bracket has a matching closing bracket somewhere.',
              isCorrect: false,
              feedback:
                'Counts alone are not enough! Because "[" was opened inside "(", "[" must close BEFORE ")" arrives.',
            },
            {
              id: 'vp-q1-invalid',
              label: 'No — "[" was opened most recently, so ")" cannot close before "]".',
              isCorrect: true,
              feedback:
                'Exactly! The innermost open bracket must close first. That Last-In-First-Out rule is the core of this problem.',
            },
          ],
        },
      },
      {
        id: 'vp-why-stack',
        stageNumber: 2,
        shortTitle: 'Why a Stack?',
        title: 'Stage 2: Discover Why a Stack Fits',
        goal: 'Connect "most recently opened closes first" directly to the Stack data structure.',
        conceptLearned: 'Last-In-First-Out (LIFO) Stack Intuition',
        narrative:
          'Think of stacking plates: you place each new opening bracket on TOP, and when a closing bracket arrives, you only ever need to inspect the plate sitting on TOP.',
        recommendedStrategy: 'stack-matching',
        lockedStrategyIds: [],
        question: {
          prompt:
            'When scanning "{[]}" from left to right, after reading "{" and "[", which bracket sits on TOP of the stack?',
          options: [
            {
              id: 'vp-q2-curly',
              label: '"{" because it appeared first.',
              isCorrect: false,
              feedback:
                'A queue removes the first item, but a Stack is Last-In-First-Out: the newest item sits on TOP.',
            },
            {
              id: 'vp-q2-square',
              label: '"[" because it was pushed most recently.',
              isCorrect: true,
              feedback:
                'Spot on! "[" is on TOP, so when "]" arrives next, it matches TOP immediately and pops "[" off.',
            },
          ],
        },
      },
      {
        id: 'vp-trace-ops',
        stageNumber: 3,
        shortTitle: 'Trace & Mismatch',
        title: 'Stage 3: Trace Push, Pop & Edge Cases',
        goal: 'Watch push/pop transitions and spot the two ways a bracket string can fail.',
        conceptLearned: 'Mismatch & Unclosed-Stack Edge Cases',
        narrative:
          'Try the presets like "(]" (mismatch), "]" (empty stack), and "((" (unclosed leftovers) on the Stack Canvas and predict each step.',
        recommendedStrategy: 'stack-matching',
        lockedStrategyIds: [],
        question: {
          prompt:
            'What happens at the end of scanning "((" if you forget to check whether the stack is empty?',
          options: [
            {
              id: 'vp-q3-false-positive',
              label: 'You would wrongly return true because no mismatch ever happened during the loop.',
              isCorrect: true,
              feedback:
                'Exactly! "((" only pushes and never sees a closing bracket, so checking stack.length === 0 at the end is essential.',
            },
            {
              id: 'vp-q3-crash',
              label: 'The loop would detect a mismatch on the second "(".',
              isCorrect: false,
              feedback:
                'Two opening brackets in a row are totally fine (like "(())") — they only fail if they remain unclosed at the end.',
            },
          ],
        },
      },
      {
        id: 'vp-build-pseudo',
        stageNumber: 4,
        shortTitle: 'Build Code',
        title: 'Stage 4: Build Pseudocode Progressively',
        goal: 'Turn push, top-check, pop, and final empty-stack check into clean pseudocode.',
        conceptLearned: 'Translating Stack Reasoning to Pseudocode',
        narrative:
          'Reveal each pseudocode block only after thinking through what comes next, then try writing it in your preferred language.',
        recommendedStrategy: 'stack-matching',
        lockedStrategyIds: [],
        question: {
          prompt:
            'If a closing bracket arrives while the stack is empty (like "]"), what should the algorithm return?',
          options: [
            {
              id: 'vp-q4-push',
              label: 'Push "]" onto the stack and keep going.',
              isCorrect: false,
              feedback:
                'A closing bracket can never be matched by a later opening bracket — it already failed.',
            },
            {
              id: 'vp-q4-false',
              label: 'Return false immediately.',
              isCorrect: true,
              feedback:
                'Correct! Checking if the stack is empty before popping prevents errors and exits early with false.',
            },
          ],
        },
      },
    ],
    hintsByStage: {
      'vp-understand': [
        {
          level: 1,
          label: 'Hint 1 · Conceptual Question',
          text: 'In "([)]", which bracket is still waiting to close when ")" appears?',
        },
        {
          level: 2,
          label: 'Hint 2 · Reasoning Guidance',
          text: 'Brackets cannot cross over each other: the inner "[" must close before the outer "(" can close.',
        },
        {
          level: 3,
          label: 'Hint 3 · Explicit Next Idea',
          text: 'Because "[" was opened last, it must close first — so ")" arriving before "]" makes "([)]" invalid.',
        },
      ],
      'vp-why-stack': [
        {
          level: 1,
          label: 'Hint 1 · Conceptual Question',
          text: 'When you stack "{" first and then place "[" on top of it, which one is on TOP?',
        },
        {
          level: 2,
          label: 'Hint 2 · Reasoning Guidance',
          text: 'A Stack follows Last-In-First-Out (LIFO): the most recently pushed item is always on TOP.',
        },
        {
          level: 3,
          label: 'Hint 3 · Explicit Next Idea',
          text: 'Pushing "{" then "[" leaves "[" on TOP — ready to match the next "]".',
        },
      ],
      'vp-trace-ops': [
        {
          level: 1,
          label: 'Hint 1 · Conceptual Question',
          text: 'In "((", does the algorithm ever see a closing bracket that could trigger a mismatch?',
        },
        {
          level: 2,
          label: 'Hint 2 · Reasoning Guidance',
          text: 'Both "(" characters are simply pushed onto the stack. After the loop ends, the stack still has size 2.',
        },
        {
          level: 3,
          label: 'Hint 3 · Explicit Next Idea',
          text: 'Return true ONLY when the stack is completely empty at the end; otherwise unclosed brackets remain.',
        },
      ],
      'vp-build-pseudo': [
        {
          level: 1,
          label: 'Hint 1 · Conceptual Question',
          text: 'Can a closing bracket like "]" ever be matched by an opening bracket that appears AFTER it?',
        },
        {
          level: 2,
          label: 'Hint 2 · Reasoning Guidance',
          text: 'If the stack is empty when a closer arrives, there is no earlier opener to pair with it.',
        },
        {
          level: 3,
          label: 'Hint 3 · Explicit Next Idea',
          text: 'Check `if stack is empty or top != matching_open[ch]: return false` before popping.',
        },
      ],
    },
    pseudocodeStageId: 'vp-build-pseudo',
    pseudocodeBlocks: [
      {
        id: 'vp-pseudo-1',
        stepNumber: 1,
        title: '1. Initialize empty stack & bracket pairs',
        reason: 'Track unclosed openers and map each closer to its required opener.',
        lines: [
          'create empty stack',
          'pairs = { ")": "(", "]": "[", "}": "{" }',
        ],
      },
      {
        id: 'vp-pseudo-2',
        stepNumber: 2,
        title: '2. Push opening brackets',
        reason: 'Each opener waits on TOP of the stack for its matching closer.',
        lines: [
          'for each char ch in s:',
          '    if ch is "(", "[", or "{":',
          '        stack.push(ch)',
        ],
      },
      {
        id: 'vp-pseudo-3',
        stepNumber: 3,
        title: '3. Validate & pop on closing brackets',
        reason: 'Reject empty stack or wrong TOP immediately; otherwise pop.',
        lines: [
          '    else:',
          '        if stack is empty or stack.top() != pairs[ch]:',
          '            return false',
          '        stack.pop()',
        ],
      },
      {
        id: 'vp-pseudo-4',
        stepNumber: 4,
        title: '4. Final empty-stack check',
        reason: 'Ensure no unclosed opening brackets remain after the loop.',
        lines: ['return stack is empty'],
      },
    ],
    suggestedNextActivity:
      'Switch to Free Exploration and test tricky bracket strings like "([)]", "((", "]", and "" with Predict Mode enabled — then try implementing Valid Parentheses in your own editor without peeking!',
  },
  generatePrediction: (steps, stepIndex, strategyId, traceContextId) =>
    generateValidParenthesesPrediction(steps, stepIndex, strategyId, traceContextId),
};
