// Minimal proxy so AI provider keys never reach the browser. Node 18+, no dependencies.
// Default provider: Gemini. Alternative: Anthropic Claude (AI_PROVIDER=anthropic).
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PROVIDER, CFG, health, enhance } from './core.js';


// Production: also serve the built frontend (dist/) so one service hosts everything and /api needs no CORS.
const DIST = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.json': 'application/json', '.wasm': 'application/wasm', '.ico': 'image/x-icon', '.map': 'application/json' };
function serveStatic(req, res) {
  if (!fs.existsSync(path.join(DIST, 'index.html'))) return false;
  const rel = decodeURIComponent((req.url || '/').split('?')[0]);
  let file = path.normalize(path.join(DIST, rel));
  if (!file.startsWith(DIST)) { res.writeHead(403); res.end(); return true; } // block path traversal
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(DIST, 'index.html'); // SPA fallback
  res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
  return true;
}
const PORT = process.env.PORT || 8787;
const send = (res, code, obj) => { res.writeHead(code, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(obj)); };

// CORS: lets the separately hosted frontend (e.g. Vercel) call this API. Set ALLOWED_ORIGINS to a comma-separated list, e.g. https://medlens-ai-tawny.vercel.app
const ALLOWED = (process.env.ALLOWED_ORIGINS || '').split(',').map((o) => o.trim().replace(/\/+$/, '')).filter(Boolean);
function cors(req, res) {
  const origin = req.headers.origin;
  if (origin && ALLOWED.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  }
}
http.createServer(async (req, res) => {
  cors(req, res);
  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); } // preflight
  if (req.method === 'GET' && req.url === '/api/health') return send(res, 200, health());
  if ((req.method === 'GET' || req.method === 'HEAD') && !req.url.startsWith('/api/') && serveStatic(req, res)) return;
  if (req.method !== 'POST' || req.url !== '/api/enhance') return send(res, 404, { error: 'Not found' });
  let body = ''; for await (const c of req) { body += c; if (body.length > 60_000) return send(res, 413, { error: 'Text too long' }); }
  let text; try { ({ text } = JSON.parse(body)); } catch { return send(res, 400, { error: 'No text provided' }); }
  const { status, body: out } = await enhance(text);
  send(res, status, out);
}).listen(PORT, () => console.log(`MedLens AI proxy on :${PORT} (provider: ${PROVIDER}, AI ${CFG?.key ? 'enabled' : 'disabled: no key'})`));
