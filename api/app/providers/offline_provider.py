from __future__ import annotations

from ..schemas import (
    CandidateStrategy,
    DecompositionStep,
    ProblemAnalysis,
    TutorPayload,
    TutorRequest,
    WorkedExample,
)

OFFLINE_NOTICE = (
    "Offline Demo Mode: GEMINI_API_KEY is not configured on the server. "
    "No live AI API call was made — showing a structured offline template so you can "
    "test the workflow safely."
)


class OfflineDemoProvider:
    """Explicitly labeled offline fallback when no LLM API key is configured."""

    async def analyze_problem(self, problem_statement: str) -> ProblemAnalysis:
        first_line = problem_statement.strip().splitlines()[0][:80]
        return ProblemAnalysis(
            title=f"Offline Conceptual Draft: {first_line}",
            inferred_problem_type="General Algorithm Problem (Offline Template)",
            plain_language_summary=(
                "Live AI analysis is currently offline because GEMINI_API_KEY is not set on the server. "
                "Start by listing the exact inputs, desired output, and smallest non-trivial example "
                "before choosing a data structure or strategy."
            ),
            inputs=["Input structure described in your pasted statement"],
            outputs=["Expected output format specified by the problem"],
            constraints_and_assumptions=[
                "Verify input size limits (n) and whether negative or duplicate values are allowed.",
                "Offline template: configure GEMINI_API_KEY in api/.env for live AI analysis.",
            ],
            clarifications_or_ambiguities=[
                "Live AI ambiguity detection requires a configured server-side LLM API key.",
            ],
            worked_example=WorkedExample(
                input_summary="Pick a tiny 3–4 element example from your problem statement.",
                output_summary="Compute the expected output by hand first.",
                walkthrough=(
                    "Trace the example manually to notice what information you repeatedly look up "
                    "or maintain as you scan the input."
                ),
            ),
            edge_cases=[
                "Empty or minimum-size input",
                "Duplicate values or boundary values (0, negative numbers if allowed)",
                "No-solution or already-sorted input",
            ],
            prerequisite_concepts=[
                "Input/Output Modeling",
                "Brute-Force Baseline",
                "Time & Space Complexity Tradeoffs",
            ],
            subproblem_decomposition=[
                DecompositionStep(
                    id="step-1",
                    title="Clarify constraints & edge cases",
                    goal="Confirm input bounds, duplicates, ordering, and return format.",
                    depends_on=[],
                ),
                DecompositionStep(
                    id="step-2",
                    title="Derive a simple baseline",
                    goal="Find a guaranteed-correct brute-force approach to understand the problem.",
                    depends_on=["step-1"],
                ),
                DecompositionStep(
                    id="step-3",
                    title="Spot repeated work & optimize",
                    goal="Identify which lookup or invariant a data structure (Hash Map, Stack, Binary Search) can speed up.",
                    depends_on=["step-2"],
                ),
            ],
            candidate_strategies=[
                CandidateStrategy(
                    name="Direct Brute-Force Baseline",
                    technique="Exhaustive Enumeration",
                    intuition="Test all valid combinations directly to verify your understanding of the rules.",
                    why_it_applies="Always provides a clear correctness baseline before optimizing.",
                    time_complexity="Depends on problem (often O(n²) or higher)",
                    space_complexity="O(1) auxiliary",
                    complexity_assumptions="Assumes direct iteration without extra lookup tables.",
                    limitations="May be too slow for large input sizes.",
                ),
            ],
            confidence_notes=(
                "Offline template only — no live LLM analyzed your statement. "
                "Set GEMINI_API_KEY in api/.env to enable real structured AI analysis."
            ),
        )

    async def tutor(self, request: TutorRequest) -> TutorPayload:
        action_replies: dict[str, tuple[str, str, str]] = {
            "simplify": (
                f"In simple terms, focus on what '{request.problem_analysis.title}' asks you to return from a tiny 3-element example before thinking about code.",
                "What would the answer be for the smallest possible valid input?",
                "Write down the input and output for 1 tiny example and 1 edge case.",
            ),
            "hint": (
                "Start by identifying what work a simple brute-force approach repeats over and over.",
                "Which value or relationship do you keep searching for during each step?",
                "Ask whether remembering visited values (Hash Map/Stack) or narrowing a monotonic range (Binary Search) avoids that repeated scan.",
            ),
            "why_technique": (
                f"For {request.selected_strategy or 'this technique'}, the goal is to match the data structure or search pattern to the exact bottleneck in the brute-force approach.",
                "What operation becomes faster when you use this technique, and what does it cost in memory or assumptions?",
                "Check both the time speedup and every prerequisite constraint (such as sorted order or nonnegative values).",
            ),
            "compare_strategies": (
                "Compare strategies along three axes: how easy it is to prove correct, time complexity as n grows, and extra memory or input assumptions required.",
                "Which constraint in the problem makes the faster strategy valid (or invalid)?",
                "Try tracing both approaches on a 4-element example to feel the difference in operations.",
            ),
            "explain_prerequisite": (
                "A prerequisite concept is a small building block (like distinct-index bounds, LIFO order, or monotonicity) that the main strategy relies on.",
                "Which single rule in this problem feels least clear right now?",
                "Test that rule on a 2-element edge case to see why breaking it causes a wrong answer.",
            ),
            "check_assumption": (
                "A great way to test an assumption is to try constructing the smallest counterexample that breaks it.",
                "What happens if your input has duplicates, zeros, negative numbers, or only 1 element?",
                "Check every constraint in the problem statement against your current idea.",
            ),
            "custom_question": (
                "Offline Demo Tutor cannot answer open-ended custom questions with a live LLM until GEMINI_API_KEY is configured on the server.",
                "Can you test your question on a tiny 3-element example by hand first?",
                "Configure GEMINI_API_KEY in api/.env to enable live conversational tutoring.",
            ),
        }

        reply, question, hint = action_replies.get(
            request.action,
            action_replies["hint"],
        )
        return TutorPayload(
            reply=reply,
            guiding_question=question,
            progressive_hint=hint,
        )
