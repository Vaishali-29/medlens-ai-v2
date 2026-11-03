import assert from 'node:assert/strict';
import { mergeAi } from '../src/lib/ai.js';
import { extractFields } from '../src/lib/extract.js';

const text = 'Some Tablets\nB No 12';
const base = extractFields([{ text: 'Some Tablets', conf: null }]);
const real = mergeAi(base, [], { fields: { batch: { value: '12', evidence: 'B No 12' } } }, text);
assert.equal(real.fields.batch.value, '12'); assert.equal(real.fields.batch.status, 'uncertain');
const fake = mergeAi(base, [], { fields: { expiry: { value: '01/2030', evidence: 'Exp 01/2030' }, manufacturer: { value: 'Acme', evidence: 'Mfd by Acme' } } }, text);
assert.equal(fake.fields.expiry.status, 'not_detected'); assert.equal(fake.rejected, 2);
const ex = mergeAi(base, [], { fields: {}, explanations: [{ term: 'Tablets', en: 'x' }, { term: 'Aspirin', en: 'invented' }] }, text);
assert.equal(ex.explanations.length, 1);
const noOverride = mergeAi({ ...base, name: { ...base.name, status: 'detected', value: 'Keep' } }, [], { fields: { name: { value: 'Some', evidence: 'Some Tablets' } } }, text);
assert.equal(noOverride.fields.name.value, 'Keep');
console.log('PASS ai-guard (4 checks)');
