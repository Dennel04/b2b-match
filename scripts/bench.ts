import { ask, MODEL } from "../src/lib/claude";
import { InterviewSchema, interviewPrompt } from "../src/prompts/interview";
import { DEPARTMENTS } from "../src/app/problems/new/fields";
import { SCRIPTED_NOTE } from "../src/app/problems/new/script";

/** Messy, second-language input — the shape the interview actually gets. */
const CASES: { first: string; answers: string[] }[] = [
  {
    // The one that caught it: the work is Minecraft, the problem is hiring. Filed under
    // Production & manufacturing, and then offered ISO 27001 for a €500 job.
    first:
      "we company who look for minecraft builders to build different maps, we want builders from europe on contract",
    answers: [
      "we dont know where to look for good ones and no time to search discord and social media of zoomers",
      "we didnt try, we want to build base from zero and look for different workers",
    ],
  },
  {
    first:
      "pr agency works bad we dont have a views in social media no one comment and go to website",
    answers: ["maybe 4000 eur per month we pay them and get nothing", "we changed agency 2 times, same"],
  },
  {
    first: "warehouse pickers take wrong item, we send wrong parcel 2 time in week, client angry",
    answers: ["each mistake cost us 90 eur return, so like 800 eur month", "we tried paper checklist, people forget"],
  },
  {
    first: "our accountant do invoices by hand in excel, 2 day every month lost, many mistake",
    answers: ["2 days of one person, salary 2500", "we looked at some software but it not support estonian vat"],
  },
];

const today = new Date().toISOString().slice(0, 10);

async function run() {
  console.log(`\n=== ${MODEL} ===`);
  let total = 0;
  for (const c of CASES) {
    const turns: { question: string; answer: string }[] = [];
    let known = `${SCRIPTED_NOTE}\nProblem: ${c.first}`;
    let out;
    const started = Date.now();
    for (let i = 0; i <= c.answers.length; i++) {
      out = await ask(InterviewSchema, interviewPrompt(turns, today, null, DEPARTMENTS, known), {
        effort: "low",
        maxTokens: 1500,
      });
      if (i < c.answers.length) turns.push({ question: out.follow_up ?? "", answer: c.answers[i] });
      known = `${SCRIPTED_NOTE}\nProblem: ${out.summary ?? c.first}`;
    }
    const ms = Date.now() - started;
    total += ms;
    console.log(`\n· ${c.first.slice(0, 48)}…  (${(ms / 1000).toFixed(1)}s for ${c.answers.length + 1} calls)`);
    console.log(`  title:      ${out!.title}`);
    console.log(`  department: ${out!.department}   (also: ${out!.department_alternatives.join(", ") || "—"})`);
    console.log(`  offer fmt:  ${out!.suggested_formats.join(", ") || "—"}`);
    console.log(`  offer req:  ${out!.suggested_requirements.join(", ") || "—"}`);
    console.log(`  summary:    ${out!.summary}`);
    console.log(`  last ask:   ${out!.follow_up ?? "(done)"}`);
  }
  console.log(`\ntotal ${(total / 1000).toFixed(1)}s\n`);
}

void run();
