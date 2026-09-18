/** Self-check for the transcript leak guard. Run: npm run check */
import assert from 'node:assert/strict';
import { findLeaks } from './leak';
import type { AgentDialogueLine } from '@/types';

const problem = `We're still doing customs paperwork by hand across three warehouses. It eats
about 60 hours a month between two people, and we've had two fines this year from filing errors.
We tried a freelancer last spring and it didn't stick.`;

const line = (text: string): AgentDialogueLine => ({ speaker: 'buyer_agent', text });

// The safe transcript from the demo mockup: generalised, no specifics carried over.
assert.deepEqual(
  findLeaks(problem, [
    line('My client runs a multi-site operation and is losing significant staff time to a manual back-office process.'),
    line('There have been compliance consequences from the current process.'),
  ]),
  [],
);

// A verbatim quote is the failure this guard exists to catch.
const quoted = findLeaks(problem, [line('They are still doing customs paperwork by hand across three warehouses.')]);
assert.equal(quoted.length, 1);
assert.equal(quoted[0].kind, 'phrase');

// Specific figures must not cross either, even when reworded around them.
const numbered = findLeaks(problem, [line('It costs them roughly 60 hours every month.')]);
assert.equal(numbered.length, 1);
assert.equal(numbered[0].kind, 'number');
assert.equal(numbered[0].fragment, '60');

// Small ambient numbers are not specifics: a 2-4 week pilot must not trip the guard.
assert.deepEqual(findLeaks(problem, [line('We would start with a 2 to 4 week paid pilot.')]), []);

// Rounding is the intended behaviour, not a leak.
assert.deepEqual(findLeaks(problem, [line('Somewhere under a hundred hours a month, across several sites.')]), []);

// The guard reports which line failed, so a discarded negotiation can be diagnosed.
const multi = findLeaks(problem, [
  line('A mid-sized logistics company needs help automating a manual process.'),
  line('They have had two fines this year from filing errors.'),
]);
assert.equal(multi.length, 1);
assert.equal(multi[0].line, 1);

console.log('leak: all checks passed');
