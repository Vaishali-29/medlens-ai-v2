import { useState } from 'react';
import { expiryOf, printReport } from '../lib/report.js';
import { saveRecord } from '../lib/storage.js';
import Disclaimer from './Disclaimer.jsx';

const BADGE = {
  detected: ['Read by OCR', 'bg-teal/15 text-ink'],
  uncertain: ['Needs checking', 'bg-amber-soft text-amber-deep'],
  not_detected: ['Not detected', 'bg-line text-ink/70'],
  user_corrected: ['Edited by you', 'bg-brand/15 text-brand'],
};
const EXPIRY = {
  expired: ['Expired', 'border-red-300 bg-red-50 text-red-900'],
  not_expired: ['Not expired', 'border-teal bg-teal/10 text-ink'],
  unknown: ['Unable to determine', 'border-amber-deep/40 bg-amber-soft text-amber-deep'],
};

function Field({ k, f, verified, onEdit, onVerify, tone = '' }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [label, cls] = BADGE[f.status];
  return (
    <div className={`rounded-xl border p-4 shadow-card bg-white ${tone || 'border-line'}`}>
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold">{f.label}</h3>
        <span className={`text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap ${cls}`}>{label}{f.conf != null && f.status !== 'not_detected' ? ` · ${f.conf}%` : ''}</span>
      </div>
      {editing ? (
        <div className="mt-2">
          <label className="sr-only" htmlFor={`e-${k}`}>Edit {f.label}</label>
          <textarea id={`e-${k}`} className="w-full border border-line rounded-lg p-2" rows={2} value={draft} onChange={(e) => setDraft(e.target.value)} />
          <div className="mt-2 flex gap-2">
            <button className="bg-brand text-white px-3 py-1.5 rounded-lg text-sm font-semibold" onClick={() => { onEdit(k, draft.trim()); setEditing(false); }}>Save</button>
            <button className="px-3 py-1.5 rounded-lg text-sm border border-line" onClick={() => setEditing(false)}>Cancel</button>
          </div>
        </div>
      ) : <p className={`mt-1 break-words ${f.status === 'not_detected' ? 'text-ink/50 italic' : ''}`}>{f.value}</p>}
      {f.note && <p className="text-xs text-amber-deep mt-1">{f.note}</p>}
      {f.evidence && f.status !== 'user_corrected' && <p className="mt-2 text-xs text-ink/60">Source line: <span className="font-mono">{f.evidence}</span></p>}
      <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
        <button className="text-brand font-semibold underline underline-offset-2" onClick={() => { setDraft(f.status === 'not_detected' ? '' : f.value); setEditing(true); }}>{f.status === 'not_detected' ? 'Add manually' : 'Edit'}</button>
        {f.status !== 'not_detected' && <label className="flex items-center gap-2"><input type="checkbox" checked={!!verified} onChange={(e) => onVerify(k, e.target.checked)} /> Checked against package</label>}
      </div>
    </div>
  );
}

