# AlgoMiri — Miri Islands Original Artwork Production Specification

This specification defines the unified visual language and production asset pipeline for **Miri Islands**, AlgoMiri's signature miniature floating-island learning world. All eight algorithm islands are crafted in the same cozy 2.5D diorama universe.

---

## 1. Camera, Perspective & Composition
- **Projection:** Isometric 3/4 view (`~30°` elevation, `45°` yaw). No extreme wide-angle distortion.
- **Framing:** Single floating miniature island centered inside a `4:3` frame (`8%` clean breathing margin around tight silhouette bounds) so silhouettes never clip on cards or future map canvases.
- **Base Consistency:** Every island shares the same visual "slice of earth" construction — a softly rounded lush pastel grassy/stone top deck over a layered warm sandstone/terracotta beveled floating rock underside.

## 2. Canvas Dimensions, Ratios & Export Strategy (Phase 7B.1 Production Assets)
| Tier | Dimensions | Aspect Ratio | Format | Location | Usage |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Original Studio Source | `1024 × 1024` px | `1:1` | JPEG (RGB) | `web/public/assets/islands/<id>.jpg` | Preserved original master artwork |
| Map-Ready Transparent Web | `800 × 600` px | `4:3` | WebP (RGBA, q88, `~24–38 KB` each) | `web/public/assets/islands/transparent/<id>.webp` | Profile showcase cards & Phase 7B.2 interactive world map |
| Missing-Asset Fallback | Vector | `4:3` | Inline Lucide badge + accessible `role="img"` | `MiriIslandArtwork.tsx` | Graceful `onError` fallback if an image fails to load |

- **Alpha Cutout & Shadow Policy:**
  - Transparent WebP cutouts are extracted via exterior-only flood-fill with color-decontaminated anti-aliased edges and largest-component isolation so studio cast shadows do not leave gray smudges on Dark Mode canvases (`#151923` / `#222938`).
  - Depth shadows are rendered via theme-aware CSS `drop-shadow` so islands float seamlessly over both Light sky-canvas and Dark night-sky map backgrounds.
  - Original `.jpg` studio renders are preserved untouched in `web/public/assets/islands/`.

## 3. Lighting, Materials & Palette
- **Lighting:** Warm top-left key light (`~45°`), cool sky ambient bounce light, and gentle soft ambient occlusion in crevices. Never harsh black shadows or glossy plastic speculars.
- **Materials:** Matte pastel clay / tactile miniature diorama aesthetic — rounded corners, soft bevels, subtle surface grain.
- **Zero Text Policy:** All eight artworks contain **no embedded text, letters, numbers, or UI chrome** so the same assets work natively in English, Vietnamese, and future locales.
- **Day / Night (Light & Dark Mode) Compatibility:** Warm lantern accents (soft amber `#F2B84B`) and medium-saturation pastel structures remain readable on `#FFFFFF` / `#F7F9FC` Light cards and `#222938` / `#151923` Dark cards.

## 4. Scale & Mobile Silhouette Guidelines
- **Hero Landmark:** Occupies `~35%–45%` of the island footprint so each topic is recognizable at a `120px` mobile thumbnail.
- **Secondary Props & Foliage:** Soft rounded trees, stepping stones, and tiny lanterns keep proportions harmonious across all 8 islands.

---

## 5. Complete Eight-Island Production Set

1. **Storage Harbor (`storage-harbor`) — Arrays & Hashing**
   - **Palette:** Pastel Blue (`#397BDB`), Soft Mint (`#15A897`), Warm Sand.
   - **Landmark:** Cozy harbor dock jutting into a turquoise cove with an indexed row of colorful rounded clay storage crates, cubby lockers, tiny wooden crane, and miniature sailboat.
   - **Assets:** `/assets/islands/transparent/storage-harbor.webp` (`800×600`, original: `/assets/islands/storage-harbor.jpg`)
2. **Stack Spire (`stack-spire`) — Stack (LIFO)**
   - **Palette:** Pastel Teal (`#15A897`), Cream, Soft Lavender.
   - **Landmark:** Tiered vertical spire built from neatly stacked rounded clay rings and arched balconies, spiral cobblestone walkway, and warm glowing top lantern.
   - **Assets:** `/assets/islands/transparent/stack-spire.webp` (`800×600`, original: `/assets/islands/stack-spire.jpg`)
