from __future__ import annotations

from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field


class WorkedExample(BaseModel):
    model_config = ConfigDict(extra="forbid")

    input_summary: str = Field(min_length=1, max_length=400)
    output_summary: str = Field(min_length=1, max_length=400)
    walkthrough: str = Field(min_length=1, max_length=1200)


class DecompositionStep(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str = Field(min_length=1, max_length=64)
    title: str = Field(min_length=1, max_length=160)
    goal: str = Field(min_length=1, max_length=500)
    depends_on: list[str] = Field(default_factory=list, max_length=8)


class CandidateStrategy(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str = Field(min_length=1, max_length=160)
    technique: str = Field(min_length=1, max_length=120)
    intuition: str = Field(min_length=1, max_length=700)
    why_it_applies: str = Field(min_length=1, max_length=700)
    time_complexity: str = Field(min_length=1, max_length=120)
    space_complexity: str = Field(min_length=1, max_length=120)
    complexity_assumptions: str = Field(min_length=1, max_length=400)
    limitations: str = Field(min_length=1, max_length=500)


class ProblemAnalysis(BaseModel):
    """Structured AI conceptual analysis — strictly separate from curated ProblemSpec & traces."""

    model_config = ConfigDict(extra="forbid")

    title: str = Field(min_length=1, max_length=200)
    inferred_problem_type: str = Field(min_length=1, max_length=160)
    plain_language_summary: str = Field(min_length=1, max_length=1200)
    inputs: list[str] = Field(min_length=1, max_length=10)
    outputs: list[str] = Field(min_length=1, max_length=10)
    constraints_and_assumptions: list[str] = Field(default_factory=list, max_length=12)
    clarifications_or_ambiguities: list[str] = Field(default_factory=list, max_length=10)
    worked_example: WorkedExample
    edge_cases: list[str] = Field(default_factory=list, max_length=12)
    prerequisite_concepts: list[str] = Field(default_factory=list, max_length=12)
    subproblem_decomposition: list[DecompositionStep] = Field(min_length=1, max_length=8)
    candidate_strategies: list[CandidateStrategy] = Field(min_length=1, max_length=4)
    confidence_notes: str = Field(min_length=1, max_length=800)


SupportedProblemId = Literal[
    "two-sum",
    "valid-parentheses",
    "split-array-largest-sum",
]


class VerifiedMatchInfo(BaseModel):
    model_config = ConfigDict(extra="forbid")

    status: Literal["verified", "ambiguous", "conceptual_only"]
    matched_problem_id: Optional[SupportedProblemId] = None
    matched_problem_title: Optional[str] = None
    studio_path: Optional[str] = None
    reason: str
    compatibility_checks: list[str] = Field(default_factory=list)
    user_input_note: str


class AnalyzeRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    problem_statement: str = Field(min_length=10, max_length=6000)


class AnalyzeResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    mode: Literal["ai", "offline-demo"]
    is_ai_generated: bool
    verified_execution: Literal[False] = False
    analysis: ProblemAnalysis
    verified_match: VerifiedMatchInfo
    notice: Optional[str] = None


TutorAction = Literal[
    "simplify",
    "hint",
    "why_technique",
    "compare_strategies",
    "explain_prerequisite",
    "check_assumption",
    "custom_question",
]


class TutorRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    problem_analysis: ProblemAnalysis
    action: TutorAction
    selected_strategy: Optional[str] = Field(default=None, max_length=200)
    learning_stage: Optional[str] = Field(default=None, max_length=200)
    execution_context: Optional[str] = Field(default=None, max_length=1500)
    learner_message: Optional[str] = Field(default=None, max_length=1500)
    explicitly_request_solution: bool = False


class TutorPayload(BaseModel):
    model_config = ConfigDict(extra="forbid")

    reply: str = Field(min_length=1, max_length=2000)
    guiding_question: str = Field(min_length=1, max_length=500)
    progressive_hint: Optional[str] = Field(default=None, max_length=600)


class TutorResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    mode: Literal["ai", "offline-demo"]
    is_ai_generated: bool
    verified_execution: Literal[False] = False
    reply: str
    guiding_question: str
    progressive_hint: Optional[str] = None
    mastery_disclaimer: str = (
        "AI tutoring supports conceptual understanding and does not verify code "
        "execution or measure long-term skill mastery."
    )
    notice: Optional[str] = None


class HealthResponse(BaseModel):
    status: Literal["ok"]
    ai_configured: bool
    provider: str
    model: str


class InspectUrlRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    url: str = Field(min_length=8, max_length=2048)


UrlRetrievalStatus = Literal[
    "fetched",
    "restricted_source",
    "manual_input_required",
    "fetch_failed",
]


class InspectUrlResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    original_url: str
    canonical_url: str
    source_name: str
    slug: Optional[str] = None
    display_title: Optional[str] = None
    retrieval_status: UrlRetrievalStatus
    message: str
    extracted_text: Optional[str] = None
    verified_match: Optional[VerifiedMatchInfo] = None


AllowedImageMimeType = Literal["image/png", "image/jpeg", "image/webp"]


class ImageInputItem(BaseModel):
    model_config = ConfigDict(extra="forbid")

    filename: str = Field(default="screenshot.png", min_length=1, max_length=160)
    mime_type: AllowedImageMimeType
    data_base64: str = Field(min_length=16, max_length=6_000_000)


class ImageExtractionRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    images: list[ImageInputItem] = Field(min_length=1, max_length=3)


class ImageExtractionPayload(BaseModel):
    model_config = ConfigDict(extra="forbid")

    extracted_text: str = Field(min_length=1, max_length=6000)
    diagram_notes: list[str] = Field(default_factory=list, max_length=8)
    uncertain_regions: list[str] = Field(default_factory=list, max_length=8)


class ImageExtractionResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    mode: Literal["ai", "offline-demo"]
    is_ai_generated: bool
    extracted_text: str
    diagram_notes: list[str] = Field(default_factory=list)
    uncertain_regions: list[str] = Field(default_factory=list)
    needs_confirmation: Literal[True] = True
    notice: Optional[str] = None
