import type { TFunction } from 'i18next';
import type {
  AnyVisualState,
  ArrayHashVisualState,
  BinarySearchGreedyVisualState,
  GenericExecutionStep,
  PredictionPrompt,
  StackVisualState,
} from '../domain/core/types';
import type { ArrayHighlight } from '../domain/traces/types';

function localizeArrayHighlights(
  t: TFunction,
  strategyId: string,
  action: string,
  highlights: ArrayHighlight[],
): ArrayHighlight[] {
  return highlights.map((h) => {
    if (action === 'found' && h.role === 'match') {
      const inner =
        strategyId === 'brute-force'
          ? h.label.includes('(i)')
            ? 'i'
            : 'j'
          : String(h.index);
      return {
        ...h,
        label: t('traces.highlights.matchLabel', { label: inner }),
      };
    }
    if (strategyId === 'brute-force') {
      if (h.role === 'current') {
        return { ...h, label: t('traces.highlights.anchorI') };
      }
      if (h.role === 'partner') {
        return { ...h, label: t('traces.highlights.partnerJ') };
      }
    } else {
      if (h.role === 'current') {
        return { ...h, label: t('traces.highlights.currentI') };
      }
      if (h.role === 'partner') {
        return { ...h, label: t('traces.highlights.inMap') };
      }
      if (h.role === 'visited') {
        return { ...h, label: t('traces.highlights.stored') };
      }
    }
    return h;
  });
}

function localizeTwoSumStep(
  t: TFunction,
  strategyId: string,
  step: GenericExecutionStep<ArrayHashVisualState>,
): GenericExecutionStep<ArrayHashVisualState> {
  const { visualState, action } = step;
  const { nums, target, pointers, pairSum, foundPair, complement } = visualState;
  const localizedHighlights = localizeArrayHighlights(
    t,
    strategyId,
    action,
    visualState.highlights,
  );

  let actionTitle = step.actionTitle;
  let explanation = step.explanation;

  if (action === 'not-found') {
    if (nums.length < 2) {
      actionTitle = t('traces.twoSum.notEnoughTitle');
      explanation =
        nums.length === 0
          ? strategyId === 'brute-force'
            ? t('traces.twoSum.emptyBruteForce')
            : t('traces.twoSum.emptyHashMap')
          : t('traces.twoSum.singleElement');
    } else {
      actionTitle = t('traces.twoSum.noPairTitle');
      explanation =
        strategyId === 'brute-force'
          ? t('traces.twoSum.noPairBruteForce', { target })
          : t('traces.twoSum.noPairHashMap', { count: nums.length, target });
    }
  } else if (action === 'select-anchor') {
    const i = pointers.i ?? 0;
    actionTitle = t('traces.twoSum.selectAnchorTitle', { i });
    explanation = t('traces.twoSum.selectAnchorExplanation', {
      i,
      val: nums[i],
      nextJ: i + 1,
    });
  } else if (action === 'compare-pair') {
    const i = pointers.i ?? 0;
    const j = pointers.j ?? i + 1;
    const sum = pairSum ?? nums[i] + nums[j];
    const isMatch = sum === target;
    actionTitle = t('traces.twoSum.comparePairTitle', {
      i,
      j,
      valI: nums[i],
      valJ: nums[j],
      sum,
    });
    explanation = isMatch
      ? t('traces.twoSum.comparePairMatch', {
          j,
          valI: nums[i],
          valJ: nums[j],
          sum,
          target,
        })
      : t('traces.twoSum.comparePairMismatch', {
          j,
          valI: nums[i],
          valJ: nums[j],
          sum,
          target,
        });
  } else if (action === 'found' && foundPair) {
    const [first, second] = foundPair;
    actionTitle = t('traces.twoSum.foundTitle', { first, second });
    explanation =
      strategyId === 'brute-force'
        ? t('traces.twoSum.foundBruteForce', {
            first,
            second,
            valFirst: nums[first],
            valSecond: nums[second],
            target,
          })
        : t('traces.twoSum.foundHashMap', {
            first,
            second,
            valFirst: nums[first],
            valSecond: nums[second],
            target,
          });
  } else if (action === 'lookup-hit') {
    const i = pointers.i ?? 0;
    const current = nums[i];
    const comp = complement ?? target - current;
    const compIdx =
      visualState.highlights.find((h) => h.role === 'partner')?.index ?? 0;
    actionTitle = t('traces.twoSum.lookupHitTitle', { i, complement: comp });
    explanation = t('traces.twoSum.lookupHitExplanation', {
      i,
      current,
      target,
      complement: comp,
      compIdx,
    });
  } else if (action === 'lookup-miss') {
    const i = pointers.i ?? 0;
    const current = nums[i];
    const comp = complement ?? target - current;
    actionTitle = t('traces.twoSum.lookupMissTitle', { i, complement: comp });
    explanation = t('traces.twoSum.lookupMissExplanation', {
      i,
      current,
      target,
      complement: comp,
    });
  } else if (action === 'store-value') {
    const i = pointers.i ?? 0;
    const current = nums[i];
    const comp = complement ?? target - current;
    actionTitle = t('traces.twoSum.storeValueTitle', { current, i });
    explanation = t('traces.twoSum.storeValueExplanation', {
      complement: comp,
      current,
      i,
    });
  }

  return {
    ...step,
    actionTitle,
    explanation,
    visualState: {
      ...visualState,
      highlights: localizedHighlights,
    },
  };
}

