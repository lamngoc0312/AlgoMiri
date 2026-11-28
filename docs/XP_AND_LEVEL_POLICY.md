# AlgoMiri — XP & Level Policy (Phase 8A.1)

This document defines AlgoMiri's evidence-based **XP & Level** foundation. Every number below matches the deterministic implementation in:

- `web/src/domain/gamification/xpPolicy.ts`
- `web/src/domain/gamification/leveling.ts`
- `web/src/services/xpLedgerRepository.ts`

---

## 1. Core Principles

- **Genuine learning evidence only:** XP is derived strictly from verified Studio practice records (`LearningSession` passing `isEligiblePracticeSession()`).
- **Deterministic & transparent:** No LLM-estimated scores, no hidden multipliers, and no time-spent-only farming.
- **Anti-farming & idempotency:** Re-saving an unchanged session awards **0 duplicate XP**. Completion bonuses are granted **at most once per eligible session**.
- **Privacy-safe browser-local persistence:** The XP ledger stores only compact reward identifiers, problem IDs, local calendar dates, and XP totals in `localStorage` — never problem statements, user notes, or AI prompts.

---

## 2. Eligible vs. Ineligible Activities

### Eligible (Earns XP)
| Activity | Evidence Level | Base XP |
| --- | --- | --- |
| Guided-stage attempt | `first-try-correct` | **+15 XP** |
| Guided-stage attempt | `correct-with-assistance` | **+10 XP** |
| Guided-stage attempt | `attempted` (genuine unresolved attempt) | **+4 XP** |
| Trace-prediction attempt | `first-try-correct` | **+10 XP** |
| Trace-prediction attempt | `correct-with-assistance` | **+6 XP** |
| Trace-prediction attempt | `attempted` (genuine unresolved attempt) | **+3 XP** |
| Verified guided-session completion bonus | `completed-guided` | **+25 XP** (once per session) |
| Partial-skip completion bonus | `completed-with-skips` (with ≥ 1 completed stage) | **+10 XP** (once per session) |
| Legacy eligible session without `attempts[]` | `isEligiblePracticeSession() === true` | **+10 XP** (once per session) |

### Ineligible (Always 0 XP)
- Passive viewing (`outcome === 'viewed-only'` or `evidenceLevel === 'viewed'`)
- Skipping stages or predictions without attempting
- AI problem analysis, AI conceptual chat, or AI bookmarks
- Opening pages or navigating the app
- Miri Islands demo/preview interactions (including Stage Preview switcher)
- Active study time alone without verified attempts
- Re-saving an unchanged session
- Multi-topic duplication (e.g., `split-array-largest-sum` is evaluated **once** per `sessionId`, never doubled across Binary Search and Greedy)

---

## 3. Anti-Farming Caps

Caps are evaluated deterministically using the local calendar date (`YYYY-MM-DD`) of `session.completedAt`:

- **Per-session cap:** **100 XP** maximum per `sessionId`.
- **Per-problem daily cap:** **120 XP** maximum per `problemId` per local calendar day.
- **Global daily cap:** **250 XP** maximum across all Studios per local calendar day.

---

## 4. Level Progression Curve

- Learners start at **Level 1** (`0 XP`).
- XP needed to advance from Level `L` to `L + 1`:
  - `step(L) = 100 + (L - 1) * 50`
- Cumulative XP required to reach Level `L`:
  - `totalXpForLevel(L) = 25 * (L - 1) * (L + 2)`

| Level | Cumulative XP Required | XP to Next Level |
| --- | --- | --- |
| Level 1 | 0 XP | 100 XP |
| Level 2 | 100 XP | 150 XP |
| Level 3 | 250 XP | 200 XP |
| Level 4 | 450 XP | 250 XP |
| Level 5 | 700 XP | 300 XP |
| Level 6 | 1,000 XP | 350 XP |

---

## 5. Durable Local XP Ledger (`algomiri.xp.ledger.v1`)

`LocalStorageLearningRepository` retains only the **100 most recent sessions**. To ensure earned XP is never lost when older sessions are evicted past that 100-session cap:

1. **Dedicated Ledger:** Earned rewards are persisted separately in `algomiri.xp.ledger.v1` (`schemaVersion: 1`).
2. **Idempotent Keys:** Each reward has a deterministic `rewardId` (`${sessionId}:${source}:${targetId}`, `${sessionId}:completion`, or `${sessionId}:legacy-practice`).
3. **In-Place Updates:** Updating a session in place with additional progress awards only newly earned `rewardId`s within remaining caps — never duplicating previous rewards or completion bonuses.
4. **Archival Rollup:** If the ledger ever exceeds `1,000` retained entries, the oldest entries are rolled into `archivedXpTotal` so total XP never decreases.
5. **First-Use Migration:** When a learner has existing retained sessions in `algomiri.learning.history` and no XP ledger yet, those retained sessions are reconciled once in chronological order (`completedAt` ascending). No XP is fabricated for sessions that were already evicted before Phase 8A.1.
6. **Multi-Tab Safety:** Every write re-reads the latest storage payload before merging so stale tabs do not overwrite XP earned in another tab.
7. **Corruption & Future-Schema Safety:** Corrupted JSON or malformed entries recover gracefully without crashing. Payloads with `schemaVersion > 1` are treated as read-only and never overwritten.
8. **Explicit History Clear:** When the learner explicitly clears local learning history via `LearningRepository.clearHistory()`, the local XP ledger is reset alongside it so cleared browser data does not leave phantom XP behind.

---

## 6. Known Limitations (Phase 8A.1)

- Stored in **this browser only** (`localStorage`); not synced across devices or accounts yet.
- Clearing browser site data or using private browsing resets local XP and Level.
- Miri Coins, Shop, Mascot Collection, Decorations, and Cloud Sync are intentionally deferred to later phases.
