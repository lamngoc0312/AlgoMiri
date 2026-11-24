from __future__ import annotations

import re
from typing import Literal, Optional

from .schemas import ProblemAnalysis, VerifiedMatchInfo

ProblemFamily = Literal[
    "two-sum",
    "valid-parentheses",
    "split-array-largest-sum",
]


def _has_any(text: str, patterns: list[str]) -> bool:
    return any(re.search(p, text) for p in patterns)


def _detect_problem_family(
    raw_statement: str,
    analysis: ProblemAnalysis,
) -> Optional[ProblemFamily]:
    """
    Phase 1: Problem-family recognition ONLY.
    Identifies whether the problem belongs to one of AlgoMiri's known problem families
    without claiming compatibility yet.
    """
    analysis_header = (
        f"{analysis.title.lower()} {analysis.inferred_problem_type.lower()}"
    )

    # Family 1: Split Array Largest Sum (k-way contiguous partitioning minimizing max sum)
    if _has_any(
        raw_statement,
        [
            r"split\s+array\s+largest\s+sum",
            r"(split|partition|divide).{0,80}(contiguous\s+subarrays?|subarrays?).{0,90}minimiz\w+.{0,45}(largest|maximum)\s+sum",
            r"minimiz\w+\s+the\s+(largest|maximum)\s+(subarray\s+)?sum",
        ],
    ):
        return "split-array-largest-sum"

    # Family 2: Parentheses / Bracket problems
    if _has_any(
        raw_statement,
        [
            r"valid\s+parenthes",
            r"invalid\s+parenthes",
            r"balanced\s+(brackets?|parenthes)",
            r"parenthes\w*.{0,50}(valid|balanced|match|remove|longest|generate)",
            r"\(\).*?\[\].*?\{\}",
        ],
    ):
        return "valid-parentheses"

    # Family 3: Pair / Sum family (explicitly requires sum/array semantics, never just a prompt-injected title)
    mentions_array_and_target = _has_any(
        raw_statement, [r"\b(array|nums|list|integers?)\b"]
    ) and _has_any(raw_statement, [r"\b(target|sum|k)\b"])
    if mentions_array_and_target and _has_any(
        f"{raw_statement}\n{analysis_header}",
        [
            r"\btwo\s*[- ]?sum\b",
            r"\b(3sum|three\s+sum|4sum|four\s+sum|k-?sum)\b",
            r"subarray\s+sum\s+equals",
            r"(two|pair\s+of|all\s+pairs|count\s+pairs|how\s+many\s+pairs).{0,70}(sum|add\s+up)\s+to",
        ],
    ):
        return "two-sum"

    return None


def _check_split_array_compatibility(
    raw_statement: str,
) -> VerifiedMatchInfo:
    allows_negatives = _has_any(
        raw_statement,
        [
            r"\bnegative\s+(numbers?|integers?|values?)\b",
            r"can\s+(contain|include|have)\s+negative",
            r"may\s+be\s+negative",
            r"-\d+\s*<=\s*nums",
            r"nums\[i\]\s*<\s*0",
        ],
    )
    if allows_negatives:
        return VerifiedMatchInfo(
            status="conceptual_only",
            matched_problem_id=None,
            matched_problem_title=None,
            studio_path=None,
            reason=(
                "Your statement allows negative integers. AlgoMiri's verified Binary Search + "
                "Greedy Split Array engine requires nonnegative integers (nums[i] >= 0) because "
                "negative numbers break monotonic greedy packing."
            ),
            compatibility_checks=[
                "Contiguous k-way partition minimizing max sum: matched",
                "Nonnegative integer constraint (nums[i] >= 0): INCOMPATIBLE (negatives allowed)",
            ],
            user_input_note=(
                "Showing conceptual analysis only. No deterministic trace was generated."
            ),
        )

    explicitly_nonnegative = _has_any(
        raw_statement,
        [
            r"\bnon[-\s]?negative\b",
            r"\bpositive\s+(integers?|numbers?|values?)\b",
            r"0\s*<=\s*nums",
            r"nums\[i\]\s*>=\s*0",
            r">=\s*0",
        ],
    )
    if not explicitly_nonnegative:
        return VerifiedMatchInfo(
            status="ambiguous",
            matched_problem_id="split-array-largest-sum",
            matched_problem_title="Split Array Largest Sum",
            studio_path="/studio/split-array-largest-sum",
            reason=(
                "This resembles Split Array Largest Sum, but your statement does not state "
                "whether values are nonnegative (nums[i] >= 0). Our verified Binary Search + "
                "Greedy Studio only applies when all integers are nonnegative."
            ),
            compatibility_checks=[
                "Contiguous k-way partition minimizing max sum: matched",
                "Nonnegative integer constraint (nums[i] >= 0): UNKNOWN (not stated)",
            ],
            user_input_note=(
                "Please choose: stay in conceptual analysis if negative integers may appear, "
                "or open the curated Split Array Studio if inputs are guaranteed nonnegative."
            ),
        )

    return VerifiedMatchInfo(
        status="verified",
        matched_problem_id="split-array-largest-sum",
        matched_problem_title="Split Array Largest Sum",
        studio_path="/studio/split-array-largest-sum",
        reason=(
            "Matches AlgoMiri's verified Split Array Largest Sum engine: contiguous k-way "
            "partitioning minimizing the largest subarray sum on nonnegative integers."
        ),
        compatibility_checks=[
            "Objective (minimize largest sum across k contiguous subarrays): verified",
            "Constraint (nonnegative integers nums[i] >= 0): verified",
        ],
        user_input_note=(
            "Opening Studio loads curated built-in samples first; you can enter your own "
            "nonnegative array and k (up to 10 elements) inside the Studio."
        ),
    )


