/**
 * siebelAdapterFactory — selects between FakeSiebelAdapter and RealSiebelAdapter.
 *
 * Default mode is `fake` (the Fake Siebel Lab) so the scaffold keeps working
 * without a real Siebel endpoint. The `real` mode is only enabled when
 * `LEGACYOPS_SIEBEL_ADAPTER=real` AND a valid RealSiebelConfig can be loaded
 * from the environment.
 *
 * If `real` is requested but the config is invalid, the factory falls back
 * to `fake` and records the reason — it never crashes the API.
 */

import type { SiebelBridge } from '@legacyops/siebel-bridge';
import {
  FakeSiebelAdapter,
  RealSiebelAdapter,
  loadRealSiebelConfig,
  RealSiebelConfigError,
  redactConfig,
  type RealSiebelConfig,
  type RealSiebelEndpointMap
} from '@legacyops/siebel-bridge';
import type { FakeSiebelDataset } from '@legacyops/siebel-bridge';

export type SiebelAdapterMode = 'fake' | 'real';

export interface AdapterFactoryResult {
  adapter: SiebelBridge;
  mode: SiebelAdapterMode;
  realConfigured: boolean;
  realConfigError?: string;
  realConfigRedacted?: Record<string, unknown>;
  realEndpointMap?: Readonly<RealSiebelEndpointMap>;
}

export function buildSiebelAdapter(
  env: NodeJS.ProcessEnv,
  fakeDataset: FakeSiebelDataset,
  globalFetch: (input: string | URL, init?: RequestInit) => Promise<Response>
): AdapterFactoryResult {
  const requestedMode = (env.LEGACYOPS_SIEBEL_ADAPTER ?? 'fake') as SiebelAdapterMode;

  if (requestedMode !== 'real') {
    const fake = new FakeSiebelAdapter(fakeDataset);
    fake.configureErrors({
      timeoutRate: 0,
      authFailureRate: 0,
      permissionDeniedRate: 0,
      conflictRate: 0,
      partialDataRate: 0,
      fixedLatencyMs: 0,
      jitterMs: 0
    });
    return { adapter: fake, mode: 'fake', realConfigured: false };
  }

  // Try to build a real adapter.
  try {
    const config: RealSiebelConfig = loadRealSiebelConfig(env);
    const real = new RealSiebelAdapter({ config, fetchImpl: globalFetch });
    return {
      adapter: real,
      mode: 'real',
      realConfigured: true,
      realConfigRedacted: redactConfig(config),
      realEndpointMap: real.getEndpointMap()
    };
  } catch (err) {
    const reason = err instanceof RealSiebelConfigError ? err.message : 'Unknown config error';
    // Fallback to fake so the API stays up.
    const fake = new FakeSiebelAdapter(fakeDataset);
    fake.configureErrors({
      timeoutRate: 0,
      authFailureRate: 0,
      permissionDeniedRate: 0,
      conflictRate: 0,
      partialDataRate: 0,
      fixedLatencyMs: 0,
      jitterMs: 0
    });
    return {
      adapter: fake,
      mode: 'fake',
      realConfigured: false,
      realConfigError: reason
    };
  }
}
