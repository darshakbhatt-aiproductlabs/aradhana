#!/usr/bin/env python3
"""Keep the bronze murti. Punch peach / checker / taupe — including holes between limbs."""
from pathlib import Path
from collections import deque
from PIL import Image
import numpy as np

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


def dilate(mask, r=1):
    h, w = mask.shape
    out = mask.copy()
    for dy in range(-r, r + 1):
        for dx in range(-r, r + 1):
            if dx == 0 and dy == 0:
                continue
            y0, y1 = max(0, dy), min(h, h + dy)
            x0, x1 = max(0, dx), min(w, w + dx)
            sy0, sy1 = max(0, -dy), min(h, h - dy)
            sx0, sx1 = max(0, -dx), min(w, w - dx)
            out[y0:y1, x0:x1] |= mask[sy0:sy1, sx0:sx1]
    return out


def studio_components(studio):
    h, w = studio.shape
    labels = np.zeros((h, w), dtype=np.int32)
    vis = np.zeros((h, w), dtype=np.uint8)
    sizes = {}
    border = {}
    lab = 0
    neigh = ((1, 0), (-1, 0), (0, 1), (0, -1), (1, 1), (1, -1), (-1, 1), (-1, -1))
    ys, xs = np.where(studio)
    for y, x in zip(ys, xs):
        if vis[y, x]:
            continue
        lab += 1
        q = deque([(x, y)])
        vis[y, x] = 1
        n = 0
        hits_border = False
        while q:
            cx, cy = q.popleft()
            labels[cy, cx] = lab
            n += 1
            if cx == 0 or cy == 0 or cx == w - 1 or cy == h - 1:
                hits_border = True
            for dx, dy in neigh:
                nx, ny = cx + dx, cy + dy
                if nx < 0 or ny < 0 or nx >= w or ny >= h:
                    continue
                if vis[ny, nx] or not studio[ny, nx]:
                    continue
                vis[ny, nx] = 1
                q.append((nx, ny))
        sizes[lab] = n
        border[lab] = hits_border
    return labels, sizes, border


def punch(im):
    im = im.convert("RGBA")
    arr = np.array(im)
    rgb = arr[:, :, :3].astype(np.float32)
    r, g, b = rgb[:, :, 0], rgb[:, :, 1], rgb[:, :, 2]
    lu = 0.299 * r + 0.587 * g + 0.114 * b
    s = rgb.max(axis=2) - rgb.min(axis=2)

    bronze = (r > g + 4) & (r > b + 20) & (s > 36) & (lu > 22) & (lu < 232) & (b < 170)
    bronze |= (r > b + 8) & (r >= g - 4) & (s > 14) & (lu > 8) & (lu < 88)

    peach = (lu > 158) & (s < 72) & (r >= g - 8) & (g >= b - 14) & (b > 130) & (~bronze)
    gray = (s < 30) & (lu > 108) & (np.abs(r - g) < 24) & (np.abs(g - b) < 26) & (~bronze)
    taupe = (s < 40) & (lu > 88) & (lu < 190) & (np.abs(r - g) < 26) & (np.abs(g - b) < 30) & (~bronze)
    white = (lu > 228) & (s < 50) & (~bronze)
    studio = peach | gray | taupe | white

    labels, sizes, on_border = studio_components(studio)
    punch_mask = np.zeros(studio.shape, dtype=bool)
    # Eyes / moon / pearls stay (tiny). Enclosed peach between limbs goes.
    for lab, n in sizes.items():
        if on_border[lab] or n >= 70:
            punch_mask[labels == lab] = True

    # Keep a 1px bronze fringe so AA edges of the murti are not eaten.
    keep = bronze | (dilate(bronze, 1) & ~punch_mask)
    arr[~keep, 3] = 0

    a = arr[:, :, 3]
    # Soften the cut
    up = np.roll(a, 1, 0)
    down = np.roll(a, -1, 0)
    left = np.roll(a, 1, 1)
    right = np.roll(a, -1, 1)
    n0 = ((up == 0).astype(np.uint8) + (down == 0) + (left == 0) + (right == 0))
    fade = (a > 0) & (n0 > 0) & (~bronze)
    arr[:, :, 3] = np.where(fade, np.maximum(40, a.astype(np.int16) - n0 * 55), a)

    # Watermark / caption strip
    h, w = a.shape
    patch_a = arr[h - 30 :, w - 120 :, 3]
    patch = arr[h - 30 :, w - 120 :, :3].astype(np.float32)
    plu = 0.299 * patch[:, :, 0] + 0.587 * patch[:, :, 1] + 0.114 * patch[:, :, 2]
    ps = patch.max(axis=2) - patch.min(axis=2)
    kill = (ps < 42) & ((plu > 155) | (plu < 55))
    arr[h - 30 :, w - 120 :, 3] = np.where(kill, 0, patch_a)

    return Image.fromarray(arr, "RGBA")


def leftover_frac(im):
    arr = np.array(im)
    rgb = arr[:, :, :3].astype(np.float32)
    a = arr[:, :, 3]
    r, g, b = rgb[:, :, 0], rgb[:, :, 1], rgb[:, :, 2]
    lu = 0.299 * r + 0.587 * g + 0.114 * b
    s = rgb.max(axis=2) - rgb.min(axis=2)
    bronze = (r > g + 4) & (r > b + 20) & (s > 36) & (lu > 22) & (lu < 232) & (b < 170)
    studio = (a > 20) & (~bronze) & (
        ((s < 30) & (lu > 110))
        | ((s < 55) & (lu > 175) & (r >= g - 8))
        | ((lu > 235) & (s < 50))
    )
    return float(studio.mean() * 100), float((a > 10).mean() * 100)


def main():
    for src_name, dest in MAP.items():
        src = SRC / src_name
        cut = punch(Image.open(src))
        cut.thumbnail((900, 1340), Image.Resampling.LANCZOS)
        leftover, opaque = leftover_frac(cut)
        for out_dir in OUT_DIRS:
            out_dir.mkdir(parents=True, exist_ok=True)
            cut.save(out_dir / dest, "WEBP", quality=92, method=6)
        print(f"{dest:22} {cut.size[0]}x{cut.size[1]} opaque={opaque:5.1f}% leftover={leftover:5.2f}%")


if __name__ == "__main__":
    main()
