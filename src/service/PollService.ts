import { PollFindManyArgs } from '../../generated/prisma/models';
import { prisma } from '../lib/prisma';
import isSortOrder from '../utils/isSortOrder';
import AppError from '../utils/AppError';

interface Poll {
  title: string;
  category?: string;
  description?: string;
  image?: string;
  options: { file: string | null; title: string }[];
  creatorId: string;
  type: string;
  resultsVisibility: string;
  changeVote: boolean;
  voteInterval: string;
  expireAt?: Date;
}

interface Params {
  pageSize?: string;
  cursor?: string;
  sortByVotes?: string;
  search?: string;
  category?: string;
  userId: string;
  filter?: string;
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
    const createdOptions = await prisma.pollOption.createManyAndReturn({
      data: options.map((option) => ({
        ...option,
        pollId: createdPoll.id,
      })),
    });

    return { options: createdOptions, ...createdPoll };
  }

  static async getPollById(pollId: string, userId: string) {
    const poll = await prisma.poll.findUnique({
      where: { id: pollId },
      include: {
        options: true,
        votes: {
          where: { voterId: userId },
          orderBy: { votedAt: 'desc' },
          include: {
            option: true,
          },
        },
        creator: {
          select: { email: true },
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

  static async getPolls({
    pageSize,
    cursor,
    sortByVotes,
    filter,
    userId,
    search,
    category,
  }: Params) {
    const limit = pageSize ? parseInt(pageSize) : 10;
    console.log('Filter: ' + filter);
    console.log('userId: ' + userId);
    console.log('cursor: ' + cursor);

    const normalizedFilter =
      typeof filter === 'string' ? filter.trim().toUpperCase() : undefined;

    const orderBy = isSortOrder(sortByVotes)
      ? [{ votes: { _count: sortByVotes } }, { id: 'asc' as const }]
      : { createdAt: 'desc' as const };

    const queryArgs: PollFindManyArgs = {
      take: limit + 1,
      orderBy,
    };

    switch (normalizedFilter) {
      case 'ACTIVE':
        queryArgs.where = {
          OR: [{ expireAt: null }, { expireAt: { gt: new Date() } }],
        };
        break;
      case 'EXPIRED':
      case 'CLOSED':
        queryArgs.where = {
          expireAt: { lt: new Date() },
        };
        break;
      case 'CREATED':
        queryArgs.where = {
          creatorId: userId,
        };
        break;
      case 'PARTICIPATED':
        queryArgs.where = {
          votes: {
            some: {
              voterId: userId,
            },
          },
        };
        break;
      case 'ALL':
        break;
      default:
        break;
    }

    if (search) {
      queryArgs.where = {
        ...queryArgs.where,
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      };
    }

    if (category && category !== 'ALL') {
      queryArgs.where = {
        ...queryArgs.where,
        category: category,
      };
    }

    const normalizedCursor =
      typeof cursor === 'string' &&
      cursor.trim() !== '' &&
      cursor !== 'null' &&
      cursor !== 'undefined'
        ? cursor
        : undefined;

    if (normalizedCursor) {
      const cursorExistsInCurrentQuery = await prisma.poll.findFirst({
        where: queryArgs.where
          ? { AND: [{ id: normalizedCursor }, queryArgs.where] }
          : { id: normalizedCursor },
        select: { id: true },
      });

      if (cursorExistsInCurrentQuery) {
        queryArgs.cursor = { id: normalizedCursor };
        queryArgs.skip = 1;
      }
    }

    const polls = await prisma.poll.findMany({
      ...queryArgs,
      select: {
        id: true,
        title: true,
        resultsVisibility: true,
        type: true,
        createdAt: true,
        expireAt: true,
        _count: {
          select: {
            votes: true,
          },
        },
      },
    });

    const formattedPolls = polls.map((poll) => ({
      ...poll,
      votes: poll._count.votes,
      _count: undefined,
    }));

    return formattedPolls;
  }

  static async votePoll(pollId: string, optionId: string, userId: string) {
    const poll = await prisma.poll.findUnique({
      where: { id: pollId },
      select: {
        changeVote: true,
        expireAt: true,
        voteInterval: true,
        votes: {
          where: { voterId: userId },
        },
      },
    });

    if (!poll) {
      throw new AppError('Poll not found', 404, 'POLL_NOT_FOUND');
    }

    if (poll.expireAt && poll.expireAt < new Date()) {
      throw new AppError('Poll has expired', 410, 'POLL_EXPIRED');
    }

    if (!poll.changeVote && poll.votes[0]?.voterId === userId) {
      throw new AppError(
        'Changing vote is not allowed in this poll',
        403,
        'POLL_CHANGE_VOTE_FORBIDDEN',
      );
    }

    if (Number(poll.voteInterval) > 0 && poll.votes[0]?.votedAt) {
      const lastVoteTime = new Date(poll.votes[0].votedAt).getTime();
      const now = Date.now();
      const interval = Number(poll.voteInterval);
      if (now - lastVoteTime < interval) {
        throw new AppError(
          `You can vote again after ${interval - (now - lastVoteTime)} ms`,
          429,
          'POLL_VOTE_INTERVAL',
        );
      }
    }

    await prisma.vote.deleteMany({
      where: {
        pollId,
        voterId: userId,
      },
    });

    await prisma.vote.create({
      data: {
        pollId,
        optionId,
        voterId: userId,
      },
    });
  }

  static async getPollResults(pollId: string, userId: string) {
    const poll = await prisma.poll.findUnique({
      where: { id: pollId },
      select: {
        id: true,
        creator: true,
        title: true,
        type: true,
        createdAt: true,
        expireAt: true,
        votes: {
          where: { voterId: userId },
          orderBy: { votedAt: 'desc' },
          include: {
            option: true,
          },
        },
        options: {
          select: {
            id: true,
            title: true,
            file: true,
            pollId: true,
            _count: {
              select: {
                votes: true,
              },
            },
          },
        },
        resultsVisibility: true,
      },
    });

    if (poll && poll.resultsVisibility === 'AFTER_VOTE') {
      if (poll.votes.length === 0) {
        throw new AppError(
          'Poll results are not available until you vote',
          403,
          'POLL_RESULTS_NOT_AVAILABLE',
        );
      }
    }

    if (poll && poll.resultsVisibility === 'AFTER_EXPIRE') {
      const now = new Date();
      if (poll.expireAt && poll.expireAt > now) {
        throw new AppError(
          'Poll results are not available until the poll expires',
          403,
          'POLL_RESULTS_NOT_AVAILABLE',
        );
      }
    }
    if (!poll) {
      throw new AppError('Poll not found', 404, 'POLL_NOT_FOUND');
    }

    return {
      id: poll.id,
      creatorEmail: poll.creator.email,
      title: poll.title,
      type: poll.type,
      createdAt: poll.createdAt.toISOString(),
      options: poll.options.map((option) => ({
        id: option.id,
        title: option.title,
        file: option.file,
        pollId: option.pollId,
        votes: option._count.votes,
      })),
    };
  }
}

export default PollService;
