from __future__ import annotations

import base64
import binascii
import logging
from contextlib import asynccontextmanager
from typing import Any, Optional

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .config import Settings, load_settings
from .guards import (
    ConcurrencyGuard,
    DailyRequestBudget,
    GuardRejectedError,
    SlidingWindowRateLimiter,
)
from .providers.base import (
    LLMProvider,
    MalformedProviderOutputError,
    ProviderAuthError,
    ProviderBadRequestError,
    ProviderError,
    ProviderModelNotFoundError,
    ProviderRateLimitError,
    ProviderTimeoutError,
    ProviderTransientError,
)
from .providers.gemini_provider import GeminiProvider
from .providers.offline_provider import OFFLINE_NOTICE, OfflineDemoProvider, offline_notice
from .routing import match_verified_problem
from .schemas import (
    AnalyzeRequest,
    AnalyzeResponse,
    HealthResponse,
    ImageExtractionRequest,
    ImageExtractionResponse,
    InspectUrlRequest,
    InspectUrlResponse,
    TutorRequest,
    TutorResponse,
)
from .url_inspector import UrlValidationError, inspect_problem_url

MAX_IMAGE_FILE_BYTES = 4 * 1024 * 1024
MAX_TOTAL_IMAGE_BYTES = 10 * 1024 * 1024
IMAGE_EXTRACT_BODY_LIMIT_BYTES = 15 * 1024 * 1024


def _verify_image_magic_bytes(mime_type: str, data: bytes) -> bool:
    if mime_type == "image/png":
        return data.startswith(b"\x89PNG\r\n\x1a\n")
    if mime_type == "image/jpeg":
        return data.startswith(b"\xff\xd8\xff")
    if mime_type == "image/webp":
        return len(data) >= 12 and data[:4] == b"RIFF" and data[8:12] == b"WEBP"
    return False

# Log operational events only — NEVER log full user problem statements or API secrets.
logger = logging.getLogger("algomiri.api")


class BodySizeLimitMiddleware:
    """
    Pure ASGI middleware that enforces maximum request body bytes even when
    Content-Length is omitted (e.g., Transfer-Encoding: chunked).
    """

    def __init__(
        self,
        app: Any,
        max_bytes: int,
        path_limits: Optional[dict[str, int]] = None,
    ) -> None:
        self.app = app
        self.max_bytes = max_bytes
        self.path_limits = path_limits or {}

    async def __call__(self, scope: dict[str, Any], receive: Any, send: Any) -> None:
        if scope.get("type") != "http" or scope.get("method") not in {
            "POST",
            "PUT",
            "PATCH",
        }:
            await self.app(scope, receive, send)
            return

        effective_limit = self.path_limits.get(scope.get("path", ""), self.max_bytes)

        headers = dict(scope.get("headers") or [])
        raw_cl = headers.get(b"content-length")
        if raw_cl is not None:
            try:
                if int(raw_cl.decode("ascii")) > effective_limit:
                    response = JSONResponse(
                        status_code=413,
                        content={
                            "detail": (
                                f"Request payload exceeds the {effective_limit}-byte limit."
                            )
                        },
                    )
                    await response(scope, receive, send)
                    return
            except (ValueError, UnicodeDecodeError):
                response = JSONResponse(
                    status_code=400,
                    content={"detail": "Invalid Content-Length header."},
                )
                await response(scope, receive, send)
                return

        chunks: list[bytes] = []
        total_bytes = 0
        more_body = True

        while more_body:
            message = await receive()
            if message.get("type") == "http.disconnect":
                return
            chunk = message.get("body", b"")
            total_bytes += len(chunk)
            if total_bytes > effective_limit:
                response = JSONResponse(
                    status_code=413,
                    content={
                        "detail": (
                            f"Request payload exceeds the {effective_limit}-byte limit."
                        )
                    },
                )
                await response(scope, receive, send)
                return
            if chunk:
                chunks.append(chunk)
            more_body = bool(message.get("more_body", False))

        full_body = b"".join(chunks)
        body_replayed = False

        async def replay_receive() -> dict[str, Any]:
            nonlocal body_replayed
            if not body_replayed:
                body_replayed = True
                return {
                    "type": "http.request",
                    "body": full_body,
                    "more_body": False,
                }
            return {"type": "http.request", "body": b"", "more_body": False}

        await self.app(scope, replay_receive, send)


def _client_key(request: Request) -> str:
    if request.client and request.client.host:
        return request.client.host
    return "unknown"


