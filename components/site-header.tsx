"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { ArrowRight, Close, Menu } from "@/components/icons";
import { navigation } from "@/lib/site";

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Route changes leave the mobile panel open otherwise.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <header className="sticky top-0 z-50 border-b border-line/70 bg-canvas/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-6 px-6 md:h-20 md:px-10">
        <Link
          href="/"
          className="group flex items-center gap-3"
          aria-label="Mekidulu — home"
        >
          <Image
            src="/images/logo.png"
            alt=""
            width={40}
            height={41}
            priority
            className="h-8 w-auto md:h-9"
          />
          <span className="flex flex-col leading-none">
            <span className="text-[15px] font-extrabold uppercase tracking-[0.3em] text-ink">
              Mekidulu
            </span>
            <span className="mt-1.5 text-[8.5px] font-semibold uppercase tracking-[0.24em] text-muted">
              Heavy-duty cat trees
            </span>
          </span>
        </Link>

        <nav
          aria-label="Primary"
          className="hidden items-center gap-7 lg:flex"
        >
          {navigation.map((item) => {
            const isActive =
              item.href === "/wholesale" && pathname === "/wholesale";
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={`text-[13px] font-semibold tracking-tight transition-colors hover:text-ink ${
                  isActive ? "text-ink" : "text-ink-soft"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden lg:block">
          <Link
            href="/wholesale"
            className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-[12.5px] font-semibold tracking-tight text-canvas transition-colors hover:bg-brand-deep"
          >
            Get factory pricing
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls="mobile-navigation"
          aria-label={open ? "Close menu" : "Open menu"}
          className="-mr-2 inline-flex h-10 w-10 items-center justify-center rounded-full text-ink transition-colors hover:bg-sand lg:hidden"
        >
          {open ? <Close className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open ? (
        <div
          id="mobile-navigation"
          className="border-t border-line/70 bg-canvas lg:hidden"
        >
          <nav aria-label="Mobile" className="mx-auto w-full max-w-7xl px-6 py-4">
            <ul className="flex flex-col divide-y divide-line/70">
              {navigation.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="flex items-center justify-between py-3.5 text-[15px] font-semibold text-ink"
                  >
                    {item.label}
                    <ArrowRight className="h-4 w-4 text-muted" />
                  </Link>
                </li>
              ))}
            </ul>
            <Link
              href="/wholesale"
              className="mt-4 mb-2 flex w-full items-center justify-center gap-2 rounded-full bg-ink px-5 py-3.5 text-[13px] font-semibold text-canvas"
            >
              Get factory pricing
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
