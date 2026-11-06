#!/usr/bin/env python3
"""Build the Pediatrics Master Review app into docs/ (one index.html + img/).

Content lives in content/:
  book.json            book details, chapters (colour) and topic list
  topics/<id>.html     one file per topic: <page sub="..."> ... <aside> side column </aside></page>
  decks/<id>.json      flashcards: [[section, question, answer], ...]
A topic without a topics/<id>.html file is listed in Contents as "coming soon".
"""
import hashlib, html, json, os, re, shutil
from pathlib import Path

ROOT = Path(__file__).parent
SRC, CONTENT = ROOT / 'src', ROOT / 'content'
OUT = Path(os.environ['SRR_OUT']) if os.environ.get('SRR_OUT') else ROOT / 'docs'  # SRR_OUT: private build dir (parallel work)

ICON = ('<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" '
        'stroke-linejoin="round"><path d="M3 21l7.5-7.5"/><path d="M10.5 13.5L20 4c1 1 1 3-.5 4.5L13 15z"/></svg>')
ECG = ('<svg class="ecgmini" viewBox="0 0 90 12"><path d="M0 6 C8 1,14 11,22 6 S36 1,44 6 S58 11,66 6 S80 1,88 6" '
       'fill="none" stroke="var(--ch)" stroke-width="1.4"/><circle cx="88" cy="6" r="2" fill="var(--ch)"/></svg>')
LAYOUT_FILE = Path(__file__).parent / 'content' / 'layout.json'  # page plan made by paginate.js
LAYOUT = json.loads(LAYOUT_FILE.read_text()) if LAYOUT_FILE.exists() else {}
MEASURE = bool(os.environ.get('SRR_MEASURE'))
COLW_FILE = Path(__file__).parent / 'content' / 'colw.json'   # column widths of split tables, measured by paginate.js
COLW = json.loads(COLW_FILE.read_text()) if COLW_FILE.exists() else {}
MTK = {}  # table key -> the whole table (measured for its column widths)
RR_COL_UNITS = 37  # rough height budget of one rapid-review column, checked by check.py


def mix(hex_, other, t):
    a = [int(hex_[i:i + 2], 16) for i in (1, 3, 5)]
    b = [int(other[i:i + 2], 16) for i in (1, 3, 5)]
    return '#' + ''.join('%02x' % round(x + (y - x) * t) for x, y in zip(a, b))


def chapter_css(no, c):
    """Every chapter gets its own shade; tints are mixed from one base colour."""
    w, k = '#ffffff', '#000000'
    v = dict(ch=c, dark=mix(c, k, .45), mid=mix(c, w, .35), tint=mix(c, w, .88), tint2=mix(c, w, .95),
             line=mix(c, w, .78), line2=mix(c, w, .89), wash=mix(c, w, .975), hdr=mix(c, w, .8))
    return (f'.page.c{no}{{--ch:{v["ch"]};--ch-dark:{v["dark"]};--ch-mid:{v["mid"]};--ch-tint:{v["tint"]};'
            f'--ch-tint-2:{v["tint2"]};--ch-line:{v["line"]};--ch-line2:{v["line2"]};--ch-wash:{v["wash"]};--hdr-topic:{v["hdr"]}}}\n'
            f'.tp.ch{no},.hch.ch{no} summary{{background:linear-gradient(135deg,{v["dark"]} 0,{v["ch"]} 100%)}}\n'
            f'.hch.ch{no} .htp .tn{{color:{v["ch"]}}}\n'
            f'.trow.c{no} .n{{background:{v["ch"]}}}\n'
            f'.qx{no}{{--qc:{v["ch"]};--qd:{v["dark"]}}}\n'
            f'.lc{no}{{--ch:{v["ch"]}}}\n'
            f'.tabs .tb.c{no}{{--t:{v["ch"]};--tt:{v["tint"]}}}\n'
            f'.toc .row.c{no},.toc .cc.c{no},.toc .tch.c{no}{{--ch:{v["ch"]};--ch-tint:{v["tint"]};--ch-dark:{v["dark"]};--ch-line:{v["line"]};--ch-wash:{v["tint2"]}}}\n'
            f'.toc .part.c{no}{{color:{v["ch"]}}}.toc .part.c{no}::after{{background:linear-gradient(90deg,{v["ch"]} 0,{v["tint"]} 100%)}}\n')


def text(s):
    """Plain text of an HTML fragment (for labels and rapid-review rows)."""
    return html.unescape(re.sub(r'<[^>]+>', '', s)).strip()


def footer(book):
    return (f'<div class="ftr"><span><b>{book["subject"]} Master Review</b> · {book["edition"]}</span>{ECG}'
            f'<span>{book["series"]}</span></div>')


def cardify(main):
    """Book look: every top-level h2.s section becomes a boxed card (header bar + body)."""
    cuts = []
    for m in re.finditer(r'<h2 class="s"[^>]*>.*?</h2>', main, re.S):
        before = main[:m.start()]
        if before.count('<div') - before.count('</div>') == 0:
            cuts.append(m)
    if not cuts:
        return main
    out = [main[:cuts[0].start()]]
    for i, m in enumerate(cuts):
        end = cuts[i + 1].start() if i + 1 < len(cuts) else len(main)
        title = re.sub(r'^<h2 class="s"[^>]*>|</h2>$', '', m.group(0))
        out.append(f'<div class="card"><div class="cardh">{title}</div><div class="cardb">{main[m.end():end].strip()}</div></div>\n')
    return ''.join(out)


def tabs(book, ch, pno):
    """Thumb-index tabs on the outer page edge: one per chapter, the current one highlighted."""
    cells = ''.join(f'<span class="tb c{c["no"]}{" on" if c["no"] == ch["no"] else ""}">{c.get("tab", c["short"])}</span>'
                    for c in book['chapters'])
    return f'<div class="tabs{" left" if pno % 2 == 0 else ""}">{cells}</div>'



def split_sections(main):
    """(intro, [(title, body), ...]) from a page's main column: top-level h2.s headings start sections."""
    cuts = [m for m in re.finditer(r'<h2 class="s"[^>]*>(.*?)</h2>', main, re.S)
            if main[:m.start()].count('<div') == main[:m.start()].count('</div>')]
    if not cuts:
        return main.strip(), []
    intro = main[:cuts[0].start()].strip()
    secs = [(m.group(1), main[m.end():(cuts[i + 1].start() if i + 1 < len(cuts) else len(main))].strip())
            for i, m in enumerate(cuts)]
    if not intro and text(secs[0][0]).lower() == 'definition' and secs[0][1].startswith('<p'):
        intro, secs = secs[0][1], secs[1:]
    return intro, secs


def is_wide(body):
    if body.startswith('<div class="photo">') and body.count('<img') == 1:
        return False  # a single photo box sits beside another box
    first_row = re.search(r'<tr>(.*?)</tr>', body, re.S)
    cols = len(re.findall(r'<t[hd][ >]', first_row.group(1))) if first_row else 0
    # owner (Nov 2026): no cramped half-width boxes; a box goes beside another only when it is short and simple
    n = len(text(body))
    return (cols >= 3 or n > 420 or (n > 220 and ('<table' in body or body.count('<li') > 3)) or '<ul' in body and '<table' in body or
            any(k in body for k in ('class="photos"', 'class="fig"', 'class="two"', 'class="ladder"')))


