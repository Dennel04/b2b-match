import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';

/**
 * Reads ANTHROPIC_API_KEY, and ANTHROPIC_BASE_URL when set. The latter is how the whole app is
 * pointed at DeepSeek's Anthropic-compatible endpoint (see .env.example) — every call in the
 * codebase goes through this one client, so the provider is a deployment setting, not code.
 */
export const claude = new Anthropic();

/** Claude names are what the DeepSeek endpoint maps (opus → deepseek-v4-pro), so they stay. */
export const MODEL = process.env.MODEL_ID ?? 'claude-opus-5';

const ATTEMPTS = 2;

/**
 * One model call with a strictly typed JSON result.
 *
 * The schema is sent to the model as JSON Schema and the reply is validated with zod. A reply
 * that does not validate is sent back once with the validation error; a second failure throws.
 * This is the only place in the codebase that parses model output — keep it that way.
 */
export async function ask<T extends z.ZodType>(
  schema: T,
  prompt: string,
  opts: { effort?: 'low' | 'medium' | 'high'; maxTokens?: number } = {},
): Promise<z.infer<T>> {
  const contract =
    'Respond with ONE JSON object and nothing else: no prose before or after, no markdown fences. ' +
    `It must validate against this JSON Schema:\n${JSON.stringify(z.toJSONSchema(schema))}`;

  let rejection = '';
  for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
    const text = await complete(
      `${prompt}\n\n${contract}${rejection ? `\n\nYour previous reply was rejected: ${rejection}. Reply again, correctly.` : ''}`,
      opts,
    );

    let candidate: unknown;
    try {
      candidate = extractJson(text);
    } catch (e) {
      rejection = `not valid JSON (${(e as Error).message})`;
      continue;
    }
    const parsed = schema.safeParse(candidate);
    if (parsed.success) return parsed.data;
    rejection = parsed.error.issues
      .slice(0, 5)
      .map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`)
      .join('; ');
  }
  throw new Error(`Model returned invalid JSON ${ATTEMPTS} times: ${rejection}`);
}

/** Plain text response (markdown briefings). */
export async function askText(prompt: string, maxTokens = 4000): Promise<string> {
  return complete(prompt, { maxTokens });
}

async function complete(
  prompt: string,
  opts: { effort?: 'low' | 'medium' | 'high'; maxTokens?: number },
): Promise<string> {
  // Streamed so large outputs (the seed asks for ~30k tokens) don't trip the SDK's timeout guard.
  const res = await claude.messages
    .stream({
      model: MODEL,
      max_tokens: opts.maxTokens ?? 8000,
      output_config: { effort: opts.effort ?? 'medium' },
      messages: [{ role: 'user', content: prompt }],
    })
    .finalMessage();
  if (res.stop_reason === 'refusal') throw new Error('Model refused the request');
  if (res.stop_reason === 'max_tokens') throw new Error('Model output was cut off — raise maxTokens');
  return res.content
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('\n');
}

/** Tolerates fences and stray prose around the object; the schema check does the real work. */
function extractJson(text: string): unknown {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start < 0 || end <= start) throw new Error('no JSON object in the reply');
  return JSON.parse(text.slice(start, end + 1));
}
