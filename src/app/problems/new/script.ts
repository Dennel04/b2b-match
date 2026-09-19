/**
 * The half of the interview that never needs a model.
 *
 * A question whose answers are a closed set — the part of the business, a deadline, a budget
 * figure, a contract format, a compliance box — is worth no reasoning: the answer is a chip, not a
 * sentence. Those are scripted here and answered with the same controls the form uses, so they
 * cost nothing and cannot come back malformed. The model is spent only where language matters:
 * what hurts, what it costs, what was already tried.
 *
 * Every scripted answer is echoed into the chat as the person's own reply and stored as an
 * interview turn, so the conversation reads as a conversation and the model still writes the
 * summary from the full picture.
 */
export const OPEN_QUESTIONS = 2;

export type GateKey = "department" | "timing" | "budget" | "formats" | "requirements";

export const GATES: { key: GateKey; question: (guess: string) => string }[] = [
  {
    key: "department",
    question: (guess) =>
      guess
        ? `Which part of the business is this in? I would file it under ${guess} — change it if that is wrong.`
        : "Which part of the business is this in? It decides which vendors are asked first.",
  },
  {
    key: "timing",
    question: () => "By when does the work need to start?",
  },
  {
    key: "budget",
    question: () =>
      "What is the most you would spend to fix this? No company ever sees the figure — it only decides who you are shown. Leave it blank if you would rather not say.",
  },
  {
    key: "formats",
    question: () => "Which contract format works for you? Pick as many as you would consider.",
  },
  {
    key: "requirements",
    question: () => "Anything a company has to satisfy before you would even talk to them?",
  },
];

/** Deadline answers: a date the matcher can compare, and how urgent that makes it. */
export const TIMINGS = [
  { value: "now", label: "Right away", days: 7, urgency: "high" },
  { value: "month", label: "Within a month", days: 30, urgency: "high" },
  { value: "quarter", label: "Within 3 months", days: 90, urgency: "medium" },
  { value: "later", label: "No fixed date", days: null, urgency: "low" },
] as const;

/**
 * Told to the interviewer so it does not spend one of its two questions on something the form
 * asks with a chip. Without it, the model opens on the budget question every time.
 */
export const SCRIPTED_NOTE =
  "Asked by the form right after you, with buttons — do not ask about these: the part of the business, the deadline, budget ceiling and whether it is one-off or monthly, contract formats, hard requirements, dealbreakers. Spend your questions on what hurts, what it costs per month, and what they already tried. Still fill `department` with your best guess from the list.";
