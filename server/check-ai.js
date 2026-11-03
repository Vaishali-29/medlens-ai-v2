// Run: npm run check:ai  -> makes ONE real call to your configured AI provider and prints the actual result/error.
import { SYSTEM_PROMPT } from './prompt.js';
const e = process.env, model = e.GEMINI_MODEL || 'gemini-3.8-flash';
console.log(`Provider: ${e.AI_PROVIDER || 'gemini'} | model: ${model} | key set: ${!!e.GEMINI_API_KEY}`);
if ((e.AI_PROVIDER || 'gemini') !== 'gemini') { console.log('This check covers Gemini only.'); process.exit(0); }
if (!e.GEMINI_API_KEY) { console.log('FAIL: GEMINI_API_KEY is empty. Is it in .env (not .env.example) and did you restart the server?'); process.exit(1); }
const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
  method: 'POST', headers: { 'content-type': 'application/json', 'x-goog-api-key': e.GEMINI_API_KEY },
  body: JSON.stringify({ systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] }, contents: [{ role: 'user', parts: [{ text: 'OCR TEXT:\n"""\nParacetamol Tablets IP 500 mg\nB.No. A123 EXP 08/2027\n"""' }] }], generationConfig: { temperature: 0, maxOutputTokens: 8192, responseMimeType: 'application/json' } }),
});
const body = await r.text();
console.log(`HTTP ${r.status}`); console.log(body.slice(0, 1200));
if (r.ok) { try { JSON.parse(JSON.parse(body).candidates[0].content.parts.map((p) => p.text || '').join('')); console.log('\nPASS: Gemini replied with valid JSON.'); } catch { console.log('\nWARN: reply was not valid JSON (see above; may be truncated).'); } }
else console.log('\nFAIL: read the error above. 404 = model not available, 400 = bad model/key, 403 = key rejected, 429 = quota.');
