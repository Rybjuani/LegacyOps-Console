/**
 * Reverse mapping — LegacyOps domain → Siebel-like DTOs.
 *
 * Used when the operator updates a Customer/Case inside LegacyOps and the
 * change must be propagated back to the legacy system through controlled
 * write-back (see docs/INTEGRATION_MODES.md).
 */

import type { Case, Customer } from '@legacyops/domain';
import type { ExternalId } from '@legacyops/shared';
import type {
  SiebelAccount,
  SiebelContact,
  SiebelServiceRequest
} from '../contracts/types.js';

export function mapLegacyOpsCustomerToSiebelContact(c: Customer): Omit<SiebelContact, 'id' | 'accountId'> & { externalId?: string } {
  const [firstName, ...rest] = c.displayName.split(' ');
  return {
    firstName: firstName ?? c.displayName,
    lastName: rest.join(' '),
    email: c.email,
    phone: c.phone,
    documentNumber: c.documentNumber,
    externalId: c.externalId
  };
}

export function mapLegacyOpsAccountToSiebelAccount(a: { externalId?: string; status: string; currency: string; segment: string }): Omit<SiebelAccount, 'id' | 'name' | 'bu'> & { externalId?: string } {
  const statusMap: Record<string, SiebelAccount['status']> = {
    active: 'Active',
    suspended: 'Suspended',
    closed: 'Inactive',
    in_collection: 'Suspended'
  };
  return {
    externalId: a.externalId,
    status: statusMap[a.status] ?? 'Active',
    currency: a.currency,
    segment: a.segment
  };
}

export function mapLegacyOpsCaseToSiebelServiceRequest(c: Case): Omit<SiebelServiceRequest, 'id' | 'created' | 'updated' | 'srNumber'> & { externalId?: string } {
  const priorityMap: Record<Case['priority'], SiebelServiceRequest['priority']> = {
    urgent: '1-High',
    high: '1-High',
    normal: '2-Medium',
    low: '3-Low'
  };
  const statusMap: Record<Case['status'], SiebelServiceRequest['status']> = {
    open: 'Open',
    in_progress: 'In Progress',
    waiting_customer: 'Pending Customer',
    waiting_third_party: 'In Progress',
    resolved: 'Closed',
    closed: 'Closed',
    cancelled: 'Cancelled'
  };
  return {
    accountId: (c.externalId ?? '') as ExternalId,
    contactId: (c.externalId ?? '') as ExternalId,
    status: statusMap[c.status],
    priority: priorityMap[c.priority],
    category: c.category,
    subject: c.subject,
    description: c.description,
    owner: c.assigneeId,
    externalId: c.externalId
  };
}
