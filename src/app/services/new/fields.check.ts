import { strict as assert } from "node:assert";
import { EMPTY, sellerTermsFrom, serviceText, type ServiceDraft } from "./fields";

const of = (p: Partial<ServiceDraft>): ServiceDraft => ({ ...EMPTY, ...p });

// A floor is a floor only when it is a real figure: blank and zero both mean "not stated",
// and checkCompatibility() reads a zero floor as "any budget clears", which is a lie.
assert.equal(sellerTermsFrom(of({})).budget_floor, null);
assert.equal(sellerTermsFrom(of({ floorAmount: "0" })).budget_floor, null);
assert.deepEqual(sellerTermsFrom(of({ floorAmount: "2400", floorPeriod: "monthly" })).budget_floor, {
  amount: 2400,
  currency: "EUR",
  period: "monthly",
});

// An empty date is null, never the empty string: the matcher compares dates, not strings.
assert.equal(sellerTermsFrom(of({})).available_from, null);
assert.equal(sellerTermsFrom(of({ availableFrom: "2026-10-01" })).available_from, "2026-10-01");

// The stored text is heading, blank line, body — the same shape a problem is stored in.
assert.equal(
  serviceText(of({ title: "Business call centre", description: "Twelve agents." })),
  "Business call centre\n\nTwelve agents.",
);
// No title given: the first sentence becomes the heading — without its full stop, the way a
// heading is written — and stays in the body too.
assert.equal(
  serviceText(of({ description: "We run a call centre. Twelve agents in Tallinn." })),
  "We run a call centre\n\nWe run a call centre. Twelve agents in Tallinn.",
);
// A first sentence longer than a heading is cut, never carried whole.
assert.ok(serviceText(of({ description: `${"x".repeat(200)}. Rest.` })).split("\n")[0].endsWith("…"));

console.log("service draft: all checks passed");
