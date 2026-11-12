#!/usr/bin/env python3
"""Front pages of the book in the new poster design (owner, 12 Nov 2026: "Pediatrics and Surgery still have the old design at the
beginning of the book: authors, reviewers, about this edition, how to use").

Writes content/authors.html, about.html, reviewers.html, howto-app.html, howto-tools.html and references.html (same pages and page
numbers as before), and the CSS block between /* fp:start */ and /* fp:end */ in src/app.css. The same file runs in Pediatrics and Surgery
(the book is found from content/book.json). A poster sent by the owner (content/img/ab_<name>.jpg listed in OWNER below) is shown as the
whole page instead of the generated design. After `python3 build.py`, `node tools/frontshots.js <served build>` makes the pictures the
About tiles open (content/img/ab_*.jpg, thumbnails abt_*.jpg).
Run: python3 tools/frontpages.py && python3 build.py
"""
import json, re, pathlib, html

ROOT = pathlib.Path(__file__).resolve().parent.parent
C = ROOT / 'content'
book = json.loads((C / 'book.json').read_text())
PED = book['subject'].lower().startswith('pediatric')

BK = {
    True: dict(name='Pediatric Master Review', ar='طب الأطفال', cover='cover5.jpg', subj='طب الأطفال',
               deep='#0E472C', pri='#1E7A4C', sel='#D5EEDF', bg='#F0F7F3', bd='#CFE4D7', gold='#C9A24A',
               series_line='وكتاب <b class="en">Pediatric Master Review</b> هو كتاب طب الأطفال في السلسلة، بعد كتابي النساء والتوليد والجراحة.',
               teach='طب الأطفال'),
    False: dict(name='Surgery Master Review', ar='الجراحة', cover='cover4.jpg', subj='الجراحة',
                deep='#092A46', pri='#1768B3', sel='#D6E7F6', bg='#EFF6FB', bd='#CFE0EE', gold='#C9A24A',
                series_line='وكتاب <b class="en">Surgery Master Review</b> هو كتاب الجراحة في السلسلة، بعد كتاب النساء والتوليد.',
                teach='الجراحة'),
}[PED]
# posters sent by the owner: shown as the whole page (Surgery references, 12 Nov 2026)
OWNER = {k: f'ab_{k}.jpg' for k in ('authors', 'reviewers', 'edition', 'howto', 'tools', 'refs')
         if (C / 'img' / f'owner_ab_{k}.jpg').exists() or (not PED and k == 'refs')}

ed1 = [c for c in book['chapters'] if not c.get('edition')]
ids = [t['id'] if isinstance(t, dict) else t for c in ed1 for t in c.get('topics', [])]
ncards = nq = 0
for i in ids:
    for d, kind in ((C / 'decks' / f'{i}.json', 'c'), (C / 'qbank' / f'{i}.json', 'q')):
        if d.exists():
            v = json.loads(d.read_text())
            n = len(v if isinstance(v, list) else v.get('cards', v.get('q', [])))
            if kind == 'c':
                ncards += n
            else:
                nq += n


def num(n):
    return f'{n:,}'


# ---------- small line icons (24 × 24, stroke = currentColor) ----------
P = {
    'book': '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z"/><path d="M4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5"/>',
    'q': '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .9-1 1.7"/><circle cx="12" cy="17" r=".6" fill="currentColor"/>',
    'cards': '<rect x="3" y="6" width="13" height="15" rx="2"/><path d="M8 3h11a2 2 0 0 1 2 2v13"/>',
    'video': '<rect x="2.5" y="5" width="15" height="14" rx="2"/><path d="M17.5 10l4-2.5v9l-4-2.5"/>',
    'slides': '<rect x="3" y="4" width="18" height="12" rx="1.5"/><path d="M12 16v4M8 20h8"/>',
    'note': '<path d="M5 3h10l4 4v14H5z"/><path d="M15 3v4h4M8 12h8M8 16h6"/>',
    'chart': '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    'pen': '<path d="M15.5 4.5l4 4L8 20l-5 1 1-5z"/><path d="M13 7l4 4"/>',
    'marker': '<path d="M14 4l6 6-8 8H8v-4z"/><path d="M4 22h16"/>',
    'text': '<path d="M5 6V4h14v2M12 4v16M9 20h6"/>',
    'page': '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M12 9v6M9 12h6"/>',
    'undo': '<path d="M9 14L4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/>',
    'zoom': '<circle cx="11" cy="11" r="7"/><path d="M21 21l-5-5M11 8v6M8 11h6"/>',
    'full': '<path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5"/>',
    'bm': '<path d="M6 3h12v18l-6-4-6 4z"/>',
    'hl': '<path d="M3 21h18"/><rect x="6" y="5" width="12" height="11" rx="1.5" fill="currentColor" opacity=".25"/><path d="M9 9h6M9 12h4"/>',
    'ul': '<path d="M7 4v7a5 5 0 0 0 10 0V4M5 21h14"/>',
    'check': '<circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.8 2.8L16.5 9"/>',
    'star': '<path d="M12 3l2.7 5.6 6.1.8-4.5 4.2 1.1 6-5.4-2.9-5.4 2.9 1.1-6L3.2 9.4l6.1-.8z"/>',
    'search': '<circle cx="11" cy="11" r="7"/><path d="M21 21l-5-5"/>',
    'sync': '<path d="M20 11a8 8 0 0 0-14.3-4.9L4 8"/><path d="M4 3v5h5M4 13a8 8 0 0 0 14.3 4.9L20 16"/><path d="M20 21v-5h-5"/>',
    'globe': '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
    'phone': '<rect x="6" y="2.5" width="12" height="19" rx="2.5"/><path d="M11 18.5h2"/>',
    'home': '<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/>',
    'list': '<path d="M8 6h13M8 12h13M8 18h13"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/>',
    'shield': '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/>',
    'copy': '<circle cx="12" cy="12" r="9"/><path d="M15 9.5a4 4 0 1 0 0 5"/>',
    'heart': '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>',
    'wa': '<path d="M4 20l1.3-4A8 8 0 1 1 8 18.8z"/><path d="M9 9.5c.3 2 2 4 4.5 4.8l1.2-1.2 2 .9c-.2 1.3-1.3 2-2.5 1.8-3.3-.5-6-3.2-6.5-6.5-.2-1.2.5-2.3 1.8-2.5l.9 2z"/>',
    'uni': '<path d="M3 9l9-5 9 5-9 5z"/><path d="M6 11v5c3 2 9 2 12 0v-5"/>',
    'pill': '<rect x="3" y="8" width="18" height="8" rx="4" transform="rotate(-35 12 12)"/><path d="M9.5 8.5l5 7"/>',
    'steth': '<path d="M6 3v6a5 5 0 0 0 10 0V3"/><path d="M11 14v2a4 4 0 0 0 8 0v-2"/><circle cx="19" cy="12" r="2"/>',
    'bolt': '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
    'eye': '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    'layers': '<path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/>',
    'clip': '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V3h6v1M8.5 10l1.5 1.5 3-3M8.5 16l1.5 1.5 3-3"/>',
    'leaf': '<path d="M5 19c0-9 6-14 15-14 0 9-5 15-14 15"/><path d="M5 19c3-4 6-6 10-8"/>',
}


