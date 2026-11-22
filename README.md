# AlgoMiri

**Understand first. Code second.**

AlgoMiri is a beginner-first visual learning platform for studying algorithms and data structures. Learners start with a **problem statement**, discover approaches through guided reasoning, predict transitions on deterministic visual traces, and reveal pseudocode only when ready.

## Current Status (Sprint 3 — Beginner-First Guided Learning)
- **Implemented:** Responsive React + Vite + TypeScript (strict) + Tailwind CSS app in `web/` with:
  - **Guided Learning Mode (`/studio`)**: 4-stage interactive Two Sum curriculum (*1. Understand the Problem → 2. Discover Brute Force → 3. Discover Optimization → 4. Build the Solution*), progressive pseudocode reveal (hidden until requested), and seamless switching to **Free Exploration** mode.
  - **Dynamic Predict-the-Next-Step**: Multiple-choice prediction questions dynamically derived from real `ExecutionStep[]` traces for any custom input, with constructive feedback, penalty-free retries, and reveal-and-step-forward.
  - **3-Level Progressive Hint System**: Conceptual question → specific reasoning guidance → explicit next idea.
  - **Honest Local Session Summary**: Displays strategies explored, concepts covered, prediction attempts, hints used, and suggested next activities (clearly labeled as local browser session data, not persisted mastery).
  - **Deterministic Trace Engine (`web/src/domain/traces/`)**: Pure TypeScript Brute Force and Hash Map Two Sum trace generators with custom input validation, presets, `Prev` / `Play` / `Pause` / `Next` / `Reset`, speed (`0.5×`–`2×`), timeline scrubber, and live Hash Map updates.
  - **Landing (`/`), Roadmap (`/roadmap`), and Progress (`/progress`)**: Responsive brand experience with honest demo-only disclosures.
  - **CI Workflow (`.github/workflows/ci.yml`)**: Runs `npm ci`, `npm run lint`, `npm run test`, and `npm run build` in `web/` on pull requests.
- **Not implemented yet (honest scope):**
  - Backend (FastAPI), database/accounts, real AI problem analysis, arbitrary LeetCode/Codeforces parsing, additional algorithm engines beyond Two Sum, or code execution sandbox.

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
- `npm run test` — Run Vitest unit, guided learning, and UI interaction tests once
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
      app/                 # AppShell, routing
      pages/               # Landing, Studio, Roadmap, Progress
      components/          # Reusable accessible UI primitives & DemoNotice
      features/studio/     # ProblemPane, VisualCanvas, CustomInputBar, PlaybackControls, WalkthroughPane, useTracePlayback
      features/guided/     # GuidedLessonBar, GuidedStagePanel, HintPanel, PredictNextStepCard, SessionSummaryCard
      features/solutions/  # Conceptual SolutionMapPreview
      domain/
        problems/          # ProblemSpec, SolutionStrategy, SolutionGraph, Two Sum demo & catalog
        traces/            # Pure deterministic Brute Force & Hash Map trace generators + input validation
        learning/          # Two Sum 4-stage lesson, 3-level hints, dynamic prediction generator, future mastery interfaces
      styles/              # Brand theme tokens, focus rings, reduced-motion CSS
      test/                # Unit tests, guided learning tests, Studio interaction tests, smoke tests
```

## Product Docs
- [`docs/PRD.md`](docs/PRD.md)
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
- [`docs/TEST_CASES.md`](docs/TEST_CASES.md)
- [`docs/ANTIGRAVITY_PROMPTS.md`](docs/ANTIGRAVITY_PROMPTS.md)

## Key Principle
**Algorithm execution traces must be generated from deterministic, tested code.** Future LLM analysis will only teach and propose strategies; unverified AI-generated steps must never be presented as real execution.
