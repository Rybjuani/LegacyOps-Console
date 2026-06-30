import { describe, it, expect } from 'vitest';
import { RetryPolicy } from './RetryPolicy.js';
import type { SiebelRestMappedError } from './SiebelRestErrorMapper.js';

function makeErr(retriable: boolean): SiebelRestMappedError {
  return {
    code: 'X',
    category: 'server',
    message: 'boom',
    retriable
  };
}

describe('RetryPolicy', () => {
  it('maxRetries=0 never retries', () => {
    const p = new RetryPolicy({ maxRetries: 0, baseDelayMs: 0, jitterMs: 0 });
    expect(p.shouldRetry(makeErr(true), 0)).toBe(false);
  });

  it('retriable=true retries up to maxRetries', () => {
    const p = new RetryPolicy({ maxRetries: 3, baseDelayMs: 0, jitterMs: 0 });
    expect(p.shouldRetry(makeErr(true), 0)).toBe(true);
    expect(p.shouldRetry(makeErr(true), 1)).toBe(true);
    expect(p.shouldRetry(makeErr(true), 2)).toBe(true);
    expect(p.shouldRetry(makeErr(true), 3)).toBe(false);
  });

  it('non-retriable never retries', () => {
    const p = new RetryPolicy({ maxRetries: 5, baseDelayMs: 0, jitterMs: 0 });
    expect(p.shouldRetry(makeErr(false), 0)).toBe(false);
    expect(p.shouldRetry(makeErr(false), 1)).toBe(false);
  });

  it('delayFor doubles each attempt (no jitter)', () => {
    const p = new RetryPolicy({ maxRetries: 5, baseDelayMs: 100, jitterMs: 0 });
    expect(p.delayFor(0)).toBe(100);
    expect(p.delayFor(1)).toBe(200);
    expect(p.delayFor(2)).toBe(400);
    expect(p.delayFor(3)).toBe(800);
  });

  it('totalDelayFor is deterministic with randomFn=()=>0', () => {
    const p = new RetryPolicy({ maxRetries: 5, baseDelayMs: 100, jitterMs: 50 });
    expect(p.totalDelayFor(0, () => 0)).toBe(100);
    expect(p.totalDelayFor(1, () => 0)).toBe(200);
    expect(p.totalDelayFor(2, () => 0)).toBe(400);
  });

  it('totalDelayFor includes jitter when randomFn is non-zero', () => {
    const p = new RetryPolicy({ maxRetries: 5, baseDelayMs: 100, jitterMs: 50 });
    expect(p.totalDelayFor(0, () => 0.5)).toBe(125);
  });

  it('runWithRetry succeeds on first try', async () => {
    const p = new RetryPolicy({ maxRetries: 3, baseDelayMs: 0, jitterMs: 0 });
    let calls = 0;
    const result = await p.runWithRetry(
      async () => {
        calls += 1;
        return 'ok';
      },
      () => false,
      async () => {}
    );
    expect(result).toBe('ok');
    expect(calls).toBe(1);
  });

  it('runWithRetry retries retriable errors and eventually succeeds', async () => {
    const p = new RetryPolicy({ maxRetries: 3, baseDelayMs: 0, jitterMs: 0 });
    let calls = 0;
    const result = await p.runWithRetry(
      async () => {
        calls += 1;
        if (calls < 3) throw new Error('transient');
        return 'ok';
      },
      () => true, // all errors retriable
      async () => {}
    );
    expect(result).toBe('ok');
    expect(calls).toBe(3);
  });

  it('runWithRetry does not retry non-retriable errors', async () => {
    const p = new RetryPolicy({ maxRetries: 3, baseDelayMs: 0, jitterMs: 0 });
    let calls = 0;
    await expect(
      p.runWithRetry(
        async () => {
          calls += 1;
          throw new Error('permanent');
        },
        () => false,
        async () => {}
      )
    ).rejects.toThrow('permanent');
    expect(calls).toBe(1);
  });

  it('runWithRetry exhausts retries and rethrows', async () => {
    const p = new RetryPolicy({ maxRetries: 2, baseDelayMs: 0, jitterMs: 0 });
    let calls = 0;
    await expect(
      p.runWithRetry(
        async () => {
          calls += 1;
          throw new Error('always');
        },
        () => true,
        async () => {}
      )
    ).rejects.toThrow('always');
    expect(calls).toBe(3); // 1 initial + 2 retries
  });

  it('runWithRetry uses injected sleepFn (no real sleep)', async () => {
    const p = new RetryPolicy({ maxRetries: 2, baseDelayMs: 100, jitterMs: 0 });
    const slept: number[] = [];
    let calls = 0;
    await p.runWithRetry(
      async () => {
        calls += 1;
        if (calls < 3) throw new Error('transient');
        return 'ok';
      },
      () => true,
      async (ms) => {
        slept.push(ms);
      }
    );
    expect(slept).toEqual([100, 200]);
  });
});
