import { useState } from 'react';
import Logo from './components/Logo.jsx';
import Landing from './components/Landing.jsx';
import Scanner from './components/Scanner.jsx';
import Results from './components/Results.jsx';
import History from './components/History.jsx';

export default function App() {
  const [view, setView] = useState('home');
  const [demo, setDemo] = useState(false);
  const [record, setRecord] = useState(null);
  const go = (v, opts = {}) => { setDemo(!!opts.demo); setView(v); window.scrollTo(0, 0); };
  const result = (r) => { setRecord(r); setView('result'); window.scrollTo(0, 0); };
  const nav = (v, label) => <button onClick={() => go(v)} aria-current={view === v ? 'page' : undefined} className={`px-3 py-2 rounded-lg font-semibold ${view === v ? 'text-brand bg-mist' : 'text-ink/70 hover:text-ink'}`}>{label}</button>;

  return (
    <div className="min-h-screen flex flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:m-2 focus:p-2 focus:bg-white">Skip to content</a>
      <header className="border-b border-line bg-white/90 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          <button onClick={() => go('home')} aria-label="MedLens AI home"><Logo /></button>
          <nav aria-label="Main" className="flex items-center gap-1">{nav('scan', 'Scan')}{nav('history', 'History')}</nav>
        </div>
      </header>
      <main id="main" className="flex-1">
        {view === 'home' && <Landing go={go} />}
        {view === 'scan' && <Scanner key={String(demo)} onResult={result} startDemo={demo} />}
        {view === 'result' && record && <Results record={record} onChange={setRecord} onBack={() => go('scan')} onHistory={() => go('history')} />}
        {view === 'history' && <History onOpen={result} onScan={() => go('scan')} />}
      </main>
      <footer className="bg-ink text-white/80 text-sm">
        <div className="max-w-6xl mx-auto px-5 py-8 flex flex-wrap items-center justify-between gap-3">
          <Logo light />
          <p className="max-w-xl">For information only. Not medical advice. Not a substitute for a pharmacist or healthcare professional.</p>
        </div>
      </footer>
    </div>
  );
}