def ic(k, cls='fp-i'):
    return f'<svg class="{cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{P[k]}</svg>'


def head(ar, en, pill=True, sub='', side=''):
    s = (f'<div class="fp-hd{" fp-hd2" if side else ""}">{side}<div class="fp-hdt">'
         f'<div class="fp-ser"><span>Student Master Note Series</span></div>'
         f'<h1 class="fp-t">{ar}</h1><div class="fp-en"><span>{en}</span></div>')
    if pill:
        s += f'<div class="fp-pill">{BK["name"]}</div>'
    if sub:
        s += f'<p class="fp-sub">{sub}</p>'
    return s + '</div></div>'


def hpill(t, k=None):
    return f'<div class="fp-h"><span>{ic(k) if k else ""}{t}</span></div>'


def sec(t, inner, k=None):
    return f'<div class="fp-sec">{hpill(t, k)}{inner}</div>'


def cover(cls='fp-cov'):
    return f'<div class="{cls}"><img src="img/{BK["cover"]}" alt="{BK["name"]} cover"><i></i></div>'


def wrap(key, body, cls=''):
    if key in OWNER:   # the owner's own poster fills the page
        im = OWNER[key]
        return (f'<div class="fp fpimg" data-fp="{key}"><div class="fpbg" style="background-image:url(img/{im})"></div>'
                f'<img src="img/{im}" alt=""></div>\n')
    return f'<div class="fp {cls}" data-fp="{key}" dir="rtl" lang="ar">{body}</div>\n'


# ---------- 1. authors ----------
def authors():
    b = head('عن المؤلفين', 'About the authors')
    b += ('<div class="fp-au">'
          '<div class="fp-aur">'
          '<div class="fp-names"><b>د. عبدالجليل ارجا</b><b>د. العباس عبدالرحمن</b></div>'
          f'{cover()}'
          '<p class="fp-cap">خريجا كلية الطب — جامعة شندي<br>مؤسِّسا سلسلة <span class="en">Student Master Note</span></p>'
          '</div>'
          '<div class="fp-ph"><img src="img/authors.webp" alt="The two authors"></div>'
          '</div>')
    b += sec('من نحن', '<div class="fp-c fp-lead"><p>نحن خريجا كلية الطب بجامعة شندي، ومؤسِّسا سلسلة <b class="en">Student Master Note</b>. عشنا سنوات '
          'الدراسة وسهر الليالي قبل الامتحانات، وأدركنا كيف يتشتّت وقت الطالب بين المراجع المطوّلة والملخّصات المتفرقة؛ فقرّرنا أن نُعِدّ '
          f'المرجع الذي تمنّينا أن يكون بين أيدينا حين كنّا طلابًا. {BK["series_line"]}</p></div>')
    b += ('<div class="fp-g3">'
          '<div class="fp-c"><div class="fp-ct">رحلة تجمعنا</div><p>جمعتنا الجامعة، وتوطّدت بيننا صداقة تمتدّ لأكثر من ثماني سنوات، '
          'أساسها الاحترام والتقدير المتبادل. نعتزّ بقدرات بعضنا، ونتكامل في أفكارنا وجهودنا، ونتشارك رؤية واحدة: أن نقدّم علمًا نافعًا يليق '
          'بطالب الطب ويعينه في رحلته.</p></div>'
          '<div class="fp-c"><div class="fp-ct">رسالتنا</div><p>نؤمن بأن الفهم يسبق الحفظ، وبأن المعرفة تكتمل حين ترتبط بالممارسة. نسعى إلى '
          'تقريب العلم للطالب، وربط المراجع العالمية بواقع العمل الطبي في السودان، وتوجيه جهده إلى ما ينفعه في دراسته وامتحاناته.</p></div>'
          '<div class="fp-c"><div class="fp-ct">منهجنا في العمل</div><p>نراجع المعلومة، وندقّق العبارة، ونعيد تنظيم المحتوى وتصميمه؛ إيمانًا '
          'بأن مشاركة العلم مسؤولية، وأن الطالب يستحق أدوات واضحة ومتقنة. ونرحّب بملاحظات زملائنا وطلابنا وأساتذتنا، ونتعلّم منها لنواصل '
          'التطوير.</p></div>'
          '</div>')
    b += sec('نيّتنا', '<div class="fp-c fp-in"><p>نسأل الله أن يكون هذا العمل خالصًا لوجهه الكريم، وعلمًا يُنتفع به، وصدقة جارية لنا ولوالدينا '
          'وأساتذتنا. فإن وجدت فيه نفعًا فلا تنسنا من دعوة صالحة، وإن وجدت خطأً فأعِنّا على تصحيحه.</p></div>')
    return wrap('authors', b)


