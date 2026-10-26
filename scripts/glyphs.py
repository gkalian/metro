"""Builds MapLibre SDF glyph PBFs from a TTF, matching the layout of OpenFreeMap's Noto glyphs:
24px em, 3px buffer, radius 8, cutoff 0.25, top measured from 26px above the baseline.

    glyphs.py FONT.ttf "Font Stack" OUT [--wght N] [--ranges 768-1023,...]

--wght picks the weight of a variable font. --ranges rewrites only those ranges and keeps the
glyphs already there for characters this font lacks: that is how a script missing from the
main font is taken whole from another one."""
import argparse, math, os

import freetype
import numpy as np
from scipy.ndimage import distance_transform_edt

import pbf

SIZE, BUFFER, RADIUS, CUTOFF, TOP_ORIGIN, SS = 24, 3, 8, 0.25, 26, 4

ap = argparse.ArgumentParser()
ap.add_argument('ttf')
ap.add_argument('name')
ap.add_argument('out')
ap.add_argument('--wght', type=float)
ap.add_argument('--ranges', help='e.g. 768-1023; every range by default')
args = ap.parse_args()
name = args.name
starts = range(256) if not args.ranges else [int(r.split('-')[0]) // 256 for r in args.ranges.split(',')]

face = freetype.Face(args.ttf)
if args.wght is not None:
    face.set_var_design_coords((args.wght,))
face.set_char_size(SIZE * SS * 64)
codes = sorted({c for c, _ in face.get_chars() if c <= 0xFFFF and c // 256 in starts})


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


dest = os.path.join(args.out, name)
os.makedirs(dest, exist_ok=True)


def existing(r):
    path = os.path.join(dest, f'{r * 256}-{r * 256 + 255}.pbf')
    if not args.ranges or not os.path.exists(path):
        return []
    with open(path, 'rb') as f:
        return [{'bitmap': b'', **g} for st in pbf.read(f.read()) for g in st['glyphs'] if g['id'] not in new]


new = set(codes)
by_range = {r: existing(r) for r in starts}
kept = sum(len(gs) for gs in by_range.values())
for c in codes:
    by_range[c // 256].append(glyph(c))
for gs in by_range.values():
    gs.sort(key=lambda g: g['id'])
# every range exists, so labels in scripts the font lacks don't fail to load
for r in starts:
    rng = f'{r * 256}-{r * 256 + 255}'
    with open(os.path.join(dest, rng + '.pbf'), 'wb') as f:
        f.write(pbf.write(name, rng, by_range.get(r, [])))
print(name, len(codes), 'glyphs from this font,', kept, 'kept')
