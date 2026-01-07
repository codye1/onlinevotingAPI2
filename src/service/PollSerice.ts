import { prisma } from '../lib/prisma';

interface Poll {
  title: string;
  category?: string;
  description?: string;
  image?: string;
  options: string[] | { file: string; title: string }[];
  creator: string;
  type: string;
  resultsVisibility: string;
  changeVote: boolean;
  voteInterval: string;
  expireAt?: Date;
}

class PollService {
  static async addPoll(pollData: Poll) {
    const { options, expireAt, ...poll } = pollData;

    const createdPoll = await prisma.poll.create({
      data: {
        ...poll,
        ...(expireAt ? { expireAt } : {}),
      },
    });
    await prisma.pollOption.createMany({
      data: options.map((option) => {
        if (typeof option !== 'string') {
          return {
            ...option,
            pollId: createdPoll.id,
          };
        }

        return {
          title: option,
          pollId: createdPoll.id,
        };
      }),
    });

    return { options: pollData.options, ...createdPoll };
  }

  static async getPollById(pollId: string, userId: number) {
    const voterId = String(userId);

    const poll = await prisma.poll.findUnique({
      where: { id: pollId },
      include: {
        options: true,
        votes: {
          where: { voterId: voterId },
          orderBy: { votedAt: 'desc' },
          include: {
            option: true,
          },
        },
      },
    });

    if (!poll) return null;

    const lastVote = poll.votes[0];

    return {
      ...poll,
      votes: undefined,
      userVote: lastVote?.option ?? null,
    };
  }
}

export default PollService;
