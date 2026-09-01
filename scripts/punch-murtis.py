#!/usr/bin/env python3
"""Cut studio / checkerboard / black backdrops off the bronze murti photos."""
from pathlib import Path
from PIL import Image
import collections

SRC = Path("/workspace/attachments")
OUT_DIRS = [Path("/workspace/public/deities"), Path("/workspace/docs/deities")]

MAP = {
    "124417.jpg": "ganesha.webp",
    "124418.jpg": "shiva.webp",
    "124420.jpg": "shiva-parvati.webp",
    "124421.jpg": "shivling.webp",
    "124422.jpg": "vishnu.webp",
    "124424.jpg": "durga.webp",
    "124425.jpg": "hanuman.webp",
    "124426.jpg": "venkateswara.webp",
    "124427.jpg": "murugan.webp",
    "124428.jpg": "rama.webp",
    "124430.jpg": "radha-krishna.webp",
    "124431.jpg": "krishna.webp",
    "124433.jpg": "brahma.webp",
    "124434.jpg": "saraswati.webp",
    "124435.jpg": "surya.webp",
    "124436.jpg": "shani.webp",
    "124437.jpg": "ayyappa.webp",
    "124438.jpg": "dattatreya.webp",
    "124441.jpg": "nataraja.webp",
    "124450.jpg": "kali.webp",
}


def luma(c):
    return 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]


def sat(c):
    return max(c[0], c[1], c[2]) - min(c[0], c[1], c[2])


def classify(im):
    w, h = im.size
    pts = [
        (2, 2), (w - 3, 2), (2, h - 3), (w - 3, h - 3),
        (w // 2, 2), (2, h // 2), (w - 3, h // 2), (w // 2, h - 3),
    ]
    samples = [im.getpixel(p)[:3] for p in pts]
    avg_l = sum(luma(c) for c in samples) / len(samples)
    avg_s = sum(sat(c) for c in samples) / len(samples)
    crop = im.crop((0, 0, 36, 36)).convert("RGB")
    uniq = len(set(crop.getdata()))
    if avg_l < 38 and avg_s < 12:
        return "black"
    if avg_l > 248 and avg_s < 10:
        return "white"
    if uniq > 18 and 200 < avg_l < 245 and avg_s < 12:
        return "checker"
    return "studio"


def punch(im):
    im = im.convert("RGBA")
    w, h = im.size
    px = im.load()
    mode = classify(im.convert("RGB"))
    corners = [px[2, 2], px[w - 3, 2], px[2, h - 3], px[w - 3, h - 3]]
    bg = tuple(sum(c[i] for c in corners) // 4 for i in range(3))

    def is_bg(x, y):
        r, g, b, a = px[x, y]
        s = sat((r, g, b))
        lu = luma((r, g, b))
        d = ((r - bg[0]) ** 2 + (g - bg[1]) ** 2 + (b - bg[2]) ** 2) ** 0.5
        if s > 36 and d > 28:
            return False
        if mode == "black":
            return lu < 42 and s < 22
        if mode == "white":
            return lu > 236 and s < 22
        if mode == "checker":
            return s < 16 and lu > 196
        return d < 42 and s < 28

    vis = bytearray(w * h)
    stack = []

    def push(x, y):
        if x < 0 or y < 0 or x >= w or y >= h:
            return
        i = y * w + x
        if vis[i]:
            return
        if not is_bg(x, y):
            return
        vis[i] = 1
        stack.append(i)

    for x in range(w):
        push(x, 0)
        push(x, h - 1)
    for y in range(h):
        push(0, y)
        push(w - 1, y)
    while stack:
        i = stack.pop()
        x, y = i % w, i // w
        px[x, y] = (px[x, y][0], px[x, y][1], px[x, y][2], 0)
        push(x + 1, y)
        push(x - 1, y)
        push(x, y + 1)
        push(x, y - 1)

    # Grok watermark — faint mark in the lower-right on studio shots
    for y in range(h - 28, h):
        for x in range(w - 110, w):
            r, g, b, a = px[x, y]
            if a == 0:
                continue
            if sat((r, g, b)) < 40 and (luma((r, g, b)) > 160 or luma((r, g, b)) < 50):
                px[x, y] = (r, g, b, 0)

    # erode 2px so cream/black fringes don't become a halo
    for _ in range(2):
        kill = []
        for y in range(1, h - 1):
            for x in range(1, w - 1):
                if px[x, y][3] == 0:
                    continue
                if (
                    px[x - 1, y][3] == 0
                    or px[x + 1, y][3] == 0
                    or px[x, y - 1][3] == 0
                    or px[x, y + 1][3] == 0
                ):
                    kill.append((x, y))
        for x, y in kill:
            r, g, b, _ = px[x, y]
            px[x, y] = (r, g, b, 0)

    # feather 1px
    for y in range(1, h - 1):
        for x in range(1, w - 1):
            if px[x, y][3] == 0:
                continue
            n = 0
            if px[x - 1, y][3] == 0:
                n += 1
            if px[x + 1, y][3] == 0:
                n += 1
            if px[x, y - 1][3] == 0:
                n += 1
            if px[x, y + 1][3] == 0:
                n += 1
            if n:
                r, g, b, a = px[x, y]
                px[x, y] = (r, g, b, max(40, a - n * 70))

    return im, mode


def main():
    for src_name, dest in MAP.items():
        src = SRC / src_name
        im = Image.open(src)
        cut, mode = punch(im)
        cut.thumbnail((900, 1340), Image.Resampling.LANCZOS)
        for out_dir in OUT_DIRS:
            out_dir.mkdir(parents=True, exist_ok=True)
            cut.save(out_dir / dest, "WEBP", quality=92, method=6)
        print(f"{dest:22} {mode:8} {cut.size} alpha")


if __name__ == "__main__":
    main()
