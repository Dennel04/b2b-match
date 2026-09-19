/**
 * Reads a company's public website into plain text for the profile draft. No HTML parser: a
 * few regexes are enough for "what does this company do", and the model does the reading.
 */

/** Paths worth trying on a company site. Estonian: meist = about us, teenused = services. */
const PATHS = ['', '/about', '/about-us', '/services', '/en', '/en/about', '/en/services', '/meist', '/teenused'];

const PER_PAGE_CHARS = 4000;
const TOTAL_CHARS = 14000;
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

/** Fetches the likely pages in parallel; returns whatever answered with real content. */
export async function readWebsite(website: string): Promise<SitePage[]> {
  const base = normaliseWebsite(website);
  const results = await Promise.all(PATHS.map((p) => fetchText(base + p)));
  const seen = new Set<string>();
  const pages: SitePage[] = [];
  let budget = TOTAL_CHARS;

  for (const page of results) {
    if (!page || seen.has(page.text.slice(0, 300)) || budget <= 0) continue;
    seen.add(page.text.slice(0, 300));
    const text = page.text.slice(0, Math.min(PER_PAGE_CHARS, budget));
    budget -= text.length;
    pages.push({ url: page.url, text });
  }
  return pages;
}

async function fetchText(url: string): Promise<SitePage | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: 'follow',
      headers: { 'user-agent': 'Mozilla/5.0 (compatible; crossdesk/0.1; +profile-draft)', accept: 'text/html' },
    });
    if (!res.ok || !(res.headers.get('content-type') ?? '').includes('text/html')) return null;
    const text = htmlToText(await res.text());
    return text.length > 200 ? { url: res.url, text } : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<svg[\s\S]*?<\/svg>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
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
