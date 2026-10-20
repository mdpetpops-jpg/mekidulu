import Image from "next/image";
import Link from "next/link";

import {
  Facebook,
  Instagram,
  LinkedIn,
  Pinterest,
  YouTube,
} from "@/components/icons";
import { site } from "@/lib/site";

const columns = [
  {
    title: "Explore",
    links: [
      { label: "Shop all models", href: "/shop" },
      { label: "Product catalogue (PDF)", href: "/catalog" },
      { label: "Product line card", href: "/#collections" },
      { label: "Journal", href: "/blog" },
      { label: "Assembly manuals", href: "/manuals" },
      { label: "Wholesale program", href: "/wholesale" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "The Mekidulu difference", href: "/#story" },
      { label: "Start a wholesale account", href: "/wholesale" },
    ],
  },
] as const;

const socials = [
  { label: "Instagram", href: site.social.instagram, Icon: Instagram },
  { label: "Facebook", href: site.social.facebook, Icon: Facebook },
  { label: "LinkedIn", href: site.social.linkedin, Icon: LinkedIn },
  { label: "YouTube", href: site.social.youtube, Icon: YouTube },
  { label: "Pinterest", href: site.social.pinterest, Icon: Pinterest },
] as const;

export function SiteFooter() {
  return (
    <footer className="bg-ink text-canvas">
      <div className="mx-auto w-full max-w-7xl px-6 py-16 md:px-10 md:py-20">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr] lg:gap-16">
          <div className="max-w-sm">
            <div className="flex items-center gap-3">
              <Image
                src="/images/logo-white-mark.png"
                alt=""
                width={26}
                height={28}
                className="h-7 w-auto opacity-90"
              />
              <span className="text-[15px] font-extrabold uppercase tracking-[0.3em] text-canvas">
                Mekidulu
              </span>
            </div>
            <p className="mt-6 text-[14px] leading-relaxed text-canvas/60">
              We build heavy-duty wood cat furniture for retailers, distributors
              and dropshippers. FAS-grade birch structures, factory-direct
              pricing and OEM/ODM support from our production line in China.
            </p>
            <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.22em] text-canvas/40">
              Premium quality · Low MOQ · Dropshipping supported
            </p>
          </div>

          {columns.map((column) => (
            <div key={column.title}>
              <h2 className="text-[10px] font-bold uppercase tracking-[0.26em] text-canvas/40">
                {column.title}
              </h2>
              <ul className="mt-5 space-y-3.5">
                {column.links.map((link) => (
                  <li key={link.href + link.label}>
                    <Link
                      href={link.href}
                      className="text-[14px] font-medium text-canvas/70 transition-colors hover:text-canvas"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col gap-8 border-t border-canvas/10 pt-8 md:mt-16 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            {socials.map(({ label, href, Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Mekidulu on ${label}`}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-canvas/15 text-canvas/60 transition-colors hover:border-canvas/40 hover:text-canvas"
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>

          <div className="flex flex-col gap-2 text-[11px] uppercase tracking-[0.18em] text-canvas/40 md:flex-row md:items-center md:gap-6">
            <span>
              © {new Date().getFullYear()} {site.legalName}
            </span>
            <span className="hidden md:inline" aria-hidden="true">
              ·
            </span>
            <span>Wood cat furniture, engineered in China</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
