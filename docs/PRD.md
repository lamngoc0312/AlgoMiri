# AlgoMiri — Product Requirements Document (working draft)

## Vision
Help a learner who has never studied a particular algorithm move from a **problem statement** to an **independently written solution**: understand the problem, explore multiple valid approaches, see real execution traces, learn how to break problems down and combine techniques, then practice related problems. The product must remain accessible to beginners.

## Primary persona
University student or self-learner beginning DSA. They can read a programming problem but cannot yet identify a problem-solving strategy. They prefer concrete visual examples over code-first explanations.

## End-to-end learning journey
1. Paste problem statement OR choose a built-in demo problem.
2. See problem explained visually: inputs, outputs, constraints, mini example, comprehension check.
3. See 2+ strategies where valid (e.g. Two Sum: Brute Force vs Hash Map): intuition, tradeoffs, time/space complexity.
4. Open Solution Map: mini goals/subproblems, why each is needed, how they connect. For compound problems, show the relationship between multiple algorithmic techniques.
5. Run and manipulate interactive visualization: play, pause, next, previous, reset, speed, custom input, highlighted elements, variables, plain-language explanation.
6. Attempt to predict the next step, optionally request levelled hints; progressively reveal pseudocode, then optional code.
7. Record learning activity, confidence, and hints used. Suggest reinforcement and similar-pattern practice (later phases).

## Key surfaces (long-term)
- Landing: friendly and credible, large paste-problem CTA, sample problem shortcuts.
- Dashboard: today's plan, progress, streak, mastery chart; real data eventually, visible demo label before persistence is implemented.
- Problem Studio: most important. Three panes on desktop (problem/strategies, visual canvas, explanation/step controls), responsive stacked/tabs on mobile.
- Solution Map: conceptual subproblem DAG with prerequisites and reasons; macro/micro learning states.
- Roadmap: skill prerequisites and personalized plans.
- Practice Library: related by technique, prerequisites and difficulty, with explicit recommendation rationale.
- Progress: attempts, skills, composite skills, study history and reviews.

## Scope: v0.1 — visually polished frontend vertical slice
IN:
- Responsive app shell / navigation (Landing, Studio, Roadmap, Progress).
- Real working Two Sum demonstration with Brute Force and Hash Map, each backed by deterministic trace generation.
- Demo problem input with graceful unsupported-problem state. Clear sample-only messaging.
- Interactive controls: prev/next/play/pause/reset/speed, choose strategy, choose input.
- At least one clear reasoning walkthrough/solution map for Two Sum.
- Optional simple local practice prompt; no submitted-code judging.
- Honest demo-only Roadmap and Progress screens (or minimal well-designed placeholders).
- Meaningful visual polish and empty/error states.

OUT (not in first implementation):
- Real arbitrary LeetCode parsing, platform scraping, LLM API requests, login, database, running arbitrary code, backend, billing, Codeforces connector, automated visualizations for every problem.

## Future phases
- v0.2: more trace renderers/patterns and compound solutions (BFS+backtracking, binary search+greedy).
- v0.3: FastAPI + structured AI analysis; only verified strategies feed deterministic visual trace engine; clearly fallback to conceptual explanations.
- v0.4: accounts, attempts, mastery evidence, spaced review, streaks, learning roadmap.
- v0.5: smart recommendations based on pattern + composite skill + weakness + difficulty; external problem-provider adapters.
- v1+: Code editor/sandbox, advanced generated traces with verification, OOP Studio.

## Design direction
Brand: AlgoMiri. Friendly but not childish; modern EdTech meets focused developer workspace. Visual-first, not IDE-first.
Palette: indigo `#645BE8`, mint `#16B89D`, warm amber `#F1B34C`, ink `#20253B`, canvas `#F7F8FC`, white. Use high contrast and consistent semantic colors.
Fonts: Inter or Plus Jakarta Sans (with graceful fallbacks). Soft-radius cards, generous whitespace, crisp diagrams, subtle transitions; do not overuse gradients or noisy shadows.
Important: algorithm highlighting must have a legend and labels, not color alone.

## Acceptance for v0.1
- `npm install`, `npm run dev`, `npm run build` work from documented folder.
- Two Sum works for representative arrays (including duplicate values, negative numbers and no-solution custom inputs).
- Both approaches produce correct final answers for supported inputs; traces are consistent and reversible.
- Every visible button, tab and input has an implemented action; no fake calls to an absent backend.
- New user can use the product without writing any code.
- Desktop and mobile layouts are usable; keyboard interaction and focus feedback are present.
- Screens that show hypothetical data explicitly say "Demo data".
