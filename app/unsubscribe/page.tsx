import type { Metadata } from "next";

import { UnsubscribeForm } from "@/components/unsubscribe-form";

export const metadata: Metadata = {
  title: "Unsubscribe",
  description: "Remove your store from Mekidulu outreach email.",
  robots: { index: false, follow: false },
};

export default function UnsubscribePage() {
  return (
    <section className="bg-canvas py-16 md:py-24">
      <div className="mx-auto w-full max-w-lg px-6">
        <p className="text-[10.5px] font-bold uppercase tracking-[0.24em] text-brand">
          Email preferences
        </p>
        <h1 className="mt-4 text-[2rem] font-extrabold leading-tight tracking-[-0.03em] text-ink md:text-[2.4rem]">
          Unsubscribe from outreach.
        </h1>
        <p className="mt-4 text-[14px] leading-relaxed text-ink-soft">
          This removes your address from our B2B outreach list. You will still
          receive replies to any inquiry you send us directly.
        </p>
        <div className="mt-8">
          <UnsubscribeForm />
        </div>
      </div>
    </section>
  );
}
