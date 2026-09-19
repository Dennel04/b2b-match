import assert from 'node:assert';
import type { PostgrestError } from '@supabase/supabase-js';
import { writeFailed } from './result';

/** Run with `npm run check`. The point of this mapping is which failures are worth retrying. */
const err = (code: string): PostgrestError =>
  ({ code, message: `test ${code}`, details: '', hint: '', name: 'PostgrestError' }) as PostgrestError;

const silence = console.error;
console.error = () => {};

const rls = writeFailed('check', err('42501'), 'problem');
assert.equal(rls.ok, false);
assert.match(rls.message, /Sign in again/);

// A missing column or table is a deploy that is behind. Telling someone to try again would be a lie.
for (const code of ['42703', '42P01', 'PGRST204', 'PGRST205']) {
  const r = writeFailed('check', err(code), 'problem');
  assert.equal(r.ok, false);
  assert.match(r.message, /missing a change this screen needs/, `${code} should report a schema gap`);
  assert.doesNotMatch(r.message, /Try again/, `${code} is not worth retrying`);
}

// Anything else might genuinely be transient.
const other = writeFailed('check', err('08006'), 'service');
assert.equal(other.ok, false);
assert.match(other.message, /Could not save the service\. Try again\./);

console.error = silence;
console.log('action result: all checks passed');
