// Shared AI logic used by BOTH the standalone server (server/index.js) and the Vercel functions (api/*.js).
// Keys come from environment variables only; nothing here ever reaches the browser.
import { SYSTEM_PROMPT } from './prompt.js';

const env = process.env;
const PROVIDER = (env.AI_PROVIDER || 'gemini').toLowerCase();
const CFG = {
  gemini: { key: env.GEMINI_API_KEY, model: env.GEMINI_MODEL || 'gemini-3.8-flash', base: env.GEMINI_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta' },
  anthropic: { key: env.ANTHROPIC_API_KEY, model: env.CLAUDE_MODEL || 'claude-sonnet-5-5', base: env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com' },
}[PROVIDER];

// Upstream failures carry a short, key-free reason so the real cause is visible (console + UI) instead of a generic message.
class UpstreamError extends Error { constructor(msg, hint) { super(msg); this.hint = hint; } }
const hintFor = (status) => status === 404 ? `The model "${CFG.model}" was not found or is not available to your key. Set GEMINI_MODEL to a current model (see ai.google.dev/gemini-api/docs/models) and restart the server.`
  : status === 400 ? 'The AI service rejected the request (check GEMINI_MODEL and that the key is a Gemini API key).'
  : status === 401 || status === 403 ? 'The AI service rejected the API key. Check GEMINI_API_KEY (create one in Google AI Studio) and that the Generative Language API is enabled.'
  : status === 429 ? 'AI quota or rate limit reached. Wait a minute and try again, or check your plan.'
  : `The AI service returned an error (${status}).`;
const userMessage = (text) => `OCR TEXT:\n"""\n${text}\n"""`;

async function callGemini(text) {
  const r = await fetch(`${CFG.base}/models/${CFG.model}:generateContent`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-goog-api-key': CFG.key }, // header, not ?key=, so keys stay out of URLs/logs
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [{ role: 'user', parts: [{ text: userMessage(text) }] }],
      generationConfig: { temperature: 0, maxOutputTokens: 8192, responseMimeType: 'application/json' }, // generous: thinking tokens count toward this limit and a low cap truncates the JSON
    }),
  });
  if (!r.ok) {
    const detail = (await r.text().catch(() => '')).slice(0, 400);
    console.error(`[gemini] HTTP ${r.status} for model "${CFG.model}": ${detail}`);
    throw new UpstreamError(`gemini ${r.status}`, hintFor(r.status));
  }
  const data = await r.json();
  const cand = data.candidates?.[0];
  const out = (cand?.content?.parts || []).filter((p) => !p.thought).map((p) => p.text || '').join('');
  if (!out) { console.error('[gemini] empty/blocked response:', JSON.stringify({ finishReason: cand?.finishReason, promptFeedback: data.promptFeedback })); throw new UpstreamError('empty response', 'The AI returned no text (blocked or empty). Showing OCR-only results.'); }
  if (cand?.finishReason === 'MAX_TOKENS') console.error('[gemini] output hit MAX_TOKENS; JSON may be truncated');
  return out;
}

async function callAnthropic(text) {
  const r = await fetch(`${CFG.base}/v1/messages`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': CFG.key, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: CFG.model, max_tokens: 1500, system: SYSTEM_PROMPT, messages: [{ role: 'user', content: userMessage(text) }] }),
  });
  if (!r.ok) throw new Error(`anthropic ${r.status}`);
  const data = await r.json();
  return (data.content || []).map((b) => b.text || '').join('');
}

const call = { gemini: callGemini, anthropic: callAnthropic }[PROVIDER];

export { PROVIDER, CFG };

export const health = () => ({ provider: PROVIDER, configured: !!(call && CFG?.key) });

// Returns { status, body } so any HTTP wrapper can send it.
export async function enhance(text) {
  if (!call) return { status: 503, body: { error: `Unknown AI_PROVIDER "${PROVIDER}". Use "gemini" or "anthropic".` } };
  if (!CFG.key) return { status: 503, body: { error: 'AI is not configured. Add the API key as a server environment variable. OCR-only mode still works.' } };
  if (typeof text !== 'string' || !text.trim()) return { status: 400, body: { error: 'No text provided' } };
  if (text.length > 50_000) return { status: 413, body: { error: 'Text too long' } };
  try {
    const raw = (await call(text)).replace(/```json|```/g, '').trim();
    return { status: 200, body: JSON.parse(raw) };
  } catch (e) {
    if (!(e instanceof UpstreamError)) console.error('[enhance] unusable AI response:', e.message);
    return { status: 502, body: { error: (e.hint || 'The AI service returned an unusable (non-JSON or truncated) response.') + ' Showing OCR-only results.' } };
  }
}