function localizeStackStep(
  t: TFunction,
  step: GenericExecutionStep<StackVisualState>,
): GenericExecutionStep<StackVisualState> {
  const { visualState } = step;
  const {
    operation,
    input,
    currentIndex,
    currentChar,
    comparingWith,
    expectedBracket,
    stack,
  } = visualState;

  let actionTitle = step.actionTitle;
  let explanation = step.explanation;

  if (operation === 'valid') {
    if (input.length === 0) {
      actionTitle = t('traces.validParentheses.emptyValidTitle');
      explanation = t('traces.validParentheses.emptyValidExplanation');
    } else {
      actionTitle = t('traces.validParentheses.validTitle');
      explanation = t('traces.validParentheses.validExplanation');
    }
  } else if (operation === 'push') {
    actionTitle = t('traces.validParentheses.pushTitle', {
      i: currentIndex ?? 0,
      ch: currentChar ?? '',
    });
    explanation = t('traces.validParentheses.pushExplanation', {
      ch: currentChar ?? '',
      expected: expectedBracket ?? '',
    });
  } else if (operation === 'check-match') {
    const matches = step.variables.matches === true;
    actionTitle = t('traces.validParentheses.checkMatchTitle', {
      i: currentIndex ?? 0,
      ch: currentChar ?? '',
      top: comparingWith ?? '',
    });
    explanation = matches
      ? t('traces.validParentheses.checkMatchHit', {
          ch: currentChar ?? '',
          top: comparingWith ?? '',
        })
      : t('traces.validParentheses.checkMatchMiss', {
          ch: currentChar ?? '',
          top: comparingWith ?? '',
          expected: expectedBracket ?? '',
        });
  } else if (operation === 'mismatch') {
    if (comparingWith === null) {
      actionTitle = t('traces.validParentheses.emptyStackMismatchTitle', {
        i: currentIndex ?? 0,
        ch: currentChar ?? '',
      });
      explanation = t('traces.validParentheses.emptyStackMismatchExplanation', {
        ch: currentChar ?? '',
        expected: expectedBracket ?? '',
      });
    } else {
      actionTitle = t('traces.validParentheses.mismatchTitle', {
        expected: expectedBracket ?? '',
        ch: currentChar ?? '',
      });
      explanation = t('traces.validParentheses.mismatchExplanation', {
        top: comparingWith ?? '',
        expected: expectedBracket ?? '',
        ch: currentChar ?? '',
      });
    }
  } else if (operation === 'pop') {
    actionTitle = t('traces.validParentheses.popTitle', {
      top: comparingWith ?? '',
      ch: currentChar ?? '',
    });
    explanation = t('traces.validParentheses.popExplanation', {
      top: comparingWith ?? '',
      ch: currentChar ?? '',
      size: stack.length,
    });
  } else if (operation === 'unclosed') {
    actionTitle = t('traces.validParentheses.unclosedTitle', {
      count: stack.length,
    });
    explanation = t('traces.validParentheses.unclosedExplanation', {
      count: stack.length,
    });
  }

  return {
    ...step,
    actionTitle,
    explanation,
  };
}

