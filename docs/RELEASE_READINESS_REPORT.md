# AlgoMiri — Sprint 10 Beta Release Readiness Report

## 1. Evidence Scope (Honest Verification Boundary)
To prevent overstating readiness, this report explicitly separates what has been verified from what has not:

| Verification Method | Status | Scope Covered |
|---|---|---|
| **Code Review & Static Analysis** | Completed | Full audit of `web/` (TypeScript strict, ESLint) and `api/` (FastAPI, Pydantic v2, config, routing, guards, Gemini SDK). |
| **Automated Unit & Integration Tests** | Completed | Frontend Vitest + React Testing Library (`119` tests across `15` files) and Backend Pytest (`31` tests). Production `tsc -b && vite build` verified. |
| **Live Browser Visual QA (Playwright + Chrome + `axe-core`)** | **Completed (Sprint 10.1)** | Real Google Chrome `158.0.8127.37` across 4 viewports (`375×812`, `390×844`, `768×1024`, `1440×900`), all 7 routes (28 checks), full-page screenshots inspected, all 6 live journeys clicked end-to-end against local Vite + FastAPI (`offline-demo`), **0 px horizontal overflow**, **0 `axe-core` WCAG 2.1 AA violations**, **0 console/page errors**. See [`docs/BROWSER_QA_REPORT.md`](./BROWSER_QA_REPORT.md). |
| **Controlled Beta Testing with Real Users** | **Not Run Yet** | Manual usability protocol is prepared in [`docs/BETA_USABILITY_PROTOCOL.md`](./BETA_USABILITY_PROTOCOL.md). Zero real-user sessions have occurred yet. |

---

## 2. User Journey Audit Summary (Journeys 1–6)

| Journey | Audit Result | Issues Found & Resolved in Sprint 10 | Remaining Notes |
|---|---|---|---|
| **1. Landing → Problems → Two Sum → Guided → Summary → Progress** | Pass (Code + Integration Tests) | Fixed stale header badge (`v0.2 Demo` → `Beta Preview`), contradictory footer text, hardcoded `4-stage` label on ProblemsPage, and preserved prior Stage Skip history so revisiting a skipped stage never inflates first-try evidence. | Verify mobile tab ergonomics (`Guide & Problem` vs `Visual Canvas`) during live browser QA. |
| **2. Two Sum → Brute Force → Hash Map → Solution Map → Predict Next Step** | Pass (Code + Integration Tests) | Hash Map stays locked until Stage 3; checkpoint guards block skipping over unresolved predictions; Solution Map jumps sync cleanly to Micro View. | None blocking. |
| **3. Valid Parentheses → Stack Visualization → Guided Questions** | Pass (Code + Integration Tests) | Vertical LIFO stack, mismatch/unclosed presets, and 4-stage guided flow verified. | None blocking. |
| **4. Split Array Largest Sum → BS + Greedy → Composition Visualization** | Pass (Code + Integration Tests) | Fixed ProblemsPage to accurately show `5-stage Guided Lesson`; fixed Roadmap edge-case drill so Split Array never suggests negative inputs (respects `nums[i] >= 0`). | Visual density of Composition canvas + Iteration Inspector should be spot-checked at `375px` mobile width in a live browser. |
| **5. Paste Unsupported Problem → AI Analysis → AI Tutor → Conceptual Guidance** | Pass (Code + Backend/Frontend Tests) | Strict Verified/Ambiguous/Conceptual routing, stale-analysis warning, Tutor context reset, `Retry-After` handling, and honest Offline Demo Mode verified. | Requires running `api/` server locally for live AI calls; frontend gracefully reports unreachable API if backend is stopped. |
| **6. Complete Lesson → Save Local History → Progress → Personalized Roadmap → Practice Again** | Pass (Code + Integration Tests) | Replaced misleading `"Resume ..."` CTA with honest `"Practice ... Again"` (explaining fresh session start); implemented real DOM focus movement (`focus()`) + roving `tabIndex` in `InteractiveSkillMap`. | Local history is browser-only (`localStorage`), never synced across devices. |

