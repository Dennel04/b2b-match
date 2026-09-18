import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import type { z } from 'zod';

export const claude = new Anthropic(); // читает ANTHROPIC_API_KEY

export const MODEL = 'claude-opus-5';

/**
 * Один вызов Claude со строгим JSON на выходе.
 * Схема на zod — Claude физически не может вернуть не тот формат.
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

  if (!res.parsed_output) throw new Error('Claude вернул невалидный JSON');
  return res.parsed_output;
}

/** Обычный текстовый ответ (брифинги в markdown). */
export async function askText(prompt: string, maxTokens = 4000): Promise<string> {
  const res = await claude.messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    messages: [{ role: 'user', content: prompt }],
  });
  return res.content.filter((b) => b.type === 'text').map((b) => b.text).join('\n');
}