function localizeSplitArrayStep(
  t: TFunction,
  step: GenericExecutionStep<BinarySearchGreedyVisualState>,
): GenericExecutionStep<BinarySearchGreedyVisualState> {
  const { visualState, action } = step;
  const {
    nums,
    k,
    low,
    high,
    mid,
    composition,
    scanIndex,
    runningSum,
    groupsUsed,
    groups,
    feasible,
  } = visualState;

  let actionTitle = step.actionTitle;
  let explanation = step.explanation;
  let boundDecision = visualState.boundDecision;

  if (action === 'bs-init-bounds') {
    actionTitle = t('traces.splitArray.initBoundsTitle', { low, high });
    explanation = t('traces.splitArray.initBoundsExplanation', { low, high });
  } else if (action === 'bs-select-mid') {
    actionTitle = t('traces.splitArray.selectMidTitle', {
      iter: composition.bsIteration,
      mid: mid ?? 0,
    });
    explanation = t('traces.splitArray.selectMidExplanation', {
      low,
      high,
      mid: mid ?? 0,
      k,
    });
  } else if (action === 'greedy-start') {
    actionTitle = t('traces.splitArray.greedyStartTitle', {
      iter: composition.bsIteration,
      mid: mid ?? 0,
    });
    explanation = t('traces.splitArray.greedyStartExplanation', {
      mid: mid ?? 0,
    });
  } else if (action === 'greedy-add-to-group') {
    const idx = scanIndex ?? 0;
    const val = nums[idx] ?? 0;
    const sum = runningSum ?? val;
    if (idx === 0) {
      actionTitle = t('traces.splitArray.greedyFirstTitle', {
        val,
        sum,
        mid: mid ?? 0,
      });
      explanation = t('traces.splitArray.greedyFirstExplanation', {
        val,
        mid: mid ?? 0,
      });
    } else {
      const prevSum = sum - val;
      actionTitle = t('traces.splitArray.greedyAddTitle', {
        idx,
        val,
        group: groupsUsed,
        prevSum,
        sum,
        mid: mid ?? 0,
      });
      explanation = t('traces.splitArray.greedyAddExplanation', {
        val,
        group: groupsUsed,
        sum,
        mid: mid ?? 0,
      });
    }
  } else if (action === 'greedy-new-group') {
    const idx = scanIndex ?? 0;
    const val = nums[idx] ?? 0;
    const prevGroupSum = groups.length >= 2 ? groups[groups.length - 2].sum : 0;
    const wouldBe = prevGroupSum + val;
    actionTitle = t('traces.splitArray.greedyNewGroupTitle', {
      idx,
      val,
      wouldBe,
      mid: mid ?? 0,
      group: groupsUsed,
    });
    explanation = t('traces.splitArray.greedyNewGroupExplanation', {
      val,
      wouldBe,
      mid: mid ?? 0,
      group: groupsUsed,
    });
  } else if (action === 'greedy-result') {
    const isFeasible = feasible === true;
    actionTitle = isFeasible
      ? t('traces.splitArray.greedyResultFeasibleTitle', {
          groups: groupsUsed,
          k,
          mid: mid ?? 0,
        })
      : t('traces.splitArray.greedyResultInfeasibleTitle', {
          groups: groupsUsed,
          k,
          mid: mid ?? 0,
        });
    explanation = isFeasible
      ? t('traces.splitArray.greedyResultFeasibleExplanation', {
          count: groupsUsed,
          k,
          mid: mid ?? 0,
        })
      : t('traces.splitArray.greedyResultInfeasibleExplanation', {
          groups: groupsUsed,
          k,
          mid: mid ?? 0,
        });
  } else if (action === 'bs-update-bounds') {
    const isFeasible = feasible === true;
    const testedMid = mid ?? 0;
    boundDecision = isFeasible
      ? t('traces.splitArray.decisionFeasible', { mid: testedMid })
      : t('traces.splitArray.decisionInfeasible', { nextLow: testedMid + 1 });
    actionTitle = t('traces.splitArray.updateBoundsTitle', {
      decision: boundDecision,
      low,
      high,
    });
    explanation = isFeasible
      ? t('traces.splitArray.updateBoundsFeasibleExplanation', {
          mid: testedMid,
          low,
          high,
        })
      : t('traces.splitArray.updateBoundsInfeasibleExplanation', {
          mid: testedMid,
          low,
          high,
        });
  } else if (action === 'bs-converged') {
    boundDecision = t('traces.splitArray.decisionConverged', { low });
    actionTitle = t('traces.splitArray.convergedTitle', { low });
    explanation = t('traces.splitArray.convergedExplanation', {
      low,
      count: k,
    });
  }

  return {
    ...step,
    actionTitle,
    explanation,
    visualState: {
      ...visualState,
      boundDecision,
    },
  };
}

/**
 * Pure presentation-time execution step localizer.
 * Never alters deterministic state, step IDs, actions, variables, or algorithm logic.
 */
export function localizeExecutionStep<T extends AnyVisualState>(
  t: TFunction,
  _problemId: string,
  strategyId: string,
  step: GenericExecutionStep<T>,
): GenericExecutionStep<T> {
  if (step.visualState.kind === 'array-hash') {
    return localizeTwoSumStep(
      t,
      strategyId,
      step as GenericExecutionStep<ArrayHashVisualState>,
    ) as GenericExecutionStep<T>;
  }
  if (step.visualState.kind === 'stack') {
    return localizeStackStep(
      t,
      step as GenericExecutionStep<StackVisualState>,
    ) as GenericExecutionStep<T>;
  }
  if (step.visualState.kind === 'bs-greedy') {
    return localizeSplitArrayStep(
      t,
      step as GenericExecutionStep<BinarySearchGreedyVisualState>,
    ) as GenericExecutionStep<T>;
  }
  return step;
}

/**
 * Pure presentation-time prediction checkpoint localizer.
 * Preserves prompt.id, prompt.stepIndex, option.id, and option.isCorrect identically
 * across language switches so active checkpoints and scoring records are never invalidated.
 */
