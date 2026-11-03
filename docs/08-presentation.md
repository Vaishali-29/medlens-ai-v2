# 8. Presentation Documentation

> Update the **Demo** and **Results** lines after you have run the app. Only claim what you have actually seen working.

## Video script (about 2 min 30 s, roughly 340 words)

**[0:00 Problem, on landing page]**
"Medicine labels are packed with tiny print and abbreviations. Finding the expiry date or understanding a term like 'IP' or 'B.No.' isn't easy, especially for elderly people and caregivers. And if you ask a general AI chatbot, it may confidently make things up, which is dangerous in healthcare."

**[0:30 Solution]**
"This is MedLens AI: Scan. Understand. Stay informed. It reads the printed text on a medicine package, organises it, and explains difficult terms in simple English or Hindi. It never diagnoses, recommends doses, or says a medicine is safe."

**[0:50 Demo, on screen]**
"I upload a photo of a package. OCR runs in my browser, so the image never leaves my device. Here are the extracted fields. Each one shows the exact line it came from and a confidence badge. Anything missing says 'Not detected'. It doesn't guess."
"The expiry card shows expired, not expired, or unable to determine. If a date is ambiguous, like 10/11/2026, it refuses to guess. And it reminds you that not expired does not mean safe."
"I can correct a field, tick that I've checked it against the package, save it to history, and export a report where unchecked fields are marked unverified."

**[1:35 AI and prompt engineering]**
"The core is OCR plus deterministic rules, so it works with no API key. Optionally, Gemini re-structures the text. My prompt forces verbatim evidence for every value, bans inference, and bans medical advice. Then the app double-checks: if the quoted evidence isn't actually in the OCR text, the value is rejected. AI can only fill gaps, never override."

**[2:00 Development and challenges]**
"I built the logic first as pure functions and unit-tested it: expiry boundaries, ambiguous dates, and the hallucination guard. The hardest part was designing for what the system must never do. OCR quality is the main limitation, so low-confidence values are flagged."

**[2:20 Outcome]**
"The result is a transparent prototype that treats AI as untrusted and keeps the user in control. Next steps: image preprocessing, multilingual OCR, barcode lookup and pharmacist review. Thank you."

## Demonstration sequence
1. Landing page and disclaimer (10 s).
2. Upload `tests/samples/sample-clear.png` (demo label), press Scan (20 s).
3. Walk through expiry card, warnings card, source lines (30 s).
4. Edit one field, tick verified (10 s).
5. Upload `sample-no-expiry.png` to show "Not detected" and "Unable to determine" (15 s).
6. Save, open History, export report (15 s).
Always say the sample images are fictional demo labels.

## Interview questions and suggested answers
**Why OCR plus rules instead of only an LLM?** Rules are deterministic, free, offline and auditable. An LLM adds flexibility but can hallucinate, so I use it as an optional, validated layer.

**How do you prevent hallucination?** Prompt requires verbatim evidence; client rejects values whose evidence isn't in the OCR text; AI only fills empty fields; explanations only for terms present; everything labelled by source.

**What if OCR misreads a digit?** Low-confidence lines are flagged; unparseable dates become "Unable to determine"; the user can edit and verify. The OCR text is always visible.

**How do you handle ambiguous dates?** Both readings are evaluated; if they give different expiry results the status is "Unable to determine".

**Is it safe to rely on?** No, and the app says so. It's an information aid; users must verify against the package and ask a pharmacist.

**How is privacy handled?** On-device OCR, images not stored, history is text-only in LocalStorage, API key server-side, AI is opt-in and sends text only.

**What did you test and what didn't you?** Logic and AI guard were unit-tested; compile checked. (State honestly which UI/OCR tests you have since run.) Live Gemini testing and a measured accuracy set are future work.

**Did you try improving OCR with preprocessing?** Yes, I measured it on degraded demo labels. Upscaling rescued very small images, but adaptive binarization made some cases worse and even produced a wrong expiry year, so I rejected it, kept a simple opt-in enhancement, and added a plausibility check for implausible dates. It's a small synthetic test, so I treat it as indicative.

**What would you do next?** Image preprocessing, a labelled test set to measure accuracy, pharmacist review, multilingual support, proxy auth and rate limiting.

**What are the ethical risks?** Over-trust in OCR output, false reassurance from "not expired", and misleading translations. Mitigations: evidence display, explicit warnings, labelled sources, native-speaker review of Hindi.
