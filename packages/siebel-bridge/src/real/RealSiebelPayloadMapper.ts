/**
 * RealSiebelPayloadMapper — defensive mappers from raw REST payloads to
 * conceptual Siebel-like DTOs.
 *
 * Siebel REST responses vary widely across versions and customisations.
 * The mapper tries common field names (direct + aliases) and falls back
 * to safe defaults when a field is missing. It NEVER throws on a missing
 * optional field; it only throws when a REQUIRED field (typically the id)
 * is absent.
 *
 * The mapper does NOT reproduce any proprietary schema. Field names here
 * are generic Siebel-like concepts (Id, Name, Status, etc.).
 */

import type {
  SiebelAccount,
  SiebelActivity,
  SiebelAsset,
  SiebelContact,
  SiebelIntegrationObject,
  SiebelBusinessObject,
  SiebelBusinessService,
  SiebelOrder,
  SiebelServiceRequest
} from '../contracts/types.js';
import type { ExternalId } from '@legacyops/shared';

export class PayloadMappingError extends Error {
  constructor(
    public readonly entity: string,
    public readonly missing: string
  ) {
    super(`Cannot map ${entity}: missing required field "${missing}"`);
    this.name = 'PayloadMappingError';
  }
}

function pickStr(obj: Record<string, unknown>, keys: string[]): string | undefined {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === 'string' && v.length > 0) return v;
    if (typeof v === 'number' && Number.isFinite(v)) return String(v);
  }
  return undefined;
}

function pickNum(obj: Record<string, unknown>, keys: string[]): number | undefined {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === 'number' && Number.isFinite(v)) return v;
    if (typeof v === 'string' && v.length > 0) {
      const n = Number(v);
      if (Number.isFinite(n)) return n;
    }
  }
  return undefined;
}

function asRecord(raw: unknown): Record<string, unknown> {
  if (!raw || typeof raw !== 'object') return {};
  return raw as Record<string, unknown>;
}

/**
 * Siebel REST often returns a wrapper like:
 *   { "items": [...], "links": [...] }
 * or:
 *   { "businessObjects": [...] }
 * This helper unwraps the array.
 */
export function unwrapList(raw: unknown, candidateKeys: string[] = ['items', 'rows', 'records', 'data']): unknown[] {
  const obj = asRecord(raw);
  for (const k of candidateKeys) {
    if (Array.isArray(obj[k])) return obj[k] as unknown[];
  }
  if (Array.isArray(raw)) return raw as unknown[];
  return [];
}

const ACCOUNT_STATUS_MAP: Record<string, SiebelAccount['status']> = {
  Active: 'Active',
  Inactive: 'Inactive',
  Suspended: 'Suspended',
  active: 'Active',
  inactive: 'Inactive',
  suspended: 'Suspended'
};

export function mapRestAccount(raw: unknown): SiebelAccount {
  const obj = asRecord(raw);
  const id = pickStr(obj, ['Id', 'id', 'Account Id', 'AccountId']);
  if (!id) throw new PayloadMappingError('Account', 'Id');
  const name = pickStr(obj, ['Name', 'name', 'Account Name']) ?? 'Unknown';
  const bu = pickStr(obj, ['BU', 'Business Unit', 'Organization']) ?? 'DEFAULT';
  const rawStatus = pickStr(obj, ['Status', 'status']) ?? 'Active';
  const currency = pickStr(obj, ['Currency', 'currency']) ?? 'USD';
  const segment = pickStr(obj, ['Segment', 'segment', 'Account Type']) ?? undefined;
  return {
    id: id as ExternalId,
    name,
    bu,
    status: ACCOUNT_STATUS_MAP[rawStatus] ?? 'Active',
    currency,
    segment
  };
}

export function mapRestContact(raw: unknown): SiebelContact {
  const obj = asRecord(raw);
  const id = pickStr(obj, ['Id', 'id', 'Contact Id', 'ContactId']);
  if (!id) throw new PayloadMappingError('Contact', 'Id');
  const accountId = pickStr(obj, ['AccountId', 'Account Id', 'accountId']) ?? '';
  const firstName = pickStr(obj, ['FirstName', 'First Name', 'first_name']) ?? '';
  const lastName = pickStr(obj, ['LastName', 'Last Name', 'last_name']) ?? '';
  return {
    id: id as ExternalId,
    accountId: accountId as ExternalId,
    firstName,
    lastName,
    email: pickStr(obj, ['Email', 'EmailAddress', 'email']),
    phone: pickStr(obj, ['Phone', 'Work Phone', 'phone']),
    documentNumber: pickStr(obj, ['DocumentNumber', 'SSN', 'TaxId'])
  };
}

const SR_STATUS_MAP: Record<string, SiebelServiceRequest['status']> = {
  Open: 'Open',
  'In Progress': 'In Progress',
  'Pending Customer': 'Pending Customer',
  Closed: 'Closed',
  Cancelled: 'Cancelled'
};

