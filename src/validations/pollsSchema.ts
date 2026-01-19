import z from 'zod';
import { Category, PollResultsVisibility, PollType } from '../types/types';

export type addPollFormState =
  | {
      errors?: {
        image?: string[];
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

const optionSchema = z.object({
  file: z.union([
    z
      .string()
      .url({ message: 'URL зображення обов’язковий і має бути дійсним.' }),
    z.null(),
  ]),
  title: z
    .string()
    .min(1, { message: 'Назва варіанту обов’язкова.' })
    .max(100, { message: 'Назва варіанту має містити не більше 100 символів.' })
    .trim(),
});

const pickDateFromPickerValue = (value: unknown): Date | undefined => {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;

  if (Array.isArray(value)) {
    const maybeDates = value.filter(
      (v): v is Date => v instanceof Date && !Number.isNaN(v.getTime()),
    );
    // DateTimePicker range mode returns [start, end]; prefer end if present.
    return maybeDates.length > 0
      ? maybeDates[maybeDates.length - 1]
      : undefined;
  }

  return undefined;
};

export const addPoll = z
  .object({
    title: z
      .string()
      .min(1, { message: 'Назва обов’язкова.' })
      .max(100, { message: 'Назва має містити не більше 100 символів.' })
      .trim(),

    description: z
      .string()
      .max(500, {
        message: 'Опис має містити не більше 500 символів.',
      })
      .optional(),

    image: z.string(),
    type: z.nativeEnum(PollType),
    options: z.array(optionSchema),

    resultsVisibility: z.nativeEnum(PollResultsVisibility),
    category: z.nativeEnum(Category),

    changeVote: z.boolean(),
    voteInterval: z.string(),

    expireAtDate: z.unknown(),
  })
  .superRefine((data, ctx) => {
    if (data.expireAtDate) {
      const date = pickDateFromPickerValue(data.expireAtDate);
      if (!date) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['expireAtDate'],
          message: 'Вкажіть коректну дату завершення.',
        });
      } else if (date < new Date(Date.now() + 2 * 60 * 1000)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['expireAtDate'],
          message:
            'Дата має бути щонайменше на 2 хвилини пізніше від поточного часу.',
        });
      }
    }

    if (data.type === PollType.MULTIPLE) {
      if (data.options.length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['options'],
          message: 'Потрібно щонайменше два варіанти.',
        });
      }

      data.options.forEach((opt, index) => {
        if (opt.file !== null) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['options', index, 'file'],
            message:
              'Зображення не підтримуються для опитувань з кількома відповідями.',
          });
        }
      });
    }

    if (data.type === PollType.IMAGE) {
      if (data.options.length < 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['options'],
          message: 'Потрібно щонайменше одне зображення.',
        });
      }

      data.options.forEach((opt, index) => {
        if (opt.file === null) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['options', index, 'file'],
            message: 'Зображення обов’язкове.',
          });
        }
      });
    }
  });

const pollsSchema = {
  addPoll,
};

export default pollsSchema;
