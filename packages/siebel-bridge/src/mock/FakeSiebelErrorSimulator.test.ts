/**
 * Deterministic tests for FakeSiebelErrorSimulator.
 *
 * These tests exercise the deterministic mode (setNextError / setNextPartialData)
 * so the result does not depend on Math.random().
 */

import { describe, it, expect } from 'vitest';
import { FakeSiebelErrorSimulator, DEFAULT_ERROR_CONFIG } from './FakeSiebelErrorSimulator.js';

describe('FakeSiebelErrorSimulator — deterministic mode', () => {
  it('throws a timeout on the next call when setNextError("timeout")', () => {
    const sim = new FakeSiebelErrorSimulator({ ...DEFAULT_ERROR_CONFIG, fixedLatencyMs: 0, jitterMs: 0 });
    sim.setNextError('timeout');
    expect(() => sim.maybeThrow()).toThrowError(/Integration layer timeout/);
  });

  it('throws an auth_expired error on the next call', () => {
    const sim = new FakeSiebelErrorSimulator({ ...DEFAULT_ERROR_CONFIG, fixedLatencyMs: 0, jitterMs: 0 });
    sim.setNextError('auth_expired');
    expect(() => sim.maybeThrow()).toThrowError(/Session expired/);
  });

  it('throws a permission_denied error on the next call', () => {
    const sim = new FakeSiebelErrorSimulator({ ...DEFAULT_ERROR_CONFIG, fixedLatencyMs: 0, jitterMs: 0 });
    sim.setNextError('permission_denied');
    expect(() => sim.maybeThrow()).toThrowError(/Permission denied/);
  });

  it('throws a conflict error on the next call', () => {
    const sim = new FakeSiebelErrorSimulator({ ...DEFAULT_ERROR_CONFIG, fixedLatencyMs: 0, jitterMs: 0 });
    sim.setNextError('conflict');
    expect(() => sim.maybeThrow()).toThrowError(/Data conflict/);
  });

  it('throws a generic error on the next call', () => {
    const sim = new FakeSiebelErrorSimulator({ ...DEFAULT_ERROR_CONFIG, fixedLatencyMs: 0, jitterMs: 0 });
    sim.setNextError('generic');
    expect(() => sim.maybeThrow()).toThrowError(/Generic Siebel-like error/);
  });

  it('consumes the forced error after one call (no double-throw)', () => {
    const sim = new FakeSiebelErrorSimulator({
      ...DEFAULT_ERROR_CONFIG,
      timeoutRate: 0,
      authFailureRate: 0,
      permissionDeniedRate: 0,
      conflictRate: 0,
      partialDataRate: 0,
      fixedLatencyMs: 0,
      jitterMs: 0
    });
    sim.setNextError('timeout');
    expect(() => sim.maybeThrow()).toThrow();
    // Second call should not throw (stochastic rates are 0)
    expect(() => sim.maybeThrow()).not.toThrow();
  });

  it('clears the forced error when setNextError(null) is called', () => {
    const sim = new FakeSiebelErrorSimulator({
      ...DEFAULT_ERROR_CONFIG,
      timeoutRate: 0,
      authFailureRate: 0,
      permissionDeniedRate: 0,
      conflictRate: 0,
      partialDataRate: 0,
      fixedLatencyMs: 0,
      jitterMs: 0
    });
    sim.setNextError('timeout');
    sim.setNextError(null);
    expect(() => sim.maybeThrow()).not.toThrow();
  });

  it('forces partial data via setNextPartialData(true)', () => {
    const sim = new FakeSiebelErrorSimulator({ ...DEFAULT_ERROR_CONFIG, partialDataRate: 0 });
    sim.setNextPartialData(true);
    expect(sim.isPartialData()).toBe(true);
    // After consumption, falls back to stochastic (which is 0 here)
    expect(sim.isPartialData()).toBe(false);
  });

  it('forces no-partial-data via setNextPartialData(false) even with rate=1', () => {
    const sim = new FakeSiebelErrorSimulator({ ...DEFAULT_ERROR_CONFIG, partialDataRate: 1 });
    sim.setNextPartialData(false);
    expect(sim.isPartialData()).toBe(false);
  });

  it('toError returns the correct shape for every known code', () => {
    const sim = new FakeSiebelErrorSimulator();
    const codes = [
      'SBL-DBC-001',
      'SBL-AUTH-001',
      'SBL-AUTH-002',
      'SBL-BCS-001',
      'SBL-BSR-001',
      'SBL-EAI-001',
      'SBL-DAT-001',
      'SBL-GEN-001'
    ] as const;
    for (const code of codes) {
      const err = sim.toError(code);
      expect(err.code).toBe(code);
      expect(typeof err.message).toBe('string');
      expect(typeof err.httpStatus).toBe('number');
      expect(typeof err.retriable).toBe('boolean');
    }
  });

  it('latency stays within configured bounds', () => {
    const sim = new FakeSiebelErrorSimulator({ ...DEFAULT_ERROR_CONFIG, fixedLatencyMs: 50, jitterMs: 30 });
    for (let i = 0; i < 50; i++) {
      const ms = sim.latency();
      expect(ms).toBeGreaterThanOrEqual(50);
      expect(ms).toBeLessThan(80);
    }
  });
});

describe('FakeSiebelErrorSimulator — stochastic mode (sanity)', () => {
  it('never throws when all rates are 0', () => {
    const sim = new FakeSiebelErrorSimulator({
      ...DEFAULT_ERROR_CONFIG,
      timeoutRate: 0,
      authFailureRate: 0,
      permissionDeniedRate: 0,
      conflictRate: 0,
      partialDataRate: 0
    });
    for (let i = 0; i < 100; i++) {
      expect(() => sim.maybeThrow()).not.toThrow();
    }
  });

  it('always throws when timeoutRate is 1', () => {
    const sim = new FakeSiebelErrorSimulator({
      ...DEFAULT_ERROR_CONFIG,
      timeoutRate: 1,
      fixedLatencyMs: 0,
      jitterMs: 0
    });
    for (let i = 0; i < 20; i++) {
      expect(() => sim.maybeThrow()).toThrow();
    }
  });
});
