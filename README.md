# AlgoMiri

**Understand first. Code second.**

AlgoMiri is a beginner-first visual learning platform for studying algorithms and data structures. Learners can paste a programming problem for structured AI conceptual analysis and beginner tutoring, or step through verified deterministic visual studios for Two Sum, Valid Parentheses, and Split Array Largest Sum.

## Current Status (Sprint 7 — AI Problem Analyzer & Beginner Tutor)
- **Verified Deterministic Visual Studios (`web/`):**
  1. **Two Sum (`/studio/two-sum`)**: Brute Force (`O(n²)`) vs. Hash Map (`O(n)`), 4-stage Guided Lesson.
  2. **Valid Parentheses (`/studio/valid-parentheses`)**: Stack (`O(n)`) vertical LIFO visualizer, 4-stage Guided Lesson.
  3. **Split Array Largest Sum (`/studio/split-array-largest-sum`)**: Binary Search on Answer + Greedy Composition (`O(n log S)` time, `O(1)` auxiliary space), Iteration Inspector, 5-stage Guided Lesson.
  - Synchronized **Macro View** (Interactive Solution Map DAG + Accessible List) and **Micro View** (Deterministic Execution Trace), enforced Guided Checkpoints, progressive hints, and dynamic predictions.
- **FastAPI AI Backend (`api/`):**
  - `GET /health`, `POST /api/analyze`, `POST /api/tutor` with strict Pydantic v2 schemas, request-size limits, timeouts, configurable CORS, and server-side `google-genai` SDK integration (`GEMINI_API_KEY`).
  - **Honest Offline Demo Mode:** If `GEMINI_API_KEY` is not set on the server, the API explicitly returns `mode: "offline-demo"` with a clear notice rather than pretending an AI call succeeded.
  - **Semantic Verified vs. Conceptual Routing:** Checks actual problem semantics and constraints before suggesting a verified Studio (rejecting incompatible variants like 3Sum, Longest Valid Parentheses, or negative-number Split Array).
  - **Strict Separation:** AI output is always labeled `AI-Generated · Not Verified` and NEVER fabricates deterministic `ExecutionStep[]` traces or claims skill mastery.
- **Not implemented yet (honest scope):**
  - User accounts, database persistence, payments, code execution sandbox, automatic LeetCode/Codeforces scraping, or universal AI-generated animations.

## Quick Start

### 1. Frontend (`web/`)
```bash
cd web
npm install
npm run dev
```
Open `http://localhost:5173`. Optional: copy `web/.env.example` to `web/.env` to customize `VITE_API_BASE_URL` (defaults to `http://localhost:8000`).

### 2. Backend (`api/`)
```bash
cd api
python -m venv .venv
# Windows PowerShell:
.\.venv\Scripts\Activate.ps1
# macOS / Linux:
# source .venv/bin/activate
pip install -r requirements.txt
copy .env.example .env   # then set GEMINI_API_KEY in api/.env (optional; runs in Offline Demo Mode without it)
uvicorn app.main:app --reload --port 8000
```

### Verification Commands
- **Frontend (`web/`):** `npm run lint`, `npm run test`, `npm run build`
- **Backend (`api/`):** `pytest -q`

## Environment Variables
- `api/.env` (server-side only — never commit real secrets):
  - `GEMINI_API_KEY` — Google Gemini API key (optional; omitting runs in honest `offline-demo` mode)
  - `GEMINI_MODEL` — defaults to `gemini-2.5-flash`
  - `CORS_ORIGINS` — comma-separated allowed origins (default `http://localhost:5173,http://127.0.0.1:5173`)
  - `LLM_TIMEOUT_SECONDS` — default `25`
  - `MAX_STATEMENT_CHARS` — default `6000`
  - `MAX_REQUEST_BODY_BYTES` — default `32768`
- `web/.env` (public client config only):
  - `VITE_API_BASE_URL` — defaults to `http://localhost:8000`

## Product Docs
- [`docs/PRD.md`](docs/PRD.md)
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
- [`docs/TEST_CASES.md`](docs/TEST_CASES.md)
- [`docs/ANTIGRAVITY_PROMPTS.md`](docs/ANTIGRAVITY_PROMPTS.md)

## Key Principle
**Algorithm execution traces must be generated from deterministic, tested code.** AI analysis teaches, decomposes, and tutors conceptually, but unverified AI output is never displayed as real execution.
