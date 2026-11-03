import { evaluateExpiry } from './dates.js';
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
export const expiryOf = (f) => (f.expiry.status === 'not_detected' ? { status: 'unknown', reason: 'No expiry date was detected.', notes: [] }
  : f.expiry.status === 'uncertain' ? { status: 'unknown', reason: 'The date was read with low confidence. Check the package.', notes: [] }
  : evaluateExpiry(f.expiry.value, new Date(), f.mfgDate.status === 'not_detected' || f.mfgDate.status === 'uncertain' ? null : f.mfgDate.value));

export function printReport(rec) {
  const ex = expiryOf(rec.fields);
  const label = { expired: 'Expired', not_expired: 'Not expired (this does not mean the medicine is safe)', unknown: 'Unable to determine' }[ex.status];
  const rows = Object.entries(rec.fields).map(([k, f]) => {
    const ok = rec.verified[k] || f.status === 'user_corrected' && rec.verified[k];
    const tag = f.status === 'not_detected' ? 'Not detected' : ok ? 'Checked by user' : 'UNVERIFIED';
    return `<tr class="${ok ? '' : 'unv'}"><th>${esc(f.label)}</th><td>${esc(f.value)}${f.status === 'user_corrected' ? ' <em>(edited by user)</em>' : ''}</td><td>${tag}</td></tr>`;
  }).join('');
  const w = window.open('', '_blank');
  if (!w) return alert('Allow pop-ups to open the printable report.');
  w.document.write(`<!doctype html><title>MedLens AI report</title><style>
  body{font:14px/1.5 system-ui,sans-serif;color:#0B2B40;max-width:760px;margin:24px auto;padding:0 16px}
  h1{font-size:22px;margin:0}table{border-collapse:collapse;width:100%;margin:12px 0}th,td{border:1px solid #D9E6EC;padding:6px 8px;text-align:left;vertical-align:top}
  th{width:28%;background:#F2F8FA}.unv td:last-child{color:#8A4B00;font-weight:700}.box{border:1px solid #D9E6EC;padding:10px;margin:12px 0;background:#FFF4DF}
  pre{white-space:pre-wrap;background:#F2F8FA;padding:10px}@media print{button{display:none}}</style>
  <h1>MedLens AI – extracted medicine information</h1>
  <p>Generated ${esc(new Date().toLocaleString())}${rec.isDemo ? ' · <b>DEMO SAMPLE – not a real scan</b>' : ''}</p>
  <div class="box"><b>Verify against the original package.</b> Text was read by OCR and may contain errors. This report is not medical advice and does not say whether a medicine is safe. Ask a pharmacist or doctor if unsure.</div>
  <p><b>Expiry check:</b> ${esc(label)} ${esc(ex.reason)}</p>
  <table>${rows}</table><h3>Original OCR text</h3><pre>${esc(rec.ocrText)}</pre>
  <button onclick="print()">Print / Save as PDF</button>`);
  w.document.close();
}