def _raise_provider_http_error(exc: ProviderError) -> None:
    if isinstance(exc, ProviderTimeoutError):
        logger.warning("provider_timeout")
        raise HTTPException(
            status_code=504,
            detail="AI request timed out. Please retry in a moment.",
        ) from None
    if isinstance(exc, ProviderAuthError):
        logger.error("provider_auth_error")
        raise HTTPException(
            status_code=503,
            detail=(
                "AI service credentials are invalid or unauthorized on the server. "
                "Built-in verified Studios remain available."
            ),
        ) from None
    if isinstance(exc, ProviderModelNotFoundError):
        logger.error("provider_model_not_found")
        raise HTTPException(
            status_code=503,
            detail=(
                "Configured AI model is unavailable on the upstream provider. "
                "Update GEMINI_MODEL on the server or use the built-in verified Studios."
            ),
        ) from None
    if isinstance(exc, ProviderBadRequestError):
        logger.error("provider_bad_request")
        raise HTTPException(
            status_code=502,
            detail=(
                "Upstream AI provider rejected the request schema or format. "
                "Please retry or report this server issue."
            ),
        ) from None
    if isinstance(exc, ProviderRateLimitError):
        logger.warning("provider_rate_limit")
        raise HTTPException(
            status_code=429,
            detail="AI service is temporarily rate-limited. Please retry shortly.",
            headers={"Retry-After": str(exc.retry_after_seconds)},
        ) from None
    if isinstance(exc, MalformedProviderOutputError):
        logger.warning("provider_malformed_output")
        raise HTTPException(
            status_code=502,
            detail="AI provider returned an invalid structured response. Please retry.",
        ) from None
    if isinstance(exc, ProviderTransientError):
        logger.warning("provider_transient_error")
        raise HTTPException(
            status_code=503,
            detail="AI provider is temporarily unavailable. Please retry in a moment.",
        ) from None
    logger.warning("provider_error")
    raise HTTPException(
        status_code=502,
        detail="AI provider could not complete the request. Please retry.",
    ) from None


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
            api_key=cfg.get_gemini_api_key(),
            model=cfg.gemini_model,
            timeout_seconds=cfg.llm_timeout_seconds,
            max_retries=cfg.llm_max_retries,
        )
        is_live_ai = True
    else:
        active_provider = OfflineDemoProvider()
        is_live_ai = False

    rate_limiter = SlidingWindowRateLimiter(cfg.rate_limit_per_minute)
    daily_budget = DailyRequestBudget(cfg.daily_request_budget)
    concurrency_guard = ConcurrencyGuard(cfg.max_concurrent_llm_requests)

    @asynccontextmanager
    async def lifespan(_app: FastAPI):
        yield
        if hasattr(active_provider, "aclose"):
            await active_provider.aclose()

    app = FastAPI(
        title="AlgoMiri AI Analyzer & Tutor API",
        version="0.7.1",
        description=(
            "Conceptual problem analysis and beginner-first tutoring API. "
            "Strictly separated from deterministic visual execution traces."
        ),
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=list(cfg.cors_origins),
        allow_credentials=False,
        allow_methods=["GET", "POST", "OPTIONS"],
        allow_headers=["Content-Type"],
    )
    app.add_middleware(
        BodySizeLimitMiddleware,
        max_bytes=cfg.max_request_body_bytes,
        path_limits={"/api/extract-image": IMAGE_EXTRACT_BODY_LIMIT_BYTES},
    )

    def enforce_guards(request: Request) -> None:
        try:
            rate_limiter.check_and_record(_client_key(request))
            daily_budget.check_and_consume()
        except GuardRejectedError as exc:
            raise HTTPException(
                status_code=429,
                detail=exc.detail,
                headers={"Retry-After": str(exc.retry_after_seconds)},
            ) from None

    @app.get("/health", response_model=HealthResponse)
    async def health() -> HealthResponse:
        return HealthResponse(
            status="ok",
            ai_configured=is_live_ai,
            provider="gemini" if is_live_ai else "offline-demo",
            model=cfg.gemini_model if is_live_ai else "offline-template",
        )

    @app.post("/api/analyze", response_model=AnalyzeResponse)
    async def analyze(payload: AnalyzeRequest, request: Request) -> AnalyzeResponse:
        if len(payload.problem_statement) > cfg.max_statement_chars:
            raise HTTPException(
                status_code=422,
                detail=f"Problem statement exceeds {cfg.max_statement_chars} characters.",
            )

        enforce_guards(request)

        try:
            await concurrency_guard.acquire()
        except GuardRejectedError as exc:
            raise HTTPException(
                status_code=429,
                detail=exc.detail,
                headers={"Retry-After": str(exc.retry_after_seconds)},
            ) from None

        logger.info(
            "analyze_request mode=%s char_len=%d",
            "ai" if is_live_ai else "offline-demo",
            len(payload.problem_statement),
        )

        try:
            analysis = await active_provider.analyze_problem(
                payload.problem_statement,
                payload.locale,
            )
        except ProviderError as exc:
            _raise_provider_http_error(exc)
            raise  # unreachable; keeps type checker happy
        finally:
            await concurrency_guard.release()

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
            notice=None if is_live_ai else offline_notice(payload.locale),
        )

    @app.post("/api/tutor", response_model=TutorResponse)
    async def tutor(payload: TutorRequest, request: Request) -> TutorResponse:
        serialized_size = len(payload.model_dump_json().encode("utf-8"))
        if serialized_size > cfg.max_tutor_request_bytes:
            raise HTTPException(
                status_code=413,
                detail=(
                    f"Structured tutor request exceeds the {cfg.max_tutor_request_bytes}-byte limit."
                ),
            )

        enforce_guards(request)

        try:
            await concurrency_guard.acquire()
        except GuardRejectedError as exc:
            raise HTTPException(
                status_code=429,
                detail=exc.detail,
                headers={"Retry-After": str(exc.retry_after_seconds)},
            ) from None

        logger.info(
            "tutor_request mode=%s action=%s",
            "ai" if is_live_ai else "offline-demo",
            payload.action,
        )

        try:
            tutor_payload = await active_provider.tutor(payload)
        except ProviderError as exc:
            _raise_provider_http_error(exc)
            raise
        finally:
            await concurrency_guard.release()

        return TutorResponse(
            mode="ai" if is_live_ai else "offline-demo",
            is_ai_generated=is_live_ai,
            verified_execution=False,
            reply=tutor_payload.reply,
            guiding_question=tutor_payload.guiding_question,
            progressive_hint=tutor_payload.progressive_hint,
            mastery_disclaimer=(
                "Gia sư AI hỗ trợ hiểu khái niệm nhưng không xác minh việc thực thi mã "
                "hoặc đo lường mức độ thành thạo kỹ năng lâu dài."
                if payload.locale == "vi"
                else "AI tutoring supports conceptual understanding and does not verify code "
                "execution or measure long-term skill mastery."
            ),
            notice=None if is_live_ai else offline_notice(payload.locale),
        )

    @app.post("/api/inspect-url", response_model=InspectUrlResponse)
    async def inspect_url(
        payload: InspectUrlRequest, request: Request
    ) -> InspectUrlResponse:
        enforce_guards(request)
        try:
            return await inspect_problem_url(payload.url)
        except UrlValidationError as exc:
            raise HTTPException(status_code=422, detail=str(exc)) from None

    @app.post("/api/extract-image", response_model=ImageExtractionResponse)
    async def extract_image(
        payload: ImageExtractionRequest, request: Request
    ) -> ImageExtractionResponse:
        enforce_guards(request)

        decoded_images: list[tuple[str, bytes]] = []
        total_bytes = 0
        for item in payload.images:
            try:
                raw = base64.b64decode(item.data_base64, validate=True)
            except (binascii.Error, ValueError):
                raise HTTPException(
                    status_code=422,
                    detail=f"Image '{item.filename}' is not valid base64 data.",
                ) from None

            if len(raw) == 0 or len(raw) > MAX_IMAGE_FILE_BYTES:
                raise HTTPException(
                    status_code=413,
                    detail=(
                        f"Image '{item.filename}' exceeds the 4 MB per-image limit."
                    ),
                )

            if not _verify_image_magic_bytes(item.mime_type, raw):
                raise HTTPException(
                    status_code=422,
                    detail=(
                        f"Image '{item.filename}' content does not match declared type {item.mime_type}."
                    ),
                )

            total_bytes += len(raw)
            if total_bytes > MAX_TOTAL_IMAGE_BYTES:
                raise HTTPException(
                    status_code=413,
                    detail="Combined uploaded images exceed the 10 MB total limit.",
                )
            decoded_images.append((item.mime_type, raw))

        try:
            await concurrency_guard.acquire()
        except GuardRejectedError as exc:
            raise HTTPException(
                status_code=429,
                detail=exc.detail,
                headers={"Retry-After": str(exc.retry_after_seconds)},
            ) from None

        logger.info(
            "extract_image_request mode=%s count=%d total_bytes=%d",
            "ai" if is_live_ai else "offline-demo",
            len(decoded_images),
            total_bytes,
        )

        try:
            extracted = await active_provider.extract_problem_from_images(decoded_images)
        except ProviderError as exc:
            _raise_provider_http_error(exc)
            raise
        finally:
            await concurrency_guard.release()

        return ImageExtractionResponse(
            mode="ai" if is_live_ai else "offline-demo",
            is_ai_generated=is_live_ai,
            extracted_text=extracted.extracted_text,
            diagram_notes=extracted.diagram_notes,
            uncertain_regions=extracted.uncertain_regions,
            needs_confirmation=True,
            notice=None if is_live_ai else OFFLINE_NOTICE,
        )

    return app


app = create_app()
