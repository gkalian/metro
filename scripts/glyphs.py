"""Builds MapLibre SDF glyph PBFs from a TTF, matching the layout of OpenFreeMap's Noto glyphs:
24px em, 3px buffer, radius 8, cutoff 0.25, top measured from 26px above the baseline."""
import math, os, sys

import freetype
import numpy as np
from scipy.ndimage import distance_transform_edt

import pbf

SIZE, BUFFER, RADIUS, CUTOFF, TOP_ORIGIN, SS = 24, 3, 8, 0.25, 26, 4

ttf, name, out = sys.argv[1:4]
face = freetype.Face(ttf)
face.set_char_size(SIZE * SS * 64)
codes = sorted({c for c, _ in face.get_chars() if c <= 0xFFFF})


def glyph(code):
    face.load_char(code, freetype.FT_LOAD_RENDER | freetype.FT_LOAD_NO_HINTING)
    g = face.glyph
    bm = g.bitmap
    advance = round(g.advance.x / 64 / SS)
    if bm.width == 0 or bm.rows == 0:
        return {'id': code, 'bitmap': b'', 'width': 0, 'height': 0, 'left': 0, 'top': -TOP_ORIGIN, 'advance': advance}
    L, T, W, H = g.bitmap_left, g.bitmap_top, bm.width, bm.rows
    hi = np.array(bm.buffer, dtype=np.uint8).reshape(H, bm.pitch)[:, :W]
    left, right = math.floor(L / SS), math.ceil((L + W) / SS)
    top, bottom = math.ceil(T / SS), math.floor((T - H) / SS)
    w, h = right - left, top - bottom
    cw, ch = (w + 2 * BUFFER) * SS, (h + 2 * BUFFER) * SS
    canvas = np.zeros((ch, cw), dtype=bool)
    x0, y0 = L - (left - BUFFER) * SS, (top + BUFFER) * SS - T
    canvas[y0:y0 + H, x0:x0 + W] = hi >= 128
    d = distance_transform_edt(~canvas) - distance_transform_edt(canvas)
    d = d.reshape(h + 2 * BUFFER, SS, w + 2 * BUFFER, SS).mean(axis=(1, 3)) / SS
    v = np.clip(np.round(255 - 255 * (d / RADIUS + CUTOFF)), 0, 255).astype(np.uint8)
    return {'id': code, 'bitmap': v.tobytes(), 'width': w, 'height': h, 'left': left, 'top': top - TOP_ORIGIN, 'advance': advance}


dest = os.path.join(out, name)
os.makedirs(dest, exist_ok=True)
by_range = {}
for c in codes:
    by_range.setdefault(c // 256, []).append(glyph(c))
# every range exists, so labels in scripts the font lacks don't fail to load
for r in range(256):
    rng = f'{r * 256}-{r * 256 + 255}'
    with open(os.path.join(dest, rng + '.pbf'), 'wb') as f:
        f.write(pbf.write(name, rng, by_range.get(r, [])))
print(name, len(codes), 'glyphs in', len(by_range), 'ranges')
