/**
 * SiebelRestErrorMapper — maps raw HTTP / network errors to a structured
 * `SiebelRestMappedError`. The mapper is pure: same input → same output.
 *
 * The mapper recognises Siebel-like error codes that may appear in the
 * response body (e.g. `SBL-EAI-001`). These codes are conceptual — they
 * do NOT reproduce any vendor's actual error catalog. See
 * `docs/FAKE_SIEBEL_ERROR_MODEL.md`.
 */

export type SiebelRestErrorCategory =
  | 'bad_request'
  | 'auth'
  | 'permission'
  | 'not_found'
  | 'conflict'
  | 'timeout'
  | 'rate_limit'
  | 'server'
  | 'network'
  | 'unknown';

export interface SiebelRestMappedError {
  code: string;
  category: SiebelRestErrorCategory;
  message: string;
  httpStatus?: number;
  retriable: boolean;
  rawCode?: string;
}

export class SiebelRestError extends Error {
  constructor(public readonly mapped: SiebelRestMappedError) {
    super(mapped.message);
    this.name = 'SiebelRestError';
  }
}

interface HttpLikeResponse {
  status: number;
  text(): Promise<string>;
}

function tryParseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

function extractRawCode(body: unknown): string | undefined {
  if (!body || typeof body !== 'object') return undefined;
  const obj = body as Record<string, unknown>;
  // Common shapes: { "errors": [{ "code": "SBL-EAI-001" }] }
  // or { "ErrorMessage": "SBL-EAI-001: ..." } or { "code": "SBL-..." }
  const candidates: unknown[] = [
    obj.code,
    obj.Code,
    obj.errorCode,
    obj.ErrorMessage,
    obj.message,
    (obj.errors as unknown[] | undefined)?.[0],
    (obj.Errors as unknown[] | undefined)?.[0]
  ];
  for (const c of candidates) {
    if (typeof c === 'string' && /SBL-/i.test(c)) {
      return c.split(':')[0].trim().toUpperCase();
    }
    if (c && typeof c === 'object') {
      const sub = (c as Record<string, unknown>).code ?? (c as Record<string, unknown>).Code;
      if (typeof sub === 'string' && /SBL-/i.test(sub)) {
        return sub.split(':')[0].trim().toUpperCase();
      }
    }
  }
  return undefined;
}

/**
 * Map an HTTP response (non-2xx) to a structured error. The response body
 * is read once and parsed defensively.
 */
export async function mapHttpResponseError(res: HttpLikeResponse): Promise<SiebelRestMappedError> {
  const text = await res.text().catch(() => '');
  const body = tryParseJson(text);
  const rawCode = extractRawCode(body);
  const status = res.status;

  // Siebel-like raw codes take priority when present.
  if (rawCode) {
    return mapByRawCode(rawCode, status, body, text);
  }

  return mapByHttpStatus(status, body, text);
}

