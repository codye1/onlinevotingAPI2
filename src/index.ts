import express, { Request, Response } from 'express';
import cookieParser from 'cookie-parser';
import { prisma } from './lib/prisma';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cookieParser());

app.get('/', (req: Request, res: Response) => {
  res.send({ message: 'Hello World!' });
});

// GET: Fetch all users
app.get('/users', async (req: Request, res: Response) => {
  const users = await prisma.user.findMany();
  res.json(users);
});

// POST: Create a new user
app.post('/users', async (req: Request, res: Response) => {
  const { email, name } = req.body;
  try {
    const newUser = await prisma.user.create({
      data: { email, name },
    });
    res.status(201).json(newUser);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: 'User already exists or invalid data' });
  }
});

app.listen(PORT, () => {
  console.log(`Example app listening on port http://localhost:${PORT}`);
});
