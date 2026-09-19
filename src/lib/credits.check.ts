import assert from 'node:assert/strict';
import { PACKS, UNLOCK_COST, euros, packFor } from './credits';

// A pack that cannot be spent whole is a pack that leaves change nobody can use.
for (const p of PACKS) assert.equal(p.credits % UNLOCK_COST, 0, `${p.credits} is not whole counterparties`);

// More coins never cost more per coin: the ladder is the reason to take the bigger pack.
const perCoin = PACKS.map((p) => p.cents / p.credits);
assert.deepEqual([...perCoin].sort((a, b) => b - a), perCoin, 'a bigger pack must not be dearer per credit');

assert.equal(packFor(50)?.cents, 7900);
assert.equal(packFor(11), undefined, 'only the listed packs may be bought');
assert.equal(packFor(Number(undefined)), undefined, 'a missing form field buys nothing');

assert.equal(euros(1900), '€19');
assert.equal(euros(13950), '€139.50');

console.log('credits: all checks passed');
