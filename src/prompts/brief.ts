export const briefPrompt = (opts: {
  buyerName: string;
  sellerName: string;
  problemText: string;
  sellerSummary: string;
  score: number;
  agreedFormat: string | null;
  openQuestions: string[];
}) => `
The agents on both sides reached agreement and both companies confirmed the meeting.
Write a meeting briefing in markdown.

Buyer: ${opts.buyerName}
Seller: ${opts.sellerName} — ${opts.sellerSummary}
The buyer's problem (now disclosed, both sides consented): """${opts.problemText}"""
Match score: ${opts.score}/100
Contract format the agents settled on: ${opts.agreedFormat ?? 'undecided'}
Questions the agents could not settle:
${opts.openQuestions.map((q) => `- ${q}`).join('\n') || '- none'}

Use exactly this structure:
## Who's who
## The ask
## What the agents already settled
## What's left for the humans
## Three questions to open the conversation

Short and concrete, no filler. 300 words maximum.
Build "What's left for the humans" from the open questions — that is the point of the briefing.
Write in English.
`.trim();
