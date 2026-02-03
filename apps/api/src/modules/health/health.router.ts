import { type Request, type Response, Router } from 'express';

export const healthRouter = Router();

healthRouter.get('/', (_req: Request, res: Response) => {
  res.json({ ok: true });
});
