/**
 * @legacyops/siebel-bridge — public entry point.
 *
 * Exposes:
 *   - The SiebelBridge contract (anti-corruption seam)
 *   - The FakeSiebelAdapter (Fake Siebel Lab backend)
 *   - Mapping helpers (siebelToLegacyOps / legacyOpsToSiebel)
 *   - Synthetic data factory for tests and demos
 */

export * from './contracts/types.js';
export * from './contracts/siebel.js';
export * from './contracts/transports.js';
export * from './mapping/siebelToLegacyOps.js';
export * from './mapping/legacyOpsToSiebel.js';
export * from './mock/FakeSiebelAdapter.js';
export * from './mock/FakeSiebelSession.js';
export * from './mock/FakeSiebelErrorSimulator.js';
export * from './mock/FakeSiebelMetadataProvider.js';
// Real adapter foundation — see docs/REAL_SIEBEL_ADAPTER.md
export * from './real/RealSiebelConfig.js';
export * from './real/RealSiebelEndpointMap.js';
export * from './real/SiebelRestHttpClient.js';
export * from './real/SiebelRestErrorMapper.js';
export * from './real/RetryPolicy.js';
export * from './real/CircuitBreaker.js';
export * from './real/SiebelRestSessionManager.js';
export * from './real/RealSiebelPayloadMapper.js';
export * from './real/RealSiebelAdapter.js';
