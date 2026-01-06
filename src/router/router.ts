import { Router } from 'express';
import AuthController from '../controllers/AuthController';
import { prisma } from '../lib/prisma';
import authMiddleware from '../middlewares/authMiddleware';

const router = Router();

router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.post('/logout', AuthController.logout);
router.post('/refresh', AuthController.refreshToken);

router.get('/users', authMiddleware, async (req, res) => {
  const users = await prisma.user.findMany();
  res.json(users);
});

export default router;
