from __future__ import annotations

from typing import Protocol

from ..schemas import ProblemAnalysis, TutorPayload, TutorRequest


class ProviderError(Exception):
    """Base error for LLM provider failures."""


class ProviderAuthError(ProviderError):
    """Raised when server-side LLM credentials are invalid or unauthorized."""


class ProviderRateLimitError(ProviderError):
    """Raised when the upstream LLM provider enforces a rate limit."""

    def __init__(self, message: str, retry_after_seconds: int = 15) -> None:
        super().__init__(message)
        self.retry_after_seconds = retry_after_seconds


class ProviderTimeoutError(ProviderError):
    """Raised when the upstream LLM call exceeds the configured timeout."""


class ProviderTransientError(ProviderError):
    """Raised for retryable transient upstream failures (5xx, temporary network errors)."""


class MalformedProviderOutputError(ProviderError):
    """Raised when the upstream LLM returns invalid or schema-violating output."""


class LLMProvider(Protocol):
    async def analyze_problem(self, problem_statement: str) -> ProblemAnalysis: ...

    async def tutor(self, request: TutorRequest) -> TutorPayload: ...

    async def aclose(self) -> None: ...
