# AlgoMiri — acceptance and test cases

## Two Sum trace cases
For each case, both strategies must either find two DISTINCT indices whose values sum to target or return not-found. With multiple valid pairs, either valid pair is acceptable; do not force identical pair selection across algorithms.

| nums | target | expected |
|---|---:|---|
| `[2,7,11,15]` | 9 | `[0,1]` |
| `[3,3]` | 6 | `[0,1]` |
| `[-3,4,3,90]` | 0 | `[0,2]` |
| `[1,2,3]` | 100 | not found |
| `[]` | 5 | not found |
| `[1]` | 2 | not found |
| `[2,2,2]` | 4 | any two distinct indices |

## Invariants
- All step indices strictly increasing; no undefined array positions or mutated shared snapshots.
- Hash-map approach never matches the current element with itself; lookup takes place before inserting current value.
- Every highlighted array index is within range.
- `reset`, `previous`, `next` and change of strategy lead to deterministic state.
- No timer left running after route switch / component unmount.
- Unsupported free-text problem input does NOT pretend to have solved the problem.

## UX and quality
- Responsive on 375px wide phone and 1440px desktop.
- All CTA links lead somewhere meaningful. Keyboard navigable; focus ring; ARIA labels on playback controls.
- Honor prefers-reduced-motion.
- TypeScript strict build passes, lint passes, tests pass; agent provides exact commands and outcomes.
- No external AI API calls, secrets or hidden paid dependencies in v0.1.
