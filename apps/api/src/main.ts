import { createApp } from './app';
import { env } from './config/env';

const app = createApp();

app.listen(env.PORT, () => {
  process.stdout.write(`[api] listening on :${env.PORT}\n`);
});
