/**
 * Single source of truth for brand copy, navigation and the product line card.
 *
 * Product names, heights, levels, MSRP and retail listings are carried over
 * verbatim from the legacy static site (products.json) so pricing pages, the
 * line card and structured data never drift apart.
 */

export const site = {
  name: "Mekidulu",
  legalName: "Mekidulu Global Design Lab",
  tagline: "Heavy-duty wood cat trees, engineered for wholesale.",
  description:
    "Mekidulu builds FAS-grade birch cat furniture for retailers, distributors and dropshippers. Heavy-duty structures, low MOQ, ready-to-ship cartons and OEM/ODM support.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://mekidulu.com",
  social: {
    instagram: "https://www.instagram.com/mekidulu.us/",
    facebook: "https://www.facebook.com/mekidulu.us/",
    linkedin: "https://www.linkedin.com/in/hapen-wu-b444782b6/",
    youtube: "https://www.youtube.com/@mdpetpops",
    pinterest: "https://www.pinterest.com/mdpetpops/_pins/",
  },
} as const;

export const navigation = [
  { label: "Shop", href: "/shop" },
  { label: "Engineering", href: "/#engineering" },
  { label: "Journal", href: "/blog" },
  { label: "Manuals", href: "/manuals" },
  { label: "Wholesale", href: "/wholesale" },
] as const;

export type Product = {
  id: string;
  /** Compact name used on cards and in the line card table. */
  shortName: string;
  /** Full marketplace title, kept for SEO and retail parity. */
  name: string;
  series: string;
  heightIn: string;
  levels: number;
  msrp: number;
  image: string;
  imageAlt: string;
  walmart: string;
  highlights: readonly string[];
};

export const products: readonly Product[] = [
  {
    id: "meki-8782",
    shortName: "MEKI-8782 · Galaxy View",
    name: 'Mekidulu 8782 | The "Galaxy View" 73" Multi-Capsule Wood Cat Empire',
    series: "Galaxy Series",
    heightIn: "73 in",
    levels: 7,
    msrp: 225,
    image: "/images/product-8782.webp",
    imageAlt:
      "MEKI-8782 Galaxy View seven-level wood cat tree with three acrylic capsules",
    walmart:
      "https://www.walmart.com/ip/Mekidulu-72-8-Wooden-Cat-Tree-Tower-with-Hammock-Elegant-Slim-Natural-Hemp-Rope-Wood-White/13438662845",
    highlights: [
      "Three high-clarity acrylic capsules",
      "Seven staggered levels",
      "Widened heavy-duty base",
    ],
  },
  {
    id: "meki-yn105",
    shortName: "MEKI-YN105 · Horizon",
    name: 'Mekidulu 72" Modern Wood Cat Tree - Horizon Series Vertical Jungle',
    series: "Flagship Choice",
    heightIn: "72.1 in",
    levels: 8,
    msrp: 180,
    image: "/images/product-yn105.webp",
    imageAlt:
      "MEKI-YN105 Horizon eight-level wood cat tree with twelve sisal pillars",
    walmart: "https://www.walmart.com/ip/18117358261",
    highlights: [
      "12 natural sisal pillars",
      "Eight levels with space pod",
      "Furniture-grade birch frame",
    ],
  },
  {
    id: "meki-y18",
    shortName: "MEKI-Y18 · Emerald Forest",
    name: 'Mekidulu Y18 | The "Emerald Forest" 59" Modern Wood Cat Tower',
    series: "Emerald Series",
    heightIn: "59 in",
    levels: 6,
    msrp: 145,
    image: "/images/product-y18.webp",
    imageAlt:
      "MEKI-Y18 Emerald Forest six-level wood cat tower with botanical green accents",
    walmart:
      "https://www.walmart.com/ip/Mekidulu-6-Level-Cat-Activity-Centers-with-Installation-Screwdriver-Instructions-59-1-in-Green/13009415698",
    highlights: [
      "Botanical green accents",
      "Six levels, anti-topple strap",
      "Thickened pillars for large breeds",
    ],
  },
];

