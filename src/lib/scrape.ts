/**
 * Reads a company's public website into plain text for the profile draft. No HTML parser: a
 * few regexes are enough for "what does this company do", and the model does the reading.
 *
 * The home page is read first and its own links decide which pages follow: a fixed list of
 * paths misses most real sites (bolt.eu has no /about, it has /en/about-us/). The fixed list
 * stays as a fallback for sites whose navigation is drawn by JavaScript.
 */

/** Fallback paths. Estonian: meist = about us, teenused = services. */
const FALLBACK_PATHS = ['/about', '/about-us', '/services', '/en', '/en/about', '/en/services', '/meist', '/teenused'];

/** Words in a link's path or text that point at "what this company does and for whom". */
const LINK_WORDS: [RegExp, number][] = [
  [/about|company|who-we-are|meist|ettevote/, 5],
  [/services|solutions|what-we-do|teenused|lahendused|offering/, 5],
  [/business|enterprise|b2b|partners?|for-companies/, 4],
  [/products?|platform|capabilit|industr/, 3],
  [/clients|customers|cases?|case-studies|references|work|portfolio/, 3],
  [/security|trust|iso|gdpr|compliance/, 2],
];
/** Links that never describe the company: legal, accounts, content feeds, files. */
const SKIP_LINK = /login|sign-?in|sign-?up|register|account|cart|checkout|privacy|cookie|terms|legal|careers?|jobs|blog|news|insights|articles|stories|press|events?|webinars?|\.(pdf|jpg|jpeg|png|svg|zip)$|^mailto:|^tel:|^#/i;

const MAX_PAGES = 6;
const PER_PAGE_CHARS = 3500;
const TOTAL_CHARS = 16000;
const TIMEOUT_MS = 8000;

const FREEMAIL = new Set([
  'gmail.com', 'googlemail.com', 'outlook.com', 'hotmail.com', 'live.com', 'yahoo.com',
  'icloud.com', 'me.com', 'proton.me', 'protonmail.com', 'mail.ru', 'yandex.ru', 'mail.ee',
]);

/** The company domain behind a work email, or null for a personal mailbox. */
export function domainFromEmail(email: string): string | null {
  const domain = email.split('@')[1]?.toLowerCase().trim();
  return domain && !FREEMAIL.has(domain) ? domain : null;
}

