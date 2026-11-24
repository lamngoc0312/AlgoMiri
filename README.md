# AlgoMiri

**Understand first. Code second.**

AlgoMiri is a beginner-first visual learning platform for studying algorithms and data structures. Learners start with a **problem statement**, decompose strategies through interactive conceptual Solution Maps, predict transitions on deterministic visual traces, and reveal pseudocode only when ready.

## Current Status (Sprint 5 — Interactive Problem Decomposition & Solution Map)
- **Implemented:** Responsive React + Vite + TypeScript (strict) + Tailwind CSS app in `web/` with:
  - **Interactive Conceptual Solution Map (`Macro View`)**: Topological branching-and-merging DAG visualization (`InteractiveSolutionMap`) with real SVG dependency edges, accessible **List Fallback**, keyboard navigation, interactive node inspector (**"Why is this step necessary?"**, dependencies, data contracts, skills with honest non-mastery disclaimer), and clickable verified execution step links.
  - **Synchronized Macro & Micro Perspectives**: Switch seamlessly between **Micro View** (deterministic visualization, variables, explanations) and **Macro View** (conceptual Solution Map highlighting the reasoning goal supported by the current verified step).
  - **Validated `SolutionGraph` Architecture (`web/src/domain/solutions/graphValidator.ts`)**: Validates duplicate IDs, missing references, self-dependencies, and DAG cycles; computes true edge-based topological layers; prepared for future multi-technique composition (e.g., Binary Search on Answer + Greedy).
  - **Multi-Problem Architecture & Routing**: `/problems` library, `/studio/two-sum` (Brute Force + Hash Map), `/studio/valid-parentheses` (vertical LIFO Stack renderer), and backward-compatible `/studio` redirect.
  - **Enforced Multi-Checkpoint Guided Learning**: In Guided Predict Mode, `Play`, `Next`, and forward timeline seeking stop at the first unresolved checkpoint (even after earlier checkpoints are solved); backward navigation and **Free Exploration** remain unrestricted. Stage statuses distinguish `unvisited`, `viewed`, `attempted`, `skipped`, `skipped-after-attempt`, and `completed`.
  - **CI Workflow (`.github/workflows/ci.yml`)**: Runs `npm ci`, `npm run lint`, `npm run test`, and `npm run build` in `web/` on pull requests.
- **Not implemented yet (honest scope):**
  - Backend (FastAPI), database/accounts, real AI problem analysis, arbitrary LeetCode/Codeforces parsing, composite Binary Search + Greedy problem implementation, or code execution sandbox.

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
- `npm run test` — Run Vitest unit, graph validation, solution map, multi-problem, and Studio tests once
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
      features/studio/     # ProblemPane, VisualCanvas, StackVisualCanvas, PlaybackControls, WalkthroughPane, useTracePlayback
      features/guided/     # Reusable GuidedLessonBar, GuidedStagePanel, HintPanel, PredictNextStepCard, SessionSummaryCard
      features/solutions/  # InteractiveSolutionMap (DAG Graph + Accessible List + Node Inspector)
      domain/
        core/              # Discriminated union VisualState, GenericExecutionStep, ProblemLesson, ProblemModule
        problems/          # ProblemRegistry, twoSumModule, validParenthesesModule, demoCatalog
        solutions/         # DAG validator, topological layering, graph-to-trace mapping
        traces/            # Pure deterministic Two Sum & Valid Parentheses trace generators + validators
        learning/          # Pure session integrity state, hints, dynamic predictions
      styles/              # Brand theme tokens, focus rings, reduced-motion CSS
      test/                # Trace, graph validation, solution map, multi-problem, guided learning & smoke tests
```

## Product Docs
- [`docs/PRD.md`](docs/PRD.md)
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
- [`docs/TEST_CASES.md`](docs/TEST_CASES.md)
- [`docs/ANTIGRAVITY_PROMPTS.md`](docs/ANTIGRAVITY_PROMPTS.md)

## Key Principle
**Algorithm execution traces must be generated from deterministic, tested code.** Conceptual Solution Maps teach reasoning structure and link to verified steps; they never fabricate execution traces.
