/**
 * SiebelRestHttpClient — thin HTTP client used by the RealSiebelAdapter.
 *
 * Responsibilities:
 *   - build absolute URLs from baseUrl + path (safe join, no double slashes)
 *   - set headers (User-Agent, Accept, Content-Type, auth)
 *   - enforce timeout via AbortController
 *   - parse JSON defensively
 *   - map non-2xx responses via SiebelRestErrorMapper
 *   - retry retriable errors via RetryPolicy
 *   - gate every call through the CircuitBreaker
 *   - NEVER log credentials
 *
 * The client accepts an injectable `fetch` implementation so tests can run
 * without a real network.
 */

import type { RealSiebelConfig } from './RealSiebelConfig.js';
import {
  mapHttpResponseError,
  mapNetworkError,
  SiebelRestError,
  type SiebelRestMappedError
} from './SiebelRestErrorMapper.js';
import { RetryPolicy } from './RetryPolicy.js';
import { CircuitBreaker, CircuitBreakerOpenError } from './CircuitBreaker.js';

export type FetchLike = (input: string | URL, init?: RequestInit) => Promise<Response>;

export interface RequestOptions {
  /** Query string params, appended to the path. */
  query?: Record<string, string | number | boolean | undefined>;
  /** Extra headers (auth headers are added by the client). */
  headers?: Record<string, string>;
  /** Override the per-call timeout. Defaults to config.timeoutMs. */
  timeoutMs?: number;
  /** Do not parse the body as JSON; return the raw Response. */
  raw?: boolean;
}

export interface AdapterCallEvent {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  durationMs: number;
  status: 'success' | 'error' | 'blocked_by_circuit_breaker';
  httpStatus?: number;
  errorCode?: string;
  retriable?: boolean;
  attempts: number;
}

export class SiebelRestHttpClient {
  private readonly retry: RetryPolicy;
  private readonly breaker: CircuitBreaker;
  private readonly authHeaders: Record<string, string>;

  constructor(
    private readonly config: RealSiebelConfig,
    private readonly fetchImpl: FetchLike,
    private readonly hooks: {
      onCall?: (event: AdapterCallEvent) => void;
      nowFn?: () => number;
      sleepFn?: (ms: number) => Promise<void>;
      randomFn?: () => number;
    } = {}
  ) {
    this.retry = new RetryPolicy({
      maxRetries: config.maxRetries,
      baseDelayMs: config.retryBackoffMs,
      jitterMs: config.retryJitterMs
    });
    this.breaker = new CircuitBreaker({
      failureThreshold: config.circuitBreakerFailureThreshold,
      cooldownMs: config.circuitBreakerCooldownMs,
      nowFn: hooks.nowFn
    });
    this.authHeaders = buildAuthHeaders(config);
  }

  /** Exposed for the adapter to check before making a call. */
  isCircuitOpen(): boolean {
    return !this.breaker.allowCall();
  }

  getCircuitState(): string {
    return this.breaker.getState();
  }

