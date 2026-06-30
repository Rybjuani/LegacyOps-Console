/**
 * RealSiebelConfig — typed configuration for the RealSiebelAdapter.
 *
 * The config is intentionally explicit: every connection parameter that a
 * real adapter would need is named here. No magic defaults that hide what
 * the adapter is doing. The loader (`loadRealSiebelConfig`) reads from a
 * `NodeJS.ProcessEnv`-shaped object so it is trivially testable.
 *
 * SECURITY: this module NEVER prints credentials. Validation errors list
 * which field is missing, not what its value was.
 */

export type SiebelAuthMode = 'basic' | 'session' | 'oauth';

export interface RealSiebelConfig {
  baseUrl: string;
  authMode: SiebelAuthMode;
  username?: string;
  password?: string;
  accessToken?: string;
  timeoutMs: number;
  maxRetries: number;
  retryBackoffMs: number;
  retryJitterMs: number;
  circuitBreakerFailureThreshold: number;
  circuitBreakerCooldownMs: number;
  defaultPageSize: number;
  userAgent: string;
}

export const DEFAULT_REAL_SIEBEL_CONFIG: Omit<RealSiebelConfig, 'baseUrl' | 'authMode'> = {
  timeoutMs: 8000,
  maxRetries: 2,
  retryBackoffMs: 200,
  retryJitterMs: 80,
  circuitBreakerFailureThreshold: 5,
  circuitBreakerCooldownMs: 30_000,
  defaultPageSize: 50,
  userAgent: 'LegacyOps-Console/0.2 (real-siebel-adapter)'
};

export class RealSiebelConfigError extends Error {
  constructor(public readonly missing: string[]) {
    super(`Invalid RealSiebelConfig: missing or invalid fields: ${missing.join(', ')}`);
    this.name = 'RealSiebelConfigError';
  }
}

function isNonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.trim().length > 0;
}

function isPositiveInt(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v) && Number.isInteger(v) && v > 0;
}

function isNonNegativeInt(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v) && Number.isInteger(v) && v >= 0;
}

/**
 * Build a `RealSiebelConfig` from an environment-like object.
 *
 * Throws `RealSiebelConfigError` on validation failure. The error message
 * lists field NAMES only — never values — so it is safe to surface in logs.
 */
