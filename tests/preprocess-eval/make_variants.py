"""Create degraded versions of the demo label and dump raw RGBA for the Node evaluator."""
import json, os, sys
import numpy as np
from PIL import Image, ImageFilter
out = sys.argv[1]; os.makedirs(out, exist_ok=True)
src = Image.open('tests/samples/sample-clear.png').convert('RGB')
rng = np.random.default_rng(42)  # fixed seed -> reproducible

def arr(im): return np.asarray(im).astype(np.float32)
def img(a): return Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))
def lowcontrast(im): return img(110 + arr(im) * (60 / 255))
def shaded(im):
    a = arr(im); w = a.shape[1]; g = np.linspace(1.0, 0.30, w)[None, :, None]; return img(a * g)
def noisy(im): return img(arr(im) + rng.normal(0, 45, arr(im).shape))
def blur(im): return im.filter(ImageFilter.GaussianBlur(2.2))
def small(im): return im.resize((int(im.width * .4), int(im.height * .4)), Image.BILINEAR)
def noisy_mild(im): return img(arr(im) + rng.normal(0, 22, arr(im).shape))
def shaded_hard(im):
    a = arr(im); g = np.linspace(1.0, 0.12, a.shape[1])[None, :, None]; return img(a * g)
def small25(im): return im.resize((int(im.width * .25), int(im.height * .25)), Image.BILINEAR)
def small30_blur(im): return blur(im.resize((int(im.width * .3), int(im.height * .3)), Image.BILINEAR)).filter(ImageFilter.GaussianBlur(0.6))
def combo(im):  # readable-but-hard: half size, soft blur, uneven light, mild noise (grey, not colour speckle)
    a = arr(small(im).filter(ImageFilter.GaussianBlur(0.8)).resize((500, 310), Image.BILINEAR))
    a = a * np.linspace(1.0, 0.45, a.shape[1])[None, :, None]
    n = rng.normal(0, 18, a.shape[:2])[:, :, None]
    return img(a * 0.75 + 40 + n)
V = {'clean': lambda im: im, 'lowcontrast': lowcontrast, 'shaded': shaded, 'noisy': noisy, 'blur': blur, 'small': small, 'small25': small25, 'small30_blur': small30_blur, 'shaded_hard': shaded_hard, 'noisy_mild': noisy_mild, 'combo': combo}
for name, f in V.items():
    im = f(src).convert('RGBA'); w, h = im.size
    open(f'{out}/{name}.rgba', 'wb').write(im.tobytes())
    json.dump({'w': w, 'h': h}, open(f'{out}/{name}.json', 'w'))
print(' '.join(V))
