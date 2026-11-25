from __future__ import annotations

import ipaddress
import re
import socket
from typing import Optional
from urllib.parse import urljoin, urlparse

import httpx

from .schemas import InspectUrlResponse, SupportedProblemId, VerifiedMatchInfo

VERIFIED_LEETCODE_SLUGS: dict[str, tuple[SupportedProblemId, str, str]] = {
    "two-sum": ("two-sum", "Two Sum", "/studio/two-sum"),
    "valid-parentheses": (
        "valid-parentheses",
        "Valid Parentheses",
        "/studio/valid-parentheses",
    ),
    "split-array-largest-sum": (
        "split-array-largest-sum",
        "Split Array Largest Sum",
        "/studio/split-array-largest-sum",
    ),
}

# Only explicit public raw-text hosts are eligible for automated content retrieval.
# Proprietary platforms like LeetCode are NEVER scraped, crawled, or queried via unofficial APIs.
ALLOWED_FETCH_HOSTS: frozenset[str] = frozenset(
    {
        "raw.githubusercontent.com",
        "gist.githubusercontent.com",
    }
)

MAX_FETCH_BYTES = 32_768
MAX_REDIRECTS = 2
FETCH_TIMEOUT_SECONDS = 8.0

LEETCODE_SLUG_RE = re.compile(
    r"^/problems/(?P<slug>[a-z0-9]+(?:-[a-z0-9]+)*)(?:/.*)?$",
    re.IGNORECASE,
)


class UrlValidationError(ValueError):
    """Raised when a user-supplied URL is malformed or disallowed."""


def _slug_to_title(slug: str) -> str:
    return " ".join(part.capitalize() for part in slug.split("-") if part)


def _validate_public_ip_for_host(hostname: str) -> None:
    """
    SSRF defense: resolves hostname and rejects any non-global IP address
    (loopback, private RFC1918, link-local / cloud metadata, multicast, reserved).
    """
    try:
        # Reject raw IP literals immediately
        ipaddress.ip_address(hostname)
        raise UrlValidationError("Direct IP address URLs are not allowed.")
    except ValueError:
        pass

    try:
        addr_infos = socket.getaddrinfo(hostname, 443, type=socket.SOCK_STREAM)
    except OSError as exc:
        raise UrlValidationError("Could not resolve the URL hostname safely.") from exc

    if not addr_infos:
        raise UrlValidationError("Could not resolve the URL hostname safely.")

    for info in addr_infos:
        ip_str = str(info[4][0])
        try:
            ip_obj = ipaddress.ip_address(ip_str)
        except ValueError as exc:
            raise UrlValidationError("Resolved host returned an invalid IP address.") from exc
        if not ip_obj.is_global:
            raise UrlValidationError(
                "Blocked non-public network address for SSRF protection."
            )


def _validate_https_url(raw_url: str) -> tuple[str, str, str]:
    cleaned = raw_url.strip()
    if not cleaned or len(cleaned) > 2048:
        raise UrlValidationError("Please enter a valid HTTPS problem URL.")

    parsed = urlparse(cleaned)
    if parsed.scheme.lower() != "https":
        raise UrlValidationError("Only HTTPS URLs are supported.")
    if not parsed.hostname:
        raise UrlValidationError("URL must include a valid domain name.")
    if parsed.username or parsed.password:
        raise UrlValidationError("URLs with embedded credentials are not allowed.")

    host = parsed.hostname.lower().rstrip(".")
    return cleaned, host, parsed.path or "/"


async def _safe_fetch_allowlisted_text(url: str) -> str:
    current_url = url
    async with httpx.AsyncClient(
        timeout=FETCH_TIMEOUT_SECONDS,
        follow_redirects=False,
        headers={"User-Agent": "AlgoMiri-SafeFetcher/1.0"},
    ) as client:
        for _ in range(MAX_REDIRECTS + 1):
            _, host, _ = _validate_https_url(current_url)
            if host not in ALLOWED_FETCH_HOSTS:
                raise UrlValidationError(
                    "Redirected host is not in AlgoMiri's explicit public text allowlist."
                )
            _validate_public_ip_for_host(host)

            async with client.stream("GET", current_url) as response:
                if response.status_code in (301, 302, 303, 307, 308):
                    location = response.headers.get("location")
                    if not location:
                        raise UrlValidationError("Redirect response lacked a Location header.")
                    current_url = urljoin(current_url, location)
                    continue

                if response.status_code != 200:
                    raise UrlValidationError(
                        f"Remote host returned HTTP {response.status_code}."
                    )

                content_type = (response.headers.get("content-type") or "").lower()
                if not (
                    content_type.startswith("text/plain")
                    or content_type.startswith("text/markdown")
                ):
                    raise UrlValidationError(
                        "Only plain-text or Markdown files can be fetched automatically."
                    )

                chunks: list[bytes] = []
                total = 0
                async for chunk in response.aiter_bytes():
                    total += len(chunk)
                    if total > MAX_FETCH_BYTES:
                        raise UrlValidationError(
                            f"Remote text exceeds the {MAX_FETCH_BYTES}-byte limit."
                        )
                    chunks.append(chunk)

                text = b"".join(chunks).decode("utf-8", errors="replace").strip()
                if len(text) < 10:
                    raise UrlValidationError("Fetched document did not contain enough text.")
                return text[:6000]

    raise UrlValidationError("Too many redirects while fetching URL.")


