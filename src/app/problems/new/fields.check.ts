// Run by `npm run check`. The heading is what the problems list reads back off the stored text.
import assert from 'node:assert/strict';
import { EMPTY, buyerTermsFrom, problemText } from './fields';

const head = (d: Parameters<typeof problemText>[0]) => problemText(d).split('\n')[0];

// A title the person wrote wins, and the body is kept verbatim under it.
assert.equal(head({ ...EMPTY, title: 'Picking errors', description: 'We ship the wrong item twice a week.' }), 'Picking errors');
assert.match(problemText({ ...EMPTY, title: 'Picking errors', description: 'We ship wrong.' }), /\n\nWe ship wrong\.$/);

// No title: the first sentence becomes the heading, without its full stop.
assert.equal(head({ ...EMPTY, description: 'We ship the wrong item. Twice a week.' }), 'We ship the wrong item');

// A first sentence too long to be a heading is cut, so the list row never holds a paragraph.
const long = `${'word '.repeat(40)}ends here.`;
assert.ok(head({ ...EMPTY, description: long }).length <= 90);

// Money is only a ceiling when it is a real figure; empty stays null, never €0.
assert.equal(buyerTermsFrom(EMPTY).budget_ceiling, null);
assert.equal(buyerTermsFrom({ ...EMPTY, ceilingAmount: '0' }).budget_ceiling, null);
assert.deepEqual(buyerTermsFrom({ ...EMPTY, ceilingAmount: '25000', ceilingPeriod: 'monthly' }).budget_ceiling, {
  amount: 25000,
  currency: 'EUR',
  period: 'monthly',
});

console.log('problem draft: all checks passed');
