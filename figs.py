"""Helper for the owner's photo layout rule: photos sit in a centred 'figure strip' after the section they
illustrate, never inside text columns. Row height is chosen so the strip always fits the main column."""
import re
from PIL import Image
MAIN_W = 524  # usable main-column width in px

def fig(items, h=170, contain=()):
    """items: list of (src, alt, caption_html). Returns figrow markup sized to fit MAIN_W."""
    ratios = []
    for src, *_ in items:
        w, hh = Image.open('content/' + src).size
        ratios.append(w / hh)
    gap = 10 * (len(items) - 1) + 2 * len(items)
    h = int(min(h, (MAIN_W - gap) / sum(max(r, 188 / h) for r in ratios)))
    out = [f'<div class="figrow" style="--h:{h}px">']
    for (src, alt, cap), r in zip(items, ratios):
        cls = ' class="fit"' if src in contain else ''
        out.append(f'<figure class="fp" style="width:{max(int(h * r) + 2, 190)}px"><img{cls} src="{src}" alt="{alt}">'
                   + (f'<figcaption>{cap}</figcaption>' if cap else '') + '</figure>')
    out.append('</div>\n')
    return '\n'.join(out)

PHOTO_RE = re.compile(r'<div class="photo"[^>]*><img src="([^"]+)" alt="([^"]*)"[^>]*></?(?:div class="cap">(.*?)</div></div|div)>', re.S)

def photo(html, src):
    """Return (src, alt, caption) for the legacy photo block that shows `src`."""
    for m in PHOTO_RE.finditer(html):
        if m.group(1) == src:
            return (m.group(1), m.group(2), m.group(3) or '')
    raise KeyError(src)

FIGROW_RE = re.compile(r'<div class="figrow" style="--h:\d+px">\n(.*?)</div>\n', re.S)
FP_RE = re.compile(r'<figure class="fp"[^>]*><img( class="fit")? src="([^"]+)" alt="([^"]*)">(?:<figcaption>(.*?)</figcaption>)?</figure>', re.S)

def resize(path, src, h):
    """Rebuild the figure strip that contains `src` at row height h."""
    s = open(path).read()
    for m in FIGROW_RE.finditer(s):
        if f'src="{src}"' in m.group(1):
            items, contain = [], []
            for f in FP_RE.finditer(m.group(1)):
                items.append((f.group(2), f.group(3), f.group(4) or ''))
                if f.group(1): contain.append(f.group(2))
            s = s[:m.start()] + fig(items, h=h, contain=tuple(contain)) + s[m.end():]
            open(path, 'w').write(s)
            return
    raise KeyError(src)
