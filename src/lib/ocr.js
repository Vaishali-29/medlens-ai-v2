import { createWorker } from 'tesseract.js';

export class ScanError extends Error {}

export async function runOcr(file, onProgress) {
  const worker = await createWorker('eng', 1, {
    logger: (m) => { if (m.status === 'recognizing text') onProgress?.(m.progress); },
  });
  try {
    const { data } = await worker.recognize(file);
    const text = (data.text || '').trim();
    const lines = (data.lines || []).map((l) => ({ text: l.text.trim(), conf: Math.round(l.confidence) })).filter((l) => l.text);
    const fallback = text.split('\n').filter(Boolean).map((t) => ({ text: t.trim(), conf: null }));
    const conf = Math.round(data.confidence ?? 0);
    if (text.replace(/[^a-z0-9]/gi, '').length < 20 || conf < 35) {
      throw new ScanError('We could not read enough text. Retake the photo in good light, keep the label flat and in focus, and fill the frame.');
    }
    return { text, lines: lines.length ? lines : fallback, conf };
  } finally {
    await worker.terminate();
  }
}