def _check_valid_parentheses_compatibility(
    raw_statement: str,
) -> VerifiedMatchInfo:
    incompatible_variant = _has_any(
        raw_statement,
        [
            r"remove\s+invalid\s+parenthes",
            r"longest\s+valid\s+parenthes",
            r"generate\s+(all\s+)?(valid\s+)?parenthes",
            r"minimum\s+(number\s+of\s+)?(removals?|insertions?|additions?|swaps?|deletions?)",
            r"score\s+of\s+parenthes",
            r"\bwildcard\b",
            r"['\"`]\*['\"`]",
            r"\basterisk\b",
            r"character\s+\*",
        ],
    )
    if incompatible_variant:
        return VerifiedMatchInfo(
            status="conceptual_only",
            matched_problem_id=None,
            matched_problem_title=None,
            studio_path=None,
            reason=(
                "This problem is a different parentheses variant (such as removing invalid "
                "brackets, wildcard '*', longest valid substring, or generation) and is NOT "
                "compatible with AlgoMiri's boolean ()[]{} Stack engine."
            ),
            compatibility_checks=[
                "Boolean balanced-bracket validation on ()[]{} only: INCOMPATIBLE variant",
            ],
            user_input_note=(
                "Showing conceptual analysis only. No deterministic trace was generated."
            ),
        )

    confirms_boolean_balanced = _has_any(
        raw_statement,
        [
            r"\b(valid|balanced)\b.{0,45}\b(parenthes|brackets?)\b",
            r"\b(parenthes|brackets?)\b.{0,45}\b(valid|balanced)\b",
            r"determine\s+(if|whether).{0,50}(valid|balanced|properly\s+closed)",
        ],
    )
    if not confirms_boolean_balanced:
        return VerifiedMatchInfo(
            status="ambiguous",
            matched_problem_id="valid-parentheses",
            matched_problem_title="Valid Parentheses",
            studio_path="/studio/valid-parentheses",
            reason=(
                "Your statement mentions brackets, but the exact boolean validity objective "
                "or allowed character set is not fully specified."
            ),
            compatibility_checks=[
                "Bracket matching family: recognized",
                "Boolean validity on ()[]{} only: UNCERTAIN",
            ],
            user_input_note=(
                "Choose conceptual analysis if your problem has extra rules, or open the "
                "curated Valid Parentheses Studio for standard ()[]{} checking."
            ),
        )

    return VerifiedMatchInfo(
        status="verified",
        matched_problem_id="valid-parentheses",
        matched_problem_title="Valid Parentheses",
        studio_path="/studio/valid-parentheses",
        reason=(
            "Matches AlgoMiri's verified Valid Parentheses Stack engine "
            "(boolean balanced bracket checking on (), [], {})."
        ),
        compatibility_checks=[
            "Objective (boolean balanced bracket check): verified",
            "Allowed characters (standard brackets, no wildcards/edits): verified",
        ],
        user_input_note=(
            "Opening Studio loads curated presets first; you can paste your own "
            "bracket string (up to 16 characters) inside the Studio."
        ),
    )