const SR_PRIORITY_MAP: Record<string, SiebelServiceRequest['priority']> = {
  '1-High': '1-High',
  '2-Medium': '2-Medium',
  '3-Low': '3-Low',
  '1-High ': '1-High',
  High: '1-High',
  Medium: '2-Medium',
  Low: '3-Low'
};

export function mapRestServiceRequest(raw: unknown): SiebelServiceRequest {
  const obj = asRecord(raw);
  const id = pickStr(obj, ['Id', 'id', 'SR Id', 'ServiceRequestId']);
  if (!id) throw new PayloadMappingError('ServiceRequest', 'Id');
  const accountId = pickStr(obj, ['AccountId', 'Account Id']) ?? '';
  const contactId = pickStr(obj, ['ContactId', 'Contact Id']) ?? '';
  const statusRaw = pickStr(obj, ['Status', 'status']) ?? 'Open';
  const priorityRaw = pickStr(obj, ['Priority', 'priority']) ?? '2-Medium';
  const created = pickStr(obj, ['Created', 'CreatedDate', 'created']) ?? '1970-01-01T00:00:00.000Z';
  const updated = pickStr(obj, ['Updated', 'LastUpdated', 'updated']) ?? created;
  return {
    id: id as ExternalId,
    accountId: accountId as ExternalId,
    contactId: contactId as ExternalId,
    status: SR_STATUS_MAP[statusRaw] ?? 'Open',
    priority: SR_PRIORITY_MAP[priorityRaw] ?? '2-Medium',
    category: pickStr(obj, ['Category', 'SubArea', 'Area']) ?? 'General',
    subject: pickStr(obj, ['Subject', 'Title', 'Description']) ?? '',
    description: pickStr(obj, ['Description', 'Abstract', 'DetailedDescription']) ?? '',
    owner: pickStr(obj, ['Owner', 'Assignee', 'OwnerLogin']),
    created,
    updated,
    srNumber: pickStr(obj, ['SRNumber', 'ServiceRequestNumber', 'TicketNumber']) ?? id
  };
}

const ASSET_STATUS_MAP: Record<string, SiebelAsset['status']> = {
  Active: 'Active',
  Inactive: 'Inactive',
  Suspended: 'Suspended'
};

export function mapRestAsset(raw: unknown): SiebelAsset {
  const obj = asRecord(raw);
  const id = pickStr(obj, ['Id', 'id', 'AssetId']);
  if (!id) throw new PayloadMappingError('Asset', 'Id');
  const accountId = pickStr(obj, ['AccountId', 'Account Id']) ?? '';
  const statusRaw = pickStr(obj, ['Status', 'status']) ?? 'Active';
  return {
    id: id as ExternalId,
    accountId: accountId as ExternalId,
    productName: pickStr(obj, ['ProductName', 'Product', 'Name']) ?? 'Unknown',
    serialNumber: pickStr(obj, ['SerialNumber', 'Serial']),
    status: ASSET_STATUS_MAP[statusRaw] ?? 'Active',
    startDate: pickStr(obj, ['StartDate', 'Created']) ?? '1970-01-01'
  };
}

const ACTIVITY_STATUS_MAP: Record<string, SiebelActivity['status']> = {
  Open: 'Open',
  Done: 'Done',
  Cancelled: 'Cancelled',
  Completed: 'Done'
};

export function mapRestActivity(raw: unknown): SiebelActivity {
  const obj = asRecord(raw);
  const id = pickStr(obj, ['Id', 'id', 'ActivityId']);
  if (!id) throw new PayloadMappingError('Activity', 'Id');
  const accountId = pickStr(obj, ['AccountId', 'Account Id']) ?? '';
  return {
    id: id as ExternalId,
    accountId: accountId as ExternalId,
    contactId: (pickStr(obj, ['ContactId', 'Contact Id']) ?? undefined) as ExternalId | undefined,
    srId: (pickStr(obj, ['ServiceRequestId', 'SR Id']) ?? undefined) as ExternalId | undefined,
    type: (pickStr(obj, ['Type', 'ActivityType']) ?? 'Task') as SiebelActivity['type'],
    status: ACTIVITY_STATUS_MAP[pickStr(obj, ['Status', 'status']) ?? 'Open'] ?? 'Open',
    description: pickStr(obj, ['Description', 'Notes']) ?? '',
    planned: pickStr(obj, ['Planned', 'PlannedDate', 'StartDate']) ?? '1970-01-01',
    actual: pickStr(obj, ['Actual', 'ActualDate', 'CompletedDate']),
    owner: pickStr(obj, ['Owner', 'Assignee'])
  };
}

