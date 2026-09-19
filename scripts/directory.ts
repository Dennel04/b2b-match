/**
 * Fills the `directory` table (migration 0004) with public profiles read off companies' own
 * websites — the same scraper and prompt as onboarding autofill.
 *
 *   npm run directory                 # every site below
 *   npm run directory -- nortal.com   # just these
 *
 * Safe to re-run: rows are upserted by domain. Sites that cannot be read are reported and
 * skipped. Four at a time; each takes 20–50 s, most of it the model.
 */
import { ask } from '../src/lib/claude';
import { readWebsiteTraced } from '../src/lib/scrape';
import { adminClient } from '../src/lib/supabase';
import { ProfileDraftSchema, profileDraftPrompt } from '../src/prompts/profile';

/** Estonian companies that sell to businesses: software, IT, security, logistics, finance, industry. */
const SITES = [
  'mooncascade.com', 'nortal.com', 'helmes.com', 'proekspert.ee', 'finestmedia.ee',
  'netgroup.com', 'trinidadwiseman.com', 'codeborne.com', 'thorgate.eu', 'bitweb.ee',
  'fraktal.ee', 'mobilab.ee', 'datel.ee', 'hansab.ee', 'cybernetica.eu',
  'guardtime.com', 'cybexer.com', 'skidsolutions.eu', 'zone.ee', 'veriff.com',
  'cleveron.com', 'sixfold.ai', 'pipedrive.com', 'scoro.com', 'toggl.com',
  'testlio.com', 'katanamrp.com', 'outfunnel.com', 'messente.com', 'salv.com',
  'glia.com', 'milremrobotics.com', 'skeletontech.com', 'eagronom.com', 'stebby.eu',
  'bolt.eu', 'starship.xyz', 'lightyear.com', 'weekdone.com', 'fortumo.com',
];

const domainOf = (site: string) => new URL(site.startsWith('http') ? site : `https://${site}`).hostname.replace(/^www\./, '');

async function one(site: string) {
  const started = Date.now();
  const trace = await readWebsiteTraced(site);
  if (!trace.pages.length) throw new Error('no readable pages');
  const website = new URL(trace.pages[0].url).origin;
  const d = await ask(ProfileDraftSchema, profileDraftPrompt(website, trace.pages), { effort: 'medium' });
  const p = d.profile;

  const { error } = await adminClient()
    .from('directory')
    .upsert(
      {
        domain: domainOf(site),
        website,
        name: p.name,
        logo_url: trace.logo,
        industry: p.industry || null,
        summary: p.summary || null,
        city: p.city,
        country: p.country,
        employees: p.employees,
        founded: p.founded,
        languages: p.languages,
        industries_served: p.industries_served,
        services: p.services,
        certifications: p.certifications,
        profile_json: { ...p, logo_url: trace.logo },
        pages_read: trace.pages.map((x) => x.url),
        scraped_at: new Date().toISOString(),
      },
      { onConflict: 'domain' },
    );
  if (error) throw new Error(error.message);
  return `${p.name} — ${trace.pages.length} pages, ${((Date.now() - started) / 1000).toFixed(0)} s`;
}

async function main() {
  const sites = process.argv.slice(2).length ? process.argv.slice(2) : SITES;
  const queue = [...sites];
  let ok = 0;
  const failed: string[] = [];

  await Promise.all(
    Array.from({ length: 4 }, async () => {
      for (let site = queue.shift(); site; site = queue.shift()) {
        try {
          console.log(`✓ ${site}: ${await one(site)}`);
          ok++;
        } catch (e) {
          console.log(`✗ ${site}: ${e instanceof Error ? e.message : e}`);
          failed.push(site);
        }
      }
    }),
  );

  console.log(`\n${ok} of ${sites.length} saved.${failed.length ? ` Failed: ${failed.join(', ')}` : ''}`);
}

main();
