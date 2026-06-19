"""Crop images to 1080x1080 square centered on eyes."""
import os
import sys

import cv2
import numpy as np
from PIL import Image


def read_bgr(path):
    data = np.fromfile(path, dtype=np.uint8)
    bgr = cv2.imdecode(data, cv2.IMREAD_COLOR)
    return bgr

TARGET_SIZE = 1080


def get_focus_point(bgr):
    gray = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)
    face_cascade = cv2.CascadeClassifier(
        cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
    )
    eye_cascade = cv2.CascadeClassifier(
        cv2.data.haarcascades + "haarcascade_eye.xml"
    )

    faces = face_cascade.detectMultiScale(gray, scaleFactor=1.08, minNeighbors=5, minSize=(60, 60))
    h, w = gray.shape[:2]

    if len(faces) == 0:
        return w // 2, int(h * 0.38)

    x, y, fw, fh = max(faces, key=lambda f: f[2] * f[3])
    roi_gray = gray[y : y + fh, x : x + fw]
    eyes = eye_cascade.detectMultiScale(roi_gray, scaleFactor=1.05, minNeighbors=4, minSize=(20, 20))

    if len(eyes) >= 2:
        eyes = sorted(eyes, key=lambda e: e[0])[:2]
        centers = [
            (x + ex + ew // 2, y + ey + eh // 2)
            for ex, ey, ew, eh in eyes
        ]
        cx = sum(p[0] for p in centers) // 2
        cy = sum(p[1] for p in centers) // 2
        return cx, cy

    if len(eyes) == 1:
        ex, ey, ew, eh = eyes[0]
        return x + ex + ew // 2, y + ey + eh // 2

    return x + fw // 2, y + int(fh * 0.35)


def crop_square_around_point(img, cx, cy, side):
    w, h = img.size
    half = side // 2
    left = cx - half
    top = cy - half
    right = left + side
    bottom = top + side

    if left < 0:
        right -= left
        left = 0
    if top < 0:
        bottom -= top
        top = 0
    if right > w:
        left -= right - w
        right = w
    if bottom > h:
        top -= bottom - h
        bottom = h

    left = max(0, left)
    top = max(0, top)
    right = min(w, right)
    bottom = min(h, bottom)

    side = min(right - left, bottom - top)
    if side <= 0:
        side = min(w, h)
        left = (w - side) // 2
        top = (h - side) // 2
        right = left + side
        bottom = top + side

    return img.crop((left, top, right, bottom))


def process_image(src_path, dst_path):
    bgr = read_bgr(src_path)
    if bgr is None:
        raise ValueError(f"Cannot read image: {src_path}")

    cx, cy = get_focus_point(bgr)
    img = Image.open(src_path).convert("RGB")
    w, h = img.size
    side = min(w, h)

    cropped = crop_square_around_point(img, cx, cy, side)
    if cropped.size[0] != TARGET_SIZE:
        cropped = cropped.resize((TARGET_SIZE, TARGET_SIZE), Image.Resampling.LANCZOS)

    os.makedirs(os.path.dirname(dst_path), exist_ok=True)
    cropped.save(dst_path, quality=92, optimize=True)
    return cx, cy, cropped.size


def main():
    if len(sys.argv) < 3:
        print("Usage: python crop_eyes_square.py <source_dir> <output_dir>")
        sys.exit(1)

    source_dir = sys.argv[1]
    output_dir = sys.argv[2]
    exts = {".jpg", ".jpeg", ".png", ".webp", ".bmp"}

    files = sorted(
        f for f in os.listdir(source_dir) if os.path.splitext(f)[1].lower() in exts
    )
    if not files:
        print(f"No images found in {source_dir}")
        sys.exit(1)

    print(f"Processing {len(files)} images...")
    for name in files:
        src = os.path.join(source_dir, name)
        dst = os.path.join(output_dir, name)
        cx, cy, size = process_image(src, dst)
        print(f"  OK {name} -> focus=({cx},{cy}) output={size[0]}x{size[1]}")

    print(f"Done. Saved to: {output_dir}")


if __name__ == "__main__":
    main()
