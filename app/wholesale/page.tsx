import type { Metadata } from "next";
import Link from "next/link";

import { ArrowRight, Check } from "@/components/icons";
import { WholesaleForm } from "@/components/wholesale-form";
import { site, wholesaleBenefits, wholesaleSteps } from "@/lib/site";

export const metadata: Metadata = {
  title: "Wholesale & Dropshipping Inquiry",
  description:
    "Request factory-direct pricing on Mekidulu heavy-duty wood cat trees. Low MOQ, ready-to-ship cartons, dropshipping support and OEM/ODM programs.",
  alternates: { canonical: "/wholesale" },
  openGraph: {
    title: "Wholesale & Dropshipping Inquiry | Mekidulu",
    description:
      "Factory-direct pricing on heavy-duty wood cat trees. Low MOQ, dropshipping supported, OEM/ODM available.",
    url: "/wholesale",
  },
};

const buyerTypes = [
  "Pet retailers",
  "Distributors",
  "Dropshippers",
  "Marketplace sellers",
] as const;

export default function WholesalePage() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-line/70 bg-canvas">
        <div className="relative mx-auto w-full max-w-7xl px-6 pb-12 pt-12 md:px-10 md:pb-16 md:pt-16">
          <nav aria-label="Breadcrumb" className="text-[11.5px] font-medium text-muted">
            <ol className="flex items-center gap-2">
              <li>
                <Link href="/" className="transition-colors hover:text-ink">
                  Home
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li className="text-ink" aria-current="page">
                Wholesale
              </li>
            </ol>
          </nav>

          <p className="mt-8 text-[10.5px] font-bold uppercase tracking-[0.24em] text-brand">
            Wholesale & dropshipping
          </p>
          <h1 className="mt-5 max-w-3xl text-[2.4rem] font-extrabold leading-[0.98] tracking-[-0.035em] text-ink sm:text-[3.1rem] xl:text-[3.8rem]">
            Factory pricing, on your terms.
          </h1>
          <p className="mt-6 max-w-2xl text-[15px] leading-relaxed text-ink-soft md:text-base">
            Tell us who you are and how much volume you move. We come back with
            your price list, MOQ, carton specs and lead times — no account
            forms, no automated sales sequence.
          </p>

          <ul className="mt-8 flex flex-wrap gap-2.5">
            {buyerTypes.map((buyer) => (
              <li
                key={buyer}
                className="rounded-full border border-line bg-paper/70 px-3.5 py-1.5 text-[11.5px] font-semibold text-ink-soft"
              >
                {buyer}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="bg-canvas py-14 md:py-20">
        <div className="mx-auto grid w-full max-w-7xl gap-14 px-6 md:px-10 lg:grid-cols-[1fr_0.85fr] lg:gap-16">
          <div>
            <h2 className="text-[1.6rem] font-extrabold tracking-[-0.02em] text-ink md:text-[1.9rem]">
              Why buyers switch to Mekidulu
            </h2>
            <ul className="mt-8 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2">
              {wholesaleBenefits.map((benefit) => (
                <li key={benefit.title} className="bg-paper p-6">
                  <h3 className="flex items-center gap-2 text-[13.5px] font-bold tracking-tight text-ink">
                    <Check className="h-3.5 w-3.5 shrink-0 text-brand" />
                    {benefit.title}
                  </h3>
                  <p className="mt-2.5 text-[12.5px] leading-relaxed text-muted">
                    {benefit.body}
                  </p>
                </li>
              ))}
            </ul>

            <h2 className="mt-14 text-[1.6rem] font-extrabold tracking-[-0.02em] text-ink md:text-[1.9rem]">
              How it works
            </h2>
            <ol className="mt-8 border-t border-line/80">
              {wholesaleSteps.map((step) => (
                <li
                  key={step.step}
                  className="grid grid-cols-[auto_1fr] gap-x-5 border-b border-line/80 py-5"
                >
                  <span className="font-mono text-[11px] font-semibold tracking-widest text-brand">
                    {step.step}
                  </span>
                  <div>
                    <h3 className="text-[15px] font-bold tracking-tight text-ink">
                      {step.title}
                    </h3>
                    <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted">
                      {step.body}
                    </p>
                  </div>
                </li>
              ))}
            </ol>

            <p className="mt-8 text-[12.5px] leading-relaxed text-muted">
              Already have a spec sheet or target landed cost? Mention it in the
              note field and we will engineer around it.
            </p>
          </div>

          <div className="lg:pt-2">
            <div className="lg:sticky lg:top-28">
              <WholesaleForm />

              <p className="mt-5 flex items-start gap-2.5 rounded-xl bg-sand/70 px-4 py-3 text-[11.5px] leading-relaxed text-ink-soft">
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-deep" />
                <span>
                  Samples are available before you commit to a volume. Ask for
                  one in your note.
                </span>
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-line/70 bg-paper py-14 md:py-16">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 md:flex-row md:items-center md:justify-between md:px-10">
          <div>
            <h2 className="text-[1.35rem] font-extrabold tracking-[-0.02em] text-ink">
              Not ready to talk numbers?
            </h2>
            <p className="mt-2 max-w-xl text-[13.5px] leading-relaxed text-muted">
              Browse the production-proven models first — every spec, height and
              retail listing is published on the line card.
            </p>
          </div>
          <Link
            href="/#collections"
            className="group inline-flex shrink-0 items-center gap-2.5 rounded-full border border-line px-6 py-3.5 text-[13.5px] font-semibold text-ink transition-colors hover:border-ink/30 hover:bg-canvas"
          >
            See the line card
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
        <p className="mx-auto mt-10 w-full max-w-7xl px-6 text-[10.5px] font-semibold uppercase tracking-[0.2em] text-muted md:px-10">
          {site.legalName} · Production in China · Shipping worldwide
        </p>
      </section>
    </>
  );
}