export function loadRealSiebelConfig(env: NodeJS.ProcessEnv): RealSiebelConfig {
  const missing: string[] = [];

  const baseUrl = env.SIEBEL_BASE_URL;
  if (!isNonEmptyString(baseUrl)) missing.push('SIEBEL_BASE_URL');

  const authMode = (env.SIEBEL_AUTH_MODE ?? 'basic') as SiebelAuthMode;
  if (authMode !== 'basic' && authMode !== 'session' && authMode !== 'oauth') {
    missing.push('SIEBEL_AUTH_MODE (must be basic|session|oauth)');
  }

  const username = env.SIEBEL_USERNAME;
  const password = env.SIEBEL_PASSWORD;
  const accessToken = env.SIEBEL_ACCESS_TOKEN;

  if (authMode === 'basic') {
    if (!isNonEmptyString(username)) missing.push('SIEBEL_USERNAME');
    if (!isNonEmptyString(password)) missing.push('SIEBEL_PASSWORD');
  }
  if (authMode === 'oauth') {
    if (!isNonEmptyString(accessToken)) missing.push('SIEBEL_ACCESS_TOKEN');
  }
  if (authMode === 'session') {
    // Session mode also needs username/password to log in initially.
    if (!isNonEmptyString(username)) missing.push('SIEBEL_USERNAME');
    if (!isNonEmptyString(password)) missing.push('SIEBEL_PASSWORD');
  }

  const timeoutMs = env.SIEBEL_TIMEOUT_MS ? Number(env.SIEBEL_TIMEOUT_MS) : DEFAULT_REAL_SIEBEL_CONFIG.timeoutMs;
  if (!isPositiveInt(timeoutMs)) missing.push('SIEBEL_TIMEOUT_MS (must be a positive integer)');

  const maxRetries = env.SIEBEL_MAX_RETRIES ? Number(env.SIEBEL_MAX_RETRIES) : DEFAULT_REAL_SIEBEL_CONFIG.maxRetries;
  if (!isNonNegativeInt(maxRetries)) missing.push('SIEBEL_MAX_RETRIES (must be a non-negative integer)');

  const retryBackoffMs = env.SIEBEL_RETRY_BACKOFF_MS
    ? Number(env.SIEBEL_RETRY_BACKOFF_MS)
    : DEFAULT_REAL_SIEBEL_CONFIG.retryBackoffMs;
  if (!isNonNegativeInt(retryBackoffMs)) missing.push('SIEBEL_RETRY_BACKOFF_MS');

  const retryJitterMs = env.SIEBEL_RETRY_JITTER_MS
    ? Number(env.SIEBEL_RETRY_JITTER_MS)
    : DEFAULT_REAL_SIEBEL_CONFIG.retryJitterMs;
  if (!isNonNegativeInt(retryJitterMs)) missing.push('SIEBEL_RETRY_JITTER_MS');

  const circuitBreakerFailureThreshold = env.SIEBEL_CB_FAILURE_THRESHOLD
    ? Number(env.SIEBEL_CB_FAILURE_THRESHOLD)
    : DEFAULT_REAL_SIEBEL_CONFIG.circuitBreakerFailureThreshold;
  if (!isPositiveInt(circuitBreakerFailureThreshold)) missing.push('SIEBEL_CB_FAILURE_THRESHOLD');

  const circuitBreakerCooldownMs = env.SIEBEL_CB_COOLDOWN_MS
    ? Number(env.SIEBEL_CB_COOLDOWN_MS)
    : DEFAULT_REAL_SIEBEL_CONFIG.circuitBreakerCooldownMs;
  if (!isPositiveInt(circuitBreakerCooldownMs)) missing.push('SIEBEL_CB_COOLDOWN_MS');

  const defaultPageSize = env.SIEBEL_DEFAULT_PAGE_SIZE
    ? Number(env.SIEBEL_DEFAULT_PAGE_SIZE)
    : DEFAULT_REAL_SIEBEL_CONFIG.defaultPageSize;
  if (!isPositiveInt(defaultPageSize)) missing.push('SIEBEL_DEFAULT_PAGE_SIZE');

  const userAgent = isNonEmptyString(env.SIEBEL_USER_AGENT)
    ? (env.SIEBEL_USER_AGENT as string)
    : DEFAULT_REAL_SIEBEL_CONFIG.userAgent;

  if (missing.length > 0) {
    throw new RealSiebelConfigError(missing);
  }

  return {
    baseUrl: baseUrl!,
    authMode,
    username,
    password,
    accessToken,
    timeoutMs,
    maxRetries,
    retryBackoffMs,
    retryJitterMs,
    circuitBreakerFailureThreshold,
    circuitBreakerCooldownMs,
    defaultPageSize,
    userAgent
  };
}

/**
 * Returns a JSON-serialisable, secret-free view of the config. Used by the
 * diagnostic endpoints (`/siebel/adapter/status`,
 * `/siebel/adapter/config-schema`). NEVER include credentials.
 */
export function redactConfig(config: RealSiebelConfig): Record<string, unknown> {
  return {
    baseUrl: config.baseUrl,
    authMode: config.authMode,
    hasUsername: isNonEmptyString(config.username),
    hasPassword: isNonEmptyString(config.password),
    hasAccessToken: isNonEmptyString(config.accessToken),
    timeoutMs: config.timeoutMs,
    maxRetries: config.maxRetries,
    retryBackoffMs: config.retryBackoffMs,
    retryJitterMs: config.retryJitterMs,
    circuitBreakerFailureThreshold: config.circuitBreakerFailureThreshold,
    circuitBreakerCooldownMs: config.circuitBreakerCooldownMs,
    defaultPageSize: config.defaultPageSize,
    userAgent: config.userAgent
  };
}