---

## 3. Security, Privacy & Reliability Review
- **API Keys & Provider Config:** `GEMINI_API_KEY` stays strictly server-side in `api/`, wrapped in Pydantic `SecretStr`, loaded from `api/.env` with real OS env vars taking precedence, and never logged or bundled into `web/`.
- **API Protections & Fallbacks:** Streaming request-body byte limit (`413`, works without `Content-Length`), Tutor structured payload cap (`413`), per-client rate limiter + daily budget + concurrency guard (`429` + `Retry-After`), managed async Gemini SDK timeouts + bounded retries on transient errors only, explicit non-wildcard CORS, and honest `offline-demo` fallback when no key is set.
- **Local Learning History Privacy:** `LocalStorageLearningRepository` sanitizes every record to verified built-in `problemId`s and structured metrics only — strips unexpected fields and never stores API keys, pasted private statements, or AI Tutor conversations. Confirmed **Clear Local History** wipes storage cleanly.
- **Deployment Limitations (Important Before Public Launch):**
  - Rate limiting, daily budgets, and concurrency limits are currently **in-process memory only** (not shared across multiple server replicas).
  - CORS and prompt delimiters alone do **not** protect a public unauthenticated AI endpoint.
  - No user authentication, remote database, or cross-device sync exists yet.

---

## 4. Prioritized Release Readiness Backlog

### Blockers for Controlled Local/Invited Beta
- **None** (all automated backend & frontend suites pass; zero build/lint errors; all Sprint 10 Phase A correctness issues resolved).

### High-Priority UX Issues (Resolved in Sprint 10)
1. **Prior Guided Stage skip history lost on revisit** — Fixed in `analytics.ts` and `StudioPage.tsx` (revisited skipped stages record `correct-with-assistance`, never `first-try-correct`).
2. **Misleading `"Resume"` CTA where no mid-session resume exists** — Fixed in `roadmapEngine.ts` and `RoadmapPage.tsx` (now `"Practice ... Again"` + `"Incomplete Stages"` with explicit fresh-session explanation).
3. **`InteractiveSkillMap` arrow keys did not move DOM focus** — Fixed with `nodeButtonRefs`, roving `tabIndex`, and `Arrow`/`Home`/`End` focus movement.
4. **Generic edge-case drill suggested negatives for nonnegative-only Split Array** — Fixed with `PROBLEM_EDGE_CASE_DRILLS` tailored to each module's constraints.
5. **Contradictory footer (`No backend or external AI API connected`) & inaccurate `4-stage` count for 5-stage Split Array** — Fixed in `AppShell.tsx` and `ProblemsPage.tsx`.

### Medium-Priority Improvements (Pre-Public Beta)
1. **Live Browser Visual QA Pass:** Manually inspect Landing, Problems, all 3 Studios (Micro + Macro), Progress, and Roadmap in Chrome/Safari/Firefox at `375px`, `768px`, and `1440px` to verify zero horizontal overflow, comfortable touch targets, and crisp readability.
2. **Bundle Code-Splitting:** `vite build` currently emits a single ~`637 kB` JS chunk (`175 kB` gzipped). Route-level `React.lazy` splitting for `StudioPage`, `ProgressPage`, and `RoadmapPage` will cut initial Landing load time.
3. **Run 5–8 Moderated Beginner Beta Sessions:** Execute [`docs/BETA_USABILITY_PROTOCOL.md`](./BETA_USABILITY_PROTOCOL.md) and iterate on observed beginner friction before broader launch.

### Deferred Post-Beta Enhancements (Out of Current Scope)
- User authentication & cross-device cloud sync (PostgreSQL/Supabase).
- Distributed edge/reverse-proxy rate limiting & per-account AI quotas for public deployment.
- Unassisted independent recall/coding assessments (required before any skill can earn `Independently Demonstrated`).
- Additional verified visual problem families (Two Pointers, Sliding Window, Trees/Graphs).
