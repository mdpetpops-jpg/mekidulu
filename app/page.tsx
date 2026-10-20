import Image from "next/image";
import Link from "next/link";

import { ArrowRight, ArrowUpRight, Check } from "@/components/icons";
import {
  engineeringSpecs,
  marketplaces,
  products,
  site,
  trustMetrics,
  wholesaleBenefits,
} from "@/lib/site";

const heroProof = [
  "FAS-grade birch, no particle board",
  "Low MOQ, mixed pallets",
  "Dropshipping ready cartons",
] as const;

export default function HomePage() {
  return (
    <>
      {/* ---------------------------------------------------------------- Hero */}
      <section className="relative overflow-hidden bg-canvas">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-40 -top-40 h-[34rem] w-[34rem] rounded-full bg-sand/70 blur-3xl"
        />
        <div className="relative mx-auto grid w-full max-w-7xl items-center gap-12 px-6 pb-14 pt-12 md:px-10 md:pb-20 md:pt-16 lg:grid-cols-[1.05fr_0.95fr] lg:gap-20">
          <div>
            <p className="inline-flex items-center gap-2.5 rounded-full border border-line bg-paper/70 px-3.5 py-1.5 text-[10.5px] font-bold uppercase tracking-[0.2em] text-ink-soft">
              <span className="h-1.5 w-1.5 rounded-full bg-brand" aria-hidden="true" />
              OEM / ODM · Ready stock · Global fulfilment
            </p>

            <h1 className="mt-7 text-[2.6rem] font-extrabold leading-[0.98] tracking-[-0.035em] text-ink sm:text-[3.4rem] xl:text-[4.4rem]">
              Mekidulu Heavy-Duty Cat Trees{" "}
              <span className="text-brand">- Ready to Ship!</span>
            </h1>

            <p className="mt-6 text-xl font-semibold tracking-tight text-ink md:text-2xl">
              Premium Quality. Low MOQ. Dropshipping Supported.
            </p>

            <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-ink-soft md:text-base">
              FAS-grade birch structures engineered for multi-cat households,
              sold direct from our production line to retailers, distributors
              and dropshippers across North America and Europe. No middlemen, no
              carpet-covered cardboard, no container commitment to start.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/wholesale"
                className="group inline-flex items-center justify-center gap-2.5 rounded-full bg-ink px-7 py-4 text-[14px] font-semibold text-canvas transition-colors hover:bg-brand-deep"
              >
                Request wholesale pricing
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/#collections"
                className="inline-flex items-center justify-center gap-2.5 rounded-full border border-line bg-paper/60 px-7 py-4 text-[14px] font-semibold text-ink transition-colors hover:border-ink/30 hover:bg-paper"
              >
                See the line card
              </Link>
            </div>

            <ul className="mt-9 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:gap-x-6">
              {heroProof.map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-2 text-[12.5px] font-medium text-ink-soft"
                >
                  <Check className="h-3.5 w-3.5 shrink-0 text-brand" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="relative">
            <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] bg-sand ring-1 ring-ink/5 sm:aspect-square lg:aspect-[4/5]">
              <Image
                src="/images/hero-banner-01.webp"
                alt="Mekidulu heavy-duty wood cat tree with multiple cats resting on sisal-wrapped platforms"
                fill
                priority
                sizes="(min-width: 1024px) 44vw, 100vw"
                className="object-cover"
              />
              <div className="absolute right-4 top-4 rounded-xl border border-line/70 bg-paper/95 px-4 py-3 shadow-[0_18px_40px_-24px_rgba(16,22,19,0.5)] backdrop-blur">
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted">
                  Flagship spec
                </p>
                <p className="mt-1 text-[13px] font-bold tracking-tight text-ink">
                  72.1 in · 8 levels · 12 sisal pillars
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5 px-1">
              <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-ink">
                <span
                  className="h-1.5 w-1.5 rounded-full bg-brand"
                  aria-hidden="true"
                />
                Ready stock
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
                Ships from our line in China
              </span>
            </div>
          </div>
        </div>

        {/* Trust metrics */}
        <div className="border-y border-line/80 bg-paper/60">
          <dl className="mx-auto grid w-full max-w-7xl grid-cols-2 divide-line/80 px-6 md:grid-cols-4 md:divide-x md:px-10">
            {trustMetrics.map((metric) => (
              <div
                key={metric.label}
                className="border-line/80 py-7 [&:nth-child(-n+2)]:border-b md:border-b-0 md:py-8 md:[&:not(:first-child)]:pl-8 [&:nth-child(2n)]:pl-6 [&:nth-child(2n+1)]:pr-6 md:[&:nth-child(2n)]:pl-8"
              >
                <dt className="text-[22px] font-extrabold tracking-tight text-ink md:text-2xl">
                  {metric.value}
                </dt>
                <dd className="mt-1 text-[11px] font-bold uppercase tracking-[0.16em] text-ink">
                  {metric.label}
                  <span className="mt-2 block max-w-[15rem] text-[12px] font-normal normal-case leading-relaxed tracking-normal text-muted">
                    {metric.detail}
                  </span>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ---------------------------------------------------------- Engineering */}
      <section id="engineering" className="bg-paper py-20 md:py-28">
        <div className="mx-auto grid w-full max-w-7xl gap-14 px-6 md:px-10 lg:grid-cols-[1.02fr_0.98fr] lg:gap-20">
          <div>
            <p className="text-[10.5px] font-bold uppercase tracking-[0.24em] text-brand">
              Engineering
            </p>
            <h2 className="mt-5 max-w-xl text-[2rem] font-extrabold leading-[1.02] tracking-[-0.03em] text-ink md:text-[2.9rem]">
              Heavy-duty is a measurement, not a marketing word.
            </h2>
            <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-ink-soft">
              Most mass-market towers wobble because the load path runs through
              particle board and cardboard tubes. We rebuilt the structure from
              the base plate up, so a 20 lb Maine Coon mid-leap lands on a
              stable platform instead of a swaying one.
            </p>

            <ol className="mt-10 divide-y divide-line/80 border-t border-line/80">
              {engineeringSpecs.map((spec) => (
                <li key={spec.index} className="grid grid-cols-[auto_1fr] gap-x-5 py-5">
                  <span className="pt-0.5 font-mono text-[11px] font-semibold tracking-widest text-brand">
                    {spec.index}
                  </span>
                  <div>
                    <h3 className="text-[15px] font-bold tracking-tight text-ink">
                      {spec.title}
                    </h3>
                    <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted">
                      {spec.body}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="relative lg:pt-4">
            <div className="relative aspect-square overflow-hidden rounded-[2rem] bg-sand ring-1 ring-ink/5">
              <Image
                src="/images/factory.webp"
                alt="Mekidulu production line assembling wood cat tree components"
                fill
                sizes="(min-width: 1024px) 44vw, 100vw"
                className="object-cover"
              />
            </div>
            <div className="mt-6 grid grid-cols-2 gap-6">
              <div className="relative aspect-square overflow-hidden rounded-2xl bg-sand ring-1 ring-ink/5">
                <Image
                  src="/images/design-detail.webp"
                  alt="Detail of Mekidulu birch platform and sisal-wrapped column joinery"
                  fill
                  sizes="(min-width: 1024px) 22vw, 46vw"
                  className="object-cover"
                />
              </div>
              <div className="flex flex-col justify-between rounded-2xl bg-ink p-5 text-canvas">
                <p className="text-[9.5px] font-bold uppercase tracking-[0.2em] text-canvas/50">
                  Direct factory pricing
                </p>
                <div>
                  <p className="text-4xl font-extrabold tracking-tight">
                    40<span className="text-xl align-top">%↓</span>
                  </p>
                  <p className="mt-2 text-[12px] leading-relaxed text-canvas/60">
                    versus retail-first brands, with no middleman margin between
                    our line and your shelf.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------- Line card */}
      <section id="collections" className="bg-canvas py-20 md:py-28">
        <div className="mx-auto w-full max-w-7xl px-6 md:px-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[10.5px] font-bold uppercase tracking-[0.24em] text-brand">
                The line card
              </p>
              <h2 className="mt-5 max-w-2xl text-[2rem] font-extrabold leading-[1.02] tracking-[-0.03em] text-ink md:text-[2.9rem]">
                Three series. One supply chain.
              </h2>
            </div>
            <Link
              href="/wholesale"
              className="group inline-flex items-center gap-2 text-[13px] font-semibold text-ink transition-colors hover:text-brand-deep"
            >
              Request the full price list
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          <div className="mt-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
            {products.map((product) => (
              <article key={product.id} className="group flex flex-col">
                <div className="relative aspect-[4/5] overflow-hidden rounded-[1.75rem] bg-sand ring-1 ring-ink/5">
                  <Image
                    src={product.image}
                    alt={product.imageAlt}
                    fill
                    sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw"
                    className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                  />
                  <span className="absolute left-4 top-4 rounded-full bg-canvas/90 px-3 py-1 text-[9.5px] font-bold uppercase tracking-[0.16em] text-ink backdrop-blur">
                    {product.series}
                  </span>
                </div>

                <h3 className="mt-5 text-[17px] font-bold tracking-tight text-ink">
                  {product.shortName}
                </h3>
                <p className="mt-1.5 line-clamp-2 text-[12.5px] leading-relaxed text-muted">
                  {product.name}
                </p>

                <dl className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[11.5px] font-medium text-ink-soft">
                  <div className="flex items-center gap-1.5">
                    <dt className="text-muted">Height</dt>
                    <dd className="font-semibold text-ink">{product.heightIn}</dd>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <dt className="text-muted">Levels</dt>
                    <dd className="font-semibold text-ink">{product.levels}</dd>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <dt className="text-muted">MSRP</dt>
                    <dd className="font-semibold text-ink">${product.msrp}</dd>
                  </div>
                </dl>

                <div className="mt-5 flex items-center gap-4 border-t border-line/80 pt-4">
                  <Link
                    href="/wholesale"
                    className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-ink transition-colors hover:text-brand-deep"
                  >
                    Wholesale pricing
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                  <a
                    href={product.walmart}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[12.5px] font-medium text-muted transition-colors hover:text-ink"
                  >
                    Walmart listing
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </a>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------ Retail channels */}
      <section
        aria-labelledby="where-to-buy"
        className="border-y border-line/70 bg-paper py-10 md:py-12"
      >
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 md:flex-row md:items-center md:justify-between md:px-10">
          <div className="max-w-md">
            <h2
              id="where-to-buy"
              className="text-[10.5px] font-bold uppercase tracking-[0.24em] text-brand"
            >
              Where to buy
            </h2>
            <p className="mt-2.5 text-[13.5px] leading-relaxed text-ink-soft">
              Retail listings in the US and France. Trade buyers can skip the
              marketplace and order factory-direct.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {marketplaces
              .filter((channel) => channel.featured)
              .map((channel) => (
                <a
                  key={channel.id}
                  href={channel.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-2 rounded-full border border-line bg-canvas py-2 pl-3.5 pr-3 transition-colors hover:border-ink/30 hover:bg-sand/60"
                >
                  <span className="text-[12.5px] font-semibold tracking-tight text-ink">
                    {channel.name}
                  </span>
                  <span className="rounded-full bg-sand px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em] text-muted">
                    {channel.tag}
                  </span>
                  <ArrowUpRight className="h-3 w-3 text-muted transition-colors group-hover:text-ink" />
                </a>
              ))}

            <Link
              href="/shop"
              className="group inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-[12.5px] font-semibold text-canvas transition-colors hover:bg-brand-deep"
            >
              Shop all models
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------- Wholesale */}
      <section className="bg-ink py-20 text-canvas md:py-28">
        <div className="mx-auto grid w-full max-w-7xl gap-14 px-6 md:px-10 lg:grid-cols-[0.92fr_1.08fr] lg:gap-20">
          <div>
            <p className="text-[10.5px] font-bold uppercase tracking-[0.24em] text-canvas/50">
              Wholesale program
            </p>
            <h2 className="mt-5 max-w-lg text-[2rem] font-extrabold leading-[1.02] tracking-[-0.03em] md:text-[2.9rem]">
              Low MOQ. Ready to ship. Dropshipping supported.
            </h2>
            <p className="mt-6 max-w-md text-[15px] leading-relaxed text-canvas/60">
              Open an account with a single sample carton and scale into
              recurring replenishment. Our supply team prices by volume, packs
              for blind shipping and hands you the imagery and copy to sell it.
            </p>
            <Link
              href="/wholesale"
              className="group mt-9 inline-flex items-center gap-2.5 rounded-full bg-canvas px-7 py-4 text-[14px] font-semibold text-ink transition-colors hover:bg-sand"
            >
              Open the wholesale form
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          <ul className="grid gap-px overflow-hidden rounded-2xl border border-canvas/15 bg-canvas/15 sm:grid-cols-2">
            {wholesaleBenefits.map((benefit) => (
              <li key={benefit.title} className="bg-ink p-6 md:p-7">
                <h3 className="flex items-center gap-2 text-[13.5px] font-bold tracking-tight text-canvas">
                  <Check className="h-3.5 w-3.5 shrink-0 text-brand" />
                  {benefit.title}
                </h3>
                <p className="mt-2.5 text-[12.5px] leading-relaxed text-canvas/55">
                  {benefit.body}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* -------------------------------------------------------------- Story */}
      <section id="story" className="border-b border-line/70 bg-paper py-20 md:py-28">
        <div className="mx-auto grid w-full max-w-7xl gap-14 px-6 md:px-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center lg:gap-20">
          <div className="grid grid-cols-2 gap-5">
            <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-sand ring-1 ring-ink/5">
              <Image
                src="/images/team.webp"
                alt="Mekidulu design and supply team reviewing cat tree prototypes"
                fill
                sizes="(min-width: 1024px) 22vw, 46vw"
                className="object-cover"
              />
            </div>
            <div className="relative mt-8 aspect-[3/4] overflow-hidden rounded-2xl bg-sand ring-1 ring-ink/5">
              <Image
                src="/images/wood-cat-tree.webp"
                alt="Mekidulu wood cat tree with natural sisal columns in a minimal interior"
                fill
                sizes="(min-width: 1024px) 22vw, 46vw"
                className="object-cover"
              />
            </div>
          </div>

          <div>
            <p className="text-[10.5px] font-bold uppercase tracking-[0.24em] text-brand">
              The Mekidulu difference
            </p>
            <h2 className="mt-5 max-w-xl text-[2rem] font-extrabold leading-[1.02] tracking-[-0.03em] text-ink md:text-[2.9rem]">
              Furniture-grade, not pet-store grade.
            </h2>
            <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-ink-soft">
              Mekidulu started as a design lab, not a pet aisle brand. We build
              minimalist wood cat furniture that belongs in a Western living
              room: natural wood texture, wipe-clean surfaces, and a silhouette
              that does not read as a carpeted toy.
            </p>
            <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-ink-soft">
              Every model is engineered around three constraints — stability
              under load, hygiene, and modular replacement — then priced
              directly from our production line in China.
            </p>

            <blockquote className="mt-9 border-l-2 border-brand pl-5">
              <p className="text-[15px] italic leading-relaxed text-ink">
                “Design is not just what it looks like; it’s how it works for the
                feline’s natural instincts.”
              </p>
              <footer className="mt-3 text-[10.5px] font-bold uppercase tracking-[0.2em] text-muted">
                {site.legalName}
              </footer>
            </blockquote>
          </div>
        </div>
      </section>
    </>
  );
}