/**
 * Marketplaces where Mekidulu is listed. These are brand-level links (search
 * pages) except for the Amazon ASINs below, which point at exact listings.
 */
export type Marketplace = {
  id: string;
  name: string;
  /** Two-letter tag rendered on channel pills. */
  tag: string;
  region: string;
  url: string;
  /** Show on the homepage "Where to buy" band. */
  featured?: boolean;
  /** Amazon marketplaces share one visual treatment. */
  brand?: "amazon" | "walmart" | "cdiscount";
};

const AMAZON_SEARCH = "https://www.amazon.com/s?k=mekidulu";

export const marketplaces: readonly Marketplace[] = [
  {
    id: "amazon-us",
    name: "Amazon",
    tag: "US",
    region: "United States",
    url: AMAZON_SEARCH,
    featured: true,
    brand: "amazon",
  },
  {
    id: "amazon-uk",
    name: "Amazon",
    tag: "UK",
    region: "United Kingdom",
    url: "https://www.amazon.co.uk/s?k=mekidulu",
    featured: true,
    brand: "amazon",
  },
  {
    id: "amazon-jp",
    name: "Amazon",
    tag: "JP",
    region: "Japan",
    url: "https://www.amazon.co.jp/s?k=mekidulu",
    brand: "amazon",
  },
  {
    id: "amazon-de",
    name: "Amazon",
    tag: "DE",
    region: "Germany",
    url: "https://www.amazon.de/s?k=mekidulu",
    brand: "amazon",
  },
  {
    id: "amazon-fr",
    name: "Amazon",
    tag: "FR",
    region: "France",
    url: "https://www.amazon.fr/s?k=mekidulu",
    brand: "amazon",
  },
  {
    id: "walmart",
    name: "Walmart",
    tag: "US",
    region: "United States",
    url: "https://www.walmart.com/search?q=mekidulu",
    featured: true,
    brand: "walmart",
  },
  {
    id: "cdiscount",
    name: "Cdiscount",
    tag: "FR",
    region: "France",
    url: "https://www.cdiscount.com/search/10/mekidulu.html",
    featured: true,
    brand: "cdiscount",
  },
];

/**
 * Live Amazon listings discovered by rendering the marketplace search pages for
 * "mekidulu" (Amazon blocks plain HTTP clients). Titles are condensed from the
 * marketplace titles and each ASIN links to its exact listing. Prices are
 * geo-set per country, so no amount is printed here.
 */
export type AmazonMarket = "us" | "uk" | "de" | "fr";

export type AmazonListing = {
  asin: string;
  title: string;
  detail: string;
  badge: string;
  image: string;
  /** Marketplaces where this ASIN is live; the first is the primary link. */
  markets: readonly AmazonMarket[];
};

const AMAZON_HOSTS: Record<AmazonMarket, string> = {
  us: "www.amazon.com",
  uk: "www.amazon.co.uk",
  de: "www.amazon.de",
  fr: "www.amazon.fr",
};

export function amazonProductUrl(
  market: AmazonMarket,
  asin: string,
): string {
  return `https://${AMAZON_HOSTS[market]}/dp/${asin}`;
}

