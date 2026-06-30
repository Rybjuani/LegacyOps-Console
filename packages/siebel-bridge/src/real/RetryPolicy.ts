/**
 * RetryPolicy — pure, testable retry helper.
 *
 * The policy is split in two:
 *   - `shouldRetry(err, attempt)` decides whether to retry.
 *   - `delayFor(attempt)` computes the backoff delay (without jitter, so
 *     tests are deterministic).
 *
 * The actual sleep is injected by the caller (`sleepFn`), so tests never
 * wait real time.
 */

import type { SiebelRestMappedError } from './SiebelRestErrorMapper.js';

export interface RetryPolicyOptions {
  maxRetries: number;
  baseDelayMs: number;
  jitterMs: number;
}

export class RetryPolicy {
  constructor(private readonly opts: RetryPolicyOptions) {
    if (opts.maxRetries < 0) throw new Error('maxRetries must be >= 0');
    if (opts.baseDelayMs < 0) throw new Error('baseDelayMs must be >= 0');
    if (opts.jitterMs < 0) throw new Error('jitterMs must be >= 0');
  }

  get maxRetries(): number {
    return this.opts.maxRetries;
  }

  /**
   * Returns true if the error is retriable AND we have not exhausted the
   * retry budget yet. `attempt` is 0-indexed (0 = first call, 1 = first
   * retry, etc.).
   */
  shouldRetry(err: SiebelRestMappedError, attempt: number): boolean {
    if (!err.retriable) return false;
    return attempt < this.opts.maxRetries;
  }

  /**
   * Compute the deterministic backoff for a given attempt (without jitter).
   * `attempt` is 0-indexed. The delay doubles each attempt:
   *   attempt 0 → baseDelayMs
   *   attempt 1 → baseDelayMs * 2
   *   attempt 2 → baseDelayMs * 4
   *   ...
   */
  delayFor(attempt: number): number {
    if (attempt < 0) return 0;
    return this.opts.baseDelayMs * Math.pow(2, attempt);
  }

  /**
   * Compute the jitter for a given attempt. Uses an injectable `randomFn`
   * (default: `Math.random`) so tests can pin the value.
   */
  jitterFor(attempt: number, randomFn: () => number = Math.random): number {
    if (attempt < 0 || this.opts.jitterMs === 0) return 0;
    return Math.floor(randomFn() * this.opts.jitterMs);
  }

  /**
   * Total delay (backoff + jitter) for a given attempt. Tests should pass a
   * fixed `randomFn` returning 0 to get deterministic results.
   */
  totalDelayFor(attempt: number, randomFn: () => number = Math.random): number {
    return this.delayFor(attempt) + this.jitterFor(attempt, randomFn);
  }

  /**
   * Run an async operation with retry. The `sleepFn` is injected so tests
   * can skip real sleeping.
   */
  async runWithRetry<T>(
    operation: () => Promise<T>,
    isRetriable: (err: unknown) => boolean,
    sleepFn: (ms: number) => Promise<void> = (ms) => new Promise((r) => setTimeout(r, ms)),
    randomFn: () => number = Math.random
  ): Promise<T> {
    let attempt = 0;

    while (true) {
      try {
        return await operation();
      } catch (err) {
        if (!isRetriable(err) || attempt >= this.opts.maxRetries) {
          throw err;
        }
        const delay = this.totalDelayFor(attempt, randomFn);
        if (delay > 0) await sleepFn(delay);
        attempt += 1;
      }
    }
  }
}
