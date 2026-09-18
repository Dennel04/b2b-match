import * as cheerio from 'cheerio';

/** Тянет текст с сайта компании. Без headless-браузера: на хакатоне хватает. */
export async function scrapeSite(url: string, maxChars = 12000): Promise<string> {
  const href = url.startsWith('http') ? url : `https://${url}`;
  const res = await fetch(href, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; B2BMatchBot/0.1)' },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`Сайт ответил ${res.status}`);

  const $ = cheerio.load(await res.text());
  $('script, style, nav, footer, svg, noscript').remove();
  const text = $('body').text().replace(/\s+/g, ' ').trim();

  if (!text) throw new Error('Пустая страница — вероятно, SPA без SSR');
  return text.slice(0, maxChars);
}
