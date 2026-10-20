import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { ArrowRight, ArrowUpRight, Check } from "@/components/icons";
import { marketplaces, products, shopProducts, site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Shop all models",
  description:
    "Every Mekidulu heavy-duty cat tree in one place — buy on Amazon in the US, UK, Japan and Europe, on Walmart in the US, or on Cdiscount in France.",
  alternates: { canonical: "/shop" },
  openGraph: {
    title: "Shop all Mekidulu models",
    description:
      "Wood cat trees on Amazon US/UK/JP/EU, Walmart and Cdiscount France.",
    url: "/shop",
  },
};

const reassurance = [
  {
    title: "Local pricing and delivery",
    body: "Each marketplace prices and ships for its own country, so you pay in your currency with the delivery you already expect.",
  },
  {
    title: "Same structure everywhere",
    body: "FAS-grade birch, 25 mm base plate and 10 × 10 cm columns — whether you buy through Amazon, Walmart or Cdiscount.",
  },
  {
    title: "Trade buyers go direct",
    body: "Retailers and dropshippers skip the marketplace: factory pricing, low MOQ and blind-ship cartons from the wholesale form.",
  },
] as const;

const priceIsAmount = (price: string) => price.startsWith("$");

const itemListJsonLd = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "Mekidulu cat trees",
  itemListElement: shopProducts.map((product, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: product.title,
    url: product.amazonUrl,
  })),
};

/**
 * Machine-readable product facts. Assistant engines quote these numbers when a
 * buyer asks for height, material or price, so they must stay in sync with
 * `lib/site.ts` (they are derived from it).
 */
const productJsonLd = products.map((product) => ({
  "@context": "https://schema.org",
  "@type": "Product",
  name: product.name,
  sku: product.id.toUpperCase(),
  image: `${site.url}${product.image}`,
  description: product.highlights.join(". "),
  brand: { "@type": "Brand", name: "Mekidulu" },
  material: "FAS-grade birch plywood, natural sisal",
  height: product.heightIn,
  numberOfItems: product.levels,
  offers: {
    "@type": "Offer",
    priceCurrency: "USD",
    price: product.msrp.toFixed(2),
    availability: "https://schema.org/InStock",
    url: product.walmart,
    seller: { "@type": "Organization", name: "Mekidulu" },
  },
}));

