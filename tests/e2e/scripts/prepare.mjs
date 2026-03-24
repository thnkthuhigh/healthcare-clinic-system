import { execFileSync } from 'node:child_process';

const API_HEALTH_URL = 'http://localhost:4000/api/v1/health';
const WEB_URL = 'http://localhost:3000';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitForHttp(url, label, timeoutMs = 90_000) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return;
      }
    } catch {
      // keep polling
    }

    await sleep(1_500);
  }

  throw new Error(`Timed out waiting for ${label}: ${url}`);
}

async function waitForPostgres(timeoutMs = 90_000) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    try {
      execFileSync('docker', ['exec', 'clinic_postgres', 'pg_isready', '-U', 'postgres', '-d', 'clinic_dev'], {
        encoding: 'utf8',
      });
      return;
    } catch {
      await sleep(1_500);
    }
  }

  throw new Error('Timed out waiting for PostgreSQL in clinic_postgres');
}

async function main() {
  await waitForPostgres();
  await waitForHttp(API_HEALTH_URL, 'backend health endpoint');
  await waitForHttp(WEB_URL, 'web app');
}

await main();
