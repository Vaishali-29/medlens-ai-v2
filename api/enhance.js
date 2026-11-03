// Vercel serverless function: POST /api/enhance  (the Gemini key stays in Vercel env vars, never in the browser)
import { enhance } from '../server/core.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const text = typeof req.body === 'string' ? safeParse(req.body)?.text : req.body?.text;
  const { status, body } = await enhance(text);
  res.status(status).json(body);
}
const safeParse = (s) => { try { return JSON.parse(s); } catch { return null; } };
