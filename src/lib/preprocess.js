// Image preprocessing for OCR. Pure functions on pixel arrays so they can be tested in Node.
// Browser wrapper at the bottom uses <canvas>. Never uploads or stores the image.

/** RGBA -> grayscale (Rec. 601 luma). */
export function toGray(rgba, w, h) {
  const g = new Uint8ClampedArray(w * h);
  for (let i = 0, j = 0; i < g.length; i++, j += 4) g[i] = 0.299 * rgba[j] + 0.587 * rgba[j + 1] + 0.114 * rgba[j + 2];
  return g;
}

/** Contrast stretch between the lo/hi percentiles. Flat images are returned unchanged. */
export function stretch(gray, lo = 0.01, hi = 0.99) {
  const hist = new Uint32Array(256);
  for (const v of gray) hist[v]++;
  const pick = (p) => { let acc = 0; const t = p * gray.length; for (let i = 0; i < 256; i++) { acc += hist[i]; if (acc >= t) return i; } return 255; };
  const a = pick(lo), b = pick(hi);
  if (b - a < 8) return gray;
  const out = new Uint8ClampedArray(gray.length);
  for (let i = 0; i < gray.length; i++) out[i] = ((gray[i] - a) * 255) / (b - a);
  return out;
}

/** Bilinear upscale of a grayscale image by `f` (>1). */
export function upscale(gray, w, h, f) {
  const W = Math.round(w * f), H = Math.round(h * f), out = new Uint8ClampedArray(W * H);
  for (let y = 0; y < H; y++) {
    const sy = Math.min(h - 1, y / f), y0 = Math.floor(sy), y1 = Math.min(h - 1, y0 + 1), fy = sy - y0;
    for (let x = 0; x < W; x++) {
      const sx = Math.min(w - 1, x / f), x0 = Math.floor(sx), x1 = Math.min(w - 1, x0 + 1), fx = sx - x0;
      const top = gray[y0 * w + x0] * (1 - fx) + gray[y0 * w + x1] * fx;
      const bot = gray[y1 * w + x0] * (1 - fx) + gray[y1 * w + x1] * fx;
      out[y * W + x] = top * (1 - fy) + bot * fy;
    }
  }
  return { gray: out, w: W, h: H };
}

/** Adaptive (Bradley) threshold: handles uneven lighting. */
export function adaptiveThreshold(gray, w, h, win = Math.max(15, Math.round(w / 8)), t = 0.15) {
  const integ = new Float64Array((w + 1) * (h + 1));
  for (let y = 0; y < h; y++) { let row = 0; for (let x = 0; x < w; x++) { row += gray[y * w + x]; integ[(y + 1) * (w + 1) + x + 1] = integ[y * (w + 1) + x + 1] + row; } }
  const out = new Uint8ClampedArray(w * h), r = win >> 1;
  for (let y = 0; y < h; y++) {
    const y0 = Math.max(0, y - r), y1 = Math.min(h - 1, y + r);
    for (let x = 0; x < w; x++) {
      const x0 = Math.max(0, x - r), x1 = Math.min(w - 1, x + r), n = (x1 - x0 + 1) * (y1 - y0 + 1);
      const sum = integ[(y1 + 1) * (w + 1) + x1 + 1] - integ[y0 * (w + 1) + x1 + 1] - integ[(y1 + 1) * (w + 1) + x0] + integ[y0 * (w + 1) + x0];
      out[y * w + x] = gray[y * w + x] * n < sum * (1 - t) ? 0 : 255;
    }
  }
  return out;
}

/**
 * mode: 'none' | 'scale' | 'stretch' | 'binarize'
 * Upscales so the width is at least `minWidth` (OCR works best with text ~ 20-30px tall).
 */
export function preprocess(rgba, w, h, { mode = 'stretch', minWidth = 1600, maxWidth = 2600 } = {}) {
  let gray = toGray(rgba, w, h);
  if (mode === 'none') return { gray, w, h };
  if (mode === 'stretch' || mode === 'binarize') gray = stretch(gray);
  let W = w, H = h;
  if (w < minWidth) ({ gray, w: W, h: H } = upscale(gray, w, h, Math.min(minWidth, maxWidth) / w));
  if (mode === 'binarize') gray = adaptiveThreshold(gray, W, H);
  return { gray, w: W, h: H };
}

/* ---------- Browser wrapper (not exercised by Node tests) ---------- */
export async function preprocessFile(file, mode = 'stretch') {
  const bmp = await createImageBitmap(file);
  const c = document.createElement('canvas'); c.width = bmp.width; c.height = bmp.height;
  const ctx = c.getContext('2d'); ctx.drawImage(bmp, 0, 0);
  const { data } = ctx.getImageData(0, 0, c.width, c.height);
  const r = preprocess(data, c.width, c.height, { mode });
  const out = document.createElement('canvas'); out.width = r.w; out.height = r.h;
  const octx = out.getContext('2d'), img = octx.createImageData(r.w, r.h);
  for (let i = 0, j = 0; i < r.gray.length; i++, j += 4) { img.data[j] = img.data[j + 1] = img.data[j + 2] = r.gray[i]; img.data[j + 3] = 255; }
  octx.putImageData(img, 0, 0);
  return new Promise((res, rej) => out.toBlob((b) => (b ? res(b) : rej(new Error('toBlob failed'))), 'image/png'));
}
