import type { ExecutionStep, TwoSumStrategyId } from '../traces/types';

export interface PredictionOption {
  id: string;
  label: string;
  isCorrect: boolean;
  feedback: string;
}

export interface PredictionPrompt {
  id: string;
  stepIndex: number;
  question: string;
  options: PredictionOption[];
}

export function generatePredictionPrompt(
  steps: ExecutionStep[],
  currentStepIndex: number,
  strategyId: TwoSumStrategyId,
  traceContextId = 'default',
): PredictionPrompt | null {
  const current = steps[currentStepIndex];
  const next = steps[currentStepIndex + 1];

  if (!current || !next) {
    return null;
  }

  const { nums, target } = current.visualState;
  const questionId = `${traceContextId}:step-${current.stepIndex}:${current.action}`;

  if (strategyId === 'brute-force') {
    if (current.action === 'select-anchor') {
      const i = current.visualState.pointers.i ?? 0;
      const nextJ = next.visualState.pointers.j ?? i + 1;
      return {
        id: questionId,
        stepIndex: current.stepIndex,
        question: `Anchor i is at index ${i} (value ${nums[i]}). Which index will partner j inspect next?`,
        options: [
          {
            id: 'next-j',
            label: `Index ${nextJ} (value ${nums[nextJ]})`,
            isCorrect: true,
            feedback: `Correct! Partner j starts at i + 1 = ${nextJ} so we check distinct pairs without reusing index ${i}.`,
          },
          {
            id: 'same-i',
            label: `Index ${i} (same as anchor i)`,
            isCorrect: false,
            feedback: `Not quite — pairing index ${i} with itself is forbidden because both indices must be distinct.`,
          },
          {
            id: 'index-0-or-end',
            label: i === 0 ? `Index ${nums.length - 1} (jump to the end)` : `Index 0 (restart from the beginning)`,
            isCorrect: false,
            feedback:
              i === 0
                ? `Brute Force scans sequentially from i + 1 (${nextJ}) rather than jumping to the end.`
                : `Pairs with index 0 were already checked when i = 0, so we start at i + 1 (${nextJ}).`,
          },
        ],
      };
    }

    if (current.action === 'compare-pair') {
      const i = current.visualState.pointers.i ?? 0;
      const j = current.visualState.pointers.j ?? i + 1;
      const sum = current.visualState.pairSum ?? nums[i] + nums[j];

      if (next.action === 'found') {
        return {
          id: questionId,
          stepIndex: current.stepIndex,
          question: `We just computed nums[${i}] + nums[${j}] = ${nums[i]} + ${nums[j]} = ${sum} (target is ${target}). What happens next?`,
          options: [
            {
              id: 'confirm-match',
              label: `Confirm match and return [${i}, ${j}]`,
              isCorrect: true,
              feedback: `Yes! ${sum} equals target ${target} with distinct indices ${i} and ${j}, so we stop early and return [${i}, ${j}].`,
            },
            {
              id: 'advance-j',
              label: 'Ignore this pair and keep scanning j',
              isCorrect: false,
              feedback: `Since ${nums[i]} + ${nums[j]} already equals ${target}, there is no reason to keep scanning.`,
            },
            {
              id: 'not-found',
              label: 'Report that no solution exists',
              isCorrect: false,
              feedback: `Look at the sum: ${nums[i]} + ${nums[j]} = ${sum}, which matches target ${target}!`,
            },
          ],
        };
      }

      if (next.action === 'compare-pair') {
        const nextJ = next.visualState.pointers.j ?? j + 1;
        return {
          id: questionId,
          stepIndex: current.stepIndex,
          question: `${nums[i]} + ${nums[j]} = ${sum} ≠ ${target}. What pointer moves next?`,
          options: [
            {
              id: 'move-j',
              label: `Keep i = ${i} and advance j to ${nextJ} (value ${nums[nextJ]})`,
              isCorrect: true,
              feedback: `Correct! Because j has not reached the end of the array, we keep anchor i = ${i} and test j = ${nextJ} next.`,
            },
            {
              id: 'move-i',
              label: `Advance anchor i to ${i + 1} immediately`,
              isCorrect: false,
              feedback: `Not yet — we still have untested partners after j = ${j} for anchor i = ${i}.`,
            },
            {
              id: 'stop-now',
              label: 'Stop and return not found',
              isCorrect: false,
              feedback: `We haven't checked all pairs yet! More partner indices remain after j = ${j}.`,
            },
          ],
        };
      }

      if (next.action === 'select-anchor') {
        const nextI = next.visualState.pointers.i ?? i + 1;
        return {
          id: questionId,
          stepIndex: current.stepIndex,
          question: `${nums[i]} + ${nums[j]} = ${sum} ≠ ${target}, and j reached the end of the array. What happens next?`,
          options: [
            {
              id: 'next-anchor',
              label: `Advance anchor i to ${nextI} (value ${nums[nextI]})`,
              isCorrect: true,
              feedback: `Exactly! All pairs with i = ${i} have been checked, so the outer loop advances i to ${nextI}.`,
            },
            {
              id: 'reset-j-zero',
              label: `Keep i = ${i} and loop j back to 0`,
              isCorrect: false,
              feedback: `Looping j back to 0 would revisit already-tested pairs and pair i with itself.`,
            },
            {
              id: 'return-not-found',
              label: 'Stop immediately and return not found',
              isCorrect: false,
              feedback: `There are still more anchor indices to try starting at i = ${nextI}.`,
            },
          ],
        };
      }

      if (next.action === 'not-found') {
        return {
          id: questionId,
          stepIndex: current.stepIndex,
          question: `${nums[i]} + ${nums[j]} = ${sum} ≠ ${target}, and this was the final distinct pair. What happens next?`,
          options: [
            {
              id: 'report-not-found',
              label: 'Finish and report no valid pair found',
              isCorrect: true,
              feedback: `Correct! Every distinct pair (i < j) has been tested without matching ${target}, so the algorithm returns not found.`,
            },
            {
              id: 'reuse-same',
              label: 'Check pairs where i = j',
              isCorrect: false,
              feedback: `Two Sum forbids using the same index twice, so we never test i = j.`,
            },
            {
              id: 'return-first',
              label: 'Return [0, 1] as a fallback',
              isCorrect: false,
              feedback: `Never return an invalid pair — when no pair sums to ${target}, the honest answer is not found.`,
            },
          ],
        };
      }
    }
  }

  // Hash Map strategy predictions
  if (strategyId === 'hash-map') {
    if (current.action === 'lookup-miss') {
      const i = current.visualState.pointers.i ?? 0;
      const val = nums[i];
      const complement = current.visualState.complement ?? target - val;
      return {
        id: questionId,
        stepIndex: current.stepIndex,
        question: `Complement ${complement} was NOT in the Seen Map. What does the algorithm do next?`,
        options: [
          {
            id: 'store-current',
            label: `Store ${val} → index ${i} in the Seen Map`,
            isCorrect: true,
            feedback: `Right! Storing ${val} → index ${i} lets a later element find ${val} in O(1) time if it needs it as a complement.`,
          },
          {
            id: 'store-complement',
            label: `Store complement ${complement} → index ${i} in the Seen Map`,
            isCorrect: false,
            feedback: `Careful: index ${i} holds value ${val}, not ${complement}. We store what we actually saw (${val} → ${i}).`,
          },
          {
            id: 'skip-store',
            label: 'Leave the Seen Map unchanged and move on',
            isCorrect: false,
            feedback: `If we don't store ${val} → ${i}, future elements won't know that ${val} appeared at index ${i}!`,
          },
        ],
      };
    }

    if (current.action === 'store-value') {
      if (next.action === 'not-found') {
        return {
          id: questionId,
          stepIndex: current.stepIndex,
          question: `We stored the last element in the array. What happens next?`,
          options: [
            {
              id: 'hm-not-found',
              label: 'End the pass and report no valid pair found',
              isCorrect: true,
              feedback: `Correct! Every index has been inspected and no complement matched target ${target}.`,
            },
            {
              id: 'hm-restart',
              label: 'Scan the array a second time from index 0',
              isCorrect: false,
              feedback: `The Hash Map strategy only needs a single pass — if a valid pair existed, the second element of the pair would have found the first.`,
            },
            {
              id: 'hm-self',
              label: 'Match the last element with itself',
              isCorrect: false,
              feedback: `Distinct indices are required, so an element can never match itself.`,
            },
          ],
        };
      }

      const nextI = next.visualState.pointers.i ?? (current.visualState.pointers.i ?? 0) + 1;
      const nextVal = nums[nextI];
      const nextComp = target - nextVal;
      const willHit = next.action === 'lookup-hit';

      return {
        id: questionId,
        stepIndex: current.stepIndex,
        question: `Next we advance to i = ${nextI} (nums[${nextI}] = ${nextVal}), so we need complement ${target} - ${nextVal} = ${nextComp}. Will the Seen Map find ${nextComp}?`,
        options: [
          {
            id: 'will-hit',
            label: `Yes — ${nextComp} is already in the Seen Map!`,
            isCorrect: willHit,
            feedback: willHit
              ? `Spot on! ${nextComp} was stored from an earlier index, so lookup succeeds in O(1) time.`
              : `Check the Seen Map panel above: ${nextComp} has not been stored yet, so this lookup will be a miss.`,
          },
          {
            id: 'will-miss',
            label: `No — ${nextComp} is not in the Seen Map yet.`,
            isCorrect: !willHit,
            feedback: !willHit
              ? `Correct! ${nextComp} isn't in the Seen Map yet, so we will record ${nextVal} → ${nextI} after the check.`
              : `Look closely at the Seen Map panel above — ${nextComp} IS already stored there!`,
          },
        ],
      };
    }

    if (current.action === 'lookup-hit') {
      const pair = next.visualState.foundPair ?? [0, 1];
      const [firstIdx, secondIdx] = pair;
      return {
        id: questionId,
        stepIndex: current.stepIndex,
        question: `Complement lookup succeeded! Which pair of distinct indices will be returned next?`,
        options: [
          {
            id: 'correct-pair',
            label: `[${firstIdx}, ${secondIdx}]`,
            isCorrect: true,
            feedback: `Yes! nums[${firstIdx}] (${nums[firstIdx]}) + nums[${secondIdx}] (${nums[secondIdx]}) = ${target}.`,
          },
          {
            id: 'self-pair',
            label: `[${secondIdx}, ${secondIdx}]`,
            isCorrect: false,
            feedback: `Both indices must be distinct — the matched complement came from earlier index ${firstIdx}, not ${secondIdx}.`,
          },
          {
            id: 'values-pair',
            label: `[${nums[firstIdx]}, ${nums[secondIdx]}] (the values instead of indices)`,
            isCorrect: false,
            feedback: `Two Sum asks for the INDICES [${firstIdx}, ${secondIdx}], not the element values.`,
          },
        ],
      };
    }
  }

  return null;
}
