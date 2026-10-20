# Mekidulu — B2B storefront

Next.js (App Router) independent storefront for Mekidulu heavy-duty wood cat
trees: B2B wholesale lead capture, product line card, and a foundation for the
journal, C-end shop and AI support widget.

This repository currently implements **task 1 (homepage)** and **task 2
(wholesale lead capture)** of the Vercel migration. The legacy site was a
static HTML build on GitHub Pages; its content, product data and imagery were
carried over and re-optimised rather than rewritten from scratch.

> **运营与维护手册（中文）**：[docs/OPERATIONS.md](docs/OPERATIONS.md) —
> 改内容去哪里、怎么发布、出问题怎么查、密钥怎么轮换。

---

## Stack

| Layer      | Choice                                          |
| ---------- | ----------------------------------------------- |
| Framework  | Next.js 16 · App Router · Turbopack             |
| UI         | React 19, Tailwind CSS v4, `next/font`          |
| Data       | Supabase (`@supabase/supabase-js`, service role)|
| Validation | Zod                                             |
| Hosting    | Vercel                                          |
| Package mgr| pnpm (lockfile v9 — pnpm 10 is fine on Vercel)  |

## Quick start

```bash
pnpm install

# 1. Copy the env template and fill in the values from Vercel
cp .env.example .env.local

# 2. Create the leads table (paste into Supabase → SQL Editor)
#    supabase/migrations/0001_create_leads.sql

pnpm dev            # http://localhost:3000
```

Useful scripts:

```bash
pnpm dev         # development server
pnpm build       # production build
pnpm start       # serve the production build
pnpm typecheck   # tsc --noEmit
node scripts/smoke.mjs   # HTTP smoke test against BASE_URL (default :3100)
```

## Environment variables

All four are already configured in Vercel. Locally they live in `.env.local`.

| Variable                        | Scope            | Notes                                              |
| ------------------------------- | ---------------- | -------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | client + server  | Project URL.                                       |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | client + server  | Public anon key.                                   |
| `SUPABASE_SERVICE_ROLE_KEY1`    | **server only**  | Ends with `1` — the exact name is used in code. **Never** prefix with `NEXT_PUBLIC_`. |
| `DEEPSEEK_API_KEY`              | **server only**  | Reserved for the AI support widget (task 5).        |
| `NEXT_PUBLIC_SITE_URL`          | build            | Canonical origin for metadata/OG URLs.              |

The service role key is read in exactly one place: `lib/supabase/admin.ts`. If
the variable is missing, `POST /api/leads` logs the problem server-side and
returns `503` instead of leaking configuration details to the browser.

## Database

`supabase/migrations/0001_create_leads.sql` creates `public.leads` with:

- contact columns (`business_email` required, `company_name`, `estimated_volume`, `notes`)
- pipeline `status` (`new → contacted → qualified → won/lost`) and attribution
  (`source`, `page_path`, `referrer`, `user_agent`)
- check constraints mirroring the form (`5-50`, `50-200`, `200+`)
- indexes for the newest-first queue and email lookup
- an `updated_at` trigger
- **RLS enabled with zero policies** + `revoke all` from `anon`/`authenticated`,
  so leads are readable only through the service role (server) or the Supabase
  dashboard.

Run it once in the Supabase SQL editor; it is idempotent.

## API — `POST /api/leads`

`app/api/leads/route.ts` (Node runtime, no caching).

```jsonc
// request
{
  "businessEmail": "buyer@company.com",   // required, lower-cased server-side
  "companyName": "Acme Retail",           // optional, <= 160 chars
  "estimatedVolume": "50-200",            // optional: 5-50 | 50-200 | 200+
  "notes": "Launching in Q1.",            // optional, <= 2000 chars
  "companyUrl": ""                        // honeypot — must stay empty
}
```

```jsonc
// 201
{ "ok": true, "id": "0b0f…" }

// 422
{ "ok": false, "error": "Please check the highlighted fields.",
  "fieldErrors": { "businessEmail": "Enter a valid business email address." } }
```

Other status codes: `400` malformed JSON, `405` on `GET`, `413` oversized body,
`415` non-JSON content type, `429` rate limited (5 requests / 10 min / IP,
in-memory best effort), `502` Supabase insert failure, `503` missing
configuration. Bot submissions that fill the honeypot receive a `201` and are
never stored.

## Project layout

