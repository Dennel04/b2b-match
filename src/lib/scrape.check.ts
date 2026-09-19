/** Self-check for the website reader's two fallbacks. Run: npm run check */
import assert from 'node:assert/strict';
import { RobotsRules, failureReason, metaSummary } from './scrape';

// A page drawn by JavaScript: nothing in the body, everything in the head.
const shell = `<!doctype html><html><head>
<title>Nordkai Logistics — freight across the Baltics</title>
<meta name="description" content="Nordkai moves temperature-controlled freight between Estonia, Latvia and Finland.">
<meta property="og:site_name" content="Nordkai">
<script type="application/ld+json">
{"@context":"https://schema.org","@graph":[
  {"@type":"WebSite","name":"ignored"},
  {"@type":"Organization","name":"Nordkai Logistics OÜ","slogan":"Cold chain, kept cold",
   "address":{"@type":"PostalAddress","addressLocality":"Tallinn","addressCountry":"EE"}}]}
</script></head><body><div id="root"></div></body></html>`;

const summary = metaSummary(shell);
assert.match(summary, /Nordkai Logistics — freight across the Baltics/);
assert.match(summary, /temperature-controlled freight/);
assert.match(summary, /Nordkai Logistics OÜ/);
assert.match(summary, /Cold chain, kept cold/);
assert.match(summary, /Tallinn, EE/);
// The JSON-LD node that is not a company must not leak in.
assert.doesNotMatch(summary, /ignored/);

// Malformed JSON-LD is common; it must not take the rest of the head down with it.
assert.match(
  metaSummary('<head><title>Still here</title><script type="application/ld+json">{ oops </script></head>'),
  /Still here/,
);
assert.equal(metaSummary('<head></head><body>nothing</body>'), '');

// Each failure the person can act on reads differently.
const reason = (outcomes: string[]) => failureReason('https://example.ee', outcomes.map((outcome) => ({ url: 'u', outcome })));
assert.match(reason(['HTTP 403']), /blocking automated readers, so we could not open it/);
// When the fallback ran too, say so: there is nothing left for the person to retry.
assert.match(reason(['HTTP 403', 'Tavily could not read it either']), /fallback reader could not either/);
assert.match(reason(['HTTP 429']), /blocking automated readers/);
assert.match(reason(['timeout after 12s']), /did not answer in time/);
assert.match(reason(['failed: fetch failed']), /could not reach/i);
assert.match(reason(['HTTP 404']), /no page at that address/);
// Pages opened but held no prose: that is the JavaScript case, not a network one.
assert.match(reason(['fetched', 'skipped: too little text after removing navigation']), /drawn by JavaScript/);
// A block beats a 404 when both happened: the block is why the rest failed.
assert.match(reason(['HTTP 404', 'HTTP 403']), /blocking automated readers/);

// robots.txt decides what may be opened. These rules are finnair.com's own, trimmed.
const robots = new RobotsRules(
  RobotsRules.parse(`
User-agent: *
Disallow: /*?
Allow: /*?pageNum=
Disallow: */booking/flight-selection
Disallow: /private$

User-agent: ia_archiver
Disallow: /
`),
);
assert.equal(robots.allows('https://www.finnair.com/en'), true, 'plain pages are allowed');
assert.equal(robots.allows('https://www.finnair.com/en?lang=fi'), false, 'query strings are closed');
assert.equal(robots.allows('https://www.finnair.com/x?pageNum=2'), true, 'the longer Allow wins');
assert.equal(robots.allows('https://www.finnair.com/en/booking/flight-selection'), false);
assert.equal(robots.allows('https://www.finnair.com/private'), false, '$ anchors the end');
assert.equal(robots.allows('https://www.finnair.com/private-clients'), true, '... and only the end');
// A group written for another crawler is not ours to obey or to claim.
assert.equal(RobotsRules.parse('User-agent: ia_archiver\nDisallow: /').length, 0);
// No robots.txt at all means nothing is closed.
assert.equal(new RobotsRules([]).allows('https://x.ee/any'), true);

console.log('scrape: all checks passed');
