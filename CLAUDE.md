# Pediatrics Master Review

**Goal:** a pediatrics book app for **Shendi University** and other Sudanese medical students, 1st edition 2026,
Student Master Note series. Authors: **Dr. Abdaljalil Abdalkareem Arja** and **Dr. Alabass Abdulrahman** (Arabic
"About the authors" page right after the cover). Third book after Obstetrics Master Review and Surgery Master Review.
This project was made from the surgery app's build system (repo jaberarja555-create/surgery-rapid-review),
with the owner's obstetrics app as a second reference. Theme: the cover's dark teal-navy with gold.

## Owner's workflow
- The owner sends resources (PDFs, notes, MCQs) chapter by chapter; they go in `resources/`.
- When the owner writes **"deployment"**: rebuild and put the live book online with `bash server/deploy.sh`
  (needs CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID and PMR_ADMIN_PASSWORD — or SMR_ADMIN_PASSWORD — in the
  environment), then commit and push to GitHub.
- Show each finished chapter in the preview artifact before starting the next.

## Content rules (from the owner, same as his obstetrics and surgery books)
- Student level, exam first (MCQs, cases, OSCE): short, dense, one-flow notes; a topic readable in a few pages.
- Follow what Sudan guidelines and teaching hospitals agree on (national protocols, IMCI, ETAT, SAM); doses that
  are used in our hospitals, per kg, with frequency and duration. Do not show many competing guidelines.
  For unsure facts: owner's resources first, then Sudan guidelines, then universal guidelines — decide, don't ask.
- Formal, clear, standard textbook headings; no catchy titles, no gimmick mnemonics, no meta text
  (how to use, who it is for), no build-status text anywhere in the book. Only common abbreviations.
- Real clinical pictures where they help understanding or are exam-important (owner makes or finds them; list
  the pictures needed for each chapter with exact search specs). No credits/licence text on the pages.
- Never delete or shorten content just to make a page fit. Each chapter has its own colour (book.json).
- Flashcards ("how it is asked" Q&A) live in the Cards decks, not in the chapter. OSCE (history and examination,
  English and Arabic) is its own chapter (14). Drugs & doses is chapter 15 (use, mechanism, dose per kg,
  frequency, duration, side effects, contraindications).
- The chapter list in book.json is a draft made before the resources arrived: adjust it to the resources.
- Contents lists every planned topic; a topic without `content/topics/<id>.html` shows without a page number
  (book) and as "Soon" (home). `contents_split` in book.json = chapters that start a new contents page.

## Owner's writing rules for this book (Oct 2026, stricter than the obstetrics book)
- **Clear and formal**: standard textbook wording, standard abbreviations only (each added to abbreviations.txt);
  nothing casual or funny like the obstetrics book had.
- **Sudan protocols first, local resources preferred** (Asma Hadida, Kibreet, Aljazeera, Shendi cases, Osman,
  MED 06 MCQs); Baby Nelson and Case Files check facts. Where resources disagree, use the value the MCQ keys and
  Sudan/WHO protocols agree with.
- **Not a textbook**: everything the student needs, short and simple; every line exam-important; no background.
- **Read every resource that covers the topic** before writing it (owner checks this): list them in the reply.
- Pages clear and pleasant to read, normal text size, pictures only where they matter.
- Topic 1.1 (growth.html) is the model for later topics.
- **Exam boxes inside the pages (owner):** each topic has coloured boxes at the end of the section they belong to:
  `box trap` **Exam trap** (MCQ favourites, "all EXCEPT" traps), `box next` **Best next step**, `box guide`
  **Sudan protocol · …** (local programme or protocol). A fact in a box is not repeated in the side column.

## App shape (copy from the reference)
- One-screen mobile-first web app: dark top bar (title + theme toggle), scrolling view, bottom tabs:
  **Home · Read · Cards · Search**.
- **Home**: cover hero, "Continue reading" button, topic tiles (number badge + title + subtopics), study tools.
- **Reader**: real "book pages" (fixed-width A4-like `<section class="page">`) scaled to screen width,
  page counter, tools in a side rail on the right (owner, like Xodo; Arabic labels; top button hides it, a small tab brings it back, state in `prr-rail`; while it shows, the pages shrink to the space left of it; when hidden, the pages use the full width and the show button sits in the top bar beside the night button, so nothing ever covers the text):
  **Undo / Redo** (bottom of the rail: every change to highlights, underlines, notes, page progress, drawings and text; state snapshots,
  restored as normal changes so they sync) · Contents · Night · Highlighter pen (colour + on/off in its panel; pen on = highlight at once: mouse selection, finger swipe along a line, or long-press a word; pen off = colour bar after selecting) · Underline **خط** (quick tool like the highlighter: 4 colours, 3 thicknesses, on/off; saved in the highlights list as c=ur/uk/ub/uo, uw=1–3;
  pen-off: the selection bar has **U خط**) · Pen **قلم** (red/black/blue/orange, sizes, on/off; while on, a tool bar: free pen · arrow · straight line · eraser ·
  undo · redo · close; one finger draws, two fingers scroll;
  sizes 1–5; strokes in `prr-ink` per page key as SVG points in 816×1152 page units, each with id + u; undo/clear
  leave tombstones in `prr-inkdel`; synced) · Text **نص** (own tool: colour + size; tap the page to write; tap a text → edit · move · delete;
  mouse can drag it; stored with the drawings as t='t') · Notes (same panel style: note pen on/off, with it on the selection opens the note box at once; "show all" opens the Notes sheet; one pen at a time) · Notes · Listen · page progress ·
  Page size panel (− / + by 10 %, fill screen width, whole page in view, normal; Ctrl + wheel / touchpad pinch; on phones: % of the screen width,
  ±25 % steps, ×1.5 ×2 ×3, two-finger pinch on the pages; saved in `prr-zoom`; the reader scrolls sideways when wider). Tapping a highlight lets the student change its colour.
