export const briefPrompt = (opts: {
  buyerName: string;
  sellerName: string;
  problemText: string;
  sellerSummary: string;
  score: number;
  agreedFormat: string | null;
  openQuestions: string[];
}) => `
Агенты обеих сторон договорились, и обе компании подтвердили встречу.
Напиши брифинг в markdown, на русском.

Покупатель: ${opts.buyerName}
Продавец: ${opts.sellerName} — ${opts.sellerSummary}
Проблема покупателя (раскрыта, обе стороны дали согласие): """${opts.problemText}"""
Оценка совпадения: ${opts.score}/100
Формат контракта, на котором сошлись агенты: ${opts.agreedFormat ?? 'не определён'}
Вопросы, которые агенты решить не смогли:
${opts.openQuestions.map((q) => `- ${q}`).join('\n') || '- нет'}

Структура строго такая:
## Кто есть кто
## Суть запроса
## О чём уже договорились агенты
## Что осталось решить людям
## 3 вопроса для начала разговора

Коротко, по делу, без воды. Максимум 300 слов.
Раздел «Что осталось решить людям» строй на open_questions — это главное в брифинге.
`.trim();
