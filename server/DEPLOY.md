# Deploy (for the next Claude session)

**Automatic deploys (owner, 6 Nov 2026: like Surgery and Obstetrics, from either Claude account):** in Cloudflare, Workers & Pages →
pediatrics-master-review → Settings → Build → Connect this GitHub repo: production branch `main`, root directory `/`, build command
empty, deploy command `npx wrangler deploy` (the root `wrangler.toml` points to `server/worker.js` and `docs/`). After that every push
to `main` puts the live book online: rebuild (`node tools/pack.js` or `python3 build.py`), commit `docs/`, push to `main` (and to
`claude/confident-turing-evm4gu`, kept equal). Secrets (PRIVATE_KEY, ADMIN_PASSWORD) stay in Cloudflare. `bash server/deploy.sh` is
only for a first setup or if the connection is lost.

How subscription works (like Dr. Arja Master Note): the authors make codes `PMR-XXXX-XXXX` on `/admin` and send
one to each buyer on WhatsApp ("Copy message"). The student types it in the app (or opens `<book>#code=PMR-…`);
`/activate` binds that device (2 per code by default; the control page sets 1–10 for each code, column `maxdev`, added automatically to old stores) and returns a signed token, so the book then opens offline too.
`/check` (when online) locks the device again if its code is switched off, reset or deleted.
`/sync` lets the devices of one code share their highlights and notes (stored with the codes; deleting a code deletes them too).

The owner has added CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID and PMR_ADMIN_PASSWORD to the environment
and allowed api.cloudflare.com. Then:

1. `bash server/deploy.sh` (from the repo root). It only creates what is missing:
   - nothing for the codes store: it is a SQLite Durable Object (CodesDB) inside the Worker, made on first deploy (no D1 permission needed);
   - if the Worker has no PRIVATE_KEY secret: a NEW activation key pair (private half only in Cloudflare,
     public half into content/book.json, `access.server = "same"`);
   then rebuilds the app, deploys, and sets ADMIN_PASSWORD. Prints the book and /admin links.
2. Test: open /admin, sign in, Create a code, open the book, "افتح الكتاب كامل", type the code, Activate.
   Then Switch off on /admin and reload the book: it must lock again. Delete the test code.
3. Commit server/wrangler.toml, content/book.json and docs/ if they changed.
4. Later updates of the book: just `bash server/deploy.sh` again (codes, secrets and data stay).
