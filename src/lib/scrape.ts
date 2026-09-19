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
const TIMEOUT_MS = 12000;
/**
 * Stop reading a page here. A single-page app can ship megabytes of inlined state (finnair.com
 * serves 2.3 MB of it), and pulling all of that down is the fastest way to spend the timeout on
 * bytes nobody reads. A megabyte is past the prose on every site tried so far.
 */
const MAX_HTML_BYTES = 1_000_000;

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
  /** The company's own logo or app icon, read off the home page. Null when none was found. */
  logo: string | null;
}

/**
 * Why nothing came back, in the words the person needs to act on. A site that blocks us and a
 * site that does not exist are different problems, and "could not read it" hides which is which.
 */
export function failureReason(site: string, steps: ScrapeStep[]): string {
  const host = site.replace(/^https?:\/\//, '');
  const outcomes = steps.map((s) => s.outcome);
  const any = (re: RegExp) => outcomes.some((o) => re.test(o));

  if (any(/HTTP (401|403|429)/)) {
    return `${host} is blocking automated readers, so we could not open it`;
  }
  if (any(/timeout/)) return `${host} did not answer in time`;
  if (any(/failed: /) && !any(/^fetched/)) return `We could not reach ${host} — check the address`;
  if (any(/HTTP 404/) && !any(/^fetched/)) return `${host} has no page at that address`;
  if (any(/^fetched/)) return `${host} opened, but its pages are drawn by JavaScript and carry no readable text`;
  return `We could not read ${host}`;
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

  // Asked after the home page so one blocked site costs one request, not two.
  const robots = await RobotsRules.fetch(origin);
  const permitted = urls.slice(0, MAX_PAGES + 2).filter((u) => {
    if (robots.allows(u)) return true;
    steps.push({ url: u, outcome: 'skipped: robots.txt disallows it' });
    return false;
  });

  const rest = await Promise.all(permitted.map((u) => fetchHtml(u, steps)));
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
  const texts = [...byPath.values()].map((p) => ({
    url: p.url,
    lines: contentLines(htmlToText(p.html)),
    meta: metaSummary(p.html),
  }));
  const seenOn = new Map<string, number>();
  for (const t of texts) for (const l of new Set(t.lines)) seenOn.set(l, (seenOn.get(l) ?? 0) + 1);
  const shared = texts.length > 2 ? 2 : Infinity;

  const pages: SitePage[] = [];
  const seenText = new Set<string>();
  let budget = TOTAL_CHARS;
  for (const t of texts.slice(0, MAX_PAGES)) {
    const body = t.lines.filter((l, i) => i === 0 || (seenOn.get(l) ?? 0) < shared).join('\n');
    // A page drawn by JavaScript arrives as an empty shell, but its head still describes the
    // company. Falling back to that is the difference between a draft and "could not read".
    const fromMeta = body.length < 200 && t.meta.length >= 120;
    const text = (fromMeta ? t.meta : body).slice(0, Math.min(PER_PAGE_CHARS, budget));

    if (text.length < 120 || budget <= 0 || seenText.has(text.slice(0, 300))) {
      steps.push({
        url: t.url,
        outcome: text.length < 120 ? 'skipped: too little text after removing navigation' : 'skipped: duplicate or over budget',
        chars: text.length,
      });
      continue;
    }
    seenText.add(text.slice(0, 300));
    budget -= text.length;
    pages.push({ url: t.url, text });
    steps.push({ url: t.url, outcome: fromMeta ? 'used (head only — the body is drawn by JavaScript)' : 'used', chars: text.length });
  }

  const logo = home ? findLogo(home.html, home.url) : null;
  return { pages, steps, ms: Date.now() - started, logo };
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
    const html = await readCapped(res);
    steps.push({
      url: res.url === url ? url : `${url} → ${res.url}`,
      outcome: html.length >= MAX_HTML_BYTES ? `fetched (first ${MAX_HTML_BYTES / 1000}KB)` : 'fetched',
      chars: html.length,
    });
    return { url: res.url, html };
  } catch (e) {
    steps.push({ url, outcome: controller.signal.aborted ? `timeout after ${TIMEOUT_MS / 1000}s` : `failed: ${(e as Error).message}` });
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * What the site allows an automated reader to open, from its own robots.txt.
 *
 * A product that sells privacy does not get to ignore this file. It also costs nothing: the
 * pages that describe a company are allowed nearly everywhere, and the ones robots.txt closes
 * (baskets, booking flows, search results) were never worth reading.
 */
export class RobotsRules {
  constructor(private readonly rules: { allow: boolean; path: string }[]) {}

  static async fetch(origin: string): Promise<RobotsRules> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    try {
      const res = await fetch(`${origin}/robots.txt`, { signal: controller.signal, redirect: 'follow' });
      // No robots.txt, or an error page instead of one, means nothing is disallowed.
      if (!res.ok) return new RobotsRules([]);
      return new RobotsRules(RobotsRules.parse(await res.text()));
    } catch {
      return new RobotsRules([]);
    } finally {
      clearTimeout(timer);
    }
  }

  /** Only the `*` group: we are not asking for privileges granted to a named crawler. */
  static parse(text: string): { allow: boolean; path: string }[] {
    const rules: { allow: boolean; path: string }[] = [];
    let applies = false;
    for (const raw of text.split('\n')) {
      const line = raw.split('#')[0].trim();
      const [field, ...rest] = line.split(':');
      const value = rest.join(':').trim();
      if (!value && !/^user-agent$/i.test(field)) continue;

      if (/^user-agent$/i.test(field)) applies = value === '*';
      else if (applies && /^(dis)?allow$/i.test(field)) {
        rules.push({ allow: /^allow$/i.test(field), path: value });
      }
    }
    return rules;
  }

  /** Longest matching rule wins; Allow beats Disallow at equal length, as the standard says. */
  allows(url: string): boolean {
    const path = new URL(url).pathname + new URL(url).search;
    let best: { allow: boolean; path: string } | null = null;
    for (const rule of this.rules) {
      if (!rule.path || !matchesRobotsPattern(path, rule.path)) continue;
      if (!best || rule.path.length > best.path.length || (rule.path.length === best.path.length && rule.allow)) {
        best = rule;
      }
    }
    return best ? best.allow : true;
  }
}

/** robots.txt patterns: `*` is any run of characters, a trailing `$` anchors the end. */
function matchesRobotsPattern(path: string, pattern: string): boolean {
  const anchored = pattern.endsWith('$');
  const body = anchored ? pattern.slice(0, -1) : pattern;
  const re = body.split('*').map((p) => p.replace(/[.+?^${}()|[\]\\]/g, '\\$&')).join('.*');
  return new RegExp(`^${re}${anchored ? '$' : ''}`).test(path);
}

/** Reads the response body up to MAX_HTML_BYTES, then drops the connection. */
async function readCapped(res: Response): Promise<string> {
  if (!res.body) return res.text();
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let out = '';
  try {
    while (out.length < MAX_HTML_BYTES) {
      const { done, value } = await reader.read();
      if (done) break;
      out += decoder.decode(value, { stream: true });
    }
  } finally {
    await reader.cancel().catch(() => {});
  }
  return out.slice(0, MAX_HTML_BYTES);
}

/**
 * What a page says about itself in its head: title, description, OpenGraph, and any JSON-LD
 * Organization. This is the floor under a site whose body is drawn by JavaScript — the shell
 * still carries these tags, and on a single-page app they are often the only prose there is.
 */
export function metaSummary(html: string): string {
  const head = html.slice(0, MAX_HTML_BYTES);
  const out: string[] = [];
  const push = (s?: string | null) => {
    const t = s?.replace(/\s+/g, ' ').trim();
    if (t && t.length > 2 && !out.includes(t)) out.push(t);
  };
  const tag = (key: 'name' | 'property', value: string) =>
    head.match(new RegExp(`<meta[^>]+${key}=["']${value}["'][^>]+content=["']([^"']+)["']`, 'i'))?.[1] ??
    head.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+${key}=["']${value}["']`, 'i'))?.[1];

  push(head.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]);
  push(tag('property', 'og:site_name'));
  push(tag('property', 'og:title'));
  push(tag('name', 'description'));
  push(tag('property', 'og:description'));

  for (const org of structuredOrganisations(head)) {
    push(str(org.name));
    push(str(org.legalName));
    push(str(org.slogan));
    push(str(org.description));
    const address = org.address as Record<string, unknown> | undefined;
    if (address) push([str(address.addressLocality), str(address.addressCountry)].filter(Boolean).join(', '));
  }
  return out.join('\n');
}

const str = (v: unknown): string | null => (typeof v === 'string' ? v : null);

/** Every JSON-LD node that describes a company, including inside @graph and arrays. */
function structuredOrganisations(html: string): Record<string, unknown>[] {
  const found: Record<string, unknown>[] = [];
  const visit = (node: unknown) => {
    if (Array.isArray(node)) return node.forEach(visit);
    if (!node || typeof node !== 'object') return;
    const obj = node as Record<string, unknown>;
    const type = [obj['@type']].flat().filter((t): t is string => typeof t === 'string').join(' ');
    if (/organization|corporation|localbusiness|company/i.test(type)) found.push(obj);
    Object.values(obj).forEach(visit);
  };
  for (const m of html.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      visit(JSON.parse(m[1].trim()));
    } catch {
      // A malformed block is common and never worth failing the whole read for.
    }
  }
  return found;
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

/**
 * The company's mark, from its own home page. A square app icon first (it reads well on a white
 * card at any size), then an SVG favicon, then an <img> the page itself calls "logo", then the
 * largest declared icon, then /favicon.ico. Social-share images come last: they are banners.
 */
export function findLogo(html: string, pageUrl: string): string | null {
  const abs = (href: string | undefined) => {
    if (!href) return null;
    try {
      return new URL(href.replace(/&amp;/g, '&'), pageUrl).href;
    } catch {
      return null;
    }
  };
  const links = [...html.matchAll(/<link\b[^>]*>/gi)].map((m) => m[0]);
  const attr = (tag: string, name: string) => tag.match(new RegExp(`${name}=["']([^"']+)["']`, 'i'))?.[1];

  const touch = links.find((l) => /rel=["'][^"']*apple-touch-icon/i.test(l));
  if (touch) return abs(attr(touch, 'href'));

  const icons = links.filter((l) => /rel=["'][^"']*\bicon\b/i.test(l));
  const svg = icons.find((l) => /\.svg(\?|["'])/i.test(l) || /image\/svg/i.test(l));
  if (svg) return abs(attr(svg, 'href'));

  const img = [...html.matchAll(/<img\b[^>]*>/gi)]
    .map((m) => m[0])
    .find((t) => /logo/i.test(`${attr(t, 'src') ?? ''} ${attr(t, 'alt') ?? ''} ${attr(t, 'class') ?? ''}`) && !/data:/i.test(attr(t, 'src') ?? ''));
  if (img) return abs(attr(img, 'src'));

  const sized = icons
    .map((l) => ({ href: attr(l, 'href'), size: Number(attr(l, 'sizes')?.split('x')[0]) || 0 }))
    .sort((a, b) => b.size - a.size)[0];
  if (sized?.href) return abs(sized.href);

  const og = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)?.[1];
  return abs(og) ?? abs('/favicon.ico');
}
