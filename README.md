# AlgoMiri

**Understand first. Code second.**

AlgoMiri is a beginner-first visual learning platform for studying algorithms and data structures. Learners start with a **problem statement**, explore multiple strategies, step through deterministic visual execution traces, and understand the reasoning before writing code.

## Current Status (Sprint 2 — Deterministic Two Sum Visualization Engine)
- **Implemented:** Responsive React + Vite + TypeScript (strict) + Tailwind CSS app in `web/` with:
  - **Deterministic Trace Engine (`web/src/domain/traces/`)**: Pure TypeScript Brute Force and Hash Map Two Sum trace generators producing immutable, sequential `ExecutionStep[]` snapshots for positive, negative, zero, duplicate, empty, single-element, and no-solution inputs.
  - **Interactive Learning Studio (`/studio`)**: Custom array/target input with validation and quick presets, `Prev` / `Play` / `Pause` / `Next` / `Reset`, playback speed selector (`0.5×`–`2×`), interactive progress timeline, responsive multi-length array visualization, live Hash Map lookup panel, synchronized variables & plain-language explanations, terminal found/not-found states, and mobile-accessible playback controls directly beneath the canvas.
  - **Landing (`/`)**: Value proposition ("Understand the logic before you code"), interactive Paste Problem form with honest unsupported-problem feedback, sample problem cards, and 4-step learning journey overview.
  - **Roadmap (`/roadmap`)** & **Progress (`/progress`)**: Honestly labeled **Demo Data** previews.
- **Not implemented yet (honest scope):**
  - Guided 4-stage lesson, graded hints, next-step prediction prompts, and progressive pseudocode reveal (Sprint 3).
  - Backend (FastAPI), database/auth, real AI problem analysis, arbitrary LeetCode/Codeforces parsing, or code execution sandbox.

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
- `npm run test` — Run Vitest unit & UI interaction tests once
- `npm run preview` — Preview the production build locally

## Project Structure
```text
AlgoMiri/
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
      features/solutions/  # Conceptual SolutionMapPreview
      domain/
        problems/          # ProblemSpec, SolutionStrategy, SolutionGraph, Two Sum demo & catalog
        traces/            # Pure deterministic Brute Force & Hash Map trace generators + input validation
        learning/          # Future LearningAttempt & SkillEvidence interfaces
      styles/              # Brand theme tokens, focus rings, reduced-motion CSS
      test/                # Unit tests, Studio interaction tests, smoke tests
```

## Product Docs
- [`docs/PRD.md`](docs/PRD.md)
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
- [`docs/TEST_CASES.md`](docs/TEST_CASES.md)
- [`docs/ANTIGRAVITY_PROMPTS.md`](docs/ANTIGRAVITY_PROMPTS.md)

## Key Principle
**Algorithm execution traces must be generated from deterministic, tested code.** Future LLM analysis will only teach and propose strategies; unverified AI-generated steps must never be presented as real execution.
