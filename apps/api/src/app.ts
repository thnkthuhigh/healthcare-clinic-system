import cors from 'cors';
import express from 'express';

import { healthRouter } from './modules/health/health.router';

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.use('/api/v1/health', healthRouter);

  return app;
}
