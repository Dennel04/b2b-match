import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import type { z } from 'zod';

export const claude = new Anthropic(); // reads ANTHROPIC_API_KEY

export const MODEL = 'claude-opus-5';

/**
 * One Claude call with a strictly typed JSON result.
 * The zod schema is enforced by structured outputs — the model cannot return another shape.
 */
export async function ask<T extends z.ZodType>(
  schema: T,
  prompt: string,
  opts: { effort?: 'low' | 'medium' | 'high'; maxTokens?: number } = {},
): Promise<z.infer<T>> {
  const res = await claude.messages.parse({
    model: MODEL,
    max_tokens: opts.maxTokens ?? 8000,
    output_config: {
      format: zodOutputFormat(schema),
      effort: opts.effort ?? 'medium',
    },
    messages: [{ role: 'user', content: prompt }],
  });

  if (!res.parsed_output) throw new Error('Claude returned invalid JSON');
  return res.parsed_output;
}

/** Plain text response (markdown briefings). */
export async function askText(prompt: string, maxTokens = 4000): Promise<string> {
  const res = await claude.messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    messages: [{ role: 'user', content: prompt }],
  });
  return res.content.filter((b) => b.type === 'text').map((b) => b.text).join('\n');
}
