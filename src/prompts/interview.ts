import { z } from 'zod';

export const InterviewSchema = z.object({
  done: z.boolean(),
  follow_up: z.string().nullable(),
  summary: z.string().nullable(),   // финальная формулировка проблемы, когда done=true
  urgency: z.enum(['low', 'medium', 'high']).nullable(),
});

export const interviewPrompt = (turns: { question: string; answer: string }[]) => `
Ты ведёшь короткое интервью с компанией о её бизнес-проблеме.
Цель: получить формулировку, по которой можно найти подрядчика. Максимум 4 вопроса всего.

Что надо выяснить: что конкретно болит, сколько это стоит в месяц (деньгами или временем),
что уже пробовали, как срочно.

Сейчас у тебя такая история:
${turns.map((t, i) => `${i + 1}. В: ${t.question}\n   О: ${t.answer}`).join('\n') || '(пока пусто — задай первый вопрос)'}

Если ответов хватает ИЛИ задано уже 4 вопроса — верни done=true, summary с чёткой формулировкой
проблемы в 2-4 предложениях и urgency. Иначе done=false и один следующий вопрос в follow_up.
Вопрос должен быть короткий и человеческий, без канцелярита.
`.trim();
