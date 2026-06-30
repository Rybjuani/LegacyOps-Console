/**
 * FakeSiebelSession — synthetic Siebel-like session manager.
 *
 * Simulates session lifecycle, token expiry and permission scopes. The
 * implementation is intentionally deterministic and self-contained; it does
 * NOT contact any real Siebel server.
 */

export interface FakeSiebelSession {
  token: string;
  userId: string;
  username: string;
  role: string;
  issuedAt: string;
  expiresAt: string;
  scopes: string[];
}

const SESSION_TTL_MINUTES = 30;

export class FakeSiebelSessionStore {
  private sessions = new Map<string, FakeSiebelSession>();

  constructor(private readonly ttlMinutes: number = SESSION_TTL_MINUTES) {}

  login(username: string, password: string, role = 'CSR'): FakeSiebelSession | null {
    if (!username || !password) return null;
    const now = new Date();
    const token = `fake-siebel-token-${Math.random().toString(36).slice(2, 12)}`;
    const session: FakeSiebelSession = {
      token,
      userId: `siebel_user_${username}`,
      username,
      role,
      issuedAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + this.ttlMinutes * 60_000).toISOString(),
      scopes: ['read', 'write', 'invoke']
    };
    this.sessions.set(token, session);
    return session;
  }

  verify(token: string): { valid: boolean; expiresAt?: string; userId?: string } {
    const s = this.sessions.get(token);
    if (!s) return { valid: false };
    if (new Date(s.expiresAt).getTime() < Date.now()) {
      this.sessions.delete(token);
      return { valid: false };
    }
    return { valid: true, expiresAt: s.expiresAt, userId: s.userId };
  }

  logout(token: string): void {
    this.sessions.delete(token);
  }

  forceExpire(token: string): void {
    const s = this.sessions.get(token);
    if (s) {
      s.expiresAt = new Date(Date.now() - 1000).toISOString();
    }
  }

  active(): number {
    return this.sessions.size;
  }

  listScopes(token: string): string[] {
    return this.sessions.get(token)?.scopes ?? [];
  }
}
