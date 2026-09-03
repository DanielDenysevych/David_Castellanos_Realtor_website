# Auto-syncing listings from REALTOR.ca (CREA DDF®)

Goal: any listing where **David Castellanos is the listing agent** should
appear on this site automatically, without anyone editing code.

How it works once set up:

```
REALTOR.ca / MLS®  ──►  CREA DDF® feed  ──►  scripts/sync-listings.mjs
                                                    │  (GitHub Action, every 3 h)
                                                    ▼
                                          data/listings.json  ──►  git commit
                                                    │
                                                    ▼
                                        host redeploys  ──►  site shows the listing
```

The site reads `data/listings.json` at page load and builds the listing
cards + detail popups from it. Nothing in `index.html` / `js` / `css`
needs to change when a listing is added, sold, or removed.

Until the steps below are done, the site shows a **hand-entered copy** of
the current listings (`"source": "manual-seed"` in `data/listings.json`).
The Action still runs on schedule but does nothing until credentials exist.

---

## What David needs to do (one time)

CREA's DDF is free to CREA members. Only David (or someone with his
REALTOR Link login) can turn it on.

1. Sign in to **REALTOR Link** → `https://crea.ca` → **DDF®**.
2. **Opt his listings in** to DDF distribution.
3. Set the feed scope to **"My listings"** (simplest). "My office" also
   works — see the optional filter below.
4. Request **DDF® Data Feed API access** (the RESO Web API). CREA issues a
   **Client ID** and **Client Secret** (OAuth2 `client_credentials`,
   scope `DDFApi_Read`, token endpoint `identity.crea.ca`, data endpoint
   `ddfapi.realtor.ca`).

If CREA support asks what it's for: "a personal agent website that
displays only my own active listings."

## What to do with the credentials

In this GitHub repo → **Settings → Secrets and variables → Actions**:

| Type   | Name                 | Value                          |
|--------|----------------------|--------------------------------|
| Secret | `CREA_CLIENT_ID`     | the Client ID from CREA        |
| Secret | `CREA_CLIENT_SECRET` | the Client Secret from CREA    |

Optional — only if the feed is scoped wider than "my listings":

| Type     | Name                | Example value                                   |
|----------|---------------------|------------------------------------------------|
| Variable | `CREA_AGENT_FILTER` | `contains(ListAgentFullName,'Castellanos')`     |

Then run the sync once by hand: repo → **Actions → sync-listings → Run
workflow**. If it commits a new `data/listings.json` with
`"source": "crea-ddf"`, it's working. From then on it runs every 3 hours.

## Hosting (needed for "automatic" to mean anything)

The site must be deployed somewhere that **redeploys on a push to
`main`**. It's a plain static site, so any of these work with no config:

- **GitHub Pages** – zero cost, Settings → Pages → deploy from `main`.
- **Cloudflare Pages** / **Netlify** / **Vercel** – connect the repo,
  framework preset "None", output directory = repo root.

After that, a listing that goes live on MLS® shows on the site within
~3 hours (or immediately if you run the Action by hand).

---

## Local run

```bash
CREA_CLIENT_ID=xxx CREA_CLIENT_SECRET=yyy node scripts/sync-listings.mjs
```

With no env vars it exits without doing anything.

## Compliance notes (DDF terms)

- The footer already carries the MLS® / REALTOR® trademark line.
- Each listing popup shows **"Listed by &lt;brokerage&gt;"** (`office`
  field) — required when a listing isn't David's own brokerage's.
- Don't hand-edit `data/listings.json` once `source` is `crea-ddf`; the
  next sync overwrites it. Hand-edit only while it's `manual-seed`.
- Photos are hot-linked from CREA's CDN (that's what the feed URLs are
  for) — they're not copied into the repo.
