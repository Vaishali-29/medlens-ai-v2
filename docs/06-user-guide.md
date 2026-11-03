# 6. User Guide

## Opening the app
Run `npm run dev` and open http://localhost:5173 (or the deployed URL). Choose **Scan a medicine** on the home page, or **Scan** in the top bar.

## Uploading an image
1. Take a sharp photo: good light, label flat, text filling the frame, no glare.
2. Drag the file onto the dashed area, or press **Choose or take a photo** (on a phone this can open the camera).
3. Only JPG, JPEG and PNG up to 10 MB are accepted. Otherwise you will see an error explaining what to change.
4. Check the preview, then press **Scan label**.

## Scanning
Reading happens on your device. The first scan downloads language data and can take longer. If the app says it could not read enough text, retake the photo.
No photo yet? Press **Use demo sample** to see fictional data (clearly labelled).

## Verifying the result
- Each card shows the value, a badge (Read by OCR / Needs checking / Not detected / Edited by you), the OCR confidence and the **source line**.
- Compare each value with the real package. Press **Edit** to correct it, or **Add manually** for missing items, then tick **Checked against package**.
- The **Expiry check** card shows Expired, Not expired or Unable to determine. "Not expired" never means a medicine is safe.
- Warnings, storage and dosage are copied exactly as printed; they are not advice from MedLens AI.
- Open **Original OCR text** to see the raw reading.

## History and export
- **Save to history** keeps the text result in this browser only (images are never saved). Re-save after editing.
- **Scan history** lists saved scans: **View**, **Delete**, or **Delete all history** (asks to confirm).
- **Export / print report** opens a printable page; use Print → Save as PDF. Unchecked fields are marked UNVERIFIED.

## Optional AI enhancement
Tick the AI enhancement option (Gemini by default) on the scan page only if your administrator configured the server. If the server has no key the option is greyed out with a note and OCR-only results.

## Medical questions
MedLens AI cannot answer them. Please ask a pharmacist or doctor.
