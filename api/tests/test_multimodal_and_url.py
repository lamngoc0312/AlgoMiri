from __future__ import annotations

import base64
from dataclasses import dataclass

from fastapi.testclient import TestClient

from app.config import Settings
from app.main import create_app
from app.providers.base import (
    ProviderBadRequestError,
    ProviderModelNotFoundError,
)
from app.providers.gemini_provider import (
    build_gemini_json_schema,
    classify_upstream_exception,
)
from app.schemas import ImageExtractionPayload, ProblemAnalysis, TutorPayload, TutorRequest
from app.url_inspector import _validate_public_ip_for_host, UrlValidationError

# Minimal valid 1x1 PNG bytes
VALID_PNG_BYTES = (
    b"\x89PNG\r\n\x1a\n"
    b"\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde"
    b"\x00\x00\x00\x0cIDATx\x9cc\xf8\x0f\x00\x00\x01\x01\x00\x05\x18\xd8N"
    b"\x00\x00\x00\x00IEND\xaeB`\x82"
)


class FakeVisionProvider:
    async def analyze_problem(
        self, problem_statement: str, locale: str = "en"
    ) -> ProblemAnalysis:
        raise NotImplementedError

    async def tutor(self, request: TutorRequest) -> TutorPayload:
        raise NotImplementedError

    async def extract_problem_from_images(
        self, images: list[tuple[str, bytes]]
    ) -> ImageExtractionPayload:
        assert len(images) == 1
        assert images[0][0] == "image/png"
        return ImageExtractionPayload(
            extracted_text="Given a signed 32-bit integer x, return x with its digits reversed. Range: [-2^31, 2^31 - 1].",
            diagram_notes=["Example table: x = -123 -> Output = -321"],
            uncertain_regions=[],
        )

    async def aclose(self) -> None:
        return None


def test_gemini_schema_strips_additional_properties() -> None:
    schema = build_gemini_json_schema(ProblemAnalysis)
    serialized = str(schema)
    assert "additionalProperties" not in serialized
    assert "title" in serialized
    assert "worked_example" in serialized


def test_classify_upstream_404_and_400() -> None:
    @dataclass
    class DummyErr(Exception):
        code: int
        msg: str

        def __str__(self) -> str:
            return self.msg

    err_404 = classify_upstream_exception(DummyErr(404, "404 NOT_FOUND model deprecated"))
    err_400 = classify_upstream_exception(DummyErr(400, "400 INVALID_ARGUMENT unknown field"))
    assert isinstance(err_404, ProviderModelNotFoundError)
    assert isinstance(err_400, ProviderBadRequestError)


def test_inspect_leetcode_url_recognizes_slug_without_scraping() -> None:
    app = create_app(settings=Settings())
    with TestClient(app) as client:
        res = client.post(
            "/api/inspect-url",
            json={"url": "https://leetcode.com/problems/reverse-integer/description/"},
        )
        assert res.status_code == 200
        body = res.json()
        assert body["source_name"] == "LeetCode"
        assert body["slug"] == "reverse-integer"
        assert body["display_title"] == "Reverse Integer"
        assert body["canonical_url"] == "https://leetcode.com/problems/reverse-integer/"
        assert body["retrieval_status"] == "restricted_source"
        assert body["extracted_text"] is None
        assert body["verified_match"] is None

        # Verified Two Sum LeetCode URL provides reference match without scraping
        res_ts = client.post(
            "/api/inspect-url",
            json={"url": "https://leetcode.com/problems/two-sum/"},
        )
        assert res_ts.status_code == 200
        ts_body = res_ts.json()
        assert ts_body["slug"] == "two-sum"
        assert ts_body["verified_match"]["status"] == "verified"
        assert ts_body["verified_match"]["studio_path"] == "/studio/two-sum"


def test_inspect_url_rejects_http_and_ssrf_and_handles_unlisted_host() -> None:
    app = create_app(settings=Settings())
    with TestClient(app) as client:
        # HTTP rejected
        res_http = client.post(
            "/api/inspect-url",
            json={"url": "http://leetcode.com/problems/reverse-integer/"},
        )
        assert res_http.status_code == 422

        # Embedded credentials rejected
        res_cred = client.post(
            "/api/inspect-url",
            json={"url": "https://user:pass@raw.githubusercontent.com/a/b"},
        )
        assert res_cred.status_code == 422

        # Unlisted public site does not scrape; asks for manual text or screenshot
        res_other = client.post(
            "/api/inspect-url",
            json={"url": "https://example.com/custom-problem"},
        )
        assert res_other.status_code == 200
        assert res_other.json()["retrieval_status"] == "manual_input_required"

    # Direct IP literal blocked by SSRF check
    try:
        _validate_public_ip_for_host("127.0.0.1")
        raise AssertionError("Expected UrlValidationError for loopback IP")
    except UrlValidationError:
        pass


def test_extract_image_validates_magic_bytes_and_runs_vision_provider() -> None:
    app = create_app(settings=Settings(), provider=FakeVisionProvider())
    with TestClient(app) as client:
        # Invalid magic bytes pretending to be PNG
        bad_res = client.post(
            "/api/extract-image",
            json={
                "images": [
                    {
                        "filename": "fake.png",
                        "mime_type": "image/png",
                        "data_base64": base64.b64encode(b"not-a-real-png-file-at-all").decode(),
                    }
                ]
            },
        )
        assert bad_res.status_code == 422

        # Valid PNG processed cleanly with confirmation required
        ok_res = client.post(
            "/api/extract-image",
            json={
                "images": [
                    {
                        "filename": "reverse-int.png",
                        "mime_type": "image/png",
                        "data_base64": base64.b64encode(VALID_PNG_BYTES).decode(),
                    }
                ]
            },
        )
        assert ok_res.status_code == 200
        body = ok_res.json()
        assert body["mode"] == "ai"
        assert body["needs_confirmation"] is True
        assert "[-2^31, 2^31 - 1]" in body["extracted_text"]
        assert len(body["diagram_notes"]) == 1


def test_extract_image_offline_mode_is_honest() -> None:
    app = create_app(settings=Settings())
    with TestClient(app) as client:
        res = client.post(
            "/api/extract-image",
            json={
                "images": [
                    {
                        "filename": "screenshot.png",
                        "mime_type": "image/png",
                        "data_base64": base64.b64encode(VALID_PNG_BYTES).decode(),
                    }
                ]
            },
        )
        assert res.status_code == 200
        body = res.json()
        assert body["mode"] == "offline-demo"
        assert body["is_ai_generated"] is False
        assert body["needs_confirmation"] is True
        assert "unavailable" in body["extracted_text"].lower()
