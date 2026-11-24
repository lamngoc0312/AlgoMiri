from __future__ import annotations

import os
from collections.abc import Mapping
from pathlib import Path
from typing import Optional

from dotenv import dotenv_values
from pydantic import BaseModel, ConfigDict, Field, SecretStr, ValidationError, field_validator

API_DIR = Path(__file__).resolve().parent.parent
DEFAULT_ENV_FILE = API_DIR / ".env"


class ConfigurationError(ValueError):
    """Raised when backend configuration is invalid or malformed at startup."""


class Settings(BaseModel):
    model_config = ConfigDict(extra="ignore", frozen=True)

    gemini_api_key: SecretStr = Field(default_factory=lambda: SecretStr(""))
    gemini_model: str = Field(default="gemini-2.5-flash", min_length=1, max_length=120)
    cors_origins: tuple[str, ...] = Field(
        default=("http://localhost:5173", "http://127.0.0.1:5173"),
    )
    llm_timeout_seconds: float = Field(default=25.0, gt=0.0, le=120.0)
    llm_max_retries: int = Field(default=1, ge=0, le=3)
    max_statement_chars: int = Field(default=6000, ge=100, le=50000)
    max_request_body_bytes: int = Field(default=32768, ge=512, le=262144)
    max_tutor_request_bytes: int = Field(default=16384, ge=512, le=131072)
    rate_limit_per_minute: int = Field(default=20, ge=1, le=1000)
    daily_request_budget: int = Field(default=500, ge=1, le=100000)
    max_concurrent_llm_requests: int = Field(default=5, ge=1, le=100)

    @field_validator("gemini_model")
    @classmethod
    def validate_model_name(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("GEMINI_MODEL cannot be empty.")
        return cleaned

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, value: object) -> tuple[str, ...]:
        if isinstance(value, str):
            origins = tuple(item.strip() for item in value.split(",") if item.strip())
        elif isinstance(value, (list, tuple)):
            origins = tuple(str(item).strip() for item in value if str(item).strip())
        else:
            raise ValueError("CORS_ORIGINS must be a comma-separated list of origins.")

        if not origins:
            raise ValueError("CORS_ORIGINS must include at least one trusted origin.")
        for origin in origins:
            if origin == "*":
                raise ValueError(
                    "Wildcard '*' is not allowed in CORS_ORIGINS; configure explicit trusted origins."
                )
            if not (origin.startswith("http://") or origin.startswith("https://")):
                raise ValueError(
                    f"CORS origin '{origin}' must start with http:// or https://."
                )
        return origins

    @property
    def ai_configured(self) -> bool:
        return bool(self.gemini_api_key.get_secret_value().strip())

    def get_gemini_api_key(self) -> str:
        return self.gemini_api_key.get_secret_value().strip()


ENV_KEY_TO_FIELD: dict[str, str] = {
    "GEMINI_API_KEY": "gemini_api_key",
    "GEMINI_MODEL": "gemini_model",
    "CORS_ORIGINS": "cors_origins",
    "LLM_TIMEOUT_SECONDS": "llm_timeout_seconds",
    "LLM_MAX_RETRIES": "llm_max_retries",
    "MAX_STATEMENT_CHARS": "max_statement_chars",
    "MAX_REQUEST_BODY_BYTES": "max_request_body_bytes",
    "MAX_TUTOR_REQUEST_BYTES": "max_tutor_request_bytes",
    "RATE_LIMIT_PER_MINUTE": "rate_limit_per_minute",
    "DAILY_REQUEST_BUDGET": "daily_request_budget",
    "MAX_CONCURRENT_LLM_REQUESTS": "max_concurrent_llm_requests",
}


def load_settings(
    env_file: Optional[Path] = DEFAULT_ENV_FILE,
    environ: Optional[Mapping[str, str]] = None,
) -> Settings:
    """
    Loads settings from `api/.env` (if present) and overlays real environment variables.
    Real environment variables ALWAYS take precedence over `.env` values.
    Validates all settings at startup and never includes secret values in error messages.
    """
    source_env = os.environ if environ is None else environ
    merged: dict[str, str] = {}

    if env_file is not None and env_file.is_file():
        file_values = dotenv_values(env_file)
        for key, val in file_values.items():
            if key in ENV_KEY_TO_FIELD and val is not None:
                merged[key] = val

    # Real OS environment variables strictly override .env file values
    for key in ENV_KEY_TO_FIELD:
        if key in source_env:
            merged[key] = source_env[key]

    raw_fields: dict[str, object] = {}
    for env_key, field_name in ENV_KEY_TO_FIELD.items():
        if env_key not in merged:
            continue
        raw_val = merged[env_key]
        # Treat blank non-secret optional overrides as unset so defaults apply cleanly,
        # while keeping explicit invalid strings (e.g. "abc") so validation fails loudly.
        if env_key == "GEMINI_API_KEY":
            raw_fields[field_name] = raw_val.strip()
        elif raw_val.strip() != "":
            raw_fields[field_name] = raw_val

    try:
        return Settings.model_validate(raw_fields)
    except ValidationError as exc:
        # Sanitize error summary so no secret input value is ever echoed
        bad_fields = sorted(
            {str(err["loc"][0]) for err in exc.errors() if err.get("loc")}
        )
        raise ConfigurationError(
            f"Invalid backend configuration for field(s): {', '.join(bad_fields)}."
        ) from None
