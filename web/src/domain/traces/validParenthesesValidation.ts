export interface ValidParenthesesInput {
  brackets: string;
}

export const MAX_BRACKETS_LENGTH = 16;

const ALLOWED_BRACKETS = new Set(['(', ')', '[', ']', '{', '}']);

export type BracketValidationResult =
  | { ok: true; value: ValidParenthesesInput }
  | {
      ok: false;
      error: string;
      code: 'bracketsTooLong' | 'invalidBrackets';
      values: Record<string, string | number>;
    };

export function parseAndValidateBracketsInput(
  rawText: string,
): BracketValidationResult {
  const trimmed = rawText.trim();

  if (trimmed.length > MAX_BRACKETS_LENGTH) {
    return {
      ok: false,
      code: 'bracketsTooLong',
      values: { max: MAX_BRACKETS_LENGTH },
      error: `Please enter at most ${MAX_BRACKETS_LENGTH} bracket characters so the stack visualization stays clear.`,
    };
  }

  const invalidChars: string[] = [];
  for (const ch of trimmed) {
    if (!ALLOWED_BRACKETS.has(ch) && !invalidChars.includes(ch)) {
      invalidChars.push(ch);
    }
  }

  if (invalidChars.length > 0) {
    return {
      ok: false,
      code: 'invalidBrackets',
      values: { characters: invalidChars.map((c) => `"${c}"`).join(', ') },
      error: `Unsupported character${invalidChars.length > 1 ? 's' : ''}: ${invalidChars.map((c) => `"${c}"`).join(', ')}. Only (), [], and {} are supported.`,
    };
  }

  return {
    ok: true,
    value: { brackets: trimmed },
  };
}
