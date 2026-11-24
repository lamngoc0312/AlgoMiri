# AlgoMiri — Sprint 10.1 Real Browser QA Report

## 1. Test Environment & Verification Boundary
- **Browser Engine:** `Google Chrome 158.0.8127.37` driven via `playwright-core` (headless)
- **Accessibility Engine:** `axe-core` (WCAG 2.0/2.1 Level A & AA rulesets)
- **Live Local Servers:**
  - Frontend: Vite production preview (`http://127.0.0.1:5173`)
  - Backend: FastAPI + Uvicorn (`http://127.0.0.1:8000`, verified via `GET /health` → `200 OK`, `ai_configured: false`, `provider: "offline-demo"`)
- **Honest Boundary:**
  - **Automated real-browser QA (Playwright + Chrome + `axe-core`)** was executed across all 4 viewports, all 7 routes, and all 6 interactive journeys.
  - **Live Gemini API calls** were **not** executed because no `GEMINI_API_KEY` is configured in `api/.env` or OS environment variables on this machine; offline fallback mode (`offline-demo`) was verified end-to-end instead.
  - **Human participant usability testing** has **not** occurred yet (see [`docs/BETA_USABILITY_PROTOCOL.md`](./BETA_USABILITY_PROTOCOL.md)).

---

## 2. Viewport & Route Matrix (28 Checks)

| Viewport | Routes Tested (`/`, `/problems`, `/studio/two-sum`, `/studio/valid-parentheses`, `/studio/split-array-largest-sum`, `/progress`, `/roadmap`) | Horizontal Overflow (Post-Fix) | `axe-core` WCAG 2.1 AA Violations (Post-Fix) | Console / Page Errors |
|---|---|---|---|---|
| **Mobile `375 × 812`** | 7 / 7 | **0 px** | **0** | 0 / 0 |
| **Mobile `390 × 844`** | 7 / 7 | **0 px** | — (audited on 375 & 1440) | 0 / 0 |
| **Tablet `768 × 1024`** | 7 / 7 | **0 px** (fixed from `121 px`) | — | 0 / 0 |
| **Desktop `1440 × 900`** | 7 / 7 | **0 px** | **0** (fixed from `13` total) | 0 / 0 |

### Visual Screenshot Evidence Captured & Inspected
Full-page rendered PNG screenshots were captured from Google Chrome and visually inspected across:
- Desktop (`1440×900`): `/`, `/problems`, `/studio/two-sum` (Micro + Macro Solution Map), `/studio/valid-parentheses`, `/studio/split-array-largest-sum`, `/progress` (empty & populated after reload), `/roadmap` (before & after 5-column SVG-connected Skill Prerequisite Map), and Landing AI Analyzer + Tutor + stale-analysis warning.
- Tablet (`768×1024`): `/studio/two-sum`, `/roadmap`.
- Mobile (`375×812`): `/`, `/studio/two-sum`, `/studio/split-array-largest-sum`, `/roadmap`.

---

## 3. Confirmed Bugs Found by Real Browser QA & Fixed in Sprint 10.1

