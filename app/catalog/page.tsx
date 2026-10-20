import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { ArrowRight, ArrowUpRight, Check } from "@/components/icons";
import { shopProducts } from "@/lib/site";

export const metadata: Metadata = {
  title: "Product catalogue 2026",
  description:
    "Download the Mekidulu 2026 product catalogue — 19 pages covering the full range, engineering specifications and marketplace channels.",
  alternates: { canonical: "/catalog" },
  openGraph: {
    title: "Mekidulu product catalogue 2026",
    description:
      "19 pages: full range, engineering specs, wholesale terms and marketplace channels.",
    url: "/catalog",
    images: [{ url: "/catalog/preview-cover.png", alt: "Mekidulu catalogue cover" }],
  },
};

const CATALOGUE_PDF = "/catalog/mekidulu-catalogue-2026.pdf";
const CATALOGUE_PAGES = 19;
const CATALOGUE_SIZE = "2.1 MB";

const contents = [
  "19 pages, A4, print-ready",
  `${shopProducts.length} models with specs and pricing`,
  "Engineering data and wholesale terms",
] as const;

export default function CataloguePage() {
  return (
    <>
      <section className="border-b border-line/70 bg-canvas">
        <div className="mx-auto grid w-full max-w-7xl gap-12 px-6 py-12 md:px-10 md:py-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-16">
          <div>
            <nav aria-label="Breadcrumb" className="text-[11.5px] font-medium text-muted">
              <ol className="flex items-center gap-2">
                <li>
                  <Link href="/" className="transition-colors hover:text-ink">
                    Home
                  </Link>
                </li>
                <li aria-hidden="true">/</li>
                <li className="text-ink" aria-current="page">
                  Catalogue
                </li>
              </ol>
            </nav>

            <p className="mt-8 text-[10.5px] font-bold uppercase tracking-[0.24em] text-brand">
              Catalogue
            </p>
            <h1 className="mt-5 text-[2.4rem] font-extrabold leading-[0.98] tracking-[-0.035em] text-ink sm:text-[3.1rem] xl:text-[3.6rem]">
              The 2026 product catalogue.
            </h1>
            <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-ink-soft md:text-base">
              Every model in one PDF — the line card, the engineering data behind
              it, wholesale terms and the marketplaces each SKU is listed on.
              Send it to a buyer, print it for a trade show, or keep it on the
              shelf.
            </p>

            <ul className="mt-7 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:gap-x-6">
              {contents.map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-2 text-[12.5px] font-medium text-ink-soft"
                >
                  <Check className="h-3.5 w-3.5 shrink-0 text-brand" />
                  {item}
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href={CATALOGUE_PDF}
                download
                className="group inline-flex items-center justify-center gap-2.5 rounded-full bg-ink px-7 py-4 text-[14px] font-semibold text-canvas transition-colors hover:bg-brand-deep"
              >
                Download PDF
                <ArrowUpRight className="h-4 w-4" />
              </a>
              <Link
                href="/shop"
                className="inline-flex items-center justify-center gap-2.5 rounded-full border border-line bg-paper/60 px-7 py-4 text-[14px] font-semibold text-ink transition-colors hover:border-ink/30 hover:bg-paper"
              >
                Browse the range
              </Link>
            </div>

            <p className="mt-4 text-[11.5px] text-muted">
              PDF · {CATALOGUE_SIZE} · {CATALOGUE_PAGES} pages · opens in a new tab
            </p>
          </div>

          <div className="relative mx-auto w-full max-w-md">
            <div className="relative aspect-[1240/1754] overflow-hidden rounded-[1.25rem] bg-sand shadow-[0_40px_80px_-50px_rgba(16,22,19,0.65)] ring-1 ring-ink/5">
              <Image
                src="/catalog/preview-cover.png"
                alt="Mekidulu 2026 product catalogue cover"
                fill
                priority
                sizes="(min-width: 1024px) 40vw, 90vw"
                className="object-cover"
              />
            </div>
            <a
              href={CATALOGUE_PDF}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute -bottom-4 left-1/2 -translate-x-1/2 rounded-full border border-line bg-paper px-5 py-2.5 text-[12px] font-semibold text-ink shadow-lg transition-colors hover:bg-canvas"
            >
              Open in browser
            </a>
          </div>
        </div>
      </section>

      <section className="bg-canvas py-14 md:py-20">
        <div className="mx-auto w-full max-w-7xl px-6 md:px-10">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <h2 className="text-[1.5rem] font-extrabold tracking-[-0.02em] text-ink md:text-[1.8rem]">
              What&rsquo;s inside
            </h2>
            <p className="max-w-md text-[12.5px] leading-relaxed text-muted">
              The same data that powers this site — no separate price list to
              keep in sync.
            </p>
          </div>

          <ul className="mt-8 divide-y divide-line/80 border-y border-line/80">
            {shopProducts.map((product, index) => (
              <li
                key={product.id}
                className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 py-4"
              >
                <div className="flex min-w-0 items-center gap-4">
                  <span className="w-7 shrink-0 font-mono text-[11px] text-muted">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[14px] font-semibold tracking-tight text-ink">
                      {product.title}
                    </p>
                    <p className="mt-0.5 truncate text-[11.5px] text-muted">
                      {product.badge} · {product.specs.join(" · ")}
                    </p>
                  </div>
                </div>
                <span className="text-[13px] font-semibold text-ink">
                  {product.price}
                </span>
              </li>
            ))}
          </ul>

          <p className="mt-6 text-[11.5px] text-muted">
            Need the editable source file, a localised version or your logo on
            the cover? Ask the supply team — OEM/ODM buyers get a branded
            catalogue.
          </p>
        </div>
      </section>

      <section className="border-t border-line/70 bg-paper py-14 md:py-16">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 md:flex-row md:items-center md:justify-between md:px-10">
          <div>
            <h2 className="text-[1.35rem] font-extrabold tracking-[-0.02em] text-ink">
              Buying for a store?
            </h2>
            <p className="mt-2 max-w-xl text-[13.5px] leading-relaxed text-muted">
              The catalogue lists MSRP. Wholesale pricing, MOQ and carton data
              come from the supply team after you send your volume.
            </p>
          </div>
          <Link
            href="/wholesale"
            className="group inline-flex shrink-0 items-center gap-2.5 rounded-full bg-ink px-6 py-3.5 text-[13.5px] font-semibold text-canvas transition-colors hover:bg-brand-deep"
          >
            Get factory pricing
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </section>
    </>
  );
}
