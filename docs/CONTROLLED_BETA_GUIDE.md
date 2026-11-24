# AlgoMiri — Controlled Beta Guide & Manual Accessibility Checklist

> **Status:** Ready-to-run controlled beta workflow for 5–8 beginner programmers. **No sessions with real human participants have been conducted yet.**

## 1. Controlled Beta Invitation Workflow (5–8 Beginners)

### Step 1 — Participant Selection
Invite **5 to 8 beginner programmers** (0–12 months of algorithm/data-structure experience; comfortable with basic variables/loops, not yet fluent in Hash Maps, Stacks, or Binary Search on Answer):
- Aim for **at least 2 mobile/tablet participants** (`375px–768px`) and **at least 4 desktop participants** (`>= 1280px`).
- Test **at least 1 session** with the backend in `offline-demo` mode (no `GEMINI_API_KEY`) to verify honest fallback UX.

### Step 2 — Plain-Language Invitation Message (Template)
> *"Hi [Name], we're running a small 35–45 minute beta walkthrough of **AlgoMiri**, a beginner-first visual tool for learning algorithms before writing code. Participation is completely voluntary — we're testing the app, not grading you. Your progress stays only in your own browser (no account required), and we won't record your name in our notes. Would you be open to trying 5 short guided tasks while thinking aloud?"*

### Step 3 — Consent Checklist (Confirm Before Starting)
Confirm verbally or in writing before any task begins:
- [ ] Participant understands participation is **voluntary** and they may pause or stop at any time without penalty.
- [ ] Participant understands AlgoMiri is a **Beta Preview**: learning history is saved only in their local browser (`localStorage`), is not synced across devices, and can be wiped anytime via **Progress → Clear Local History**.
- [ ] Participant understands feedback notes use an **anonymized ID** (`P01`–`P08`) with no real names, emails, or pasted private prompts stored in repository artifacts.
- [ ] Screen/audio recording (optional): explicitly opted in (`[ ] Yes` / `[ ] No — written notes only`).

### Step 4 — Session Execution & Debrief
1. Clear `localStorage` in a fresh browser window before starting Task 1.
2. Follow the 5 structured tasks in [`docs/BETA_USABILITY_PROTOCOL.md`](./BETA_USABILITY_PROTOCOL.md).
3. Record observations in a copy of [`docs/BETA_FEEDBACK_WORKSHEET.md`](./BETA_FEEDBACK_WORKSHEET.md) — never lead the learner toward answers unless stuck > 90 seconds.
4. At debrief, remind the participant they can click **Clear Local History** on `/progress` if using a shared machine.

---

## 2. Manual Screen-Reader & Accessibility Verification Instructions

> **Important Honesty Note:** Automated `axe-core` checks (`npm run test:e2e:smoke`) verify baseline WCAG 2.0/2.1 rules (contrast, ARIA syntax, labels, landmarks), **but zero `axe-core` violations does NOT guarantee complete WCAG AA compliance.** Manual keyboard and screen-reader verification is required before declaring full accessibility conformance.

### Recommended Manual Assistive-Tech Pass (15–20 Minutes)
Test with **NVDA** (Windows + Firefox/Chrome) or **VoiceOver** (macOS + Safari/Chrome):

1. **Keyboard-Only Navigation (No Mouse):**
   - Press `Tab` on `/` → verify **"Skip to main content"** becomes visibly focused and jumps past the header into `<main>`.
   - Navigate through primary links, Landing problem textarea, `Analyze Problem (AI)`, and `Open Curated Studio` using `Tab` / `Shift+Tab` / `Enter`.
   - At `375px` or `768px`, open the mobile menu drawer via keyboard, navigate to `/problems`, and verify focus is never trapped.
2. **Learning Studio Announcements & Checkpoints:**
   - On `/studio/two-sum`, navigate Guided Stage radio options with screen reader enabled; confirm option feedback (`role="status"`) is announced clearly after selection.
   - Verify disabled `Play` and `Previous`/`Next` buttons announce why playback is paused at an unanswered prediction checkpoint.
   - Switch between **Micro View (Execution)** and **Macro View (Solution Map)** and verify `aria-pressed` state changes are spoken.
3. **Interactive Skill Prerequisite Map (`/roadmap`):**
   - Tab into the Visual Map → use `ArrowRight`, `ArrowLeft`, `Home`, and `End` to move focus across skills; confirm the Skill Inspector updates accurately.
   - Toggle **Accessible List** and verify prerequisites, unlocked skills, and cautious status labels (`Not Started`, `Introduced`, `Needs Practice`, `Guided Progress`, `Strong Guided Recall`) read cleanly in logical order without relying on visual SVG connectors.
4. **Zoom & Reduced Motion:**
   - Test **200% browser zoom** on desktop (`1280px`) and verify no clipped controls or horizontal scrolling.
   - Enable OS **Reduce Motion** (`prefers-reduced-motion: reduce`) and confirm transitions/spinners respect reduced-motion CSS.
