# Architecture

How the site is put together.

## Stack

- **[Astro](https://astro.build)** with `@astrojs/cloudflare` adapter — pages, layouts, content collections, build pipeline.
- **Cloudflare Workers** — runs the built site. The Worker is named `site` and is custom-bound to `hungovercoders.com` + `www.hungovercoders.com`.
- **[Pagefind](https://pagefind.app)** — static search index, generated at build time into `dist/client/pagefind/`.
- **Cloudflare Web Analytics** — a cookieless, privacy-first beacon (no cookies, no cross-site tracking, no tag manager). Wired in `src/components/BaseHead.astro`, gated on `CF_BEACON_TOKEN` in `src/consts.ts` (see [`docs/deployment/README.md`](../deployment/README.md) and [`docs/security/README.md`](../security/README.md)).

## Repo layout

```
src/
  components/        BaseHead, Header, Footer, SocialLinks, Search, PageHeader, PostCard
  content/blog/      Blog posts (YYYY-MM-DD-slug.md)
  content/projects/  Live project entries
  content.config.ts  Astro content-collection schemas
  layouts/           BlogPost.astro, TrainingLesson.astro
  pages/             Routes — index, about, blog/[...slug], training/[series]/[lesson], projects
  styles/global.css
  consts.ts          SITE_TITLE, SITE_DESCRIPTION, GISCUS_*
public/              Static assets (favicons, share images per post)
scripts/             fetch-training-repos.sh, link-local-repos.sh, generate-share-image.mjs
training-repos/      Gitignored — populated at build by fetch-training-repos.sh
redirects/           Separate worker for apex/legacy-subdomain redirects
.ss/                 Slopstopper analysis scripts + Playwright specs
.github/workflows/   ss-*.yml (slopstopper) + repo-specific
```

## Training-content wiring

Lesson markdown lives canonically in sibling `learn.*` repos. The Astro glob loader reads from `training-repos/` at build time. The directory is gitignored and populated two ways:

- **CI / Cloudflare Workers Builds:** `npm run build` runs `scripts/fetch-training-repos.sh` first, which shallow-clones each repo listed in the script.
- **Local dev:** run `./scripts/link-local-repos.sh` once after cloning. It auto-discovers `learn.*` sibling directories and symlinks them into `training-repos/`.

To add a new training series: create `learn.<topic>` following the `content/` + `examples/` layout, then add `"learn.<topic>"` to the `REPOS` array in `scripts/fetch-training-repos.sh`. `link-local-repos.sh` picks it up automatically.

## Listing pages

`src/components/PageHeader.astro` (eyebrow, title, lead, optional action link) opens every listing page, and `src/components/PostCard.astro` renders a blog post wherever posts are listed: as a tile on the home page and as a date-led row on `/blog` and `/tags/<slug>/`. Listings are deliberately text-first; the share images under `public/assets/<slug>/link.png` already carry the post title, so they are kept for social cards only. The helpers the listings share (reading time, tag slugs, the hidden site-wide tag) live in `src/utils/posts.ts`. Blog post pages get older/newer navigation from `src/pages/blog/[...slug].astro`, which passes neighbours into `BlogPost.astro`.

## Home page

`src/pages/index.astro` is assembled from the content collections at build time: the latest post is featured in a dark panel, the next three follow as tiles, topics are the most-used blog tags (merged case-insensitively, matching the lower-cased `/tags/<slug>/` routes), and projects are the `live` entries. Training series only render when the collection has content.

## Search

Pagefind indexes `dist/client/**/*.html` at the end of every build, writing to `dist/client/pagefind/`. The site loads the generated pagefind UI assets from `BaseHead.astro` and wires up the Default UI in `src/components/Search.astro`.

## Routing

- `/` — home (`src/pages/index.astro`)
- `/blog` and `/blog/<slug>/` — blog list + posts
- `/about` — author / site
- `/projects` and `/projects/<slug>/` — portfolio entries from `src/content/projects/`
- `/training/<series>/` and `/training/<series>/<lesson>/` — lessons sourced from sibling `learn.*` repos
- `/tags/<tag>/` — tag aggregation pages

The apex `hungovercoders.com` 301s to `www.hungovercoders.com`. Apex redirect is handled by a small separate worker in `redirects/`.
