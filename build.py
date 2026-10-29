#!/usr/bin/env python3
"""Build the Pediatrics Master Review app into docs/ (one index.html + img/).

Content lives in content/:
  book.json            book details, chapters (colour) and topic list
  topics/<id>.html     one file per topic: <page sub="..."> ... <aside> side column </aside></page>
  decks/<id>.json      flashcards: [[section, question, answer], ...]
A topic without a topics/<id>.html file is listed in Contents as "coming soon".
"""
import html, json, os, re, shutil
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
            f'.toc .row.c{no},.toc .cc.c{no}{{--ch:{v["ch"]};--ch-tint:{v["tint"]};--ch-dark:{v["dark"]};--ch-line:{v["line"]}}}\n'
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
    return (cols >= 3 or len(text(body)) > 700 or
            any(k in body for k in ('class="photos"', 'class="fig"', 'class="two"', 'class="ladder"')))


def auto_mosaic(main):
    """Old two-column page → atoms: ('raw', html) blocks and ('box', html, wide) section boxes."""
    intro, secs = split_sections(main)
    intro = re.sub(r'^<p[^>]*>', '<p class="lead">', intro) if intro.startswith('<p') else intro
    atoms = [('raw', b, True) for b in (top_blocks(intro) or ([intro] if intro.strip() else []))]
    for title, body in secs:
        atoms.append(('box', f'<div class="mb"><div class="mh"># {title}</div><div class="mc">{body}</div></div>', is_wide(body)))
    return atoms


def exam_parts(side, ex):
    """Collect a page's exam material (formula, numbers, clue switch, try it) into the topic's exam dict."""
    ex['formula'] += re.findall(r'<div class="formula">.*?</div></div></div>', side, re.S)
    ex['numbers'] += re.findall(r'<tr>.*?</tr>', ''.join(re.findall(r'<table class="numt">(.*?)</table>', side, re.S)), re.S)
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


def chapter_exam(t):
    """Exam corner atoms for one topic: a clue box and a formulas + questions box (they can pair side by side)."""
    ex = t['_exam']
    fl = ''.join(f.replace('<div class="formula">', '<div class="formula fl">') for f in ex['formula'])
    qa = ''.join(re.sub(r'<div class="a"><span>ANSWER</span>', '<div class="a">', q).replace('class="try"', 'class="qa"')
                 for q in ex['try'])
    out = []
    if ex['clues']:
        out.append((f'<div class="mb exam"><div class="mh">{t["no"]} {t["title"]} · clue → answer</div>'
                    f'<div class="mc">{"".join(ex["clues"])}</div></div>', False))
    if fl or qa:
        out.append((f'<div class="mb exam"><div class="mh">{t["no"]} · formulas &amp; test yourself</div><div class="mc">'
                    + (f'<div class="xsub">Formulas</div>{fl}' if fl else '') + (f'<div class="xsub">Test yourself</div>{qa}' if qa else '')
                    + '</div></div>', False))
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


