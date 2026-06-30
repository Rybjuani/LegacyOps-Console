/**
 * CircuitBreaker — simple, deterministic state machine.
 *
 * States:
 *   closed    — calls pass through; failures are counted.
 *   open      — calls are blocked until cooldown elapses.
 *   half_open — one trial call is allowed; success → closed, failure → open.
 *
 * Time is injected via a `nowFn` so tests can advance virtual time without
 * real sleeping.
 */

export type CircuitBreakerState = 'closed' | 'open' | 'half_open';

export interface CircuitBreakerOptions {
  failureThreshold: number;
  cooldownMs: number;
  nowFn?: () => number;
}

export class CircuitBreakerOpenError extends Error {
  constructor() {
    super('Circuit breaker is open');
    this.name = 'CircuitBreakerOpenError';
  }
}

export class CircuitBreaker {
  private state: CircuitBreakerState = 'closed';
  private consecutiveFailures = 0;
  private openedAt: number | null = null;
  private readonly nowFn: () => number;

  constructor(private readonly opts: CircuitBreakerOptions) {
    if (opts.failureThreshold <= 0) throw new Error('failureThreshold must be > 0');
    if (opts.cooldownMs <= 0) throw new Error('cooldownMs must be > 0');
    this.nowFn = opts.nowFn ?? (() => Date.now());
  }

  getState(): CircuitBreakerState {
    this.maybeTransitionToHalfOpen();
    return this.state;
  }

  getConsecutiveFailures(): number {
    return this.consecutiveFailures;
  }

  /**
   * Throws `CircuitBreakerOpenError` if the call should be blocked. When
   * the breaker is `half_open`, the call is allowed (it is the trial).
   */
  allowCall(): boolean {
    this.maybeTransitionToHalfOpen();
    if (this.state === 'open') return false;
    return true;
  }

  /**
   * Report a successful call. Resets the breaker to `closed`.
   */
  recordSuccess(): void {
    this.consecutiveFailures = 0;
    this.state = 'closed';
    this.openedAt = null;
  }

  /**
   * Report a failed call. Increments the failure counter; if it reaches
   * the threshold, opens the breaker.
   */
  recordFailure(): void {
    this.consecutiveFailures += 1;
    if (this.state === 'half_open') {
      // A failure during half_open immediately reopens the breaker.
      this.open();
      return;
    }
    if (this.consecutiveFailures >= this.opts.failureThreshold) {
      this.open();
    }
  }

  /**
   * Force the breaker to `closed`. Useful for tests and manual resets.
   */
  reset(): void {
    this.consecutiveFailures = 0;
    this.state = 'closed';
    this.openedAt = null;
  }

  private open(): void {
    this.state = 'open';
    this.openedAt = this.nowFn();
  }

  private maybeTransitionToHalfOpen(): void {
    if (this.state !== 'open' || this.openedAt === null) return;
    const elapsed = this.nowFn() - this.openedAt;
    if (elapsed >= this.opts.cooldownMs) {
      this.state = 'half_open';
    }
  }
}
