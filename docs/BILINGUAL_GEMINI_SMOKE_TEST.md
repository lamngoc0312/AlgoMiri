# AlgoMiri — Manual Bilingual Gemini Smoke Test

This guide documents a safe, repeatable manual smoke test for live bilingual Gemini integration (`en` and `vi`) across `/api/analyze` and `/api/tutor`.

> [!IMPORTANT]
> - **CI does not require a Gemini API key.** Automated tests (Vitest, Pytest, Playwright E2E) run deterministically with mocks or `OfflineDemoProvider`.
> - **Never commit real API keys** or `.env` files. Only configure `GEMINI_API_KEY` locally in `api/.env`.
> - **Honest reporting:** Only record a live Gemini check as passed after executing it against a real running backend with a valid key. Mock test passes do not prove live provider behavior.

---

## Prerequisites

1. Configure `api/.env` locally (copy from `api/.env.example`):
   ```env
   GEMINI_API_KEY=<your-local-key>
   GEMINI_MODEL=gemini-2.5-flash
   ```
2. Start the backend from `api/`:
   ```powershell
   .\.venv\Scripts\uvicorn.exe app.main:app --host 127.0.0.1 --port 8000
   ```
3. Start the frontend from `web/`:
   ```powershell
   npm run dev
   ```
4. Open `http://localhost:5173` in a browser and open DevTools → Network tab to confirm request payloads (`locale: "vi"` / `locale: "en"`).

---

## Test Scenarios

### 1. Vietnamese Problem Analysis (`locale: "vi"`)
1. Switch the navbar language selector to **VI**.
2. Paste a Vietnamese problem statement (e.g., *"Cho mảng các mệnh giá xu coins và tổng mục tiêu amount. Hãy tìm số lượng đồng xu ít nhất cần dùng để tạo đúng tổng amount, hoặc trả về -1 nếu không thể."*).
3. Click **Phân tích bài toán (AI)**.
4. **Verify:**
   - Network request `POST /api/analyze` sends `"locale": "vi"` in the JSON body (not embedded inside `problem_statement`).
   - Structured analysis (title, plain-language summary, worked example, conceptual steps, candidate strategies) is returned in natural Vietnamese while preserving code/variable names (`coins`, `amount`, Big-O notation).
   - Reader tabs (**Diễn giải**, **Cách tiếp cận**, **Ràng buộc & Trường hợp biên**) and verified-matching summary render cleanly in Vietnamese in both Light and Dark modes.

### 2. English Problem Analysis (`locale: "en"`)
1. Switch the navbar language selector to **EN**.
2. Paste an English problem statement (e.g., *"Given an array of coin denominations and a target amount, return the fewest number of coins needed to make up that amount."*).
3. Click **Analyze Problem (AI)**.
4. **Verify:**
   - Network request `POST /api/analyze` sends `"locale": "en"`.
   - Structured analysis returns in English with all English Reader labels.

### 3. Vietnamese AI Tutor (`locale: "vi"`)
1. With language set to **VI**, open the **Hỏi Gia sư AI** tab (on Landing after analysis, or inside `/studio/two-sum`).
2. Click **Cho một gợi ý** and/or submit a custom question in Vietnamese.
3. **Verify:**
   - Network request `POST /api/tutor` sends `"locale": "vi"`.
   - Reply, guiding question, progressive hint, and disclaimer appear in Vietnamese, tagged with `VI`.
   - Switching to the Analysis/Explanation tab and back preserves the Tutor reply.

### 4. English AI Tutor (`locale: "en"`)
1. Switch the navbar language selector to **EN** inside the same workspace.
2. Click **Give a hint** or ask a custom question in English.
3. **Verify:**
   - Network request `POST /api/tutor` sends `"locale": "en"`.
   - The new English reply appends with an `EN` tag while the earlier Vietnamese reply stays preserved with its `VI` tag.

### 5. Switching Language After Receiving a Result & Clear Safety
1. Generate an analysis in **EN**, then switch the navbar selector to **VI**.
2. **Verify:**
   - **No automatic network call** is fired on language switch.
   - The amber mismatch banner appears in Vietnamese (*"Phân tích này được tạo bằng Tiếng Anh..."*) while the previous English analysis remains readable.
3. Click **Tạo lại bằng Tiếng Việt**:
   - Confirm `POST /api/analyze` is sent with `"locale": "vi"` and replaces the analysis only after succeeding.
4. Start another regeneration, and while it is still loading, click **Xóa** (Clear):
   - Confirm the in-flight request is aborted, the loading indicator resets immediately, and no late response repopulates the page.

---

## Known Limitations
- Verified deterministic Studio matching (`api/app/routing.py`) currently uses English-oriented recognition patterns and English `reason` / `compatibility_checks` / `user_input_note` metadata. Vietnamese problem statements may stay `conceptual_only` or `ambiguous`; matching safeguards are intentionally not relaxed.
