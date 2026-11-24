# AlgoMiri

**Understand first. Code second.**

AlgoMiri is a beginner-first visual learning platform for studying algorithms and data structures. Learners can paste a programming problem for structured AI conceptual analysis and beginner tutoring, or step through verified deterministic visual studios for Two Sum, Valid Parentheses, and Split Array Largest Sum.

## Current Status (Sprint 8 — Learning Progress, Skill Evidence & Local History)
- **Verified Deterministic Visual Studios (`web/`):**
  1. **Two Sum (`/studio/two-sum`)**: Brute Force (`O(n²)`) vs. Hash Map (`O(n)`), 4-stage Guided Lesson.
  2. **Valid Parentheses (`/studio/valid-parentheses`)**: Stack (`O(n)`) vertical LIFO visualizer, 4-stage Guided Lesson.
  3. **Split Array Largest Sum (`/studio/split-array-largest-sum`)**: Binary Search on Answer + Greedy Composition (`O(n log S)` time, `O(1)` auxiliary space), Iteration Inspector, 5-stage Guided Lesson.
  - Synchronized **Macro View** (Interactive Solution Map DAG + Accessible List) and **Micro View** (Deterministic Execution Trace), enforced Guided Checkpoints, progressive hints, and dynamic predictions.
- **Evidence-Based Learning Progress & Local History (`/progress`):**
  - Replaces demo progress stats with real, locally persisted learning sessions (`localStorage`, versioned schema `v1` with automatic `v0 -> v1` migration and corruption recovery).
  - Tracks 8 core skills (`Array Indexing`, `Brute Force`, `Hash Map Lookup`, `Stack / LIFO`, `Binary Search on Answer`, `Greedy Feasibility`, `Algorithm Composition`, `Time and Space Complexity`) across cautious evidence levels (`Viewed`, `Attempted`, `Correct with assistance`, `First-try correct`, with `Independently Demonstrated` reserved for future unassisted assessments).
  - Deduplicates saves by stable `sessionId`; restarting a lesson creates a fresh session without altering earlier records.
  - Provides honest empty states (no fabricated stats or fake streaks), rule-based deterministic next-practice suggestions with clear explanations, and one-click confirmed **Clear Local History**.
  - **Privacy & Local-Only Scope:** History is saved **only in the current browser** and is not synchronized across devices. API keys, private pasted problem statements, and AI Tutor conversations are never stored or counted as verified mastery.
- **Hardened FastAPI AI Backend (`api/`):**
  - `GET /health`, `POST /api/analyze`, `POST /api/tutor` with strict Pydantic v2 schemas, automatic `api/.env` loading (real OS environment variables always take precedence), managed async `google-genai` SDK client with explicit timeouts and bounded retries on transient errors only, streaming request-body byte caps (enforced even without `Content-Length`), per-client rate limits, daily request budget, concurrency guard, and strict non-wildcard CORS.
  - **Honest Offline Demo Mode:** If `GEMINI_API_KEY` is not set in OS env or `api/.env`, the API explicitly returns `mode: "offline-demo"` with a clear notice rather than pretending an AI call succeeded.
  - **Strict Semantic Compatibility Routing:** Separates problem-family recognition from compatibility checks (`verified`, `ambiguous`, `conceptual_only`), properly recognizing `"non-negative"`, `"nonnegative"`, and `"positive"` Split Array inputs while rejecting incompatible variants (e.g., Two Sum II, counting pairs, Subarray Sum Equals K, 3Sum, Remove Invalid Parentheses, wildcard `*`, negative-number Split Array).
  - **Strict Separation & Stale-State Safety:** AI output is always labeled `AI-Generated · Conceptual (Not Verified)`, never fabricates deterministic `ExecutionStep[]` traces or claims skill mastery, flags outdated results if you edit the problem text, and resets AI Tutor state on context change.
- **Not implemented yet (honest scope):**
  - User accounts, authentication, database persistence, cross-device sync, payments, code execution sandbox, automatic LeetCode/Codeforces scraping, or universal AI-generated animations.

## Quick Start

### 1. Frontend (`web/`)
```bash
cd web
npm install
npm run dev
```
Open `http://localhost:5173`. Optional: copy `web/.env.example` to `web/.env` to customize `VITE_API_BASE_URL` (defaults to `http://localhost:8000`).

### 2. Backend (`api/`)

**Windows PowerShell:**
```powershell
cd api
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
# Optional: edit api/.env and set GEMINI_API_KEY (without it, the API runs honestly in Offline Demo Mode)
uvicorn app.main:app --reload --port 8000
```

**Windows Command Prompt (`cmd.exe`):**
```cmd
cd api
python -m venv .venv
.venv\Scripts\activate.bat
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload --port 8000
```

**macOS / Linux:**
```bash
cd api
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```

> **Configuration precedence:** `api/app/config.py` automatically loads `api/.env` for local development, and real OS environment variables always override values from `api/.env`. Secrets are stored using `SecretStr` and never logged.

### Verification Commands
- **Frontend (`web/`):** `npm run lint`, `npm run test`, `npm run build`
- **Backend (`api/`):** `pytest -q` (from `api/` with the virtual environment activated, or `.\.venv\Scripts\pytest -q` on Windows)

## Environment Variables
- `api/.env` (server-side only — never commit real secrets):
  - `GEMINI_API_KEY` — Google Gemini API key (optional; omitting runs in honest `offline-demo` mode)
  - `GEMINI_MODEL` — defaults to `gemini-2.5-flash`
  - `CORS_ORIGINS` — comma-separated allowed origins; wildcard `*` is rejected (default `http://localhost:5173,http://127.0.0.1:5173`)
  - `LLM_TIMEOUT_SECONDS` — per-request Gemini SDK HTTP timeout in seconds (default `25`)
  - `LLM_MAX_RETRIES` — bounded retries for transient upstream errors only (default `1`)
  - `MAX_STATEMENT_CHARS` — max pasted problem statement length (default `6000`)
  - `MAX_REQUEST_BODY_BYTES` — streaming HTTP body cap enforced even without `Content-Length` (default `32768`)
  - `MAX_TUTOR_REQUEST_BYTES` — max structured `/api/tutor` JSON payload size (default `16384`)
  - `RATE_LIMIT_PER_MINUTE` — per-client sliding-window request cap (default `20`)
  - `DAILY_REQUEST_BUDGET` — total daily AI request budget cap per process (default `500`)
  - `MAX_CONCURRENT_LLM_REQUESTS` — max simultaneous in-flight LLM calls (default `5`)
- `web/.env` (public client config only):
  - `VITE_API_BASE_URL` — defaults to `http://localhost:8000`

## Security Note
CORS restrictions, prompt delimiters, and in-process rate limits help harden local development and controlled demos, **but CORS and prompt instructions alone do not protect a public AI endpoint** from abuse, direct HTTP clients, or multi-instance traffic. Before exposing AlgoMiri publicly, add user authentication, edge/reverse-proxy rate limiting, and persistent per-account quota enforcement.

## Product Docs
- [`docs/PRD.md`](docs/PRD.md)
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
- [`docs/TEST_CASES.md`](docs/TEST_CASES.md)
- [`docs/ANTIGRAVITY_PROMPTS.md`](docs/ANTIGRAVITY_PROMPTS.md)

## Key Principle
**Algorithm execution traces must be generated from deterministic, tested code.** AI analysis teaches, decomposes, and tutors conceptually, but unverified AI output is never displayed as real execution.
