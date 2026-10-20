#!/usr/bin/env python
"""Build the Mekidulu product catalogue PDF from the site's own assets.

Mirrors the data in `lib/site.ts` (line-card products + Amazon listings) and
writes `public/catalog/mekidulu-catalogue-2026.pdf` at A4, 150 dpi.

Usage:  python scripts/build-catalogue.py
"""

import os
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(ROOT, "public", "catalog")
IMG = os.path.join(ROOT, "public", "images")
os.makedirs(OUT_DIR, exist_ok=True)

W, H = 1240, 1754          # A4 @ 150 dpi
M = 90                     # page margin

CANVAS = (250, 247, 242)
INK = (16, 22, 19)
INK_SOFT = (59, 70, 64)
MUTED = (109, 119, 111)
SAND = (242, 236, 226)
LINE = (227, 218, 203)
BRAND = (92, 122, 63)

FONT_DIR = "C:/Windows/Fonts"
def f(name, size):
    return ImageFont.truetype(os.path.join(FONT_DIR, name), size)

F_BOLD = lambda s: f("segoeuib.ttf", s)
F_REG = lambda s: f("segoeui.ttf", s)
F_ITAL = lambda s: f("segoeuii.ttf", s)

PRODUCTS = [
    ("MEKI-8782 · Galaxy View", "Galaxy Series", "73 in · 7 levels · 3 acrylic capsules",
     "$225.00", "MSRP", "product-8782.webp", "Mekidulu 8782 — 73\" multi-capsule wood cat empire"),
    ("MEKI-YN105 · Horizon", "Flagship Choice", "72.1 in · 8 levels · 12 sisal pillars",
     "$180.00", "MSRP", "product-yn105.webp", "Mekidulu 72\" modern wood cat tree — Horizon series"),
    ("MEKI-Y18 · Emerald Forest", "Emerald Series", "59 in · 6 levels · botanical green accents",
     "$145.00", "MSRP", "product-y18.webp", "Mekidulu Y18 — 59\" modern wood cat tower"),
]

AMAZON = [
    ("155 cm cat tree with hammock and two capsules", "155 cm", "B0DBHM9WWY", "b0dbhm9wwy.webp"),
    ("170 cm tower for large adult cats", "170 cm", "B0DGQ2W9Q8", "b0dgq2w9q8.webp"),
    ("173 cm XXL cat tree with 13 scratching posts", "173 cm", "B0F1CWZMNP", "b0f1cwzmnp.webp"),
    ("183 cm cat tree with four space capsules", "183 cm", "B0F6NGPFM3", "b0f6ngpfm3.webp"),
    ("193 cm cat tree with ladder and den", "193 cm", "B0F6NQZQ16", "b0f6nqzq16.webp"),
    ("165 cm eight-tier scratching post with house", "165 cm", "B0CCV7PWW4", "b0ccv7pww4.webp"),
    ("145 cm multi-level condo with two bowls", "145 cm", "B0D1G6MQYY", "b0d1g6mqyy.webp"),
    ("150 cm cat tower with house and capsule", "150 cm", "B0CB13M77W", "b0cb13m77w.webp"),
    ("Ceiling-tensioned cat tree with capsule and hammock", "Ceiling mount", "B0F6NGWMTK", "b0f6ngwmtk.webp"),
    ("Ceiling-tensioned cat tree with capsule and sisal wrap", "Ceiling mount", "B0DG2PXTBK", "b0dg2pxtbk.webp"),
    ("Ceiling-tensioned scratching post, 11 cm sisal", "Ceiling mount", "B0DGLLVQLW", "b0dgllvqlw.webp"),
    ("Floor-to-ceiling cat tree, adjustable height", "Adjustable", "B0DX237Q5X", "b0dx237q5x.webp"),
    ("Adjustable dog stairs, 2–5 steps", "Dog steps", "B0CZ38C7HT", "b0cz38c7ht.webp"),
]


def new_page():
    page = Image.new("RGB", (W, H), CANVAS)
    return page, ImageDraw.Draw(page)


def wrap(draw, text, font, max_width):
    words, lines, current = text.split(), [], ""
    for word in words:
        candidate = f"{current} {word}".strip()
        if draw.textlength(candidate, font=font) <= max_width:
            current = candidate
        else:
            if current:
                lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines


def draw_paragraph(draw, xy, text, font, fill, max_width, leading=None):
    x, y = xy
    leading = leading or int(font.size * 1.45)
    for line in wrap(draw, text, font, max_width):
        draw.text((x, y), line, font=font, fill=fill)
        y += leading
    return y


def footer(draw, page_no, label="mekidulu.com"):
    draw.line((M, H - 150, W - M, H - 150), fill=LINE, width=2)
    draw.text((M, H - 120), label, font=F_REG(20), fill=MUTED)
    num = f"{page_no:02d}"
    draw.text((W - M - draw.textlength(num, font=F_REG(20)), H - 120), num,
              font=F_REG(20), fill=MUTED)


def paste_contain(page, image_path, box, padding=40, background=SAND):
    """Place an image centred inside box, letterboxed on a sand panel."""
    x0, y0, x1, y1 = box
    ImageDraw.Draw(page).rounded_rectangle(box, radius=28, fill=background)
    img = Image.open(image_path).convert("RGB")
    avail_w, avail_h = (x1 - x0) - padding * 2, (y1 - y0) - padding * 2
    scale = min(avail_w / img.width, avail_h / img.height)
    img = img.resize((max(1, int(img.width * scale)), max(1, int(img.height * scale))),
                     Image.LANCZOS)
    page.paste(img, (x0 + (x1 - x0 - img.width) // 2, y0 + (y1 - y0 - img.height) // 2))


def paste_cover(page, image_path, box, radius=28):
    """Fill the box with a centre-cropped image and rounded corners."""
    x0, y0, x1, y1 = box
    width, height = x1 - x0, y1 - y0
    img = Image.open(image_path).convert("RGB")
    scale = max(width / img.width, height / img.height)
    img = img.resize((max(width, int(img.width * scale)), max(height, int(img.height * scale))),
                     Image.LANCZOS)
    left = (img.width - width) // 2
    top = (img.height - height) // 2
    img = img.crop((left, top, left + width, top + height))

    mask = Image.new("L", (width, height), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, width, height), radius=radius, fill=255)
    page.paste(img, (x0, y0), mask)


def cover():
    page, draw = new_page()
    logo = Image.open(os.path.join(IMG, "logo.png")).convert("RGBA")
    logo.thumbnail((110, 110), Image.LANCZOS)
    page.paste(logo, (M, M - 10), logo)

    draw.text((M + 130, M + 4), "MEKIDULU", font=F_BOLD(34), fill=INK)
    draw.text((M + 132, M + 48), "HEAVY-DUTY CAT TREES", font=F_REG(16), fill=MUTED)

    draw.text((M, 330), "PRODUCT", font=F_BOLD(96), fill=INK)
    draw.text((M, 430), "CATALOGUE", font=F_BOLD(96), fill=BRAND)
    draw.text((M, 560), "2026", font=F_BOLD(40), fill=INK_SOFT)

    draw_paragraph(draw, (M, 640),
                   "FAS-grade birch cat furniture engineered for multi-cat households. "
                   "Low MOQ, ready-to-ship cartons, dropshipping and OEM/ODM programs.",
                   F_REG(26), INK_SOFT, 620)

    paste_cover(page, os.path.join(IMG, "hero-banner-01.webp"),
                (M, 800, W - M, H - 300), radius=28)

    draw.text((M, H - 250), "Factory-direct  ·  Ships worldwide  ·  OEM / ODM",
              font=F_BOLD(22), fill=BRAND)
    draw.text((M, H - 200), "www.mekidulu.com", font=F_REG(24), fill=INK)
    return page


def spec_page():
    page, draw = new_page()
    draw.text((M, M), "ENGINEERING", font=F_BOLD(18), fill=BRAND)
    draw.text((M, M + 40), "Heavy-duty is a measurement.", font=F_BOLD(56), fill=INK)

    specs = [
        ("25 mm", "reinforced base plate"),
        ("10 × 10 cm", "solid birch core columns"),
        ("FAS", "grade birch plywood"),
        ("Included", "anti-topple wall anchor"),
    ]
    y = 330
    for value, label in specs:
        draw.text((M, y), value, font=F_BOLD(56), fill=INK)
        draw.text((M, y + 70), label, font=F_REG(24), fill=MUTED)
        draw.line((M, y + 130, W - M, y + 130), fill=LINE, width=2)
        y += 180

    paste_contain(page, os.path.join(IMG, "factory.webp"),
                  (M, y + 10, W - M, y + 10 + 470))

    draw_paragraph(draw, (M, y + 520),
                   "Direct from our production line in China. Every model ships with an "
                   "illustrated assembly sheet, a hardware kit and a wall anchor.",
                   F_REG(22), INK_SOFT, W - M * 2)
    footer(draw, 2)
    return page


def product_page(index, title, badge, spec, price, price_note, filename, alt, page_no):
    page, draw = new_page()
    draw.text((M, M), "MEKIDULU", font=F_BOLD(20), fill=INK)
    draw.text((W - M - draw.textlength(badge.upper(), font=F_REG(18)), M + 2),
              badge.upper(), font=F_REG(18), fill=BRAND)

    paste_contain(page, os.path.join(IMG, filename), (M, 190, W - M, 990))

    draw.text((M, 1060), f"{index:02d}", font=F_BOLD(30), fill=BRAND)
    y = 1110
    for line in wrap(draw, title, F_BOLD(42), W - M * 2)[:2]:
        draw.text((M, y), line, font=F_BOLD(42), fill=INK)
        y += 54
    y += 10
    draw.text((M, y), spec, font=F_REG(24), fill=MUTED)
    y += 60

    draw.text((M, y), price, font=F_BOLD(52), fill=INK)
    draw.text((M + draw.textlength(price, font=F_BOLD(52)) + 16, y + 18),
              price_note.upper(), font=F_BOLD(18), fill=MUTED)

    draw_paragraph(draw, (M, y + 110), alt, F_REG(20), INK_SOFT, W - M * 2)
    footer(draw, page_no)
    return page


def back_page(page_no):
    page, draw = new_page()
    draw.text((M, M), "WHERE TO BUY", font=F_BOLD(18), fill=BRAND)
    draw.text((M, M + 40), "Amazon · Walmart · Cdiscount", font=F_BOLD(46), fill=INK)

    markets = [
        ("Amazon US", "amazon.com"),
        ("Amazon UK", "amazon.co.uk"),
        ("Amazon JP", "amazon.co.jp"),
        ("Amazon DE / FR", "amazon.de · amazon.fr"),
        ("Walmart", "walmart.com"),
        ("Cdiscount", "cdiscount.com"),
    ]
    y = 260
    for name, host in markets:
        draw.text((M, y), name, font=F_REG(28), fill=INK)
        draw.text((W - M - draw.textlength(host, font=F_REG(24)), y + 4), host,
                  font=F_REG(24), fill=MUTED)
        draw.line((M, y + 52, W - M, y + 52), fill=LINE, width=2)
        y += 92

    y += 50
    draw.text((M, y), "WHOLESALE", font=F_BOLD(18), fill=BRAND)
    draw_paragraph(draw, (M, y + 40),
                   "Low MOQ · ready stock · dropshipping supported · OEM/ODM. "
                   "Request pricing at www.mekidulu.com/wholesale",
                   F_REG(25), INK_SOFT, W - M * 2)

    y += 200
    draw.text((M, y), "SUPPORT", font=F_BOLD(18), fill=BRAND)
    draw_paragraph(draw, (M, y + 40),
                   "Assembly sheets for every model: www.mekidulu.com/manuals\n"
                   "All product data, images and this catalogue: www.mekidulu.com",
                   F_REG(25), INK_SOFT, W - M * 2)

    footer(draw, page_no)
    return page


def main():
    pages = [cover(), spec_page()]

    index = 1
    for title, badge, spec, price, note, filename, alt in PRODUCTS:
        pages.append(product_page(index, title, badge, spec, price, note, filename, alt, len(pages) + 1))
        index += 1

    for title, badge, asin, filename in AMAZON:
        pages.append(product_page(index, title, badge, "Amazon listing · " + asin,
                                  "Marketplace", "price", os.path.join("amazon", filename),
                                  "Available on Amazon US, UK, DE and FR marketplaces.",
                                  len(pages) + 1))
        index += 1

    pages.append(back_page(len(pages) + 1))

    out = os.path.join(OUT_DIR, "mekidulu-catalogue-2026.pdf")
    pages[0].save(out, "PDF", resolution=150.0, save_all=True, append_images=pages[1:])
    size_mb = os.path.getsize(out) / (1024 * 1024)
    print(f"pages={len(pages)} size={size_mb:.1f} MB -> {out}")

    pages[0].save(os.path.join(OUT_DIR, "preview-cover.png"))
    pages[3].save(os.path.join(OUT_DIR, "preview-product.png"))


if __name__ == "__main__":
    main()