export function localizePredictionPrompt(
  t: TFunction,
  problemId: string,
  strategyId: string,
  steps: GenericExecutionStep[],
  stepIndex: number,
  prompt: PredictionPrompt,
): PredictionPrompt {
  const current = steps[stepIndex];
  const next = steps[stepIndex + 1];
  if (!current || !next) return prompt;

  if (problemId === 'two-sum' && current.visualState.kind === 'array-hash') {
    const curState = current.visualState;
    const nextState = next.visualState as ArrayHashVisualState;
    const { nums, target } = curState;

    if (strategyId === 'brute-force') {
      if (current.action === 'select-anchor') {
        const i = curState.pointers.i ?? 0;
        const nextJ = nextState.pointers.j ?? i + 1;
        return {
          ...prompt,
          question: t('predictions.twoSum.bfSelectAnchor.question', {
            i,
            valI: nums[i],
          }),
          options: prompt.options.map((opt) => {
            if (opt.id === 'next-j') {
              return {
                ...opt,
                label: t('predictions.twoSum.bfSelectAnchor.optNextJ', {
                  nextJ,
                  valNextJ: nums[nextJ],
                }),
                feedback: t('predictions.twoSum.bfSelectAnchor.fbNextJ', {
                  nextJ,
                  i,
                }),
              };
            }
            if (opt.id === 'same-i') {
              return {
                ...opt,
                label: t('predictions.twoSum.bfSelectAnchor.optSameI', { i }),
                feedback: t('predictions.twoSum.bfSelectAnchor.fbSameI', { i }),
              };
            }
            if (opt.id === 'index-0-or-end') {
              return {
                ...opt,
                label:
                  i === 0
                    ? t('predictions.twoSum.bfSelectAnchor.optJumpEnd', {
                        lastIdx: nums.length - 1,
                      })
                    : t('predictions.twoSum.bfSelectAnchor.optRestartZero'),
                feedback:
                  i === 0
                    ? t('predictions.twoSum.bfSelectAnchor.fbJumpEnd', { nextJ })
                    : t('predictions.twoSum.bfSelectAnchor.fbRestartZero', {
                        nextJ,
                      }),
              };
            }
            return opt;
          }),
        };
      }

      if (current.action === 'compare-pair') {
        const i = curState.pointers.i ?? 0;
        const j = curState.pointers.j ?? i + 1;
        const sum = curState.pairSum ?? nums[i] + nums[j];

        if (next.action === 'found') {
          return {
            ...prompt,
            question: t('predictions.twoSum.bfFound.question', {
              i,
              j,
              valI: nums[i],
              valJ: nums[j],
              sum,
              target,
            }),
            options: prompt.options.map((opt) => {
              if (opt.id === 'confirm-match') {
                return {
                  ...opt,
                  label: t('predictions.twoSum.bfFound.optConfirm', { i, j }),
                  feedback: t('predictions.twoSum.bfFound.fbConfirm', {
                    sum,
                    target,
                    i,
                    j,
                  }),
                };
              }
              if (opt.id === 'advance-j') {
                return {
                  ...opt,
                  label: t('predictions.twoSum.bfFound.optAdvance'),
                  feedback: t('predictions.twoSum.bfFound.fbAdvance', {
                    valI: nums[i],
                    valJ: nums[j],
                    target,
                  }),
                };
              }
              if (opt.id === 'not-found') {
                return {
                  ...opt,
                  label: t('predictions.twoSum.bfFound.optNotFound'),
                  feedback: t('predictions.twoSum.bfFound.fbNotFound', {
                    valI: nums[i],
                    valJ: nums[j],
                    sum,
                    target,
                  }),
                };
              }
              return opt;
            }),
          };
        }

        if (next.action === 'compare-pair') {
          const nextJ = nextState.pointers.j ?? j + 1;
          return {
            ...prompt,
            question: t('predictions.twoSum.bfMoveJ.question', {
              valI: nums[i],
              valJ: nums[j],
              sum,
              target,
            }),
            options: prompt.options.map((opt) => {
              if (opt.id === 'move-j') {
                return {
                  ...opt,
                  label: t('predictions.twoSum.bfMoveJ.optMoveJ', {
                    i,
                    nextJ,
                    valNextJ: nums[nextJ],
                  }),
                  feedback: t('predictions.twoSum.bfMoveJ.fbMoveJ', {
                    i,
                    nextJ,
                  }),
                };
              }
              if (opt.id === 'move-i') {
                return {
                  ...opt,
                  label: t('predictions.twoSum.bfMoveJ.optMoveI', {
                    nextI: i + 1,
                  }),
                  feedback: t('predictions.twoSum.bfMoveJ.fbMoveI', { j, i }),
                };
              }
              if (opt.id === 'stop-now') {
                return {
                  ...opt,
                  label: t('predictions.twoSum.bfMoveJ.optStop'),
                  feedback: t('predictions.twoSum.bfMoveJ.fbStop', { j }),
                };
              }
              return opt;
            }),
          };
        }

        if (next.action === 'select-anchor') {
          const nextI = nextState.pointers.i ?? i + 1;
          return {
            ...prompt,
            question: t('predictions.twoSum.bfMoveI.question', {
              valI: nums[i],
              valJ: nums[j],
              sum,
              target,
            }),
            options: prompt.options.map((opt) => {
              if (opt.id === 'next-anchor') {
                return {
                  ...opt,
                  label: t('predictions.twoSum.bfMoveI.optNextAnchor', {
                    nextI,
                    valNextI: nums[nextI],
                  }),
                  feedback: t('predictions.twoSum.bfMoveI.fbNextAnchor', {
                    i,
                    nextI,
                  }),
                };
              }
              if (opt.id === 'reset-j-zero') {
                return {
                  ...opt,
                  label: t('predictions.twoSum.bfMoveI.optResetJ', { i }),
                  feedback: t('predictions.twoSum.bfMoveI.fbResetJ'),
                };
              }
              if (opt.id === 'return-not-found') {
                return {
                  ...opt,
                  label: t('predictions.twoSum.bfMoveI.optStop'),
                  feedback: t('predictions.twoSum.bfMoveI.fbStop', { nextI }),
                };
              }
              return opt;
            }),
          };
        }

        if (next.action === 'not-found') {
          return {
            ...prompt,
            question: t('predictions.twoSum.bfNotFound.question', {
              valI: nums[i],
              valJ: nums[j],
              sum,
              target,
            }),
            options: prompt.options.map((opt) => {
              if (opt.id === 'report-not-found') {
                return {
                  ...opt,
                  label: t('predictions.twoSum.bfNotFound.optReport'),
                  feedback: t('predictions.twoSum.bfNotFound.fbReport', {
                    target,
                  }),
                };
              }
              if (opt.id === 'reuse-same') {
                return {
                  ...opt,
                  label: t('predictions.twoSum.bfNotFound.optSame'),
                  feedback: t('predictions.twoSum.bfNotFound.fbSame'),
                };
              }
              if (opt.id === 'return-first') {
                return {
                  ...opt,
                  label: t('predictions.twoSum.bfNotFound.optFallback'),
                  feedback: t('predictions.twoSum.bfNotFound.fbFallback', {
                    target,
                  }),
                };
              }
              return opt;
            }),
          };
        }
      }
    }

    if (strategyId === 'hash-map') {
      if (current.action === 'lookup-miss') {
        const i = curState.pointers.i ?? 0;
        const val = nums[i];
        const complement = curState.complement ?? target - val;
        return {
          ...prompt,
          question: t('predictions.twoSum.hmLookupMiss.question', {
            complement,
          }),
          options: prompt.options.map((opt) => {
            if (opt.id === 'store-current') {
              return {
                ...opt,
                label: t('predictions.twoSum.hmLookupMiss.optStoreCurrent', {
                  val,
                  i,
                }),
                feedback: t('predictions.twoSum.hmLookupMiss.fbStoreCurrent', {
                  val,
                  i,
                }),
              };
            }
            if (opt.id === 'store-complement') {
              return {
                ...opt,
                label: t('predictions.twoSum.hmLookupMiss.optStoreComp', {
                  complement,
                  i,
                }),
                feedback: t('predictions.twoSum.hmLookupMiss.fbStoreComp', {
                  i,
                  val,
                  complement,
                }),
              };
            }
            if (opt.id === 'skip-store') {
              return {
                ...opt,
                label: t('predictions.twoSum.hmLookupMiss.optSkipStore'),
                feedback: t('predictions.twoSum.hmLookupMiss.fbSkipStore', {
                  val,
                  i,
                }),
              };
            }
            return opt;
          }),
        };
      }

      if (current.action === 'store-value') {
        if (next.action === 'not-found') {
          return {
            ...prompt,
            question: t('predictions.twoSum.hmStoreEnd.question'),
            options: prompt.options.map((opt) => {
              if (opt.id === 'hm-not-found') {
                return {
                  ...opt,
                  label: t('predictions.twoSum.hmStoreEnd.optNotFound'),
                  feedback: t('predictions.twoSum.hmStoreEnd.fbNotFound', {
                    target,
                  }),
                };
              }
              if (opt.id === 'hm-restart') {
                return {
                  ...opt,
                  label: t('predictions.twoSum.hmStoreEnd.optRestart'),
                  feedback: t('predictions.twoSum.hmStoreEnd.fbRestart'),
                };
              }
              if (opt.id === 'hm-self') {
                return {
                  ...opt,
                  label: t('predictions.twoSum.hmStoreEnd.optSelf'),
                  feedback: t('predictions.twoSum.hmStoreEnd.fbSelf'),
                };
              }
              return opt;
            }),
          };
        }

        const nextI =
          nextState.pointers.i ?? (curState.pointers.i ?? 0) + 1;
        const nextVal = nums[nextI];
        const nextComp = target - nextVal;
        const willHit = next.action === 'lookup-hit';

        return {
          ...prompt,
          question: t('predictions.twoSum.hmStoreNext.question', {
            nextI,
            nextVal,
            target,
            nextComp,
          }),
          options: prompt.options.map((opt) => {
            if (opt.id === 'will-hit') {
              return {
                ...opt,
                label: t('predictions.twoSum.hmStoreNext.optWillHit', {
                  nextComp,
                }),
                feedback: willHit
                  ? t('predictions.twoSum.hmStoreNext.fbWillHitTrue', {
                      nextComp,
                    })
                  : t('predictions.twoSum.hmStoreNext.fbWillHitFalse', {
                      nextComp,
                    }),
              };
            }
            if (opt.id === 'will-miss') {
              return {
                ...opt,
                label: t('predictions.twoSum.hmStoreNext.optWillMiss', {
                  nextComp,
                }),
                feedback: !willHit
                  ? t('predictions.twoSum.hmStoreNext.fbWillMissTrue', {
                      nextComp,
                      nextVal,
                      nextI,
                    })
                  : t('predictions.twoSum.hmStoreNext.fbWillMissFalse', {
                      nextComp,
                    }),
              };
            }
            return opt;
          }),
        };
      }

      if (current.action === 'lookup-hit') {
        const [first, second] = nextState.foundPair ?? [0, 1];
        return {
          ...prompt,
          question: t('predictions.twoSum.hmLookupHit.question'),
          options: prompt.options.map((opt) => {
            if (opt.id === 'correct-pair') {
              return {
                ...opt,
                label: t('predictions.twoSum.hmLookupHit.optCorrectPair', {
                  first,
                  second,
                }),
                feedback: t('predictions.twoSum.hmLookupHit.fbCorrectPair', {
                  first,
                  second,
                  valFirst: nums[first],
                  valSecond: nums[second],
                  target,
                }),
              };
            }
            if (opt.id === 'self-pair') {
              return {
                ...opt,
                label: t('predictions.twoSum.hmLookupHit.optSelfPair', {
                  second,
                }),
                feedback: t('predictions.twoSum.hmLookupHit.fbSelfPair', {
                  first,
                  second,
                }),
              };
            }
            if (opt.id === 'values-pair') {
              return {
                ...opt,
                label: t('predictions.twoSum.hmLookupHit.optValuesPair', {
                  valFirst: nums[first],
                  valSecond: nums[second],
                }),
                feedback: t('predictions.twoSum.hmLookupHit.fbValuesPair', {
                  first,
                  second,
                }),
              };
            }
            return opt;
          }),
        };
      }
    }
  }

  if (problemId === 'valid-parentheses' && current.visualState.kind === 'stack') {
    const curState = current.visualState;
    const nextState = next.visualState as StackVisualState;

    if (next.action === 'push') {
      const ch = nextState.currentChar ?? '(';
      return {
        ...prompt,
        question: t('predictions.validParentheses.push.question', {
          index: nextState.currentIndex ?? 0,
          ch,
        }),
        options: prompt.options.map((opt) => {
          if (opt.id === 'push-open') {
            return {
              ...opt,
              label: t('predictions.validParentheses.push.optPush', { ch }),
              feedback: t('predictions.validParentheses.push.fbPush', { ch }),
            };
          }
          if (opt.id === 'pop-stack') {
            return {
              ...opt,
              label: t('predictions.validParentheses.push.optPop'),
              feedback: t('predictions.validParentheses.push.fbPop', { ch }),
            };
          }
          if (opt.id === 'return-false') {
            return {
              ...opt,
              label: t('predictions.validParentheses.push.optFalse'),
              feedback: t('predictions.validParentheses.push.fbFalse', { ch }),
            };
          }
          return opt;
        }),
      };
    }

    if (next.action === 'check-match') {
      const ch = nextState.currentChar ?? ')';
      const top = nextState.comparingWith ?? '(';
      const expected = nextState.expectedBracket ?? ')';
      const willMatch = next.variables.matches === true;
      return {
        ...prompt,
        question: t('predictions.validParentheses.checkMatch.question', {
          ch,
          top,
        }),
        options: prompt.options.map((opt) => {
          if (opt.id === 'yes-match') {
            return {
              ...opt,
              label: t('predictions.validParentheses.checkMatch.optYes', {
                top,
                ch,
              }),
              feedback: willMatch
                ? t('predictions.validParentheses.checkMatch.fbYesTrue', {
                    ch,
                    top,
                  })
                : t('predictions.validParentheses.checkMatch.fbYesFalse', {
                    top,
                    expected,
                    ch,
                  }),
            };
          }
          if (opt.id === 'no-mismatch') {
            return {
              ...opt,
              label: t('predictions.validParentheses.checkMatch.optNo', {
                ch,
                top,
              }),
              feedback: !willMatch
                ? t('predictions.validParentheses.checkMatch.fbNoTrue', {
                    top,
                    expected,
                    ch,
                  })
                : t('predictions.validParentheses.checkMatch.fbNoFalse', {
                    top,
                    ch,
                  }),
            };
          }
          return opt;
        }),
      };
    }

    if (next.action === 'pop') {
      const top = nextState.comparingWith ?? '(';
      const ch = curState.currentChar ?? ')';
      return {
        ...prompt,
        question: t('predictions.validParentheses.pop.question', { top, ch }),
        options: prompt.options.map((opt) => {
          if (opt.id === 'pop-top') {
            return {
              ...opt,
              label: t('predictions.validParentheses.pop.optPop', { top }),
              feedback: t('predictions.validParentheses.pop.fbPop', { top }),
            };
          }
          if (opt.id === 'push-close') {
            return {
              ...opt,
              label: t('predictions.validParentheses.pop.optPush', { ch }),
              feedback: t('predictions.validParentheses.pop.fbPush'),
            };
          }
          if (opt.id === 'clear-all') {
            return {
              ...opt,
              label: t('predictions.validParentheses.pop.optClear'),
              feedback: t('predictions.validParentheses.pop.fbClear'),
            };
          }
          return opt;
        }),
      };
    }

    if (next.action === 'mismatch') {
      const ch = nextState.currentChar ?? ')';
      return {
        ...prompt,
        question: t('predictions.validParentheses.mismatch.question', { ch }),
        options: prompt.options.map((opt) => {
          if (opt.id === 'report-invalid') {
            return {
              ...opt,
              label: t('predictions.validParentheses.mismatch.optInvalid'),
              feedback: t('predictions.validParentheses.mismatch.fbInvalid'),
            };
          }
          if (opt.id === 'ignore-continue') {
            return {
              ...opt,
              label: t('predictions.validParentheses.mismatch.optIgnore'),
              feedback: t('predictions.validParentheses.mismatch.fbIgnore'),
            };
          }
          return opt;
        }),
      };
    }

    if (next.action === 'unclosed') {
      return {
        ...prompt,
        question: t('predictions.validParentheses.unclosed.question', {
          count: nextState.stack.length,
        }),
        options: prompt.options.map((opt) => {
          if (opt.id === 'invalid-unclosed') {
            return {
              ...opt,
              label: t('predictions.validParentheses.unclosed.optInvalid'),
              feedback: t('predictions.validParentheses.unclosed.fbInvalid'),
            };
          }
          if (opt.id === 'valid-anyway') {
            return {
              ...opt,
              label: t('predictions.validParentheses.unclosed.optValid'),
              feedback: t('predictions.validParentheses.unclosed.fbValid'),
            };
          }
          return opt;
        }),
      };
    }

    if (next.action === 'valid') {
      return {
        ...prompt,
        question: t('predictions.validParentheses.valid.question'),
        options: prompt.options.map((opt) => {
          if (opt.id === 'final-valid') {
            return {
              ...opt,
              label: t('predictions.validParentheses.valid.optValid'),
              feedback: t('predictions.validParentheses.valid.fbValid'),
            };
          }
          if (opt.id === 'final-invalid') {
            return {
              ...opt,
              label: t('predictions.validParentheses.valid.optInvalid'),
              feedback: t('predictions.validParentheses.valid.fbInvalid'),
            };
          }
          return opt;
        }),
      };
    }
  }

  if (
    problemId === 'split-array-largest-sum' &&
    current.visualState.kind === 'bs-greedy'
  ) {
    const curState = current.visualState;
    const nextState = next.visualState as BinarySearchGreedyVisualState;
    const { nums, k, low, high } = curState;

    if (next.action === 'bs-select-mid') {
      const expectedMid = nextState.mid ?? low + Math.floor((high - low) / 2);
      return {
        ...prompt,
        question: t('predictions.splitArray.selectMid.question', { low, high }),
        options: prompt.options.map((opt) => {
          if (opt.id === 'correct-mid') {
            return {
              ...opt,
              label: t('predictions.splitArray.selectMid.optCorrect', {
                mid: expectedMid,
              }),
              feedback:
                expectedMid === low
                  ? t('predictions.splitArray.selectMid.fbCorrectLowEq', {
                      low,
                      high,
                      mid: expectedMid,
                    })
                  : t('predictions.splitArray.selectMid.fbCorrectGeneral', {
                      low,
                      high,
                      mid: expectedMid,
                    }),
            };
          }
          if (opt.id === 'low-bound') {
            return {
              ...opt,
              label: t('predictions.splitArray.selectMid.optLow', { low }),
              feedback: t('predictions.splitArray.selectMid.fbLow', {
                mid: expectedMid,
              }),
            };
          }
          if (opt.id === 'high-bound') {
            return {
              ...opt,
              label: t('predictions.splitArray.selectMid.optHigh', { high }),
              feedback: t('predictions.splitArray.selectMid.fbHigh', {
                high,
                mid: expectedMid,
              }),
            };
          }
          if (opt.id === 'out-of-range') {
            return {
              ...opt,
              label: t('predictions.splitArray.selectMid.optOutOfRange', {
                aboveHigh: high + 1,
              }),
              feedback: t('predictions.splitArray.selectMid.fbOutOfRange', {
                low,
                high,
                aboveHigh: high + 1,
              }),
            };
          }
          return opt;
        }),
      };
    }

    if (next.action === 'greedy-start') {
      const mid = curState.mid ?? 0;
      return {
        ...prompt,
        question: t('predictions.splitArray.greedyStart.question', { mid }),
        options: prompt.options.map((opt) => {
          if (opt.id === 'ask-greedy') {
            return {
              ...opt,
              label: t('predictions.splitArray.greedyStart.optAskGreedy', {
                k,
                mid,
              }),
              feedback: t('predictions.splitArray.greedyStart.fbAskGreedy', {
                mid,
              }),
            };
          }
          if (opt.id === 'sort-array') {
            return {
              ...opt,
              label: t('predictions.splitArray.greedyStart.optSort'),
              feedback: t('predictions.splitArray.greedyStart.fbSort'),
            };
          }
          return opt;
        }),
      };
    }

    if (
      next.action === 'greedy-add-to-group' ||
      next.action === 'greedy-new-group'
    ) {
      const nextIdx = nextState.scanIndex ?? 0;
      const val = nums[nextIdx] ?? 0;
      const mid = curState.mid ?? 0;

      if (nextIdx === 0) {
        return {
          ...prompt,
          question: t('predictions.splitArray.greedyFirst.question', {
            val,
            mid,
          }),
          options: prompt.options.map((opt) => {
            if (opt.id === 'start-g1') {
              return {
                ...opt,
                label: t('predictions.splitArray.greedyFirst.optStartG1', {
                  val,
                }),
                feedback: t('predictions.splitArray.greedyFirst.fbStartG1', {
                  mid,
                  val,
                }),
              };
            }
            if (opt.id === 'exceed-immediately') {
              return {
                ...opt,
                label: t('predictions.splitArray.greedyFirst.optReject', {
                  val,
                  mid,
                }),
                feedback: t('predictions.splitArray.greedyFirst.fbReject', {
                  val,
                }),
              };
            }
            return opt;
          }),
        };
      }

      const prevSum = curState.runningSum ?? 0;
      const newSum = prevSum + val;
      const willFit = next.action === 'greedy-add-to-group';
      return {
        ...prompt,
        question: t('predictions.splitArray.greedyStep.question', {
          prevSum,
          idx: nextIdx,
          val,
          mid,
        }),
        options: prompt.options.map((opt) => {
          if (opt.id === 'fits-current') {
            return {
              ...opt,
              label: t('predictions.splitArray.greedyStep.optFits', {
                prevSum,
                val,
                newSum,
                mid,
              }),
              feedback: willFit
                ? t('predictions.splitArray.greedyStep.fbFitsTrue', {
                    newSum,
                    mid,
                    val,
                  })
                : t('predictions.splitArray.greedyStep.fbFitsFalse', {
                    prevSum,
                    val,
                    newSum,
                    mid,
                  }),
            };
          }
          if (opt.id === 'cut-new-group') {
            return {
              ...opt,
              label: t('predictions.splitArray.greedyStep.optCut', {
                prevSum,
                val,
                newSum,
                mid,
              }),
              feedback: !willFit
                ? t('predictions.splitArray.greedyStep.fbCutTrue', {
                    newSum,
                    mid,
                    idx: nextIdx,
                    nextGroup: nextState.groupsUsed,
                    val,
                  })
                : t('predictions.splitArray.greedyStep.fbCutFalse', {
                    prevSum,
                    val,
                    newSum,
                    mid,
                  }),
            };
          }
          return opt;
        }),
      };
    }

    if (next.action === 'greedy-result') {
      const groupsUsed = curState.groupsUsed;
      const mid = curState.mid ?? 0;
      const isFeasible = groupsUsed <= k;
      return {
        ...prompt,
        question: t('predictions.splitArray.greedyResult.question', {
          count: groupsUsed,
          k,
          mid,
        }),
        options: prompt.options.map((opt) => {
          if (opt.id === 'res-feasible') {
            return {
              ...opt,
              label: t('predictions.splitArray.greedyResult.optFeasible', {
                groups: groupsUsed,
                k,
              }),
              feedback: isFeasible
                ? t('predictions.splitArray.greedyResult.fbFeasibleTrue', {
                    groups: groupsUsed,
                    k,
                    mid,
                  })
                : t('predictions.splitArray.greedyResult.fbFeasibleFalse', {
                    groups: groupsUsed,
                    k,
                    mid,
                  }),
            };
          }
          if (opt.id === 'res-infeasible') {
            return {
              ...opt,
              label: t('predictions.splitArray.greedyResult.optInfeasible', {
                groups: groupsUsed,
                k,
              }),
              feedback: !isFeasible
                ? t('predictions.splitArray.greedyResult.fbInfeasibleTrue', {
                    groups: groupsUsed,
                    k,
                    mid,
                  })
                : t('predictions.splitArray.greedyResult.fbInfeasibleFalse', {
                    groups: groupsUsed,
                    k,
                    mid,
                  }),
            };
          }
          return opt;
        }),
      };
    }

    if (next.action === 'bs-update-bounds') {
      const mid = curState.mid ?? 0;
      const feasible = curState.feasible === true;
      return {
        ...prompt,
        question: feasible
          ? t('predictions.splitArray.bsUpdate.questionFeasible', {
              mid,
              low,
              high,
            })
          : t('predictions.splitArray.bsUpdate.questionInfeasible', {
              mid,
              low,
              high,
            }),
        options: prompt.options.map((opt) => {
          if (opt.id === 'set-high-mid') {
            return {
              ...opt,
              label: t('predictions.splitArray.bsUpdate.optSetHigh', {
                low,
                mid,
              }),
              feedback: feasible
                ? t('predictions.splitArray.bsUpdate.fbSetHighTrue', {
                    low,
                    mid,
                  })
                : t('predictions.splitArray.bsUpdate.fbSetHighFalse', { mid }),
            };
          }
          if (opt.id === 'set-low-mid-plus-1') {
            return {
              ...opt,
              label: t('predictions.splitArray.bsUpdate.optSetLow', {
                nextLow: mid + 1,
                high,
              }),
              feedback: !feasible
                ? t('predictions.splitArray.bsUpdate.fbSetLowTrue', {
                    mid,
                    nextLow: mid + 1,
                  })
                : t('predictions.splitArray.bsUpdate.fbSetLowFalse', {
                    mid,
                    nextLow: mid + 1,
                  }),
            };
          }
          return opt;
        }),
      };
    }

    if (next.action === 'bs-converged') {
      return {
        ...prompt,
        question: t('predictions.splitArray.bsConverged.question', { low }),
        options: prompt.options.map((opt) => {
          if (opt.id === 'ans-low') {
            return {
              ...opt,
              label: t('predictions.splitArray.bsConverged.optLow', { low }),
              feedback: t('predictions.splitArray.bsConverged.fbLow', {
                low,
                prevVal: low - 1,
              }),
            };
          }
          if (opt.id === 'ans-plus-one') {
            return {
              ...opt,
              label: t('predictions.splitArray.bsConverged.optPlusOne', {
                nextVal: low + 1,
              }),
              feedback: t('predictions.splitArray.bsConverged.fbPlusOne', {
                low,
              }),
            };
          }
          return opt;
        }),
      };
    }
  }

  return prompt;
}
