/**
 * The half of the interview that never needs a model — the selling mirror of
 * `problems/new/script.ts`.
 *
 * A seller knows their own product, so almost every question here has a closed answer: which
 * part of a buyer's business it fixes, when they could start, the smallest deal worth taking,
 * how they sell, what they can satisfy. Those are chips, not sentences, and cost nothing.
 * Language matters in one place only — what the thing actually is — and that is the box on the
 * hero screen.
 */
export const OPEN_QUESTIONS = 1;


export type GateKey = "area" | "availability" | "floor" | "formats" | "capabilities";

export const GATES: { key: GateKey; question: (guess: string) => string }[] = [
  {
    key: "area",
    question: (guess) =>
      guess
        ? `Which part of a buyer's business does this fix? I would file it under ${guess} — change it if that is wrong.`
        : "Which part of a buyer's business does this fix? It decides whose problems you are read against.",
  },
  {
    key: "availability",
    question: () => "When could you take on new work?",
  },
  {
    key: "floor",
    question: () =>
      "What is the smallest deal worth taking? No buyer ever sees the figure — it only keeps you out of conversations that were never going to pay. Leave it blank if you would rather not say.",
  },
  {
    key: "formats",
    question: () => "How do you like to sell this? Pick as many as you would do.",
  },
  {
    key: "capabilities",
    question: () => "What can you already satisfy? Buyers filter on these before anyone is introduced.",
  },
];

/** Availability answers: a date the matcher can compare against a buyer's deadline. */
export const TIMINGS = [
  { value: "now", label: "Right away", days: 0 },
  { value: "month", label: "Within a month", days: 30 },
  { value: "quarter", label: "Within 3 months", days: 90 },
  { value: "later", label: "No fixed date", days: null },
] as const;

/**
 * Told to the interviewer so it does not spend its one question on something the form asks with
 * a chip.
 */
export const SCRIPTED_NOTE =
  "Reminder, in case the rules above were not enough: the form asks about the part of the buyer's business this fixes, when they can start, the smallest deal worth taking, contract formats and what they can satisfy — with buttons, straight after you. Asking any of them yourself means the person answers twice. Still fill `area` and the suggestion fields with your best guess.";
