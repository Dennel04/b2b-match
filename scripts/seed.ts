/**
 * Сид-данные: 18 правдоподобных эстонских компаний с профилями, условиями и проблемами.
 * Запуск: npm run seed
 * Повторный запуск создаёт дубли — сначала чисти таблицы.
 */
import { z } from 'zod';
import { ask } from '../src/lib/claude';
import { adminClient } from '../src/lib/supabase';

const ContractFormatEnum = z.enum([
  'pilot_first', 'fixed_price', 'monthly_retainer', 'time_and_materials', 'outcome_based',
]);
const RequirementEnum = z.enum([
  'gdpr_dpa', 'iso27001', 'eu_data_residency', 'estonian_language', 'english_language',
  'on_site', 'industry_refs',
]);
const Money = z.object({
  amount: z.number(),
  currency: z.literal('EUR'),
  period: z.enum(['one_off', 'monthly']),
});

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
      seller_terms: z
        .object({
          budget_floor: Money.nullable(),
          contract_formats: z.array(ContractFormatEnum),
          available_from: z.string().nullable(),
          capabilities: z.array(RequirementEnum),
        })
        .nullable(),
      problem: z.string().nullable(),
      urgency: z.enum(['low', 'medium', 'high']),
      buyer_terms: z
        .object({
          budget_ceiling: Money.nullable(),
          contract_formats: z.array(ContractFormatEnum),
          start_by: z.string().nullable(),
          requirements: z.array(RequirementEnum),
          dealbreakers: z.array(z.string()),
        })
        .nullable(),
    }),
  ),
});

const prompt = (today: string) => `
Придумай 18 правдоподобных эстонских B2B-компаний для демо платформы слепого матчинга.
Сегодня ${today}.

Состав: 8 продавцов услуг (IT-аутсорс, логистика, бухгалтерия, маркетинг, HR,
кибербезопасность, дизайн, юристы), 6 покупателей с проблемами, 4 универсальных (both).

Требования:
- Продавцы и both: заполни seller_terms — минимальный чек, форматы контракта, с какой даты
  свободны, какие требования закрывают. problem = null у чистых продавцов.
- Покупатели и both: problem — конкретная боль с цифрами, 2-3 предложения, как пишет живой
  человек. Плюс buyer_terms с потолком бюджета, форматами, датой старта и требованиями.
- Проблемы должны иметь очевидные решения среди продавцов из списка — матчи обязаны найтись.
- Одна пара — идеальная: и по смыслу, и по бюджету, и по формату контракта (совпадение 90+).
- ОБЯЗАТЕЛЬНО добавь 2 пары, которые идеально подходят по смыслу, но отсекаются машинно:
  одна — потому что минимальный чек продавца выше потолка покупателя,
  вторая — потому что у продавца нет ISO 27001 или готовности подписать DPA.
  Это нужно, чтобы на демо было видно, как работает фильтр до вызова модели.
- Даты — абсолютные ISO, в ближайшие 3 месяца от сегодня.
- Названия и домены .ee правдоподобные, но вымышленные.
`.trim();

async function main() {
  const today = new Date().toISOString().slice(0, 10);
  console.log('Генерирую компании...');
  const { companies } = await ask(SeedSchema, prompt(today), { effort: 'high', maxTokens: 32000 });

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
        seller_terms: c.seller_terms,
      })
      .select('id')
      .single();
    if (error) throw error;

    if (c.problem) {
      const { error: pErr } = await db.from('problems').insert({
        company_id: data.id,
        text: c.problem,
        urgency: c.urgency,
        buyer_terms: c.buyer_terms,
      });
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
