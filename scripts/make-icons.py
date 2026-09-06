#!/usr/bin/env python3
"""Generate extension/icons/icon-<size>.png at every size the manifest needs.

Usage: python3 scripts/make-icons.py
Requires Pillow. A dark rounded square with a single pen stroke.
"""
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "extension" / "icons"
SIZES = [48, 64, 96, 128, 256, 512, 1024]


def draw_icon(size):
    s = size
    img = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    radius = s * 0.22
    d.rounded_rectangle([0, 0, s - 1, s - 1], radius=radius, fill=(28, 28, 30, 255))
    # One flowing stroke, orange, like a highlighter swoosh.
    pts = [(s * 0.18, s * 0.66), (s * 0.34, s * 0.30), (s * 0.50, s * 0.70), (s * 0.66, s * 0.34), (s * 0.82, s * 0.62)]
    width = max(2, int(s * 0.11))
    d.line(pts, fill=(255, 149, 0, 255), width=width, joint="curve")
    r = width / 2
    for x, y in (pts[0], pts[-1]):
        d.ellipse([x - r, y - r, x + r, y + r], fill=(255, 149, 0, 255))
    return img


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    for size in SIZES:
        path = OUT / f"icon-{size}.png"
        draw_icon(size).save(path)
        print(f"wrote {path.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
