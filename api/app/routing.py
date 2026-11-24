from __future__ import annotations

import re

from .schemas import ProblemAnalysis, VerifiedMatchInfo


def _has_any(text: str, patterns: list[str]) -> bool:
    return any(re.search(p, text) for p in patterns)


def match_verified_problem(
    problem_statement: str,
    analysis: ProblemAnalysis,
) -> VerifiedMatchInfo:
    """
    Semantically matches a user-submitted problem against AlgoMiri's deterministic
    ProblemRegistry engines, checking constraints and rejecting incompatible variants.
    Never blindly routes by keyword alone.
    """
    raw = problem_statement.lower()
    combined = f"{raw}\n{analysis.title.lower()}\n{analysis.inferred_problem_type.lower()}"

    # 1. Check Split Array Largest Sum (Binary Search on Answer + Greedy)
    mentions_split_partition = _has_any(
        combined,
        [
            r"split\s+array\s+largest\s+sum",
            r"(split|partition|divide).{0,60}(contiguous\s+subarrays?|subarrays?).{0,80}(minimiz\w+.{0,40}(largest|maximum)\s+sum)",
            r"minimiz\w+\s+the\s+(largest|maximum)\s+(subarray\s+)?sum",
        ],
    )
    if mentions_split_partition:
        allows_negatives = _has_any(
            raw,
            [
                r"\bnegative\s+(numbers?|integers?|values?)\s+(are\s+)?(allowed|included|possible)",
                r"can\s+(contain|include|have)\s+negative",
                r"-\d+\s*<=\s*nums",
                r"may\s+be\s+negative",
            ],
        )
        if allows_negatives:
            return VerifiedMatchInfo(
                status="ambiguous",
                matched_problem_id="split-array-largest-sum",
                matched_problem_title="Split Array Largest Sum",
                studio_path="/studio/split-array-largest-sum",
                reason=(
                    "This resembles Split Array Largest Sum, but your statement appears to "
                    "allow negative numbers. AlgoMiri's verified Binary Search + Greedy engine "
                    "requires nonnegative integers (nums[i] >= 0)."
                ),
                compatibility_checks=[
                    "Contiguous k-way partition minimizing max sum: matched",
                    "Nonnegative integer constraint (nums[i] >= 0): INCOMPATIBLE / UNCERTAIN",
                ],
                user_input_note=(
                    "Your pasted statement is NOT automatically executed. Choose conceptual "
                    "analysis if negative values are required."
                ),
            )

        return VerifiedMatchInfo(
            status="verified",
            matched_problem_id="split-array-largest-sum",
            matched_problem_title="Split Array Largest Sum",
            studio_path="/studio/split-array-largest-sum",
            reason=(
                "Matches AlgoMiri's verified Split Array Largest Sum engine "
                "(contiguous k-way partitioning minimizing the largest subarray sum on nonnegative integers)."
            ),
            compatibility_checks=[
                "Contiguous k-way partition minimizing max subarray sum: compatible",
                "Nonnegative integer assumption: compatible",
            ],
            user_input_note=(
                "Learning Studio opens with built-in sample inputs; you can enter your own "
                "nonnegative array and k (up to 10 elements) inside the Studio."
            ),
        )

    # 2. Check Valid Parentheses (Stack LIFO)
    mentions_brackets = _has_any(
        combined,
        [
            r"valid\s+parenthes",
            r"balanced\s+(brackets?|parenthes)",
            r"\(\).*?\[\].*?\{\}",
        ],
    )
    if mentions_brackets:
        incompatible_bracket_variant = _has_any(
            raw,
            [
                r"longest\s+valid\s+parenthes",
                r"generate\s+(all\s+)?(valid\s+)?parenthes",
                r"minimum\s+(number\s+of\s+)?(removals?|insertions?|additions?|swaps?)",
                r"score\s+of\s+parenthes",
                r"wildcard|\*",
            ],
        )
        if incompatible_bracket_variant:
            return VerifiedMatchInfo(
                status="conceptual_only",
                matched_problem_id=None,
                matched_problem_title=None,
                studio_path=None,
                reason=(
                    "Although this involves parentheses, it asks for a different problem variant "
                    "(such as longest substring, generation, or minimum edits) that is NOT "
                    "compatible with our boolean balanced-bracket Stack engine."
                ),
                compatibility_checks=[
                    "Boolean balanced-bracket validation only: NOT compatible with this variant",
                ],
                user_input_note=(
                    "Showing AI conceptual analysis only. No deterministic trace was generated."
                ),
            )

        return VerifiedMatchInfo(
            status="verified",
            matched_problem_id="valid-parentheses",
            matched_problem_title="Valid Parentheses",
            studio_path="/studio/valid-parentheses",
            reason=(
                "Matches AlgoMiri's verified Valid Parentheses Stack engine "
                "(boolean balanced bracket checking for (), [], {})."
            ),
            compatibility_checks=[
                "Boolean balanced-bracket validation: compatible",
                "Standard (), [], {} bracket set: compatible",
            ],
            user_input_note=(
                "Learning Studio loads built-in presets first; you can paste your own "
                "bracket string (up to 16 characters) inside the Studio."
            ),
        )

    # 3. Check Two Sum (distinct-index pair sum)
    has_two_sum_semantics = _has_any(
        raw,
        [
            r"(two|pair\s+of)\s+(distinct\s+)?(indices|numbers|elements).{0,80}(sum|add\s+up)\s+to\s+(a\s+)?target",
            r"(array|list)\s+of\s+integers.{0,80}target.{0,80}(two|pair)",
        ],
    )
    analysis_confirms_two_sum = _has_any(
        f"{analysis.title.lower()} {analysis.inferred_problem_type.lower()}",
        [r"\btwo\s*[- ]?sum\b", r"pair\s+sum"],
    )
    mentions_two_sum_semantics = has_two_sum_semantics or (
        analysis_confirms_two_sum
        and _has_any(raw, [r"\b(array|nums|list|integers?)\b"])
        and _has_any(raw, [r"\b(target|sum)\b"])
    )
    if mentions_two_sum_semantics:
        incompatible_sum_variant = _has_any(
            raw,
            [
                r"\b(3sum|three\s+sum|4sum|four\s+sum|k-?sum)\b",
                r"(three|3|four|4)\s+(numbers|elements|indices|triplets)",
                r"contiguous\s+subarray\s+sum",
                r"all\s+unique\s+(pairs|triplets)",
                r"bst|binary\s+search\s+tree|weighted\s+graph|spanning\s+tree",
            ],
        )
        if incompatible_sum_variant:
            return VerifiedMatchInfo(
                status="conceptual_only",
                matched_problem_id=None,
                matched_problem_title=None,
                studio_path=None,
                reason=(
                    "This problem is a multi-element or structural variant (such as 3Sum, "
                    "subarray sum, or BST sum) and does NOT match AlgoMiri's 2-index Two Sum engine."
                ),
                compatibility_checks=[
                    "Exactly two distinct indices in a flat integer array: NOT compatible",
                ],
                user_input_note=(
                    "Showing AI conceptual analysis only. No deterministic trace was generated."
                ),
            )

        one_indexed_or_sorted = _has_any(
            raw,
            [r"1-indexed", r"one-indexed", r"non-decreasing\s+order"],
        )
        if one_indexed_or_sorted:
            return VerifiedMatchInfo(
                status="ambiguous",
                matched_problem_id="two-sum",
                matched_problem_title="Two Sum",
                studio_path="/studio/two-sum",
                reason=(
                    "This resembles Two Sum, but specifies sorted input or 1-indexed output. "
                    "Our verified Two Sum Studio uses 0-indexed Brute Force & Hash Map traces."
                ),
                compatibility_checks=[
                    "Two-element target sum: matched",
                    "Indexing / sorted-array assumption: differs slightly (0-indexed in Studio)",
                ],
                user_input_note=(
                    "You can explore the conceptual analysis here or open the 0-indexed Two Sum Studio."
                ),
            )

        return VerifiedMatchInfo(
            status="verified",
            matched_problem_id="two-sum",
            matched_problem_title="Two Sum",
            studio_path="/studio/two-sum",
            reason=(
                "Matches AlgoMiri's verified Two Sum engine "
                "(finding two distinct 0-based indices summing to target)."
            ),
            compatibility_checks=[
                "Flat integer array + target integer: compatible",
                "Two distinct indices summing to target: compatible",
            ],
            user_input_note=(
                "Learning Studio starts with built-in sample inputs; you can test your own "
                "integer array and target (up to 12 elements) inside the Studio."
            ),
        )

    # Default: Unsupported problem -> conceptual only
    return VerifiedMatchInfo(
        status="conceptual_only",
        matched_problem_id=None,
        matched_problem_title=None,
        studio_path=None,
        reason=(
            "AlgoMiri does not yet have a deterministic visual trace engine for this problem. "
            "You can still explore the structured conceptual analysis and ask the AI Tutor."
        ),
        compatibility_checks=[
            "No matching deterministic engine in ProblemRegistry (currently supports Two Sum, Valid Parentheses, and Split Array Largest Sum).",
        ],
        user_input_note=(
            "Analysis is conceptual only — no algorithm was executed and no trace was fabricated."
        ),
    )