```
app/
  layout.tsx              # fonts, metadata, header/footer, Organization JSON-LD
  page.tsx                # task 1 — homepage
  wholesale/page.tsx      # task 2 — B2B lead capture page
  api/leads/route.ts      # task 2 — lead ingestion
  globals.css             # Tailwind v4 theme tokens (brand palette)
components/
  site-header.tsx         # sticky nav + mobile menu
  site-footer.tsx         # brand intro + navigation
  wholesale-form.tsx      # client form: validation, states, a11y
  icons.tsx               # inline SVG icon set
lib/
  site.ts                 # brand copy, nav, product line card, volume bands
  leads/schema.ts         # Zod schema + field error mapping
  supabase/admin.ts       # service-role client (server only)
  rate-limit.ts           # in-memory limiter
supabase/migrations/0001_create_leads.sql
public/images/            # optimised assets carried over from the legacy site
scripts/smoke.mjs         # end-to-end HTTP checks
```

## Design notes

- Palette: warm paper (`#faf7f2`), deep ink (`#101613`), and the green from the
  Mekidulu leaf mark (`#5c7a3f`). The legacy site used orange (`#ea580c`); both
  accent tokens live in `app/globals.css` under `@theme`, so re-skinning is a
  two-line change.
- Typography: Plus Jakarta Sans (the legacy brand font), self-hosted by
  `next/font`.
- The product line card, MSRPs, heights and marketplace links come verbatim
  from the legacy `products.json`.

## Retail channels

`lib/site.ts` → `marketplaces` holds brand-level marketplace links (the
"Where to buy" band and the `/shop` header); `products[].walmart` and
`amazonListings` hold per-SKU listings used on `/shop`.

| Channel        | Region                    | URL                                              | Granularity |
| -------------- | ------------------------- | ------------------------------------------------ | ----------- |
| Amazon US      | United States             | https://www.amazon.com/s?k=mekidulu              | brand search |
| Amazon UK      | United Kingdom            | https://www.amazon.co.uk/s?k=mekidulu             | brand search |
| Amazon JP      | Japan                     | https://www.amazon.co.jp/s?k=mekidulu             | brand search |
| Amazon DE / FR | Germany / France          | amazon.de / amazon.fr `/s?k=mekidulu`             | brand search |
| Amazon UK SKUs | United Kingdom            | `https://www.amazon.co.uk/dp/<ASIN>` (4 ASINs)    | per SKU     |
| Walmart        | United States             | per product (`products[].walmart`)                | per SKU     |
| Cdiscount      | France                    | https://www.cdiscount.com/search/10/mekidulu.html | brand search|

`amazonListings` currently holds **13 live ASINs** (US 1 · UK 4 · DE 6 · FR 8,
with overlaps), each with a local image and per-marketplace deep links. `/shop`
renders 16 cards in total: 3 line-card models with MSRP + 13 marketplace SKUs.

Notes:

- Amazon and Cdiscount answer `403` to server-side fetches and to headless
  browsers (bot-walls). The links are fine for real visitors — verify them in a
  normal browser, not with curl or a screenshot tool.
- Marketplace prices are geo-set per country. `amazonListings` therefore shows a
  "marketplace price" label instead of a number; the four ASINs were discovered
  through amazon.co.uk and their titles/photos are the live listing assets.

## Assets

`public/images/*` are derived from the legacy GitHub Pages repository
(`mdpetpops-jpg/mekidulu`): hero banners, factory/team photography, the three
product shots, journal covers and the brand mark. They were re-encoded to WebP
at display size, shrinking the set from roughly 55 MB to roughly 1.4 MB.

## Deploying to Vercel

1. Import the repository; framework preset **Next.js**, install command
   `pnpm install`, build command `pnpm build`.
2. Add the four environment variables listed above (Production + Preview).
3. Run the leads migration in the Supabase project used by those variables.
4. Deploy, then verify: `BASE_URL=https://<domain> node scripts/smoke.mjs`.

## Roadmap

| Task | Scope                                              | Status |
| ---- | -------------------------------------------------- | ------ |
| 1    | Homepage rebuild                                   | done   |
| 2    | Wholesale page + `leads` table + `/api/leads`       | done   |
| 3    | Journal migration (`/blog`, `/blog/[slug]`, 301s)   | next   |
| 4    | `/shop` with marketplace links and prices           | done   |
| 5    | DeepSeek AI support widget (`/api/chat`)            | next   |

Known follow-ups for later tasks:

- The legacy journal lives at `blog.html?id=<slug>` (query-string routing, 5
  posts in `blog.json`) — there is **no** `/journal/*` path to redirect. Task 3
  should 301 `blog.html?id=…` → `/blog/…` and also redirect the flat
  `*.html` pages.
- Legacy product data links to **Walmart**, not Amazon. Real Amazon listing
  URLs are needed before the "Buy on Amazon" buttons in task 4 can be wired.
