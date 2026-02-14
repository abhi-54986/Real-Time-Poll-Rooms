import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;

  if (typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid poll ID' });
  }

  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    return res.status(400).json({ error: 'Invalid poll ID format' });
  }

  try {
    const poll = await prisma.poll.findUnique({
      where: { id },
      include: {
        options: {
          include: {
            _count: {
              select: { votes: true },
            },
          },
        },
      },
    });

    if (!poll) {
      return res.status(404).json({ error: 'Poll not found' });
    }

    return res.status(200).json({
      id: poll.id,
      question: poll.question,
      createdAt: poll.createdAt.toISOString(),
      options: poll.options.map((opt: { id: string; text: string; _count: { votes: number } }) => ({
        id: opt.id,
        text: opt.text,
        votes: opt._count.votes,
      })),
    });
  } catch (error) {
    console.error('Error fetching poll:', error);
    return res.status(500).json({ error: 'Failed to fetch poll' });
  }
}
