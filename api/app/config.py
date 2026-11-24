from __future__ import annotations

import os
from dataclasses import dataclass


@dataclass(frozen=True)
class Settings:
    gemini_api_key: str
    gemini_model: str
    cors_origins: tuple[str, ...]
    llm_timeout_seconds: float
    max_statement_chars: int
    max_request_body_bytes: int

    @property
    def ai_configured(self) -> bool:
        return bool(self.gemini_api_key.strip())


def load_settings() -> Settings:
    raw_origins = os.getenv(
        "CORS_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173",
    )
    origins = tuple(
        origin.strip() for origin in raw_origins.split(",") if origin.strip()
    )

    return Settings(
        gemini_api_key=os.getenv("GEMINI_API_KEY", "").strip(),
        gemini_model=os.getenv("GEMINI_MODEL", "gemini-2.5-flash").strip()
        or "gemini-2.5-flash",
        cors_origins=origins or ("http://localhost:5173",),
        llm_timeout_seconds=float(os.getenv("LLM_TIMEOUT_SECONDS", "25")),
        max_statement_chars=int(os.getenv("MAX_STATEMENT_CHARS", "6000")),
        max_request_body_bytes=int(os.getenv("MAX_REQUEST_BODY_BYTES", "32768")),
    )
