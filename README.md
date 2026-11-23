# AlgoMiri

**Understand first. Code second.**

AlgoMiri is a beginner-first visual learning platform for studying algorithms and data structures. Learners start with a **problem statement**, discover approaches through guided reasoning, predict transitions on deterministic visual traces, and reveal pseudocode only when ready.

## Current Status (Sprint 4 — Multi-Problem Architecture & Stack Visualization)
- **Implemented:** Responsive React + Vite + TypeScript (strict) + Tailwind CSS app in `web/` with:
  - **Multi-Problem Architecture (`web/src/domain/core/`, `web/src/domain/problems/registry.ts`)**: Discriminated-union `AnyVisualState` (`ArrayHashVisualState | StackVisualState`), typed `ProblemModule`, and `ProblemRegistry` supporting problems with different strategy counts and renderers.
  - **Problem Library & Routing**: `/problems` (live interactive problems + honestly labeled unavailable upcoming problems), `/studio/two-sum`, `/studio/valid-parentheses`, and backward-compatible `/studio` redirect.
  - **Two Sum Module (`/studio/two-sum`)**: Pure deterministic Brute Force (`O(n²)`) and Hash Map (`O(n)`) trace generators, array + live Hash Map visualization, 4-stage Guided Learning, progressive hints, dynamic predictions, and custom input validation.
  - **Valid Parentheses Module (`/studio/valid-parentheses`)**: Pure deterministic Stack (`O(n)`) trace generator supporting `()`, `[]`, `{}` and empty strings, dedicated vertical **Stack Execution Canvas** with explicit `TOP` indicator, push/pop/match/mismatch highlights, 4-stage Guided Learning, progressive hints, and dynamic predictions.
  - **Enforced Guided Checkpoints & Honest Session Tracking**: In Guided Predict Mode, `Play`, `Next`, and forward timeline seeking pause at unanswered checkpoints until answered or explicitly skipped (`Skip & Reveal`); Free Exploration remains unrestricted. Stage statuses distinguish `unvisited`, `viewed`, `attempted`, `skipped`, `skipped-after-attempt`, and `completed`.
  - **CI Workflow (`.github/workflows/ci.yml`)**: Runs `npm ci`, `npm run lint`, `npm run test`, and `npm run build` in `web/` on pull requests.
- **Not implemented yet (honest scope):**
  - Backend (FastAPI), database/accounts, real AI problem analysis, arbitrary LeetCode/Codeforces parsing, or code execution sandbox.

## Quick Start (Windows / macOS / Linux)
All frontend code lives in `web/`.

```bash
cd web
npm install
npm run dev
```

Open the local URL printed by Vite (typically `http://localhost:5173`).

### Available Scripts (run inside `web/`)
- `npm run dev` — Start the Vite development server
- `npm run build` — Run strict TypeScript check (`tsc -b`) and build production bundle
- `npm run lint` — Run ESLint across `web/`
- `npm run test` — Run Vitest unit, multi-problem, guided integrity, and UI interaction tests once
- `npm run preview` — Preview the production build locally

## Project Structure
```text
AlgoMiri/
  .github/workflows/ci.yml
  AGENTS.md
  README.md
  docs/
    PRD.md
    ARCHITECTURE.md
    TEST_CASES.md
    ANTIGRAVITY_PROMPTS.md
  web/
    package.json
    src/
      app/                 # AppShell, multi-problem routing (/problems, /studio/:problemId)
      pages/               # Landing, Problems, Studio, Roadmap, Progress
      components/          # Reusable accessible UI primitives & DemoNotice
      features/studio/     # ProblemPane, VisualCanvas (array+map), StackVisualCanvas (vertical stack), PlaybackControls, WalkthroughPane, useTracePlayback
      features/guided/     # Reusable GuidedLessonBar, GuidedStagePanel, HintPanel, PredictNextStepCard, SessionSummaryCard
      features/solutions/  # Conceptual SolutionMapPreview
      domain/
        core/              # Discriminated union VisualState, GenericExecutionStep, ProblemLesson, ProblemModule
        problems/          # ProblemRegistry, twoSumModule, validParenthesesModule, demoCatalog
        traces/            # Pure deterministic Two Sum & Valid Parentheses trace generators + validators
        learning/          # Pure session integrity state, hints, dynamic predictions
      styles/              # Brand theme tokens, focus rings, reduced-motion CSS
      test/                # Trace unit tests, Valid Parentheses tests, multi-problem & integrity tests, Studio tests
```

## Product Docs
- [`docs/PRD.md`](docs/PRD.md)
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
- [`docs/TEST_CASES.md`](docs/TEST_CASES.md)
- [`docs/ANTIGRAVITY_PROMPTS.md`](docs/ANTIGRAVITY_PROMPTS.md)

## Key Principle
**Algorithm execution traces must be generated from deterministic, tested code.** Future LLM analysis will only teach and propose strategies; unverified AI-generated steps must never be presented as real execution.