# ---------- 2. about this edition (with disclaimer, rights and thanks) ----------
def about():
    parts = ('طب الأطفال العام (النمو والتطور والتطعيم، والتغذية، وحديثو الولادة، والوراثة)، والأمراض المعدية، وأمراض الأجهزة، '
             'والطوارئ والتسمم، والفحص السريري ومحطات OSCE، وأدوية الأطفال وجرعاتها') if PED else (
             'المبادئ العامة، والبطن، والثدي والغدة الدرقية، والجلد والأنسجة الرخوة، والفحص السريري ومحطات OSCE، وأدوية الجراحة')
    base = ('المحتوى مبنيّ على الممارسة المعمول بها في المستشفيات السودانية والبرامج الوطنية، وتمّت مراجعته على أحدث إرشادات منظمة الصحة '
            'العالمية والمراجع المعتمدة في طب الأطفال.') if PED else (
            'المحتوى مبنيّ على الممارسة المعمول بها في المستشفيات السودانية، وتمّت مراجعته على المراجع الجراحية المعتمدة والإرشادات العلمية الحديثة.')
    nxt = '' if PED else ('<p class="fp-nx">'
                          f'{ic("layers")}في الطبعة الثانية بإذن الله: المسالك البولية، والأوعية الدموية، وجراحة الأطفال، وجراحة الصدر، وجراحة المخ والأعصاب.</p>')
    dose = 'من كل جرعة دواء حسب وزن الطفل' if PED else 'من جرعات الأدوية وخطط العلاج'
    side = cover('fp-cov fp-covs')
    b = head('عن هذه الطبعة', 'About this edition', side=side)
    b += ('<div class="fp-stats">'
          f'<div><b>{len(ed1)}</b><span>فصلًا</span></div><div><b>{len(ids)}</b><span>موضوعًا</span></div>'
          f'<div><b>{num(ncards)}</b><span>بطاقة مراجعة</span></div><div><b>{num(nq)}</b><span>سؤالًا مع الشرح</span></div></div>')
    b += (f'<div class="fp-c fp-lead"><p>تغطّي <b>الطبعة الأولى</b> مادة {BK["subj"]} لطلاب الطب في <b>{len(ed1)} فصلًا</b>: {parts}. '
          'ومع الكتاب بطاقات مراجعة لكل موضوع، وبنك أسئلة مع شرح الإجابات، ومراجعة سريعة تلخّص كل موضوع استعدادًا للامتحان.</p>'
          f'<p>{base}</p>{nxt}</div>')
    b += ('<div class="fp-g2">'
          f'<div class="fp-c"><div class="fp-ct">{ic("shield")}إخلاء المسؤولية</div>'
          '<p>هذا الكتاب وسيلة مراجعة لطلاب الطب، ولا يغني عن المراجع الأساسية ولا عن التدريب السريري ولا عن توجيه الأطباء المشرفين.</p>'
          f'<p>الطب علم متجدّد والخطأ وارد؛ لذا يجب التحقق {dose} من الإرشادات الحالية وبروتوكولات المستشفى قبل استخدامها مع المرضى. '
          'ولا يتحمّل المؤلفان أي مسؤولية عن ضرر أو خسارة تنتج عن استخدام هذا المحتوى.</p></div>'
          f'<div class="fp-c"><div class="fp-ct">{ic("copy")}حقوق النشر والملكية الفكرية</div>'
          '<p class="fp-cr en">© 2026 Dr. Abdaljalil Abdalkareem Arja &amp; Dr. Alabass Abdulrahman</p>'
          '<p>جميع الحقوق محفوظة للمؤلفَين. الكتاب بكل محتواه — النصوص والجداول والرسومات، وبطاقات المراجعة، وبنك الأسئلة، والمراجعة '
          'السريعة، وتصميم التطبيق — ملكية فكرية خاصة بهما.</p></div>'
          '</div>')
    b += ('<div class="fp-c fp-ban"><div class="fp-ct">يُمنع دون إذن مكتوب من المؤلفَين</div><ul>'
          '<li>نسخ أي جزء من الكتاب أو طباعته أو تصويره أو نشر لقطات شاشة منه.</li>'
          '<li>تحويله إلى ملف <span class="en">PDF</span> أو أي صيغة أخرى.</li>'
          '<li>مشاركته في مجموعات واتساب أو تيليجرام أو فيسبوك أو أي منصة أخرى.</li>'
          '<li>بيعه أو توزيعه أو استخدامه في دورات أو ملخّصات تجارية.</li></ul>'
          '<p><b>الاشتراك شخصي:</b> لطالب واحد على أجهزته فقط، ولا تجوز مشاركته مع شخص آخر؛ وأي مخالفة تؤدّي إلى إيقاف الاشتراك دون '
          'استرداد المبلغ. شراؤك للاشتراك الأصلي يدعم المؤلفَين ويضمن استمرار السلسلة وتحديثها.</p></div>')
    b += (f'<div class="fp-c fp-in"><div class="fp-ct">{ic("heart")}شكر وتقدير</div><p>الحمد لله الذي بنعمته تتمّ الصالحات. نشكر والدينا على '
          f'دعمهم الدائم، وأساتذتنا في كلية الطب بجامعة شندي الذين علّمونا {BK["teach"]} في العنابر وقاعات المحاضرات، والزملاء الذين أفادت '
          'ملخّصاتهم أجيالًا من الطلاب. وشكرًا لكل طالب يقرأ هذا الكتاب: ملاحظاتكم تجعل الطبعة القادمة أفضل — راسلونا على واتساب '
          '<b class="en">0116984258</b>.</p></div>')
    return wrap('edition', b)


