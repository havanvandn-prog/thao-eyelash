#!/usr/bin/env python3
"""Convert & resize images to WebP quality 70 for Thao Eyelash landing page."""
from __future__ import annotations

import json
import os
import re
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets" / "images"
QUALITY = 70
MANIFEST: list[dict] = []


def save_webp(im: Image.Image, out: Path) -> int:
    out.parent.mkdir(parents=True, exist_ok=True)
    if im.mode not in ("RGB", "RGBA"):
        im = im.convert("RGBA" if "A" in im.getbands() else "RGB")
    im.save(out, "WEBP", quality=QUALITY, method=6)
    return out.stat().st_size


def resize_max(im: Image.Image, max_w: int | None = None, max_h: int | None = None) -> Image.Image:
    im = im.copy()
    w, h = im.size
    if max_w and max_h:
        im.thumbnail((max_w, max_h), Image.LANCZOS)
    elif max_w:
        if w > max_w:
            nh = round(h * max_w / w)
            im = im.resize((max_w, nh), Image.LANCZOS)
    elif max_h:
        if h > max_h:
            nw = round(w * max_h / h)
            im = im.resize((nw, max_h), Image.LANCZOS)
    return im


def convert(src: Path, out: Path, *, max_w: int | None = None, max_h: int | None = None) -> None:
    if not src.exists():
        print(f"SKIP missing: {src}")
        return
    orig = src.stat().st_size
    im = Image.open(src)
    im = resize_max(im, max_w=max_w, max_h=max_h)
    size = save_webp(im, out)
    MANIFEST.append(
        {
            "src": str(src.relative_to(ROOT)).replace("\\", "/"),
            "out": str(out.relative_to(ROOT)).replace("\\", "/"),
            "orig_kb": round(orig / 1024),
            "webp_kb": round(size / 1024),
        }
    )
    print(f"OK {out.name}: {orig // 1024}KB -> {size // 1024}KB ({im.size[0]}x{im.size[1]})")


def main() -> None:
    # Hero
    convert(ASSETS / "nhan vat hero section new.webp", ASSETS / "nhan-vat-hero-desktop.webp", max_w=900)
    convert(ASSETS / "nhan-vat-mobile-2.webp", ASSETS / "nhan-vat-mobile-2.webp", max_w=750)

    # Services carousel (square 720)
    services = ASSETS / "services"
    for name in [
        "classic.jpg",
        "classic-design.jpg",
        "anime.jpg",
        "hybrid.jpg",
        "volume-megavolume.jpg",
        "fox-eye.jpg",
        "wispy.jpg",
    ]:
        stem = Path(name).stem
        convert(services / name, services / f"{stem}.webp", max_w=720, max_h=720)

    # Lash lift / brow compare
    for name in [
        "lash-lift-before.png",
        "lash-lift-after.png",
        "brow-lamination-before.png",
        "brow-lamination-after.png",
    ]:
        stem = Path(name).stem
        convert(services / name, services / f"{stem}.webp", max_w=800)

    # Why choose + reviews map
    convert(ASSETS / "why-choose-lash.png", ASSETS / "why-choose-lash.webp", max_w=800)
    convert(ASSETS / "reviews-google-maps.png", ASSETS / "reviews-google-maps.webp", max_w=606, max_h=570)

    # Logo (small icons stay PNG for crispness)
    convert(ASSETS / "logo.png", ASSETS / "logo.webp", max_w=400)
    convert(ASSETS / "logo trang.png", ASSETS / "logo-trang.webp", max_w=400)

    # Gallery — paths from script.js
    script = (ROOT / "script.js").read_text(encoding="utf-8")
    gallery_paths = re.findall(r'"assets/images/carosel san pham/[^"]+\.jpg"', script)
    for quoted in gallery_paths:
        rel = quoted.strip('"')
        src = ROOT / rel
        out = src.with_suffix(".webp")
        convert(src, out, max_h=800)

    # Google review photos (optional small set)
    reviews_data = ROOT / "reviews-data.js"
    if reviews_data.exists():
        for m in re.finditer(r'"assets/images/google-reviews/[^"]+\.(jpg|jpeg|png)"', reviews_data.read_text(encoding="utf-8")):
            rel = m.group(0).strip('"')
            src = ROOT / rel
            out = src.with_suffix(".webp")
            convert(src, out, max_w=800, max_h=800)

    total_orig = sum(x["orig_kb"] for x in MANIFEST)
    total_webp = sum(x["webp_kb"] for x in MANIFEST)
    print(f"\nDone: {len(MANIFEST)} files | {total_orig}KB -> {total_webp}KB (-{100 - round(100 * total_webp / max(total_orig, 1))}%)")

    manifest_path = ROOT / "scripts" / "optimize-manifest.json"
    manifest_path.write_text(json.dumps(MANIFEST, indent=2), encoding="utf-8")


if __name__ == "__main__":
    main()
