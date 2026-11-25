export const lessonsEn = {
  lessons: {
    'two-sum': {
      suggestedNextActivity:
        'Switch to Free Exploration and test tricky edge cases like [3, 3] (target 6), [-3, 4, 3, 90] (target 0), or [1, 2, 3] (target 100) with Predict Mode enabled — then try implementing Two Sum in your own editor without peeking!',
      stages: {
        understand: {
          shortTitle: 'Understand',
          title: 'Stage 1: Understand the Problem',
          goal: 'Clarify inputs, outputs, and the distinct-index rule before choosing any algorithm.',
          conceptLearned: 'Problem Decomposition & Distinct-Index Constraint',
          narrative:
            'Before thinking about loops or data structures, check what a valid answer looks like. We receive an array of integers (positive, zero, or negative) and a target integer, and must return two DIFFERENT indices whose values add up to target.',
          question: {
            prompt:
              'Suppose nums = [3, 2, 4] and target = 6. Is [0, 0] a valid answer because nums[0] + nums[0] = 3 + 3 = 6?',
            options: {
              'yes-same-index': {
                label: 'Yes — index 0 adds to 6 with itself.',
                feedback:
                  'Careful! The problem forbids using the same element twice. Both indices must be distinct (i != j). Look at indices 1 and 2 instead: 2 + 4 = 6.',
              },
              'no-distinct-required': {
                label:
                  'No — the two indices must be distinct, so the answer is [1, 2].',
                feedback:
                  'Exactly right! Even though 3 + 3 = 6, index 0 cannot pair with itself. Indices 1 (value 2) and 2 (value 4) are distinct and sum to 6.',
              },
              'no-solution': {
                label: 'No valid answer exists in [3, 2, 4].',
                feedback:
                  'Check the other pairs! nums[1] (2) + nums[2] (4) = 6 uses two distinct indices.',
              },
            },
          },
          hints: {
            1: {
              label: 'Hint 1 · Conceptual Question',
              text: 'Read the rule about indices carefully: if an element appears once at index 0, can you pick index 0 twice?',
            },
            2: {
              label: 'Hint 2 · Reasoning Guidance',
              text: 'A valid answer is a pair of two DIFFERENT positions (i != j). Duplicate values are allowed only when they sit at two separate indices.',
            },
            3: {
              label: 'Hint 3 · Explicit Next Idea',
              text: 'In [3, 2, 4] with target 6, index 0 cannot pair with itself. Instead, check indices 1 and 2: nums[1] (2) + nums[2] (4) = 6.',
            },
          },
        },
        'discover-brute-force': {
          shortTitle: 'Brute Force',
          title: 'Stage 2: Discover Pair Enumeration',
          goal: 'Build a reliable first strategy that checks every distinct pair systematically.',
          conceptLearned: 'Systematic Pair Enumeration (j > i)',
          narrative:
            'A great first step is always finding a simple, guaranteed-correct strategy. If we fix one anchor index i, which partner indices j should we test so we check every pair once and never pair an element with itself?',
          question: {
            prompt:
              'For a fixed anchor index i, where should the inner pointer j start?',
            options: {
              'start-zero': {
                label: 'Start j at 0 so we check every index.',
                feedback:
                  'Starting at 0 would check j = i (reusing the same element!) and re-check pairs we already tested earlier.',
              },
              'start-i': {
                label: 'Start j at i to include the anchor element.',
                feedback:
                  'If j starts at i, the first check pairs nums[i] with itself, violating the distinct-index rule.',
              },
              'start-i-plus-1': {
                label: 'Start j at i + 1 and scan to the end of the array.',
                feedback:
                  'Spot on! Starting j at i + 1 guarantees i != j and checks each unordered pair exactly once. Step through the Brute Force trace on the canvas to watch it in action!',
              },
            },
          },
          hints: {
            1: {
              label: 'Hint 1 · Conceptual Question',
              text: 'If you have already tested all pairs involving index 0, do you ever need to test index 0 again when i moves to 1?',
            },
            2: {
              label: 'Hint 2 · Reasoning Guidance',
              text: 'We need two things from our inner pointer j: never equal i, and never repeat an earlier pair like (1, 0) after checking (0, 1).',
            },
            3: {
              label: 'Hint 3 · Explicit Next Idea',
              text: 'Start j at i + 1 and scan rightward to the end. That guarantees i < j, which automatically prevents self-matches and duplicate pair checks.',
            },
          },
        },
        'discover-optimization': {
          shortTitle: 'Optimize',
          title: 'Stage 3: Discover Complement Lookup',
          goal: 'Spot the repeated work in Brute Force and replace the inner scan with an O(1) Hash Map lookup.',
          conceptLearned: 'Complement Reformulation & Lookup-Before-Insert',
          narrative:
            'Brute Force works, but for every element i it re-scans the rest of the array — O(n²) work. Instead of asking "does any later number add up with nums[i]?", flip the question: if you are looking at nums[i], you already know the exact single number you need!',
          question: {
            prompt:
              'When inspecting nums[i], why must the Hash Map strategy check if (target - nums[i]) is in the Seen Map BEFORE storing nums[i]?',
            options: {
              'avoid-self-match': {
                label:
                  'So the current element never accidentally matches with itself when target = 2 * nums[i].',
                feedback:
                  'Exactly! Checking first guarantees any match in the Seen Map comes from a strictly earlier index. Now explore the Hash Map trace on the canvas and try predicting the next step!',
              },
              'save-memory': {
                label: 'To reduce space complexity from O(n) to O(1).',
                feedback:
                  'The Hash Map still uses O(n) space in the worst case. The order of lookup vs. insert is about correctness (distinct indices), not memory.',
              },
              'order-does-not-matter': {
                label:
                  'The order does not matter — inserting first gives the same result.',
                feedback:
                  'Try nums = [3, 2, 4], target = 6 in your head: if you inserted 3 → 0 before looking up 6 - 3 = 3, you would falsely match index 0 with itself!',
              },
            },
          },
          hints: {
            1: {
              label: 'Hint 1 · Conceptual Question',
              text: 'Imagine nums = [3, 2, 4] and target = 6. What happens at i = 0 if you put 3 into the Seen Map before checking whether 6 - 3 is in the map?',
            },
            2: {
              label: 'Hint 2 · Reasoning Guidance',
              text: 'The Seen Map should represent ONLY elements strictly to the left of index i when you perform the complement lookup.',
            },
            3: {
              label: 'Hint 3 · Explicit Next Idea',
              text: 'Always check seen.has(target - nums[i]) BEFORE calling seen.set(nums[i], i). That guarantees any found index is strictly less than i.',
            },
          },
        },
        'build-solution': {
          shortTitle: 'Build Code',
          title: 'Stage 4: Build the Solution',
          goal: 'Translate your visual reasoning into structured pseudocode one idea at a time — only revealing what you need.',
          conceptLearned: 'Translating Visual Reasoning to Pseudocode',
          narrative:
            'Now that you have traced both strategies visually, turn the Hash Map reasoning into step-by-step pseudocode. Reveal each block only after thinking through what comes next, then implement it in your preferred language.',
          question: {
            prompt:
              'Before revealing the pseudocode: what should each entry in the Seen Map store as its key and value?',
            options: {
              'key-index-val-number': {
                label: 'Key = index, Value = number',
                feedback:
                  'Think about what we search for: we know the needed complement VALUE and want to retrieve its INDEX in O(1) time.',
              },
              'key-number-val-index': {
                label: 'Key = number (value), Value = index',
                feedback:
                  'Correct! Keying by the number lets us ask "have we seen complement?" in O(1) time and immediately get back its stored index.',
              },
              'key-sum-val-bool': {
                label: 'Key = pair sum, Value = true/false',
                feedback:
                  'Storing sums would require enumerating all pairs again. Storing each seen number → its index lets us solve Two Sum in one pass.',
              },
            },
          },
          hints: {
            1: {
              label: 'Hint 1 · Conceptual Question',
              text: 'When you compute complement = target - nums[i], what piece of information do you already know, and what do you want the map to return?',
            },
            2: {
              label: 'Hint 2 · Reasoning Guidance',
              text: 'A hash map gives O(1) lookup by KEY. Since we look up the complement number and need its array position, the key must be the number itself.',
            },
            3: {
              label: 'Hint 3 · Explicit Next Idea',
              text: 'Store value → index in the map. Then for each i: compute complement, check if complement is in seen, return [seen[complement], i] if found, otherwise store seen[nums[i]] = i.',
            },
          },
        },
      },
      pseudocode: {
        'pseudo-1': {
          title: '1. Initialize memory',
          reason:
            'Create an empty map to remember every visited value and its index.',
        },
        'pseudo-2': {
          title: '2. Loop and compute complement',
          reason:
            'Walk through the array once and calculate the exact missing partner.',
        },
        'pseudo-3': {
          title: '3. Lookup BEFORE inserting',
          reason:
            'Guarantees distinct indices by checking only previously visited elements.',
        },
        'pseudo-4': {
          title: '4. Store current value & handle not-found',
          reason:
            'Record the current value for future elements, or return not-found after the loop.',
        },
      },
    },
    'valid-parentheses': {
      suggestedNextActivity:
        'Switch to Free Exploration and test tricky bracket strings like "([)]", "((", "]", and "" with Predict Mode enabled — then try implementing Valid Parentheses in your own editor without peeking!',
      stages: {
        'vp-understand': {
          shortTitle: 'Balanced Rules',
          title: 'Stage 1: Understand Balanced Brackets',
          goal: 'See why counting openers vs. closers is not enough — nesting order matters.',
          conceptLearned: 'Nested Bracket Order (LIFO Rule)',
          narrative:
            'Balanced brackets must match both in TYPE and in ORDER. The most recently opened bracket is always the first one that must close.',
          question: {
            prompt:
              'Look at "([)]". It has one "(", one ")", one "[", and one "]". Is it valid?',
            options: {
              'vp-q1-valid': {
                label:
                  'Yes — every opening bracket has a matching closing bracket somewhere.',
                feedback:
                  'Counts alone are not enough! Because "[" was opened inside "(", "[" must close BEFORE ")" arrives.',
              },
              'vp-q1-invalid': {
                label:
                  'No — "[" was opened most recently, so ")" cannot close before "]".',
                feedback:
                  'Exactly! The innermost open bracket must close first. That Last-In-First-Out rule is the core of this problem.',
              },
            },
          },
          hints: {
            1: {
              label: 'Hint 1 · Conceptual Question',
              text: 'In "([)]", which bracket is still waiting to close when ")" appears?',
            },
            2: {
              label: 'Hint 2 · Reasoning Guidance',
              text: 'Brackets cannot cross over each other: the inner "[" must close before the outer "(" can close.',
            },
            3: {
              label: 'Hint 3 · Explicit Next Idea',
              text: 'Because "[" was opened last, it must close first — so ")" arriving before "]" makes "([)]" invalid.',
            },
          },
        },
        'vp-why-stack': {
          shortTitle: 'Why a Stack?',
          title: 'Stage 2: Discover Why a Stack Fits',
          goal: 'Connect "most recently opened closes first" directly to the Stack data structure.',
          conceptLearned: 'Last-In-First-Out (LIFO) Stack Intuition',
          narrative:
            'Think of stacking plates: you place each new opening bracket on TOP, and when a closing bracket arrives, you only ever need to inspect the plate sitting on TOP.',
          question: {
            prompt:
              'When scanning "{[]}" from left to right, after reading "{" and "[", which bracket sits on TOP of the stack?',
            options: {
              'vp-q2-curly': {
                label: '"{" because it appeared first.',
                feedback:
                  'A queue removes the first item, but a Stack is Last-In-First-Out: the newest item sits on TOP.',
              },
              'vp-q2-square': {
                label: '"[" because it was pushed most recently.',
                feedback:
                  'Spot on! "[" is on TOP, so when "]" arrives next, it matches TOP immediately and pops "[" off.',
              },
            },
          },
          hints: {
            1: {
              label: 'Hint 1 · Conceptual Question',
              text: 'When you stack "{" first and then place "[" on top of it, which one is on TOP?',
            },
            2: {
              label: 'Hint 2 · Reasoning Guidance',
              text: 'A Stack follows Last-In-First-Out (LIFO): the most recently pushed item is always on TOP.',
            },
            3: {
              label: 'Hint 3 · Explicit Next Idea',
              text: 'Pushing "{" then "[" leaves "[" on TOP — ready to match the next "]".',
            },
          },
        },
        'vp-trace-ops': {
          shortTitle: 'Trace & Mismatch',
          title: 'Stage 3: Trace Push, Pop & Edge Cases',
          goal: 'Watch push/pop transitions and spot the two ways a bracket string can fail.',
          conceptLearned: 'Mismatch & Unclosed-Stack Edge Cases',
          narrative:
            'Try the presets like "(]" (mismatch), "]" (empty stack), and "((" (unclosed leftovers) on the Stack Canvas and predict each step.',
          question: {
            prompt:
              'What happens at the end of scanning "((" if you forget to check whether the stack is empty?',
            options: {
              'vp-q3-false-positive': {
                label:
                  'You would wrongly return true because no mismatch ever happened during the loop.',
                feedback:
                  'Exactly! "((" only pushes and never sees a closing bracket, so checking stack.length === 0 at the end is essential.',
              },
              'vp-q3-crash': {
                label: 'The loop would detect a mismatch on the second "(".',
                feedback:
                  'Two opening brackets in a row are totally fine (like "(())") — they only fail if they remain unclosed at the end.',
              },
            },
          },
          hints: {
            1: {
              label: 'Hint 1 · Conceptual Question',
              text: 'In "((", does the algorithm ever see a closing bracket that could trigger a mismatch?',
            },
            2: {
              label: 'Hint 2 · Reasoning Guidance',
              text: 'Both "(" characters are simply pushed onto the stack. After the loop ends, the stack still has size 2.',
            },
            3: {
              label: 'Hint 3 · Explicit Next Idea',
              text: 'Return true ONLY when the stack is completely empty at the end; otherwise unclosed brackets remain.',
            },
          },
        },
        'vp-build-pseudo': {
          shortTitle: 'Build Code',
          title: 'Stage 4: Build Pseudocode Progressively',
          goal: 'Turn push, top-check, pop, and final empty-stack check into clean pseudocode.',
          conceptLearned: 'Translating Stack Reasoning to Pseudocode',
          narrative:
            'Reveal each pseudocode block only after thinking through what comes next, then try writing it in your preferred language.',
          question: {
            prompt:
              'If a closing bracket arrives while the stack is empty (like "]"), what should the algorithm return?',
            options: {
              'vp-q4-push': {
                label: 'Push "]" onto the stack and keep going.',
                feedback:
                  'A closing bracket can never be matched by a later opening bracket — it already failed.',
              },
              'vp-q4-false': {
                label: 'Return false immediately.',
                feedback:
                  'Correct! Checking if the stack is empty before popping prevents errors and exits early with false.',
              },
            },
          },
          hints: {
            1: {
              label: 'Hint 1 · Conceptual Question',
              text: 'Can a closing bracket like "]" ever be matched by an opening bracket that appears AFTER it?',
            },
            2: {
              label: 'Hint 2 · Reasoning Guidance',
              text: 'If the stack is empty when a closer arrives, there is no earlier opener to pair with it.',
            },
            3: {
              label: 'Hint 3 · Explicit Next Idea',
              text: 'Check `if stack is empty or top != matching_open[ch]: return false` before popping.',
            },
          },
        },
      },
      pseudocode: {
        'vp-pseudo-1': {
          title: '1. Initialize empty stack & bracket pairs',
          reason:
            'Track unclosed openers and map each closer to its required opener.',
        },
        'vp-pseudo-2': {
          title: '2. Push opening brackets',
          reason:
            'Each opener waits on TOP of the stack for its matching closer.',
        },
        'vp-pseudo-3': {
          title: '3. Validate & pop on closing brackets',
          reason:
            'Reject empty stack or wrong TOP immediately; otherwise pop.',
        },
        'vp-pseudo-4': {
          title: '4. Final empty-stack check',
          reason:
            'Ensure no unclosed opening brackets remain after the loop.',
        },
      },
    },
    'split-array-largest-sum': {
      suggestedNextActivity:
        'Switch to Free Exploration and compare presets like [1, 4, 4] (k = 3), [0, 0, 0] (k = 2), and k = 1 vs k = n — and click through the Binary Search Iteration Inspector to see how each Greedy subtrace narrows [low, high]!',
      stages: {
        'sa-stage-1-understand': {
          shortTitle: 'Partitions',
          title: 'Stage 1: Contiguous Partitions & Minimax Goal',
          goal: 'Understand contiguous subarrays and what "minimize the largest sum" means.',
          conceptLearned: 'Contiguous Partitioning & Minimax Objective',
          narrative:
            'We cannot reorder nums — we only place k - 1 dividers between adjacent elements to form k nonempty contiguous groups. For each split, we look at the heaviest group sum, and want the split whose heaviest group is as small as possible.',
          question: {
            prompt:
              'For nums = [7, 2, 5, 10, 8] and k = 2, splitting into [7, 2, 5] and [10, 8] gives group sums 14 and 18. What is this split’s "largest subarray sum"?',
            options: {
              'sa-q1-18': {
                label:
                  '18 — the maximum of the two group sums (14 and 18).',
                feedback:
                  'Exactly! For any split, we measure its bottleneck (max group sum = 18), and we want to make that bottleneck as small as possible.',
              },
              'sa-q1-32': {
                label: '32 — the total sum of both groups combined.',
                feedback:
                  '32 is the total sum of the whole array (which never changes!). We measure max(14, 18) = 18.',
              },
            },
          },
          hints: {
            1: {
              label: 'Hint 1 · Conceptual Question',
              text: 'If two trucks carry 14 kg and 18 kg, which truck determines the heaviest load?',
            },
            2: {
              label: 'Hint 2 · Reasoning Guidance',
              text: 'For a single partition, take the MAX across its k subarray sums. Across all possible partitions, we want the MIN of that max.',
            },
            3: {
              label: 'Hint 3 · Explicit Next Idea',
              text: 'The two subarray sums are 7+2+5 = 14 and 10+8 = 18, so the largest subarray sum for that split is max(14, 18) = 18.',
            },
          },
        },
        'sa-stage-2-feasibility': {
          shortTitle: 'Feasibility',
          title: 'Stage 2: Turn Optimization into a Yes/No Check',
          goal: 'See how "can we keep every group sum <= X using at most k groups?" unlocks the problem.',
          conceptLearned: 'Decision-Problem Reformulation & Exact-k Refinement',
          narrative:
            'Choosing k - 1 cut positions directly has exponentially many combinations. Instead, pick a candidate cap X and ask a simpler Yes/No question: can we split nums into AT MOST k contiguous groups with each sum <= X?',
          question: {
            prompt:
              'Suppose k = 3, nums = [1, 4, 4] (all nonnegative), and our packer fits everything into just 2 groups ([1], [4, 4]) under cap X = 8. Can we still form EXACTLY k = 3 nonempty groups <= 8?',
            options: {
              'sa-q2-yes': {
                label:
                  'Yes — split [4, 4] into [4] and [4]; with nonnegative numbers, splitting never increases any group sum!',
                feedback:
                  'Spot on! Because 1 <= k <= n and nums[i] >= 0, any split using <= k groups can always be subdivided into exact k nonempty groups without exceeding X.',
              },
              'sa-q2-no': {
                label:
                  'No — using fewer than k groups means cap X = 8 is invalid.',
                feedback:
                  'Because n = 3 >= k = 3 and all values are >= 0, splitting a multi-element group into smaller pieces only keeps sums <= 8!',
              },
            },
          },
          hints: {
            1: {
              label: 'Hint 1 · Conceptual Question',
              text: 'If [4, 4] has sum 8 <= 8, what are the sums when you cut [4, 4] into [4] and [4]?',
            },
            2: {
              label: 'Hint 2 · Reasoning Guidance',
              text: 'Splitting a group of nonnegative numbers produces two smaller nonnegative sums, neither of which can exceed the original group sum.',
            },
            3: {
              label: 'Hint 3 · Explicit Next Idea',
              text: 'Because n >= k and nums[i] >= 0, we can always split multi-element groups until we have exact k nonempty groups, all still <= X.',
            },
          },
        },
        'sa-stage-3-greedy': {
          shortTitle: 'Greedy Check',
          title: 'Stage 3: Why Greedy Packing Works (Nonnegative Rule)',
          goal: 'Understand how O(n) Greedy checks a candidate cap X and why negative numbers would break it.',
          conceptLearned: 'Greedy Contiguous Packing & Nonnegative Requirement',
          narrative:
            'To check if cap X is feasible, scan left to right and pack each element into the current group as long as runningSum + nums[i] <= X; only start a new group when forced. Delaying cuts leaves as much room as possible for the rest of the array.',
          question: {
            prompt:
              'Why does this Greedy feasibility check require all numbers in nums to be nonnegative (nums[i] >= 0)?',
            options: {
              'sa-q3-nonneg': {
                label:
                  'With negative numbers, a running sum exceeding X might drop back <= X later, so cutting immediately when sum > X would no longer be safe.',
                feedback:
                  'Exactly! Nonnegativity guarantees running sums only grow as we add elements, so the moment runningSum + nums[i] > X, cutting is mandatory.',
              },
              'sa-q3-mod': {
                label:
                  'Because floor division in Binary Search fails on negative integers.',
                feedback:
                  'Binary Search can run over negative ranges, but the Greedy feasibility checker itself breaks when future negative values can rescue an over-limit subarray!',
              },
            },
          },
          hints: {
            1: {
              label: 'Hint 1 · Conceptual Question',
              text: 'Imagine nums = [6, 5, -10] and cap X = 8. At index 1 the sum hits 11 > 8, but what happens if you include -10?',
            },
            2: {
              label: 'Hint 2 · Reasoning Guidance',
              text: 'Greedy cuts immediately when runningSum + nums[i] > X because it assumes future elements can never reduce the sum.',
            },
            3: {
              label: 'Hint 3 · Explicit Next Idea',
              text: 'Nonnegativity ensures subarray sums grow monotonically as elements are added, making the greedy cut decision locally and globally optimal.',
            },
          },
        },
        'sa-stage-4-bs-answer': {
          shortTitle: 'Binary Search',
          title: 'Stage 4: Monotonicity & Binary Search on Answer',
          goal: 'Understand why Binary Search and Greedy need each other.',
          conceptLearned: 'Monotonic Feasibility & Binary Search on Answer',
          narrative:
            'Testing every cap X from max(nums) up to sum(nums) one by one works, but if numbers are up to 10^9 that linear scan is far too slow! Meanwhile, Binary Search alone cannot check if a cap works. Together: Feasibility is monotonic (false, false, ..., true, true), so Binary Search halves [max(nums), sum(nums)] while Greedy tests each midpoint!',
          question: {
            prompt:
              'If Greedy reports that candidate cap mid = 15 is INFEASIBLE (needed more than k groups), what do we immediately know about every cap <= 15?',
            options: {
              'sa-q4-all-fail': {
                label:
                  'Every cap <= 15 is also infeasible, so we can safely set low = 16.',
                feedback:
                  'Yes! Tightening the cap below 15 can never require FEWER groups, so we discard everything <= 15 in one step.',
              },
              'sa-q4-smaller-works': {
                label:
                  'A smaller cap like 12 might still work, so we must check [low, 14].',
                feedback:
                  'A smaller cap allows even LESS sum per group, which forces at least as many groups — never fewer!',
              },
            },
          },
          hints: {
            1: {
              label: 'Hint 1 · Conceptual Question',
              text: 'If you cannot pack books into k boxes of capacity 15 kg, could you pack the exact same books into k boxes of capacity 14 kg?',
            },
            2: {
              label: 'Hint 2 · Reasoning Guidance',
              text: 'Smaller capacity never allows fewer boxes. Feasibility across capacities looks like: F, F, ..., F, T, T, ..., T.',
            },
            3: {
              label: 'Hint 3 · Explicit Next Idea',
              text: 'When mid = 15 is infeasible (F), every capacity <= 15 is also F, so we safely advance low to mid + 1 = 16.',
            },
          },
        },
        'sa-stage-5-compose': {
          shortTitle: 'Compose Code',
          title: 'Stage 5: Combine Both Techniques & Build Pseudocode',
          goal: 'Write clean modular pseudocode: a Greedy helper called inside a Binary Search loop.',
          conceptLearned: 'Modular Driver + Subroutine Composition',
          narrative:
            'When two techniques cooperate, keep them cleanly separated in code: write a small `canSplit(nums, k, maxSum)` Greedy helper, then call it inside your `while low < high` Binary Search loop.',
          question: {
            prompt:
              'When `canSplit(nums, k, mid)` returns TRUE, why do we set `high = mid` instead of `high = mid - 1`?',
            options: {
              'sa-q5-keep-mid': {
                label:
                  'Because mid itself might be the minimum feasible answer — discarding mid could lose the optimal answer!',
                feedback:
                  'Spot on! Keeping `high = mid` preserves the invariant that `high` is always a known feasible answer until `low === high`.',
              },
              'sa-q5-infinite': {
                label: 'Setting high = mid - 1 would run slower.',
                feedback:
                  'It is a correctness bug, not speed: if mid is the smallest feasible cap, `high = mid - 1` would exclude the true answer from `[low, high]`!',
              },
            },
          },
          hints: {
            1: {
              label: 'Hint 1 · Conceptual Question',
              text: 'Suppose the true optimal answer is 18, and Binary Search tests mid = 18 (which returns feasible = true). What happens if you set high = 17?',
            },
            2: {
              label: 'Hint 2 · Reasoning Guidance',
              text: 'We want [low, high] to ALWAYS contain the optimal answer at the end of every iteration.',
            },
            3: {
              label: 'Hint 3 · Explicit Next Idea',
              text: 'Keep high = mid on feasible (since mid may be optimal) and set low = mid + 1 on infeasible (since mid definitely failed).',
            },
          },
        },
      },
      pseudocode: {
        'sa-pseudo-1': {
          title: '1. Greedy Feasibility Helper (O(n) time, O(1) aux space)',
          reason:
            'Counts the minimum contiguous groups needed so every group sum <= maxSum.',
        },
        'sa-pseudo-2': {
          title: '2. Initialize Binary Search Answer Bounds',
          reason: 'Optimal largest sum must lie in [max(nums), sum(nums)].',
        },
        'sa-pseudo-3': {
          title: '3. Binary Search Driver Calling Greedy',
          reason:
            'Halve the candidate range while keeping the optimal answer inside [low, high].',
        },
        'sa-pseudo-4': {
          title: '4. Return Converged Optimum',
          reason:
            'When low == high, low is the smallest feasible largest subarray sum.',
        },
      },
    },
  },
} as const;
