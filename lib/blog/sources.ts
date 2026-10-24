/**
 * Blog topic sourcing, cheapest-first.
 *
 *   1. rss      — Reddit's public Atom feed. The `.json` API returns 403 to
 *                 data-centre IPs; the `.rss` endpoint does not.
 *   2. trends   — Google Trends daily RSS, filtered to cat-related terms.
 *                 (pytrends is Python-only — a Node runtime cannot run it — so
 *                 the equivalent single request is made here, once, no retry.)
 *   3. fallback — 20 hard-coded cat-owner pain points, picked by day.
 *
 * No XML library: both feeds are simple Atom/RSS and a 40-line extractor keeps
 * the dependency tree (and therefore the Vercel build) small and predictable.
 *
 * Token budget: five titles + 150 chars of summary. No comments are fetched.
 */

export type TopicSource = "rss" | "trends" | "fallback";

export type Attempt = { channel: string; ok: boolean; status?: number };

export type Topic = {
  title: string;
  excerpt: string;
  source: TopicSource;
  attempts: Attempt[];
};

type Seed = { title: string; excerpt: string };

const FEEDS = ["CatAdvice", "cats", "CatTraining"];
const TIMEOUT_MS = 8_000;
const MAX_ITEMS = 5;
const EXCERPT_CHARS = 150;

function decodeEntities(value: string): string {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

function plainText(html: string): string {
  return decodeEntities(html)
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Pulls `<tag>…</tag>` blocks out of an Atom or RSS document. */
function blocks(xml: string, tag: string): string[] {
  const pattern = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "gi");
  const found: string[] = [];
  let match = pattern.exec(xml);
  while (match) {
    found.push(match[1]);
    match = pattern.exec(xml);
  }
  return found;
}

function innerTag(block: string, tag: string): string {
  const pattern = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i");
  return block.match(pattern)?.[1] ?? "";
}

async function fetchXml(url: string, label: string, attempts: Attempt[]): Promise<string | null> {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const response = await fetch(url, {
        headers: { "User-Agent": "mekidulu-content-bot/1.0 (site admin)" },
        signal: controller.signal,
      });
      attempts.push({ channel: `${label}#${attempt + 1}`, ok: response.ok, status: response.status });
      if (response.ok) return await response.text();
    } catch {
      attempts.push({ channel: `${label}#${attempt + 1}`, ok: false });
    } finally {
      clearTimeout(timer);
    }
  }
  return null;
}

async function redditRss(subreddit: string, attempts: Attempt[]): Promise<Seed[]> {
  const xml = await fetchXml(
    `https://www.reddit.com/r/${subreddit}/top/.rss?t=day&limit=${MAX_ITEMS}`,
    `rss:${subreddit}`,
    attempts,
  );
  if (!xml) return [];

  return blocks(xml, "entry")
    .map((entry) => {
      const title = plainText(innerTag(entry, "title"));
      const content = plainText(innerTag(entry, "content") || innerTag(entry, "summary"));
      return { title, excerpt: content.slice(0, EXCERPT_CHARS) };
    })
    .filter((item) => item.title.length > 10)
    .slice(0, MAX_ITEMS);
}

const CAT_WORDS = /cat|kitten|feline|scratch|climb|litter|purr/i;

async function googleTrends(attempts: Attempt[]): Promise<Seed[]> {
  const xml = await fetchXml(
    "https://trends.google.com/trends/trendingsearches/daily/rss?geo=US",
    "trends:US",
    attempts,
  );
  if (!xml) return [];

  return blocks(xml, "item")
    .map((item) => plainText(innerTag(item, "title")))
    .filter((title) => CAT_WORDS.test(title))
    .slice(0, 3)
    .map((title) => ({
      title: `${title} — what should cat owners actually do?`,
      excerpt: `Trending search in the US: ${title}`,
    }));
}

