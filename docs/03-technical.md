# 3. Technical Documentation

## Technology stack and rationale
| Technology | Why |
|---|---|
| React 18 + Vite | Fast dev loop, component reuse, simple build |
| Tailwind CSS 3 | Consistent design tokens (brand/teal/amber) and responsive utilities |
| Tesseract.js 5 | Free OCR in the browser; images never leave the device; gives line confidence |
| Node `http` proxy | Keeps the AI provider key off the client; zero dependencies; one place to switch provider |
| Gemini API (optional; Claude switchable via `AI_PROVIDER`) | Better structuring and term explanation, guarded by evidence validation |
| LocalStorage | Simple, private demo history; no backend or accounts |

## System architecture
```
Browser (React)                              Server (optional)
 Scanner ─▶ ocr.js (Tesseract.js worker)
          └▶ pipeline.js ─▶ extract.js ─▶ fields
                         ├▶ glossary.js
                         └▶ ai.js ─ POST /api/enhance ─▶ server/index.js ─▶ Gemini API (or Claude)
 Results ◀ dates.js (expiry)                      ◀ JSON ◀
 History ◀▶ storage.js (LocalStorage)
 Export  ─▶ report.js (print window)
```

## Data flow
1. User selects an image (kept in memory as an object URL). If "Enhance image" is ticked, `preprocess.js` converts to grayscale, stretches contrast and upscales small images on a canvas; any failure falls back to the original.
2. Tesseract returns text, line confidences and overall confidence. Too little text or confidence < 35% → error.
3. `extractFields` builds the field map with evidence and status.
4. Glossary explanations are added for terms present in the text.
5. If AI is enabled, OCR text (not the image) goes to the proxy; the response is validated by `mergeAi`.
6. Results render; user edits and verifies. Save writes the record (text, fields, flags) to LocalStorage.

## Application workflow
Home → Scan (upload/demo) → Processing → Results (review, edit, verify) → Save / Export → History (view/delete).

## Components
`preprocess.js` (pure pixel functions + canvas wrapper) · `App` (view state) · `Landing` · `Scanner` (validation, OCR, progress) · `Results` (+ `Field` card) · `History` · `Disclaimer` · `Logo`.

## Folder structure
See README. Logic lives in `src/lib` as pure functions so it can be unit-tested in Node.

## API design
`GET /api/health` → `{ provider, configured }` (the UI disables the AI option when not configured)
`POST /api/enhance` `{ "text": "<OCR text>" }` → `{ fields:{key:{value,evidence}}, explanations:[{term,en,hi}] }`
Errors: 400 empty text, 503 not configured, 413 too long, 502 upstream/invalid JSON. The client treats any error as "OCR-only mode".

## Data storage
Key `medlens.history.v1` in LocalStorage: array (max 50) of records `{id, createdAt, isDemo, ocrText, ocrConf, fields, explanations, verified, ai}`. No images are stored.

## Security and privacy
- API key only in server environment (`.env`, git-ignored); never `VITE_`-prefixed.
- Only text is sent to the proxy, and only if the user ticks the AI option.
- Proxy limits body size (50 kB). React escapes output; the print report HTML-escapes all values.
- Prompt-injection text inside a label cannot change app behaviour: AI output is parsed as data and validated against the OCR text.
- Known gaps: the proxy has no auth or rate limiting (fine for local demo; add both before any public deployment). LocalStorage is unencrypted; shared devices can read history.