function mapByRawCode(rawCode: string, status: number, body: unknown, text: string): SiebelRestMappedError {
  const upper = rawCode.toUpperCase();
  const messageFromBody =
    (body && typeof body === 'object' && typeof (body as Record<string, unknown>).message === 'string'
      ? ((body as Record<string, unknown>).message as string)
      : text.slice(0, 200)) || `Siebel-like error ${rawCode}`;

  if (upper.startsWith('SBL-EAI')) {
    return {
      code: 'SIEBEL_EAI_TIMEOUT',
      category: 'timeout',
      message: messageFromBody,
      httpStatus: status,
      retriable: true,
      rawCode: upper
    };
  }
  if (upper.startsWith('SBL-AUTH-001') || upper === 'SBL-AUTH-001') {
    return {
      code: 'SIEBEL_AUTH_EXPIRED',
      category: 'auth',
      message: 'Session expired',
      httpStatus: status,
      retriable: false,
      rawCode: upper
    };
  }
  if (upper.startsWith('SBL-AUTH-002') || upper === 'SBL-AUTH-002') {
    return {
      code: 'SIEBEL_PERMISSION_DENIED',
      category: 'permission',
      message: 'Permission denied',
      httpStatus: status,
      retriable: false,
      rawCode: upper
    };
  }
  if (upper.startsWith('SBL-AUTH')) {
    return {
      code: 'SIEBEL_AUTH_FAILED',
      category: 'auth',
      message: messageFromBody,
      httpStatus: status,
      retriable: false,
      rawCode: upper
    };
  }
  if (upper.startsWith('SBL-DAT')) {
    return {
      code: 'SIEBEL_DATA_CONFLICT',
      category: 'conflict',
      message: messageFromBody,
      httpStatus: status ?? 409,
      retriable: false,
      rawCode: upper
    };
  }
  if (upper.startsWith('SBL-BCS') || upper.startsWith('SBL-BSR')) {
    return {
      code: 'SIEBEL_NOT_FOUND',
      category: 'not_found',
      message: messageFromBody,
      httpStatus: status ?? 404,
      retriable: false,
      rawCode: upper
    };
  }
  if (upper.startsWith('SBL-DBC')) {
    return {
      code: 'SIEBEL_DB_ERROR',
      category: 'server',
      message: messageFromBody,
      httpStatus: status ?? 500,
      retriable: true,
      rawCode: upper
    };
  }
  return {
    code: 'SIEBEL_UNKNOWN',
    category: 'unknown',
    message: messageFromBody,
    httpStatus: status,
    retriable: false,
    rawCode: upper
  };
}

function mapByHttpStatus(status: number, body: unknown, text: string): SiebelRestMappedError {
  const messageFromBody =
    (body && typeof body === 'object' && typeof (body as Record<string, unknown>).message === 'string'
      ? ((body as Record<string, unknown>).message as string)
      : text.slice(0, 200)) || `HTTP ${status}`;

  switch (status) {
    case 400:
      return {
        code: 'BAD_REQUEST',
        category: 'bad_request',
        message: messageFromBody,
        httpStatus: 400,
        retriable: false
      };
    case 401:
      return {
        code: 'AUTH_EXPIRED',
        category: 'auth',
        message: 'Authentication required or session expired',
        httpStatus: 401,
        retriable: false
      };
    case 403:
      return {
        code: 'PERMISSION_DENIED',
        category: 'permission',
        message: 'Permission denied',
        httpStatus: 403,
        retriable: false
      };
    case 404:
      return { code: 'NOT_FOUND', category: 'not_found', message: messageFromBody, httpStatus: 404, retriable: false };
    case 408:
      return { code: 'TIMEOUT', category: 'timeout', message: 'Request timeout', httpStatus: 408, retriable: true };
    case 409:
      return { code: 'CONFLICT', category: 'conflict', message: messageFromBody, httpStatus: 409, retriable: false };
    case 429:
      return {
        code: 'RATE_LIMITED',
        category: 'rate_limit',
        message: 'Too many requests',
        httpStatus: 429,
        retriable: true
      };
    case 500:
    case 502:
    case 503:
    case 504:
      return {
        code: 'SERVER_ERROR',
        category: 'server',
        message: messageFromBody,
        httpStatus: status,
        retriable: true
      };
    default:
      if (status >= 500) {
        return {
          code: 'SERVER_ERROR',
          category: 'server',
          message: messageFromBody,
          httpStatus: status,
          retriable: true
        };
      }
      if (status >= 400) {
        return {
          code: 'CLIENT_ERROR',
          category: 'unknown',
          message: messageFromBody,
          httpStatus: status,
          retriable: false
        };
      }
      return { code: 'UNKNOWN', category: 'unknown', message: messageFromBody, httpStatus: status, retriable: false };
  }
}

/**
 * Map a network-level error (fetch threw, before any response). Used for
 * DNS failures, connection refused, AbortError (timeout), etc.
 */
export function mapNetworkError(err: unknown): SiebelRestMappedError {
  const name = (err as { name?: string })?.name ?? '';
  const message = (err as Error)?.message ?? 'Network error';
  if (name === 'AbortError') {
    return {
      code: 'TIMEOUT',
      category: 'timeout',
      message: 'Request aborted (timeout)',
      retriable: true
    };
  }
  return {
    code: 'NETWORK_ERROR',
    category: 'network',
    message,
    retriable: true
  };
}
