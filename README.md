# AlgoMiri

**Understand first. Code second.**

AlgoMiri is a beginner-first visual learning platform for studying algorithms and data structures. Learners start with a **problem statement**, decompose strategies through interactive conceptual Solution Maps, see how multiple techniques compose via explicit data contracts, predict transitions on deterministic visual traces, and reveal pseudocode only when ready.

## Current Status (Sprint 6 — Algorithm Composition Engine)
- **Implemented:** Responsive React + Vite + TypeScript (strict) + Tailwind CSS app in `web/` with **3 verified interactive problem modules**:
  1. **Two Sum (`/studio/two-sum`)**: Brute Force (`O(n²)`) vs. Hash Map (`O(n)`) comparison, array + live Hash Map visualization, 4-stage Guided Lesson.
  2. **Valid Parentheses (`/studio/valid-parentheses`)**: Stack (`O(n)`) LIFO bracket matching, vertical U-shaped Stack Execution Canvas, 4-stage Guided Lesson.
  3. **Split Array Largest Sum (`/studio/split-array-largest-sum`)**: **Algorithm Composition Engine** pairing **Binary Search on Answer** (outer driver) with **Greedy Contiguous Partitioning** (nested `O(n)` feasibility subroutine, `O(1)` auxiliary algorithm space). Includes Driver ↔ Subroutine coordination view, contiguous group visualizer, clickable Binary Search Iteration Inspector (`invocationId` subtrace linking), and a 5-stage Guided Lesson.
  - **Interactive Conceptual Solution Map (`Macro View`)**: Validated topological DAGs (`validateSolutionGraph`, `validateTraceNodeReferences`) with explicit `conceptualNodeIds` trace mapping, Graph / Accessible List toggle, **"Why is this step necessary?"**, data contracts, and clickable verified execution step pills.
  - **Enforced Multi-Checkpoint Guided Learning**: `Play`, `Next`, and forward timeline seeking stop at the first unresolved checkpoint; Free Exploration remains unrestricted.
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
- `npm run test` — Run Vitest unit, composition oracle, graph validation, solution map, and Studio UI tests once
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
      features/studio/     # ProblemPane, VisualCanvas, StackVisualCanvas, CompositionVisualCanvas, PlaybackControls, WalkthroughPane
      features/guided/     # Reusable GuidedLessonBar, GuidedStagePanel, HintPanel, PredictNextStepCard, SessionSummaryCard
      features/solutions/  # InteractiveSolutionMap (DAG Graph + Accessible List + Node Inspector)
      domain/
        core/              # Discriminated union AnyVisualState, CompositionContext, ProblemModule
        problems/          # ProblemRegistry, twoSumModule, validParenthesesModule, splitArrayModule, demoCatalog
        solutions/         # DAG validator, trace node-reference validator, topological layering
        traces/            # Deterministic Two Sum, Valid Parentheses & Split Array Largest Sum trace engines + validators
        learning/          # Pure session integrity state, hints, dynamic predictions
      styles/              # Brand theme tokens, focus rings, reduced-motion CSS
      test/                # Unit, composition oracle, graph validation, solution map & Studio UI tests
```

## Product Docs
- [`docs/PRD.md`](docs/PRD.md)
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
- [`docs/TEST_CASES.md`](docs/TEST_CASES.md)
- [`docs/ANTIGRAVITY_PROMPTS.md`](docs/ANTIGRAVITY_PROMPTS.md)

## Key Principle
**Algorithm execution traces must be generated from deterministic, tested code.** Conceptual Solution Maps teach reasoning structure and link to verified steps; they never fabricate execution traces.
