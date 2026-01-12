import { Router } from 'express';
import AuthController from '../controllers/AuthController';
import authMiddleware from '../middlewares/authMiddleware';
import authSchema from '../validations/authSchema';
import validationMiddleware from '../middlewares/validationMiddleware';
import PollsController from '../controllers/PollsController';
import pollsSchema from '../validations/pollsSchema';

const router = Router();

router.post('/register', [
  validationMiddleware(authSchema.register),
  AuthController.register,
]);
router.post('/login', [
  validationMiddleware(authSchema.login),
  AuthController.login,
]);
router.post('/logout', AuthController.logout);
router.post('/refresh', AuthController.refreshToken);

router.post('/polls', [
  authMiddleware,
  validationMiddleware(pollsSchema.addPoll),
  PollsController.addPoll,
]);
router.get('/polls', authMiddleware, PollsController.getPolls);
router.get('/polls/:id', authMiddleware, PollsController.getPoll);
router.post('/polls/:id/votes', authMiddleware, PollsController.votePoll);
router.get(
  '/polls/:id/results',
  authMiddleware,
  PollsController.getPollResults,
);

export default router;