export default function Results({ record, onChange, onBack, onHistory }) {
  const [saved, setSaved] = useState(false);
  const [lang, setLang] = useState('en');
  const [saveError, setSaveError] = useState(false);
  const { fields } = record;
  const ex = expiryOf(fields);
  const [exLabel, exCls] = EXPIRY[ex.status];

  const update = (r) => { setSaved(false); onChange(r); };
  const edit = (k, v) => update({ ...record, fields: { ...fields, [k]: { ...fields[k], value: v || 'Not detected', status: v ? 'user_corrected' : 'not_detected', note: '', conf: null } }, verified: { ...record.verified, [k]: !!v } });
  const verify = (k, on) => update({ ...record, verified: { ...record.verified, [k]: on } });
  const save = () => { const ok = saveRecord(record); setSaved(ok); setSaveError(!ok); };
  const F = (k, tone) => <Field key={k} k={k} f={fields[k]} verified={record.verified[k]} onEdit={edit} onVerify={verify} tone={tone} />;

  // user-corrected expiry is trusted as user-verified; OCR-uncertain stays "unable to determine"
  return (
    <div className="max-w-5xl mx-auto px-5 py-8">
      {record.isDemo && <div role="status" className="mb-4 rounded-xl bg-amber-soft text-amber-deep p-3 font-semibold">Demo sample. This is fictional data, not a real scan.</div>}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-extrabold">Extracted information</h1>
        <div className="flex flex-wrap gap-2">
          <button onClick={onBack} className="border border-line px-4 py-2 rounded-xl font-semibold">New scan</button>
          <button onClick={save} className="border border-brand text-brand px-4 py-2 rounded-xl font-semibold">{saved ? 'Saved to history' : 'Save to history'}</button>
          <button onClick={() => printReport(record)} className="bg-brand text-white px-4 py-2 rounded-xl font-semibold">Export / print report</button>
        </div>
      </div>
      {saveError && <p role="alert" className="mt-2 text-red-800">Could not save. Browser storage may be full or blocked.</p>}
      <p className="mt-2 text-ink/75">Check every value against the original package before relying on it. Tick “Checked against package” once you have; unticked fields are marked unverified in the export.</p>
      {record.ai.error && <p role="status" className="mt-3 rounded-lg bg-mist p-3 text-sm">AI enhancement was not used: {record.ai.error} Showing OCR-only results.</p>}
      {record.ai.used && <p role="status" className="mt-3 rounded-lg bg-mist p-3 text-sm">AI structuring used. {record.ai.accepted} value(s) accepted after the evidence check; {record.ai.rejected} rejected because their evidence was not in the OCR text.</p>}

      <section aria-label="Expiry" className={`mt-6 rounded-2xl border-2 p-5 ${exCls}`}>
        <h2 className="text-lg font-bold">Expiry check: {exLabel}</h2>
        <p className="mt-1">Printed expiry: <strong>{fields.expiry.value}</strong>{fields.mfgDate.status !== 'not_detected' && <> · Manufacturing date (not used for expiry): {fields.mfgDate.value}</>}</p>
        {ex.reason && <p className="mt-1 text-sm">{ex.reason}</p>}
        {ex.notes?.map((n) => <p key={n} className="text-sm">{n}.</p>)}
        <p className="mt-2 text-sm font-semibold">Not being expired does not mean a medicine is safe to use. Ask a pharmacist if unsure.</p>
      </section>

      <div className="mt-6 grid md:grid-cols-2 gap-4">
        {['name', 'ingredients', 'strength', 'manufacturer', 'batch', 'mfgDate', 'expiry'].map((k) => F(k))}
      </div>

      <h2 className="mt-8 text-xl font-bold">Printed on the package (shown exactly as read)</h2>
      <div className="mt-3 grid gap-4">
        {F('dosage')}
        {F('warnings', 'border-amber-deep/50 bg-amber-soft')}
        {F('storage', 'border-brand/40 bg-mist')}
      </div>

      <section className="mt-8" aria-labelledby="terms">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 id="terms" className="text-xl font-bold">Terms explained</h2>
          <div role="group" aria-label="Explanation language" className="inline-flex rounded-lg border border-line overflow-hidden text-sm">
            {[['en', 'English'], ['hi', 'हिन्दी']].map(([c, n]) => <button key={c} aria-pressed={lang === c} onClick={() => setLang(c)} className={`px-3 py-1.5 ${lang === c ? 'bg-brand text-white' : 'bg-white'}`}>{n}</button>)}
          </div>
        </div>
        <p className="text-sm text-ink/70 mt-1">These are general definitions, not text from the package.</p>
        {record.explanations.length === 0 ? <p className="mt-3 text-ink/60">No known terms found in the text.</p> : (
          <ul className="mt-3 grid sm:grid-cols-2 gap-3">
            {record.explanations.map((e) => (
              <li key={e.term} className="rounded-xl border border-line p-3">
                <p className="font-semibold">{e.term} <span className="ml-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-mist">{e.source === 'ai' ? 'AI-generated' : 'Glossary'}</span></p>
                <p lang={lang} className="text-sm mt-1">{lang === 'hi' ? (e.hi || e.en) : e.en}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <details className="mt-8 rounded-xl border border-line p-4">
        <summary className="font-semibold cursor-pointer">Original OCR text{record.ocrConf != null && ` (overall confidence ${record.ocrConf}%)`}</summary>
        <pre className="mt-3 whitespace-pre-wrap font-mono text-sm bg-mist rounded-lg p-3">{record.ocrText}</pre>
      </details>
      <details className="mt-3 rounded-xl border border-line p-4">
        <summary className="font-semibold cursor-pointer">Have a medical question about this medicine?</summary>
        <p className="mt-2">MedLens AI cannot answer medical questions, advise on doses or interactions, or say whether a medicine is right for you. Please ask a pharmacist or a doctor.</p>
      </details>
      <div className="mt-6"><Disclaimer compact /></div>
      <button onClick={onHistory} className="mt-4 text-brand font-semibold underline">Open scan history</button>
    </div>
  );
}
