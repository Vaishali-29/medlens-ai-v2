import { useState } from 'react';
import { loadHistory, deleteRecord, clearHistory } from '../lib/storage.js';

export default function History({ onOpen, onScan }) {
  const [items, setItems] = useState(loadHistory);
  const [confirm, setConfirm] = useState(false);
  const del = (id) => { deleteRecord(id); setItems(loadHistory()); };
  const clear = () => { clearHistory(); setItems([]); setConfirm(false); };
  return (
    <div className="max-w-3xl mx-auto px-5 py-10">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-3xl font-extrabold">Scan history</h1>
        {items.length > 0 && (confirm ? (
          <span className="flex items-center gap-2"><span>Delete all {items.length} scans?</span><button onClick={clear} className="bg-red-700 text-white px-3 py-1.5 rounded-lg font-semibold">Delete all</button><button onClick={() => setConfirm(false)} className="border border-line px-3 py-1.5 rounded-lg">Cancel</button></span>
        ) : <button onClick={() => setConfirm(true)} className="text-red-800 font-semibold underline">Delete all history</button>)}
      </div>
      <p className="mt-2 text-ink/70">Saved only in this browser. Photos are never stored; only extracted text and your edits.</p>
      {items.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-line bg-mist p-10 text-center">
          <p className="font-semibold">No saved scans yet</p><p className="text-ink/70">Scan a medicine and choose “Save to history”.</p>
          <button onClick={onScan} className="mt-4 bg-brand text-white px-5 py-2.5 rounded-xl font-semibold">Scan a medicine</button>
        </div>
      ) : (
        <ul className="mt-6 grid gap-3">
          {items.map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-3 rounded-xl border border-line p-4 shadow-card">
              <div className="min-w-0">
                <p className="font-semibold truncate">{r.fields.name.value}{r.isDemo && <span className="ml-2 text-xs bg-amber-soft text-amber-deep px-2 py-0.5 rounded-full">Demo</span>}</p>
                <p className="text-sm text-ink/60">{new Date(r.createdAt).toLocaleString()} · Expiry: {r.fields.expiry.value}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => onOpen(r)} className="border border-brand text-brand px-3 py-1.5 rounded-lg font-semibold">View</button>
                <button onClick={() => del(r.id)} aria-label={`Delete scan of ${r.fields.name.value}`} className="border border-line px-3 py-1.5 rounded-lg">Delete</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