3. **Twin Beacon Bay (`twin-beacon-bay`) — Two Pointers**
   - **Palette:** Sky Blue (`#83C8ED`), Warm Coral (`#F47768`), Cream.
   - **Landmark:** Two matching miniature coastal signal towers standing on opposite headlands of a crescent turquoise bay, linked by a curved wooden arch bridge with converging stepping stones.
   - **Assets:** `/assets/islands/transparent/twin-beacon-bay.webp` (`800×600`, original: `/assets/islands/twin-beacon-bay.jpg`)
4. **Window Wharf (`window-wharf`) — Sliding Window**
   - **Palette:** Leaf Green (`#74BF88`), Soft Teal (`#15A897`), Warm Wood.
   - **Landmark:** Wooden boardwalk pier alongside raised pastel garden beds with a movable pastel-teal-framed glass greenhouse pavilion on round clay wheels gliding along wooden rails.
   - **Assets:** `/assets/islands/transparent/window-wharf.webp` (`800×600`, original: `/assets/islands/window-wharf.jpg`)
5. **Halfway Lighthouse (`halfway-lighthouse`) — Binary Search**
   - **Palette:** Pastel Amber (`#F2B84B`), Cream, Soft Pine Green.
   - **Landmark:** Pastel-amber and cream striped lighthouse standing at the exact midpoint of a curved cobblestone stepping-stone path splitting the island into balanced halves, with a cozy keeper's cottage.
   - **Assets:** `/assets/islands/transparent/halfway-lighthouse.webp` (`800×600`, original: `/assets/islands/halfway-lighthouse.jpg`)
6. **Bridge Archipelago (`bridge-archipelago`) — Graphs & BFS**
   - **Palette:** Soft Blue (`#397BDB`), Mint, Warm Terracotta.
   - **Landmark:** Shallow turquoise lagoon with a central cobblestone lantern gazebo linked by four pastel-blue and wood arch bridges radiating outward to surrounding grassy islets.
   - **Assets:** `/assets/islands/transparent/bridge-archipelago.webp` (`800×600`, original: `/assets/islands/bridge-archipelago.jpg`)
7. **Mosaic Meadow (`mosaic-meadow`) — Dynamic Programming**
   - **Palette:** Pastel Coral (`#F47768`), Soft Amber (`#F2B84B`), Meadow Green.
   - **Landmark:** Stepped terraced hillside garden tiled with interlocking pastel ceramic mosaic squares building step-by-step up to a sunlit cream-and-coral garden pavilion.
   - **Assets:** `/assets/islands/transparent/mosaic-meadow.webp` (`800×600`, original: `/assets/islands/mosaic-meadow.jpg`)
8. **Compass Cove (`compass-cove`) — Greedy**
   - **Palette:** Warm Amber (`#F2B84B`), Soft Teal (`#15A897`), Sandstone.
   - **Landmark:** Sunlit coastal cliff with an inlaid gold-and-teal compass rose plaza (zero letters), blank trail signpost, packed wooden supply carts, and a sandstone stepping-stone trail climbing to a lantern overlook.
   - **Assets:** `/assets/islands/transparent/compass-cove.webp` (`800×600`, original: `/assets/islands/compass-cove.jpg`)

---

## 6. Growth Stages & Topic-Specific Evidence Rules
Each island supports progressive visual states driven strictly by verified, topic-specific Studio evidence (never passive views, AI bookmarks, or unrelated topic attempts):
- `preview` — no verified Studio yet (AI-guided preview only)
- `undiscovered` — verified Studio available, 0 saved sessions
- `explored` — visited / viewed-only sessions, OR on a multi-topic Studio (`split-array-largest-sum`), practiced only another topic's skill
- `developing` — at least 1 eligible practice session containing genuine non-viewed evidence for this island's primary topic skill
- `flourishing` — completed guided session with topic-relevant evidence OR sustained verified practice across >= 2 eligible sessions with strong topic skill evidence
