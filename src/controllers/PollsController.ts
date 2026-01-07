import PollService from '../service/PollSerice';
import Send from '../utils/Send';
import { Request, Response } from 'express';

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
}

export default PollsController;