def _check_two_sum_compatibility(raw_statement: str) -> VerifiedMatchInfo:
    # Hard incompatibilities -> conceptual_only (NEVER route to Two Sum Studio)
    incompatible_variant = _has_any(
        raw_statement,
        [
            r"\b(3sum|three\s+sum|4sum|four\s+sum|k-?sum)\b",
            r"(three|3|four|4)\s+(numbers|elements|indices|triplets)",
            r"subarray\s+sum\s+equals",
            r"contiguous\s+subarray",
            r"(count|how\s+many|number\s+of|total\s+number\s+of)\s+(all\s+)?(matching\s+|valid\s+|unique\s+)?pairs?",
            r"all\s+(unique\s+|matching\s+)?(pairs|combinations|triplets)",
            r"\bbst\b|binary\s+search\s+tree|linked\s+list",
            r"weighted\s+graph|spanning\s+tree",
        ],
    )
    if incompatible_variant:
        return VerifiedMatchInfo(
            status="conceptual_only",
            matched_problem_id=None,
            matched_problem_title=None,
            studio_path=None,
            reason=(
                "This is a distinct sum variant (such as 3Sum, counting all matching pairs, "
                "Subarray Sum Equals K, or a tree/graph problem) and is NOT compatible with "
                "AlgoMiri's single-pair 0-indexed Two Sum engine."
            ),
            compatibility_checks=[
                "Single pair of two distinct 0-based indices in a flat array: INCOMPATIBLE",
            ],
            user_input_note=(
                "Showing conceptual analysis only. No deterministic trace was generated."
            ),
        )

    # Ambiguous variants (e.g., Two Sum II — sorted / 1-indexed)
    is_two_sum_ii = _has_any(
        raw_statement,
        [
            r"two\s+sum\s+ii\b",
            r"two\s+sum\s+2\b",
            r"1-indexed|one-indexed",
            r"(already\s+sorted|sorted\s+in\s+non-decreasing|non-decreasing\s+order)",
            r"constant\s+extra\s+space|o\(1\)\s+extra\s+space",
        ],
    )
    if is_two_sum_ii:
        return VerifiedMatchInfo(
            status="ambiguous",
            matched_problem_id="two-sum",
            matched_problem_title="Two Sum",
            studio_path="/studio/two-sum",
            reason=(
                "This looks like Two Sum II (sorted input, 1-indexed output, or O(1) space "
                "Two Pointers constraint). AlgoMiri's curated Two Sum Studio teaches 0-indexed "
                "Brute Force and Hash Map on unsorted arrays."
            ),
            compatibility_checks=[
                "Two-element target sum: matched",
                "0-indexed unsorted Brute Force / Hash Map contract: DIFFERS (Two Sum II constraints)",
            ],
            user_input_note=(
                "Explore the conceptual Two Pointers analysis here, or optionally open the "
                "curated 0-indexed Two Sum Studio to compare."
            ),
        )

    # Strict evidence check: must specify returning two distinct indices (not just the title)
    specifies_indices = _has_any(
        raw_statement,
        [
            r"\bindices\b",
            r"\bindex(es)?\b",
            r"positions?\s+i\s+and\s+j",
        ],
    )
    specifies_pair_sum = _has_any(
        raw_statement,
        [
            r"(two|pair).{0,50}(sum|add\s+up)\s+to",
            r"nums\[i\]\s*\+\s*nums\[j\]",
        ],
    )
    if not (specifies_indices and specifies_pair_sum):
        return VerifiedMatchInfo(
            status="ambiguous",
            matched_problem_id="two-sum",
            matched_problem_title="Two Sum",
            studio_path="/studio/two-sum",
            reason=(
                "Your statement resembles Two Sum, but does not explicitly confirm whether "
                "to return two distinct 0-based indices (vs. values, boolean, or all pairs)."
            ),
            compatibility_checks=[
                "Two Sum family: recognized",
                "Exact output format (two distinct 0-based indices): UNCERTAIN",
            ],
            user_input_note=(
                "Review the conceptual analysis above, or open the curated Two Sum Studio "
                "if you specifically want two distinct 0-based indices."
            ),
        )

    return VerifiedMatchInfo(
        status="verified",
        matched_problem_id="two-sum",
        matched_problem_title="Two Sum",
        studio_path="/studio/two-sum",
        reason=(
            "Matches AlgoMiri's verified Two Sum engine: finding two distinct 0-based "
            "indices in an integer array whose values sum to target."
        ),
        compatibility_checks=[
            "Objective (two distinct 0-based indices summing to target): verified",
            "Input structure (flat integer array + integer target): verified",
        ],
        user_input_note=(
            "Opening Studio loads curated built-in samples first; you can enter your own "
            "integer array and target (up to 12 elements) inside the Studio."
        ),
    )


def match_verified_problem(
    problem_statement: str,
    analysis: ProblemAnalysis,
) -> VerifiedMatchInfo:
    """
    Two-stage semantic matcher:
    1) Recognize problem family.
    2) Strictly verify objective, output format, constraints, and assumptions.
    """
    raw = problem_statement.lower()
    family = _detect_problem_family(raw, analysis)

    if family == "split-array-largest-sum":
        return _check_split_array_compatibility(raw)
    if family == "valid-parentheses":
        return _check_valid_parentheses_compatibility(raw)
    if family == "two-sum":
        return _check_two_sum_compatibility(raw)

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
