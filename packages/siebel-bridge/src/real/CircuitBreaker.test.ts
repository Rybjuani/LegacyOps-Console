import { describe, it, expect } from 'vitest';
import { CircuitBreaker, CircuitBreakerOpenError } from './CircuitBreaker.js';

describe('CircuitBreaker', () => {
  it('starts in closed state and allows calls', () => {
    const cb = new CircuitBreaker({ failureThreshold: 3, cooldownMs: 1000 });
    expect(cb.getState()).toBe('closed');
    expect(cb.allowCall()).toBe(true);
  });

  it('opens after failureThreshold consecutive failures', () => {
    const cb = new CircuitBreaker({ failureThreshold: 3, cooldownMs: 1000 });
    cb.recordFailure();
    cb.recordFailure();
    expect(cb.getState()).toBe('closed');
    cb.recordFailure();
    expect(cb.getState()).toBe('open');
    expect(cb.allowCall()).toBe(false);
  });

  it('blocks calls while open', () => {
    const cb = new CircuitBreaker({ failureThreshold: 1, cooldownMs: 1000 });
    cb.recordFailure();
    expect(cb.getState()).toBe('open');
    expect(cb.allowCall()).toBe(false);
  });

  it('transitions to half_open after cooldown elapses', () => {
    let now = 1000;
    const cb = new CircuitBreaker({ failureThreshold: 1, cooldownMs: 500, nowFn: () => now });
    cb.recordFailure();
    expect(cb.getState()).toBe('open');
    now += 400;
    expect(cb.getState()).toBe('open');
    now += 200; // total 600 >= cooldown 500
    expect(cb.getState()).toBe('half_open');
    expect(cb.allowCall()).toBe(true);
  });

  it('success in half_open closes the breaker', () => {
    let now = 1000;
    const cb = new CircuitBreaker({ failureThreshold: 1, cooldownMs: 500, nowFn: () => now });
    cb.recordFailure();
    now += 600;
    expect(cb.getState()).toBe('half_open');
    cb.recordSuccess();
    expect(cb.getState()).toBe('closed');
    expect(cb.getConsecutiveFailures()).toBe(0);
  });

  it('failure in half_open reopens the breaker', () => {
    let now = 1000;
    const cb = new CircuitBreaker({ failureThreshold: 1, cooldownMs: 500, nowFn: () => now });
    cb.recordFailure();
    now += 600;
    expect(cb.getState()).toBe('half_open');
    cb.recordFailure();
    expect(cb.getState()).toBe('open');
  });

  it('success in closed resets the failure counter', () => {
    const cb = new CircuitBreaker({ failureThreshold: 3, cooldownMs: 1000 });
    cb.recordFailure();
    cb.recordFailure();
    cb.recordSuccess();
    expect(cb.getConsecutiveFailures()).toBe(0);
    expect(cb.getState()).toBe('closed');
  });

  it('reset forces closed state', () => {
    const cb = new CircuitBreaker({ failureThreshold: 1, cooldownMs: 1000 });
    cb.recordFailure();
    expect(cb.getState()).toBe('open');
    cb.reset();
    expect(cb.getState()).toBe('closed');
    expect(cb.getConsecutiveFailures()).toBe(0);
  });

  it('CircuitBreakerOpenError has correct name', () => {
    const e = new CircuitBreakerOpenError();
    expect(e.name).toBe('CircuitBreakerOpenError');
    expect(e.message).toMatch(/open/i);
  });

  it('throws on invalid options', () => {
    expect(() => new CircuitBreaker({ failureThreshold: 0, cooldownMs: 1000 })).toThrow();
    expect(() => new CircuitBreaker({ failureThreshold: 3, cooldownMs: 0 })).toThrow();
  });
});
