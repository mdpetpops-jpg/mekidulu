import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { SupportChat } from "@/components/support-chat";
import { TrafficBeacon } from "@/components/traffic-beacon";
import { site } from "@/lib/site";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: "Mekidulu | Heavy-Duty Wood Cat Trees for Wholesale",
    template: "%s | Mekidulu",
  },
  description: site.description,
  applicationName: site.name,
  keywords: [
    "cat tree manufacturer",
    "wood cat furniture",
    "wholesale cat trees",
    "heavy-duty cat tree",
    "dropshipping cat trees",
    "OEM cat tree",
  ],
  alternates: {
    canonical: "/",
    types: { "application/rss+xml": "/feed.xml" },
  },
  openGraph: {
    type: "website",
    siteName: site.name,
    locale: "en_US",
    url: "/",
    title: "Mekidulu | Heavy-Duty Wood Cat Trees for Wholesale",
    description: site.description,
    images: [
      {
        url: "/images/hero-banner-02.webp",
        width: 1376,
        height: 768,
        alt: "Mekidulu heavy-duty wood cat trees in a modern living room",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Mekidulu | Heavy-Duty Wood Cat Trees for Wholesale",
    description: site.description,
    images: ["/images/hero-banner-02.webp"],
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#101613",
  width: "device-width",
  initialScale: 1,
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: site.name,
  legalName: site.legalName,
  url: site.url,
  logo: `${site.url}/images/logo.png`,
  description: site.description,
  sameAs: Object.values(site.social),
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={jakarta.variable}>
      <body className="flex min-h-dvh flex-col font-sans">
        <a
          href="#main"
          className="sr-only rounded-full bg-ink px-4 py-2 text-sm font-semibold text-canvas focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100]"
        >
          Skip to content
        </a>
        <SiteHeader />
        <main id="main" className="flex-1">
          {children}
        </main>
        <SiteFooter />
        <SupportChat />
        <TrafficBeacon />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
      </body>
    </html>
  );
}
