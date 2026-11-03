# 7. Project Report: MedLens AI

## Introduction
MedLens AI is a browser-based prototype that reads medicine packaging and presents the printed information in a structured, verifiable form with plain-language explanations.

## Problem statement
Medicine labels are hard to read and interpret. Generic AI assistants can add convincing but unsupported details, which is unacceptable for healthcare information.

## Objectives
Accurate-as-possible extraction with visible evidence; conservative expiry handling; plain-language explanations kept separate from package text; privacy-first design; transparent testing.

## Methodology
Design started from the safety constraints: *what must the system never do?* (diagnose, prescribe, advise on dose, invent data, declare safety). Architecture then separated **facts** (OCR text) from **interpretation** (rules, glossary, AI). Pure logic was written first and unit-tested in Node; UI followed. AI was treated as an untrusted component whose output must be validated against the source text.

## Architecture
Three layers: (1) OCR (Tesseract.js, on device); (2) deterministic extraction + expiry logic; (3) optional Gemini structuring (Claude switchable) through a server proxy, guarded by an evidence check. See `03-technical.md`.

## Implementation
React/Vite/Tailwind front end; `extract.js` rule engine with source-line evidence; `dates.js` handling month-end validity, two-digit years and day/month ambiguity; `ai.js` hallucination guard; LocalStorage history; HTML print report; Node proxy (Gemini default, Claude switchable); labelled demo mode.

## Results
- **Executed:** 25 logic tests, 4 AI-guard checks and 8 preprocessing checks pass; all components compile with esbuild; sample labels were OCR'd with the Tesseract CLI; a preprocessing experiment on 10 degraded variants showed upscaling helps very small images, binarization is harmful (rejected), and hard combined degradation is not fixable. That experiment exposed a misread expiry ("02/2628"), which led to a plausibility check.
- **Not yet executed:** installation from npm, production build, OCR on real photos, browser UI journey, responsive checks, live Gemini/Claude calls. See `05-testing.md` for the per-case status. No accuracy percentage is claimed because none has been measured.

## Limitations
OCR quality limits everything downstream; heuristic extraction may mislabel lines (especially the name); English OCR only; static Hindi text unreviewed; no proxy authentication; LocalStorage unencrypted; not a medical device.

## Conclusion
The prototype demonstrates a responsible pattern for AI in healthcare information: show the evidence, say "Not detected" instead of guessing, keep humans in the verification loop, and validate AI output against the source.

## Future scope
Deskew and glare handling (basic contrast/upscale enhancement already added as opt-in); multilingual OCR; barcode/QR lookup against verified data; pharmacist review mode; measured accuracy on a labelled image set; accessibility audit; E2E tests; authenticated, rate-limited proxy.
