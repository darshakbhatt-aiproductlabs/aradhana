#!/usr/bin/env python3
"""Chroma-key the studio diya and flame onto transparent webp."""
from pathlib import Path
from PIL import Image

ROOT = Path("/workspace")
JOBS = [
    (
        ROOT / "artifacts/imagine_images/7cf886dc-4fdc-428d-8230-6f2ee7741ca4.jpg",
        "diya.webp",
        640,
        18,
    ),
    (
        ROOT / "artifacts/imagine_images/5db6a19a-716d-4701-b9d8-ba7d7dc8668e.jpg",
        "flame.webp",
        384,
        28,
    ),
]
OUTS = [ROOT / "public/deities", ROOT / "docs/deities"]


def punch_green(im: Image.Image, spill: int) -> Image.Image:
    im = im.convert("RGBA")
    px = im.load()
    w, h = im.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            ge = g - max(r, b)
            if g > 70 and ge > spill:
                t = min(1.0, (ge - spill) / 70.0)
                na = int(a * (1.0 - t))
                # despill residual green
                ng = min(g, max(r, b) + 8)
                px[x, y] = (r, ng, b, na)
            elif g > r + 20 and g > b + 20:
                # fringe
                na = int(a * 0.35)
                ng = min(g, max(r, b) + 12)
                px[x, y] = (r, ng, b, na)
    # crop to alpha
    bbox = im.getbbox()
    if not bbox:
        return im
    pad = 8
    x0, y0, x1, y1 = bbox
    x0 = max(0, x0 - pad)
    y0 = max(0, y0 - pad)
    x1 = min(w, x1 + pad)
    y1 = min(h, y1 + pad)
    return im.crop((x0, y0, x1, y1))


def main() -> None:
    for src, name, max_edge, spill in JOBS:
        im = Image.open(src)
        cut = punch_green(im, spill)
        cut.thumbnail((max_edge, max_edge), Image.Resampling.LANCZOS)
        for out in OUTS:
            out.mkdir(parents=True, exist_ok=True)
            dest = out / name
            cut.save(dest, "WEBP", quality=92, method=6)
            print("wrote", dest, cut.size, dest.stat().st_size)


if __name__ == "__main__":
    main()
