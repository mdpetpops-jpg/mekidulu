import type { Metadata } from "next";
import Link from "next/link";

import { ArrowUpRight, Check } from "@/components/icons";
import { manualFiles, manualPdfPath } from "@/lib/manuals";
import { products } from "@/lib/site";

export const metadata: Metadata = {
  title: "Assembly manuals",
  description:
    "Download the illustrated assembly sheet for every Mekidulu cat tree model — 8782, YN105, 1022, T01–T04, Y13 and more.",
  alternates: { canonical: "/manuals" },
  openGraph: {
    title: "Mekidulu assembly manuals",
    description: "Illustrated assembly sheets for every Mekidulu model.",
    url: "/manuals",
  },
};

const productName = (productId?: string) =>
  products.find((product) => product.id === productId)?.shortName;

const linkedManuals = manualFiles.filter((manual) => manual.productId);
const otherManuals = manualFiles.filter((manual) => !manual.productId);

function ManualCard({
  model,
  id,
  productId,
}: {
  model: string;
  id: string;
  productId?: string;
}) {
  return (
    <a
      href={manualPdfPath(id)}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-start justify-between gap-4 rounded-2xl border border-line bg-paper p-5 transition-colors hover:border-ink/30 hover:bg-canvas"
    >
      <span>
        <span className="block text-[10px] font-bold uppercase tracking-[0.18em] text-brand">
          {model}
        </span>
        <span className="mt-1.5 block text-[14px] font-semibold tracking-tight text-ink">
          {productId ? (productName(productId) ?? "Line card model") : "Illustrated sheet"}
        </span>
        <span className="mt-1 block text-[11.5px] text-muted">
          PDF · assembly diagram
        </span>
      </span>
      <ArrowUpRight className="mt-1 h-4 w-4 shrink-0 text-muted transition-colors group-hover:text-ink" />
    </a>
  );
}

export default function ManualsPage() {
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
                Manuals
              </li>
            </ol>
          </nav>

          <p className="mt-8 text-[10.5px] font-bold uppercase tracking-[0.24em] text-brand">
            Support
          </p>
          <h1 className="mt-5 max-w-3xl text-[2.4rem] font-extrabold leading-[0.98] tracking-[-0.035em] text-ink sm:text-[3.1rem] xl:text-[3.8rem]">
            Assembly manuals.
          </h1>
          <p className="mt-6 max-w-2xl text-[15px] leading-relaxed text-ink-soft md:text-base">
            Every model ships with an illustrated sheet — exploded steps, the
            parts list with letter codes and the fastener sizes. Download the
            one for your model before you start; the sheet is the authoritative
            source for part placement.
          </p>

          <ul className="mt-8 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:gap-x-6">
            {[
              "Build on the floor, then lift with two people",
              "Fix the anti-topple strap to a stud",
              "Tighten until snug — never overtighten birch",
            ].map((tip) => (
              <li
                key={tip}
                className="flex items-center gap-2 text-[12.5px] font-medium text-ink-soft"
              >
                <Check className="h-3.5 w-3.5 shrink-0 text-brand" />
                {tip}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="bg-canvas py-14 md:py-20">
        <div className="mx-auto w-full max-w-7xl px-6 md:px-10">
          <h2 className="text-[1.35rem] font-extrabold tracking-[-0.02em] text-ink">
            Line card models
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {linkedManuals.map((manual) => (
              <ManualCard
                key={manual.id}
                id={manual.id}
                model={manual.model}
                productId={manual.productId}
              />
            ))}
          </div>

          <h2 className="mt-14 text-[1.35rem] font-extrabold tracking-[-0.02em] text-ink">
            Further models
          </h2>
          <p className="mt-2 max-w-xl text-[12.5px] leading-relaxed text-muted">
            Sheets for models previously sold through our retail partners.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {otherManuals.map((manual) => (
              <ManualCard key={manual.id} id={manual.id} model={manual.model} />
            ))}
          </div>

          <div className="mt-14 rounded-2xl border border-line bg-paper p-6 md:p-8">
            <h2 className="text-[15px] font-bold tracking-tight text-ink">
              Missing a sheet?
            </h2>
            <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-muted">
              Tell us the model code printed on your carton and we will send the
              matching PDF. Trade buyers can request printed inserts in the
              carton as part of the OEM/ODM program.
            </p>
            <Link
              href="/wholesale"
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-[12.5px] font-semibold text-canvas transition-colors hover:bg-brand-deep"
            >
              Ask the supply team
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
