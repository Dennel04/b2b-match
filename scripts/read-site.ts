/**
 * What the reader sees on a given site, step by step. No model call, no database.
 * Run: npm run read:site -- finnair.com mooncascade.com
 *
 * Use it when someone reports "it could not read my website": the trace says whether the site
 * blocked us, answered too slowly, or opened fine and simply has no text outside JavaScript.
 */
import { failureReason, normaliseWebsite, readWebsiteTraced } from '../src/lib/scrape';

async function main() {
  const sites = process.argv.slice(2);
  if (!sites.length) throw new Error('Usage: npm run read:site -- <domain> [domain...]');

  for (const site of sites) {
    const url = normaliseWebsite(site);
    const trace = await readWebsiteTraced(url);
    console.log(`\n=== ${url} — ${trace.pages.length} usable pages, ${trace.ms} ms`);
    for (const step of trace.steps) {
      console.log(`  ${step.outcome.padEnd(48)} ${step.url}${step.chars ? ` (${step.chars})` : ''}`);
    }
    if (!trace.pages.length) console.log(`  → ${failureReason(url, trace.steps)}`);
    else console.log(`  → logo: ${trace.logo ?? 'none'}`);
  }
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
