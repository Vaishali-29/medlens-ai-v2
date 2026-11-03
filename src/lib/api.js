// Where the AI proxy lives. Empty = same origin (local dev via Vite proxy, or single-service deploy).
// For Vercel (frontend) + Render (backend): set VITE_API_BASE=https://your-service.onrender.com in Vercel, then redeploy.
export const API_BASE = ((import.meta.env && import.meta.env.VITE_API_BASE) || '').replace(/\/+$/, '');
export const apiUrl = (path) => `${API_BASE}${path}`;
