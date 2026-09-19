import type { SitePage } from './scrape';

/**
 * A second way to read a site, used only when our own fetcher came back with nothing.
 *
 * Two kinds of site defeat a plain fetch: one that renders everything in the browser, and one
 * whose bot protection refuses our server. Tavily runs its own fetching and rendering, so it
 * gets text out of both. It costs a credit per five pages, which is why it is the fallback and
 * not the default — our own reader answers most sites in under a second for nothing.
 *
 * With no TAVILY_API_KEY set, this returns nothing and the caller behaves exactly as before.
 */

const ENDPOINT = 'https://api.tavily.com/extract';
const TIMEOUT_MS = 25_000;
/** One request, one credit band. More pages than this is not worth the wait on a fallback. */
const MAX_URLS = 5;

export const tavilyConfigured = () => Boolean(process.env.TAVILY_API_KEY);

/**
 * A guessed path often lands on a "Sorry, page not found" page, which still carries the whole
 * navigation and reads as thousands of characters. Left in, it would describe the company as
 * whatever its menu says.
 */
const looksLikeErrorPage = (text: string) =>
  /^(sorry|oops|404|page not found|not found|error)\b/i.test(text.trimStart().slice(0, 40));

export async function readWithTavily(urls: string[]): Promise<SitePage[]> {
  const key = process.env.TAVILY_API_KEY;
  if (!key || !urls.length) return [];

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      signal: controller.signal,
      headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        urls: urls.slice(0, MAX_URLS),
        // The expensive mode: this only runs on sites the cheap path already failed to read.
        extract_depth: 'advanced',
        format: 'text',
      }),
    });
    if (!res.ok) {
      console.error(`[tavily] HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
      return [];
    }

    const body = (await res.json()) as {
      results?: { url: string; raw_content?: string }[];
      failed_results?: { url: string; error?: string }[];
    };
    for (const f of body.failed_results ?? []) console.log(`[tavily] failed ${f.url}: ${f.error ?? 'no reason given'}`);

    return (body.results ?? [])
      .map((r) => ({ url: r.url, text: (r.raw_content ?? '').trim() }))
      .filter((p) => p.text.length > 200 && !looksLikeErrorPage(p.text));
  } catch (e) {
    console.error(`[tavily] ${(e as Error).message}`);
    return [];
  } finally {
    clearTimeout(timer);
  }
}
