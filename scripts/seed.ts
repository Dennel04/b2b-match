/**
 * Сид-данные: 18 правдоподобных эстонских компаний с профилями и проблемами.
 * Запуск: npm run seed
 * Данные генерирует Claude один раз и кладёт в базу. Повторный запуск — дубли, сначала чисти таблицы.
 */
import { z } from 'zod';
import { ask } from '../src/lib/claude';
import { adminClient } from '../src/lib/supabase';

const SeedSchema = z.object({
  companies: z.array(
    z.object({
      name: z.string(),
      website: z.string(),
      role: z.enum(['seller', 'buyer', 'both']),
      industry: z.string(),
      size_hint: z.string(),
      services: z.array(z.string()),
      keywords: z.array(z.string()),
      summary: z.string(),
      problem: z.string().nullable(),
      urgency: z.enum(['low', 'medium', 'high']),
    }),
  ),
});

const prompt = `
Придумай 18 правдоподобных эстонских B2B-компаний для демо платформы матчинга.

Состав: 8 продавцов услуг (IT-аутсорс, логистика, бухгалтерия, маркетинг, HR, кибербезопасность,
дизайн, юристы), 6 покупателей с конкретными проблемами, 4 универсальных (both).

Требования:
- У покупателей и both — поле problem: конкретная боль с цифрами и деталями,
  2-3 предложения, как пишет живой человек. У чистых продавцов problem = null.
- Проблемы должны иметь очевидные решения среди продавцов из списка — это демо, матчи обязаны найтись.
- Хотя бы одна пара должна быть очень сильной (совпадение 90+).
- Названия и сайты — правдоподобные эстонские (домены .ee), но вымышленные.
`.trim();

async function main() {
  console.log('Генерирую компании...');
  const { companies } = await ask(SeedSchema, prompt, { effort: 'high', maxTokens: 32000 });

  const db = adminClient();
  const ownerId = process.env.SEED_OWNER_ID;
  if (!ownerId) throw new Error('Задай SEED_OWNER_ID в .env.local (id любого тестового юзера)');

  for (const c of companies) {
    const { data, error } = await db
      .from('companies')
      .insert({
        owner_id: ownerId,
        name: c.name,
        website: c.website,
        role: c.role,
        profile_json: {
          name: c.name,
          industry: c.industry,
          size_hint: c.size_hint,
          services: c.services,
          keywords: c.keywords,
          summary: c.summary,
        },
      })
      .select('id')
      .single();
    if (error) throw error;

    if (c.problem) {
      const { error: pErr } = await db
        .from('problems')
        .insert({ company_id: data.id, text: c.problem, urgency: c.urgency });
      if (pErr) throw pErr;
    }
    console.log(`  + ${c.name}${c.problem ? ' (с проблемой)' : ''}`);
  }
  console.log(`Готово: ${companies.length} компаний.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
