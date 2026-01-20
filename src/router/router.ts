import { Router } from 'express';
import AuthController from '../controllers/AuthController';
import authMiddleware from '../middlewares/authMiddleware';
import optionalAuthMiddleware from '../middlewares/optionalAuthMiddleware';
import authSchema from '../validations/authSchema';
import validationMiddleware from '../middlewares/validationMiddleware';
import PollsController from '../controllers/PollsController';
import pollsSchema from '../validations/pollsSchema';
import { prisma } from '../lib/prisma';

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
router.post('/auth/google', [AuthController.googleAuth]);

router.post('/polls', [
  authMiddleware,
  validationMiddleware(pollsSchema.addPoll),
  PollsController.addPoll,
]);
router.get('/polls', optionalAuthMiddleware, PollsController.getPolls);
router.get('/polls/:id', optionalAuthMiddleware, PollsController.getPoll);
router.post('/polls/:id/votes', authMiddleware, PollsController.votePoll);
router.get(
  '/polls/:id/results',
  optionalAuthMiddleware,
  PollsController.getPollResults,
);

router.get('/health', async (req, res) => {
  const count = await prisma.user.count(); // Simple DB query to ensure DB connection is healthy
  res.status(200).send('OK ' + count);
});

export default router;
