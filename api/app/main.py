from __future__ import annotations

import logging
from typing import Optional

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .config import Settings, load_settings
from .providers.base import (
    LLMProvider,
    MalformedProviderOutputError,
    ProviderError,
    ProviderTimeoutError,
)
from .providers.gemini_provider import GeminiProvider
from .providers.offline_provider import OFFLINE_NOTICE, OfflineDemoProvider
from .routing import match_verified_problem
from .schemas import (
    AnalyzeRequest,
    AnalyzeResponse,
    HealthResponse,
    TutorRequest,
    TutorResponse,
)

# Log operational events only — NEVER log full user problem statements or API secrets.
logger = logging.getLogger("algomiri.api")


def create_app(
    settings: Optional[Settings] = None,
    provider: Optional[LLMProvider] = None,
) -> FastAPI:
    cfg = settings or load_settings()

    if provider is not None:
        active_provider: LLMProvider = provider
        is_live_ai = True
    elif cfg.ai_configured:
        active_provider = GeminiProvider(
            api_key=cfg.gemini_api_key,
            model=cfg.gemini_model,
            timeout_seconds=cfg.llm_timeout_seconds,
        )
        is_live_ai = True
    else:
        active_provider = OfflineDemoProvider()
        is_live_ai = False

    app = FastAPI(
        title="AlgoMiri AI Analyzer & Tutor API",
        version="0.7.0",
        description=(
            "Conceptual problem analysis and beginner-first tutoring API. "
            "Strictly separated from deterministic visual execution traces."
        ),
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=list(cfg.cors_origins),
        allow_credentials=False,
        allow_methods=["GET", "POST", "OPTIONS"],
        allow_headers=["Content-Type"],
    )

    @app.middleware("http")
    async def enforce_body_size_limit(request: Request, call_next):
        content_length = request.headers.get("content-length")
        if content_length is not None:
            try:
                if int(content_length) > cfg.max_request_body_bytes:
                    return JSONResponse(
                        status_code=413,
                        content={
                            "detail": (
                                f"Request payload exceeds the {cfg.max_request_body_bytes}-byte limit."
                            )
                        },
                    )
            except ValueError:
                return JSONResponse(
                    status_code=400,
                    content={"detail": "Invalid Content-Length header."},
                )
        return await call_next(request)

    @app.get("/health", response_model=HealthResponse)
    async def health() -> HealthResponse:
        return HealthResponse(
            status="ok",
            ai_configured=is_live_ai,
            provider="gemini" if is_live_ai else "offline-demo",
            model=cfg.gemini_model if is_live_ai else "offline-template",
        )

    @app.post("/api/analyze", response_model=AnalyzeResponse)
    async def analyze(payload: AnalyzeRequest) -> AnalyzeResponse:
        if len(payload.problem_statement) > cfg.max_statement_chars:
            raise HTTPException(
                status_code=422,
                detail=f"Problem statement exceeds {cfg.max_statement_chars} characters.",
            )

        logger.info(
            "analyze_request mode=%s char_len=%d",
            "ai" if is_live_ai else "offline-demo",
            len(payload.problem_statement),
        )

        try:
            analysis = await active_provider.analyze_problem(
                payload.problem_statement
            )
        except ProviderTimeoutError as exc:
            logger.warning("analyze_timeout")
            raise HTTPException(
                status_code=504,
                detail="AI analysis timed out. Please retry in a moment.",
            ) from exc
        except MalformedProviderOutputError as exc:
            logger.warning("analyze_malformed_output")
            raise HTTPException(
                status_code=502,
                detail="AI provider returned an invalid structured response. Please retry.",
            ) from exc
        except ProviderError as exc:
            logger.warning("analyze_provider_error")
            raise HTTPException(
                status_code=502,
                detail="AI provider could not complete the request. Please retry.",
            ) from exc

        verified_match = match_verified_problem(
            payload.problem_statement,
            analysis,
        )

        return AnalyzeResponse(
            mode="ai" if is_live_ai else "offline-demo",
            is_ai_generated=is_live_ai,
            verified_execution=False,
            analysis=analysis,
            verified_match=verified_match,
            notice=None if is_live_ai else OFFLINE_NOTICE,
        )

    @app.post("/api/tutor", response_model=TutorResponse)
    async def tutor(payload: TutorRequest) -> TutorResponse:
        logger.info(
            "tutor_request mode=%s action=%s",
            "ai" if is_live_ai else "offline-demo",
            payload.action,
        )

        try:
            tutor_payload = await active_provider.tutor(payload)
        except ProviderTimeoutError as exc:
            logger.warning("tutor_timeout")
            raise HTTPException(
                status_code=504,
                detail="AI tutor timed out. Please retry in a moment.",
            ) from exc
        except MalformedProviderOutputError as exc:
            logger.warning("tutor_malformed_output")
            raise HTTPException(
                status_code=502,
                detail="AI tutor returned an invalid structured response. Please retry.",
            ) from exc
        except ProviderError as exc:
            logger.warning("tutor_provider_error")
            raise HTTPException(
                status_code=502,
                detail="AI tutor could not complete the request. Please retry.",
            ) from exc

        return TutorResponse(
            mode="ai" if is_live_ai else "offline-demo",
            is_ai_generated=is_live_ai,
            verified_execution=False,
            reply=tutor_payload.reply,
            guiding_question=tutor_payload.guiding_question,
            progressive_hint=tutor_payload.progressive_hint,
            notice=None if is_live_ai else OFFLINE_NOTICE,
        )

    return app


app = create_app()
