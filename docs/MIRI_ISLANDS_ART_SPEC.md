# AlgoMiri — Miri Islands Original Artwork Production Specification

This specification defines the unified visual language for **Miri Islands**, AlgoMiri's signature miniature floating-island learning world. All eight algorithm islands must feel crafted in the same cozy 2.5D diorama universe.

---

## 1. Camera, Perspective & Composition
- **Projection:** Isometric 3/4 view (`~30°` elevation, `45°` yaw). No extreme wide-angle distortion.
- **Framing:** Single floating miniature island centered inside a `4:3` frame with `12%–16%` clean breathing margin around all edges so silhouettes never clip on cards or future map canvases.
- **Base Consistency:** Every island shares the same visual "slice of earth" construction — a softly rounded lush pastel grassy/stone top deck over a layered warm sandstone/terracotta beveled floating rock underside, hovering above a subtle soft contact shadow.

## 2. Canvas Dimensions, Ratios & Export Strategy
| Tier | Dimensions | Aspect Ratio | Format | Usage |
| :--- | :--- | :--- | :--- | :--- |
| Master Source | `1200 × 900` px | `4:3` | PNG (lossless) | Archival master & future high-DPI map zoom |
| Web Display | `800 × 600` px | `4:3` | WebP (q85) / PNG fallback | Profile showcase cards & desktop map nodes |
| Mobile Thumbnail | `400 × 300` px | `4:3` | WebP / PNG | Compact mobile cards & list previews |
| Placeholder / Unbuilt | Vector | `4:3` | Inline SVG / Lucide badge | Honest preview slots for Phase 7B+ islands |

- **Backgrounds:** Phase 7A prototypes use a clean soft pastel backdrop (`#F7F9FC`) framed inside rounded containers; Phase 7B map-ready exports will deliver alpha-transparent WebP/PNG cutouts so islands float seamlessly over both Light sky-canvas and Dark night-sky map backgrounds.

## 3. Lighting, Materials & Palette
- **Lighting:** Warm top-left key light (`~45°`), cool sky ambient bounce light, and gentle soft ambient occlusion in crevices. Never harsh black shadows or glossy plastic speculars.
- **Materials:** Matte pastel clay / tactile miniature diorama aesthetic — rounded corners, soft bevels, subtle surface grain.
- **Zero Text Policy:** Artwork must contain **no embedded text, letters, numbers, or UI chrome** so the same assets work natively in English, Vietnamese, and future locales.
- **Day / Night (Light & Dark Mode) Compatibility:** Warm lantern accents (soft amber `#F2B84B`) and medium-saturation pastel structures remain readable on `#FFFFFF` / `#F7F9FC` Light cards and `#222938` / `#151923` Dark cards (with subtle dark-mode framing overlay where needed).

## 4. Scale & Mobile Silhouette Guidelines
- **Hero Landmark:** Occupies `~35%–45%` of the island footprint so each topic is recognizable at a `120px` mobile thumbnail.
- **Secondary Props & Foliage:** Soft rounded trees, stepping stones, and tiny lanterns keep proportions harmonious across all 8 islands (no oversized buildings on one island and microscopic ones on another).

---

## 5. Eight Island Art Briefs

### Prototype Batch (Phase 7A — Original Art Prototypes)
1. **Storage Harbor (`storage-harbor`) — Arrays & Hashing**
   - **Palette:** Pastel Blue (`#397BDB`), Soft Mint (`#15A897`), Warm Sand.
   - **Landmark:** Cozy harbor dock jutting into a turquoise cove with an indexed row of colorful rounded clay storage crates, cubby lockers, tiny wooden crane, and miniature sailboat.
   - **Asset Slot:** `/assets/islands/storage-harbor.jpg`
2. **Stack Spire (`stack-spire`) — Stack (LIFO)**
   - **Palette:** Pastel Teal (`#15A897`), Cream, Soft Lavender.
   - **Landmark:** Tiered vertical spire built from neatly stacked rounded clay rings and arched balconies, spiral cobblestone walkway, and warm glowing top lantern.
   - **Asset Slot:** `/assets/islands/stack-spire.jpg`
3. **Halfway Lighthouse (`halfway-lighthouse`) — Binary Search**
   - **Palette:** Pastel Amber (`#F2B84B`), Cream, Soft Pine Green.
   - **Landmark:** Pastel-amber and cream striped lighthouse standing at the exact midpoint of a curved cobblestone stepping-stone path splitting the island into balanced halves, with a cozy keeper's cottage.
   - **Asset Slot:** `/assets/islands/halfway-lighthouse.jpg`

### Planned Batch (Phase 7B — Asset Briefs Ready)
4. **Twin Beacon Bay (`twin-beacon-bay`) — Two Pointers**
   - **Palette:** Sky Blue (`#83C8ED`), Warm Coral, Cream.
   - **Landmark:** Two matching miniature coastal signal towers standing on opposite headlands of a crescent bay, linked by a sandy bridge as their beams meet in the middle.
5. **Window Wharf (`window-wharf`) — Sliding Window**
   - **Palette:** Leaf Green (`#74BF88`), Soft Teal, Warm Wood.
   - **Landmark:** A wooden boardwalk pier with a movable pastel-framed glass greenhouse/pavilion resting on smooth wooden rails over a row of garden plots.
6. **Bridge Archipelago (`bridge-archipelago`) — Graphs & BFS**
   - **Palette:** Soft Blue (`#397BDB`), Mint, Warm Terracotta.
   - **Landmark:** A cluster of 4–5 tiny stepping-stone islets linked by rounded wooden and stone arch bridges radiating outward in concentric rings from a central plaza.
7. **Mosaic Meadow (`mosaic-meadow`) — Dynamic Programming**
   - **Palette:** Pastel Coral (`#F47768`), Soft Amber, Meadow Green.
   - **Landmark:** A terraced hillside garden made of interlocking pastel ceramic mosaic tiles building step-by-step from small foundation squares up to a sunlit pavilion.
8. **Compass Cove (`compass-cove`) — Greedy**
   - **Palette:** Warm Amber (`#F2B84B`), Soft Teal, Sandstone.
   - **Landmark:** A sunlit coastal cliff with a stylized brass-and-clay compass rose plaza, packed supply carts, and stepping-stone trails leading toward the summit.

---

## 6. Future Growth Stages & Extensibility (Phase 7B+)
Each island supports progressive visual states driven strictly by verified learning evidence (never passive views or bookmarks):
- `preview` (no verified Studio yet)
- `undiscovered` (verified Studio available, 0 sessions)
- `explored` (visited / viewed-only sessions, no verified attempts yet)
- `developing` (at least 1 eligible practice session with genuine attempts)
- `flourishing` (sustained verified guided practice across stages/predictions)
