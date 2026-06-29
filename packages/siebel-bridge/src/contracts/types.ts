/**
 * Siebel-like object mapping types.
 *
 * These are conceptual, domain-inspired types — not a copy of any vendor
 * schema. They exist to give the bridge a stable shape that the anti-
 * corruption layer can translate to/from the LegacyOps domain. See
 * docs/SIEBEL_OBJECT_MAPPING.md for the conceptual table.
 */

import type { ExternalId } from '@legacyops/shared';

// ---------- Siebel-like business objects ----------
export interface SiebelAccount {
  id: ExternalId;
  name: string;
  bu: string;           // Business Unit
  status: 'Active' | 'Inactive' | 'Suspended';
  currency: string;
  segment?: string;
}

export interface SiebelContact {
  id: ExternalId;
  accountId: ExternalId;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  documentNumber?: string;
}

export interface SiebelServiceRequest {
  id: ExternalId;
  accountId: ExternalId;
  contactId: ExternalId;
  status: 'Open' | 'In Progress' | 'Pending Customer' | 'Closed' | 'Cancelled';
  priority: '1-High' | '2-Medium' | '3-Low';
  category: string;
  subject: string;
  description: string;
  owner?: string;
  created: string;
  updated: string;
  srNumber: string;       // e.g. "1-2345678" — classic Siebel-like id
}

export interface SiebelAsset {
  id: ExternalId;
  accountId: ExternalId;
  productName: string;
  serialNumber?: string;
  status: 'Active' | 'Inactive' | 'Suspended';
  startDate: string;
}

export interface SiebelActivity {
  id: ExternalId;
  accountId: ExternalId;
  contactId?: ExternalId;
  srId?: ExternalId;
  type: 'Call' | 'Email' | 'Task' | 'Appointment' | 'Note';
  status: 'Open' | 'Done' | 'Cancelled';
  description: string;
  planned: string;
  actual?: string;
  owner?: string;
}

export interface SiebelOrder {
  id: ExternalId;
  accountId: ExternalId;
  orderNumber: string;
  type: 'New' | 'Change' | 'Disconnect' | 'Suspend';
  status: 'Submitted' | 'In Progress' | 'Completed' | 'Cancelled';
  total: number;
  currency: string;
  created: string;
}

export interface SiebelBusinessObject {
  name: string;
  components: string[];
}

export interface SiebelIntegrationObject {
  name: string;
  namespace: string;
  fields: string[];
}

export interface SiebelBusinessService {
  name: string;
  displayName: string;
  methods: string[];
}

// ---------- Errors & session ----------
export type SiebelErrorCode =
  | 'SBL-DBC-001'        // database-style error
  | 'SBL-AUTH-001'       // session expired
  | 'SBL-AUTH-002'       // permission denied
  | 'SBL-BCS-001'        // business component not found
  | 'SBL-BSR-001'        // business service not found
  | 'SBL-EAI-001'        // integration layer timeout
  | 'SBL-DAT-001'        // data conflict
  | 'SBL-GEN-001';       // generic

export interface SiebelErrorShape {
  code: SiebelErrorCode;
  message: string;
  httpStatus: number;
  retriable: boolean;
}
