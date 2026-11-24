from __future__ import annotations

from typing import Protocol

from ..schemas import ProblemAnalysis, TutorPayload, TutorRequest


class ProviderError(Exception):
    """Base error for LLM provider failures."""


class ProviderTimeoutError(ProviderError):
    """Raised when the upstream LLM call exceeds the configured timeout."""


class MalformedProviderOutputError(ProviderError):
    """Raised when the upstream LLM returns invalid or schema-violating output."""


class LLMProvider(Protocol):
    async def analyze_problem(self, problem_statement: str) -> ProblemAnalysis: ...

    async def tutor(self, request: TutorRequest) -> TutorPayload: ...
