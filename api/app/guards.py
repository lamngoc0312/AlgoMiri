from __future__ import annotations

import asyncio
import math
import time
from collections import deque
from datetime import datetime, timezone
from typing import Callable


class GuardRejectedError(Exception):
    """Raised when rate limit, daily budget, or concurrency guard rejects a request."""

    def __init__(self, detail: str, retry_after_seconds: int) -> None:
        super().__init__(detail)
        self.detail = detail
        self.retry_after_seconds = max(1, int(retry_after_seconds))


class SlidingWindowRateLimiter:
    """In-memory per-client sliding-window rate limiter (60-second window)."""

    def __init__(
        self,
        max_requests_per_minute: int,
        clock: Callable[[], float] = time.monotonic,
    ) -> None:
        self._limit = max_requests_per_minute
        self._clock = clock
        self._window_seconds = 60.0
        self._buckets: dict[str, deque[float]] = {}

    def check_and_record(self, client_key: str) -> None:
        now = self._clock()
        bucket = self._buckets.setdefault(client_key, deque())
        cutoff = now - self._window_seconds
        while bucket and bucket[0] <= cutoff:
            bucket.popleft()

        if len(bucket) >= self._limit:
            oldest = bucket[0]
            retry_after = max(1, math.ceil((oldest + self._window_seconds) - now))
            raise GuardRejectedError(
                detail=(
                    f"Rate limit exceeded ({self._limit} requests/minute). "
                    f"Please retry in {retry_after} second(s)."
                ),
                retry_after_seconds=retry_after,
            )

        bucket.append(now)


class DailyRequestBudget:
    """In-memory UTC daily request budget to protect upstream LLM spend."""

    def __init__(
        self,
        max_requests_per_day: int,
        utc_now: Callable[[], datetime] = lambda: datetime.now(timezone.utc),
    ) -> None:
        self._limit = max_requests_per_day
        self._utc_now = utc_now
        self._day_key: str = ""
        self._count: int = 0

    def check_and_consume(self) -> None:
        now = self._utc_now()
        today = now.strftime("%Y-%m-%d")
        if today != self._day_key:
            self._day_key = today
            self._count = 0

        if self._count >= self._limit:
            seconds_until_reset = max(
                60,
                86400 - (now.hour * 3600 + now.minute * 60 + now.second),
            )
            raise GuardRejectedError(
                detail=(
                    "Daily AI request budget has been reached for this server instance. "
                    "Verified deterministic Studios remain available without limits."
                ),
                retry_after_seconds=seconds_until_reset,
            )

        self._count += 1


class ConcurrencyGuard:
    """Non-blocking concurrency cap so bursts fail fast with 429 instead of queuing indefinitely."""

    def __init__(self, max_concurrent: int) -> None:
        self._max_concurrent = max_concurrent
        self._active = 0
        self._lock = asyncio.Lock()

    async def acquire(self) -> None:
        async with self._lock:
            if self._active >= self._max_concurrent:
                raise GuardRejectedError(
                    detail=(
                        "AI backend is currently handling the maximum number of concurrent requests. "
                        "Please retry shortly."
                    ),
                    retry_after_seconds=3,
                )
            self._active += 1

    async def release(self) -> None:
        async with self._lock:
            self._active = max(0, self._active - 1)
