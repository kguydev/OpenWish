# Deployments

Each folder here is one OpenWish deployment: a Cloudflare Worker with its own
domain, D1 database, R2 bucket, KV namespace and Turnstile widget. The folder
holds that deployment's `wrangler.jsonc` and nothing else, so `main` stays
generic and every deployment builds from the same code.

`.github/workflows/deploy.yml` deploys every `deploy/*/wrangler.jsonc` on each
push to `main`, one job per folder. A failed job leaves the others running.

## How the build finds the config

The Vite Cloudflare plugin reads the Wrangler config at build time. It takes
the path from `WRANGLER_CONFIG`. Without it, a build uses
`apps/web/wrangler.jsonc`, as upstream does. The build writes the deployable
config to `apps/web/dist/server/wrangler.json` and a pointer to it in
`apps/web/.wrangler/deploy/config.json`. A plain `wrangler deploy` run in
`apps/web` follows that pointer.

Don't run `wrangler deploy --config deploy/<name>/wrangler.jsonc`. That skips
the Vite build and fails to bundle TanStack Start. Commands that don't build,
such as `d1 migrations` and `secret put`, take the folder's config directly.

## Local development

Local development needs no Cloudflare account and no config from this folder:

```bash
cd apps/web
cp .dev.vars.example .dev.vars   # set OPENWISH_BOOTSTRAP_TOKEN to create projects
pnpm dev                         # http://localhost:5173
```

When `WRANGLER_CONFIG` is unset and there is no `apps/web/wrangler.jsonc`,
`vite dev` uses `apps/web/wrangler.example.jsonc`. Its placeholder IDs are
fine there, because D1, R2, KV and the Durable Object all run in Miniflare,
with state in `apps/web/.wrangler/state`. To get a project and its API key:

```bash
curl -X POST localhost:5173/api/admin/projects \
  -H 'content-type: application/json' \
  -H "x-openwish-bootstrap-token: <OPENWISH_BOOTSTRAP_TOKEN>" \
  -d '{"name":"Dev","slug":"dev"}'
```

Don't set `WRANGLER_CONFIG` to a deployment's config for `pnpm dev`. Dev
stays local either way, but it then uses that deployment's hostnames and
passkey RP ID.

## Deploy one by hand

```bash
cd apps/web
export WRANGLER_CONFIG=$PWD/../../deploy/babybuddy/wrangler.jsonc
pnpm build
pnpm exec wrangler d1 migrations apply DB --remote --config "$WRANGLER_CONFIG"
pnpm exec wrangler deploy        # add --dry-run to list the bindings only
```

If your login sees more than one Cloudflare account, set
`CLOUDFLARE_ACCOUNT_ID` too.

## Add a deployment

1. Copy a folder: `cp -r deploy/babybuddy deploy/<name>`. The relative paths
   (`$schema`, `main`, `migrations_dir`) work unchanged at the same depth.
2. Create the resources and put their IDs and names in the new config:

   ```bash
   cd apps/web
   pnpm exec wrangler d1 create <db-name>
   pnpm exec wrangler r2 bucket create <bucket-name>
   pnpm exec wrangler kv namespace create RATE_LIMIT_KV
   ```

   Create a Turnstile widget for the domain in the Cloudflare dashboard and put
   its site key in `OPENWISH_TURNSTILE_SITE_KEY`.
3. Edit the rest of the config: a new worker `name` (two deployments with the
   same name overwrite each other), `account_id`, the custom domain in
   `routes`, and every `OPENWISH_*` var. Drop `send_email` if the domain
   has no Email Routing.
4. Set the secrets. The Worker has to exist first, so either deploy once or
   accept Wrangler's offer to create it:

   ```bash
   C=$PWD/../../deploy/<name>/wrangler.jsonc
   for s in OPENWISH_DASHBOARD_USERNAME OPENWISH_DASHBOARD_PASSWORD \
            OPENWISH_DASHBOARD_SESSION_SECRET OPENWISH_GLOBAL_API_KEY \
            OPENWISH_TURNSTILE_SECRET_KEY; do
     pnpm exec wrangler secret put "$s" --config "$C"
   done
   ```
5. Apply migrations and deploy as in "Deploy one by hand". After that, the
   workflow deploys it on every push to `main`, as long as the
   `CLOUDFLARE_API_TOKEN` secret can reach the new account and zone.

## Don't change the passkey RP ID

`OPENWISH_PASSKEY_RP_ID` is the WebAuthn relying party ID. Every passkey is
bound to it. Change it, or move a deployment to another domain, and every
existing passkey for that dashboard stops working. Sign in with the dashboard
password and register new ones.
