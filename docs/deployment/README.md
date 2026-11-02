# Deployment

How the site reaches `hungovercoders.com`.

## Cloudflare Workers Builds

The site deploys via Cloudflare Workers (`@astrojs/cloudflare` adapter). The worker is named `site` (config in `wrangler.jsonc`) and exposes the deployment at `site.griff182uk.workers.dev`, custom-bound to `hungovercoders.com` + `www.hungovercoders.com`.

Cloudflare dashboard build settings:

- Build command: `npm run build`
- Deploy command: `npx wrangler deploy`
- Production branch: `main`

Every push to `main` deploys. Every PR gets a preview URL as a commit check. Closing a PR retires the preview. No GitHub Actions deploy workflow exists or is needed.

Workers Builds puts the preview URLs only in the summary of its `Workers Builds: site` check run and posts no PR comment. The repo-specific workflow `.github/workflows/cloudflare-preview-comment.yml` listens for that check run succeeding on a non-default branch, lifts the branch alias and per-version URLs out of the summary, and upserts a single comment on the PR (marker `<!-- cloudflare-preview-comment -->`). Like every `check_run`-triggered workflow it runs from `main`, so it only fires once the file is on the default branch. It is not part of slopstopper, so a slopstopper refresh leaves it alone.

## DNS

DNS is hosted at **Namecheap** (nameservers `dns1/2.registrar-servers.com`) with A records pointing at Cloudflare anycast IPs. DNS record changes happen at Namecheap, not in the Cloudflare dashboard.

The apex `hungovercoders.com` is the canonical host and is served directly (200) by the `site` worker. `www.hungovercoders.com` is also custom-bound to the same worker and currently serves directly too, but it is **not** canonical — `astro.config.mjs` (`site: 'https://hungovercoders.com'`), every page's `<link rel="canonical">`, the sitemap, `og:url`, and RSS all point at the apex. There is no apex↔www redirect today (collapsing `www → apex` with a 301 is a tracked follow-up). The separate worker defined in `redirects/wrangler.jsonc` only handles `blog.hungovercoders.com/*` — run `npm run redirects:deploy` to update it.

## The `dist/client` gotcha

The `@astrojs/cloudflare` adapter splits the build into:

- `dist/client/` — static assets that wrangler uploads via the `ASSETS` binding (the public web root).
- `dist/server/` — the worker bundle.

**Anything written into `dist/` outside `dist/client/` is not deployed.** This caught us once with Pagefind: `pagefind --site dist` wrote `dist/pagefind/`, local builds served it fine, production 404'd silently. The fix was `pagefind --site dist/client`.

For any post-`astro build` step that produces static assets (search indexes, redirect files, sitemap appenders, generated images), the output path must live under `dist/client/`. When debugging a "works locally, 404 in prod" asset, check the wrangler deploy log for `Read N files from .../dist/client` — that's the upload root.

## Local commands

```bash
npm run dev            # Astro dev server (localhost:4321)
npm run build          # Full build — clears cache, fetches training repos, builds, indexes search
npm run preview        # Build + wrangler dev — closer to prod
npm run deploy         # Build + wrangler deploy (you rarely need this; CFB handles it)
```

## Analytics and cookies

Traffic is measured with **Cloudflare Web Analytics** — a cookieless, privacy-first beacon. It sets no cookies and stores nothing on the visitor's device, so there is no cookie-consent banner to maintain. The beacon is wired in [`src/components/BaseHead.astro`](../../src/components/BaseHead.astro) and gated on `CF_BEACON_TOKEN` in [`src/consts.ts`](../../src/consts.ts) (blank ⇒ off); its origins are documented in [`docs/security/CSP_EXCEPTIONS.md`](../security/CSP_EXCEPTIONS.md) and the [`/privacy`](../../src/pages/privacy.astro) page. Note that Cloudflare also counts requests server-side at the edge (visible in the dashboard without any beacon); the beacon adds the client-side metrics — Core Web Vitals and per-page/referrer/country breakdowns.
