/**
 * FakeSiebelErrorSimulator — deterministic simulation of integration failures.
 *
 * Used by the Fake Siebel Lab to reproduce classic integration pathologies
 * (timeouts, expired sessions, permission errors, conflicts, partial data)
 * without contacting any real backend.
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

export class FakeSiebelErrorSimulator {
  constructor(private cfg: ErrorSimulationConfig = DEFAULT_ERROR_CONFIG) {}

  configure(cfg: Partial<ErrorSimulationConfig>): void {
    this.cfg = { ...this.cfg, ...cfg };
  }

  maybeThrow(ctx?: AdapterCallContext): void {
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
