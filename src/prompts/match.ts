import { z } from 'zod';

export const MatchScoresSchema = z.object({
  results: z.array(
    z.object({
      seller_company_id: z.string(),
      score: z.number().min(0).max(100),
      reasoning_public: z.string(),
    }),
  ),
});

/**
 * IMPORTANT: reasoning_public is read by the seller. Verbatim quotes from the problem are
 * forbidden — that is the core privacy guarantee of the product, not a style preference.
 */
export const matchPrompt = (
  problemText: string,
  sellers: { id: string; summary: string; services: string[] }[],
) => `
A buying company has described its problem. This text is CONFIDENTIAL and is shown to nobody:
"""
${problemText}
"""

Below is a list of vendors. Score each from 0 to 100 on how well they could actually solve it.

${sellers.map((s) => `[${s.id}]\n${s.summary}\nServices: ${s.services.join(', ')}`).join('\n\n')}

For each, return reasoning_public: two sentences on why this is a match.
Hard rule: the seller will read reasoning_public, so do NOT quote the problem text, and do not
mention amounts, names, or internal details. Stay at category level, e.g. "this company needs
help with X in the Y area".

Score strictly. Only give 80+ when the vendor's service directly addresses the problem.
Write in English.
`.trim();