export const amazonListings: readonly AmazonListing[] = [
  {
    asin: "B0DBHM9WWY",
    title: "155 cm cat tree with hammock and two capsules",
    detail: "1 hammock · 1 house · 2 transparent space capsules · dangling ball",
    badge: "155 cm",
    image: "/images/amazon/b0dbhm9wwy.webp",
    markets: ["uk", "fr"],
  },
  {
    asin: "B0DGQ2W9Q8",
    title: "170 cm tower for large adult cats",
    detail: "Condo · stairs · scratching posts · heavy base",
    badge: "170 cm",
    image: "/images/amazon/b0dgq2w9q8.webp",
    markets: ["uk", "fr"],
  },
  {
    asin: "B0F1CWZMNP",
    title: "173 cm XXL cat tree with 13 scratching posts",
    detail: "13 sisal posts · oversized platforms · XXL footprint",
    badge: "173 cm",
    image: "/images/amazon/b0f1cwzmnp.webp",
    markets: ["de", "fr"],
  },
  {
    asin: "B0F6NGPFM3",
    title: "183 cm cat tree with four space capsules",
    detail: "4 space capsules · jute posts · extra-large platforms",
    badge: "183 cm",
    image: "/images/amazon/b0f6ngpfm3.webp",
    markets: ["de", "fr"],
  },
  {
    asin: "B0F6NQZQ16",
    title: "193 cm cat tree with ladder and den",
    detail: "Ladder · den · plush platforms · tall ceiling fit",
    badge: "193 cm",
    image: "/images/amazon/b0f6nqzq16.webp",
    markets: ["de", "fr"],
  },
  {
    asin: "B0CCV7PWW4",
    title: "165 cm eight-tier scratching post with house",
    detail: "8 tiers · cat house · large-format sisal posts",
    badge: "165 cm",
    image: "/images/amazon/b0ccv7pww4.webp",
    markets: ["de"],
  },
  {
    asin: "B0D1G6MQYY",
    title: "145 cm multi-level condo with two bowls",
    detail: "2 bowls · 1 house · multi-level platforms",
    badge: "145 cm",
    image: "/images/amazon/b0d1g6mqyy.webp",
    markets: ["uk"],
  },
  {
    asin: "B0CB13M77W",
    title: "150 cm cat tower with house and capsule",
    detail: "Cat house · transparent capsule · sisal posts",
    badge: "150 cm",
    image: "/images/amazon/b0cb13m77w.webp",
    markets: ["uk"],
  },
  {
    asin: "B0F6NGWMTK",
    title: "Ceiling-tensioned cat tree with capsule and hammock",
    detail: "Floor-to-ceiling tensioner · space capsule · hammock",
    badge: "Ceiling mount",
    image: "/images/amazon/b0f6ngwmtk.webp",
    markets: ["fr"],
  },
  {
    asin: "B0DG2PXTBK",
    title: "Ceiling-tensioned cat tree with capsule and sisal wrap",
    detail: "Ceiling stretcher · space capsule · wrapped sisal",
    badge: "Ceiling mount",
    image: "/images/amazon/b0dg2pxtbk.webp",
    markets: ["fr"],
  },
  {
    asin: "B0DGLLVQLW",
    title: "Ceiling-tensioned scratching post, 11 cm sisal",
    detail: "Floor-to-ceiling tensioner · 11 cm sisal column",
    badge: "Ceiling mount",
    image: "/images/amazon/b0dgllvqlw.webp",
    markets: ["de"],
  },
  {
    asin: "B0DX237Q5X",
    title: "Floor-to-ceiling cat tree, adjustable height",
    detail: "Adjustable floor-to-ceiling tensioner · multi-level",
    badge: "Adjustable",
    image: "/images/amazon/b0dx237q5x.webp",
    markets: ["us"],
  },
  {
    asin: "B0CZ38C7HT",
    title: "Adjustable dog stairs, 2–5 steps",
    detail: "2–5 step height adjustment · the same birch build",
    badge: "Dog steps",
    image: "/images/amazon/b0cz38c7ht.webp",
    markets: ["de", "fr"],
  },
];

/** One card per purchasable unit, mixing the line card and the Amazon range. */
export type ShopProduct = {
  id: string;
  title: string;
  detail: string;
  image: string;
  badge: string;
  specs: readonly string[];
  /** Displayed price, or a marketplace call to action. */
  price: string;
  priceNote: string;
  amazonUrl: string;
  walmartUrl?: string;
  /** Per-marketplace ASIN links, rendered as small chips on the card. */
  marketLinks: readonly { label: string; url: string }[];
  /** Portrait marketplace photos must be letterboxed, not cropped. */
  imageFit: "cover" | "contain";
};

