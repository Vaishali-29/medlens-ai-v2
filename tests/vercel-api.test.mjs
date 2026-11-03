// Tests the Vercel function handlers (api/*.js) against a mock Gemini upstream. No network, no real key.
import http from 'node:http';
const good = { fields: {}, explanations: [] };
const mock = http.createServer((req, res) => {
  if (req.url.includes('badmodel')) { res.writeHead(404); return res.end('{"error":"gone"}'); }
  res.writeHead(200, { 'content-type': 'application/json' });
  res.end(JSON.stringify({ candidates: [{ content: { parts: [{ text: JSON.stringify(good) }] }, finishReason: 'STOP' }] }));
}).listen(9951);
process.env.GEMINI_API_KEY = 'test'; process.env.GEMINI_BASE_URL = 'http://localhost:9951/v1beta'; process.env.GEMINI_MODEL = 'm';
const enhanceH = (await import('../api/enhance.js')).default;
const healthH = (await import('../api/health.js')).default;
const mkRes = () => { const r = { headers: {}, setHeader(k, v) { r.headers[k] = v; }, status(c) { r.code = c; return r; }, json(b) { r.body = b; return r; } }; return r; };
let fail = 0; const ok = (n, c) => { console.log(`${c ? 'PASS' : 'FAIL'} ${n}`); if (!c) fail++; };

let r = mkRes(); healthH({ method: 'GET' }, r);
ok('health returns configured:true', r.code === 200 && r.body.configured === true && r.body.provider === 'gemini');
r = mkRes(); await enhanceH({ method: 'GET' }, r); ok('GET /api/enhance -> 405', r.code === 405);
r = mkRes(); await enhanceH({ method: 'POST', body: { text: 'Paracetamol 500 mg' } }, r); ok('POST object body -> 200 JSON', r.code === 200 && r.body.fields);
r = mkRes(); await enhanceH({ method: 'POST', body: JSON.stringify({ text: 'Paracetamol' }) }, r); ok('POST string body -> 200', r.code === 200);
r = mkRes(); await enhanceH({ method: 'POST', body: {} }, r); ok('missing text -> 400', r.code === 400);
r = mkRes(); await enhanceH({ method: 'POST', body: { text: 'x'.repeat(50001) } }, r); ok('oversize -> 413', r.code === 413);
mock.close(); console.log(fail ? `\n${fail} FAILED` : '\nvercel api checks passed (mock upstream)'); process.exit(fail ? 1 : 0);
