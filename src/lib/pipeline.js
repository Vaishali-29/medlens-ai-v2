import { extractFields } from './extract.js';
import { explainTerms } from './glossary.js';
import { enhanceWithAi, mergeAi } from './ai.js';

export async function buildRecord({ text, lines, conf = null, isDemo = false, useAi = false }) {
  let fields = extractFields(lines);
  let explanations = explainTerms(text);
  let ai = { used: false, error: '', accepted: 0, rejected: 0 };
  if (useAi) {
    try {
      const m = mergeAi(fields, explanations, await enhanceWithAi(text), text);
      fields = m.fields; explanations = m.explanations;
      ai = { used: true, error: '', accepted: m.accepted, rejected: m.rejected };
    } catch (e) { ai = { used: false, error: e.message, accepted: 0, rejected: 0 }; }
  }
  return { id: crypto.randomUUID(), createdAt: new Date().toISOString(), isDemo, ocrText: text, ocrConf: conf, fields, explanations, verified: {}, ai };
}