def auto_mosaic(main):
    """Old two-column page → atoms: ('raw', html) blocks and ('box', html, wide) section boxes."""
    intro, secs = split_sections(main)
    intro = re.sub(r'^<p[^>]*>', '<p class="lead">', intro) if intro.startswith('<p') else intro
    atoms = [('raw', b, True) for b in (top_blocks(intro) or ([intro] if intro.strip() else []))]
    for title, body in secs:
        wide = is_wide(body)
        parts = split_box(body) if wide and not os.environ.get('SRR_NOSPLIT') else [body]
        atoms.append(('box', f'<div class="mb"><div class="mh"># {title}</div><div class="mc">{parts[0]}</div></div>', wide))
        for part in parts[1:]:  # owner (Nov 2026): a long box may continue on the next page instead of leaving a gap
            atoms.append(('cbox', f'<div class="mb mcont" data-h="{html.escape(text(title))}"><div class="mc">{part}</div></div>', True))
    return atoms


VOID = {'br', 'img', 'hr', 'input', 'wbr', 'col', 'source'}


def top_level(body):
    """Top-level pieces of an HTML fragment (text before an element joins it); None if the markup is unbalanced."""
    out, depth, start = [], 0, 0
    for m in re.finditer(r'<(/?)([a-zA-Z][a-zA-Z0-9]*)\b[^>]*?(/?)>', body):
        tag = m.group(2).lower()
        if tag in VOID or m.group(3):
            if depth == 0:
                out.append(body[start:m.end()]); start = m.end()
            continue
        if m.group(1):
            depth -= 1
            if depth < 0:
                return None
            if depth == 0:
                out.append(body[start:m.end()]); start = m.end()
        else:
            depth += 1
    if depth:
        return None
    if body[start:].strip():
        out.append(body[start:])
    return out


def split_box(body, rows_per=1, min_chars=50):
    """Pieces of a long box body that may fall on different pages: top-level blocks; long tables and lists in row groups."""
    if len(text(body)) < 300:
        return [body]
    tops = top_level(body)
    if not tops or ''.join(tops).strip() != body.strip():
        return [body]
    # owner (pediatrics): a two-column block of bullet lists becomes one full-width list, so it can continue on the next page
    flat = []
    for t in tops:
        dm = re.match(r'\s*<div class="two"[^>]*>(.*)</div>\s*$', t, re.S)
        cols = top_level(dm.group(1)) if dm else None
        if cols:
            cols = [c.strip() for c in cols if c.strip()]
            cols = [re.sub(r'^<div>(.*)</div>$', r'\1', c, flags=re.S).strip() for c in cols]
            if len(cols) == 2 and all(re.match(r'<ul class="b"[^>]*>.*</ul>$', c, re.S) and top_level(c) == [c] for c in cols):
                lis = ''.join(re.sub(r'^<ul class="b"[^>]*>|</ul>$', '', c) for c in cols)
                flat.append(f'<ul class="b">{lis}</ul>'); continue
            ph = [c for c in cols if c.startswith('<div class="photo') and '<ul' not in c] if len(cols) == 2 else []
            tx = [c for c in cols if c not in ph]
            if len(ph) == 1 and len(tx) == 1 and re.match(r'<ul class="b"[^>]*>.*</ul>$', tx[0], re.S) and top_level(tx[0]) == [tx[0]]:
                lis = [x for x in (top_level(re.sub(r'^<ul class="b"[^>]*>|</ul>$', '', tx[0])) or []) if x.strip()]
                if len(lis) >= 5 and all(x.strip().startswith('<li') for x in lis):
                    # owner (pediatrics): the picture keeps the first lines beside it; the rest of the list continues full width
                    n = (len(lis) + 1) // 2
                    open_two = re.match(r'\s*(<div class="two"[^>]*>)', t).group(1)
                    left = cols[0] is ph[0]
                    ul1 = '<ul class="b" style="margin:0">' + ''.join(lis[:n]) + '</ul>'
                    flat.append(open_two + (ph[0] + ul1 if left else ul1 + ph[0]) + '</div>')
                    flat.append('<ul class="b">' + ''.join(lis[n:]) + '</ul>'); continue
            if len(cols) == 2 and not any(k in dm.group(1) for k in ('class="photo', '<img', '<svg', 'class="fig')):
                # two different blocks side by side (no picture): stacked full width, so each can continue on the next page
                for c in cols:
                    sub = top_level(c) or [c]
                    flat.extend(re.sub(r'(<(?:ul|table|ol)\b[^>]*?) style="margin:0"', r'\1', x) for x in sub if x.strip())
                continue
        flat.append(t)
    # a list whose every line is "Label: sub-list" reads better (and breaks better) as a two-column table
    flat2 = []
    for t in flat:
        um = re.match(r'\s*<ul class="b"[^>]*>(.*)</ul>\s*$', t, re.S)
        lis = [x.strip() for x in (top_level(um.group(1)) or []) if x.strip()] if um else []
        rows = [re.match(r'<li>\s*<b>([^<]{2,40})</b>\s*:\s*(<ul class="b"[^>]*>.*</ul>)\s*</li>$', x, re.S) for x in lis]
        if len(lis) >= 2 and all(rows):
            flat2.append('<table class="t"><colgroup><col style="width:22%"><col></colgroup><tbody>' + ''.join(
                f'<tr><td class="hl">{r.group(1)}</td><td>{r.group(2)}</td></tr>' for r in rows) + '</tbody></table>')
        else:
            flat2.append(t)
    tops = flat2
    pieces = []
    for t in tops:
        m = re.match(r'\s*(<table\b[^>]*>)(.*)(</table>)\s*$', t, re.S)
        if m and 'rowspan' not in t and '<table' not in m.group(2):
            inner = re.sub(r'</?(thead|tbody)>|<colgroup>.*?</colgroup>', '', m.group(2), flags=re.S)
            trs = re.findall(r'<tr\b.*?</tr>', inner, re.S)
            if trs and ''.join(trs) == re.sub(r'\s+(?=<)', '', inner).strip() or (trs and len(''.join(trs)) > .95 * len(inner.strip())):
                head = [r for r in trs[:1] if '<th' in r and '<td' not in r]
                rows = trs[len(head):]
                if len(rows) >= 2 and len(text(t)) > 2600:   # owner: a table stays whole on one page unless it is too tall for a page
                    # same column widths in every piece, so the pieces line up when they join on one page
                    cells = [[len(text(c)) for c in re.findall(r'<t[hd]\b.*?</t[hd]>', r, re.S)] for r in rows]
                    ncol = max(len(c) for c in cells)
                    if any(len(c) != ncol for c in cells) or 'colspan' in t:
                        pieces.append((None, t)); continue
                    tk = hashlib.md5(t.encode()).hexdigest()[:10]
                    MTK[tk] = t
                    cw = COLW.get(tk)
                    cg = ('<colgroup>' + ''.join(f'<col style="width:{x:.2f}%">' for x in cw) + '</colgroup>') if cw and len(cw) == ncol else ''
                    open_ = m.group(1).replace('<table', f'<table data-tk="{tk}"' + (' style="table-layout:fixed"' if cg else ''), 1)
                    for k in range(0, len(rows), rows_per):
                        grp = rows[k:k + rows_per]
                        if k and len(grp) < min(2, rows_per) and pieces:   # no single orphan row
                            pieces[-1] = (pieces[-1][0], pieces[-1][1].replace('</tbody>', ''.join(grp) + '</tbody>')); continue
                        hd = ''.join(head) if not k else ''.join(r.replace('<tr', '<tr class="rh"', 1) for r in head)
                        pieces.append((tk, f'{open_}{cg}<thead>{hd}</thead><tbody>{"".join(grp)}</tbody>{m.group(3)}'))
                    continue
        om = re.match(r'\s*<ol class="steps"[^>]*>(.*)</ol>\s*$', t, re.S)
        if om:   # numbered steps may continue on the next page; the numbering goes on (counter-reset)
            lis = [x for x in (top_level(om.group(1)) or []) if x.strip()]
            if len(lis) >= 3 and all(x.strip().startswith('<li') for x in lis):
                tk = 'ol' + hashlib.md5(t.encode()).hexdigest()[:8]
                for k in range(0, len(lis), 2):
                    pieces.append((tk, f'<ol class="steps" style="counter-reset:s {k}">' + ''.join(lis[k:k + 2]) + '</ol>'))
                continue
        lm = re.match(r'\s*(<ul class="b"[^>]*>)(.*)(</ul>)\s*$', t, re.S)
        if lm:   # owner (pediatrics): a long bullet list may continue on the next page, in groups of 3 lines
            lis = top_level(lm.group(2))
            if lis and all(x.strip().startswith('<li') for x in lis if x.strip()) and len([x for x in lis if x.strip()]) >= 2:
                lis = [x for x in lis if x.strip()]
                tk = 'ul' + hashlib.md5(t.encode()).hexdigest()[:8]
                for k in range(0, len(lis), 2):
                    grp = lis[k:k + 2]
                    if False:
                        pass
                    pieces.append((tk, lm.group(1) + ''.join(grp) + '</ul>'))
                continue
        pieces.append((None, t))
    # a page may break between row groups of a table or list, and between the blocks of a box (owner: fill the page);
    # never before a picture, and never right after a short lead-in line (it stays with what it introduces)
    def lead_in(pc):
        return pc.lstrip().startswith(('<p', '<b', '<div class="small"'))   # owner: a paragraph always stays with the table or list it introduces
    merged = []
    for k, (tk, pc) in enumerate(pieces):
        prev = pieces[k - 1] if k else None
        brk = merged and len(text(merged[-1])) >= min_chars and (
            (tk and prev[0] == tk) or
            (not pc.lstrip().startswith('<div class="photo') and 'class="photo' not in prev[1][:40] and not lead_in(prev[1])))
        if merged and not brk:
            merged[-1] += pc
        else:
            merged.append(pc)
    if len(merged) > 1 and len(text(merged[-1])) < 120:
        last = merged.pop(); merged[-1] += last
    return merged


