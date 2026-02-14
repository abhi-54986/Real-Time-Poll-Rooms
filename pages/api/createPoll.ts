import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { createPollSchema } from '@/lib/validation';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const parsed = createPollSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: parsed.error.flatten().fieldErrors,
      });
    }

    const { question, options } = parsed.data;

    const poll = await prisma.poll.create({
      data: {
        question,
        options: {
          create: options.map((text) => ({ text })),
        },
      },
      include: {
        options: true,
      },
    });

    return res.status(201).json({
      id: poll.id,
      question: poll.question,
      options: poll.options.map((o: { id: string; text: string }) => ({ id: o.id, text: o.text })),
      shareLink: `/poll/${poll.id}`,
    });
  } catch (error) {
    console.error('Error creating poll:', error);
    return res.status(500).json({ error: 'Failed to create poll. Please try again.' });
  }
}
