import z from 'zod';
import { Category, PollResultsVisibility, PollType } from '../types/types';

export type addPollFormState =
  | {
      errors?: {
        title?: string[];
        description?: string[];
        options?: string[];
        resultsVisibility?: string[];
        type?: string[];
        category?: string[];
        expireAt?: string[];
        changeVote?: string[];
        voteInterval?: string[];
        date?: string[];
      };
      message?: string;
    }
  | undefined;

const image = z.object({
  file: z.url({ message: 'URL зображення обов’язковий і має бути дійсним.' }),
  title: z
    .string()
    .min(1, { message: 'Назва зображення обов’язкова.' })
    .max(100, {
      message: 'Назва зображення має містити не більше 100 символів.',
    })
    .trim(),
});

const addPoll = z
  .object({
    title: z
      .string()
      .min(1, { message: 'Назва обов’язкова.' })
      .max(100, { message: 'Назва має містити не більше 100 символів.' })
      .trim(),
    image: z.string(),
    changeVote: z.boolean(),
    voteInterval: z.string(),
    description: z
      .string()
      .max(500, { message: 'Опис має містити не більше 500 символів.' })
      .optional(),
    type: z.enum(PollType),
    resultsVisibility: z.enum(PollResultsVisibility),
    category: z.enum(Category),
    expireAt: z
      .date()
      .optional()
      .refine(
        (date) => {
          if (!date) return true;
          const now = new Date();
          const minFutureTime = new Date(now.getTime() + 2 * 60 * 1000);
          return date >= minFutureTime;
        },
        {
          message:
            'Дата має бути щонайменше на 2 хвилини пізніше від поточного часу.',
        },
      ),
    options: z.union([
      z
        .array(
          z
            .string()
            .min(1, { message: 'Варіант не може бути порожнім.' })
            .max(100, {
              message: 'Варіант має містити не більше 100 символів.',
            })
            .trim(),
        )
        .min(2, { message: 'Потрібно щонайменше два непорожні варіанти.' }),

      z
        .array(image)
        .min(1, { message: 'Потрібно щонайменше одне зображення з назвою.' }),
    ]),
  })
  .superRefine((data, ctx) => {
    if (data.type === 'multiple') {
      if (
        !Array.isArray(data.options) ||
        !data.options.every((opt) => typeof opt === 'string')
      ) {
        ctx.addIssue({
          code: 'custom',
          path: ['options'],
          message:
            'Варіанти мають бути масивом рядків для опитування з множинним вибором.',
        });
      }
    } else if (data.type === 'img') {
      if (
        !Array.isArray(data.options) ||
        !data.options.every(
          (opt) =>
            typeof opt === 'object' &&
            opt !== null &&
            'file' in opt &&
            'title' in opt &&
            typeof opt.file === 'string' &&
            typeof opt.title === 'string',
        )
      ) {
        ctx.addIssue({
          code: 'custom',
          path: ['options'],
          message:
            'Варіанти мають бути масивом об’єктів із зображеннями, що містять URL і назву для опитування із зображеннями.',
        });
      }
    }
  });

const pollsSchema = {
  addPoll,
};

export default pollsSchema;