- **Home** (owner): gold text (`.gold`) and a light sweeping across the cover and buttons (`.shine`); **Daily flashcards** card
  (10 cards a day, unknown first, same set all day, streak counter; `Today` deck in Cards).
- **Audio lectures** (owner, like the obstetrics book): one recording per book page. Add with `python3 tools/audio.py <page no.> <file> ...`
  (any audio/video; becomes `content/audio/<topic>-<n>.mp3`, mono 40 kbps, loudness evened, long pauses shortened; durations in
  `content/audio/index.json`), then `python3 build.py`. Home **Lectures** tile → Lectures screen (download for offline, Cache API `prr-audio`);
  player bar plays a topic page by page and turns the book page; reader pill **Listen/Playing**; free-trial devices hear free topics only.
- **Cards**: decks per topic (chips), card shows `TOPIC · SECTION` + question, tap to flip, **Again / Knew it**,
  known-count progress bar.
- **Search**: full-text across pages, quick chips.
- **Look** (owner): the app (Home, cards, QBank, search) is always the dark-blue theme; the book pages have **3 looks** from the top-bar button (shown in the reader; it opens a small menu): **day** (white, the default), **eye comfort** (warm sepia paper) and **night** (dark); saved in `prr-bmode`; no Night button in the side rail; state in `localStorage` (keys prefixed `prr-`; reference used `orr-`).
- New for surgery (owner asked): **highlighting** (select text → save, persists) and **progress**
  (pages read per topic, cards known per deck). The reference does not have these yet.
- **Page progress (owner):** set only by the student with the side-rail button: it opens a panel to choose **ما قريتها** Not read (red, falling tone),
  **قريتها** Done (blue, soft chime) or **أتقنتها** Mastered (green star, rising chime); each choice has its own sound.
  Home topic rows show each topic's own bar (blue done, green mastered) and "x/y done · z mastered" (not on locked topics). Stored in `prr-prog` (page key → 1/2); nothing is marked automatically.
- Avoid the reference bug: page labels were double-escaped (`&amp;` shows in the reader subtitle).

## Page anatomy (a topic is as many pages as it needs)
Header strip (chapter name · section label) → `kicker` (number + chapter) → `h1.t` title → `p.sub` page subtitle.
Two columns: **main** and **side**.

Main column building blocks:
- `h2.s` section headings: Definition · Aetiology & risk factors · Pathophysiology · Clinical features ·
  Investigations · Differential diagnosis · Complications · Management.
- `table.t` two-column definition tables (`td.hl` for highlighted row label).
- `div.two` side-by-side text/list; `ul.b` bullet lists; `ol.steps`.
- `div.fig` inline SVG flow diagrams (pathophysiology), colours via CSS vars so night mode works.
- `div.ladder` severity/step ladder (`.st`, `.st.gold`, `.st.dark`).
- Boxes: `box core` (core management), `box trap` (**Exam trap**), `box next` (**Best next step**).
- `span.dose` for drug doses. `div.photo` / `div.photos` clinical images with `.cap` captions (files in `img/`).

Side column (every topic page):
- **Formula**: `clue + clue + clue = ANSWER`.
- **Numbers**: `table.numt` key figures.
- **Clue switch · the detail that flips the answer**: rows `clue → answer`.
- **Try it · exam-style**: 2 short questions with answers.

End-of-book **Rapid review** page: every clue → answer (`.frow` rows).

## Writing style
**Clear, standard headings (owner):** use the terms students know from lectures and textbooks ("Blood investigations on admission", "Clinical features", "Indications for surgery"), never slang or riddles ("Bloods", "The plan", "One stone, many pictures").
Abbreviations used in the book are listed in `content/abbreviations.txt`: add any new one there (no list pages). Every abbreviation in the list, and every
word in `content/glossary.txt` (`term / forms | short definition`), shows its meaning on hover (computer) or tap (phone) in the book, flashcards
and QBank (app.js `termify`). Add new difficult words to the glossary. Topic mentions link to their topic via `content/links.json` (phrases per topic id).
Short, plain, exam-focused. Bold the keyword in each line. Use symbols (↑ ↓ → · ≥). Numbers and doses
that are used in practice. No padding, no long paragraphs.

