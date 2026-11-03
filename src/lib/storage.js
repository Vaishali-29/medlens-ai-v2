const KEY = 'medlens.history.v1';
export const loadHistory = () => { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; } };
const write = (h) => { try { localStorage.setItem(KEY, JSON.stringify(h)); return true; } catch { return false; } };
export function saveRecord(rec) { const h = loadHistory().filter((r) => r.id !== rec.id); return write([rec, ...h].slice(0, 50)); }
export const deleteRecord = (id) => write(loadHistory().filter((r) => r.id !== id));
export const clearHistory = () => { try { localStorage.removeItem(KEY); } catch {} };
