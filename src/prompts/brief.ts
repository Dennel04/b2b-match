export const briefPrompt = (opts: {
  buyerName: string;
  sellerName: string;
  problemText: string;
  sellerSummary: string;
  score: number;
}) => `
Обе стороны согласились встретиться. Напиши брифинг к встрече в markdown, на русском.

Покупатель: ${opts.buyerName}
Продавец: ${opts.sellerName} — ${opts.sellerSummary}
Проблема покупателя (теперь раскрыта, обе стороны дали согласие): """${opts.problemText}"""
Оценка совпадения: ${opts.score}/100

Структура строго такая:
## Кто есть кто
## Суть запроса
## Почему это совпадение
## 3 вопроса для начала разговора
## На что обратить внимание

Коротко, по делу, без воды. Весь брифинг — максимум 300 слов.
`.trim();