# ---------- 3. reviewers ----------
SIL = {
    'm': '<path d="M8 100C10 80 20 72 36 69L50 74 64 69C80 72 90 80 92 100z" fill="var(--fpd)"/><path d="M38 68l12 24 12-24-5-3H43z" fill="#fff"/>'
         '<path d="M46.5 76h7l2 4-5.5 14-5.5-14z" fill="var(--fpg)"/><path d="M42 55h16v11l-8 5-8-5z" fill="var(--fpd)"/>'
         '<ellipse cx="34.5" cy="42" rx="3.6" ry="6" fill="var(--fpd)"/><ellipse cx="65.5" cy="42" rx="3.6" ry="6" fill="var(--fpd)"/>'
         '<ellipse cx="50" cy="40" rx="16" ry="19.5" fill="var(--fpd)"/>',
    'f': '<path d="M24 72c-6-14-5-32 0-42 5-11 15-16 26-16s21 5 26 16c5 10 6 28 0 42z" fill="var(--fpd)"/><path d="M10 100c2-18 12-26 26-29l14 9 14-9c14 3 24 11 26 29z" fill="var(--fpd)"/>'
         '<path d="M43 55h14v14l-7 7-7-7z" fill="#fff"/><ellipse cx="50" cy="42" rx="14.5" ry="17.5" fill="#fff"/>'
         '<path d="M35.4 41c-1-13 6-19 14.6-19 9 0 15.6 6 14.6 19-4-6-10-10-17-10-3 4-7 7-12.2 10z" fill="var(--fpd)"/>',
}


def reviewers():
    s = (C / 'reviewers.html').read_text()
    if 'data-fp=' in s:   # already generated: the list is kept in the generated page
        rows = [(m.group(1), html.unescape(m.group(2)), html.unescape(m.group(3)), html.unescape(m.group(4)))
                for m in re.finditer(r'data-g="(\w)"[^>]*><svg[\s\S]*?</svg><div class="fp-rvt"><b>([^<]+)</b>[\s\S]*?class="fp-ua">([^<]+)<[\s\S]*?class="fp-ue en">([^<]+)<', s)]
    else:
        rows = []
        for m in re.finditer(r'class="rvc (\w)"[\s\S]*?(?=class="rvc |$)', s):
            t = [x.strip() for x in re.sub(r'<svg[\s\S]*?</svg>', '', m.group(0)).split('<') if '>' in x]
            t = [html.unescape(x.split('>', 1)[1]).strip() for x in t]
            t = [x for x in t if x and 'Reviewer' not in x and x not in ('★', '☆')]
            name = t[0]
            uni = [x for x in t[1:] if re.search('[A-Za-z]', x)][0]
            uni_ar = [x for x in t[1:] if not re.search('[A-Za-z]', x)][0]
            rows.append((m.group(1), name, uni_ar, uni))
    assert len(rows) >= 2, 'reviewers not found'
    # spelling as in the owner's reviewer posters (Obstetrics and Surgery, Nov 2026)
    fix = {'اريح يوسف': 'أريج يوسف', 'امنيه بكري على': 'امنيه بكري علي'}
    rows = [(g, fix.get(n, n), a, e) for g, n, a, e in rows]
    # the owner's reviewers poster for Surgery (12 Nov 2026) names a head of the review team and her deputy
    heads = {} if PED else {'امنيه بكري علي': 'رئيسة المراجعة', 'أريج يوسف': 'نائبة الرئيسة'}

    def av(k, g):
        return (f'<svg class="fp-av" viewBox="0 0 100 100" aria-hidden="true"><defs><clipPath id="fpa{k}">'
                f'<circle cx="50" cy="50" r="44"/></clipPath></defs><circle cx="50" cy="50" r="47" fill="#fff" stroke="var(--fpd)" stroke-width="3"/>'
                f'<circle cx="50" cy="50" r="43.5" fill="var(--fps)"/><g clip-path="url(#fpa{k})">{SIL[g]}</g></svg>')

    def nk(x):
        return re.sub(r'\s+', '', x).replace('ى', 'ي').replace('ة', 'ه').replace('أ', 'ا').replace('إ', 'ا')
    heads = {nk(k): v for k, v in heads.items()}
    top = cards = ''
    for k, (g, name, uar, uen) in enumerate(rows):
        if nk(name) in heads:
            top += '\x00' + str(list(heads).index(nk(name))) + (f'<div class="fp-rv fp-hv" data-g="{g}">{av(k, g)}<div class="fp-rvt"><b>{html.escape(name)}</b>'
                    f'<span class="fp-role">{heads[nk(name)]}</span>'
                    f'<span class="fp-u">{ic("uni")}<span class="fp-ua">{html.escape(uar)}</span></span><span class="fp-ue en">{html.escape(uen)}</span></div></div>')
            continue
        cards += (f'<div class="fp-rv" data-g="{g}">{av(k, g)}'
                  f'<div class="fp-rvt"><b>{html.escape(name)}</b><span class="fp-ro">عضو فريق المراجعة</span>'
                  f'<span class="fp-u">{ic("uni")}<span class="fp-ua">{html.escape(uar)}</span></span><span class="fp-ue en">{html.escape(uen)}</span></div></div>')
    b = head('فريق المراجعة', 'Reviewers', sub='بجهود مشتركة، أسهم فريق المراجعة في تدقيق المحتوى وتطويره، دعمًا لوضوح المادة العلمية وجودة تجربة التعلّم.')
    if top:   # the head of the team first
        top = ''.join(x[1:] for x in sorted(top.split('\x00')[1:]))
        b += f'<div class="fp-rvg fp-heads">{top}</div>'
    b += sec('أعضاء فريق المراجعة', f'<div class="fp-rvg">{cards}</div>')
    b += (f'<div class="fp-rvend">{cover("fp-cov fp-covs")}<div class="fp-thk"><b>شكر وتقدير</b><p>نثمّن وقت المراجعين وجهودهم وملاحظاتهم '
          'البنّاءة، وإسهامهم في تحسين هذا العمل وتطويره. وتبقى مسؤولية الصياغة النهائية للمحتوى على عاتق المؤلفَين.</p></div></div>')
    return wrap('reviewers', b)


# ---------- 4. how to use the book and the app ----------
def phone(img, pos='top'):
    return f'<div class="fp-pho"><img src="img/{img}" alt="" style="object-position:center {pos}"></div>'


