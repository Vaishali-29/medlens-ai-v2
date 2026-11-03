# MedLens AI — Scan. Understand. Stay Informed.

An AI-assisted medicine label reader. Upload a photo of a medicine box, strip or bottle; MedLens AI reads the printed text (OCR), organises it into fields, explains hard terms in plain English/Hindi, and handles expiry dates carefully.

> **Not medical advice.** It never diagnoses, prescribes, suggests doses, checks interactions, or declares a medicine safe. It only shows what is printed on the package, and every value should be verified against the original.

## Features
- Upload or drag-and-drop JPG/JPEG/PNG; image preview; on-device OCR (Tesseract.js) with progress
- Rule-based extraction of 10 fields, each with its **source line** and OCR confidence; missing data shows "Not detected"
- Expiry check: expired / not expired / unable to determine. Ambiguous dates (e.g. 10/11/2026) are never forced; manufacturing date is never used as expiry
- Opt-in image enhancement (grayscale, contrast stretch, upscale) for small/low-contrast photos
- Plausibility checks on expiry (far-future years, expiry before manufacture → "unable to determine")
- Manual correction + per-field "checked against package" tick
- Warnings, storage and printed dosage shown verbatim, in visually distinct cards
- Plain-language glossary (English/Hindi), shown only for terms present in the text
- Scan history in LocalStorage (text only, images are never stored); delete one or all
- Printable / save-as-PDF report with unverified fields clearly marked
- Optional AI enhancement via a server-side proxy: **Gemini by default**, Claude switchable (API key never in frontend)
- Labelled demo sample (fictional data) so the app can be shown without a photo

## Tech stack
React 18 · Tailwind CSS 3 · Tesseract.js 5 · Node (zero-dependency proxy) · LocalStorage. Vite is used purely as the build tool (the successor to the deprecated Create React App); there is no Vite-specific application code.

## Setup
```bash
npm install
npm run dev            # http://localhost:5173
npm test               # logic tests (no install needed beyond Node 18+)
npm run test:samples   # OCR sample labels with the Tesseract CLI (dev-only, needs tesseract installed)
npm run eval:preprocess  # preprocessing experiment (needs Python + Pillow + numpy + tesseract CLI)
```
Optional AI enhancement:
```bash
cp .env.example .env   # put your key in GEMINI_API_KEY (confirm GEMINI_MODEL is current)
npm run check:ai       # one real test call; prints the exact error if the key/model is wrong
npm run server         # SECOND terminal, must stay running alongside `npm run dev` (Node 20.6+)
# After editing .env: restart `npm run server`, then refresh the browser page.
# To use Claude instead: AI_PROVIDER=anthropic and ANTHROPIC_API_KEY=...
```
Without a key the app runs in OCR-only mode and says so.

## Architecture
```
Image ─▶ Tesseract.js (browser) ─▶ lines + confidence ─▶ extract.js (rules) ─▶ fields + evidence
                                                       └▶ glossary.js (known terms present in text)
Optional: OCR text ─▶ /api/enhance (Node proxy) ─▶ Gemini (or Claude) ─▶ JSON ─▶ ai.js evidence guard ─▶ merge (gaps only)
Fields ─▶ dates.js (expiry) ─▶ Results UI ─▶ LocalStorage history / print report
```
```
src/lib/{ocr,extract,dates,glossary,ai,pipeline,storage,report,sample}.js
src/components/{Landing,Scanner,Results,History,Disclaimer,Logo}.jsx
server/{index,prompt}.js   tests/   docs/
```

## Limitations
- OCR on curved, glossy, blurred or low-light packaging is unreliable; handwritten or stylised fonts may fail. English only.
- Extraction is heuristic: medicine name is always flagged "needs checking".
- Hindi definitions are static glossary text and should be reviewed by a native speaker.
- Not a regulated medical device.

## Future scope
Multi-language OCR, barcode/QR lookup against verified databases, deskew/glare handling, pharmacist review mode, accessibility audit, automated E2E tests.

## Screenshots
_Add after running locally:_ `docs/screenshots/landing.png`, `scanner.png`, `results.png`.

## Documentation (`docs/`)
1. `01-project-overview.md` · 2. `02-prd.md` · 3. `03-technical.md` · 4. `04-ai-prompt-engineering.md` · 5. `05-testing.md` · 6. `06-user-guide.md` · 7. `07-project-report.md` · 8. `08-presentation.md` (script, demo sequence, interview Q&A)

Sample (fictional) label images for demos: `tests/samples/`.

## Deploy on Render (single web service)
`.env` is git-ignored, so Render never has it. Set the values in the Render dashboard instead.
- Build command: `npm install && npm run build`
- Start command: `npm start`  (NOT `npm run server`, which requires a `.env` file)
- Environment variables: `GEMINI_API_KEY` (required), `GEMINI_MODEL=gemini-3.8-flash`, `AI_PROVIDER=gemini`. Render sets `PORT` itself.
- Or use the included `render.yaml` as a Blueprint. Check `https://<your-app>.onrender.com/api/health` shows `"configured":true`.

## Split deploy: frontend on Vercel, API on Render
1. **Render** env vars: `GEMINI_API_KEY`, `GEMINI_MODEL=gemini-3.8-flash`, `ALLOWED_ORIGINS=https://medlens-ai-tawny.vercel.app` (no trailing slash). Redeploy.
2. **Vercel** env var: `VITE_API_BASE=https://medlens-ai-o8bg.onrender.com`, then redeploy (Vite bakes it in at build time).
3. Verify `https://medlens-ai-o8bg.onrender.com/api/health` shows `"configured":true`. The Render free tier sleeps when idle; the first request can take ~30-60 s.

## Deploy everything on Vercel (recommended; no separate backend)
`api/health.js` and `api/enhance.js` are Vercel serverless functions that share their logic with `server/core.js`. The frontend and API live on the same domain, so no CORS and no `VITE_API_BASE`.
1. Import the repo in Vercel (framework preset: Vite).
2. Settings > Environment Variables (Production): `GEMINI_API_KEY`, `GEMINI_MODEL=gemini-3.8-flash`, `AI_PROVIDER=gemini`. **Do not** set `VITE_API_BASE`.
3. Redeploy, then open `https://<your-app>.vercel.app/api/health` and confirm `"configured":true`.
Locally, `npm run dev` + `npm run server` still works as before (Vite proxies `/api` to port 8787).
