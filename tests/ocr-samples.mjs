// Dev-only check: OCR the sample images with the Tesseract CLI, then run our extractor + expiry logic.
// Not the same build as Tesseract.js in the browser, so treat results as indicative only.
import { execFileSync } from 'node:child_process';
import { extractFields } from '../src/lib/extract.js';
import { evaluateExpiry } from '../src/lib/dates.js';
for (const f of ['sample-clear', 'sample-no-expiry', 'sample-expired', 'sample-ambiguous-date']) {
  const text = execFileSync('tesseract', [`tests/samples/${f}.png`, 'stdout', '--psm', '6']).toString();
  const fl = extractFields(text.split('\n').map((t) => ({ text: t, conf: null })));
  const ex = fl.expiry.status === 'not_detected' ? { status: 'unknown (not detected)' } : evaluateExpiry(fl.expiry.value, new Date(2026, 9, 30));
  console.log(`${f}: expiry="${fl.expiry.value}" -> ${ex.status} | batch=${fl.batch.value} | mfg=${fl.mfgDate.value} | strength=${fl.strength.value} | maker=${fl.manufacturer.value}`);
}