def howto():
    steps = [
        ('ابدأ بالفصل والموضوع', 'افتح «الفصول»، واختر الفصل ثم الموضوع، واقرأ صفحاته بالترتيب. يحفظ التطبيق آخر صفحة لتتابع منها.', 'help_chapters.jpg', 'top'),
        ('ثبّت فهمك بالأسئلة', 'من «التدريب» أنشئ اختبارًا: الوضع، ونوع الأسئلة، والفصول، والمستوى، والعدد؛ واقرأ الشرح بعد كل إجابة.', 'help_practice.jpg', 'top'),
        ('راجع بالبطاقات', 'بطاقات اليوم من الرئيسية، أو بطاقات فصل أو موضوع؛ اقلب البطاقة ثم اختر: أعرفها أو أعدها لاحقًا.', 'help_home.jpg', '62%'),
        ('المصادر', 'المراجعة السريعة، ' + ('وأدوية الأطفال' if PED else 'وأدوية الجراحة') + '، ومحطات OSCE، والمحاضرات والفيديو، وملاحظاتك المحفوظة.', 'help_resources.jpg', 'top'),
        ('علّم واحفظ', 'حدّد النص لتظلّله أو تضع خطًّا تحته أو تكتب ملاحظة، واحفظ الموضوع بالعلامة لتعود إليه بسهولة.', 'help_reader.jpg', 'top'),
        ('تابع تقدّمك', 'علّم الصفحة «قرأتها» أو «أتقنتها»، وتابع نسبة التقدّم وأيام المذاكرة المتتالية من الرئيسية.', 'help_home.jpg', '28%'),
    ]
    g = ''
    for k, (t, d, im, pos) in enumerate(steps, 1):
        g += f'<div class="fp-c fp-st"><div class="fp-stt"><span class="fp-n">{k}</span><b>{t}</b><p>{d}</p></div>{phone(im, pos)}</div>'
    b = head('كيفية استخدام الكتاب والتطبيق', 'How to use the book', sub='دليل مبسّط للاستفادة من الكتاب وأدوات الدراسة.')
    b += f'<div class="fp-g2 fp-sts">{g}</div>'
    flow = ['قراءة الموضوع', 'فهم الفكرة', 'حلّ الأسئلة', 'مراجعة البطاقات', 'العودة للنقاط الصعبة']
    b += sec('طريقة مقترحة للمذاكرة', '<div class="fp-flow">' + '<i>←</i>'.join(f'<span>{x}</span>' for x in flow) + '</div>', 'book')
    b += sec('قبل الامتحان', '<div class="fp-c fp-in"><p>استفد من <b>المراجعة السريعة</b> في آخر الكتاب، وتدرّب على <b>محطات OSCE</b>، وأعد الاختبار على '
          'الأسئلة التي أخطأت فيها، وركّز على المواضيع التي تحتاج إلى تعزيز.</p></div>', 'clip')
    b += '<p class="fp-motto">الفهم أولًا، ثم التدريب والمراجعة.</p>'
    return wrap('howto', b)


# ---------- 5. study tools ----------
def tools():
    def row(k, t, d):
        return f'<div class="fp-tl">{ic(k, "fp-ti")}<div><b>{t}</b><p>{d}</p></div></div>'
    b = head('أدوات الدراسة', 'Study tools', sub='كل ما تفعله في الكتاب يُحفظ ويُزامَن بين أجهزتك تلقائيًا عند الاتصال بالإنترنت.')
    b += '<div class="fp-tw"><div class="fp-tc">'
    b += hpill('علّم على النص', 'hl')
    b += ('<div class="fp-c">' + row('hl', 'تظليل', 'حدّد الكلمات كما تفعل عادةً؛ يظهر شريط فيه ستة ألوان للتظليل.')
          + row('ul', 'خط تحت الكلام', 'من الشريط نفسه: أربعة ألوان للخط تحت النص.')
          + row('note', 'ملاحظة', 'اكتب ملاحظتك على الجملة المحدّدة، وتجد ملاحظاتك كلها في «ملاحظاتي».')
          + row('eye', 'تعديل أو حذف', 'المس أي علامة لتغيّر لونها أو تحذفها أو تضيف إليها ملاحظة.') + '</div>')
    b += hpill('أدوات القلم', 'pen')
    b += ('<div class="fp-c">' + row('pen', 'قلم', 'اكتب وارسم على الصفحة بسبعة ألوان وستة أحجام، ويعمل مع قلم الشاشة.')
          + row('marker', 'ماركر', 'تظليل حرّ بإصبعك على أي جزء من الصفحة.')
          + row('text', 'نص', 'المس الصفحة واكتب نصًّا، ثم حرّكه أو عدّله.')
          + row('page', 'صفحة فارغة', 'أضف صفحة بيضاء أو مسطّرة بعد الصفحة الحالية لملاحظاتك.')
          + row('undo', 'تراجع وإعادة', 'تتراجع عن آخر تغيير أو تعيده.') + '</div>')
    b += '</div><div class="fp-tc">'
    b += hpill('في شاشة القراءة', 'book')
    b += ('<div class="fp-c">' + row('zoom', 'حجم الصفحة والصفحة الكاملة', 'كبّر الصفحة، أو أخفِ الأشرطة لتقرأ على الشاشة كلها.')
          + row('bm', 'حفظ الموضوع', 'علامة الحفظ أعلى الصفحة، وتجد المحفوظ في «المحتويات».')
          + row('list', 'المحتويات ورقم الصفحة', 'انتقل إلى أي موضوع، أو المس رقم الصفحة واكتب الصفحة التي تريدها.')
          + row('check', 'علامة الصفحة', '«قرأتها» أو «أتقنتها» لتتابع تقدّمك.')
          + row('video', 'المحاضرات والفيديو', 'محاضرة الموضوع وفيديو شرحه من شريط القراءة.') + '</div>')
    b += hpill('وفي التطبيق أيضًا', 'layers')
    b += ('<div class="fp-c">' + row('search', 'البحث', 'في المواضيع وصفحات الكتاب والبطاقات والأسئلة، بالعربية أو الإنجليزية.')
          + row('sync', 'المزامنة', 'ملاحظاتك وتقدّمك على كل أجهزتك.')
          + row('globe', 'اللغة والمظهر', 'عربي أو إنجليزي، نهاري أو ليلي، ولون التطبيق.')
          + row('phone', 'الاشتراك والأجهزة', 'اشترك من «الإعدادات ← الاشتراك»، وأضف جهازًا آخر برقم الربط.') + '</div>')
    b += '</div></div>'
    b += (f'<div class="fp-help">{ic("wa")}<span>إن واجهتك مشكلة أو وجدت خطأً، راسلنا من «الإعدادات ← المساعدة» أو على واتساب '
          '<b class="en">0116984258</b>.</span></div>')
    return wrap('tools', b)


