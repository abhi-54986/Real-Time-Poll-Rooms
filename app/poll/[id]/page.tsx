import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import PollView from '@/components/PollView';

export const dynamic = 'force-dynamic';

interface PollPageProps {
  params: { id: string };
}

export default async function PollPage({ params }: PollPageProps) {
  const { id } = params;

  // Validate UUID format
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    notFound();
  }

  let poll;
  try {
    poll = await prisma.poll.findUnique({
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
  } catch {
    notFound();
  }

  if (!poll) {
    notFound();
  }

  const serializedPoll = {
    id: poll.id,
    question: poll.question,
    createdAt: poll.createdAt.toISOString(),
    options: poll.options.map((opt: { id: string; text: string; _count: { votes: number } }) => ({
      id: opt.id,
      text: opt.text,
      votes: opt._count.votes,
    })),
  };

  return <PollView poll={serializedPoll} />;
}