def exam_parts(side, ex):
    """Collect a page's exam material (formula, numbers, clue switch, try it) into the topic's exam dict."""
    ex['formula'] += re.findall(r'<div class="formula">.*?</div></div>', side, re.S)
    ex['numbers'] += re.findall(r'<tr>.*?</tr>', ''.join(re.findall(r'<table class="numt">(.*?)</table>', side, re.S)), re.S)
    # key numbers kept only for the Rapid Review (rewritten chapters keep their numbers in the text): <table class="rvnums"> in the aside
    ex.setdefault('rvnums', [])
    ex['rvnums'] += re.findall(r'<tr>.*?</tr>', ''.join(re.findall(r'<table class="rvnums">(.*?)</table>', side, re.S)), re.S)
    ex['clues'] += re.findall(r'<div class="r">.*?</div>', side, re.S)
    ex['try'] += re.findall(r'<div class="try">.*?</div></div>', side, re.S)


def exam_rows(ex, title):
    """One exam section at the end of the topic (owner): key points, numbers, formulas, test yourself."""
    rows = []
    if ex['clues']:
        rows.append(f'<div class="mb keys"><div class="mh">Exam corner · {title}: the detail that flips the answer</div>'
                    f'<div class="mc"><div class="rs">{"".join(ex["clues"])}</div></div></div>')
    left = ''
    if ex['formula']:
        fl = ''.join(f.replace('<div class="formula">', '<div class="formula fl">') for f in ex['formula'])
        left += f'<div class="mb fbox"><div class="mh">Exam formulas</div><div class="mc">{fl}</div></div>'
    if ex['try']:
        qa = ''.join(re.sub(r'<div class="a"><span>ANSWER</span>', '<div class="a">', q).replace('class="try"', 'class="qa"')
                     for q in ex['try'])
        left += f'<div class="mb"><div class="mh">Test yourself</div><div class="mc">{qa}</div></div>'
    right = (f'<div class="mb"><div class="mh">Key numbers</div><div class="mc"><table class="numt">{"".join(ex["numbers"])}</table></div></div>'
             if ex['numbers'] else '')
    if left or right:
        rows.append(f'<div class="mrow"><div class="col">{left}</div><div class="col">{right}</div></div>')
    return rows


def rv_rows(ex):
    """Rapid Review rows of one topic: (clue or question, answer, kind) from Clue switch rows, Formula strips and Try it."""
    rows = []
    for r in ex['clues']:
        m = re.search(r'<div class="r"><span>(.*?)</span><span class="to">(.*?)</span></div>', r, re.S)
        if m:
            rows.append((m.group(1), m.group(2), 'c'))
    for f in ex['formula']:
        parts = re.findall(r'<span class="(c|p|ans)">(.*?)</span>', f, re.S)
        lab = re.search(r'<div class="lab">(.*?)</div>', f, re.S)
        left = ' '.join(h if k != 'p' else f'<i>{h}</i>' for k, h in parts if k != 'ans' and h != '=')
        ans = next((h for k, h in parts if k == 'ans'), '')
        if left and ans:
            rows.append(((f'<b class="rvl">{lab.group(1)}:</b> ' if lab else '') + left, ans, 'c'))
    for q in ex['try']:
        m = re.search(r'<div class="q">(.*?)</div><div class="a"><span>ANSWER</span>(.*?)</div>', q, re.S)
        if m:
            rows.append((m.group(1), m.group(2), 'q'))
    return rows