const ORDER_STATUS_MAP: Record<string, SiebelOrder['status']> = {
  Submitted: 'Submitted',
  'In Progress': 'In Progress',
  Completed: 'Completed',
  Cancelled: 'Cancelled'
};

const ORDER_TYPE_MAP: Record<string, SiebelOrder['type']> = {
  New: 'New',
  Change: 'Change',
  Disconnect: 'Disconnect',
  Suspend: 'Suspend'
};

export function mapRestOrder(raw: unknown): SiebelOrder {
  const obj = asRecord(raw);
  const id = pickStr(obj, ['Id', 'id', 'OrderId']);
  if (!id) throw new PayloadMappingError('Order', 'Id');
  const accountId = pickStr(obj, ['AccountId', 'Account Id']) ?? '';
  return {
    id: id as ExternalId,
    accountId: accountId as ExternalId,
    orderNumber: pickStr(obj, ['OrderNumber', 'OrderNumber']) ?? id,
    type: ORDER_TYPE_MAP[pickStr(obj, ['Type', 'OrderType']) ?? 'New'] ?? 'New',
    status: ORDER_STATUS_MAP[pickStr(obj, ['Status', 'status']) ?? 'Submitted'] ?? 'Submitted',
    total: pickNum(obj, ['Total', 'TotalAmount', 'Amount']) ?? 0,
    currency: pickStr(obj, ['Currency', 'currency']) ?? 'USD',
    created: pickStr(obj, ['Created', 'CreatedDate']) ?? '1970-01-01'
  };
}

export interface SiebelInvoiceLike {
  id: string;
  accountId: string;
  period: string;
  totalAmount: number;
  paidAmount: number;
  currency: string;
  status: string;
  issuedAt: string;
  dueAt: string;
}

export function mapRestInvoice(raw: unknown): SiebelInvoiceLike {
  const obj = asRecord(raw);
  const id = pickStr(obj, ['Id', 'id', 'InvoiceId']);
  if (!id) throw new PayloadMappingError('Invoice', 'Id');
  return {
    id,
    accountId: pickStr(obj, ['AccountId', 'Account Id']) ?? '',
    period: pickStr(obj, ['Period', 'BillingPeriod']) ?? '',
    totalAmount: pickNum(obj, ['TotalAmount', 'Total', 'AmountDue']) ?? 0,
    paidAmount: pickNum(obj, ['PaidAmount', 'AmountPaid']) ?? 0,
    currency: pickStr(obj, ['Currency', 'currency']) ?? 'USD',
    status: pickStr(obj, ['Status', 'status']) ?? 'Issued',
    issuedAt: pickStr(obj, ['IssuedDate', 'IssuedAt', 'InvoiceDate']) ?? '1970-01-01',
    dueAt: pickStr(obj, ['DueDate', 'DueAt']) ?? '1970-01-01'
  };
}

export function mapRestBusinessObject(raw: unknown): SiebelBusinessObject {
  const obj = asRecord(raw);
  const name = pickStr(obj, ['Name', 'name']);
  if (!name) throw new PayloadMappingError('BusinessObject', 'Name');
  const componentsRaw = obj.components ?? obj.Components ?? obj.businessComponents;
  const components = Array.isArray(componentsRaw)
    ? componentsRaw
        .map((c) => (typeof c === 'string' ? c : (pickStr(asRecord(c), ['Name', 'name']) ?? '')))
        .filter((s) => s.length > 0)
    : [];
  return { name, components };
}

export function mapRestIntegrationObject(raw: unknown): SiebelIntegrationObject {
  const obj = asRecord(raw);
  const name = pickStr(obj, ['Name', 'name']);
  if (!name) throw new PayloadMappingError('IntegrationObject', 'Name');
  const fieldsRaw = obj.fields ?? obj.Fields;
  const fields = Array.isArray(fieldsRaw)
    ? fieldsRaw
        .map((f) => (typeof f === 'string' ? f : (pickStr(asRecord(f), ['Name', 'name']) ?? '')))
        .filter((s) => s.length > 0)
    : [];
  return {
    name,
    namespace: pickStr(obj, ['Namespace', 'namespace']) ?? 'LegacyOps.SiebelLike',
    fields
  };
}

export function mapRestBusinessService(raw: unknown): SiebelBusinessService {
  const obj = asRecord(raw);
  const name = pickStr(obj, ['Name', 'name']);
  if (!name) throw new PayloadMappingError('BusinessService', 'Name');
  const methodsRaw = obj.methods ?? obj.Methods;
  const methods = Array.isArray(methodsRaw)
    ? methodsRaw
        .map((m) => (typeof m === 'string' ? m : (pickStr(asRecord(m), ['Name', 'name']) ?? '')))
        .filter((s) => s.length > 0)
    : [];
  return {
    name,
    displayName: pickStr(obj, ['DisplayName', 'displayName']) ?? name,
    methods
  };
}
