// Usage: python3 tests/preprocess-eval/make_variants.py /tmp/ev && node tests/preprocess-eval/run.mjs /tmp/ev
// Runs the REAL src/lib/preprocess.js, then Tesseract CLI, then the REAL extractor. Dev-only, indicative.
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { preprocess } from '../../src/lib/preprocess.js';
import { extractFields } from '../../src/lib/extract.js';

const dir = process.argv[2] || '/tmp/ev';
const modes = ['none', 'scale', 'stretch', 'binarize'];
const CHECKS = {
  expiry: (f) => f.expiry.value === '02/2028', mfg: (f) => f.mfgDate.value === '03/2025',
  strength: (f) => /500\s?mg/i.test(f.strength.value), maker: (f) => /sample pharma/i.test(f.manufacturer.value),
  dosage: (f) => /physician/i.test(f.dosage.value), warnings: (f) => /keep out of reach/i.test(f.warnings.value),
  storage: (f) => /below 25/i.test(f.storage.value),
};
const names = fs.readdirSync(dir).filter((n) => n.endsWith('.rgba')).map((n) => n.replace('.rgba', ''));
const table = {}; const wrongExpiry = [];
for (const n of names) {
  const { w, h } = JSON.parse(fs.readFileSync(`${dir}/${n}.json`));
  const rgba = new Uint8ClampedArray(fs.readFileSync(`${dir}/${n}.rgba`));
  for (const mode of modes) {
    const r = preprocess(rgba, w, h, { mode: mode === 'scale' ? 'scale' : mode });
    // 'none' = grayscale only, no resize; 'scale' = grayscale + upscale only
    const pgm = Buffer.concat([Buffer.from(`P5\n${r.w} ${r.h}\n255\n`), Buffer.from(r.gray)]);
    const p = `${dir}/${n}.${mode}.pgm`; fs.writeFileSync(p, pgm);
    let text = ''; try { text = execFileSync('tesseract', [p, 'stdout', '--psm', '6'], { stdio: ['ignore', 'pipe', 'ignore'] }).toString(); } catch {}
    const f = extractFields(text.split('\n').map((t) => ({ text: t, conf: null })));
    const score = Object.values(CHECKS).filter((c) => c(f)).length;
    // Safety metric: an expiry value that is present but WRONG is worse than "Not detected".
    if (f.expiry.status !== 'not_detected' && f.expiry.value !== '02/2028') wrongExpiry.push(`${n}/${mode}: "${f.expiry.value}"`);
    (table[n] ||= {})[mode] = score;
  }
}
console.log('Fields correct out of 7 (higher is better)');
console.log('variant'.padEnd(13) + modes.map((m) => m.padStart(10)).join(''));
const tot = Object.fromEntries(modes.map((m) => [m, 0]));
for (const n of names) { console.log(n.padEnd(13) + modes.map((m) => { tot[m] += table[n][m]; return String(table[n][m]).padStart(10); }).join('')); }
console.log('TOTAL'.padEnd(13) + modes.map((m) => String(tot[m]).padStart(10)).join(''), `(max ${names.length * 7})`);
console.log('Wrong (non-empty) expiry readings:', wrongExpiry.length ? wrongExpiry.join('; ') : 'none');
