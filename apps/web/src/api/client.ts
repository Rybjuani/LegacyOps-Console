// LegacyOps web API client.
//
// All requests are sent with the `x-legacyops-role` header set to `admin`
// so the demo UI can access every panel without bumping into 403s. This is
// a DEMO-ONLY behaviour: in a real deployment the role would come from the
// authenticated user's session, NOT from a hardcoded header. See
// SECURITY.md and docs/SECURITY_NOTES.md.

const API_BASE = (import.meta.env.VITE_API_BASE ?? '') + '';
const DEMO_ROLE = 'admin';

function buildHeaders(init?: RequestInit): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'x-legacyops-role': DEMO_ROLE,
    ...((init?.headers as Record<string, string> | undefined) ?? {})
  };
}

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(API_BASE + path, {
    ...init,
    headers: buildHeaders(init)
  });
  if (!res.ok) {
    let body: unknown = null;
    try {
      body = await res.json();
    } catch {
      /* ignore */
    }
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