export function normaliseWebsite(input: string): string {
  const trimmed = input.trim().replace(/\/+$/, '');
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

export interface SitePage {
  url: string;
  text: string;
}

/** One fetch attempt, kept for the debug view: what was tried and why it was or was not used. */
export interface ScrapeStep {
  url: string;
  outcome: string;
  chars?: number;
}

export interface ScrapeTrace {
  pages: SitePage[];
  steps: ScrapeStep[];
  ms: number;
}

/** Fetches the home page, then the pages its links point to. Returns whatever had real content. */
export async function readWebsite(website: string): Promise<SitePage[]> {
  return (await readWebsiteTraced(website)).pages;
}

export async function readWebsiteTraced(website: string): Promise<ScrapeTrace> {
  const started = Date.now();
  const base = normaliseWebsite(website);
  const steps: ScrapeStep[] = [];

  const home = await fetchHtml(base, steps);
  const origin = home ? new URL(home.url).origin : new URL(base).origin;
  const homeLocale = home ? localeOf(new URL(home.url).pathname) : null;

  // English first when the site is multilingual: the prompt and the product are in English.
  let enHome: Fetched | null = null;
  if (home && homeLocale && !homeLocale.startsWith('en')) {
    enHome = await fetchHtml(`${origin}/en/`, steps);
  }

  const linkSource = enHome ?? home;
  const candidates = linkSource ? pickLinks(linkSource.html, linkSource.url, origin) : [];
  const urls = candidates.length ? candidates : FALLBACK_PATHS.map((p) => origin + p);
  if (!candidates.length) steps.push({ url: origin, outcome: 'no useful links on the home page, trying fallback paths' });

  const rest = await Promise.all(urls.slice(0, MAX_PAGES + 2).map((u) => fetchHtml(u, steps)));
  // A link can redirect somewhere the link filter would have refused (a blog post, a login).
  const start = enHome ?? home;
  const fetched = [start, ...rest].filter((p): p is Fetched => {
    if (!p) return false;
    if (p !== start && SKIP_LINK.test(new URL(p.url).pathname)) {
      steps.push({ url: p.url, outcome: 'skipped: redirected to a page that does not describe the company' });
      return false;
    }
    return true;
  });

  // One page per path: /et-ee/about and /en/about are the same page in two languages.
  const byPath = new Map<string, Fetched>();
  for (const p of fetched) {
    const key = withoutLocale(new URL(p.url).pathname);
    const prev = byPath.get(key);
    if (!prev || (isEnglish(p.url) && !isEnglish(prev.url))) byPath.set(key, p);
    else if (prev.url !== p.url) steps.push({ url: p.url, outcome: 'skipped: same page as ' + prev.url });
  }

  // Lines that repeat on several pages are navigation and footers, not content.
  const texts = [...byPath.values()].map((p) => ({ url: p.url, lines: contentLines(htmlToText(p.html)) }));
  const seenOn = new Map<string, number>();
  for (const t of texts) for (const l of new Set(t.lines)) seenOn.set(l, (seenOn.get(l) ?? 0) + 1);
  const shared = texts.length > 2 ? 2 : Infinity;

  const pages: SitePage[] = [];
  const seenText = new Set<string>();
  let budget = TOTAL_CHARS;
  for (const t of texts.slice(0, MAX_PAGES)) {
    const text = t.lines.filter((l, i) => i === 0 || (seenOn.get(l) ?? 0) < shared).join('\n').slice(0, Math.min(PER_PAGE_CHARS, budget));
    if (text.length < 200 || budget <= 0 || seenText.has(text.slice(0, 300))) {
      steps.push({ url: t.url, outcome: text.length < 200 ? 'skipped: too little text after removing navigation' : 'skipped: duplicate or over budget', chars: text.length });
      continue;
    }
    seenText.add(text.slice(0, 300));
    budget -= text.length;
    pages.push({ url: t.url, text });
    steps.push({ url: t.url, outcome: 'used', chars: text.length });
  }

  return { pages, steps, ms: Date.now() - started };
}

interface Fetched {
  url: string;
  html: string;
}

async function fetchHtml(url: string, steps: ScrapeStep[]): Promise<Fetched | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'user-agent': 'Mozilla/5.0 (compatible; crossdesk/0.1; +profile-draft)',
        accept: 'text/html',
        'accept-language': 'en;q=1, et;q=0.5',
      },
    });
    const type = res.headers.get('content-type') ?? '';
    if (!res.ok || !type.includes('text/html')) {
      steps.push({ url, outcome: `HTTP ${res.status}${type.includes('text/html') ? '' : ` (${type || 'no type'})`}` });
      return null;
    }
    const html = await res.text();
    steps.push({ url: res.url === url ? url : `${url} → ${res.url}`, outcome: 'fetched', chars: html.length });
    return { url: res.url, html };
  } catch (e) {
    steps.push({ url, outcome: controller.signal.aborted ? `timeout after ${TIMEOUT_MS / 1000}s` : `failed: ${(e as Error).message}` });
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** Same-site links, scored by how likely they are to say what the company does. */
function pickLinks(html: string, pageUrl: string, origin: string): string[] {
  const scored = new Map<string, { score: number; kind: number }>();
  const pageLocale = localeOf(new URL(pageUrl).pathname);
  for (const m of html.matchAll(/<a\b[^>]*href=["']([^"'#]+)["'][^>]*>([\s\S]*?)<\/a>/gi)) {
    const href = m[1].trim();
    if (SKIP_LINK.test(href)) continue;
    let url: URL;
    try {
      url = new URL(href, pageUrl);
    } catch {
      continue;
    }
    if (url.origin !== origin) continue;
    const path = url.pathname.toLowerCase();
    if (path === '/' || path.split('/').filter(Boolean).length > 3) continue;
    const locale = localeOf(path);
    if (locale && pageLocale && locale !== pageLocale) continue;

    const label = m[2].replace(/<[^>]+>/g, ' ').toLowerCase();
    const hay = `${path} ${label}`;
    let score = 0;
    let kind = -1;
    LINK_WORDS.forEach(([re, w], i) => {
      if (!re.test(hay)) return;
      score += w;
      if (kind < 0) kind = i;
    });
    if (!score) continue;
    // Shallow pages are overviews; deep ones are one product or one case.
    score -= path.split('/').filter(Boolean).length - (locale ? 1 : 0);
    const key = url.origin + url.pathname.replace(/\/+$/, '');
    if ((scored.get(key)?.score ?? -Infinity) < score) scored.set(key, { score, kind });
  }
  // The best link of each kind first (about, services, business...), then the rest by score,
  // so six "company/*" pages cannot crowd out the one page about the B2B offer.
  const ranked = [...scored.entries()].sort((a, b) => b[1].score - a[1].score);
  const picked: string[] = [];
  const kinds = new Set<number>();
  for (const [u, v] of ranked) {
    if (kinds.has(v.kind)) continue;
    kinds.add(v.kind);
    picked.push(u);
  }
  for (const [u] of ranked) if (!picked.includes(u)) picked.push(u);
  return picked.slice(0, MAX_PAGES);
}

/** "/et-ee/about" → "et-ee". Null when the path has no language segment. */
function localeOf(path: string): string | null {
  return path.match(/^\/([a-z]{2}(?:[-_][a-z]{2})?)(?:\/|$)/i)?.[1].toLowerCase() ?? null;
}

function withoutLocale(path: string): string {
  return (path.replace(/^\/[a-z]{2}(?:[-_][a-z]{2})?(?=\/|$)/i, '') || '/').replace(/\/+$/, '') || '/';
}

const isEnglish = (url: string) => localeOf(new URL(url).pathname)?.startsWith('en') ?? false;

/** Drops button labels and menu items: a line under 25 characters rarely says anything. */
function contentLines(text: string): string[] {
  const lines = text.split('\n').map((l) => l.trim());
  return lines.filter((l, i) => i === 0 || l.length >= 25);
}

export function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<svg[\s\S]*?<\/svg>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<(nav|footer)\b[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<meta[^>]+name="description"[^>]+content="([^"]*)"[^>]*>/i, '\n$1\n')
    .replace(/<\/(p|div|li|h[1-6]|tr|section|article|header|footer)>|<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/[ \t\r]+/g, ' ')
    .replace(/\n\s*\n+/g, '\n')
    .trim();
}
