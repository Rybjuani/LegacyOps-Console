/**
 * Conceptual transport contracts for the Siebel-like bridge.
 *
 * These are NOT real Siebel clients. They are vendor-neutral interface
 * definitions that a future real adapter implementation would satisfy.
 * The Fake Siebel Lab satisfies them through the in-memory
 * `FakeSiebelAdapter`.
 *
 * See:
 *   docs/SIEBEL_BRIDGE_CONTRACTS.md
 *   docs/FAKE_SIEBEL_ERROR_MODEL.md
 */

import type { AdapterCallContext } from '@legacyops/adapters';

// ---------- REST client ----------
export interface SiebelRestClient {
  /**
   * Issue a GET request against a Siebel REST resource path.
   * Implementations MUST:
   *   - read base URL, credentials and timeout from environment
   *   - attach the active session token
   *   - enforce a circuit breaker on consecutive failures
   *   - record an `external.adapter_call` audit event
   */
  get<T>(path: string, ctx?: AdapterCallContext): Promise<T>;
  post<T>(path: string, body: unknown, ctx?: AdapterCallContext): Promise<T>;
  put<T>(path: string, body: unknown, ctx?: AdapterCallContext): Promise<T>;
  delete<T>(path: string, ctx?: AdapterCallContext): Promise<T>;
}

// ---------- SOAP client (conceptual) ----------
export interface SiebelSoapClient {
  /**
   * Issue a SOAP request against a Siebel EAI endpoint.
   * Implementations MUST:
   *   - read WSDL endpoint from environment
   *   - sign the request with the active session token
   *   - map SOAP faults to `SiebelErrorShape`
   */
  call<T>(operation: string, body: unknown, ctx?: AdapterCallContext): Promise<T>;
}

// ---------- EAI client (conceptual) ----------
export interface SiebelEaiClient {
  /**
   * Issue an EAI (Enterprise Application Integration) request. EAI is
   * typically used for asynchronous workflows and integration objects.
   */
  invoke<T>(serviceName: string, requestXmlOrJson: unknown, ctx?: AdapterCallContext): Promise<T>;
}

// ---------- Business object repository ----------
export interface SiebelBusinessObjectRepository {
  listBusinessObjects(): Promise<{ name: string; components: string[] }[]>;
  listBusinessComponents(businessObject: string): Promise<string[]>;
  describeBusinessComponent(name: string): Promise<{ fields: string[]; primaryIdField?: string }>;
}

// ---------- Business component query ----------
export interface SiebelBusinessComponentQuery {
  businessComponent: string;
  fields: string[];
  whereClause?: string;
  sortOrder?: string;
  pageSize?: number;
  page?: number;
}

export interface SiebelBusinessComponentQueryResult {
  businessComponent: string;
  rows: Record<string, unknown>[];
  total: number;
  page: number;
  pageSize: number;
}

// ---------- Session manager ----------
export interface SiebelSessionManager {
  login(username: string, password: string): Promise<{ token: string; expiresAt: string; userId: string }>;
  verify(token: string): Promise<{ valid: boolean; expiresAt?: string; userId?: string }>;
  logout(token: string): Promise<void>;
  refresh(token: string): Promise<{ token: string; expiresAt: string }>;
}

// ---------- Integration object mapper ----------
export interface SiebelIntegrationObjectMapper {
  /**
   * Serialize a LegacyOps domain entity into a Siebel Integration Object
   * payload. Used by controlled write-back.
   */
  toIntegrationObject(entity: string, payload: Record<string, unknown>): Record<string, unknown>;
  /**
   * Deserialize a Siebel Integration Object payload into a LegacyOps-
   * shaped record. Used by read-only overlay and reconciliation.
   */
  fromIntegrationObject(entity: string, io: Record<string, unknown>): Record<string, unknown>;
}

// ---------- Error mapper ----------
export interface SiebelErrorMapper {
  /**
   * Map a raw backend error (HTTP status, body, code) to a
   * `SiebelErrorShape`. Implementations should classify errors as
   * retriable vs non-retriable.
   */
  toSiebelError(input: { httpStatus?: number; body?: unknown; code?: string; message?: string }): {
    code: string;
    message: string;
    httpStatus: number;
    retriable: boolean;
  };
}

// ---------- Aggregated transport contract ----------
export interface SiebelTransport
  extends
    SiebelRestClient,
    SiebelSoapClient,
    SiebelEaiClient,
    SiebelBusinessObjectRepository,
    SiebelSessionManager,
    SiebelIntegrationObjectMapper,
    SiebelErrorMapper {
  readonly name: 'siebel-transport';
  health(): Promise<{ status: 'up' | 'degraded' | 'down'; latencyMs: number; message?: string }>;
}
