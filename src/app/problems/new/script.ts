/**
 * The half of the interview that never needs a model.
 *
 * A question whose answers are a closed set — a budget figure, a contract format, a compliance
 * box — is worth no reasoning: the answer is a chip, not a sentence. Those are scripted here and
 * answered with the same controls the form uses, so they cost nothing and cannot come back
 * malformed. The model is spent only where language matters: what hurts, what it costs, what was
 * already tried. Two open questions, three scripted ones, one closing pass to write it all up.
 *
 * Every scripted answer reaches the model as a line of `knownLines()`, so it still writes the
 * summary from the full picture and never asks a question the person has already answered.
 */
export const OPEN_QUESTIONS = 2;

export type GateKey = "budget" | "formats" | "requirements";

export const GATES: { key: GateKey; question: string }[] = [
  {
    key: "budget",
    question:
      "What is the most you would spend to fix this? No company ever sees the figure — it only decides who you are shown. Leave it blank if you would rather not say.",
  },
  {
    key: "formats",
    question: "How would you want to buy it? Pick as many as you would consider.",
  },
  {
    key: "requirements",
    question: "Anything a company has to satisfy before you would even talk to them?",
  },
];

/**
 * Told to the interviewer so it does not spend one of its two questions on something the form
 * asks with a chip. Without it, the model opens on the budget question every time.
 */
export const SCRIPTED_NOTE =
  "Asked by the form right after you, with buttons — do not ask about these: budget ceiling and whether it is one-off or monthly, contract formats, hard requirements, dealbreakers. Spend your questions on what hurts, what it costs per month, and what they already tried.";