def chapter_exam(t):
    """Rapid Review block of one topic (owner, Nov 2026): one clear table, clue or question → answer;
    the old per-chapter Exam corner (clue switch, formulas, test yourself) now lives here, at the end of the book."""
    rows = rv_rows(t['_exam'])
    if not rows:
        return []
    clues = [r for r in rows if r[2] == 'c']
    qs = [r for r in rows if r[2] == 'q']
    trs = [f'<tr><td>{a}</td><td>{b}</td></tr>' for a, b, _ in clues]
    nums = []
    for r in t['_exam'].get('rvnums', []) + t['_exam']['numbers']:
        m = re.search(r'<td class="v">(.*?)</td><td>(.*?)</td>', r, re.S)
        if m:
            nums.append(f'<tr class="n"><td>{m.group(2)}</td><td>{m.group(1)}</td></tr>')
    if nums:   # owner: the key numbers of each topic, to remember before the exam
        trs += ['<tr class="rvq"><td colspan="2">Key numbers</td></tr>'] + nums
    if qs:   # owner: answers stay hidden until the student taps the question
        trs += ['<tr class="rvq"><td colspan="2">Test yourself · tap a question to see the answer</td></tr>'] + [f'<tr class="q"><td>{a}</td><td>{b}</td></tr>' for a, b, _ in qs]
    # a block never splits across pages, so a long topic becomes several blocks of about 9 rows (fills pages better)
    # owner (pediatrics): no big gaps, so the pieces are small (3 rows); a sub-heading row stays with the rows under it
    parts, cur = [], []
    for i, r in enumerate(trs):
        cur.append(r)
        if len(cur) >= 2 and 'class="rvq"' not in r and not (i + 1 < len(trs) and len(trs) - i - 1 < 2):
            parts.append(cur); cur = []
    if cur:
        parts.append(cur)
    out = []
    for k, part in enumerate(parts):
        if k == 0:   # owner: one title per topic; the next pieces join on under it (no 'continued' headings)
            out.append((f'<div class="mb rv"><div class="mh"><span class="rvn">{t["no"]}</span>{t["title"]}</div><div class="mc">'
                        f'<table class="rvtab"><thead><tr><th>Clue / question</th><th>Answer</th></tr></thead><tbody>{"".join(part)}</tbody></table></div></div>', True))
        else:
            out.append((f'<div class="mb rv rvc"><div class="mc"><table class="rvtab"><tbody>{"".join(part)}</tbody></table></div></div>', True))
    return out


def top_blocks(body):
    """Split hand-written mosaic HTML into its top-level blocks (rows)."""
    blocks, depth, start = [], 0, 0
    for m in re.finditer(r'<(/?)(div|p|table|ul|ol)\b[^>]*>', body):
        if m.group(1):
            depth -= 1
            if depth == 0:
                blocks.append(body[start:m.end()].strip())
        else:
            if depth == 0:
                start = m.start()
            depth += 1
    return blocks


def mosaic_page(book, ch, sub, body, pno, pid, orig='', t=None):
    """New book layout (owner, Oct 2026): full-width rows of coloured boxes, written directly in the topic file
    as <page sub="..." layout="mosaic"> with .mrow rows and .mb boxes."""
    m = re.match(r'<div class="vj" style="--vj:(\d+)px"></div>', body)
    vj = f' vjs" style="--vj:{m.group(1)}px' if m else ''
    body = body[m.end():] if m else body
    return (f'<section class="page mz c{ch["no"]}" id="p{pno}" data-id="{pid}" data-orig="{orig or pid}">'
            # running head (owner, Nov 2026, as in the Pediatrics app): same side on every page, topic named in bold
            f'<div class="mzh"><span>Chapter {ch["no"]} · '
            + (f'<b class="tt">{t["no"]} {t["title"]}</b>' if t and sub != 'Rapid Review' else ch['title']) + '</span>'
            f'<span>{sub}<b>{pno}</b></span></div>'
            f'<div class="body"><div class="main mzm{vj}">'
            f'{body}\n</div></div>'
            f'{footer(book)}</section>\n')


def topic_page(book, ch, t, sub, main, side, pno, pid):
    side_html = f'<div class="side">{side}</div>' if side.strip() else ''
    grid = 'grid' if side_html else 'grid wide'
    return (f'<section class="page c{ch["no"]}" id="p{pno}" data-id="{pid}">'
            f'<div class="hdr{" left" if pno % 2 == 0 else ""}"><div class="chap">{ICON}{ch["short"]}</div>'
            f'<div class="topic">{t["no"]} · {sub}</div><div class="pno">{pno}</div></div>'
            f'<div class="body"><div class="{grid}"><div class="main">'
            f'<div class="kicker"><span class="num">{t["no"]}</span>{ch["title"]}</div>'
            f'<h1 class="t">{t["title"]}</h1><p class="sub">{sub}</p>\n{cardify(main)}\n</div>{side_html}</div></div>'
            f'{tabs(book, ch, pno)}{footer(book)}</section>\n')


CH_IMG = {1: 'growth_chart', 2: 'sam_oedema', 3: 'neo-jaundice_phototherapy', 4: 'malaria_film', 5: 'gastroenteritis_sunken_eyes',
          6: 'pneumonia_consolidation', 7: 'cyanotic_tof_heart', 8: 'sickle_film'}  # faded picture at the right end of each chapter band in the contents  # faded picture at the right end of each chapter band in the contents
N_CONTENTS = 2
LOGO = ('<svg viewBox="0 0 64 46" aria-hidden="true"><g fill="none" stroke-linecap="round" stroke-linejoin="round">'
        '<path d="M31 41C24 35 14 33 5 34V9C14 8 24 10 31 16" stroke="#fff" stroke-width="3.6"/><path d="M33 41C40 35 50 33 59 34V9C50 8 40 10 33 16" stroke="#fff" stroke-width="3.6"/>'
        '<path d="M31 35C25 30 18 28 11 28.5V4C18 4 25 6 31 11" stroke="#d4a62a" stroke-width="3.2"/><path d="M33 35C39 30 46 28 53 28.5V4C46 4 39 6 33 11" stroke="#d4a62a" stroke-width="3.2"/></g>'
        '<path d="M37 3h6v13l-3-2.6-3 2.6z" fill="#d4a62a"/></svg>')
PARTS = 'I II III IV V'.split()


def chapter_cover(book, ch, pno):
    """Opening page of a chapter (owner, Nov 2026): book title band, chapter number and title, picture
    (content/img/chcover_<no>.jpg), the chapter's topics with their pages, series band."""
    part_no = sum(1 for c in book['chapters'] if c.get('part') and c['no'] <= ch['no'])
    part = next(c['part'] for c in reversed(book['chapters']) if c.get('part') and c['no'] <= ch['no'])
    tops = [t for t in ch['topics'] if t.get('p')]
    rows = ''.join(f'<div class="cvr" data-p="{t["p"]}"><i>{t["no"]}</i><div><b>{t["title"]}</b><span>{t.get("sub", "")}</span></div><em>{t["p"]}</em></div>' for t in tops)
    many = ' many' if len(tops) > 5 else ''   # a long topic list goes in two columns so it fits the page
    return (f'<section class="page chcov c{ch["no"]}{many}" id="p{pno}" data-id="p{pno}">'
            f'<div class="cvtop"><div class="cvlogo"><span>Student Master Note Series</span></div>'
            f'<div class="cvbook"><b>{book["subject"].upper()}</b><span>Master Review</span></div>'
            f'<div class="cvtag">A concise revision guide for medical students · {book["edition"]}</div></div>'
            f'<div class="cvhead"><div class="cvno"><span>Part {PARTS[part_no - 1]} · {part}</span><b>Chapter {ch["no"]}</b></div>'
            f'<h1 class="cvt">{ch["title"]}</h1></div>'
            f'<img class="cvseal" src="img/logo.webp" alt=""><div class="cvimg"><img src="img/chcover_{ch["no"]}.jpg" alt=""></div>'
            f'<div class="cvin"><h3>In this chapter</h3>{rows}</div>'
            f'<div class="cvbot"><span>Pediatrics Master Review</span><i></i><span>{book["edition"]}</span></div></section>\n')


