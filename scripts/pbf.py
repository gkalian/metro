"""Minimal reader/writer for MapLibre glyph PBFs (glyphs.proto)."""


def varint(b, i):
    r = s = 0
    while True:
        c = b[i]
        i += 1
        r |= (c & 0x7F) << s
        s += 7
        if c < 0x80:
            return r, i


def fields(b):
    i = 0
    while i < len(b):
        key, i = varint(b, i)
        f, wt = key >> 3, key & 7
        if wt == 0:
            v, i = varint(b, i)
        elif wt == 2:
            n, i = varint(b, i)
            v = b[i:i + n]
            i += n
        else:
            raise ValueError(wt)
        yield f, v


unzig = lambda n: (n >> 1) ^ -(n & 1)


def read(data):
    stacks = []
    for f, v in fields(data):
        if f != 1:
            continue
        st = {'glyphs': []}
        for f2, v2 in fields(v):
            if f2 == 1:
                st['name'] = v2.decode()
            elif f2 == 2:
                st['range'] = v2.decode()
            elif f2 == 3:
                g = {}
                for f3, v3 in fields(v2):
                    k = {1: 'id', 2: 'bitmap', 3: 'width', 4: 'height', 5: 'left', 6: 'top', 7: 'advance'}[f3]
                    g[k] = unzig(v3) if f3 in (5, 6) else v3
                st['glyphs'].append(g)
        stacks.append(st)
    return stacks


def enc_varint(n):
    out = bytearray()
    while True:
        c = n & 0x7F
        n >>= 7
        if n:
            out.append(c | 0x80)
        else:
            out.append(c)
            return bytes(out)


def zig(n):
    return (n << 1) ^ (n >> 31)


def key(f, wt):
    return enc_varint((f << 3) | wt)


def ld(f, data):
    return key(f, 2) + enc_varint(len(data)) + data


def write(name, rng, glyphs):
    body = ld(1, name.encode()) + ld(2, rng.encode())
    for g in glyphs:
        gb = key(1, 0) + enc_varint(g['id'])
        if g['bitmap']:
            gb += ld(2, g['bitmap'])
        gb += key(3, 0) + enc_varint(g['width']) + key(4, 0) + enc_varint(g['height'])
        gb += key(5, 0) + enc_varint(zig(g['left'])) + key(6, 0) + enc_varint(zig(g['top']))
        gb += key(7, 0) + enc_varint(g['advance'])
        body += ld(3, gb)
    return ld(1, body)