# ---------- 6. references ----------
def references():
    if PED:
        local = [('Pediatric Summaries (Dr. Asma Hadida)', 'ملخّصات شاملة لطب الأطفال العام والأجهزة: أساس ترتيب أغلب المواضيع وعمقها.'),
                 ('Kibreet Notes in Pediatrics (A and B)', 'ملاحظات محلية مختصرة لكل جهاز، مع العلاج المعمول به في مستشفياتنا.'),
                 ('Aljazeera Pediatrics', 'محاضرات من مستشفيات التعليم السودانية: الممارسة المحلية والحالات الشائعة.'),
                 ('Neonatology notes (2024)', 'إنعاش المولود، واليرقان، والإنتان، ورعاية حديثي الولادة.'),
                 ('Pediatrics MCQs (MED 06)', 'أسئلة امتحانات سابقة لاختيار ما يُركَّز عليه؛ وصُحّحت الإجابات الخاطئة.'),
                 ('Shendi cases (Izzat Qaderi, 2022) · Osman cases', 'حالات سريرية بأسئلتها: للحالات و«الخطوة التالية».')]
        books = [('Illustrated Baby Nelson', 'المرجع للتحقق من المعلومات والتصنيفات والجرعات في كل موضوع.'),
                 ('Case Files: Pediatrics (5th ed)', 'حالات ونقاط قرار؛ وأسئلة هذا الكتاب مكتوبة من جديد وليست منسوخة.')]
        osce = [('Pediatrics OSCE notes · Obaidia OSCE sheet', 'محطات OSCE، والقصة المرضية المركّزة، وخطوات الفحص.')]
        guides = [('WHO', 'كتيّب رعاية الأطفال في المستشفى، وIMCI، وETAT، وسوء التغذية الحاد، ومعايير النمو، والملاريا، والسل، والالتهاب الرئوي.'),
                  ('EPI · CMAM', 'البرنامج الموسّع للتطعيم، والإدارة المجتمعية لسوء التغذية الحاد.'),
                  ('GINA · NICE · AHA', 'الربو، والتهاب القصيبات والحمّى، والحمّى الروماتيزمية والتهاب الشغاف.'),
                  ('ASH · TIF · WFH · ESPGHAN', 'نقص الصفائح وفقر الدم المنجلي، والثلاسيميا، والهيموفيليا، والإمساك.')]
    else:
        local, books, osce, guides = [], [], [], []
    def items(lst, k):
        return ''.join(f'<div class="fp-c fp-rf">{ic(k, "fp-ti")}<div><b class="en">{html.escape(a)}</b><p>{d}</p></div></div>' for a, d in lst)
    b = head('مراجع الكتاب', 'References', sub='المراجع العلمية والمصادر التعليمية التي استند إليها إعداد المحتوى.')
    b += sec('الكتب المرجعية', f'<div class="fp-g2">{items(books, "book")}</div>', 'book')
    b += sec('المذكّرات والمصادر المحلية', f'<div class="fp-g2">{items(local, "note")}</div>', 'note')
    b += sec('الفحص السريري ومحطات OSCE', f'<div class="fp-g2 fp-g1">{items(osce, "clip")}</div>', 'steth')
    b += sec('الإرشادات والبرامج', f'<div class="fp-g2">{items(guides, "shield")}</div>', 'shield')
    b += ('<p class="fp-motto fp-sm">الصور السريرية من مصادر مفتوحة ومجموعات تعليمية، وكل صورة بجانب نصّها؛ والرسوم والمخطّطات رُسمت لهذا '
          'الكتاب. نقدّر إسهام أصحاب هذه المراجع في التعليم الطبي.</p>')
    return wrap('refs', b)