export default function ShopPage() {
  return (
    <>
      <section className="border-b border-line/70 bg-canvas">
        <div className="mx-auto w-full max-w-7xl px-6 pb-12 pt-12 md:px-10 md:pb-16 md:pt-16">
          <nav aria-label="Breadcrumb" className="text-[11.5px] font-medium text-muted">
            <ol className="flex items-center gap-2">
              <li>
                <Link href="/" className="transition-colors hover:text-ink">
                  Home
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li className="text-ink" aria-current="page">
                Shop
              </li>
            </ol>
          </nav>

          <p className="mt-8 text-[10.5px] font-bold uppercase tracking-[0.24em] text-brand">
            Shop
          </p>
          <h1 className="mt-5 max-w-3xl text-[2.4rem] font-extrabold leading-[0.98] tracking-[-0.035em] text-ink sm:text-[3.1rem] xl:text-[3.8rem]">
            Every model, one click from your door.
          </h1>
          <p className="mt-6 max-w-2xl text-[15px] leading-relaxed text-ink-soft md:text-base">
            Buy on Amazon in the US, UK, Japan and Europe, on Walmart in the US,
            or on Cdiscount in France. Same FAS-grade birch structures — the
            marketplace just decides the currency and the delivery.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-2">
            {marketplaces.map((marketplace) => (
              <a
                key={marketplace.id}
                href={marketplace.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-2 rounded-full border border-line bg-paper/70 py-1.5 pl-3.5 pr-2.5 text-[11.5px] font-semibold text-ink-soft transition-colors hover:border-ink/30 hover:text-ink"
              >
                {marketplace.name}
                <span className="rounded-full bg-sand px-1.5 py-0.5 text-[8.5px] font-bold uppercase tracking-[0.1em] text-muted">
                  {marketplace.tag}
                </span>
                <ArrowUpRight className="h-3 w-3 text-muted transition-colors group-hover:text-ink" />
              </a>
            ))}
            <Link
              href="/catalog"
              className="inline-flex items-center gap-2 rounded-full border border-ink/20 bg-ink px-4 py-1.5 text-[11.5px] font-semibold text-canvas transition-colors hover:bg-brand-deep"
            >
              Catalogue PDF
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-canvas py-14 md:py-20">
        <div className="mx-auto w-full max-w-7xl px-6 md:px-10">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <h2 className="text-[1.5rem] font-extrabold tracking-[-0.02em] text-ink md:text-[1.8rem]">
              The full range
            </h2>
            <p className="max-w-md text-[12.5px] leading-relaxed text-muted">
              Marketplace prices are set per country — the link always shows
              today&rsquo;s local price, delivery and returns.
            </p>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {shopProducts.map((product) => (
              <article
                key={product.id}
                className="group flex flex-col overflow-hidden rounded-[1.5rem] border border-line bg-paper transition-shadow hover:shadow-[0_24px_60px_-40px_rgba(16,22,19,0.45)]"
              >
                <div className="relative aspect-square overflow-hidden bg-sand">
                  <Image
                    src={product.image}
                    alt={product.detail}
                    fill
                    sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw"
                    className={
                      product.imageFit === "contain"
                        ? "object-contain p-3 transition-transform duration-500 ease-out group-hover:scale-[1.02]"
                        : "object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                    }
                  />
                  <span className="absolute left-4 top-4 rounded-full bg-canvas/90 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.14em] text-ink backdrop-blur">
                    {product.badge}
                  </span>
                </div>

                <div className="flex flex-1 flex-col p-5">
                  <h3 className="text-[15px] font-bold leading-snug tracking-tight text-ink">
                    {product.title}
                  </h3>
                  <p className="mt-1.5 line-clamp-2 text-[11.5px] leading-relaxed text-muted">
                    {product.detail}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {product.specs.map((spec) => (
                      <span
                        key={spec}
                        className="rounded-full bg-sand px-2.5 py-1 text-[10px] font-semibold text-ink-soft"
                      >
                        {spec}
                      </span>
                    ))}
                  </div>

                  {product.marketLinks.length > 0 ? (
                    <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                      <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-muted">
                        Live on
                      </span>
                      {product.marketLinks.map((market) => (
                        <a
                          key={market.label}
                          href={market.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-full border border-line px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em] text-ink-soft transition-colors hover:border-ink/30 hover:text-ink"
                        >
                          {market.label}
                        </a>
                      ))}
                      <span className="ml-auto font-mono text-[9px] tracking-tight text-muted/80">
                        {product.id}
                      </span>
                    </div>
                  ) : null}

                  <div className="mt-auto pt-5">
                    <div className="flex items-baseline gap-2">
                      <span
                        className={
                          priceIsAmount(product.price)
                            ? "text-[22px] font-extrabold tracking-tight text-ink"
                            : "text-[13px] font-bold tracking-tight text-ink"
                        }
                      >
                        {product.price}
                      </span>
                      <span className="text-[9.5px] font-bold uppercase tracking-[0.14em] text-muted">
                        {product.priceNote}
                      </span>
                    </div>

                    <div className="mt-4 flex flex-col gap-2">
                      <a
                        href={product.amazonUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-ink px-5 text-[13px] font-semibold text-canvas transition-colors hover:bg-brand-deep"
                      >
                        Buy on Amazon
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </a>
                      <Link
                        href="/wholesale"
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-line px-5 text-[13px] font-semibold text-ink transition-colors hover:border-ink/30 hover:bg-canvas"
                      >
                        Wholesale inquiry
                      </Link>
                      {product.walmartUrl ? (
                        <a
                          href={product.walmartUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center gap-1 pt-1 text-[11.5px] font-medium text-muted transition-colors hover:text-ink"
                        >
                          Also on Walmart
                          <ArrowUpRight className="h-3 w-3" />
                        </a>
                      ) : null}
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-line/70 bg-paper py-14 md:py-16">
        <div className="mx-auto grid w-full max-w-7xl gap-8 px-6 md:grid-cols-3 md:gap-10 md:px-10">
          {reassurance.map((item) => (
            <div key={item.title}>
              <h2 className="flex items-center gap-2 text-[13px] font-bold tracking-tight text-ink">
                <Check className="h-3.5 w-3.5 shrink-0 text-brand" />
                {item.title}
              </h2>
              <p className="mt-2.5 text-[12.5px] leading-relaxed text-muted">
                {item.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-ink py-16 text-canvas md:py-20">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 md:flex-row md:items-center md:justify-between md:px-10">
          <div>
            <h2 className="text-[1.6rem] font-extrabold tracking-[-0.02em] md:text-[1.9rem]">
              Buying for a store, not a living room?
            </h2>
            <p className="mt-2.5 max-w-xl text-[13.5px] leading-relaxed text-canvas/60">
              Low MOQ, dropshipping and OEM/ODM pricing straight from the
              production line — the same models, without the marketplace margin.
            </p>
          </div>
          <Link
            href="/wholesale"
            className="group inline-flex shrink-0 items-center gap-2.5 rounded-full bg-canvas px-7 py-4 text-[13.5px] font-semibold text-ink transition-colors hover:bg-sand"
          >
            Get factory pricing
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
    </>
  );
}
