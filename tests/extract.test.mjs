import assert from 'node:assert/strict';
import { extractFields } from '../src/lib/extract.js';
import { evaluateExpiry, parseDate } from '../src/lib/dates.js';
import { SAMPLE_LINES } from '../src/lib/sample.js';
import { explainTerms } from '../src/lib/glossary.js';

const TODAY = new Date(2026, 9, 30);
let pass = 0;
const t = (name, fn) => { try { fn(); pass++; console.log('PASS', name); } catch (e) { console.log('FAIL', name, '\n  ', e.message); process.exitCode = 1; } };

const f = extractFields(SAMPLE_LINES);
t('extracts batch', () => assert.equal(f.batch.value, 'DEMO0001'));
t('extracts expiry, not mfg', () => assert.equal(f.expiry.value, '02/2028'));
t('extracts mfg separately', () => assert.equal(f.mfgDate.value, '03/2025'));
t('extracts manufacturer across 2 lines', () => assert.match(f.manufacturer.value, /Sample Pharma Ltd\. Indore/));
t('extracts strength', () => assert.match(f.strength.value, /500 mg/));
t('extracts dosage verbatim', () => assert.match(f.dosage.value, /As directed by the physician/));
t('extracts warnings', () => assert.match(f.warnings.value, /Keep out of reach/));
t('extracts storage', () => assert.match(f.storage.value, /below 25/));
t('name is flagged uncertain (heuristic)', () => assert.equal(f.name.status, 'uncertain'));

const empty = extractFields([{ text: 'lorem ipsum', conf: null }]);
t('missing fields are "Not detected"', () => { assert.equal(empty.expiry.value, 'Not detected'); assert.equal(empty.batch.status, 'not_detected'); });
t('mfg-only label gives no expiry', () => assert.equal(extractFields([{ text: 'Mfg. Date: 03/2025', conf: null }]).expiry.status, 'not_detected'));
t('low OCR confidence marks field uncertain', () => assert.equal(extractFields([{ text: 'Exp. Date: 02/2028', conf: 40 }]).expiry.status, 'uncertain'));

t('future month/year -> not_expired', () => assert.equal(evaluateExpiry('02/2028', TODAY).status, 'not_expired'));
t('past month/year -> expired', () => assert.equal(evaluateExpiry('05/2024', TODAY).status, 'expired'));
t('current month is valid until month end', () => assert.equal(evaluateExpiry('10/2026', TODAY).status, 'not_expired'));
t('ambiguous 10/11/2026 -> unknown', () => assert.equal(evaluateExpiry('10/11/2026', TODAY).status, 'unknown'));
t('unambiguous 25/12/2026 -> not_expired', () => assert.equal(evaluateExpiry('25/12/2026', TODAY).status, 'not_expired'));
t('month name parsed', () => assert.equal(evaluateExpiry('JAN 2024', TODAY).status, 'expired'));
t('garbage -> unknown', () => assert.equal(evaluateExpiry('99/99', TODAY).status, 'unknown'));
t('2-digit year noted', () => assert.ok(parseDate('02/28').notes.length));
t('glossary only for present terms', () => { const e = explainTerms('DEMO TABLETS'); assert.ok(e.some((x) => x.term === 'TABLET')); assert.ok(!e.some((x) => x.term === 'CAPSULE')); });

t('implausible far-future year (OCR misread 02/2628) -> unknown', () => assert.equal(evaluateExpiry('02/2628', TODAY).status, 'unknown'));
t('expiry earlier than mfg -> unknown', () => assert.equal(evaluateExpiry('02/2024', TODAY, '03/2025').status, 'unknown'));
t('expiry after mfg still evaluated', () => assert.equal(evaluateExpiry('02/2028', TODAY, '03/2025').status, 'not_expired'));
t('ambiguous mfg does not trigger mismatch', () => assert.equal(evaluateExpiry('02/2028', TODAY, '05/06/2025').status, 'not_expired'));

console.log(`\n${pass} passed`);
