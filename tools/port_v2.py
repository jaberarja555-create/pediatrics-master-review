#!/usr/bin/env python3
"""Copy the new Obstetrics app code into this book (owner, 11 Nov 2026: "make Surgery and Pediatrics exactly like Obstetrics").

Reads ../obstetrics-master-review/src/v2.js, v2.search.js, v2.tools.js, v2.lang.js, v2.css, v2.html (or the folder given as the
first argument), applies the book settings in tools/v2book.json and writes the same files into src/. The book's own adapter is
src/v2.book.js (start of the closure) and src/v2.book.post.js (end); its own styles are src/v2.book.css. Re-run after the
Obstetrics app changes, then build with PRR_V2=1."""
import json, pathlib, re, sys
R = pathlib.Path(__file__).resolve().parent.parent
O = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else R.parent / 'obstetrics-master-review' / 'src'
B = json.loads((R / 'tools' / 'v2book.json').read_text())
px, pal = B['prefix'], B['pal']

def common(s):
    for a, b in B['replace']:
        s = s.replace(a, b)
    return s.replace("st('orr-", "st('").replace("'orr-", "'" + px + '-').replace('"orr-', '"' + px + '-')

def js(s):
    s = common(s)
    s = s.replace('window.OBS_INFO', 'window.BOOK_INFO').replace('window.OBS_CFG', 'window.BOOK_CFG')
    s = s.replace("sp('pk')", "sp('page')").replace("sp('pk',", "sp('page',")
    s = s.replace('QST[q.id]', 'qst(q.id)')
    s = s.replace("CH=7;", "CH=BK.osce;")
    s = re.sub(r"function chImg\(n\)\{return 'img/chcov'\+n\+'\.jpg'\}", "function chImg(n){return BK.chImg(n)}", s)
    s = s.replace("src=\"img/v2_cover_'+PAL+'.jpg\"", "src=\"'+BK.cover+'\"")
    s = s.replace("PAL=sp('pal')||'lav'", "PAL=sp('pal')||'" + pal[0] + "'")
    s = s.replace("[['lav','الافتراضي','#9272C6']", "[['" + pal[0] + "','" + pal[1] + "','" + pal[2] + "']")
    s = s.replace("||'#F5F1FC'", "||'" + pal[3] + "'")
    return s

def css(s):
    s = common(s)
    # pictures recoloured per palette exist only for the Obstetrics cover and baby picture
    s = re.sub(r'[^{}]*\{[^{}]*(?:cover5_|v2_fetus_)[^{}]*\}', '', s)
    return s

out = {}
for n in ['v2.js', 'v2.search.js', 'v2.tools.js', 'v2.lang.js']:
    out[n] = js((O / n).read_text())
out['v2.css'] = css((O / 'v2.css').read_text())
out['v2.html'] = common((O / 'v2.html').read_text()).replace('||"lav"', '||"' + pal[0] + '"')
for n, s in out.items():
    left = re.findall(r'.{0,30}(?:Obstetric|obstetric|OBS_|orr-|v2_cover|chcov\d|التوليد).{0,30}', s)
    left = [x for x in left if 'obs_' not in x.lower() or 'OBS_' in x]
    (R / 'src' / n).write_text(s)
    print(n, len(s), 'left:', left[:6])
