# AlgoMiri — Controlled Beta Usability Test Protocol (Beginners)

> **Status:** Ready-to-run manual test protocol. **No sessions with real participants have been conducted yet.** Do not populate results until live moderated sessions take place.

## 1. Study Objective
Evaluate whether beginner programmers (0–12 months of algorithm/data-structure experience) can:
1. Understand problem intuition **before reading code** using Guided Learning and deterministic visualizations.
2. Navigate smoothly across Landing, Problem Library, Learning Studio (Micro & Macro views), Progress, Roadmap, and the optional AI Problem Analyzer.
3. Accurately interpret the boundary between **Verified Deterministic Execution**, **AI-Generated Conceptual Analysis**, and **Local Guided Progress** (not independent mastery).

## 2. Participant Profile & Setup
- **Target Cohort:** 5–8 beginner programmers (CS students, bootcamp learners, or self-taught developers familiar with basic loops/arrays but not confident with Hash Maps, Stacks, or Binary Search on Answer).
- **Session Length:** 35–45 minutes per participant (moderated think-aloud).
- **Environment:**
  - Desktop (`>= 1280px`) for at least 4 participants; mobile/tablet (`375px–768px`) for at least 2 participants.
  - Clean browser profile (`localStorage` cleared before session).
  - Run both frontend (`npm run dev`) and backend (`uvicorn app.main:app --port 8000`) locally; test at least 1 participant with `GEMINI_API_KEY` unset (Offline Demo Mode) to verify honest fallback clarity.
- **Moderator Rule:** Do **not** explain UI controls or algorithm concepts unless the participant is stuck for > 90 seconds. Record where they hesitate.

---

## 3. Core Usability Tasks

### Task 1 — First Impression & Guided Two Sum Discovery (Journey 1 & 2)
- **Scenario:** *"You are new to AlgoMiri and want to learn how Two Sum works without jumping straight to code."*
- **Actions to Observe:** Start at `/` -> open **Browse Problem Library** -> launch **Two Sum** Guided Lesson -> complete Stage 1 & Stage 2 -> answer at least 2 trace predictions -> unlock Hash Map in Stage 3 -> switch between **Micro View** and **Macro View (Solution Map)** -> finish or open **Session Summary** -> click **View Learning Progress**.
- **Success Criteria:**
  - Completes Stage 1 & Stage 2 without confusion about why Hash Map is locked initially.
  - Answers or explicitly uses **Skip & Reveal** at a guided checkpoint without getting stuck on disabled Play/Next buttons.
  - Locates saved session metrics on `/progress`.
- **Failure / Friction Signals:** Confuses why Next/Play is disabled at a checkpoint; expects Hash Map immediately; misses the Macro/Micro toggle; thinks `/progress` is synced to an account.
- **Post-Task Questions:**
  1. *Why did Brute Force start `j` at `i + 1` instead of `0`?* (Learning check)
  2. *Why does the Hash Map strategy check for the complement BEFORE inserting the current number?* (Learning check)
  3. *What did the Solution Map show compared to the Execution view?*

### Task 2 — Stack Visualization & Edge Cases (Journey 3)
- **Scenario:** *"Switch to Valid Parentheses and figure out why `\"([)]\"` and `\"((\"` are invalid."*
- **Actions to Observe:** Navigate via Studio quick switcher or `/problems` -> open **Valid Parentheses** -> inspect the vertical LIFO Stack canvas -> test `"([)]"` and `"(("` presets -> answer at least 2 guided checks.
- **Success Criteria:**
  - Explains LIFO top-of-stack matching using the visual trace.
  - Identifies both failure modes: bracket mismatch / empty stack AND unclosed leftover brackets at end of string.
- **Post-Task Questions:**
  1. *Why can't we just count the number of `(` and `)` to solve Valid Parentheses?* (Learning check)
  2. *Did the vertical stack visual make push/pop order clear?*

### Task 3 — Algorithm Composition: Split Array Largest Sum (Journey 4)
- **Scenario:** *"Explore Split Array Largest Sum and explain how Binary Search and Greedy work together."*
- **Actions to Observe:** Open **Split Array Largest Sum** -> read Stage 1–4 -> inspect the **Binary Search Iteration Inspector** and **Macro Composition Map** -> try entering a negative number (e.g., `-5, 2, 3`) to observe validation.
- **Success Criteria:**
  - Distinguishes the outer Binary Search driver (`[low, high]`, `mid`) from the inner Greedy feasibility check (`groupsUsed <= k`).
  - Understands why negative numbers are rejected by the Studio.
- **Post-Task Questions:**
  1. *When Greedy says `mid = 18` is feasible, why do we set `high = 18` instead of `high = 17`?* (Learning check)
  2. *What was the most confusing visual element on this screen, if any?*

