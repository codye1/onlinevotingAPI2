import PollService from '../service/PollSerice';
import Send from '../utils/Send';
import { Request, Response } from 'express';
import { isAppError } from '../utils/AppError';

class PollsController {
  static async addPoll(req: Request, res: Response) {
    const poll = req.body;
    try {
      const createdPoll = await PollService.addPoll(poll);

      return Send.success(res, createdPoll, 'Poll created successfully');
    } catch (error) {
      console.error('Get Polls error:', error);
      return Send.error(res, null, 'Unexpected error occurred');
    }
  }

  static async getPoll(req: Request, res: Response) {
    const userId = req.userId;
    const { id } = req.params;
    try {
      if (!userId) {
        return Send.unauthorized(res, null, 'Unauthorized');
      }

      const poll = await PollService.getPollById(id, userId);
      if (!poll) {
        return Send.notFound(res, null, 'Poll not found');
      }

      return Send.success(res, { poll }, 'Poll fetched successfully');
    } catch (error) {
      console.error('Get Polls error:', error);
      return Send.error(res, null, 'Unexpected error occurred');
    }
  }

  static async getPolls(req: Request, res: Response) {
    const params = req.query;
    try {
      const polls = await PollService.getPolls({
        ...params,
        userId: req.userId,
      });
      return Send.success(res, { polls }, 'Polls fetched successfully');
    } catch (error) {
      console.error('Get Polls error:', error);
      return Send.error(res, null, 'Unexpected error occurred');
    }
  }

  static async votePoll(req: Request, res: Response) {
    const userId = req.userId;
    const { id: pollId } = req.params;
    const { optionId } = req.body;

    try {
      if (!userId) {
        return Send.unauthorized(res, null, 'Unauthorized');
      }

      await PollService.votePoll(pollId, optionId, userId);
      return Send.success(res, null, 'Vote recorded successfully');
    } catch (error) {
      console.error('Vote Poll error:', error);

      if (isAppError(error)) {
        if (error.statusCode === 404) {
          return Send.notFound(res, null, error.message);
        }
        if (error.statusCode === 401) {
          return Send.unauthorized(res, null, error.message);
        }
        if (error.statusCode === 403) {
          return Send.forbidden(res, null, error.message);
        }

        return Send.badRequest(res, null, error.message, error.statusCode);
      }

      return Send.error(res, null, 'Unexpected error occurred');
    }
  }
}

export default PollsController;
