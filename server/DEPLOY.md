# Deploy (for the next Claude session)

How subscription works (like Dr. Arja Master Note): the authors make codes `PMR-XXXX-XXXX` on `/admin` and send
one to each buyer on WhatsApp ("Copy message"). The student types it in the app (or opens `<book>#code=PMR-…`);
`/activate` binds that device (max 2 per code) and returns a signed token, so the book then opens offline too.
`/check` (when online) locks the device again if its code is switched off, reset or deleted.
`/sync` lets the two devices of one code share their highlights and notes (stored with the codes; deleting a code deletes them too).

The owner has added CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID and PMR_ADMIN_PASSWORD (or SMR_ADMIN_PASSWORD) to the environment
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
