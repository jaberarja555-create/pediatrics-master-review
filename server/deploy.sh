#!/usr/bin/env bash
# Puts the book and the activation server online (Cloudflare Workers + a Durable Object, free plan).
# Needs: CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID, PMR_ADMIN_PASSWORD in the environment,
# and network access to api.cloudflare.com. Run from the repo root:  bash server/deploy.sh
# Safe to run again for every book update: it only creates what is missing.
set -euo pipefail
cd "$(dirname "$0")/.."
PMR_ADMIN_PASSWORD="${PMR_ADMIN_PASSWORD:-${SMR_ADMIN_PASSWORD:-}}"
for v in CLOUDFLARE_API_TOKEN CLOUDFLARE_ACCOUNT_ID PMR_ADMIN_PASSWORD; do
  [ -n "${!v:-}" ] || { echo "Missing $v (add it in the environment settings, then start a new session)"; exit 1; }
done
[ -d server/node_modules/wrangler ] || (cd server && npm init -y >/dev/null && npm i -s wrangler@3)
W="npx --prefix server wrangler"
cd server

# 1. The codes database is a Durable Object inside this Worker (wrangler.toml): nothing to create.

# 2. The activation key pair (once, or when the PRIVATE_KEY secret is missing).
#    Private half only inside Cloudflare; public half goes into the app (content/book.json).
secrets=$($W secret list 2>/dev/null || echo '[]')
if ! echo "$secrets" | grep -q '"PRIVATE_KEY"'; then
  echo "Making a new activation key pair"
  node -e '
    const c=require("crypto"),fs=require("fs");const {publicKey,privateKey}=c.generateKeyPairSync("ec",{namedCurve:"P-256"});
    fs.writeFileSync("/tmp/pmr-private.json",JSON.stringify(privateKey.export({format:"jwk"})));
    const p="../content/book.json",b=JSON.parse(fs.readFileSync(p));b.access.public_key=publicKey.export({format:"jwk"});b.access.server="same";
    fs.writeFileSync(p,JSON.stringify(b,null,1)+"\n");'
fi

# 3. Build the book and deploy.
cd ..
python3 build.py | tail -1
cd server
$W deploy 2>&1 | tee /tmp/pmr-deploy.log | tail -5
if [ -f /tmp/pmr-private.json ]; then
  $W secret put PRIVATE_KEY < /tmp/pmr-private.json && rm -f /tmp/pmr-private.json
fi
printf '%s' "$PMR_ADMIN_PASSWORD" | $W secret put ADMIN_PASSWORD >/dev/null   # keeps the password in step with the environment
url=$(grep -oE 'https://[a-z0-9.-]+\.workers\.dev' /tmp/pmr-deploy.log | head -1)
echo; echo "Book:          $url"; echo "Control page:  $url/admin"
echo "Commit server/wrangler.toml, content/book.json and docs/ if they changed."
