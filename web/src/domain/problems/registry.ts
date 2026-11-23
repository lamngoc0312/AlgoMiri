import type { ProblemModule } from '../core/types';
import { twoSumModule } from './twoSumModule';
import { validParenthesesModule } from './validParenthesesModule';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyProblemModule = ProblemModule<any, any>;

const REGISTERED_MODULES: Record<string, AnyProblemModule> = {
  [twoSumModule.id]: twoSumModule,
  [validParenthesesModule.id]: validParenthesesModule,
};

export function getProblemModule(problemId: string): AnyProblemModule | null {
  return REGISTERED_MODULES[problemId] ?? null;
}

export function getAllProblemModules(): AnyProblemModule[] {
  return [twoSumModule, validParenthesesModule];
}

export function isSupportedProblemId(problemId: string): boolean {
  return problemId in REGISTERED_MODULES;
}
