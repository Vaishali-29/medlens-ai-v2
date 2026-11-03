import { apiUrl } from './api.js';
// Optional AI enhancement (Gemini by default; provider is chosen on the server). The browser only talks to our own /api/enhance proxy (key stays server-side).
const norm = (s) => String(s || '').toLowerCase().replace(/\s+/g, ' ').trim();

export async function enhanceWithAi(ocrText) {
  const res = await fetch(apiUrl('/api/enhance'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: ocrText }) });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'AI service unavailable');
  return res.json();
}

/** Hallucination guard: accept an AI value only if its quoted evidence exists verbatim in the OCR text. */
export function mergeAi(fields, explanations, ai, ocrText) {
  const text = norm(ocrText);
  const out = { ...fields };
  let accepted = 0, rejected = 0;
  for (const [key, f] of Object.entries(fields)) {
    const a = ai.fields?.[key];
    if (!a?.value || f.status !== 'not_detected') continue; // AI only fills gaps, never overrides OCR rules
    const ev = norm(a.evidence);
    const tokens = norm(a.value).split(' ');
    if (ev && text.includes(ev) && tokens.every((t) => ev.includes(t))) {
      out[key] = { ...f, value: a.value, evidence: a.evidence, status: 'uncertain', note: 'Structured by AI from the OCR text — verify.', conf: null };
      accepted++;
    } else rejected++;
  }
  const exp = (ai.explanations || []).filter((e) => e.term && e.en && text.includes(norm(e.term))).map((e) => ({ ...e, source: 'ai' }));
  return { fields: out, explanations: [...explanations.filter((g) => !exp.some((e) => norm(e.term) === norm(g.term))), ...exp], accepted, rejected };
}
