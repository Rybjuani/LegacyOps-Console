const API_BASE = (import.meta.env.VITE_API_BASE ?? '') + '';

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(API_BASE + path, {
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    ...init
  });
  if (!res.ok) {
    let body: unknown = null;
    try { body = await res.json(); } catch { /* ignore */ }
    const message = (body as { error?: { message?: string } })?.error?.message ?? res.statusText;
    throw new Error(`${res.status} ${message}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string) => http<T>(path),
  post: <T>(path: string, body?: unknown) =>
    http<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body?: unknown) =>
    http<T>(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined })
};
