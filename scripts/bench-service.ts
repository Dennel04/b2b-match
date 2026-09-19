import { ask, MODEL } from "../src/lib/claude";
import { ServiceInterviewSchema, serviceInterviewPrompt } from "../src/prompts/service";
import { AREAS } from "../src/app/services/new/fields";
import { SCRIPTED_NOTE } from "../src/app/services/new/script";

/**
 * The selling interview, on the input it actually gets: second-language, sales-flavoured, and
 * vague about scope. Two things are being checked, and they are what the prompt is for —
 *
 *   `area` is the part of the BUYER'S business, not the seller's own department. A call centre
 *   must come back as Customer support, never as Sales.
 *   The summary must lose the marketing and keep the facts. "industry leading, best in class"
 *   is not a fact about a service.
 */
const CASES: { first: string; answers: string[] }[] = [
  {
    first: "we do call center outsourcing, industry leading quality, best in class agents",
    answers: ["12 agents tallinn, estonian and english, inbound and outbound, we take over number in 3 week"],
  },
  {
    first: "fiber internet for business we install and support",
    answers: ["we dig and install to the building, then 2 year support contract, minimum is like 18000 for project"],
  },
  {
    first: "accounting, month end close, we are cheapest on market",
    answers: ["we take over closing for company who is too big for one bookkeeper, from 3500 eur month, we sign dpa"],
  },
];

const today = new Date().toISOString().slice(0, 10);

async function run() {
  console.log(`\n=== ${MODEL} ===`);
  let total = 0;
  for (const c of CASES) {
    const turns: { question: string; answer: string }[] = [];
    let known = `${SCRIPTED_NOTE}\nService: ${c.first}`;
    let out;
    const started = Date.now();
    for (let i = 0; i <= c.answers.length; i++) {
      out = await ask(ServiceInterviewSchema, serviceInterviewPrompt(turns, today, null, AREAS, known), {
        effort: "low",
        maxTokens: 1500,
      });
      if (i < c.answers.length) turns.push({ question: out.follow_up ?? "", answer: c.answers[i] });
      known = `${SCRIPTED_NOTE}\nService: ${out.summary ?? c.first}`;
    }
    const ms = Date.now() - started;
    total += ms;
    console.log(`\n· ${c.first.slice(0, 48)}…  (${(ms / 1000).toFixed(1)}s for ${c.answers.length + 1} calls)`);
    console.log(`  title:    ${out!.title}`);
    console.log(`  area:     ${out!.area}${out!.area && !AREAS.includes(out!.area) ? "   <-- NOT IN THE LIST" : ""}   (also: ${out!.area_alternatives.join(", ") || "—"})`);
    console.log(`  offer fmt: ${out!.suggested_formats.join(", ") || "—"}`);
    console.log(`  offer cap: ${out!.suggested_capabilities.join(", ") || "—"}`);
    console.log(`  summary:  ${out!.summary}`);
    console.log(`  floor:    ${out!.floor_amount ?? "—"} ${out!.floor_period ?? ""}`);
    console.log(`  from:     ${out!.available_from ?? "—"}`);
    console.log(`  formats:  ${out!.contract_formats.join(", ") || "—"}`);
    console.log(`  can do:   ${out!.capabilities.join(", ") || "—"}`);
    console.log(`  last ask: ${out!.follow_up ?? "(done)"}`);
  }
  console.log(`\ntotal ${(total / 1000).toFixed(1)}s\n`);
}

void run();