### Task 4 — Unsupported Problem & AI Conceptual Analyzer (Journey 5)
- **Scenario:** *"You have a homework problem: 'Find the minimum number of coins to make a target amount.' Paste it on the Home page and see how AlgoMiri helps."*
- **Actions to Observe:** Go to `/` -> paste Coin Change problem -> click **Analyze Problem (AI)** -> read structured breakdown -> ask the **AI Tutor** for a conceptual hint -> edit the textarea text and observe the stale-analysis warning.
- **Success Criteria:**
  - Correctly recognizes the output is **AI-Generated · Conceptual (Not Verified)** (or **Offline Demo Mode** if no key is configured) and that no algorithm was executed.
  - Notices the stale-analysis warning when editing the pasted problem text.
- **Failure / Friction Signals:** Assumes the AI analysis ran verified code; expects a live animation for Coin Change; misses the difference between **Analyze Problem (AI)** and **Open Curated Studio**.
- **Post-Task Questions:**
  1. *Does AlgoMiri execute your pasted problem when you click Analyze Problem (AI)?*
  2. *Did the AI Tutor give away the full solution too early, or help you think?*

### Task 5 — Progress, Personalized Roadmap & Skill Map (Journey 6)
- **Scenario:** *"Check your overall progress, find out what AlgoMiri suggests practicing next, and inspect what prerequisites are needed for Algorithm Composition."*
- **Actions to Observe:** Open `/progress` -> inspect Prediction Breakdown & Skill Tracking -> open `/roadmap` -> read **Recommended Next Activity** and **Why this was recommended** -> click **Algorithm Composition** in the Interactive Skill Prerequisite Map -> switch to **Accessible List** view -> optionally test **Clear Local History** on `/progress` at the end of the session.
- **Success Criteria:**
  - Correctly states why the next activity was recommended.
  - Identifies that `Algorithm Composition` depends on `Binary Search on Answer` and `Greedy Feasibility`.
  - Understands that `"Strong Guided Recall"` is **not** independent mastery and that history is stored only in this browser.
- **Post-Task Questions:**
  1. *If you open AlgoMiri on your phone right now, will this progress appear there?*
  2. *Do you feel locked out of any problems on the Roadmap?*

---

## 4. Observable Usability Checklist
Mark each observed issue during the session with severity (`Blocker` / `High` / `Medium` / `Low`):
- [ ] Hesitation on Landing CTA (`Analyze Problem (AI)` vs. `Open Curated Studio`)
- [ ] Confusion about checkpoint pause (`Play`/`Next` disabled until answered or skipped)
- [ ] Difficulty connecting Macro View (Solution Map) with Micro View (Execution steps)
- [ ] Mobile tab switching friction (`Guide & Problem` / `Visual Canvas` / `Walkthrough`)
- [ ] Misinterpreting guided completion as independent mastery
- [ ] Visual overflow, cramped text, or small touch targets on mobile/tablet

---

## 5. Blank Feedback Collection Template (Copy Per Participant)

```markdown
### Participant Session Log
- **Participant ID:** P0X
- **Date:** YYYY-MM-DD
- **Experience Level:** (e.g., 3 months Python, CS1 student)
- **Device & Viewport:** (e.g., Desktop 1440x900 / Mobile 390x844)
- **AI Backend Mode:** Live Gemini / Offline Demo / Backend Stopped

| Task | Outcome (Pass / Pass w/ Friction / Fail) | Time (min) | Key Observations & Quotes |
|---|---|---|---|
| Task 1 (Two Sum Guided + Summary) | | | |
| Task 2 (Valid Parentheses Stack) | | | |
| Task 3 (Split Array Composition) | | | |
| Task 4 (AI Analyzer + Tutor) | | | |
| Task 5 (Progress + Roadmap + Skill Map) | | | |

**Learning-Understanding Check Results (0–5):**
- Two Sum `j = i + 1` & lookup-before-insert: [ ] Understood  [ ] Partial  [ ] Unclear
- Valid Parentheses LIFO & unclosed leftovers: [ ] Understood  [ ] Partial  [ ] Unclear
- Split Array `high = mid` & nonnegative rule: [ ] Understood  [ ] Partial  [ ] Unclear
- AI Conceptual vs. Verified Execution boundary: [ ] Understood  [ ] Partial  [ ] Unclear
- Local-only history & Guided Recall != Mastery: [ ] Understood  [ ] Partial  [ ] Unclear

**Top 3 Friction Points Observed:**
1.
2.
3.

**Top 3 Things That Helped Learning Most:**
1.
2.
3.
```
