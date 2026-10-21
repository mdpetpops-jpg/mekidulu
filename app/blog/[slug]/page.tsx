import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ArrowRight } from "@/components/icons";
import {
  formatJournalDate,
  getPublishedPost,
  listPublishedPosts,
  renderMarkdown,
} from "@/lib/blog";

type PostPageProps = {
  params: Promise<{ slug: string }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: PostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublishedPost(slug);
  if (!post) return { title: "Article not found" };

  return {
    title: post.title,
    description: post.summary,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.summary,
      url: `/blog/${post.slug}`,
      publishedTime: post.date,
      images: [{ url: post.cover, alt: post.title }],
    },
  };
}

export default async function JournalPostPage({ params }: PostPageProps) {
  const { slug } = await params;
  const post = await getPublishedPost(slug);
  if (!post) notFound();

  const content = await renderMarkdown(post.content);
  const related = (await listPublishedPosts())
    .filter((entry) => entry.slug !== post.slug)
    .slice(0, 2);

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    datePublished: post.date,
    description: post.summary,
    image: post.cover,
    author: { "@type": "Organization", name: "Mekidulu Global Design Lab" },
  };

  return (
    <>
      <article className="bg-canvas">
        <header className="mx-auto w-full max-w-3xl px-6 pb-8 pt-12 md:px-0 md:pt-16">
          <nav aria-label="Breadcrumb" className="text-[11.5px] font-medium text-muted">
            <ol className="flex items-center gap-2">
              <li>
                <Link href="/" className="transition-colors hover:text-ink">
                  Home
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li>
                <Link href="/blog" className="transition-colors hover:text-ink">
                  Journal
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li className="line-clamp-1 text-ink" aria-current="page">
                {post.title}
              </li>
            </ol>
          </nav>

          <p className="mt-8 flex flex-wrap items-center gap-3 text-[10px] font-bold uppercase tracking-[0.18em] text-brand">
            {post.category}
            <span className="text-muted" aria-hidden="true">
              ·
            </span>
            <span className="text-muted">{formatJournalDate(post.date)}</span>
            <span className="text-muted" aria-hidden="true">
              ·
            </span>
            <span className="text-muted">{post.readingMinutes} min read</span>
          </p>

          <h1 className="mt-5 text-[2rem] font-extrabold leading-[1.05] tracking-[-0.03em] text-ink md:text-[2.9rem]">
            {post.title}
          </h1>

          <p className="mt-5 text-[15px] leading-relaxed text-ink-soft md:text-base">
            {post.summary}
          </p>
        </header>

        <div className="mx-auto w-full max-w-4xl px-6 md:px-0">
          <div className="relative aspect-[16/9] overflow-hidden rounded-[1.5rem] bg-sand ring-1 ring-ink/5">
            <Image
              src={post.cover}
              alt={post.title}
              fill
              priority
              sizes="(min-width: 896px) 896px, 100vw"
              className="object-cover"
            />
          </div>

          <div
            className="prose-journal mt-12 pb-16"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        </div>
      </article>

      <section className="border-y border-line/70 bg-paper py-14 md:py-16">
        <div className="mx-auto w-full max-w-7xl px-6 md:px-10">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <h2 className="text-[1.35rem] font-extrabold tracking-[-0.02em] text-ink">
              Keep reading
            </h2>
            <Link
              href="/blog"
              className="group inline-flex items-center gap-2 text-[12.5px] font-semibold text-ink transition-colors hover:text-brand-deep"
            >
              All articles
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          <div className="mt-8 grid gap-8 sm:grid-cols-2">
            {related.map((entry) => (
              <Link
                key={entry.slug}
                href={`/blog/${entry.slug}`}
                className="group flex items-start gap-4 rounded-2xl border border-line bg-canvas p-4 transition-colors hover:border-ink/25"
              >
                <span className="relative h-20 w-24 shrink-0 overflow-hidden rounded-xl bg-sand">
                  <Image
                    src={entry.cover}
                    alt=""
                    fill
                    sizes="96px"
                    className="object-cover"
                  />
                </span>
                <span>
                  <span className="block text-[9.5px] font-bold uppercase tracking-[0.16em] text-brand">
                    {entry.category}
                  </span>
                  <span className="mt-1.5 block text-[13.5px] font-semibold leading-snug text-ink group-hover:text-brand-deep">
                    {entry.title}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
    </>
  );
}