## Flashcards
JSON decks: `{ deckId: { short: "Name", cards: [[section, question, answer], ...] } }`.
About 25–40 cards per topic, one fact per card, answers one or two lines.

## How the project is built (read this first in a new session)
- `content/book.json`: book details + chapter list (each chapter has a base `color`; tints are generated).
  Topic ids there decide which file is used. A topic with no file shows as "Coming soon".
- `content/topics/<id>.html`: one file per topic. Each page is `<page sub="Page subtitle"> main column … <aside> side column </aside></page>`.
  Write only the body: header, kicker, title, page numbers, footer, contents and Rapid Review pages are generated.
  Rapid Review is built automatically from every Formula strip and Clue-switch row.
- `content/decks/<id>.json`: flashcards `[[section, question, answer], ...]`.
- `content/img/`: images (cover.webp, icon.png, clinical photos). Name photos `<topic>_<thing>.jpg`, ≤ 900 px wide.
  The owner may send photos in a Word file: unzip the .docx and take `word/media/*`; labels under each picture say where it goes.
  **Photo layout rule (owner):** no small centred photo strips in the middle of a page (owner: "bad").
  Fill the width: a photo beside its text/list/box (`div.two` with `div.photo`), or `div.photos` side by side
  across the full column (see appendicitis). Drop poor-quality pictures rather than squeeze them in.
  Captions credit the source. Keep ≥ 40 px free at the bottom of every page (check.js; owner sees less room on the phone).
- `src/`: app shell, CSS, JS, manifest, service worker. Change these only for app features.
- Build: `python3 build.py` → `docs/` (committed) and `artifact/index.html` (not committed). Review copy is published
  with the Artifact tool from `artifact/index.html` + every file in content/img as `img/<name>` to
  https://claude.ai/artifact/TCV2sVb8tfxrEzcET5D1jX (pass it as `url` from a new session). The review copy is always fully unlocked
  (build.py patches LOCKED in artifact/index.html only); the live book keeps the free-trial lock.
- Workflow: one chapter at a time; show the owner each finished chapter (republish the artifact) before starting
  the next. The book must be illustrated: SVG diagrams/ECGs/flowcharts drawn in-page; clinical photos where they help.
- Check: `node check.js [screenshot-dir]` must print "All pages fit." If a column is too long, move or
  trim content (move a section to another page of the topic, or add a page). Never shrink fonts.
- Resources are in `resources/` (the owner sends them chapter by chapter; keep a `resources/README.md` saying what each
  file is for). For each topic read every resource that covers it; put extracted text in `resources/text/` (not committed).

## Subscription (free trial + activation codes)
- `book.json` → `access`: free topics (owner's model, from the obstetrics app: the first topic of each chapter; `free_label` is the short Arabic line shown instead of the topic list; the drugs chapter is not free) with ALL their flashcards / questions (`"all"`); a chapter whose topics are all free also has a free Exam corner;
  one code opens up to 2 devices (student sends both device codes), WhatsApp, price, Bankak account. Empty fields are hidden. Subscription text is in Sudanese Arabic (English terms kept).
- Online: `server/` = one Cloudflare Worker serving the book (docs/) + `/admin` control page + `/check`; see server/DEPLOY.md.
- Codes work like Dr. Arja Master Note: the owner makes codes `PMR-XXXX-XXXX` on `/admin` (note = buyer's name/phone, Copy message for WhatsApp,
  Reset devices, Switch off/on, Delete). The student types the code in the app (or opens `<app url>#code=PMR-…`); the Worker's `/activate` binds the
  device (`prr-dev`, max 2 per code, stored in a SQLite Durable Object, class CodesDB in worker.js) and returns a token `DEV.sig` (ECDSA P-256 signature of `PMR|pediatrics|1|<DEV>`), checked with
  `access.public_key` so the book also opens offline. `/check` relocks a device whose code is off/reset/deleted. The PRIVATE key lives only in
  Cloudflare (secret PRIVATE_KEY): never commit it.
- **Sync (owner): everything the student saves** — highlights, notes, drawings (`ink`/`idel`, per stroke id), page progress, and (`sm`, app.js `SM`:
  key maps stamped in `prr-smu`, newest per key wins) flashcards known, QBank answers/marks, previous tests, daily streak and last page — (`prog` = page key → [state, time], newest wins) are shared by the devices of one code: `POST /sync` (device proves itself with its token; data in the
  `sync` table of CodesDB, versioned). app.js merges per highlight (id = page key + start + end, `u` = last change, deletions kept in `prr-hldel`);
  syncs on open, 4 s after a change, when back online, and from **Sync now** in the Notes sheet. Free-trial devices do not sync.
- Locked: pages of non-free topics, Exam corners of non-free chapters, Rapid review, other decks and questions.
