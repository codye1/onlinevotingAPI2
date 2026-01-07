import { Router } from 'express';
import AuthController from '../controllers/AuthController';
import { prisma } from '../lib/prisma';
import authMiddleware from '../middlewares/authMiddleware';
import authSchema from '../validations/authSchema';
import validationMiddleware from '../middlewares/validationMiddleware';

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

// temporary route to fetch all users for testing purposes
router.get('/users', authMiddleware, async (req, res) => {
  const users = await prisma.user.findMany();
  res.json(users);
});

export default router;