def mosaic_page(book, ch, sub, body, pno, pid, orig=''):
    """New book layout (owner, Oct 2026): full-width rows of coloured boxes, written directly in the topic file
    as <page sub="..." layout="mosaic"> with .mrow rows and .mb boxes."""
    return (f'<section class="page mz c{ch["no"]}" id="p{pno}" data-id="{pid}" data-orig="{orig or pid}">'
            f'<div class="mzh{" left" if pno % 2 == 0 else ""}"><span>Chapter {ch["no"]} · {ch["title"]}</span>'
            f'<span>{sub}<b>{pno}</b></span></div>'
            f'<div class="body"><div class="main mzm">'
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


def contents_pages(book, rr_page):
    """Contents: parts, each with its chapters as boxes (3 per row); each chapter lists all its topics.
    Topics not written yet are listed without a page number (dimmed). book.json "contents_split" = chapter numbers
    that start a new contents page."""
    splits = set(book.get('contents_split', []))
    pages_parts, cur_part = [[]], ('', 0)
    for ch in book['chapters']:
        if ch['no'] in splits:
            pages_parts.append([])
        parts = pages_parts[-1]
        if ch.get('part') or not parts:
            if ch.get('part'):
                cur_part = (ch['part'], len([1 for pp in pages_parts for q in pp if not q[3]]))
            parts.append((cur_part[0], [], cur_part[1], not ch.get('part')))
        written = [t for t in ch['topics'] if t.get('p')]
        tops = ''.join((f'<div class="ct" data-p="{t["p"]}"><i>{t["no"]}</i><span>{t["title"]}</span><em>{t["p"]}</em></div>'
                        if t.get('p') else
                        f'<div class="ct soon"><i>{t["no"]}</i><span>{t["title"]}</span><em></em></div>') for t in ch['topics'])
        dp = f' data-p="{written[0]["p"]}"' if written else ''
        parts[-1][1].append(f'<div class="cc c{ch["no"]}"><div class="cch"{dp}><b>{ch["no"]}</b>'
                            f'<span>{ch["title"]}</span></div><div class="ctl">{tops}</div></div>')
    roman = 'I II III IV V VI VII VIII'.split()
    out, pi = [], 0
    for n, parts in enumerate(pages_parts):
        body, i = '', 0
        while i < len(parts):
            group = [i]  # small parts share one row of three
            while len(parts[group[0]][1]) < 3 and group[-1] + 1 < len(parts) and \
                    sum(len(parts[j][1]) for j in group) + len(parts[group[-1] + 1][1]) <= 3:
                group.append(group[-1] + 1)
            for j in group:
                span = '1/-1' if len(group) == 1 else (f'1/span {len(parts[j][1])}' if j == group[0] else f'span {len(parts[j][1])}')
                body += (f'<div class="bp" style="grid-column:{span}"><span>Part {roman[parts[j][2]]}</span>{parts[j][0]}'
                         f'{" (continued)" if parts[j][3] else ""}</div>')
            for j in group:
                body += ''.join(parts[j][1])
            i = group[-1] + 1
        more = f' · page {n + 1} of {len(pages_parts)}' if len(pages_parts) > 1 else ''
        out.append(f'<section class="page" id="pc{n}" data-id="contents-{n + 1}">'
                   f'<div class="toc-h"><div><b>Contents</b><span>{book["edition"]}{more}</span></div></div>'
                   f'<div class="toc ccg">{body}</div>{footer(book)}</section>\n')
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
            title, no = f'Exam corner · {text(ch["title"])}', f'{ch["no"]}'
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
    if not cols:
        return []  # no rapid-review page until topics are written
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
            chapters[-1][1].append(('title', f'<h1 class="mzt"><span class="no">{t["no"]}</span>{t["title"]}</h1>', True, pages[0][0], t))
            chapters[-1][1].extend((k, h, w, sb, t) for k, h, w, sb in atoms)
    for ch, stream in chapters:
        tps = [a[4] for a in stream if a[0] == 'title']
        exam = [x for t in tps for x in chapter_exam(t)]
        if exam:
            stream.append(('title', f'<h1 class="mzt"><span class="no">{ch["no"]}</span>Exam corner · {ch["title"]}</h1>', True, 'Exam corner', tps[-1]))
            stream.extend(('box', r, w, 'Exam corner', tps[-1]) for r, w in exam)

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

    n_contents = 1 + len(book.get('contents_split', []))
    authors = (CONTENT / 'authors.html').read_text() if (CONTENT / 'authors.html').exists() else ''
    about = (CONTENT / 'about.html').read_text() if (CONTENT / 'about.html').exists() else ''
    n_abbr = 0   # abbreviations are shown by tapping them on the page (meta 'abbr'), no list pages
    pno = 1 + bool(authors) + bool(about) + n_contents + n_abbr + 1
    paged = []
    for ch, stream in chapters:
        key = f'ch{ch["no"]}'
        plan = LAYOUT.get(key)
        if MEASURE or not plan or plan.get('n') != len(stream):
            plan = {'pages': [[[i] for i in range(len(stream))]]}
        numbering = {}
        for rows in plan['pages']:
            first = stream[rows[0][0]]
            head = '' if first[0] == 'title' else f'<h1 class="mzt mzc"><span class="no">{first[4]["no"]}</span>{first[4]["title"]}</h1>'
            for row in rows:
                for i in row:
                    k, h, w, sb, t = stream[i]
                    if k == 'title' and 'p' not in t and sb != 'Exam corner':
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
                               f'<div class="msh"><div class="mrow">{a[1]}<div></div></div></div></div>'
                               for i, a in enumerate(stream))
            paged.append((ch, first[4], sub, body, pno, key, {stream[i][4]['id'] for row in rows for i in row}))
            pno += 1
    rr_first = pno

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
    html_pages += contents_pages(book, rr_first)
    topic_pages = {}
    for ch, t0, sub, body, n, key, tids in paged:
        pid = f'p{n}'
        html_pages.append(mosaic_page(book, ch, sub, body, n, pid, key))
        meta_pages.append({'id': pid, 'label': f'{t0["no"]} · {text(sub)}', 'topic': t0['id'], 'ch': ch['no'], **({'ex': 1} if sub == 'Exam corner' else {})})
        for tid in tids:
            topic_pages.setdefault(tid, []).append(pid)
    topics_meta, rr_groups = [], []
    for ch, t, src in written:
        topics_meta.append({'id': t['id'], 'no': t['no'], 'title': text(t['title']), 'sub': text(t.get('sub', '')),
                            'ch': ch['no'], 'p': t.get('p', 0), 'pages': topic_pages.get(t['id'], [])})
        rr_groups.append(((t, ch), rr_items(src)))
    rr = rr_pages(book, rr_groups, rr_first)
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
        'audio': audio_meta(meta_pages, topics_meta, book),
        'edition': book['edition'], 'pages': meta_pages, 'topics': topics_meta, 'rr': rr_first,
        'chips': book.get('search_chips', []),
        # cross-links (content/links.json): [phrase, topic id, first page]; topic numbers like (6.2) link too
        'xref': [[ph, tid, tp[tid]['p'], tp[tid]['no']] for tid, phs in xref.items() if tid in tp for ph in phs],
        'tnos': {t['no']: [t['id'], t['p']] for t in topics_meta if t.get('p')},
        # 'terms': abbreviations + glossary, shown on hover / tap (app.js termify)
        'pill': (f'{len(topics_meta)} topic{"s" * (len(topics_meta) != 1)} · {len(meta_pages)} pages' if topics_meta else
                 f'{len(book["chapters"])} chapters · {sum(len(c["topics"]) for c in book["chapters"])} topics'),
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
    # Copy for a claude.ai Artifact preview: the host adds the doctype/html/head/body skeleton itself.
    art = re.sub(r'<!doctype html>\s*<html[^>]*><head>\s*<meta charset="utf-8">\s*<meta name="viewport"[^>]*>\s*', '', page)
    art = art.replace('</head><body>', '').replace('</body></html>', '')
    if not os.environ.get('SRR_OUT'):
        (ROOT / 'artifact').mkdir(exist_ok=True)
        (ROOT / 'artifact' / 'index.html').write_text(art)
    print(f'Built docs/index.html: {len(meta_pages)} pages, {len(topics_meta)} topics, '
          f'{sum(len(d["cards"]) for d in decks.values())} flashcards, '
          f'{len(qbank["qs"])} questions')


if __name__ == '__main__':
    build()
