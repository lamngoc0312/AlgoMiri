# AlgoMiri — Miri Islands Art Direction Specification (v2 — Cozy Fantasy Floating Archipelago)

> **Status:** Production Active (Phase 7B.4 — Complete 8/8 Cozy Fantasy Floating Archipelago Set).  
> **Reversible Archive:** All original Phase 7B.1 v1 assets remain preserved untouched in `web/public/assets/islands/*.jpg` and `web/public/assets/islands/transparent/*.webp` and are referenced via `artwork.legacyAssetPath` in `islandRegistry.ts`.

---

## 1. Visual Direction — Cozy Fantasy Floating Archipelago
- **Genre & Mood:** Whimsical miniature fantasy game-world artwork (tactile matte-clay tabletop diorama).
- **Organic, Non-Square Silhouettes:** Every island has a distinctive topic-driven silhouette (crescents, narrow rocky spires, twin headlands, elongated peninsulas, asymmetric coastal cliffs, curved hillside amphitheaters, and multi-islet floating clusters) with sculpted craggy sandstone/terracotta floating cliff roots and tiny drifting pebbles beneath.
- **Cohesive Technical Rules:**
  - **Camera:** 30° elevation 3/4 isometric view, centered with clean breathing margin.
  - **Lighting & Materials:** Matte pastel clay with soft bevels, warm golden top-left key light, cool sky ambient bounce, glowing warm amber lanterns, zero harsh black shadows or plastic glare.
  - **Zero Text Policy:** No embedded text, digits, signs, or UI chrome anywhere so all assets work natively in EN, VI, and future locales.
  - **Production Assets:**
    - Masters (`1024 × 1024` RGB JPEG): `web/public/assets/islands/v2/<id>.jpg`
    - Map Assets (`800 × 600` `4:3` RGBA transparent WebP, q88): `web/public/assets/islands/v2/transparent/<id>.webp`
    - 8-Island Contact Sheets: `web/public/assets/islands/v2/contact-sheet-light.png` & `contact-sheet-dark.png`
    - Full-World Before/After Comparisons: `web/public/assets/islands/v2/world-before-after-light.png` & `world-before-after-dark.png`

---

## 2. Complete Eight-Island Cozy Fantasy Production Set

| Island ID | Topic | Availability | v2 Silhouette & Architectural Landmark | Transparent WebP Size |
| :--- | :--- | :--- | :--- | :--- |
| `storage-harbor` | Arrays & Hashing | Verified Studio (`two-sum`) | Organic **crescent trading harbor** curving around a turquoise bay with honey-wood pier, moored sailboat, wooden cargo crane, coral-roofed harbor booth, and indexed pastel storage cubbies (zero digits). | `37.0 KB` |
| `stack-spire` | Stack (LIFO) | Verified Studio (`valid-parentheses`) | Tall, narrow **vertically tapered floating rocky pinnacle** with stacked pastel-teal & cream drum rings, mossy wooden doorway, lavender spiral stairs, and glowing amber crown lantern. | `19.0 KB` |
| `twin-beacon-bay` | Two Pointers | AI-Guided Preview | **Two separate floating rocky headland islets** facing across open sky with matching coral-roofed signal towers, joined by a long arched wooden bridge and converging stepping stones. | `41.1 KB` |
| `window-wharf` | Sliding Window | AI-Guided Preview | **Elongated diagonal peninsula wharf** with wooden boardwalk, raised garden bed sequence, and movable translucent pastel-teal glass greenhouse pavilion on round clay wheels. | `43.6 KB` |
| `halfway-lighthouse` | Binary Search | Verified Studio (`split-array-largest-sum`) | **Asymmetric twin-cliff coastal island** with central striped lighthouse & keeper's cottage dividing a lower sunlit wildflower meadow terrace (left) from a higher pine-clad rocky headland (right). | `46.7 KB` |
| `bridge-archipelago` | Graphs & BFS | AI-Guided Preview | **Six separate floating rocky islets** suspended across open air, radiating in clear BFS layers from a central lantern gazebo hub via curved wood-and-blue arched footbridges. | `53.4 KB` |
| `mosaic-meadow` | Dynamic Programming | AI-Guided Preview | **Curved organically terraced hillside amphitheater** stepping up from small pastel mosaic tiles along curved retaining walls to a sunlit hilltop coral-and-cream pavilion. | `47.2 KB` |
| `compass-cove` | Greedy | Verified Studio (`split-array-largest-sum`) | **Irregular windswept coastal cliff** jutting over a turquoise cove with prominent gold-and-teal 4-point compass plaza (zero letters), supply carts, blank signpost, and cliffside lookout trail. | `44.5 KB` |

---

## 3. Organic Archipelago Constellation & Labels (Implemented in Phase 7B.4)
- **Organic Constellation (`islandMapLayout.ts`):** Replaced the parallel 4×2 grid with varied elevation pockets (`yPct` spanning `17%–77%`), balanced scale multipliers (`1.02–1.08`), open sky breathing channels, and decorative clouds/breeze trails that never imply unsupported prerequisites.
- **Single-Language Unclipped Labels:** Vietnamese mode shows Vietnamese names only (`Cảng Lưu Trữ`, `Tháp Ngăn Xếp`, `Vịnh Đèn Đôi`, `Bến Cửa Sổ`, `Hải Đăng Trung Điểm`, `Quần Đảo Cầu Vòm`, `Thảo Nguyên Khảm`, `Vịnh La Bàn`); English mode shows English names only — rendered as compact single-line floating pills with zero ellipsis (`...`) so the 2.5D island artwork stays visually primary while full topic and evidence details appear in the sticky Side Inspector (desktop) or accessible Bottom Sheet (tablet/mobile).

---

## 4. Visual Island Growth (Phase 7C.1 & 7C.2 — All Four Verified Islands)
All four Verified-topic islands now feature pixel-registered 4-stage transparent WebP sets (`undiscovered`, `explored`, `developing`, `flourishing`) exported using a shared union bounding box per island under `web/public/assets/islands/v2/growth/<id>/`:
- **Storage Harbor (`storage-harbor`):** Quiet empty harbor → lantern & rowboat visit → active cubbies, crane & sailboat → watchtower pavilion, bunting, flower beds & golden lanterns.
- **Stack Spire (`stack-spire`):** Unlit sleeping spire → lit base doorway lantern & crate → glowing vertical spire with wall lanterns → balconies, spiral bunting, trailing ivy & flower planters.
- **Halfway Lighthouse (`halfway-lighthouse`):** Unlit quiet twin-cliff lighthouse → lit cottage & central plaza lantern → glowing midpoint beacon, bench & pine lookout → observation gazebo, bunting & dual-half trail lanterns.
- **Compass Cove (`compass-cove`):** Quiet natural compass headland → signpost, crate & trail lantern → packed supply carts & lit cliff lookout → expedition tent, cove pier/skiff, pennant flags & trail lanterns.

Each island also ships `growth-4stage-light.png` and `growth-4stage-dark.png` comparison sheets. The four AI-Guided Preview islands (`twin-beacon-bay`, `window-wharf`, `bridge-archipelago`, `mosaic-meadow`) remain unchanged preview islands.