| # | Severity | Issue & Reproduction Steps | Fix Applied & Verified |
|---|---|---|---|
| **1** | **High** | **Tablet `768×1024` horizontal overflow (`121 px`) on every route:** Desktop primary navigation activated at `md:` (`768px`), causing logo + `Beta Preview` badge + 5 nav links + `Browse Problems` button to exceed `768px`. | Moved desktop navbar breakpoint from `md:` to `lg:` (`1024px`) in `web/src/app/AppShell.tsx` so `768×1024` uses the clean mobile menu drawer → **0 px overflow across all 28 checks**. |
| **2** | **High** | **`axe-core` WCAG AA `color-contrast` violations across 6 routes:** Muted `#8B93B0` text (`~3.0:1` on white/`#F7F8FC`) and `opacity-80` on locked strategy cards fell below `4.5:1`. | Replaced `#8B93B0` text with `#555D7A` (`6.4:1`) in `LandingPage.tsx`, `ProblemsPage.tsx`, `ProgressPage.tsx`, `RoadmapPage.tsx`, `StackVisualCanvas.tsx`, `CompositionVisualCanvas.tsx`, and removed `opacity-80` on locked cards in `ProblemPane.tsx` → **0 contrast violations**. |
| **3** | **High** | **`axe-core` WCAG 2.5.3 `label-content-name-mismatch` on `PlaybackControls.tsx`:** Visible desktop button text was `"Prev"` while `aria-label` was `"Previous step"`. | Changed visible desktop text to `"Previous"` to match `aria-label="Previous step"` cleanly → **0 label-mismatch violations**. |
| **4** | **High** | **Skill Prerequisite Map 5th-layer wrap & missing visual connectors on `/roadmap`:** `xl:grid-cols-4` wrapped Layer 5 (`Algorithm Composition`) awkwardly under Layer 1 on a second row with no visual dependency connectors and 51 tiny `< 12px` labels. | Redesigned `InteractiveSkillMap.tsx` into a full-width 5-column horizontal layout (`lg:grid-cols-5`) with subtle curved SVG Bezier dependency connectors that highlight on selection, upgraded tiny `10px` labels to `12px` (`text-xs`), enlarged touch targets (`min-h-[36px]`), and placed the Skill Inspector cleanly below. |
| **5** | **Medium** | **Missing favicon 404 console error:** Browser requested `/favicon.ico` and logged a `404` error on load. | Added an inline SVG favicon in `web/index.html` → **0 console errors**. |
| **6** | **Medium** | **Small mobile touch targets (`24px` height) on `Predict Next Step` toggle switches:** | Increased switch height to `min-h-[36px]` across `VisualCanvas.tsx`, `StackVisualCanvas.tsx`, and `CompositionVisualCanvas.tsx`. |

---

## 4. End-to-End Interactive Journey Verification (Live Chrome)

- **Journey 1 & 2 (Landing → Problems → Two Sum Guided → Predict → Macro/Micro → Summary → Progress + Reload):**
  - Verified `5-stage Guided Lesson` badge on Split Array and `4-stage` on Two Sum / Valid Parentheses.
  - Confirmed Play button blocked before answering Step 1 prediction and unblocked after answering.
  - Confirmed Hash Map unlocked in Stage 3, Macro Solution Map rendered and switched back cleanly to Micro View, Session Summary showed `Saved to This Browser`, and `/progress` persisted `1` session across a full `page.reload()`.
- **Journey 3 (Valid Parentheses Stack):** Loaded `"([)]"` preset cleanly (`Step 1 of 4`) with vertical LIFO Stack rendering.
- **Journey 4 (Split Array Largest Sum Composition):** Entered `-5, 2, 3` in `Array (nums ≥ 0)` → rejected immediately with clear nonnegative explanation without breaking the trace.
- **Journey 5 (Unsupported Problem → AI Analyzer → AI Tutor → Stale Warning):** Pasted Coin Change problem → live FastAPI returned honest `Offline Demo Mode (No Live AI Key)` response → AI Tutor returned conceptual hint with mastery disclaimer → editing the statement immediately surfaced `Outdated Analysis — Problem Statement Changed`.
- **Journey 6 (Personalized Roadmap & Skill Map):** `/roadmap` dynamically updated from the saved Two Sum session to recommend `Complete Remaining Stages in Two Sum`, `ArrowRight` moved both selection and `document.activeElement`, and `Accessible List` toggle worked cleanly.

---

## 5. Automated Test Results (Post-Fix)
- **Backend (`pytest -q`):** **31 passed** (`2.91s`)
- **Frontend Lint (`npm run lint`):** **0 errors, 0 warnings**
- **Frontend Unit & Integration (`npm run test`):** **15 test files passed, 119 tests passed** (`27.67s`)
- **Frontend Production Build (`npm run build`):** **Succeeded** (`dist/` built in `6.49s`)
- **Playwright Chrome QA:** **28/28 viewport checks passed**, **0 px max overflow**, **0 `axe-core` WCAG 2.1 AA violations**, **0 console/page errors**, **6/6 live journeys passed**.

---

## 6. Remaining Unverified Behaviors
1. **Live Gemini API calls:** Not tested here because no `GEMINI_API_KEY` is configured locally (only `offline-demo` mode was exercised live; live Gemini provider retry/timeout/error mapping is covered by mocked backend unit tests in `api/tests/test_api.py`).
2. **Cross-browser rendering (Firefox / Safari / iOS WebKit):** Automated browser QA ran on Google Chrome only.
3. **Real beginner human usability sessions:** Not conducted yet; ready to execute using [`docs/BETA_USABILITY_PROTOCOL.md`](./BETA_USABILITY_PROTOCOL.md).
