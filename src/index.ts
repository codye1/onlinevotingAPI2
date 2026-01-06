import express from 'express';
import cookieParser from 'cookie-parser';
import router from './router/router';
import cors, { CorsOptions } from 'cors';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cookieParser());

const corsAllowList = (process.env.CORS || '')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);

const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    if (!origin) {
      return callback(null, true);
    }
    if (corsAllowList.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  credentials: true,
};
app.use(cors(corsOptions));

app.use(router);

app.listen(PORT, () => {
  console.log(`Example app listening on port http://localhost:${PORT}`);
});

/*
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
*/
