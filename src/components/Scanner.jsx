import { useEffect, useRef, useState } from 'react';
import { apiUrl } from '../lib/api.js';
import { runOcr } from '../lib/ocr.js';
import { preprocessFile } from '../lib/preprocess.js';
import { buildRecord } from '../lib/pipeline.js';
import { SAMPLE_LINES } from '../lib/sample.js';
import Disclaimer from './Disclaimer.jsx';

const OK = ['image/jpeg', 'image/png'];
const MAX = 10 * 1024 * 1024;

export default function Scanner({ onResult, startDemo }) {
  const [file, setFile] = useState(null);
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [useAi, setUseAi] = useState(false);
  const [enhance, setEnhance] = useState(false);
  const [ai, setAi] = useState({ checked: false, configured: false, provider: '' });
  const [drag, setDrag] = useState(false);
  const input = useRef(null);

  useEffect(() => () => url && URL.revokeObjectURL(url), [url]);
  useEffect(() => {
    // Render's free tier sleeps when idle; retry a few times so a cold start doesn't permanently disable AI.
    let cancelled = false;
    const check = async (attempt = 0) => {
      try {
        const h = await fetch(apiUrl('/api/health')).then((r) => r.json());
        if (!cancelled) setAi({ checked: true, configured: !!h.configured, provider: h.provider });
      } catch {
        if (cancelled) return;
        if (attempt < 5) setTimeout(() => check(attempt + 1), 8000);
        else setAi({ checked: true, configured: false, provider: '' });
      }
    };
    check();
    return () => { cancelled = true; };
  }, []);
  useEffect(() => { if (startDemo) runDemo(); }, []); // eslint-disable-line

  const pick = (f) => {
    setError('');
    if (!f) return;
    if (!OK.includes(f.type)) return setError('That file type is not supported. Upload a JPG, JPEG or PNG image.');
    if (f.size > MAX) return setError('That image is larger than 10 MB. Choose a smaller photo.');
    setFile(f); setUrl(URL.createObjectURL(f));
  };
  const finish = async (args) => onResult(await buildRecord({ ...args, useAi }));
  const scan = async () => {
    setBusy(true); setError(''); setProgress(0);
    try {
      let src = file;
      if (enhance) { try { src = await preprocessFile(file, 'stretch'); } catch { src = file; } } // fall back to the original image
      const r = await runOcr(src, setProgress); await finish({ text: r.text, lines: r.lines, conf: r.conf }); }
    catch (e) { setError(e.message || 'Scanning failed. Try again with a clearer image.'); }
    finally { setBusy(false); }
  };
  const runDemo = async () => { setBusy(true); await finish({ text: SAMPLE_LINES.map((l) => l.text).join('\n'), lines: SAMPLE_LINES, isDemo: true }); setBusy(false); };

  return (
    <div className="max-w-3xl mx-auto px-5 py-10">
      <h1 className="text-3xl font-extrabold">Scan a medicine</h1>
      <p className="mt-2 text-ink/75">Use a sharp, well-lit photo with the label flat and filling the frame. The photo is processed in your browser and is not saved.</p>

      <div
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); pick(e.dataTransfer.files[0]); }}
        className={`mt-6 rounded-2xl border-2 border-dashed p-6 text-center transition-colors ${drag ? 'border-teal bg-teal/10' : 'border-line bg-mist'}`}>
        {url ? <img src={url} alt="Selected medicine package preview" className="mx-auto max-h-80 rounded-lg shadow-card" /> : (
          <div className="py-8"><p className="font-semibold">Drag and drop an image here</p><p className="text-sm text-ink/60">JPG, JPEG or PNG, up to 10 MB</p></div>
        )}
        <input ref={input} type="file" accept="image/jpeg,image/png" capture="environment" className="sr-only" aria-label="Choose medicine image" onChange={(e) => pick(e.target.files[0])} />
        <button onClick={() => input.current.click()} disabled={busy} className="mt-4 border border-brand text-brand font-semibold px-5 py-2.5 rounded-xl bg-white hover:bg-mist disabled:opacity-50">{url ? 'Choose a different image' : 'Choose or take a photo'}</button>
      </div>

      {error && <div role="alert" className="mt-4 rounded-xl border border-red-300 bg-red-50 text-red-900 p-4">{error}</div>}

      <label className="mt-5 flex items-start gap-3 text-sm">
        <input type="checkbox" className="mt-1 h-4 w-4" checked={enhance} onChange={(e) => setEnhance(e.target.checked)} />
        <span><strong>Enhance image before reading.</strong> Helps with small or low-contrast photos; it enlarges the image and stretches contrast on your device. Try it if a scan fails. It cannot fix blur or glare.</span>
      </label>
      <label className={`mt-4 flex items-start gap-3 text-sm ${ai.configured ? '' : 'opacity-60'}`}>
        <input type="checkbox" className="mt-1 h-4 w-4" disabled={!ai.configured} checked={useAi && ai.configured} onChange={(e) => setUseAi(e.target.checked)} />
        <span><strong>Use AI enhancement (optional{ai.provider ? `, ${ai.provider === 'gemini' ? 'Gemini' : 'Claude'}` : ''}).</strong> Sends the extracted text, not your photo, to your MedLens server, which calls the AI service.
          {ai.checked && !ai.configured && <em className="block text-ink/70"> Not available: no AI key is configured on the server. OCR-only mode is being used.</em>}</span>
      </label>

      <div className="mt-5 flex flex-wrap gap-3 items-center">
        <button onClick={scan} disabled={!file || busy} className="bg-brand hover:bg-ink text-white font-semibold px-6 py-3 rounded-xl disabled:opacity-40">{busy ? 'Reading label…' : 'Scan label'}</button>
        <button onClick={runDemo} disabled={busy} className="text-brand font-semibold underline underline-offset-4">Use demo sample</button>
      </div>

      {busy && file && (
        <div className="mt-5" role="status" aria-live="polite">
          <div className="h-2 rounded bg-line overflow-hidden"><div className="h-full bg-teal transition-all" style={{ width: `${Math.max(5, progress * 100)}%` }} /></div>
          <p className="mt-2 text-sm text-ink/70">Reading text on your device… {Math.round(progress * 100)}%. The first scan downloads the language data and can take longer.</p>
        </div>
      )}
      <div className="mt-8"><Disclaimer compact /></div>
    </div>
  );
}
