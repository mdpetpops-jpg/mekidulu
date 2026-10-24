/**
 * Wholesale banner appended to every C-side (consumer) article.
 *
 * The generator stores the literal HTML in `blog_posts.content`; the article
 * renderer strips that block and renders this component instead, so the markup
 * is identical on the page but cannot inject arbitrary HTML.
 */
export function B2bBanner() {
  return (
    <div className="b2b-banner mt-10 rounded-2xl border border-brand/25 bg-brand/[0.06] p-6 md:p-8">
      <h3 className="text-[17px] font-extrabold tracking-tight text-ink">Are you a pet store owner?</h3>
      <p className="mt-2 text-[13.5px] leading-relaxed text-ink-soft">
        Get wholesale pricing on our heavy-duty cat trees.
      </p>
      <a
        href="/wholesale"
        className="mt-4 inline-flex h-10 items-center justify-center rounded-full bg-ink px-6 text-[12.5px] font-semibold text-canvas transition-colors hover:bg-brand-deep"
      >
        Get a Quote
      </a>
    </div>
  );
}
