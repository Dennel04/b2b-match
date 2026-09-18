import type { AgentDialogueLine } from '@/types';

/**
 * Mechanical proof that the negotiation did not carry the problem text across the wall.
 *
 * The prompts forbid quoting, but a prompt is an instruction, not a guarantee. The privacy claim
 * IS the product, so it is verified deterministically before anything reaches the other side.
 */

/**
 * Eight words in a row from the problem is a quote, not a coincidence. Six was too tight: the
 * buyer's agent must state the ask ("we need a design partner to…") and the problem text states
 * it too, so ordinary task-level phrasing collided on 4 of 7 seeded negotiations.
 */
const PHRASE_LENGTH = 8;

/** Single digits ("2-4 weeks", "one of three") are ambient; specifics are 10 and up. */
const SPECIFIC_NUMBER = 10;

export interface Leak {
  line: number;
  kind: 'phrase' | 'number';
  fragment: string;
}

const words = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter(Boolean);

function phrases(text: string): Set<string> {
  const w = words(text);
  const out = new Set<string>();
  for (let i = 0; i + PHRASE_LENGTH <= w.length; i++) {
    out.add(w.slice(i, i + PHRASE_LENGTH).join(' '));
  }
  return out;
}

function specificNumbers(text: string): Set<string> {
  const found = text.match(/\d[\d\s.,]*\d|\d/g) ?? [];
  return new Set(
    found
      .map((n) => n.replace(/[\s.,]/g, ''))
      .filter((n) => Number(n) >= SPECIFIC_NUMBER),
  );
}

/** Empty result means the transcript is safe to show the other side. */
export function findLeaks(problemText: string, lines: AgentDialogueLine[]): Leak[] {
  const problemPhrases = phrases(problemText);
  const problemNumbers = specificNumbers(problemText);
  const leaks: Leak[] = [];

  lines.forEach((line, index) => {
    for (const phrase of phrases(line.text)) {
      if (problemPhrases.has(phrase)) {
        leaks.push({ line: index, kind: 'phrase', fragment: phrase });
        break;
      }
    }
    for (const number of specificNumbers(line.text)) {
      if (problemNumbers.has(number)) {
        leaks.push({ line: index, kind: 'number', fragment: number });
      }
    }
  });

  return leaks;
}

export const describeLeaks = (leaks: Leak[]) =>
  leaks.map((l) => `line ${l.line} (${l.kind}: "${l.fragment}")`).join(', ');
