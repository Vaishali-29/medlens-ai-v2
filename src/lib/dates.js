// Expiry parsing and evaluation. Pure functions, no DOM, so they can be unit-tested in Node.
const MONTHS = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
export const DATE_RE = /(\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4}|\d{1,2}[\/\-.]\d{4}|\d{1,2}[\/\-.]\d{2}|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*[\s.,\-\/]*\d{2,4}|\d{4}[\/\-.]\d{1,2})/i;

const fullYear = (s) => (s.length === 2 ? 2000 + Number(s) : Number(s));
const valid = (m) => m >= 1 && m <= 12;

/** Returns { interpretations: [{y,m,d|null}], notes: [] } or null if unparseable. */
export function parseDate(raw) {
  const s = String(raw || '').trim();
  const notes = [];
  let mm = s.match(/^([a-z]{3})[a-z]*[\s.,\-\/]*(\d{2,4})$/i);
  if (mm && MONTHS.includes(mm[1].toLowerCase())) {
    if (mm[2].length === 2) notes.push('Two-digit year read as 20' + mm[2]);
    return { interpretations: [{ y: fullYear(mm[2]), m: MONTHS.indexOf(mm[1].toLowerCase()) + 1, d: null }], notes };
  }
  mm = s.match(/^(\d{4})[\/\-.](\d{1,2})$/);
  if (mm && valid(+mm[2])) return { interpretations: [{ y: +mm[1], m: +mm[2], d: null }], notes };
  mm = s.match(/^(\d{1,2})[\/\-.](\d{2}|\d{4})$/);
  if (mm && valid(+mm[1])) {
    if (mm[2].length === 2) notes.push('Two-digit year read as 20' + mm[2]);
    return { interpretations: [{ y: fullYear(mm[2]), m: +mm[1], d: null }], notes };
  }
  mm = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2}|\d{4})$/);
  if (mm) {
    const a = +mm[1], b = +mm[2], y = fullYear(mm[3]);
    if (mm[3].length === 2) notes.push('Two-digit year read as 20' + mm[3]);
    const dmy = { y, m: b, d: a }, mdy = { y, m: a, d: b };
    if (a > 12 && valid(b)) return { interpretations: [dmy], notes };
    if (b > 12 && valid(a)) return { interpretations: [mdy], notes };
    if (valid(a) && valid(b)) {
      if (a === b) return { interpretations: [dmy], notes };
      notes.push('Day/month order is ambiguous');
      return { interpretations: [dmy, mdy], notes };
    }
  }
  return null;
}

const endOfPeriod = ({ y, m, d }) => new Date(y, d ? m - 1 : m, d ? d : 0, 23, 59, 59);

/**
 * status: 'expired' | 'not_expired' | 'unknown'. Never claims the medicine is safe.
 * Plausibility checks guard against OCR misreads (e.g. 02/2628 or an expiry before the manufacturing date).
 */
export function evaluateExpiry(raw, today = new Date(), mfgRaw = null) {
  const p = parseDate(raw);
  if (!p) return { status: 'unknown', reason: 'The date could not be read in a known format.', notes: [] };
  const unknown = (reason) => ({ status: 'unknown', reason, notes: p.notes });
  if (p.interpretations.some((i) => i.y > today.getFullYear() + 10)) return unknown('This date is unusually far in the future and may be misread. Check the package.');
  const mp = mfgRaw ? parseDate(mfgRaw) : null;
  if (mp && mp.interpretations.length === 1 && p.interpretations.every((i) => endOfPeriod(i) < new Date(mp.interpretations[0].y, mp.interpretations[0].m - 1, 1))) {
    return unknown('The expiry date is earlier than the manufacturing date, so one of them may be misread. Check the package.');
  }
  const results = p.interpretations.map((i) => (endOfPeriod(i) < today ? 'expired' : 'not_expired'));
  const same = results.every((r) => r === results[0]);
  if (!same) return unknown('The date can be read two ways and the result differs. Check the package.');
  return { status: results[0], reason: '', notes: p.notes, interpretations: p.interpretations };
}
