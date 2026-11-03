// Deterministic, rule-based field extraction from OCR lines. Works with no API key.
// Every value carries the exact source line ("evidence") so users can verify it.
import { DATE_RE } from './dates.js';

const STRENGTH_RE = /\b\d+(?:\.\d+)?\s?(?:mg|mcg|µg|ug|g|ml|iu|%)(?![a-z])/gi;
const FORM_RE = /(tablets?|capsules?|syrup|suspension|injection|cream|ointment|gel|drops|lotion|powder|sachet)/i;
const KEYS = {
  mfg: /\b(?:mfg|mfd|manufactur\w*)\b\.?(?!\s*by)\s*(?:date|dt|on)?\s*[:.\-]?\s*/i,
  exp: /\b(?:exp|expiry|expiration|use\s*before|use\s*by)\b\.?\s*(?:date|dt|on)?\s*[:.\-]?\s*/i,
  batch: /\b(?:b\.?\s?no|batch(?:\s*(?:no|number|#))?|lot(?:\s*no)?)\b\.?\s*[:.\-#]?\s*/i,
  maker: /\b(?:manufactured|mfd\.?|mfg\.?|marketed)\s*by\b\s*[:\-]?\s*/i,
  dosage: /\b(?:dosage|dose|directions?|how to use)\b\s*[:\-]?\s*/i,
  warn: /\b(?:warning|warnings|caution|precautions?|contraindications?|keep out of (?:the )?reach|not to be used|do not)\b/i,
  store: /\b(?:store|storage|keep in a|protect from|keep below)\b/i,
  compo: /\b(?:each|composition|contains|ingredients?)\b/i,
};
const anyKey = (t) => Object.values(KEYS).some((r) => r.test(t));

const LOW_CONF = 70;
const minConf = (ls) => { const c = ls.map((l) => l.conf).filter((c) => c != null); return c.length ? Math.min(...c) : null; };

function field(label, parts, { heuristic = false } = {}) {
  if (!parts || !parts.value) return { label, value: 'Not detected', status: 'not_detected', conf: null, evidence: '' };
  const conf = minConf(parts.lines);
  const uncertain = heuristic || (conf != null && conf < LOW_CONF);
  return {
    label, value: parts.value, status: uncertain ? 'uncertain' : 'detected', conf,
    evidence: parts.lines.map((l) => l.text).join(' / '),
    note: heuristic ? 'Guessed from layout — verify.' : conf != null && conf < LOW_CONF ? 'Low OCR confidence — verify.' : '',
  };
}

function valueAfter(lines, re, { dateOnly = false } = {}) {
  for (const l of lines) {
    const m = l.text.match(re);
    if (!m) continue;
    const rest = l.text.slice(m.index + m[0].length).trim();
    if (dateOnly) { const d = rest.match(DATE_RE); if (d) return { value: d[1].trim(), lines: [l] }; continue; }
    if (rest) return { value: rest, lines: [l] };
  }
  return null;
}

function section(lines, startRe, max = 3) {
  const i = lines.findIndex((l) => startRe.test(l.text));
  if (i < 0) return null;
  const picked = [lines[i]];
  for (let j = i + 1; j < lines.length && picked.length < max; j++) {
    if (anyKey(lines[j].text) && !startRe.test(lines[j].text)) break;
    picked.push(lines[j]);
  }
  return { value: picked.map((l) => l.text).join(' ').replace(/\s+/g, ' ').trim(), lines: picked };
}

/** lines: [{ text, conf|null }] */
export function extractFields(lines) {
  lines = lines.filter((l) => l.text && l.text.trim()).map((l) => ({ ...l, text: l.text.trim() }));

  // Medicine name (heuristic): first early line that looks like a product line.
  const head = lines.slice(0, 8).filter((l) => !anyKey(l.text) && /[A-Za-z]{4,}/.test(l.text));
  const nameLine = head.find((l) => FORM_RE.test(l.text)) || head.find((l) => l.text === l.text.toUpperCase());
  const name = field('Medicine name', nameLine && { value: nameLine.text, lines: [nameLine] }, { heuristic: true });

  // Composition: lines with a strength, excluding date/batch lines.
  const compLines = lines.filter((l) => (l.text.match(STRENGTH_RE) || []).length && !KEYS.exp.test(l.text) && !KEYS.mfg.test(l.text) && !KEYS.batch.test(l.text) && !/\b(?:store|below|°\s?c)/i.test(l.text));
  const compo = field('Active ingredients / composition', compLines.length && { value: compLines.map((l) => l.text).join('; '), lines: compLines });
  const strengths = [...new Set(compLines.flatMap((l) => l.text.match(STRENGTH_RE) || []).map((s) => s.replace(/\s+/g, ' ')))];
  const strength = field('Strength', strengths.length && { value: strengths.join(', '), lines: compLines });

  const makerParts = (() => {
    const i = lines.findIndex((l) => KEYS.maker.test(l.text));
    if (i < 0) return null;
    const m = lines[i].text.match(KEYS.maker);
    let value = lines[i].text.slice(m.index + m[0].length).trim();
    const picked = [lines[i]];
    const next = lines[i + 1];
    if (next && !anyKey(next.text) && !/\d{2}[\/\-.]\d/.test(next.text) && next.text.length < 60) { value = (value + ' ' + next.text).trim(); picked.push(next); }
    return value ? { value, lines: picked } : null;
  })();

  const batch = valueAfter(lines, KEYS.batch);
  const mfg = valueAfter(lines, KEYS.mfg, { dateOnly: true });
  const exp = valueAfter(lines, KEYS.exp, { dateOnly: true });
  const dosage = section(lines, KEYS.dosage, 3);
  if (dosage) dosage.value = dosage.value.replace(KEYS.dosage, '').trim() || dosage.value;
  const warnings = section(lines, KEYS.warn, 4);
  const storage = section(lines, KEYS.store, 2);

  const fields = {
    name, ingredients: compo, strength,
    manufacturer: field('Manufacturer', makerParts),
    batch: field('Batch number', batch),
    mfgDate: field('Manufacturing date', mfg),
    expiry: field('Expiry date', exp),
    dosage: field('Printed dosage instructions', dosage),
    warnings: field('Printed warnings and precautions', warnings),
    storage: field('Storage instructions', storage),
  };
  return fields;
}