  async get<T>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>('GET', path, undefined, options);
  }

  async post<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>('POST', path, body, options);
  }

  async put<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>('PUT', path, body, options);
  }

  async delete<T>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>('DELETE', path, undefined, options);
  }

  private async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    path: string,
    body: unknown,
    options: RequestOptions | undefined
  ): Promise<T> {
    const url = buildUrl(this.config.baseUrl, path, options?.query);
    const headers: Record<string, string> = {
      Accept: 'application/json',
      'User-Agent': this.config.userAgent,
      ...this.authHeaders,
      ...(options?.headers ?? {})
    };
    const timeoutMs = options?.timeoutMs ?? this.config.timeoutMs;
    const hasBody = body !== undefined && method !== 'GET' && method !== 'DELETE';
    if (hasBody) {
      headers['Content-Type'] = headers['Content-Type'] ?? 'application/json';
    }
    const bodyStr = hasBody ? JSON.stringify(body) : undefined;

    let attempts = 0;
    const start = (this.hooks.nowFn ?? Date.now)();

    const operation = async (): Promise<T> => {
      attempts += 1;
      if (!this.breaker.allowCall()) {
        const mapped: SiebelRestMappedError = {
          code: 'CIRCUIT_OPEN',
          category: 'server',
          message: 'Circuit breaker is open',
          retriable: false
        };
        this.emitEvent(method, path, start, 'blocked_by_circuit_breaker', undefined, mapped, attempts);
        throw new SiebelRestError(mapped);
      }

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      let res: Response;
      try {
        res = await this.fetchImpl(url, {
          method,
          headers,
          body: bodyStr,
          signal: controller.signal as AbortSignal
        });
      } catch (err) {
        clearTimeout(timer);
        const mapped = mapNetworkError(err);
        this.breaker.recordFailure();
        this.emitEvent(method, path, start, 'error', undefined, mapped, attempts);
        throw new SiebelRestError(mapped);
      }
      clearTimeout(timer);

      if (!res.ok) {
        const mapped = await mapHttpResponseError(res);
        if (mapped.retriable) {
          this.breaker.recordFailure();
        } else {
          // Non-retriable errors are still failures for the breaker, but
          // we don't want 404s to open the breaker aggressively. Record
          // only server/network-class failures.
          if (mapped.category === 'server' || mapped.category === 'network' || mapped.category === 'timeout') {
            this.breaker.recordFailure();
          }
        }
        this.emitEvent(method, path, start, 'error', res.status, mapped, attempts);
        throw new SiebelRestError(mapped);
      }

      // Success — reset the breaker.
      this.breaker.recordSuccess();
      this.emitEvent(method, path, start, 'success', res.status, undefined, attempts);

      if (options?.raw) {
        return res as unknown as T;
      }
      if (res.status === 204) {
        return undefined as unknown as T;
      }
      const text = await res.text();
      if (!text) return undefined as unknown as T;
      try {
        return JSON.parse(text) as T;
      } catch {
        // Non-JSON body — return as raw text.
        return text as unknown as T;
      }
    };

    return this.retry.runWithRetry(
      operation,
      (err) => {
        if (err instanceof SiebelRestError) {
          return this.retry.shouldRetry(err.mapped, attempts - 1);
        }
        if (err instanceof CircuitBreakerOpenError) return false;
        return false;
      },
      this.hooks.sleepFn,
      this.hooks.randomFn
    );
  }

  private emitEvent(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    path: string,
    startMs: number,
    status: AdapterCallEvent['status'],
    httpStatus: number | undefined,
    mapped: SiebelRestMappedError | undefined,
    attempts: number
  ): void {
    if (!this.hooks.onCall) return;
    const now = (this.hooks.nowFn ?? Date.now)();
    this.hooks.onCall({
      method,
      path,
      durationMs: now - startMs,
      status,
      httpStatus,
      errorCode: mapped?.code,
      retriable: mapped?.retriable,
      attempts
    });
  }
}

function buildAuthHeaders(config: RealSiebelConfig): Record<string, string> {
  switch (config.authMode) {
    case 'basic': {
      if (!config.username || !config.password) return {};
      const token = Buffer.from(`${config.username}:${config.password}`).toString('base64');
      return { Authorization: `Basic ${token}` };
    }
    case 'oauth': {
      if (!config.accessToken) return {};
      return { Authorization: `Bearer ${config.accessToken}` };
    }
    case 'session': {
      // Session mode: the session manager attaches the session token at
      // call time. The client does not add a static auth header here.
      return {};
    }
  }
}

/**
 * Safely join a base URL and a path. Avoids double slashes when the path
 * starts with `/`. Appends query string params if provided.
 */
export function buildUrl(
  baseUrl: string,
  path: string,
  query?: Record<string, string | number | boolean | undefined>
): string {
  const trimmedBase = baseUrl.replace(/\/+$/, '');
  const trimmedPath = path.startsWith('/') ? path : `/${path}`;
  let url = `${trimmedBase}${trimmedPath}`;
  if (query) {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(query)) {
      if (v === undefined) continue;
      params.append(k, String(v));
    }
    const qs = params.toString();
    if (qs) url += `?${qs}`;
  }
  return url;
}