def contents_pages(book, rr_page):
    """Contents (owner, Nov 2026: like the Obstetrics book): one colour band per chapter (chapter no., title, topic count and
    page range, a faded picture), its topics as small boxes three to a row; parts as slim labels; Rapid review at the end."""
    chs = [(ch, [t for t in ch['topics'] if t.get('p')]) for ch in book['chapters']]
    n_topics = sum(len(ch['topics']) for ch, _ in chs)
    written_chs = [k for k, (_, w) in enumerate(chs) if w]
    blocks = []  # (estimated height, html)
    roman = iter('I II III IV V VI'.split())
    for i, (ch, w) in enumerate(chs):
        later = [k for k in written_chs if k > i]
        nxt = chs[later[0]][0].get('_cover', chs[later[0]][1][0]['p']) if later else rr_page
        last, start = nxt - 1, (ch.get('_cover', w[0]['p']) if w else None)
        part = (f'<div class="tpart"><span>Part {next(roman)}</span>{ch["part"]}</div>' if ch.get('part') else '')
        img = CH_IMG.get(ch['no'])
        bg = f'<i class="tbi" style="background-image:url(img/{img}.jpg)"></i>' if img and (CONTENT / 'img' / f'{img}.jpg').exists() else ''
        cells = ''.join(f'<div class="tc" data-p="{t["p"]}"><i>{t["no"]}</i><span>{t["title"]}</span><em>{t["p"]}</em></div>' if t.get('p') else
                        f'<div class="tc soon"><i>{t["no"]}</i><span>{t["title"]}</span><em></em></div>' for t in ch['topics'])
        nt = len(ch['topics'])
        rng = f'p {start}–{last}' if w else 'coming soon'
        dp = f' data-p="{start}"' if w else ''
        html_ = (f'{part}<div class="tch c{ch["no"]}{"" if w else " soon"}"><div class="tbh"{dp}>{bg}<small>Chapter {ch["no"]}</small>'
                 f'<b>{ch["title"]}</b><span class="tpg">{nt} topic{"s" * (nt > 1)} · {rng}</span></div>'
                 f'<div class="tcg">{cells}</div></div>')
        blocks.append((80 + 32 * (-(-nt // 3) - 1) + (26 if part else 0), html_))
    rr = (f'<div class="trr"><div class="tc" data-p="{rr_page}"><i>RR</i><span>Rapid review · every clue → answer, '
          f'key numbers and test-yourself questions, chapter by chapter</span><em>{rr_page}</em></div></div>')
    blocks.append((56, rr))
    run, cut = 0, len(blocks)
    for k, (h, _) in enumerate(blocks):  # fill the first page, the rest go on the second
        if run + h > 960:
            cut = k
            break
        run += h
    halves = [blocks[:cut], blocks[cut:]][:N_CONTENTS]
    out = []
    for n, part in enumerate(halves):
        sub = (f'{len(chs)} chapters · {n_topics} topics · tap any topic' if n == 0 else 'tap any topic')
        out.append(f'<section class="page tocp" id="pc{n}" data-id="contents-{n + 1}">'
                   f'<div class="toc-h"><div><b>Contents</b><span>{sub}</span></div></div>'
                   f'<div class="toc tcv">{"".join(h for _, h in part)}</div>{footer(book)}</section>\n')
    return out


def abbr_pages(book, pages=3):
    """Abbreviations (content/abbreviations.txt: 'ABBR | meaning'), alphabetical, two columns per page."""
    f = CONTENT / 'abbreviations.txt'
    if not f.exists():
        return []
    rows = [l.split('|', 1) for l in f.read_text().splitlines() if '|' in l]
    rows.sort(key=lambda r: re.sub(r'[^A-Z0-9]', '', r[0].upper()))
    per_page = -(-len(rows) // pages)  # filled evenly
    chunks = [rows[i:i + per_page] for i in range(0, len(rows), per_page)]
    out = []
    for n, chunk in enumerate(chunks):
        items = ''.join(f'<div class="ab1"><b>{html.escape(a.strip())}</b><span>{html.escape(b.strip())}</span></div>' for a, b in chunk)
        out.append(f'<section class="page abbr" id="pa{n}" data-id="abbr-{n + 1}">'
                   f'<div class="toc-h"><div><b>Abbreviations</b><span>{book["edition"]} · page {n + 1} of {len(chunks)}</span></div></div>'
                   f'<div class="abl">{items}</div>{footer(book)}</section>\n')
    return out


def terms():
    """Hover / tap definitions: abbreviations (case-sensitive) and the glossary of medical words."""
    def rows(name):
        f = CONTENT / name
        if not f.exists():
            return []
        out = []
        for l in f.read_text().splitlines():
            if '|' not in l or l.startswith('#'):
                continue
            k, d = (x.strip() for x in l.split('|', 1))
            forms = [x.strip() for x in re.sub(r'\s*\(.*?\)', '', k).split('/') if len(x.strip()) > 1]
            out.append([forms, k, d])
        return out
    return {'ab': rows('abbreviations.txt'), 'gl': rows('glossary.txt')}


def page_keys(meta_pages):
    """Stable key of each page: '<topic>:<n>' (n = page of the topic) or 'ex<ch>:<n>' for an Exam corner; same rule as app.js PKEY."""
    n, keys = {}, []
    for p in meta_pages:
        g = f'ex{p["ch"]}' if p.get('ex') else p.get('topic')
        if g:
            n[g] = n.get(g, 0) + 1
            keys.append(f'{g}:{n[g]}')
        else:
            keys.append(p['id'])
    return keys


def audio_meta(meta_pages, topics_meta, book):
    """Audio lectures: content/audio/<topic>-<n>.mp3 = the author explaining page n of that topic (tools/audio.py makes them).
    Durations and sizes come from content/audio/index.json (written by tools/audio.py) so the build needs no ffprobe."""
    ad = CONTENT / 'audio'
    if not ad.exists():
        return []
    idx = json.loads((ad / 'index.json').read_text()) if (ad / 'index.json').exists() else {}
    keys = page_keys(meta_pages)
    at = {k: i for i, k in enumerate(keys)}
    titles = {t['id']: t for t in topics_meta}
    groups = {}
    for f in sorted(ad.glob('*.mp3')):
        m = re.match(r'(.+)-(\d+)$', f.stem)
        if not m or f'{m[1]}:{m[2]}' not in at or f.name not in idx:
            print(f'  audio {f.name}: no such page or not in index.json, skipped')
            continue
        i = at[f'{m[1]}:{m[2]}']
        groups.setdefault(m[1], []).append([i, f'audio/{f.name}', round(idx[f.name]['sec'], 1), idx[f.name]['bytes']])
    out = []
    for g, parts in groups.items():
        parts.sort()
        p0 = meta_pages[parts[0][0]]
        if g.startswith('ex'):
            ch = next(c for c in book['chapters'] if c['no'] == p0['ch'])
            title, no = f'Rapid Review · {text(ch["title"])}', f'{ch["no"]}'
        else:
            title, no = titles[g]['title'], titles[g]['no']
        out.append({'g': g, 'title': title, 'no': no, 'ch': p0['ch'], 'n': sum(1 for k in keys if k.startswith(g + ':')), 'parts': parts})
    out.sort(key=lambda x: x['parts'][0][0])
    return out


def rr_items(topic_html):
    """Formula strips and clue-switch rows of one topic, as (clue, answer) pairs."""
    pairs = []
    for eq in re.findall(r'<div class="eq">(.*?)</div>', topic_html, re.S):
        clues = [text(c) for c in re.findall(r'<span class="c">(.*?)</span>', eq, re.S)]
        ans = re.search(r'<span class="ans">(.*?)</span>', eq, re.S)
        if clues and ans:
            pairs.append((' + '.join(clues), text(ans.group(1))))
    for clue, ans in re.findall(r'<div class="r"><span>(.*?)</span><span class="to">(.*?)</span></div>', topic_html, re.S):
        pairs.append((text(clue), text(ans)))
    return pairs


def rr_pages(book, groups, first_pno):
    """Rapid review: every clue -> answer, grouped by topic, two columns per page."""
    cols, cur, used = [], [], 0
    for (t, ch), pairs in groups:
        for j, (clue, ans) in enumerate(pairs):
            units = 1 + (len(clue) + len(ans) > 48) + (len(clue) + len(ans) > 96)
            head = j == 0 or used == 0
            need = units + (2 if head else 0)
            if used + need > RR_COL_UNITS and cur:
                cols.append(cur)
                cur, used, head = [], 0, True
                need = units + 2
            if head:
                cur.append(f'<h2 class="s" style="color:{ch["color"]}">{t["no"]} · {t["title"]}</h2>')
            cur.append(f'<div class="frow"><span>{html.escape(clue)}</span><span class="ans">{html.escape(ans)}</span></div>')
            used += need
    if cur:
        cols.append(cur)
    cols = cols or [['<p class="small">Rapid-review rows appear here as topics are written.</p>']]
    pages = []
    for n in range(0, len(cols), 2):
        pno = first_pno + n // 2
        left, right = ''.join(cols[n]), ''.join(cols[n + 1]) if n + 1 < len(cols) else ''
        pages.append(f'<section class="page" id="p{pno}" data-id="rapid-review-{n // 2 + 1}">'
                     f'<div class="hdr{" left" if pno % 2 == 0 else ""}"><div class="chap">{ICON}Rapid review</div>'
                     f'<div class="topic">Every clue → answer</div><div class="pno">{pno}</div></div>'
                     f'<div class="body"><div class="grid wide"><div class="main">'
                     f'<div class="kicker"><span class="num">RR</span>Last-minute revision</div>'
                     f'<h1 class="t">Rapid Review</h1><p class="sub">Every clue → answer</p>'
                     f'<div class="rr"><div>{left}</div><div>{right}</div></div></div></div></div>{footer(book)}</section>\n')
    return pages


def build():
    book = json.loads((CONTENT / 'book.json').read_text())
    book['chapters'] = [c for c in book['chapters'] if c.get('edition', 1) == 1]  # specialties wait for edition 2
    css = (SRC / 'app.css').read_text()
    chapter_css_all = ''.join(chapter_css(ch['no'], ch['color']) for ch in book['chapters'])

    # Read written topics → a stream of atoms per chapter (titles, boxes, raw blocks).
    written, chapters = [], []
    skip = {int(n) for n in os.environ.get('SRR_SKIP_CH', '').split(',') if n}  # chapters still being written
    for ch in book['chapters']:
        for t in ch['topics']:
            f = CONTENT / 'topics' / f'{t["id"]}.html'
            if not f.exists() or ch['no'] in skip:
                continue
            src = f.read_text()
            pages = re.findall(r'<page sub="(.*?)"( layout="mosaic")?>(.*?)</page>', src, re.S)
            atoms, ex = [], {'formula': [], 'numbers': [], 'clues': [], 'try': []}
            for sub, hand, body in pages:
                main, _, side = body.partition('<aside>')
                exam_parts(side, ex)
                got = [('row' if r.startswith('<div class="m') else 'raw', r, True) for r in top_blocks(main)] if hand else auto_mosaic(main.strip())
                atoms += [(k, h, w, sub) for k, h, w in got]
            if ex['numbers']:
                nr, half = ex['numbers'], -(-len(ex['numbers']) // 2)
                tables = ''.join(f'<table class="numt">{"".join(nr[i:i + half])}</table>' for i in (0, half) if nr[i:i + half])
                atoms.append(('box', f'<div class="mb nums"><div class="mh">Key numbers</div><div class="mc"><div class="ng">{tables}</div></div></div>', len(nr) > 6, pages[-1][0]))
            t['_exam'] = ex
            written.append((ch, t, src))
            if not chapters or chapters[-1][0] is not ch:
                chapters.append((ch, []))
            # owner: the title stays on one line; a long title gets a smaller font instead of wrapping
            nch = len(text(t['title']))
            fs = '' if nch <= 32 else f' style="font-size:{max(16.5, 24 * 32 / nch):.1f}pt"'
            chapters[-1][1].append(('title', f'<h1 class="mzt"{fs}><span class="no">{t["no"]}</span>{t["title"]}</h1>', True, pages[0][0], t))
            chapters[-1][1].extend((k, h, w, sb, t) for k, h, w, sb in atoms)
    # owner (Nov 2026): no Exam corner after each chapter; every chapter's exam material is gathered in the
    # Rapid Review section at the end of the book, chapter by chapter, one block per topic
    rr_streams = []
    for ch, stream in chapters:
        tps = [a[4] for a in stream if a[0] == 'title']
        exam = [(x, t) for t in tps for x in chapter_exam(t)]
        if exam:
            head = ('<h1 class="mzt rrh"><img class="rrlogo" src="img/logo.webp" alt="">Rapid Review<small>Every clue, formula and question, chapter by chapter</small></h1>'
                    if not rr_streams else '') + f'<h2 class="rrc"><span class="no">{ch["no"]}</span>{ch["title"]}</h2>'
            rs = [('title', head, True, 'Rapid Review', tps[0])]
            rs.extend(('rvt', r, w, 'Rapid Review', t) for (r, w), t in exam)
            rr_streams.append((ch, rs, f'rr{ch["no"]}'))
    chapters = [(ch, stream, f'ch{ch["no"]}') for ch, stream in chapters] + rr_streams

    def compose(stream, rows):
        """HTML of one page from its rows of atom indexes; boxes are renumbered per topic in reading order."""
        out = []
        for row in rows:
            items = [stream[i] for i in row]
            if len(items) == 1 and items[0][0] in ('title', 'raw', 'row'):
                out.append(items[0][1])
            else:
                out.append(f'<div class="mrow{" c1" if len(items) == 1 else ""}">{"".join(x[1] for x in items)}</div>')
        return '\n'.join(out)

    n_contents = N_CONTENTS
    refs = (CONTENT / 'references.html').read_text() if (CONTENT / 'references.html').exists() else ''  # owner, Nov 2026
    howto = [(CONTENT / f'howto-{k}.html').read_text() for k in ('app', 'tools') if (CONTENT / f'howto-{k}.html').exists()]
    authors = (CONTENT / 'authors.html').read_text() if (CONTENT / 'authors.html').exists() else ''
    about = (CONTENT / 'about.html').read_text() if (CONTENT / 'about.html').exists() else ''
    reviewers = (CONTENT / 'reviewers.html').read_text() if (CONTENT / 'reviewers.html').exists() else ''  # owner, Nov 2026
    n_abbr = 0   # abbreviations are shown by tapping them on the page (meta 'abbr'), no list pages
    pno = 1 + bool(authors) + bool(about) + bool(reviewers) + len(howto) + bool(refs) + n_contents + n_abbr + 1
    paged = []
    rr_first = None
    for ch, stream, key in chapters:
        if key.startswith('rr') and rr_first is None:
            rr_first = pno
        if key.startswith('ch') and (CONTENT / 'img' / f'chcover_{ch["no"]}.jpg').exists():  # owner (Nov 2026): chapter opening cover
            ch['_cover'] = pno
            paged.append(('cover', ch, pno))
            pno += 1
        plan = LAYOUT.get(key)
        if MEASURE or not plan or plan.get('n') != len(stream):
            plan = {'pages': [[[i] for i in range(len(stream))]]}
        numbering = {}
        for rows in plan['pages']:
            first = stream[rows[0][0]]
            head = ''  # owner (pediatrics): the topic title is shown once, on its first page; the running head names the topic
            for row in rows:
                for i in row:
                    k, h, w, sb, t = stream[i]
                    if k == 'title' and 'p' not in t and sb != 'Rapid Review':
                        t['p'] = pno
                    if k in ('raw', 'row'):
                        numbering[t['id']] = numbering.get(t['id'], 0) + len(re.findall(r'<div class="mh">\d+\.', h))
                    if '<div class="mh"># ' in h:
                        numbering[t['id']] = numbering.get(t['id'], 0) + 1
                        stream[i] = (k, h.replace('<div class="mh"># ', f'<div class="mh">{numbering[t["id"]]}. ', 1), w, sb, t)
            sub = next((stream[i][3] for row in rows for i in row if stream[i][0] != 'title'), first[3])
            body = head + compose(stream, rows)
            if MEASURE:
                body = ''.join(f'<div class="ms" data-a="{i}" data-k="{a[0]}" data-w="{int(a[2])}" data-t="{a[4]["id"]}">'
                               f'<div class="msf">{compose(stream, [[i]])}</div>'
                               f'<div class="msh"><div class="mrow">{a[1]}<div></div></div></div>'
                               + ''.join(f'<div class="mtk" data-tk="{tk}"><div class="mb"><div class="mc">{MTK[tk]}</div></div></div>'
                                         for tk in dict.fromkeys(re.findall(r'data-tk="(\w+)"', a[1])) if tk in MTK) + '</div>'
                               for i, a in enumerate(stream))
            fills = plan.get('fills') or []
            k_ = len(paged_keys := [x for x in paged if x[0] != 'cover' and x[5] == key])
            vj = min(56, int(max(0, fills[k_] - 20) * .9 / max(1, len(rows) - 1))) if k_ < len(fills) and not MEASURE else 0
            if vj > 1:  # spread the page's spare height evenly between its rows (no empty block at the bottom)
                body = f'<div class="vj" style="--vj:{vj}px"></div>' + body
            paged.append((ch, first[4], sub, body, pno, key, {stream[i][4]['id'] for row in rows for i in row if stream[i][3] != 'Rapid Review'}))
            pno += 1
    rr_first = rr_first or pno

    meta_pages = [{'id': 'cover', 'label': 'Cover'}]
    meta_pages += [{'id': f'contents-{i + 1}', 'label': 'Contents'} for i in range(n_contents)]
    html_pages = [f'<section class="page" id="p1" data-id="cover"><div class="covbg" style="background-image:url(img/cover.webp)"></div>'
                  f'<img class="covimg" src="img/cover.webp" alt="{book["subject"]} Master Review, {book["edition"]}, cover"></section>\n']
    if authors:
        meta_pages.insert(1, {'id': 'authors', 'label': 'About the authors'})
        html_pages.append(f'<section class="page ab" id="p2" data-id="authors" dir="rtl" lang="ar">{authors}{footer(book)}</section>\n')
    if about:
        meta_pages.insert(1 + bool(authors), {'id': 'about', 'label': 'About this edition'})
        html_pages.append(f'<section class="page fmp" id="pab" data-id="about">{about}{footer(book)}</section>\n')
    if reviewers:
        meta_pages.insert(1 + bool(authors) + bool(about), {'id': 'reviewers', 'label': 'Reviewers'})
        html_pages.append(f'<section class="page fmp rvw" id="prv" data-id="reviewers">{reviewers}{footer(book)}</section>\n')
    for k, h in enumerate(howto):  # owner (Nov 2026): Arabic how-to pages (the app; study tools) before the contents
        meta_pages.insert(1 + bool(authors) + bool(about) + bool(reviewers) + k, {'id': f'howto-{k + 1}', 'label': 'How to use the book'})
        html_pages.append(f'<section class="page howto" id="ph{k}" data-id="howto-{k + 1}" dir="rtl" lang="ar">{h}{footer(book)}</section>\n')
    if refs:  # after the how-to pages, before the contents (as in the Obstetrics book)
        meta_pages.insert(1 + bool(authors) + bool(about) + bool(reviewers) + len(howto), {'id': 'references', 'label': 'References'})
        html_pages.append(f'<section class="page refp" id="prf" data-id="references">{refs}{footer(book)}</section>\n')
    html_pages += contents_pages(book, rr_first)
    topic_pages = {}
    for item in paged:
        if item[0] == 'cover':
            _, ch, n = item
            html_pages.append(chapter_cover(book, ch, n))
            meta_pages.append({'id': f'p{n}', 'label': f'Chapter {ch["no"]} · {text(ch["title"])}', 'ch': ch['no'], 'chcover': 1})
            continue
        ch, t0, sub, body, n, key, tids = item
        pid = f'p{n}'
        html_pages.append(mosaic_page(book, ch, sub, body, n, pid, key, t0))
        meta_pages.append({'id': pid, 'label': f'{t0["no"]} · {text(sub)}', 'topic': t0['id'], 'ch': ch['no'], **({'ex': 1} if sub == 'Rapid Review' else {})})
        for tid in tids:
            topic_pages.setdefault(tid, []).append(pid)
    topics_meta, rr_groups = [], []
    for ch, t, src in written:
        topics_meta.append({'id': t['id'], 'no': t['no'], 'title': text(t['title']), 'sub': text(t.get('sub', '')),
                            'ch': ch['no'], 'p': t.get('p', 0), 'pages': topic_pages.get(t['id'], [])})
        rr_groups.append(((t, ch), rr_items(src)))
    rr = []  # owner (Nov 2026): the Rapid Review section is built per chapter above (exam material moved there)
    html_pages += rr
    meta_pages += [{'id': f'rapid-review-{i + 1}', 'label': 'Rapid review'} for i in range(len(rr))]

    decks = {}
    for ch, t, src in written:
        f = CONTENT / 'decks' / f'{t["id"]}.json'
        if f.exists():
            decks[t['id']] = {'short': t.get('short', text(t['title'])), 'cards': json.loads(f.read_text())}

    # Question bank: content/qbank/<topic>.json → [[topic, stem, options, answer, explanation, page, source]]
    page_text = [re.sub(r'\s+', ' ', html.unescape(re.sub(r'<[^>]+>', ' ', h))).lower() for h in html_pages]
    pidx = {p['id']: i for i, p in enumerate(meta_pages)}
    qbank = {'topics': [], 'qs': []}
    for ch, t, src in written:
        f = CONTENT / 'qbank' / f'{t["id"]}.json'
        if not f.exists():
            continue
        pages = [pidx[x] for x in topic_pages.get(t['id'], []) if x in pidx]
        qbank['topics'].append({'id': t['id'], 'no': t['no'], 'ch': ch['no'], 'short': t.get('short', text(t['title']))})
        for q in json.loads(f.read_text()):
            assert len(q['o']) == 5 and 0 <= q['a'] < 5, (t['id'], q['q'][:60])
            k = re.sub(r'\s+', ' ', q.get('k', '')).lower().strip()
            hit = next((i for i in pages if k and k in page_text[i]), None)
            if hit is None:  # Formula / Clue switch / Numbers moved to the Exam corner or Key numbers
                hit = next((i for i in range(len(page_text)) if k and k in page_text[i]), None)
            if hit is None:
                print(f'  qbank {t["id"]}: link text not found: {q.get("k")!r}')
                hit = pages[0] if pages else 0
            qbank['qs'].append([t['id'], q['q'], q['o'], q['a'], q['e'], hit + 1, q.get('s', 'new')])

    # Free trial: chosen topics, then ~equal flashcards and questions from those topics (evenly spread in each)
    acc = book.get('access', {})
    free_t = [t for t in acc.get('free_topics', []) if t in decks]
    def spread(n_items, k):
        return [round(i * n_items / k) for i in range(k)] if k < n_items else list(range(n_items))
    def share(total, ids, size):
        out, per = {}, -(-total // max(1, len(ids)))
        for t in ids:
            take = min(per, size(t), total - sum(len(v) for v in out.values()))
            if take > 0:
                out[t] = spread(size(t), take)
        return out
    every = 10 ** 6  # 'all': every card / question of the free topics
    free_cards = share(every if acc.get('free_cards') == 'all' else acc.get('free_cards', 50), free_t, lambda t: len(decks[t]['cards']))
    qidx = {}
    for i, q in enumerate(qbank['qs']):
        qidx.setdefault(q[0], []).append(i)
    qt = [t for t in acc.get('free_topics', []) if t in qidx]
    nq = every if acc.get('free_questions') == 'all' else acc.get('free_questions', 50)
    free_qs = [qidx[t][j] for t, js in share(nq, qt, lambda t: len(qidx[t])).items() for j in js]
    access = {k: v for k, v in acc.items() if k not in ('free_cards', 'free_questions')}
    fs = set(acc.get('free_topics', []))
    access.update({'cards': free_cards, 'qs': free_qs,
                   'free_chapters': [ch['no'] for ch in book['chapters'] if ch['topics'] and all(t['id'] in fs for t in ch['topics'])],
                   'free_names': [text(ch['title']) if all(t['id'] in fs for t in ch['topics']) else None for ch in book['chapters']]})
    access['free_names'] = [n for n in access['free_names'] if n] + [text(t['title']) for ch in book['chapters'] for t in ch['topics']
                            if t['id'] in fs and not all(x['id'] in fs for x in ch['topics'])]

    tp = {t['id']: t for t in topics_meta if t.get('p')}
    xf = CONTENT / 'links.json'
    xref = {k: v for k, v in json.loads(xf.read_text()).items() if not k.startswith('_')} if xf.exists() else {}
    meta = {
        'access': access, 'terms': terms(),
        'review': bool(os.environ.get('PRR_REVIEW')),  # authors' review copy: whole book open (never for docs/)
        'audio': audio_meta(meta_pages, topics_meta, book),
        'edition': book['edition'], 'pages': meta_pages, 'topics': topics_meta, 'rr': rr_first,
        'chips': book.get('search_chips', []),
        # cross-links (content/links.json): [phrase, topic id, first page]; topic numbers like (6.2) link too
        'xref': [[ph, tid, tp[tid]['p'], tp[tid]['no']] for tid, phs in xref.items() if tid in tp for ph in phs],
        'tnos': {t['no']: [t['id'], t['p']] for t in topics_meta if t.get('p')},
        # 'terms': abbreviations + glossary, shown on hover / tap (app.js termify)
        'pill': f'{len(topics_meta)} topic{"s" * (len(topics_meta) != 1)} · {len(meta_pages)} pages',
        'contents': [{'no': ch['no'], 'title': text(ch['title']), 'part': ch.get('part', ''), 'color': ch['color'],
                      'topics': [{'id': t['id'], 'no': t['no'], 'title': text(t['title']), 'sub': text(t.get('sub', '')),
                                  'p': t.get('p')} for t in ch['topics']]} for ch in book['chapters']],
    }

    def js_json(o):
        return json.dumps(o, ensure_ascii=False).replace('</', '<\\/')

    page = (SRC / 'shell.html').read_text()
    for k, v in {'CSS': css, 'CHAPTER_CSS': chapter_css_all, 'JS': (SRC / 'app.js').read_text(),
                 'PAGES': ''.join(html_pages), 'META': js_json(meta), 'DECKS': js_json(decks), 'QBANK': js_json(qbank),
                 'TITLE': f'{book["subject"]} Master Review', 'SUBJECT': book['subject'], 'EDITION': book['edition'],
                 'SERIES': book['series'], 'BLURB': book['blurb'],
                 'SEARCH_PLACEHOLDER': book.get('search_placeholder', 'Search the book')}.items():
        page = page.replace('{{' + k + '}}', v)

    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / 'index.html').write_text(page)
    if (CONTENT / 'img').exists():
        shutil.copytree(CONTENT / 'img', OUT / 'img', dirs_exist_ok=True)
    if (CONTENT / 'audio').exists():
        shutil.copytree(CONTENT / 'audio', OUT / 'audio', dirs_exist_ok=True, ignore=shutil.ignore_patterns('*.json'))
    for f in ('manifest.json', 'sw.js'):
        shutil.copy(SRC / f, OUT / f)
    # Authors' review copy for the claude.ai Artifact preview: a full HTML document with the whole book open (meta review = true).
    art, nrev = re.subn(r'"review":\s*false', '"review": true', page, count=1)
    assert nrev == 1 or os.environ.get('PRR_REVIEW'), 'review flag not found in meta'
    if not os.environ.get('SRR_OUT'):
        (ROOT / 'artifact').mkdir(exist_ok=True)
        (ROOT / 'artifact' / 'index.html').write_text(art)
    print(f'Built docs/index.html: {len(meta_pages)} pages, {len(topics_meta)} topics, '
          f'{sum(len(d["cards"]) for d in decks.values())} flashcards, '
          f'{len(qbank["qs"])} questions')


if __name__ == '__main__':
    build()
