import type { APIRequestContext, APIResponse } from '@playwright/test';

interface JsonRequestOptions {
  url: string;
  token?: string;
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  data?: unknown;
  params?: Record<string, string | number | boolean | undefined>;
}

function withParams(url: string, params?: JsonRequestOptions['params']) {
  if (!params) return url;

  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) continue;
    searchParams.set(key, String(value));
  }

  const queryString = searchParams.toString();
  if (!queryString) return url;
  return `${url}${url.includes('?') ? '&' : '?'}${queryString}`;
}

export async function requestJson<T>(request: APIRequestContext, options: JsonRequestOptions) {
  const response = await request.fetch(withParams(options.url, options.params), {
    method: options.method ?? 'GET',
    data: options.data,
    headers: {
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      ...(options.data ? { 'Content-Type': 'application/json' } : {}),
    },
  });

  if (!response.ok()) {
    throw new Error(
      `${options.method ?? 'GET'} ${options.url} failed: ${response.status()} ${await safeBody(response)}`,
    );
  }

  if (response.status() === 204) {
    return undefined as T;
  }

  const contentType = response.headers()['content-type'] ?? '';
  if (contentType.includes('application/json')) {
    return (await response.json()) as T;
  }

  return (await response.text()) as T;
}

export async function safeBody(response: APIResponse) {
  try {
    return await response.text();
  } catch {
    return '';
  }
}
