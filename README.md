# AlgoMiri

**Understand first. Code second.**

AlgoMiri is a beginner-first visual learning platform for studying algorithms and data structures. Learners start with a **problem statement**, explore multiple strategies, step through visual execution states, and understand the reasoning before writing code.

## Current Status (Sprint 1 — Frontend App Shell)
- **Implemented:** Responsive React + Vite + TypeScript (strict) + Tailwind CSS app in `web/` with:
  - **Landing (`/`)**: Value proposition ("Understand the logic before you code"), interactive Paste Problem form with honest unsupported-problem feedback, sample problem cards, and 4-step learning journey overview.
  - **Learning Studio (`/studio`)**: 3-column desktop / tabbed mobile layout featuring Two Sum problem statement, Brute Force vs. Hash Map strategy selector, visual array + hash map preview canvas with explicit color+text legend, conceptual Solution Map preview, and working step navigation (`Prev`, `Next`, `Reset`) across Sprint 1 curated preview snapshots.
  - **Roadmap (`/roadmap`)** & **Progress (`/progress`)**: Honestly labeled **Demo Data** previews.
- **Not implemented yet (honest scope):**
  - Full deterministic trace generator for arbitrary custom Two Sum inputs, auto-play/speed controls (Sprint 2).
  - Guided 4-stage lesson, graded hints, and next-step prediction prompts (Sprint 3).
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
- `npm run test` — Run Vitest unit & smoke tests once
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
      features/studio/     # ProblemPane, VisualCanvas, WalkthroughPane
      features/solutions/  # Conceptual SolutionMapPreview
      domain/              # ProblemSpec, SolutionStrategy, ExecutionStep, Learning types & Two Sum demo data
      styles/              # Brand theme tokens, focus rings, reduced-motion CSS
      test/                # Vitest smoke tests
```

## Product Docs
- [`docs/PRD.md`](docs/PRD.md)
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
- [`docs/TEST_CASES.md`](docs/TEST_CASES.md)
- [`docs/ANTIGRAVITY_PROMPTS.md`](docs/ANTIGRAVITY_PROMPTS.md)

## Key Principle
**Algorithm execution traces must be generated from deterministic, tested code.** Future LLM analysis will only teach and propose strategies; unverified AI-generated steps must never be presented as real execution.
