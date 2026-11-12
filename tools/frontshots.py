#!/usr/bin/env python3
"""build/fp/<name>.png (tools/frontshots.js) → content/img/ab_<name>.jpg (the poster the About tile opens) and abt_<name>.jpg (its thumbnail).
The edition page also holds the copyright, so it is copied as ab_rights.jpg for the «حقوق النشر» row.
A poster sent by the owner (shown as a whole page) is not overwritten: frontshots.js skips those pages."""
import pathlib, shutil
from PIL import Image
R = pathlib.Path(__file__).resolve().parent.parent
for f in sorted((R / 'build' / 'fp').glob('*.png')):
    im = Image.open(f).convert('RGB')
    k = f.stem
    im.save(R / 'content' / 'img' / f'ab_{k}.jpg', quality=84, optimize=True, progressive=True)
    w, h = im.size
    im.crop((0, 0, w, w * 2 // 3)).resize((480, 320), Image.LANCZOS).save(R / 'content' / 'img' / f'abt_{k}.jpg', quality=82, optimize=True)
    print(k, im.size)
e = R / 'content' / 'img' / 'ab_edition.jpg'
if e.exists():
    shutil.copy(e, R / 'content' / 'img' / 'ab_rights.jpg')
