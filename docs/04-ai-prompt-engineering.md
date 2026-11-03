# AI and Prompt Engineering

## How AI is used
1. **OCR (Tesseract.js)** converts pixels to text and gives per-line confidence. It is the only source of facts.
2. **Rule-based extraction** (`extract.js`) is the default structuring layer. It is deterministic and works offline.
3. **Gemini (optional; Claude is a switchable alternative)** re-structures the OCR text and writes short term explanations. It can only fill fields the rules left as "Not detected", and only if the evidence it quotes appears verbatim in the OCR text (`ai.js`). AI-sourced values are labelled "Needs checking"; AI explanations are labelled "AI-generated".

## System prompt
Stored in `server/prompt.js` and shared by both providers. For Gemini it is sent as `systemInstruction` with `responseMimeType: application/json` and `temperature: 0`. Key rules: use only the OCR text; every value must carry verbatim evidence or be null; never infer expiry or treat mfg date as expiry; no diagnosis/dosage/interaction/safety statements; explanations are definitions only (≤25 words); unreadable input → all null; JSON only.

## Prompt design iterations (design rationale, **not** test results)
| Version | Change | Reason |
|---|---|---|
| v1 | "Extract the fields as JSON" | Baseline. Risk: model fills gaps from general knowledge. |
| v2 | Added "use ONLY the text; null if absent" | Reduces invention of missing fields. |
| v3 | Added mandatory verbatim `evidence` per field | Makes output machine-checkable; the client rejects values whose evidence is not in the OCR text. |
| v4 | Explicit expiry vs manufacturing-date rule; ban on safety/dosage/interaction statements | Healthcare risk controls. |
| v5 | "Unreadable → all null"; JSON-only; explanation word limit | Handles bad OCR; stable parsing. |

> **Status:** these iterations are design decisions. The prompt has **not** yet been run against the live Gemini or Claude API (no key was available). The proxy request/response handling was tested only against a local mock (`tests/proxy.test.mjs`). Run the cases in `docs/05-testing.md` Section C with a key, then record actual outputs here.

## Error handling and uncertainty
- OCR confidence < 70% on a source line → field "Needs checking". OCR < 35% overall or < 20 alphanumerics → "could not read enough text" error.
- Proxy missing key / invalid JSON / API error → app falls back to OCR-only and tells the user.
- Ambiguous date order with differing outcomes → "Unable to determine".

## Example (design-time, illustrative)
Input OCR: `Exp. Date: 02/2028` → expected output `expiry: {value:"02/2028", evidence:"Exp. Date: 02/2028"}`.
Input OCR with no expiry line → expected `expiry: {value:null, evidence:null}`.
