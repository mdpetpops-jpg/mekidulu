import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { ArrowRight } from "@/components/icons";
import { formatJournalDate, getPostMeta } from "@/lib/journal";

export const metadata: Metadata = {
  title: "Journal",
  description:
    "Engineering notes, maintenance guides and feline behaviour research from the Mekidulu design lab.",
  alternates: { canonical: "/blog" },
  openGraph: {
    title: "Mekidulu Journal",
    description:
      "Engineering notes, maintenance guides and feline behaviour research from the Mekidulu design lab.",
    url: "/blog",
  },
};

export default function JournalPage() {
  const posts = getPostMeta();
  const [lead, ...rest] = posts;

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
                Journal
              </li>
            </ol>
          </nav>

          <p className="mt-8 text-[10.5px] font-bold uppercase tracking-[0.24em] text-brand">
            Journal
          </p>
          <h1 className="mt-5 max-w-3xl text-[2.4rem] font-extrabold leading-[0.98] tracking-[-0.035em] text-ink sm:text-[3.1rem] xl:text-[3.8rem]">
            Notes from the design lab.
          </h1>
          <p className="mt-6 max-w-2xl text-[15px] leading-relaxed text-ink-soft md:text-base">
            Structure, hygiene and feline behaviour — the engineering reasoning
            behind the furniture, written for buyers, retailers and cat owners
            who ask better questions than “is it soft?”.
          </p>
        </div>
      </section>

      <section className="bg-canvas py-14 md:py-20">
        <div className="mx-auto w-full max-w-7xl px-6 md:px-10">
          {lead ? (
            <article className="group grid gap-8 border-b border-line/80 pb-14 md:grid-cols-2 md:items-center md:gap-12">
              <Link
                href={`/blog/${lead.slug}`}
                className="relative aspect-[16/10] overflow-hidden rounded-[1.75rem] bg-sand ring-1 ring-ink/5"
              >
                <Image
                  src={lead.cover}
                  alt={lead.title}
                  fill
                  priority
                  sizes="(min-width: 768px) 48vw, 100vw"
                  className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                />
              </Link>
              <div>
                <p className="flex flex-wrap items-center gap-3 text-[10px] font-bold uppercase tracking-[0.18em] text-brand">
                  {lead.category}
                  <span className="text-muted" aria-hidden="true">
                    ·
                  </span>
                  <span className="text-muted">{formatJournalDate(lead.date)}</span>
                </p>
                <h2 className="mt-4 text-[1.7rem] font-extrabold leading-tight tracking-[-0.02em] text-ink md:text-[2.2rem]">
                  <Link href={`/blog/${lead.slug}`} className="hover:text-brand-deep">
                    {lead.title}
                  </Link>
                </h2>
                <p className="mt-4 max-w-xl text-[14px] leading-relaxed text-muted">
                  {lead.summary}
                </p>
                <Link
                  href={`/blog/${lead.slug}`}
                  className="group/link mt-6 inline-flex items-center gap-2 text-[13px] font-semibold text-ink transition-colors hover:text-brand-deep"
                >
                  Read the article
                  <ArrowRight className="h-4 w-4 transition-transform group-hover/link:translate-x-0.5" />
                </Link>
              </div>
            </article>
          ) : null}

          <div className="mt-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
            {rest.map((post) => (
              <article key={post.slug} className="group flex flex-col">
                <Link
                  href={`/blog/${post.slug}`}
                  className="relative aspect-[4/3] overflow-hidden rounded-[1.25rem] bg-sand ring-1 ring-ink/5"
                >
                  <Image
                    src={post.cover}
                    alt={post.title}
                    fill
                    sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw"
                    className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                  />
                </Link>
                <p className="mt-5 flex flex-wrap items-center gap-2.5 text-[9.5px] font-bold uppercase tracking-[0.16em] text-brand">
                  {post.category}
                  <span className="text-muted" aria-hidden="true">
                    ·
                  </span>
                  <span className="text-muted">{formatJournalDate(post.date)}</span>
                </p>
                <h3 className="mt-3 text-[16px] font-bold leading-snug tracking-tight text-ink">
                  <Link href={`/blog/${post.slug}`} className="hover:text-brand-deep">
                    {post.title}
                  </Link>
                </h3>
                <p className="mt-2 line-clamp-3 text-[12.5px] leading-relaxed text-muted">
                  {post.summary}
                </p>
                <p className="mt-4 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted">
                  {post.readingMinutes} min read
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
