import Disclaimer from './Disclaimer.jsx';

const FEATURES = [
  ['Reads the whole label', 'Name, composition, manufacturer, batch, dates, printed dosage, warnings and storage.'],
  ['Shows its evidence', 'Every value is linked to the exact line it came from, with an OCR confidence score.'],
  ['Plain-language terms', 'Hard words like “IP”, “mg” or “Schedule H” explained in simple English or Hindi.'],
  ['Honest about gaps', 'Missing or unclear details are marked “Not detected” rather than guessed.'],
  ['Expiry, carefully', 'Expired, not expired or unable to determine. Ambiguous dates are never forced.'],
  ['Private by default', 'Photos stay in your browser and are never saved. History holds text only.'],
];
const STEPS = [['Upload', 'Add a clear photo of the box, strip or bottle.'], ['Read', 'OCR reads the printed text on your device.'], ['Review', 'Check each field against the pack and fix mistakes.'], ['Keep', 'Save the result or export a printable report.']];

export default function Landing({ go }) {
  return (
    <>
      <section className="bg-gradient-to-b from-mist to-white">
        <div className="max-w-6xl mx-auto px-5 py-14 md:py-20 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold leading-tight text-ink">Scan. Understand. Stay informed.</h1>
            <p className="mt-4 text-lg text-ink/75 max-w-prose">Turn a photo of a medicine label into clear, organised information, with every hard term explained and every value traceable to the pack.</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <button onClick={() => go('scan')} className="bg-brand hover:bg-ink text-white font-semibold px-6 py-3 rounded-xl shadow-card">Scan a medicine</button>
              <button onClick={() => go('scan', { demo: true })} className="border border-brand text-brand font-semibold px-6 py-3 rounded-xl hover:bg-white">Try demo sample</button>
            </div>
          </div>
          <div aria-label="Example of an extracted label" className="bg-white rounded-2xl shadow-card border border-line p-5">
            <p className="text-xs font-semibold text-amber-deep bg-amber-soft inline-block px-2 py-1 rounded">Demo sample, fictional product</p>
            <div className="mt-3 font-mono text-[13px] leading-6 bg-mist rounded-lg p-3">
              DEMO TABLETS IP <mark className="bg-teal/20 px-1 rounded">500 mg</mark><br />B.No.: <mark className="bg-teal/20 px-1 rounded">DEMO0001</mark><br />Exp. Date: <mark className="bg-brand/20 px-1 rounded">02/2028</mark><br />Warning: Keep out of reach of children.
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <div className="rounded-lg border border-line p-2"><dt className="text-ink/60">Strength</dt><dd className="font-semibold">500 mg</dd></div>
              <div className="rounded-lg border border-line p-2"><dt className="text-ink/60">Expiry</dt><dd className="font-semibold">Not expired</dd></div>
            </dl>
          </div>
        </div>
      </section>
      <section className="max-w-6xl mx-auto px-5 py-14" aria-labelledby="f">
        <h2 id="f" className="text-2xl md:text-3xl font-bold">What MedLens AI does</h2>
        <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map(([t, d]) => (<div key={t} className="rounded-xl border border-line p-5 shadow-card"><h3 className="font-semibold text-brand">{t}</h3><p className="mt-1 text-ink/75">{d}</p></div>))}
        </div>
      </section>
      <section className="bg-mist"><div className="max-w-6xl mx-auto px-5 py-14">
        <h2 className="text-2xl md:text-3xl font-bold">How it works</h2>
        <ol className="mt-6 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {STEPS.map(([t, d], i) => (<li key={t} className="bg-white rounded-xl border border-line p-5"><span className="text-teal font-extrabold text-2xl">{i + 1}</span><h3 className="font-semibold mt-1">{t}</h3><p className="text-ink/75 text-sm mt-1">{d}</p></li>))}
        </ol>
      </div></section>
      <section className="max-w-6xl mx-auto px-5 py-14"><Disclaimer /></section>
    </>
  );
}
