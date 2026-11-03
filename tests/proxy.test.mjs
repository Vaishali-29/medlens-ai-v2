// Tests the proxy plumbing against a LOCAL MOCK of the Gemini API. This does NOT test real Gemini output.
import assert from 'node:assert/strict';
import http from 'node:http';
import { spawn } from 'node:child_process';

const GOOD = { fields: { batch: { value: '12', evidence: 'B No 12' } }, explanations: [] };
let mode = 'ok'; let seen = null;
const mock = http.createServer(async (req, res) => {
  let b = ''; for await (const c of req) b += c;
  seen = { url: req.url, key: req.headers['x-goog-api-key'], body: JSON.parse(b) };
  if (mode === 'err') { res.writeHead(500); return res.end('{}'); }
  res.writeHead(200, { 'content-type': 'application/json' });
  if (mode === 'blocked') return res.end(JSON.stringify({ candidates: [], promptFeedback: { blockReason: 'SAFETY' } }));
  const txt = mode === 'fenced' ? '```json\n' + JSON.stringify(GOOD) + '\n```' : mode === 'junk' ? 'not json' : JSON.stringify(GOOD);
  res.end(JSON.stringify({ candidates: [{ content: { parts: [{ text: txt }] } }] }));
});
const listen = (s) => new Promise((r) => s.listen(0, () => r(s.address().port)));
const mockPort = await listen(mock);

const free = await new Promise((r) => { const s = http.createServer().listen(0, () => { const p = s.address().port; s.close(() => r(p)); }); });
const free2 = await new Promise((r) => { const s = http.createServer().listen(0, () => { const p = s.address().port; s.close(() => r(p)); }); });
const wait = (p) => new Promise((r) => p.stdout.once('data', r));
const withKey = spawn('node', ['server/index.js'], { env: { ...process.env, PORT: free, AI_PROVIDER: 'gemini', GEMINI_API_KEY: 'test-key', GEMINI_MODEL: 'test-model', GEMINI_BASE_URL: `http://localhost:${mockPort}/v1beta` } });
const noKey = spawn('node', ['server/index.js'], { env: { ...process.env, PORT: free2, AI_PROVIDER: 'gemini', GEMINI_API_KEY: '' } });
await Promise.all([wait(withKey), wait(noKey)]);
const post = (port, text = 'B No 12') => fetch(`http://localhost:${port}/api/enhance`, { method: 'POST', body: JSON.stringify({ text }) });
let n = 0; const ok = (m) => { n++; console.log('PASS', m); };
try {
  mode = 'ok'; let r = await post(free);
  assert.equal(r.status, 200); assert.deepEqual(await r.json(), GOOD); ok('valid Gemini response is parsed and returned');
  assert.equal(seen.url, '/v1beta/models/test-model:generateContent'); ok('calls models/{model}:generateContent');
  assert.equal(seen.key, 'test-key'); assert.ok(!seen.url.includes('test-key')); ok('API key sent in header, not in URL');
  assert.ok(seen.body.systemInstruction.parts[0].text.includes('NOT a medical advisor')); ok('system prompt sent as systemInstruction');
  assert.equal(seen.body.generationConfig.responseMimeType, 'application/json'); assert.equal(seen.body.generationConfig.temperature, 0); ok('JSON mime type + temperature 0');
  mode = 'fenced'; r = await post(free); assert.equal(r.status, 200); ok('markdown-fenced JSON is tolerated');
  mode = 'junk'; r = await post(free); assert.equal(r.status, 502); ok('non-JSON model output -> 502 (client falls back to OCR-only)');
  mode = 'blocked'; r = await post(free); assert.equal(r.status, 502); ok('blocked/empty candidates -> 502');
  mode = 'err'; r = await post(free); assert.equal(r.status, 502); ok('upstream 500 -> 502');
  r = await post(free, '   '); assert.equal(r.status, 400); ok('empty text rejected');
  r = await post(free2); assert.equal(r.status, 503); ok('no key -> 503 with clear message');
  assert.deepEqual(await (await fetch(`http://localhost:${free}/api/health`)).json(), { provider: 'gemini', configured: true }); ok('health: configured');
  assert.deepEqual(await (await fetch(`http://localhost:${free2}/api/health`)).json(), { provider: 'gemini', configured: false }); ok('health: not configured');
  console.log(`\n${n} proxy checks passed (mock upstream)`);
} catch (e) { console.log('FAIL', e.message); process.exitCode = 1; }
finally { withKey.kill(); noKey.kill(); mock.close(); }
