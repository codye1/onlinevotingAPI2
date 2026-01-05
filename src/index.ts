import express, { Request, Response } from 'express';
import cookieParser from 'cookie-parser';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cookieParser());

app.get('/', (req: Request, res: Response) => {
  res.send({ message: 'Hello World!' });
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});
