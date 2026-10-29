#!/usr/bin/env python3
"""Add the author's audio lectures: one recording per book page.

    python3 tools/audio.py 64 rec_64.ogg 65 rec_65.m4a ...      # page number as shown on the page (top right)
    python3 tools/audio.py appendicitis:1 rec.ogg               # or the page key (topic id : page of the topic)
    python3 tools/audio.py --remove appendicitis:1              # delete a lecture page

Any audio or video file ffmpeg can read works (WhatsApp voice notes, phone recordings, mp4).
Each one becomes content/audio/<topic>-<n>.mp3: mono 40 kbps speech, loudness evened out, silence at the start removed, long pauses shortened.
Keys stay valid when pages move, so build page numbers first (python3 build.py), then run this, then build again.
"""
import json, re, subprocess, sys, tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
AD = ROOT / 'content' / 'audio'
sys.path.insert(0, str(ROOT))


def page_keys():
    t = (ROOT / 'docs' / 'index.html').read_text()
    meta = json.loads(re.search(r'<script type="application/json" id="meta">(.*?)</script>', t, re.S).group(1).replace('<\\/', '</'))
    from build import page_keys as pk
    return pk(meta['pages'])


def probe(f):
    out = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', str(f)], capture_output=True, text=True).stdout
    return float(out.strip())


def main(a):
    AD.mkdir(parents=True, exist_ok=True)
    idx_f = AD / 'index.json'
    idx = json.loads(idx_f.read_text()) if idx_f.exists() else {}
    keys = page_keys()
    if a[:1] == ['--remove']:
        for k in a[1:]:
            name = k.replace(':', '-') + '.mp3'
            (AD / name).unlink(missing_ok=True)
            idx.pop(name, None)
            print('removed', name)
    else:
        if len(a) % 2:
            sys.exit(__doc__)
        for page, src in zip(a[::2], a[1::2]):
            key = keys[int(page) - 1] if page.isdigit() else page
            if ':' not in key or key not in keys:
                sys.exit(f'Page {page} is not a topic or Exam corner page ({key}).')
            name = key.replace(':', '-') + '.mp3'
            # silence at the start goes; pauses over 2 s shrink to 0.8 s (and the silent tail with them)
            trim = 'silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.3:stop_periods=-1:stop_duration=2:stop_threshold=-45dB:stop_silence=0.8'
            # two passes: ffmpeg 6 hangs when silenceremove and loudnorm share one filter chain
            with tempfile.TemporaryDirectory() as tmp:
                mid = Path(tmp) / 'trim.wav'
                subprocess.run(['ffmpeg', '-nostdin', '-y', '-v', 'error', '-i', src, '-vn', '-ac', '1', '-ar', '22050',
                                '-af', f'highpass=f=70,{trim}', str(mid)], check=True)
                subprocess.run(['ffmpeg', '-nostdin', '-y', '-v', 'error', '-i', str(mid), '-af', 'loudnorm=I=-16:TP=-1.5:LRA=11',
                                '-ar', '22050', '-b:a', '40k', str(AD / name)], check=True)
            idx[name] = {'sec': round(probe(AD / name), 1), 'bytes': (AD / name).stat().st_size}
            print(f'{name}: page {page} · {idx[name]["sec"] / 60:.1f} min · {idx[name]["bytes"] / 1e6:.1f} MB')
    idx_f.write_text(json.dumps(dict(sorted(idx.items())), indent=1) + '\n')


if __name__ == '__main__':
    main(sys.argv[1:])
