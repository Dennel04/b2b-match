/** Self-check for what the background matcher decides to do. Run: npm run check */
import assert from 'node:assert/strict';
import { RUNNING_MS, matchableSellers, needsNegotiation, staleProblems } from './sweep';

/**
 * The sweep runs unattended on a cron, so nobody watches it choose. These are the two ways it
 * can be wrong without anyone noticing: skipping a problem that still has vendors to judge, or
 * redoing work another pass is in the middle of.
 */

const problem = (id: string, company_id: string) => ({ id, company_id });
const sellers = ['s1', 's2', 's3'];
const considered = (m: Record<string, string[]>) =>
  new Map(Object.entries(m).map(([k, v]) => [k, new Set(v)]));

// A brand new problem has been compared to nobody.
assert.equal(staleProblems([problem('p1', 'buyer')], sellers, considered({})).length, 1);

// Every vendor already judged: nothing left to spend a model call on.
assert.equal(
  staleProblems([problem('p1', 'buyer')], sellers, considered({ p1: ['s1', 's2', 's3'] })).length,
  0,
);

// The point of the whole sweep: one vendor registered since the last pass.
assert.equal(staleProblems([problem('p1', 'buyer')], sellers, considered({ p1: ['s1', 's2'] })).length, 1);

// A company is not a vendor to itself, so its own absence must not keep the problem stale for ever.
assert.equal(staleProblems([problem('p1', 's3')], sellers, considered({ p1: ['s1', 's2'] })).length, 0);

// A vendor the matcher cannot judge is not work to do. findMatches() never records it as a
// candidate, so counting it here leaves the problem stale for ever and the cron repeats a full
// pass every ten minutes. One empty signup did this to all 27 problems.
assert.deepEqual(
  matchableSellers([
    { id: 's1', profile_json: { summary: 'x' } },
    { id: 's2', profile_json: null },
  ]),
  ['s1'],
);
assert.equal(
  staleProblems(
    [problem('p1', 'buyer')],
    matchableSellers([{ id: 's1', profile_json: { summary: 'x' } }, { id: 's2', profile_json: null }]),
    considered({ p1: ['s1'] }),
  ).length,
  0,
);

const now = Date.UTC(2026, 8, 19, 12, 0, 0);
const at = (msAgo: number) => new Date(now - msAgo).toISOString();

// Never started.
assert.equal(needsNegotiation([{ deal_envelope_json: null, negotiation_started_at: null }], now).length, 1);

// Finished: an envelope is the only proof of that.
assert.equal(
  needsNegotiation([{ deal_envelope_json: { verdict: 'proceed' }, negotiation_started_at: at(0) }], now).length,
  0,
);

// Another pass is mid-way through it — touching it would pay for the same eight calls twice.
assert.equal(
  needsNegotiation([{ deal_envelope_json: null, negotiation_started_at: at(RUNNING_MS / 2) }], now).length,
  0,
);

// Died mid-way: picked up again once the stamp is stale.
assert.equal(
  needsNegotiation([{ deal_envelope_json: null, negotiation_started_at: at(RUNNING_MS * 2) }], now).length,
  1,
);

console.log('sweep: all checks passed');
