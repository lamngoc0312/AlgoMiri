# Antigravity prompt sequence — AlgoMiri

Run ONE prompt/sprint at a time. Let the agent complete the step, inspect the result, test locally and commit before going on. Prefer Plan mode for changes touching many files. The current repo starts with documentation only.

## Sprint 1 — Setup + visually polished, functional app shell
```
You are my senior full-stack engineer and UI/UX partner for AlgoMiri, a beginner-first visual algorithm learning platform. Read AGENTS.md, docs/PRD.md, docs/ARCHITECTURE.md and docs/TEST_CASES.md carefully before coding.

I am a solo developer. I want a maintainable, beautiful app, not a static mockup. First make an implementation plan and specify files/dependencies; then implement ONLY Sprint 1:

- In `web/` scaffold Vite + React + TypeScript strict. Use Tailwind CSS, lucide-react, React Router, and shadcn/ui selectively. Make sure library setup uses current documented commands and works on Windows.
- Build AlgoMiri brand design: warm modern EdTech feel; indigo #645BE8, mint #16B89D, amber #F1B34C, canvas #F7F8FC, ink #20253B; excellent typography, spacing, subtle motion, polished icons and accessible controls.
- Build responsive routes: `/` landing, `/studio` primary Learning Studio, `/roadmap` roadmap preview, `/progress` progress preview.
- Landing: hero with one clear CTA, paste problem field, samples, feature overview, clear value proposition "Understand the logic before you code". The only supported live demo in Sprint 1 is Two Sum; if someone pastes a different problem, show a clear informative unsupported/demo message, NEVER a fake AI result.
- Studio: elegant 3-column desktop layout (problem & strategies, central canvas placeholder with visual array sample, right step explanation), mobile tabbed layout. Strategy selector and navigation controls should be wired to meaningful UI state or visibly disabled with an explanation; do not present dead buttons.
- Roadmap and Progress: beautiful *honestly labeled demo* previews, not fake live account data. Include consistent navigation.
- Add simple reusable domain types, demo Two Sum data, accessible error/empty states, CSS reduced-motion support.
- Document commands and architecture in README and add scripts for dev, build, lint and test where appropriate. Add a minimal smoke test.
- Run npm install, npm run build and available tests; fix failures. If browser tools are available, inspect desktop/mobile and fix visible layout issues. Do not add a backend, database, auth or API secrets in Sprint 1. Do not push or deploy without my permission.

When done, report exact files changed, results of checks, how to start locally, and remaining Sprint 2 work.
```

## Sprint 2 — Real deterministic interactive Two Sum
```
Read all project documents and inspect the current code. Build Sprint 2 ONLY. Implement pure TypeScript brute-force and hash-map trace generators for Two Sum with explicit typed ExecutionStep snapshots, correct distinct-index handling, a not-found state, and the test cases in docs/TEST_CASES.md. Connect each trace to Studio visuals and narrative. Implement real prev/next/play/pause/reset, speed, custom integer array/target inputs, step counter, highlights, variables, and a compact reasoning-based Solution Map. Ensure controls and explanations stay synchronized. Include unit tests, responsive states and accessible labels. Run build/test/lint and visually test. Do not add AI/API integration yet, and do not claim general LeetCode support. Report changed files, actual test results and limitations.
```

## Sprint 3 — Onboarding and guided reasoning
```
Read the docs and implementation. Focus on learner experience, not adding dozens of problems. Add a 4-stage guided lesson for Two Sum: understand input-output; discover brute force; realize complement lookups; choose hash map. Add graded hints, a prediction-before-next-step interaction, optional pseudocode hidden until asked, and a session summary. Keep a clear separation between visualizing a verified algorithm and using sample explanations. Add component/behavior tests, run build/lint/test, and QA on mobile and desktop. Do not add login, code execution, or AI yet.
```

## Future sprint, not yet
FastAPI + structured LLM analysis with unsupported-path fallbacks, learning progress model, personalized recommendations, Codeforces adapter and OOP Studio. Plan only after core UX is validated.
