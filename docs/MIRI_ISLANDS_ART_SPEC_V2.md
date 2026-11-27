# AlgoMiri — Miri Islands Art Direction Redesign (v2 — Cozy Fantasy Floating Archipelago)

> **Status:** Phase 7B.3 Pilot Prototypes (3 pilot islands generated for review).  
> **Production Assets Preserved:** All Phase 7B.1 production assets (`web/public/assets/islands/*.jpg` and `web/public/assets/islands/transparent/*.webp`) remain untouched until this redesigned art direction is validated.

---

## 1. Visual Diagnosis of Phase 7B.1
While the Phase 7B.1 assets achieved clean lighting, pastel clay consistency, and crisp transparent cutouts, visual review on `/islands` revealed one core weakness:
- **Repetitive Base Silhouettes:** Nearly all eight v1 islands share the same rounded-square floating tile base with a building placed on top, making the world map read like uniform square tiles rather than a whimsical, hand-crafted fantasy archipelago.
- **Bridge Archipelago Literalism:** v1 rendered a single circular bowl with a pond inside rather than separate floating islets linked by bridges.

---

## 2. New Visual Direction — Cozy Fantasy Floating Archipelago
- **Genre & Mood:** Whimsical miniature fantasy game-world artwork (tactile tabletop diorama / cozy indie adventure feel).
- **Organic Silhouettes (No Generic Square Platforms):** Every island has a distinct, topic-driven land shape — crescents, asymmetric coastal cliffs, tapered spires, elongated piers, and multi-islet clusters — with sculpted craggy-yet-rounded terracotta/sandstone floating rock roots and occasional tiny drifting pebbles beneath.
- **Cohesive Technical Rules:**
  - **Camera:** 30° elevation 3/4 isometric view, centered with `~14%` breathing margin.
  - **Lighting & Materials:** Soft matte pastel clay with rounded bevels, warm golden top-left key light, cool sky ambient bounce, subtle warm amber lantern accents, no harsh black shadows or plastic glare.
  - **Readability:** Expressive silhouettes readable even at `120–180px` thumbnails without noisy micro-clutter.
  - **Zero Text Policy:** No embedded letters, digits, signs, or UI chrome.
  - **Map Export:** `800 × 600` (`4:3`) alpha-transparent WebP (`web/public/assets/islands/prototypes-v2/transparent/*.webp`) with original `1024 × 1024` `.jpg` masters preserved in `web/public/assets/islands/prototypes-v2/`.

---

## 3. Three Pilot Island Redesigns (Phase 7B.3)

| Pilot Island | Algorithm Topic | v1 Silhouette Problem | v2 Cozy Fantasy Redesign |
| :--- | :--- | :--- | :--- |
| **Storage Harbor** | Arrays & Hashing | Rounded-square tile with rectangular cove cutout | **Organic crescent-shaped harbor island** curving around open turquoise water, with a real wooden dock, moored miniature sailboat, wooden cargo crane, cozy harbor booth, and curved indexed-looking pastel storage cubbies (zero digits). |
| **Halfway Lighthouse** | Binary Search | Nearly empty flat square with a central lighthouse | **Asymmetric rocky coastal island** with natural elevation: a prominent central striped lighthouse & keeper's cottage dividing **two clearly distinct search regions** — a sunlit terraced meadow path on the left and a higher pine-clad rocky cliffside path on the right. |
| **Bridge Archipelago** | Graphs & BFS | Single circular island containing a round pond | **True multi-islet floating archipelago** of 5–6 **separate** floating rocky islets suspended in open air, connected across empty sky by arched wood-and-blue bridges radiating in clear BFS layers from a central lantern gazebo hub. |

---

## 4. Extending the Art Style to the Remaining Five Islands (Post-Validation)
Once the three pilot prototypes are approved, the exact same organic silhouette language will extend to the remaining five islands:
1. **Stack Spire (Stack / LIFO):** Replace the flat square base with a **tall, narrow craggy floating pinnacle** where stacked pastel-teal & cream clay rings coil upward directly out of the tapered rock spire, emphasizing vertical LIFO depth.
2. **Twin Beacon Bay (Two Pointers):** Split the mass into **two distinct rocky headland islets** facing each other across an open sky/bay channel, linked by a long arched footbridge so the silhouette unmistakably shows two opposite pointers converging.
3. **Window Wharf (Sliding Window):** Shift from a square pad to an **elongated narrow peninsula/wharf silhouette** running diagonally along the isometric axis, letting the movable translucent glass greenhouse glide visibly along wooden rails over terraced garden beds.
4. **Mosaic Meadow (Dynamic Programming):** Sculpt an **organic curved terraced hillside amphitheater** rising asymmetrically from small foundation mosaic terraces up to a sunlit hilltop pavilion (avoiding a boxy square pyramid).
5. **Compass Cove (Greedy):** Sculpt an **irregular windswept headland cliff** jutting toward a turquoise cove with an inlaid gold-and-teal compass rose stone plaza (zero letters), packed supply carts, and a winding cliffside lookout trail.

---

## 5. Map UI Refinement Proposal (Deferred Until Art Validation)
> **Note:** Per Phase 7B.3 scope, these UI adjustments are proposed here and **not yet implemented** in code until the pilot art direction is validated.

1. **Single-Language Island Names (No Bilingual Parentheticals):**
   - Display **only** the active locale's island name on the map (e.g. `"Cảng Lưu Trữ"`, `"Hải Đăng Trung Điểm"`, `"Quần Đảo Cầu Vòm"` in VI; `"Storage Harbor"`, `"Halfway Lighthouse"`, `"Bridge Archipelago"` in EN) instead of combining both (`"Cảng Lưu Trữ (Storage Harbor)"`).
2. **Zero Ellipsis on Map Labels:**
   - Because single-language names are short and crisp, remove `truncate` ellipsis clipping on map plaques so every island name reads in full without `...`.
3. **Smaller, Visually Secondary Labels:**
   - Reduce label plaques to compact, soft floating pills (`text-[11px]`, tight padding, single-line island name + subtle stage dot) and let the side inspector / mobile bottom sheet carry the algorithm topic subtitle so the 2.5D island artwork commands primary visual focus.
4. **Organic Archipelago Constellation (Breaking the 4×2 Grid):**
   - Replace the two parallel 4-island horizontal bands with a natural sweeping archipelago constellation (varied elevation pockets, staggered depth clusters, and open sky channels) while preserving generous clearance for the sticky side inspector and zero overlap at `1024px`, `125%` zoom, and `1440px`.
