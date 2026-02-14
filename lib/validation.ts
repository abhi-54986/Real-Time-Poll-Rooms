import { z } from 'zod';

export const createPollSchema = z.object({
  question: z
    .string()
    .min(1, 'Question is required')
    .max(500, 'Question must be under 500 characters')
    .trim(),
  options: z
    .array(
      z
        .string()
        .min(1, 'Option text is required')
        .max(200, 'Option must be under 200 characters')
        .trim()
    )
    .min(2, 'At least 2 options are required')
    .max(10, 'Maximum 10 options allowed')
    .refine(
      (options) => new Set(options.map((o) => o.toLowerCase())).size === options.length,
      'Duplicate options are not allowed'
    ),
});

export const voteSchema = z.object({
  pollId: z.string().uuid('Invalid poll ID'),
  optionId: z.string().uuid('Invalid option ID'),
  voterToken: z.string().uuid('Invalid voter token'),
});

export type CreatePollInput = z.infer<typeof createPollSchema>;
export type VoteInput = z.infer<typeof voteSchema>;
