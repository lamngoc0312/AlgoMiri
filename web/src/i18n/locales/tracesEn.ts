export const tracesEn = {
  traces: {
    highlights: {
      anchorI: 'Anchor i',
      partnerJ: 'Partner j',
      currentI: 'Current i',
      inMap: 'In Map',
      stored: 'Stored',
      matchLabel: 'Match ({{label}})',
      scan: 'Scan',
      cutGroup: 'Cut G{{group}}',
    },
    twoSum: {
      notEnoughTitle: 'Not enough elements',
      emptyBruteForce:
        'The array is empty, so there are no pairs to check. Return not found.',
      emptyHashMap:
        'The array is empty, so no pair can be formed. Return not found.',
      singleElement:
        'The array has only 1 element. Two Sum requires two distinct indices, so no valid pair can exist.',
      selectAnchorTitle: 'Select anchor i = {{i}}',
      selectAnchorExplanation:
        'Anchor i at index {{i}} (value {{val}}). Next, scan partner indices j starting at {{nextJ}} so we never pair an element with itself.',
      comparePairTitle: 'Check pair ({{i}}, {{j}}): {{valI}} + {{valJ}} = {{sum}}',
      comparePairMatch:
        'Test partner j = {{j}} (value {{valJ}}). Adding {{valI}} + {{valJ}} gives {{sum}}, which matches target {{target}}!',
      comparePairMismatch:
        'Test partner j = {{j}} (value {{valJ}}). Adding {{valI}} + {{valJ}} gives {{sum}}, which is not {{target}}. Continue scanning.',
      foundTitle: 'Match found: [{{first}}, {{second}}]',
      foundBruteForce:
        'Confirmed distinct indices [{{first}}, {{second}}] because nums[{{first}}] ({{valFirst}}) + nums[{{second}}] ({{valSecond}}) = {{target}}. Return [{{first}}, {{second}}] and stop early.',
      foundHashMap:
        'Distinct indices [{{first}}, {{second}}] sum to {{target}} ({{valFirst}} + {{valSecond}} = {{target}}). Return [{{first}}, {{second}}] in a single pass.',
      lookupHitTitle: 'Inspect i = {{i}}: complement {{complement}} found!',
      lookupHitExplanation:
        'At index {{i}}, nums[{{i}}] is {{current}}. We need complement {{target}} - {{current}} = {{complement}}. Checking the Seen Map BEFORE inserting {{current}} finds {{complement}} at earlier index {{compIdx}}.',
      lookupMissTitle: 'Inspect i = {{i}}: need complement {{complement}}',
      lookupMissExplanation:
        'At index {{i}}, nums[{{i}}] is {{current}}. To reach target {{target}}, we need {{target}} - {{current}} = {{complement}}. Checking the Seen Map first shows {{complement}} is not stored yet.',
      storeValueTitle: 'Store {{current}} → index {{i}}',
      storeValueExplanation:
        'Because {{complement}} was not found, store {{current}} → index {{i}} in the Seen Map so future elements can look it up in O(1) time.',
      noPairTitle: 'No valid pair found',
      noPairBruteForce:
        'Checked all distinct pairs (i < j) in the array and none summed to {{target}}. Return not found.',
      noPairHashMap:
        'Finished scanning all {{count}} elements and never found a matching complement for target {{target}}. Return not found.',
    },
    validParentheses: {
      emptyValidTitle: 'Empty string is balanced (Valid)',
      emptyValidExplanation:
        'An empty string has no unmatched opening or closing brackets, and the stack is empty — so it is valid (true).',
      pushTitle: 'Index {{i}}: Push "{{ch}}" onto stack',
      pushExplanation:
        '"{{ch}}" is an opening bracket. Push it onto the TOP of the stack so we remember we still need a matching "{{expected}}" later.',
      emptyStackMismatchTitle:
        'Index {{i}}: "{{ch}}" has no matching opener (Invalid)',
      emptyStackMismatchExplanation:
        '"{{ch}}" is a closing bracket that needs "{{expected}}", but the stack is empty! There is no opening bracket to match it, so return false immediately.',
      checkMatchTitle: 'Index {{i}}: Compare "{{ch}}" with TOP "{{top}}"',
      checkMatchHit:
        '"{{ch}}" matches the most recent opening bracket "{{top}}" on TOP of the stack! Next, pop "{{top}}".',
      checkMatchMiss:
        '"{{ch}}" does NOT match TOP "{{top}}" (which expected "{{expected}}"). Nesting order is broken!',
      mismatchTitle: 'Mismatch: expected "{{expected}}", got "{{ch}}"',
      mismatchExplanation:
        'Because "{{top}}" was opened most recently, it must be closed by "{{expected}}" before "{{ch}}". Stop early and return false.',
      popTitle: 'Pop "{{top}}" (matched "{{ch}}")',
      popExplanation:
        'Popped "{{top}}" from the stack because "{{ch}}" cleanly closed it. Remaining stack size: {{size}}.',
      unclosedTitle_one: 'End of string: {{count}} unclosed bracket left',
      unclosedTitle_other: 'End of string: {{count}} unclosed brackets left',
      unclosedExplanation_one:
        'We finished scanning every character, but {{count}} opening bracket remains on the stack without a closing match. Return false.',
      unclosedExplanation_other:
        'We finished scanning every character, but {{count}} opening brackets remain on the stack without a closing match. Return false.',
      validTitle: 'Stack is empty: Valid brackets (true)',
      validExplanation:
        'Every closing bracket matched the most recent opening bracket, and the stack is completely empty at the end. Return true!',
    },
    splitArray: {
      initBoundsTitle: 'Initialize answer bounds [{{low}}, {{high}}]',
      initBoundsExplanation:
        'Every nonempty subarray must hold at least the largest single element (low = max(nums) = {{low}}), and no subarray sum can exceed the entire array total (high = sum(nums) = {{high}}).',
      selectMidTitle:
        'BS Iter #{{iter}}: Test candidate largest sum mid = {{mid}}',
      selectMidExplanation:
        'Binary Search picks midpoint mid = {{low}} + floor(({{high}} - {{low}}) / 2) = {{mid}}, and asks the Greedy checker: "Can we split nums into at most {{k}} groups with every group sum <= {{mid}}?"',
      greedyStartTitle:
        'Greedy Check #{{iter}}: Pack subarrays with sum <= {{mid}}',
      greedyStartExplanation:
        'Start Greedy scan for candidate mid = {{mid}}. Because all numbers are nonnegative, packing as many elements as possible into each group minimizes the total number of groups needed.',
      greedyFirstTitle:
        'Scan idx 0 ({{val}}): Start Group 1 (sum = {{sum}} <= {{mid}})',
      greedyFirstExplanation:
        'Place first element nums[0] = {{val}} into Group 1. Since mid >= max(nums), {{val}} <= {{mid}} always holds.',
      greedyAddTitle:
        'Scan idx {{idx}} ({{val}}): Add to Group {{group}} ({{prevSum}} + {{val}} = {{sum}} <= {{mid}})',
      greedyAddExplanation:
        "Adding {{val}} keeps Group {{group}}'s sum at {{sum}} <= {{mid}}, so greedily keep {{val}} in Group {{group}}.",
      greedyNewGroupTitle:
        'Scan idx {{idx}} ({{val}}): {{wouldBe}} > {{mid}} → Start Group {{group}}',
      greedyNewGroupExplanation:
        "Adding {{val}} would raise the previous group's sum to {{wouldBe}} > {{mid}}. Cut here and open Group {{group}} starting with {{val}}.",
      greedyResultFeasibleTitle:
        'Greedy Result: {{groups}} <= {{k}} groups → mid = {{mid}} is FEASIBLE',
      greedyResultInfeasibleTitle:
        'Greedy Result: {{groups}} > {{k}} groups → mid = {{mid}} is TOO SMALL',
      greedyResultFeasibleExplanation_one:
        'Greedy needed {{count}} group (<= k = {{k}}) with every group sum <= {{mid}}. Since 1 <= k <= n and values are nonnegative, {{count}} group can always be split into exactly {{k}} nonempty groups without raising the largest sum!',
      greedyResultFeasibleExplanation_other:
        'Greedy needed {{count}} groups (<= k = {{k}}) with every group sum <= {{mid}}. Since 1 <= k <= n and values are nonnegative, {{count}} groups can always be split into exactly {{k}} nonempty groups without raising the largest sum!',
      greedyResultInfeasibleExplanation:
        'Even packing greedily required {{groups}} groups (> k = {{k}}). Therefore no valid {{k}}-way split can achieve largest sum <= {{mid}}.',
      decisionFeasible: 'Feasible → high = {{mid}}',
      decisionInfeasible: 'Infeasible → low = {{nextLow}}',
      decisionConverged: 'Converged: answer = {{low}}',
      updateBoundsTitle: 'BS Update: {{decision}} (new bounds [{{low}}, {{high}}])',
      updateBoundsFeasibleExplanation:
        'Because mid = {{mid}} is feasible, keep {{mid}} as a valid candidate and search [{{low}}, {{high}}] to see if an even smaller largest sum works.',
      updateBoundsInfeasibleExplanation:
        'Because mid = {{mid}} failed, every limit <= {{mid}} will also fail by monotonicity. Raise low to {{mid}} + 1 = {{low}} and search [{{low}}, {{high}}].',
      convergedTitle: 'Converged at low = high = {{low}} (Optimal Answer)',
      convergedExplanation_one:
        'Search bounds converged to low = high = {{low}}. Displayed above is a verified partition into exactly {{count}} nonempty subarray whose largest subarray sum is {{low}}.',
      convergedExplanation_other:
        'Search bounds converged to low = high = {{low}}. Displayed above is a verified partition into exactly {{count}} nonempty subarrays whose largest subarray sum is {{low}}.',
    },
  },
  predictions: {
    twoSum: {
      bfSelectAnchor: {
        question:
          'Anchor i is at index {{i}} (value {{valI}}). Which index will partner j inspect next?',
        optNextJ: 'Index {{nextJ}} (value {{valNextJ}})',
        fbNextJ:
          'Correct! Partner j starts at i + 1 = {{nextJ}} so we check distinct pairs without reusing index {{i}}.',
        optSameI: 'Index {{i}} (same as anchor i)',
        fbSameI:
          'Not quite — pairing index {{i}} with itself is forbidden because both indices must be distinct.',
        optJumpEnd: 'Index {{lastIdx}} (jump to the end)',
        optRestartZero: 'Index 0 (restart from the beginning)',
        fbJumpEnd:
          'Brute Force scans sequentially from i + 1 ({{nextJ}}) rather than jumping to the end.',
        fbRestartZero:
          'Pairs with index 0 were already checked when i = 0, so we start at i + 1 ({{nextJ}}).',
      },
      bfFound: {
        question:
          'We just computed nums[{{i}}] + nums[{{j}}] = {{valI}} + {{valJ}} = {{sum}} (target is {{target}}). What happens next?',
        optConfirm: 'Confirm match and return [{{i}}, {{j}}]',
        fbConfirm:
          'Yes! {{sum}} equals target {{target}} with distinct indices {{i}} and {{j}}, so we stop early and return [{{i}}, {{j}}].',
        optAdvance: 'Ignore this pair and keep scanning j',
        fbAdvance:
          'Since {{valI}} + {{valJ}} already equals {{target}}, there is no reason to keep scanning.',
        optNotFound: 'Report that no solution exists',
        fbNotFound:
          'Look at the sum: {{valI}} + {{valJ}} = {{sum}}, which matches target {{target}}!',
      },
      bfMoveJ: {
        question: '{{valI}} + {{valJ}} = {{sum}} ≠ {{target}}. What pointer moves next?',
        optMoveJ: 'Keep i = {{i}} and advance j to {{nextJ}} (value {{valNextJ}})',
        fbMoveJ:
          'Correct! Because j has not reached the end of the array, we keep anchor i = {{i}} and test j = {{nextJ}} next.',
        optMoveI: 'Advance anchor i to {{nextI}} immediately',
        fbMoveI:
          'Not yet — we still have untested partners after j = {{j}} for anchor i = {{i}}.',
        optStop: 'Stop and return not found',
        fbStop:
          "We haven't checked all pairs yet! More partner indices remain after j = {{j}}.",
      },
      bfMoveI: {
        question:
          '{{valI}} + {{valJ}} = {{sum}} ≠ {{target}}, and j reached the end of the array. What happens next?',
        optNextAnchor: 'Advance anchor i to {{nextI}} (value {{valNextI}})',
        fbNextAnchor:
          'Exactly! All pairs with i = {{i}} have been checked, so the outer loop advances i to {{nextI}}.',
        optResetJ: 'Keep i = {{i}} and loop j back to 0',
        fbResetJ:
          'Looping j back to 0 would revisit already-tested pairs and pair i with itself.',
        optStop: 'Stop immediately and return not found',
        fbStop:
          'There are still more anchor indices to try starting at i = {{nextI}}.',
      },
      bfNotFound: {
        question:
          '{{valI}} + {{valJ}} = {{sum}} ≠ {{target}}, and this was the final distinct pair. What happens next?',
        optReport: 'Finish and report no valid pair found',
        fbReport:
          'Correct! Every distinct pair (i < j) has been tested without matching {{target}}, so the algorithm returns not found.',
        optSame: 'Check pairs where i = j',
        fbSame:
          'Two Sum forbids using the same index twice, so we never test i = j.',
        optFallback: 'Return [0, 1] as a fallback',
        fbFallback:
          'Never return an invalid pair — when no pair sums to {{target}}, the honest answer is not found.',
      },
      hmLookupMiss: {
        question:
          'Complement {{complement}} was NOT in the Seen Map. What does the algorithm do next?',
        optStoreCurrent: 'Store {{val}} → index {{i}} in the Seen Map',
        fbStoreCurrent:
          'Right! Storing {{val}} → index {{i}} lets a later element find {{val}} in O(1) time if it needs it as a complement.',
        optStoreComp: 'Store complement {{complement}} → index {{i}} in the Seen Map',
        fbStoreComp:
          'Careful: index {{i}} holds value {{val}}, not {{complement}}. We store what we actually saw ({{val}} → {{i}}).',
        optSkipStore: 'Leave the Seen Map unchanged and move on',
        fbSkipStore:
          "If we don't store {{val}} → {{i}}, future elements won't know that {{val}} appeared at index {{i}}!",
      },
      hmStoreEnd: {
        question: 'We stored the last element in the array. What happens next?',
        optNotFound: 'End the pass and report no valid pair found',
        fbNotFound:
          'Correct! Every index has been inspected and no complement matched target {{target}}.',
        optRestart: 'Scan the array a second time from index 0',
        fbRestart:
          'The Hash Map strategy only needs a single pass — if a valid pair existed, the second element of the pair would have found the first.',
        optSelf: 'Match the last element with itself',
        fbSelf:
          'Distinct indices are required, so an element can never match itself.',
      },
      hmStoreNext: {
        question:
          'Next we advance to i = {{nextI}} (nums[{{nextI}}] = {{nextVal}}), so we need complement {{target}} - {{nextVal}} = {{nextComp}}. Will the Seen Map find {{nextComp}}?',
        optWillHit: 'Yes — {{nextComp}} is already in the Seen Map!',
        fbWillHitTrue:
          'Spot on! {{nextComp}} was stored from an earlier index, so lookup succeeds in O(1) time.',
        fbWillHitFalse:
          'Check the Seen Map panel above: {{nextComp}} has not been stored yet, so this lookup will be a miss.',
        optWillMiss: 'No — {{nextComp}} is not in the Seen Map yet.',
        fbWillMissTrue:
          "Correct! {{nextComp}} isn't in the Seen Map yet, so we will record {{nextVal}} → {{nextI}} after the check.",
        fbWillMissFalse:
          'Look closely at the Seen Map panel above — {{nextComp}} IS already stored there!',
      },
      hmLookupHit: {
        question:
          'Complement lookup succeeded! Which pair of distinct indices will be returned next?',
        optCorrectPair: '[{{first}}, {{second}}]',
        fbCorrectPair:
          'Yes! nums[{{first}}] ({{valFirst}}) + nums[{{second}}] ({{valSecond}}) = {{target}}.',
        optSelfPair: '[{{second}}, {{second}}]',
        fbSelfPair:
          'Both indices must be distinct — the matched complement came from earlier index {{first}}, not {{second}}.',
        optValuesPair: '[{{valFirst}}, {{valSecond}}] (the values instead of indices)',
        fbValuesPair:
          'Two Sum asks for the indices [{{first}}, {{second}}], not the element values.',
      },
    },
    validParentheses: {
      push: {
        question:
          'Next character at index {{index}} is "{{ch}}". What should the stack do?',
        optPush: 'Push "{{ch}}" onto the TOP of the stack',
        fbPush:
          'Correct! "{{ch}}" is an opening bracket, so we push it onto TOP to wait for its matching closer.',
        optPop: 'Pop the TOP item from the stack',
        fbPop:
          'We only pop when a matching closing bracket arrives. "{{ch}}" opens a new pair.',
        optFalse: 'Stop immediately and return Invalid (false)',
        fbFalse:
          'An opening bracket "{{ch}}" never causes an immediate mismatch — push it and keep scanning.',
      },
      checkMatch: {
        question:
          'Next character is closing bracket "{{ch}}", and TOP of the stack is "{{top}}". Will they match?',
        optYes: 'Yes — "{{top}}" and "{{ch}}" form a valid pair',
        fbYesTrue:
          'Spot on! "{{ch}}" cleanly closes the most recent opener "{{top}}".',
        fbYesFalse:
          'Not quite — "{{top}}" expects "{{expected}}", not "{{ch}}".',
        optNo: 'No — "{{ch}}" mismatches TOP "{{top}}"',
        fbNoTrue:
          'Correct! "{{top}}" must be closed by "{{expected}}" before "{{ch}}".',
        fbNoFalse:
          'Look closely: "{{top}}" and "{{ch}}" are matching brackets!',
      },
      pop: {
        question:
          'TOP "{{top}}" matched "{{ch}}". What happens to the stack next?',
        optPop: 'Pop "{{top}}" off the TOP of the stack',
        fbPop:
          'Yes! Popping "{{top}}" resolves that pair and exposes the next outer bracket beneath it.',
        optPush: 'Push "{{ch}}" onto the stack',
        fbPush:
          'Closing brackets are never pushed — they cancel out the matching opener on TOP.',
        optClear: 'Clear the entire stack immediately',
        fbClear:
          'Only the single matched TOP bracket is popped; outer brackets below it still need their own closers.',
      },
      mismatch: {
        question: 'What is the next outcome after checking "{{ch}}"?',
        optInvalid: 'Detect mismatch and return Invalid (false)',
        fbInvalid:
          'Correct! Once a closing bracket fails to match TOP (or the stack is empty), the string cannot be valid.',
        optIgnore: 'Ignore the mismatch and keep scanning',
        fbIgnore:
          'Every closing bracket must match immediately in LIFO order — a mismatch invalidates the entire string.',
      },
      unclosed: {
        question_one:
          'We reached the end of the string, and {{count}} bracket is still on the stack. Is the string valid?',
        question_other:
          'We reached the end of the string, and {{count}} brackets are still on the stack. Is the string valid?',
        optInvalid: 'No — unclosed brackets remain, so return Invalid (false)',
        fbInvalid:
          'Exactly! A valid string must leave the stack completely empty when scanning finishes.',
        optValid: 'Yes — no mismatches occurred while scanning',
        fbValid:
          'Careful! Unclosed opening brackets like "((" never trigger a mismatch, so checking stack.length === 0 at the end is essential.',
      },
      valid: {
        question:
          'We reached the end of the string and the stack is empty. What is the final result?',
        optValid: 'Return Valid (true)',
        fbValid:
          'Yes! Every opener was closed in proper LIFO order and nothing was left unclosed on the stack.',
        optInvalid: 'Return Invalid (false)',
        fbInvalid:
          'With zero mismatches and an empty stack at the end, the bracket string is completely balanced (true).',
      },
    },
    splitArray: {
      selectMid: {
        question:
          'Current search bounds are [{{low}}, {{high}}]. Which candidate largest sum mid will Binary Search test next?',
        optCorrect: 'mid = {{mid}}',
        fbCorrectLowEq:
          'Correct! For [{{low}}, {{high}}], floor midpoint is {{low}} + floor(({{high}} - {{low}}) / 2) = {{mid}}.',
        fbCorrectGeneral:
          'Correct! mid = {{low}} + floor(({{high}} - {{low}}) / 2) = {{mid}}.',
        optLow: 'mid = {{low}} (just test low directly)',
        fbLow:
          'Testing low linearly only eliminates 1 value on failure; testing midpoint {{mid}} cuts the search range in half!',
        optHigh: 'mid = {{high}} (test high)',
        fbHigh:
          'When low < high, floor midpoint low + floor((high - low) / 2) is strictly less than {{high}} (here {{mid}}), ensuring the loop always makes progress.',
        optOutOfRange: 'mid = {{aboveHigh}} (above high)',
        fbOutOfRange:
          'Binary Search only tests candidates inside [{{low}}, {{high}}]; {{aboveHigh}} is outside the active search bounds.',
      },
      greedyStart: {
        question:
          'Binary Search picked mid = {{mid}}. What question will the nested Greedy subroutine answer?',
        optAskGreedy:
          'Can we pack nums into at most {{k}} contiguous groups with each sum <= {{mid}}?',
        fbAskGreedy:
          'Yes! Binary Search delegates feasibility checking for mid = {{mid}} to the O(n) Greedy packer.',
        optSort: 'Sort nums first so equal numbers sit together',
        fbSort:
          'Subarrays must remain contiguous in the original order, so we can never sort or reorder nums!',
      },
      greedyFirst: {
        question:
          'Greedy scan starts at index 0 (value {{val}}) with limit mid = {{mid}}. What happens first?',
        optStartG1: 'Place {{val}} into Group 1 (running sum = {{val}})',
        fbStartG1:
          'Correct! Because mid = {{mid}} >= max(nums), the first element {{val}} always fits into Group 1.',
        optReject: 'Reject immediately because {{val}} > {{mid}}',
        fbReject:
          'Since low starts at max(nums), mid is always >= every single element, including {{val}}.',
      },
      greedyStep: {
        question:
          'Current group sum is {{prevSum}} and next element is nums[{{idx}}] = {{val}} (limit mid = {{mid}}). Does {{val}} fit in the current group?',
        optFits:
          'Yes — {{prevSum}} + {{val}} = {{newSum}} <= {{mid}}, keep in current group',
        fbFitsTrue:
          'Spot on! {{newSum}} <= {{mid}}, so Greedy packs {{val}} into the current group to save group cuts for later.',
        fbFitsFalse:
          'Check the sum: {{prevSum}} + {{val}} = {{newSum}}, which exceeds mid = {{mid}}!',
        optCut:
          'No — {{prevSum}} + {{val}} = {{newSum}} > {{mid}}, start a new group',
        fbCutTrue:
          'Correct! {{newSum}} > {{mid}}, so we must cut before index {{idx}} and start Group {{nextGroup}} with {{val}}.',
        fbCutFalse:
          'Actually {{prevSum}} + {{val}} = {{newSum}} <= {{mid}}, so Greedy does not need to open a new group yet.',
      },
      greedyResult: {
        question_one:
          'Greedy finished scanning with {{count}} group, and we are allowed k = {{k}} groups. Is mid = {{mid}} feasible?',
        question_other:
          'Greedy finished scanning with {{count}} groups, and we are allowed k = {{k}} groups. Is mid = {{mid}} feasible?',
        optFeasible: 'Feasible (true) — {{groups}} <= {{k}}',
        fbFeasibleTrue:
          'Yes! Using {{groups}} <= {{k}} groups proves a valid {{k}}-group split with largest sum <= {{mid}} exists.',
        fbFeasibleFalse:
          'We used {{groups}} groups, which is more than k = {{k}}, so mid = {{mid}} is too small.',
        optInfeasible: 'Infeasible (false) — {{groups}} > {{k}}',
        fbInfeasibleTrue:
          'Correct! Even greedy packing needed {{groups}} > {{k}} groups, so mid = {{mid}} is impossible.',
        fbInfeasibleFalse:
          'Look at the counts: {{groups}} <= {{k}}, so mid = {{mid}} is feasible!',
      },
      bsUpdate: {
        questionFeasible:
          'Greedy reported mid = {{mid}} is feasible on [{{low}}, {{high}}]. How should Binary Search update its bounds?',
        questionInfeasible:
          'Greedy reported mid = {{mid}} is infeasible on [{{low}}, {{high}}]. How should Binary Search update its bounds?',
        optSetHigh: 'Set high = {{mid}} (search [{{low}}, {{mid}}])',
        fbSetHighTrue:
          'Exactly! {{mid}} works, so keep {{mid}} as a candidate and check if an even smaller answer in [{{low}}, {{mid}}] also works.',
        fbSetHighFalse:
          'Because {{mid}} failed, every limit <= {{mid}} also fails — setting high = {{mid}} would throw away all valid answers!',
        optSetLow: 'Set low = {{nextLow}} (search [{{nextLow}}, {{high}}])',
        fbSetLowTrue:
          'Correct! Since {{mid}} is too small, the minimum feasible largest sum must be at least {{nextLow}}.',
        fbSetLowFalse:
          'Careful! {{mid}} might already be the optimal answer, so raising low to {{nextLow}} could skip the true answer!',
      },
      bsConverged: {
        question:
          'Bounds have met at low = high = {{low}}. What is the minimized largest subarray sum?',
        optLow: 'Return {{low}}',
        fbLow:
          'Yes! When low === high === {{low}}, {{low}} is proven feasible and {{prevVal}} (if > max) is proven infeasible.',
        optPlusOne: 'Return {{nextVal}}',
        fbPlusOne:
          'Because high always holds a known feasible bound (or sum(nums)), low === high === {{low}} is already guaranteed feasible!',
      },
    },
  },
} as const;