/** Twenty real pain points, used when both networks fail. */
export const FALLBACK_QUESTIONS: { title: string; excerpt: string }[] = [
  { title: "My cat keeps scratching my leather sofa instead of the scratching post", excerpt: "Two posts, both ignored. The sofa is destroyed and I am out of ideas." },
  { title: "Is a floor-to-ceiling cat tree stable for a 15lb Maine Coon?", excerpt: "My cat is huge and the last tower leaned every time he jumped off it." },
  { title: "Why does my cat tree wobble when my cat jumps on it?", excerpt: "Cheap carpet tower from a marketplace. The base feels thin and the whole thing leans." },
  { title: "My two cats fight over the top platform", excerpt: "One high spot, two cats, constant hissing. Is a second tree the answer?" },
  { title: "Carpet or wood cat furniture for a small apartment?", excerpt: "Carpet traps hair and smells. Wood looks better but I worry it is slippery." },
  { title: "How do I stop a cat tree from tipping over?", excerpt: "My cats race up it and I am scared it will fall on one of them." },
  { title: "Is a tall cat tree worth it for two cats?", excerpt: "They fight over the one high spot we have and I am not sure what to buy." },
  { title: "Should I replace the sisal rope or the whole cat tree?", excerpt: "Posts are shredded but the platforms are fine. It is a big tower." },
  { title: "My cat ignores every bed I buy but sleeps on a cardboard box", excerpt: "I have spent a fortune on soft beds. The box wins every time." },
  { title: "Do cats actually use the top platform, or is it a waste?", excerpt: "Mine only uses the middle shelf. Wondering whether height matters for a single cat." },
  { title: "How do you clean a fabric cat tree without it smelling?", excerpt: "It absorbs everything and the covers do not come off." },
  { title: "My cat is scratching the wall next to the post", excerpt: "The post is right there and she still picks the wall." },
  { title: "Best cat tree for a senior cat with arthritis?", excerpt: "She cannot jump like she used to but still wants to be up high." },
  { title: "Cat tree smells like urine and I cannot find the spot", excerpt: "I have scrubbed it twice. It still smells on warm days." },
  { title: "Will a heavy cat tree damage my wooden floor?", excerpt: "Renting, so I cannot afford scratches in the finish." },
  { title: "Why does my cat slide off the top of the tower?", excerpt: "The platform is small and slippery. He looks uncomfortable up there." },
  { title: "How many scratching posts does one cat actually need?", excerpt: "One post, one tree, and she still uses the corner of the rug." },
  { title: "My cat only uses the tree when I am in the room", excerpt: "The moment I leave he is back on the sofa." },
  { title: "Is it worth anchoring a cat tree to the wall?", excerpt: "Landlord says no drilling, but the tower is genuinely unsafe." },
  { title: "Cat tree arrived wobbly and the seller says it is normal", excerpt: "It sways a good five centimetres when the cat lands on it." },
];

export function pickFallback(seed = Date.now()): Seed & { source: TopicSource } {
  const index = Math.floor(seed / 86_400_000) % FALLBACK_QUESTIONS.length;
  const question = FALLBACK_QUESTIONS[index];
  return { title: question.title, excerpt: question.excerpt, source: "fallback" };
}

export async function findTopic(): Promise<Topic> {
  const attempts: Attempt[] = [];

  for (const subreddit of FEEDS) {
    const items = await redditRss(subreddit, attempts);
    if (items.length > 0) {
      const chosen = items[Math.floor(Math.random() * items.length)];
      return { title: chosen.title, excerpt: chosen.excerpt, source: "rss", attempts };
    }
  }

  const trends = await googleTrends(attempts);
  if (trends.length > 0) {
    const chosen = trends[Math.floor(Math.random() * trends.length)];
    return { title: chosen.title, excerpt: chosen.excerpt, source: "trends", attempts };
  }

  const fallback = pickFallback();
  return { title: fallback.title, excerpt: fallback.excerpt, source: "fallback", attempts };
}
