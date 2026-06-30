/**
 * SiebelRestSessionManager — manages session lifecycle for `authMode: 'session'`.
 *
 * For basic and oauth modes, the session manager is a no-op (the HTTP
 * client attaches static auth headers). For session mode, the manager:
 *   - logs in once and caches the token + expiry
 *   - refreshes transparently when the token is close to expiry
 *   - invalidates on 401
 *   - NEVER exposes the token in errors or logs
 *
 * The login endpoint is configurable. Tests use a mock fetch.
 */

import type { RealSiebelConfig } from './RealSiebelConfig.js';
import type { FetchLike } from './SiebelRestHttpClient.js';

export interface SiebelSession {
  token: string;
  expiresAt: number; // epoch ms
  userId?: string;
}

export class SiebelRestSessionManager {
  private session: SiebelSession | null = null;
  private readonly refreshSkewMs = 60_000; // refresh 1 minute before expiry

  constructor(
    private readonly config: RealSiebelConfig,
    private readonly fetchImpl: FetchLike,
    private readonly nowFn: () => number = Date.now
  ) {}

  /**
   * Returns an active session, logging in or refreshing if needed.
   * For basic/oauth modes, returns null (no session needed).
   */
  async getActiveSession(): Promise<SiebelSession | null> {
    if (this.config.authMode !== 'session') return null;
    if (this.session && this.session.expiresAt - this.nowFn() > this.refreshSkewMs) {
      return this.session;
    }
    return this.login();
  }

  async login(): Promise<SiebelSession> {
    if (this.config.authMode !== 'session') {
      throw new Error('Session manager only applies to authMode=session');
    }
    if (!this.config.username || !this.config.password) {
      throw new Error('Session login requires username and password');
    }
    const url = `${this.config.baseUrl.replace(/\/+$/, '')}/siebel/v1.0/session`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.config.timeoutMs);
    let res: Response;
    try {
      res = await this.fetchImpl(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'User-Agent': this.config.userAgent
        },
        body: JSON.stringify({ username: this.config.username, password: this.config.password }),
        signal: controller.signal as AbortSignal
      });
    } catch {
      clearTimeout(timer);
      throw new Error('Session login failed: network error');
    }
    clearTimeout(timer);
    if (!res.ok) {
      throw new Error(`Session login failed: HTTP ${res.status}`);
    }
    const text = await res.text();
    let body: unknown;
    try {
      body = JSON.parse(text);
    } catch {
      throw new Error('Session login failed: invalid JSON response');
    }
    const obj = body as Record<string, unknown>;
    const token = obj.token ?? obj.sessionId ?? obj.access_token;
    const expiresInSec = typeof obj.expiresIn === 'number' ? obj.expiresIn : 1800;
    if (typeof token !== 'string' || !token) {
      throw new Error('Session login failed: no token in response');
    }
    this.session = {
      token,
      expiresAt: this.nowFn() + expiresInSec * 1000,
      userId: typeof obj.userId === 'string' ? obj.userId : undefined
    };
    return this.session;
  }

  async refresh(): Promise<SiebelSession> {
    this.session = null;
    return this.login();
  }

  /**
   * Invalidate the cached session. Called when the HTTP client receives a
   * 401. The next call to `getActiveSession` will trigger a fresh login.
   */
  invalidate(): void {
    this.session = null;
  }

  /**
   * Returns a redacted view of the session for diagnostic endpoints. NEVER
   * exposes the token.
   */
  describe(): { active: boolean; expiresAt?: number; userId?: string } {
    if (!this.session) return { active: false };
    return {
      active: true,
      expiresAt: this.session.expiresAt,
      userId: this.session.userId
    };
  }

  async logout(): Promise<void> {
    this.session = null;
  }
}
