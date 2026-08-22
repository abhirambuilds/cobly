import express, { Request, Response } from 'express';

const app = express();

app.use(express.json());

// Health check route
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'Cobly backend is running' });
});

export default app;
