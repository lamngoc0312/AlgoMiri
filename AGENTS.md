# AlgoMiri — repository rules for Antigravity

You are developing AlgoMiri, a beginner-friendly, AI-assisted platform for learning algorithms through visual reasoning BEFORE writing code.

## Product principles
- **Problem first, code last**: understand the statement, derive approaches, decompose the task, visualize execution, then transition to pseudocode/code.
- Teach reasoning, not answer memorization. Give progressively revealed hints. Never present a full solution as the mandatory first screen.
- Make the visualization the primary focus in the Learning Studio. All visible interactive controls must work.
- Be accurate about capabilities. Mark sample/mock content as DEMO. Do not claim that arbitrary LeetCode/Codeforces inputs are supported until they are.
- No scraped/copyrighted problem statement catalogs. Use original examples or user-provided problems and store original provider links/IDs as references only.
- Accessible UI: keyboard support, focus visibility, contrast, responsive layouts; animation respects reduced-motion preference.

## Technical constraints
- Start with a **frontend-only, working vertical slice**. Preferred stack: React + Vite + TypeScript (strict), Tailwind CSS, shadcn/ui where appropriate, lucide-react, Motion, React Router. Avoid dependencies that do not add clear value.
- Later backend (NOT sprint 1): Python/FastAPI + PostgreSQL/Supabase Auth. Keep API and persistence behind interfaces so they can be added without rewriting UI.
- Separate pure algorithm/trace logic from React components. Visual steps must come from deterministic implementations, not LLM guesses.
- Preserve a stable conceptual data model: ProblemSpec, SolutionStrategy, SolutionGraph, ExecutionStep, LearningAttempt, SkillEvidence.
- A learning SolutionGraph describes reasoning and prerequisite relationships; it is not automatically the runtime call graph.
- Use generated, checked-in original copy/images or simple SVG/CSS diagrams. Don't require paid image assets.
- Never put API secrets in browser code, committed files, or example commands. Add only `.env.example` placeholders where necessary.
- Never execute arbitrary user-provided source code in the app without an isolated execution sandbox; it is out of scope for the first release.
- Use `npm run build` and relevant tests before declaring a sprint done. Explain every failing check, no fabricated test success.
- Don't commit build artifacts, `node_modules`, `.env`, generated credentials or tokens.

## Work style
1. Read `docs/PRD.md`, `docs/ARCHITECTURE.md`, `docs/TEST_CASES.md` and `docs/ANTIGRAVITY_PROMPTS.md` first.
2. State a brief implementation plan, list affected files, and implement ONE sprint at a time.
3. After implementation, run format/lint/tests/build and run or visually inspect the app in a browser if available.
4. Report: files changed, exact commands, implemented behavior, remaining limitations and next step.
5. Do not refactor unrelated code. Do not push to `main` or deploy without explicit user approval. Prefer a `feat/*` branch.
