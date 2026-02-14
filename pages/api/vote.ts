import type { NextApiRequest, NextApiResponse } from 'next';
import { createHash } from 'crypto';
import { prisma } from '@/lib/prisma';
import { voteSchema } from '@/lib/validation';
import type { Server as HTTPServer } from 'http';
import type { Socket as NetSocket } from 'net';
import type { Server as SocketIOServer } from 'socket.io';

interface SocketServer extends HTTPServer {
  io?: SocketIOServer;
}

interface NextApiResponseWithSocket extends NextApiResponse {
  socket: NetSocket & {
    server: SocketServer;
  };
}

function getClientIP(req: NextApiRequest): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  if (Array.isArray(forwarded)) {
    return forwarded[0].trim();
  }
  return req.socket.remoteAddress || '127.0.0.1';
}

function hashIP(ip: string): string {
  const salt = process.env.IP_HASH_SALT || 'default-salt';
  return createHash('sha256').update(ip + salt).digest('hex');
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponseWithSocket
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const parsed = voteSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: parsed.error.flatten().fieldErrors,
      });
    }

    const { pollId, optionId, voterToken } = parsed.data;

    // Check poll exists
    const poll = await prisma.poll.findUnique({
      where: { id: pollId },
      include: { options: true },
    });

    if (!poll) {
      return res.status(404).json({ error: 'Poll not found' });
    }

    // Check option belongs to this poll
    const validOption = poll.options.find((o: { id: string }) => o.id === optionId);
    if (!validOption) {
      return res.status(400).json({ error: 'Invalid option for this poll' });
    }

    const ipHash = hashIP(getClientIP(req));

    // Mechanism 1: Check for existing vote by IP hash
    const existingIPVote = await prisma.vote.findUnique({
      where: {
        pollId_ipHash: { pollId, ipHash },
      },
    });

    if (existingIPVote) {
      return res.status(409).json({
        error: 'You have already voted on this poll (IP detected)',
        mechanism: 'ip',
      });
    }

    // Mechanism 2: Check for existing vote by browser token
    const existingTokenVote = await prisma.vote.findUnique({
      where: {
        pollId_voterToken: { pollId, voterToken },
      },
    });

    if (existingTokenVote) {
      return res.status(409).json({
        error: 'You have already voted on this poll (browser detected)',
        mechanism: 'token',
      });
    }

    // Create vote
    await prisma.vote.create({
      data: {
        pollId,
        optionId,
        ipHash,
        voterToken,
      },
    });

    // Get updated vote counts
    const updatedOptions = await prisma.option.findMany({
      where: { pollId },
      include: {
        _count: {
          select: { votes: true },
        },
      },
    });

    const results = updatedOptions.map((opt: { id: string; text: string; _count: { votes: number } }) => ({
      id: opt.id,
      text: opt.text,
      votes: opt._count.votes,
    }));

    // Emit real-time update via Socket.io
    const io = res.socket.server.io;
    if (io) {
      io.to(pollId).emit('vote-update', { pollId, results });
    }

    return res.status(200).json({ success: true, results });
  } catch (error: unknown) {
    // Handle Prisma unique constraint violation (race condition safety net)
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code: string }).code === 'P2002'
    ) {
      return res.status(409).json({
        error: 'You have already voted on this poll',
      });
    }
    console.error('Error recording vote:', error);
    return res.status(500).json({ error: 'Failed to record vote. Please try again.' });
  }
}