CSS = r'''
/* fp:start — front pages in the poster design (tools/frontpages.py; do not edit by hand) */
.fp{position:absolute;inset:0;z-index:1;display:flex;flex-direction:column;justify-content:space-between;padding:28px 42px 54px;box-sizing:border-box;direction:rtl;text-align:right;font-family:'Cairo','Inter',sans-serif;color:#1d2622;
  --fpd:DEEP;--fpp:PRI;--fps:SEL;--fpb:BG;--fpbd:BD;--fpg:GOLD;
  background:radial-gradient(520px 340px at 0% 0%,color-mix(in srgb,var(--fps) 80%,transparent),transparent 70%),
    radial-gradient(560px 360px at 100% 100%,color-mix(in srgb,var(--fps) 75%,transparent),transparent 70%),linear-gradient(180deg,var(--fpb),#fff 45%,var(--fpb))}
.page:has(>.fp) .ftr{z-index:2}
.page:has(>.fp) .ftr b{color:var(--fpd,#333)}
.fp *{box-sizing:border-box}
.fp .en{font-family:'Inter',sans-serif;direction:ltr;unicode-bidi:isolate}
.fp p{margin:0;font-size:10.4pt;line-height:1.72}
.fp p+p{margin-top:5px}
.fp-hd{text-align:center}
.fp-hd2{display:flex;align-items:center;gap:22px;text-align:center}
.fp-hd2 .fp-hdt{flex:1}
.fp-ser{display:flex;align-items:center;gap:14px;justify-content:center;color:var(--fpd);font:italic 600 12.5pt 'Source Serif 4',Georgia,serif;direction:ltr}
.fp-ser::before,.fp-ser::after,.fp-en::before,.fp-en::after{content:"";flex:0 1 110px;height:1px;background:color-mix(in srgb,var(--fpd) 35%,transparent)}
.fp-t{margin:2px 0 0;font:700 31pt/1.3 'Cairo',sans-serif;color:var(--fpd)}
.fp-en{display:flex;align-items:center;gap:14px;justify-content:center;font:600 9pt 'Inter',sans-serif;letter-spacing:4.5px;text-transform:uppercase;color:var(--fpp);direction:ltr;margin-top:2px}
.fp-pill{display:inline-block;margin-top:8px;padding:3px 26px;border-radius:30px;background:var(--fps);color:var(--fpd);font:italic 600 12.5pt 'Source Serif 4',Georgia,serif;direction:ltr}
.fp-sub{margin-top:7px!important;color:#55635c;font-size:10.6pt!important}
.fp-h{display:flex;align-items:center;gap:14px;margin:0 0 9px}
.fp-tc>.fp-h{margin-top:12px}
.fp-h::before,.fp-h::after{content:"";flex:1;height:1px;background:color-mix(in srgb,var(--fpd) 30%,transparent)}
.fp-h span{display:inline-flex;align-items:center;gap:8px;padding:4px 26px;border-radius:30px;background:var(--fpd);color:#fff;font:700 13pt/1.5 'Cairo',sans-serif;box-shadow:0 3px 10px color-mix(in srgb,var(--fpd) 25%,transparent)}
.fp-h .fp-i{width:17px;height:17px;color:var(--fpg)}
.fp-c{background:rgba(255,255,255,.88);border:1px solid var(--fpbd);border-radius:15px;padding:10px 16px;box-shadow:0 4px 14px rgba(20,40,30,.06)}
.fp-ct{display:flex;align-items:center;justify-content:center;gap:7px;margin:0 0 7px;padding:3px 10px;border-radius:10px;background:var(--fps);color:var(--fpd);font:700 12.5pt/1.5 'Cairo',sans-serif;text-align:center}
.fp-ct .fp-i{width:17px;height:17px}
.fp-g2{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.fp-g3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px}
.fp-g1{grid-template-columns:1fr}
.fp-lead p{font-size:10.8pt;text-align:justify}
.fp-in{background:linear-gradient(90deg,color-mix(in srgb,var(--fps) 60%,#fff),#fff,color-mix(in srgb,var(--fps) 60%,#fff))}
.fp-in p{text-align:center}
.fp-motto{text-align:center!important;color:var(--fpd);font-weight:700;font-size:11.5pt!important}
.fp-motto.fp-sm{font-weight:600;font-size:9.6pt!important;color:#55635c}
/* authors */
.fp-au{display:flex;gap:22px;align-items:stretch;height:340px}
.fp-aur{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:space-between;text-align:center}
.fp-names b{display:block;font:700 19pt/1.45 'Cairo',sans-serif;color:var(--fpd)}
.fp-names{border-bottom:1px solid color-mix(in srgb,var(--fpd) 25%,transparent);padding-bottom:6px;width:90%}
.fp-cov{position:relative;display:flex;justify-content:center;padding-bottom:14px}
.fp-cov img{height:170px;border-radius:5px;box-shadow:0 10px 22px rgba(0,0,0,.28),0 2px 4px rgba(0,0,0,.2);position:relative;z-index:1}
.fp-cov i{position:absolute;bottom:2px;left:50%;transform:translateX(-50%);width:210px;height:26px;border-radius:50%;background:radial-gradient(closest-side,#e9dcc6,#d8c6a6 70%,transparent)}
.fp-covs img{height:150px}.fp-covs i{width:170px}
.fp-cap{font-size:10.2pt!important;color:#3d4a43;line-height:1.6!important}
.fp-ph{width:330px;border-radius:22px;overflow:hidden;border:3px solid #fff;outline:2px solid var(--fpbd);box-shadow:0 10px 26px rgba(20,40,30,.16);background:linear-gradient(160deg,var(--fps),#fff)}
.fp-ph img{width:100%;height:100%;object-fit:cover;object-position:center 12%}
.fp-g3 .fp-c p{font-size:9.9pt;line-height:1.72;text-align:justify}
/* edition */
.fp-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:10px}
.fp-stats div{background:var(--fpd);color:#fff;border-radius:14px;padding:7px 4px;text-align:center;box-shadow:0 4px 12px color-mix(in srgb,var(--fpd) 25%,transparent)}
.fp-stats b{display:block;font:800 19pt/1.2 'Inter',sans-serif;color:var(--fpg)}
.fp-stats span{font:600 10pt 'Cairo',sans-serif}
.fp-nx{display:flex;gap:8px;align-items:flex-start;margin-top:6px!important;padding:5px 10px;border-radius:10px;background:var(--fpb);color:var(--fpd);font-size:10pt!important}
.fp-nx .fp-i{width:18px;height:18px;flex:none;margin-top:4px}

.fp-g2 .fp-c p{font-size:9.9pt;text-align:justify}
.fp-cr{font-size:8.6pt!important;font-weight:700;color:var(--fpd);text-align:center!important}
.fp-ban ul{margin:0 0 6px;padding:0 18px 0 0;columns:2;column-gap:26px}
.fp-ban li{font-size:9.9pt;line-height:1.65;margin-bottom:2px}
.fp-ban li::marker{color:var(--fpp)}
.fp-ban p{font-size:9.9pt;text-align:justify}
/* reviewers */
.fp-rvi{margin-top:4px}
.fp-rvg{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.fp-rv{display:flex;align-items:center;gap:14px;background:rgba(255,255,255,.92);border:1px solid var(--fpbd);border-radius:16px;padding:13px 14px;box-shadow:0 4px 14px rgba(20,40,30,.06)}
.fp-av{width:82px;height:82px;flex:none}
.fp-rvt{flex:1;border-right:2px solid var(--fps);padding-right:12px}
.fp-rvt b{display:block;font:700 15pt/1.4 'Cairo',sans-serif;color:var(--fpd)}
.fp-ro{display:block;font:600 9.6pt 'Cairo',sans-serif;color:var(--fpp)}
.fp-u{display:flex;align-items:center;gap:5px;font:600 10pt 'Cairo',sans-serif;color:#2b3631;margin-top:2px}
.fp-u .fp-i{width:15px;height:15px;color:var(--fpg)}
.fp-ue{display:block;font-size:8pt;color:#6b7771;text-align:right}

.fp-heads .fp-rv{padding:16px 16px;border:1.5px solid color-mix(in srgb,var(--fpp) 45%,transparent);background:linear-gradient(135deg,#fff,var(--fpb))}
.fp-heads .fp-av{width:92px;height:92px}
.fp-heads .fp-rvt b{font-size:17pt}
.fp-role{display:inline-block;margin:3px 0 2px;padding:1px 16px;border-radius:20px;background:var(--fps);color:var(--fpd);font:700 10.4pt/1.6 'Cairo',sans-serif}
.fp-rvend{display:flex;align-items:center;gap:20px}
.fp-rvend .fp-cov{flex:none;width:210px}
.fp-rvend .fp-cov img{height:190px}
.fp-thk{flex:1;padding:16px 26px;border-radius:22px;background:linear-gradient(135deg,var(--fpd),color-mix(in srgb,var(--fpd) 70%,var(--fpp)));color:#fff;text-align:center;box-shadow:0 8px 22px color-mix(in srgb,var(--fpd) 30%,transparent)}
.fp-thk b{display:block;color:#fff;font:700 20pt/1.5 'Cairo',sans-serif;border-bottom:1px solid rgba(255,255,255,.3);padding-bottom:4px;margin-bottom:6px}
.fp-thk p{font-size:11pt;line-height:1.8;text-align:center!important;color:#eef4f0!important}
/* how to */
.fp-sts{gap:10px}
.fp-st{display:flex;gap:12px;align-items:center;padding:10px 12px;min-height:178px}
.fp-stt{flex:1}
.fp-n{float:right;width:30px;height:30px;margin-left:8px;border-radius:50%;background:var(--fpd);color:#fff;display:grid;place-items:center;font:800 12pt 'Inter',sans-serif;box-shadow:0 0 0 3px var(--fps)}
.fp-stt b{display:block;font:700 13.5pt/1.5 'Cairo',sans-serif;color:var(--fpd);min-height:32px}
.fp-stt p{font-size:9.9pt;line-height:1.7;clear:both;padding-top:4px}
.fp-pho{width:88px;height:158px;flex:none;border-radius:14px;border:3px solid #1e2522;overflow:hidden;background:#fff;box-shadow:0 6px 14px rgba(0,0,0,.18)}
.fp-pho img{width:100%;height:100%;object-fit:cover}
.fp-flow{display:flex;align-items:center;justify-content:center;gap:6px;flex-wrap:wrap;padding:8px 10px;border-radius:14px;background:rgba(255,255,255,.88);border:1px solid var(--fpbd)}
.fp-flow span{padding:3px 12px;border-radius:20px;background:var(--fpb);border:1px solid var(--fpbd);font:700 10.4pt 'Cairo',sans-serif;color:var(--fpd)}
.fp-flow i{font-style:normal;color:var(--fpp);font-weight:700}
/* tools */
.fp-tw{display:flex;gap:12px;flex:1;margin:14px 0}
.fp-tc{flex:1;display:flex;flex-direction:column}
.fp-tc>.fp-h:first-child{margin-top:0}
.fp-tc>.fp-c{flex:1;padding:6px 14px;display:flex;flex-direction:column;justify-content:space-evenly}
.fp-tl{display:flex;gap:10px;align-items:flex-start;padding:5px 0;border-bottom:1px dashed var(--fpbd)}
.fp-tl:last-child{border-bottom:0}
.fp-ti{width:26px;height:26px;flex:none;padding:4px;border-radius:8px;background:var(--fps);color:var(--fpd)}
.fp-tl b{display:block;font:700 11.6pt/1.4 'Cairo',sans-serif;color:var(--fpd)}
.fp-tl p{font-size:10pt;line-height:1.6}
.fp-help{display:flex;align-items:center;gap:10px;margin-top:10px;padding:8px 16px;border-radius:14px;background:var(--fpd);color:#fff;font:600 10.2pt/1.6 'Cairo',sans-serif}
.fp-help .fp-i{width:22px;height:22px;color:var(--fpg);flex:none}
.fp-help b{color:var(--fpg)}
/* references */
.fp-rf{display:flex;gap:10px;align-items:flex-start;padding:8px 12px}
.fp-rf b{display:block;font:700 10.2pt/1.45 'Inter',sans-serif;color:var(--fpd);text-align:right}
.fp-rf p{font-size:9.6pt;line-height:1.6}
/* a poster sent by the owner fills the page */
.fp.fpimg{padding:0;background:#fff}
.fpimg .fpbg{position:absolute;inset:-20px;background-size:cover;background-position:center;filter:blur(18px) saturate(1.1);opacity:.55}
.fpimg img{position:absolute;inset:0;width:100%;height:100%;object-fit:contain}
.page:has(>.fp.fpimg) .ftr{display:none}
/* fp:end */
'''


def main():
    pages = {'authors.html': authors(), 'about.html': about(), 'reviewers.html': reviewers(),
             'howto-app.html': howto(), 'howto-tools.html': tools(), 'references.html': references()}
    for f, s in pages.items():
        (C / f).write_text(s)
    css = CSS
    for k, v in (('DEEP', BK['deep']), ('PRI', BK['pri']), ('SEL', BK['sel']), ('BG', BK['bg']), ('BD', BK['bd']), ('GOLD', BK['gold'])):
        css = css.replace(k, v)
    ap = ROOT / 'src' / 'app.css'
    a = ap.read_text()
    a = re.sub(r'\n?/\* fp:start[\s\S]*?/\* fp:end \*/\n?', '\n', a).rstrip() + '\n' + css.strip() + '\n'
    ap.write_text(a)
    print(f'{BK["name"]}: {len(ed1)} chapters, {len(ids)} topics, {ncards} cards, {nq} questions; owner posters: {sorted(OWNER) or "none"}')


if __name__ == '__main__':
    main()
