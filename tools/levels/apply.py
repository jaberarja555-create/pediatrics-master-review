#!/usr/bin/env python3
"""Apply a chapter's reworded flashcards and questions (owner, 12 Nov 2026, as in the Obstetrics book: clean student-level
wording in complete sentences, standard medical terms, three levels: 1 easy = direct recall, 2 medium = understanding or
applying a fact, 3 hard = clinical reasoning, exceptions, several steps). No fact, number or dose is changed.

    python3 tools/levels/apply.py tools/levels/ch1.py

The chapter file defines
  CARDS = {topic id: [(old index or None, section, question, answer, level), ...]}   (a dropped duplicate is simply left out)
  QS    = {topic id: {question index: dict(d=level, optional q=..., o=[...], e=...)}}
A card keeps the key of its old wording (5th field) and a reworded question keeps its old id ("id"), so what a student
already marked as known, answered or marked stays."""
import json, sys, runpy, os
R = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'content')


def h(s):
    """the app's string hash (cardKey / qid in src/app.js), base 36"""
    x = 0
    for ch in s:
        units = [ord(ch)] if ord(ch) < 65536 else [0xD800 + ((ord(ch) - 0x10000) >> 10), 0xDC00 + ((ord(ch) - 0x10000) & 0x3FF)]
        for u in units:
            x = (x * 31 + u) & 0xFFFFFFFF
    d = '0123456789abcdefghijklmnopqrstuvwxyz'
    o = ''
    while True:
        o = d[x % 36] + o
        x //= 36
        if not x:
            return o


m = runpy.run_path(sys.argv[1])
for tid, cards in m.get('CARDS', {}).items():
    f = os.path.join(R, 'decks', tid + '.json')
    old = json.load(open(f))
    if any(len(c) > 3 for c in old):
        print(tid, 'cards already done, skipped')
        continue
    seen = set()
    new = []
    for oi, sec, q, a, lv in cards:
        assert lv in (1, 2, 3), (tid, q)
        assert oi is None or oi not in seen, (tid, oi)
        seen.add(oi)
        new.append([sec, q, a, lv] + ([h(old[oi][1])] if oi is not None else []))
    missing = [i for i in range(len(old)) if i not in seen]
    print(tid, len(old), '->', len(new), ('dropped ' + str(missing)) if missing else '')
    open(f, 'w').write('[\n' + ',\n'.join(' ' + json.dumps(c, ensure_ascii=False) for c in new) + '\n]\n')

for tid, qs in m.get('QS', {}).items():
    f = os.path.join(R, 'qbank', tid + '.json')
    old = json.load(open(f))
    assert set(qs) == set(range(len(old))), (tid, 'every question needs a level', sorted(set(range(len(old))) - set(qs)))
    for i, ch in qs.items():
        q = old[i]
        assert ch['d'] in (1, 2, 3)
        if q.get('d'):
            continue
        if ch.get('q') and ch['q'] != q['q'] and not q.get('id'):
            q['id'] = h(tid + q['q'])
        if ch.get('o'):
            assert len(ch['o']) == len(q['o']), (tid, i)
        for k in ('q', 'o', 'e'):
            if ch.get(k):
                q[k] = ch[k]
        q['d'] = ch['d']
    print(tid, len(old), 'questions levelled')
    open(f, 'w').write('[\n' + ',\n'.join(json.dumps(q, ensure_ascii=False) for q in old) + '\n]\n')
