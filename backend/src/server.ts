import express, { Request, Response } from 'express';
import { config } from './config';

const app = express();
const PORT = config.port;

app.use(express.json());

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'Cobly backend is running' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