export const shopProducts: readonly ShopProduct[] = [
  ...products.map((product) => ({
    id: product.id,
    title: product.shortName,
    detail: product.name,
    image: product.image,
    badge: product.series,
    specs: [product.heightIn, `${product.levels} levels`] as const,
    price: `$${product.msrp.toFixed(2)}`,
    priceNote: "MSRP",
    amazonUrl: AMAZON_SEARCH,
    walmartUrl: product.walmart,
    marketLinks: [] as const,
    imageFit: "cover" as const,
  })),
  ...amazonListings.map((listing) => ({
    id: listing.asin,
    title: listing.title,
    detail: listing.detail,
    image: listing.image,
    badge: listing.badge,
    specs: ["Amazon listing"] as const,
    price: "Marketplace price",
    priceNote: "set per country",
    amazonUrl: amazonProductUrl(listing.markets[0], listing.asin),
    marketLinks: listing.markets.map((market) => ({
      label: market.toUpperCase(),
      url: amazonProductUrl(market, listing.asin),
    })),
    imageFit: "contain" as const,
  })),
];

/**
 * Volume bands offered on the wholesale form. Kept in one place so the API
 * validation, the select control and the SQL check constraint stay aligned.
 */
export const volumeBands = ["5-50", "50-200", "200+"] as const;
export type VolumeBand = (typeof volumeBands)[number];

export const trustMetrics = [
  {
    value: "40%",
    label: "Lower landed cost",
    detail: "Factory-direct pricing versus retail-first brands.",
  },
  {
    value: "5–200+",
    label: "Units per order",
    detail: "Sample boxes through to full container loads.",
  },
  {
    value: "FAS",
    label: "Birch plywood",
    detail: "No particle board, no formaldehyde off-gassing.",
  },
  {
    value: "OEM/ODM",
    label: "Your spec, your carton",
    detail: "Finish, sizing and retail packaging to order.",
  },
] as const;

export const engineeringSpecs = [
  {
    index: "01",
    title: "25 mm reinforced base plate",
    body: "A widened, weight-loaded base keeps the centre of gravity low, so the tower absorbs the shock of sprint-and-leap landings instead of walking across the floor.",
  },
  {
    index: "02",
    title: "10 × 10 cm core columns",
    body: "Solid birch columns replace the soggy cardboard tubes found in mass-market towers. No flex, no creak, no wobble under three adult cats.",
  },
  {
    index: "03",
    title: "FAS-grade birch plywood",
    body: "Furniture-grade plywood with a non-porous, moisture-resistant finish. Fur and spills wipe away in seconds — no carpet sponge, no lingering odour.",
  },
  {
    index: "04",
    title: "Anti-topple wall strap",
    body: "Every carton ships with a steel wall anchor and illustrated hardware kit, so installations meet residential furniture stability expectations.",
  },
] as const;

export const wholesaleBenefits = [
  {
    title: "Low MOQ",
    body: "Start from a single sample carton and scale into mixed pallets. No container commitment to open an account.",
  },
  {
    title: "Ready to ship",
    body: "Production-proven models are packed and staged, so replenishment does not wait on a new factory run.",
  },
  {
    title: "Dropshipping supported",
    body: "Blind-ship cartons, no pricing inserts, and product imagery plus copy you can publish on your own storefront.",
  },
  {
    title: "OEM / ODM",
    body: "Custom finishes, platform layouts and private-label cartons, engineered with our design lab in China.",
  },
] as const;

export const wholesaleSteps = [
  {
    step: "01",
    title: "Tell us your volume",
    body: "Share your business email and the volume band you buy in. Two fields, thirty seconds.",
  },
  {
    step: "02",
    title: "Receive pricing and specs",
    body: "A real person on the supply team replies with your price list, MOQ, carton dimensions and lead times.",
  },
  {
    step: "03",
    title: "Sample, then scale",
    body: "Approve a sample unit, confirm packaging, and we move you onto a recurring replenishment schedule.",
  },
] as const;
