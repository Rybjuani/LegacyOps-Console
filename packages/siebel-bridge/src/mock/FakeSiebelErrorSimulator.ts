/**
 * FakeSiebelErrorSimulator — simulation of integration failures.
 *
 * Two modes:
 *  - "stochastic" (default, demo): probabilistic failure rates.
 *  - "deterministic" (tests): forces a specific failure on the next call,
 *    or throws on demand.
 *
 * The deterministic mode exists so test suites can exercise each error code
 * without flakiness from Math.random().
 */

import type { AdapterCallContext } from '@legacyops/adapters';
import type { SiebelErrorShape, SiebelErrorCode } from '../contracts/types.js';

export interface ErrorSimulationConfig {
  timeoutRate: number; // 0..1
  authFailureRate: number; // 0..1
  permissionDeniedRate: number;
  conflictRate: number;
  partialDataRate: number;
  fixedLatencyMs: number;
  jitterMs: number;
}

export const DEFAULT_ERROR_CONFIG: ErrorSimulationConfig = {
  timeoutRate: 0.03,
  authFailureRate: 0.0,
  permissionDeniedRate: 0.02,
  conflictRate: 0.01,
  partialDataRate: 0.05,
  fixedLatencyMs: 120,
  jitterMs: 80
};

/**
 * Deterministic error to inject on the next `maybeThrow` call.
 * `null` means no forced error.
 */
export type DeterministicError =
  'timeout' | 'auth_expired' | 'permission_denied' | 'conflict' | 'partial_data' | 'generic' | null;

const DETERMINISTIC_TO_CODE: Record<Exclude<DeterministicError, null>, SiebelErrorCode> = {
  timeout: 'SBL-EAI-001',
  auth_expired: 'SBL-AUTH-001',
  permission_denied: 'SBL-AUTH-002',
  conflict: 'SBL-DAT-001',
  partial_data: 'SBL-DAT-001',
  generic: 'SBL-GEN-001'
};

export class FakeSiebelErrorSimulator {
  private nextError: DeterministicError = null;
  private nextPartialData: boolean | null = null;

  constructor(private cfg: ErrorSimulationConfig = DEFAULT_ERROR_CONFIG) {}

  configure(cfg: Partial<ErrorSimulationConfig>): void {
    this.cfg = { ...this.cfg, ...cfg };
  }

  /**
   * Force the next `maybeThrow` to raise the specified error. The forced
   * error is consumed after one call. Pass `null` to clear.
   */
  setNextError(err: DeterministicError): void {
    this.nextError = err;
  }

  /**
   * Force the next `isPartialData` to return the specified value. The
   * forced value is consumed after one call. Pass `null` to clear.
   */
  setNextPartialData(value: boolean | null): void {
    this.nextPartialData = value;
  }

  maybeThrow(ctx?: AdapterCallContext): void {
    // Deterministic path takes priority.
    if (this.nextError !== null) {
      const code = DETERMINISTIC_TO_CODE[this.nextError];
      this.nextError = null;
      throw this.toError(code);
    }

    // Stochastic path (used in demo mode).
    const r = Math.random();
    if (r < this.cfg.timeoutRate) {
      throw this.toError('SBL-EAI-001');
    }
    if (r < this.cfg.timeoutRate + this.cfg.authFailureRate) {
      throw this.toError('SBL-AUTH-001');
    }
    if (r < this.cfg.timeoutRate + this.cfg.authFailureRate + this.cfg.permissionDeniedRate) {
      throw this.toError('SBL-AUTH-002');
    }
    if (r < this.cfg.timeoutRate + this.cfg.authFailureRate + this.cfg.permissionDeniedRate + this.cfg.conflictRate) {
      throw this.toError('SBL-DAT-001');
    }
    void ctx;
  }

  isPartialData(): boolean {
    if (this.nextPartialData !== null) {
      const v = this.nextPartialData;
      this.nextPartialData = null;
      return v;
    }
    return Math.random() < this.cfg.partialDataRate;
  }

  latency(): number {
    return this.cfg.fixedLatencyMs + Math.floor(Math.random() * this.cfg.jitterMs);
  }

  toError(code: SiebelErrorCode): SiebelErrorShape {
    const map: Record<SiebelErrorCode, SiebelErrorShape> = {
      'SBL-DBC-001': { code, message: 'Siebel-like database error', httpStatus: 500, retriable: true },
      'SBL-AUTH-001': { code, message: 'Session expired', httpStatus: 401, retriable: false },
      'SBL-AUTH-002': { code, message: 'Permission denied', httpStatus: 403, retriable: false },
      'SBL-BCS-001': { code, message: 'Business component not found', httpStatus: 404, retriable: false },
      'SBL-BSR-001': { code, message: 'Business service not found', httpStatus: 404, retriable: false },
      'SBL-EAI-001': { code, message: 'Integration layer timeout', httpStatus: 504, retriable: true },
      'SBL-DAT-001': { code, message: 'Data conflict', httpStatus: 409, retriable: false },
      'SBL-GEN-001': { code, message: 'Generic Siebel-like error', httpStatus: 500, retriable: true }
    };
    return map[code];
  }
}