async def inspect_problem_url(raw_url: str) -> InspectUrlResponse:
    """
    Validates a user-supplied URL, identifies canonical source metadata safely,
    never scrapes proprietary problem platforms (like LeetCode), and only fetches
    text from explicitly allowlisted public raw-text hosts with SSRF protection.
    """
    cleaned, host, path = _validate_https_url(raw_url)

    # 1. Canonical LeetCode URL recognition — NEVER scrape or call unofficial GraphQL endpoints
    if host in {"leetcode.com", "www.leetcode.com", "leetcode.cn", "www.leetcode.cn"}:
        match = LEETCODE_SLUG_RE.match(path)
        if not match:
            return InspectUrlResponse(
                original_url=cleaned,
                canonical_url=cleaned,
                source_name="LeetCode",
                retrieval_status="restricted_source",
                message=(
                    "Recognized LeetCode link, but no problem slug was found. "
                    "AlgoMiri does not scrape LeetCode — please paste the problem text or upload a screenshot."
                ),
            )

        slug = match.group("slug").lower()
        title = _slug_to_title(slug)
        canonical = f"https://leetcode.com/problems/{slug}/"

        # Check if this exact canonical slug corresponds to one of our 3 verified Studios (reference link only)
        verified_hint: Optional[VerifiedMatchInfo] = None
        if slug in VERIFIED_LEETCODE_SLUGS:
            problem_id, studio_title, studio_path = VERIFIED_LEETCODE_SLUGS[slug]
            verified_hint = VerifiedMatchInfo(
                status="verified",
                matched_problem_id=problem_id,
                matched_problem_title=studio_title,
                studio_path=studio_path,
                reason=f"AlgoMiri includes a built-in verified interactive Studio for {studio_title}.",
                compatibility_checks=[f"Canonical slug '{slug}' matches built-in Studio."],
                user_input_note="Opening the Studio uses AlgoMiri's original curated examples (LeetCode content is not scraped).",
            )

        return InspectUrlResponse(
            original_url=cleaned,
            canonical_url=canonical,
            source_name="LeetCode",
            slug=slug,
            display_title=title,
            retrieval_status="restricted_source",
            message=(
                f"Recognized LeetCode problem “{title}” ({slug}). "
                "AlgoMiri does not scrape or fetch copyrighted LeetCode statements automatically. "
                "Paste the problem statement or upload a screenshot to analyze it."
            ),
            verified_match=verified_hint,
        )

    # 2. Controlled fetching for explicitly allowlisted public raw-text hosts only
    if host in ALLOWED_FETCH_HOSTS:
        try:
            text = await _safe_fetch_allowlisted_text(cleaned)
            return InspectUrlResponse(
                original_url=cleaned,
                canonical_url=cleaned,
                source_name="GitHub Raw Text",
                retrieval_status="fetched",
                message="Fetched public plain-text content safely. Review the text before analyzing.",
                extracted_text=text,
            )
        except (UrlValidationError, httpx.HTTPError) as exc:
            return InspectUrlResponse(
                original_url=cleaned,
                canonical_url=cleaned,
                source_name="GitHub Raw Text",
                retrieval_status="fetch_failed",
                message=(
                    f"Could not fetch text from this URL ({exc}). "
                    "Please paste the problem text or upload a screenshot instead."
                ),
            )

    # 3. Any other public site: never silently scrape; preserve link and request manual input
    return InspectUrlResponse(
        original_url=cleaned,
        canonical_url=cleaned,
        source_name=host,
        retrieval_status="manual_input_required",
        message=(
            f"Saved reference link to {host}. AlgoMiri only fetches from explicitly allowlisted public raw-text sources — "
            "please paste the problem text or upload a screenshot to continue."
        ),
    )
