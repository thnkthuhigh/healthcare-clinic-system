import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

const ROOT_DIR = path.resolve(__dirname, '..', '..', '..');
const API_HEALTH_URL = 'http://localhost:4000/api/v1/health';
const WEB_URL = 'http://localhost:3000';
const DB_CONTAINER = 'clinic_postgres';

function runCommand(command: string, args: string[], encoding: BufferEncoding = 'utf8') {
  return execFileSync(command, args, {
    cwd: ROOT_DIR,
    encoding,
  }).trim();
}

async function waitForHttp(url: string, label: string, timeoutMs = 90_000) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return;
      }
    } catch {
      // Keep polling until timeout.
    }

    await delay(1_500);
  }

  throw new Error(`Timed out waiting for ${label}: ${url}`);
}

async function waitForPostgres(timeoutMs = 90_000) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    try {
      runCommand('docker', [
        'exec',
        DB_CONTAINER,
        'pg_isready',
        '-U',
        'postgres',
        '-d',
        'clinic_dev',
      ]);
      return;
    } catch {
      await delay(1_500);
    }
  }

  throw new Error('Timed out waiting for PostgreSQL in clinic_postgres');
}

export async function waitForStack() {
  await waitForPostgres();
  await waitForHttp(API_HEALTH_URL, 'backend health endpoint');
  await waitForHttp(WEB_URL, 'web app');
}

export function refreshDemoData() {
  runCommand('docker', [
    'exec',
    DB_CONTAINER,
    'psql',
    '-U',
    'postgres',
    '-d',
    'clinic_dev',
    '-c',
    'SELECT refresh_demo_data();',
  ]);
}

export function sqlEscape(value: string) {
  return value.replaceAll("'", "''");
}

export async function getLatestOtpForPhone(phone: string, timeoutMs = 30_000) {
  const startedAt = Date.now();
  const sql = `SELECT code FROM password_reset_tokens WHERE phone = '${sqlEscape(phone)}' ORDER BY created_at DESC LIMIT 1;`;

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const output = runCommand('docker', [
        'exec',
        DB_CONTAINER,
        'psql',
        '-U',
        'postgres',
        '-d',
        'clinic_dev',
        '-t',
        '-A',
        '-c',
        sql,
      ]);

      if (output) {
        return output;
      }
    } catch {
      // Keep polling until timeout.
    }

    await delay(1_000);
  }

  throw new Error(`Timed out waiting for OTP of phone ${phone}`);
}

export function uniquePhone(seed = '098') {
  const suffix = `${Date.now()}`.slice(-7);
  return `${seed}${suffix}`.slice(0, 10);
}

export function todayDateString() {
  return new Date().toISOString().slice(0, 10);
}
