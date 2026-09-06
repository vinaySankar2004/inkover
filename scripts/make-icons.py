#!/usr/bin/env python3
"""Generate every icon from one drawing: three lines of text with an orange hand-drawn circle around the middle one.

Usage: python3 scripts/make-icons.py
Requires Pillow.

Writes:
  extension/icons/icon-<size>.png                 rounded corners, transparent outside, for Safari's toolbar
  Inkover/Inkover/Assets.xcassets/AppIcon.appiconset/universal-icon-1024@1x.png
                                                   square, opaque, the App Store icon (iOS masks the corners itself)
  Inkover/Inkover/Resources/Icon.png               square, opaque, shown in the wrapper app
  Inkover/Inkover/Assets.xcassets/LargeIcon.imageset/icon-256.png
"""
import math
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
EXT_ICONS = ROOT / "extension" / "icons"
APPICON = ROOT / "Inkover" / "Inkover" / "Assets.xcassets" / "AppIcon.appiconset" / "universal-icon-1024@1x.png"
LARGEICON = ROOT / "Inkover" / "Inkover" / "Assets.xcassets" / "LargeIcon.imageset" / "icon-256.png"
WRAPPER_ICON = ROOT / "Inkover" / "Inkover" / "Resources" / "Icon.png"
SIZES = [48, 64, 96, 128, 256, 512, 1024]

BG_TOP = (44, 44, 46)
BG_BOTTOM = (22, 22, 24)
TEXT = (142, 142, 147)
INK = (255, 149, 0)
SUPER = 4  # supersampling factor for smooth edges


def draw_master(size):
    s = size * SUPER
    img = Image.new("RGB", (s, s), BG_BOTTOM)
    d = ImageDraw.Draw(img)

    # Subtle vertical gradient so the square has some depth at large sizes.
    for y in range(s):
        t = y / (s - 1)
        c = tuple(round(BG_TOP[i] + (BG_BOTTOM[i] - BG_TOP[i]) * t) for i in range(3))
        d.line([(0, y), (s, y)], fill=c)

    # Three lines of text, left aligned, like a paragraph.
    line_h = s * 0.075
    x0 = s * 0.20
    widths = [0.60, 0.62, 0.42]
    centers = [0.34, 0.50, 0.66]
    for w, cy in zip(widths, centers):
        y = s * cy
        d.rounded_rectangle([x0, y - line_h / 2, x0 + s * w, y + line_h / 2], radius=line_h / 2, fill=TEXT)

    # A hand-drawn circle around the middle line: slight tilt, slight wobble, overshoots its start.
    cx, cy = s * 0.50, s * 0.50
    rx, ry = s * 0.36, s * 0.155
    tilt = math.radians(-7)
    stroke = s * 0.052
    pts = []
    start, end = math.radians(-35), math.radians(360 + 30)
    steps = 240
    for i in range(steps + 1):
        t = start + (end - start) * i / steps
        wobble = 1 + 0.025 * math.sin(t * 3 + 0.8) + 0.012 * math.sin(t * 7)
        px, py = rx * wobble * math.cos(t), ry * wobble * math.sin(t)
        x = cx + px * math.cos(tilt) - py * math.sin(tilt)
        y = cy + px * math.sin(tilt) + py * math.cos(tilt)
        pts.append((x, y))
    d.line(pts, fill=INK, width=round(stroke), joint="curve")
    r = stroke / 2
    for x, y in (pts[0], pts[-1]):
        d.ellipse([x - r, y - r, x + r, y + r], fill=INK)

    return img.resize((size, size), Image.LANCZOS)


def rounded(img):
    size = img.size[0]
    mask = Image.new("L", (size * SUPER, size * SUPER), 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, size * SUPER - 1, size * SUPER - 1], radius=size * SUPER * 0.225, fill=255)
    mask = mask.resize((size, size), Image.LANCZOS)
    out = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    out.paste(img, (0, 0), mask)
    return out


def main():
    EXT_ICONS.mkdir(parents=True, exist_ok=True)
    master = draw_master(1024)
    for size in SIZES:
        square = master if size == 1024 else master.resize((size, size), Image.LANCZOS)
        path = EXT_ICONS / f"icon-{size}.png"
        rounded(square).save(path)
        print(f"wrote {path.relative_to(ROOT)}")
    master.save(APPICON)
    print(f"wrote {APPICON.relative_to(ROOT)} (square, opaque)")
    master.resize((512, 512), Image.LANCZOS).save(WRAPPER_ICON)
    print(f"wrote {WRAPPER_ICON.relative_to(ROOT)}")
    rounded(master.resize((256, 256), Image.LANCZOS)).save(LARGEICON)
    print(f"wrote {LARGEICON.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
