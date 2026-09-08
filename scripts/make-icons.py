#!/usr/bin/env python3
"""Generate every icon from one drawing: three lines of text, an orange hand-drawn circle around
the middle one, and an Apple Pencil coming in from the bottom right with its tip on the end of
the stroke, still drawing it.

Usage: python3 scripts/make-icons.py
Requires Pillow.

Writes:
  extension/icons/icon-<size>.png                 rounded corners, transparent outside, for Safari's toolbar
  Inkover/Inkover/Assets.xcassets/AppIcon.appiconset/universal-icon-1024@1x.png
                                                   square, opaque, the App Store icon (iOS masks the corners itself)
  Inkover/Inkover/Resources/Icon.png               square, opaque, shown in the wrapper app
  Inkover/Inkover/Assets.xcassets/LargeIcon.imageset/icon-256.png
  assets/icon.png, assets/favicon.png              the public site
"""
import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
EXT_ICONS = ROOT / "extension" / "icons"
APPICON = ROOT / "Inkover" / "Inkover" / "Assets.xcassets" / "AppIcon.appiconset" / "universal-icon-1024@1x.png"
LARGEICON = ROOT / "Inkover" / "Inkover" / "Assets.xcassets" / "LargeIcon.imageset" / "icon-256.png"
WRAPPER_ICON = ROOT / "Inkover" / "Inkover" / "Resources" / "Icon.png"
SITE_ICON = ROOT / "assets" / "icon.png"
FAVICON = ROOT / "assets" / "favicon.png"
SIZES = [48, 64, 96, 128, 256, 512, 1024]

BG_TOP = (44, 44, 46)
BG_BOTTOM = (22, 22, 24)
TEXT = (142, 142, 147)
INK = (255, 149, 0)
PENCIL_BODY = (242, 242, 244)
PENCIL_SHADE = (205, 205, 210)
PENCIL_NIB = (58, 58, 62)
SUPER = 4  # supersampling factor for smooth edges

# The drawing is scaled about the centre and shifted up-left so the Pencil has room in the corner.
SCALE = 0.86
OFFSET = (-0.06, -0.06)
ARC = (-120, 360 + 55)  # degrees; the stroke starts bottom-left and overshoots to end bottom-right, under the tip
PENCIL_ANGLE = 50       # degrees from the tip toward the body; 0 is right, 90 is down
PENCIL_WIDTH = 0.125    # body diameter as a fraction of the icon
PENCIL_LENGTH = 1.2     # runs off the corner


def rot(p, c, a):
    x, y = p[0] - c[0], p[1] - c[1]
    return (c[0] + x * math.cos(a) - y * math.sin(a), c[1] + x * math.sin(a) + y * math.cos(a))


def draw_pencil(img, tip, s):
    """An Apple Pencil with its nib at `tip`, the body running away at PENCIL_ANGLE."""
    a = math.radians(PENCIL_ANGLE)
    w = s * PENCIL_WIDTH
    cone_len = w * 2.1
    nib_len = w * 0.42
    L = s * PENCIL_LENGTH

    def P(x, y):  # local frame: tip at the origin, body along +x
        return rot((tip[0] + x, tip[1] + y), tip, a)

    body = [P(cone_len, -w / 2), P(L, -w / 2), P(L, w / 2), P(cone_len, w / 2)]
    cone = [P(nib_len, -w * 0.11), P(cone_len, -w / 2), P(cone_len, w / 2), P(nib_len, w * 0.11)]
    nib = [P(0, 0), P(nib_len, -w * 0.11), P(nib_len, w * 0.11)]

    # A soft shadow so the Pencil lies on the page rather than floating.
    shadow = Image.new("RGBA", img.size, (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    off = w * 0.18
    for poly in (body, cone):
        sd.polygon([(x + off, y + off * 1.6) for x, y in poly], fill=(0, 0, 0, 120))
    img.alpha_composite(shadow.filter(ImageFilter.GaussianBlur(w * 0.25)))

    layer = Image.new("RGBA", img.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    d.polygon(body, fill=PENCIL_BODY)
    d.polygon([P(cone_len, w * 0.12), P(L, w * 0.12), P(L, w / 2), P(cone_len, w / 2)], fill=PENCIL_SHADE)
    ex, ey = P(L, 0)
    d.ellipse([ex - w / 2, ey - w / 2, ex + w / 2, ey + w / 2], fill=PENCIL_BODY)
    d.polygon(cone, fill=PENCIL_BODY)
    d.polygon([P(nib_len, w * 0.03), P(cone_len, w * 0.12), P(cone_len, w / 2), P(nib_len, w * 0.11)], fill=PENCIL_SHADE)
    d.polygon(nib, fill=PENCIL_NIB)
    d.line([P(cone_len, -w / 2), P(cone_len, w / 2)], fill=(190, 190, 196), width=max(1, round(s * 0.003)))  # the seam where the tip screws on
    img.alpha_composite(layer)


def draw_master(size):
    s = size * SUPER
    img = Image.new("RGBA", (s, s), BG_BOTTOM + (255,))
    d = ImageDraw.Draw(img)

    # Subtle vertical gradient so the square has some depth at large sizes.
    for y in range(s):
        t = y / (s - 1)
        c = tuple(round(BG_TOP[i] + (BG_BOTTOM[i] - BG_TOP[i]) * t) for i in range(3))
        d.line([(0, y), (s, y)], fill=c + (255,))

    def U(v):  # drawing unit to pixels, scaled about the centre
        return s * (0.5 + (v - 0.5) * SCALE)

    ox, oy = OFFSET[0] * s, OFFSET[1] * s

    # Three lines of text, left aligned, like a paragraph.
    line_h = s * 0.075 * SCALE
    x0 = U(0.20) + ox
    widths = [0.60, 0.62, 0.42]
    centers = [0.34, 0.50, 0.66]
    for w, cy in zip(widths, centers):
        y = U(cy) + oy
        d.rounded_rectangle([x0, y - line_h / 2, x0 + s * w * SCALE, y + line_h / 2], radius=line_h / 2, fill=TEXT + (255,))

    # A hand-drawn circle around the middle line: slight tilt, slight wobble, overshoots its start.
    cx, cy = U(0.50) + ox, U(0.50) + oy
    rx, ry = s * 0.36 * SCALE, s * 0.155 * SCALE
    tilt = math.radians(-7)
    stroke = s * 0.052 * SCALE
    pts = []
    start, end = math.radians(ARC[0]), math.radians(ARC[1])
    steps = 240
    for i in range(steps + 1):
        t = start + (end - start) * i / steps
        wobble = 1 + 0.025 * math.sin(t * 3 + 0.8) + 0.012 * math.sin(t * 7)
        px, py = rx * wobble * math.cos(t), ry * wobble * math.sin(t)
        x = cx + px * math.cos(tilt) - py * math.sin(tilt)
        y = cy + px * math.sin(tilt) + py * math.cos(tilt)
        pts.append((x, y))
    d.line(pts, fill=INK + (255,), width=round(stroke), joint="curve")
    r = stroke / 2
    for x, y in (pts[0], pts[-1]):
        d.ellipse([x - r, y - r, x + r, y + r], fill=INK + (255,))

    draw_pencil(img, pts[-1], s)  # the nib sits on the end of the stroke
    return img.convert("RGB").resize((size, size), Image.LANCZOS)


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
    rounded(master.resize((256, 256), Image.LANCZOS)).save(SITE_ICON)
    rounded(master.resize((64, 64), Image.LANCZOS)).save(FAVICON)
    print(f"wrote {SITE_ICON.relative_to(ROOT)}, {FAVICON.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
