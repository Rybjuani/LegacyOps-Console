/**
 * Object-mapping helpers between the Siebel-like world and the LegacyOps
 * domain. Pure functions, side-effect-free, easily testable.
 *
 * See docs/SIEBEL_OBJECT_MAPPING.md for the conceptual mapping table.
 */

import type {
  Account,
  Case,
  ContactMethod,
  Customer,
  Interaction,
  Invoice,
  ServiceOrder
} from '@legacyops/domain';
import type { ExternalId } from '@legacyops/shared';
import type {
  SiebelAccount,
  SiebelActivity,
  SiebelAsset,
  SiebelContact,
  SiebelOrder,
  SiebelServiceRequest
} from '../contracts/types.js';

// ---------- Siebel → LegacyOps ----------
export function mapSiebelAccountToLegacyOps(a: SiebelAccount): Pick<Account, 'externalId' | 'status' | 'currency' | 'segment'> {
  const statusMap: Record<SiebelAccount['status'], Account['status']> = {
    Active: 'active',
    Inactive: 'closed',
    Suspended: 'suspended'
  };
  return {
    externalId: a.id,
    status: statusMap[a.status],
    currency: a.currency,
    segment: (a.segment as Account['segment']) ?? 'residential'
  };
}

export function mapSiebelContactToCustomer(
  c: SiebelContact,
  account: SiebelAccount
): Omit<Customer, 'createdAt' | 'updatedAt' | 'riskFlags' | 'accountId'> & { externalAccountId: ExternalId } {
  return {
    id: `cust_${c.id}` as Customer['id'],
    externalId: c.id,
    segment: (account.segment as Customer['segment']) ?? 'residential',
    displayName: `${c.firstName} ${c.lastName}`.trim(),
    documentNumber: c.documentNumber,
    email: c.email,
    phone: c.phone,
    externalAccountId: account.id
  };
}

export function mapSiebelContactToContactMethods(c: SiebelContact): Omit<ContactMethod, 'id' | 'customerId'>[] {
  const out: Omit<ContactMethod, 'id' | 'customerId'>[] = [];
  if (c.email) out.push({ type: 'email', value: c.email, verified: false, primary: true });
  if (c.phone) out.push({ type: 'phone', value: c.phone, verified: false, primary: !c.email });
  return out;
}

export function mapSiebelSRToCase(sr: SiebelServiceRequest, customerId: string): Omit<Case, 'createdAt' | 'updatedAt'> {
  const priorityMap: Record<SiebelServiceRequest['priority'], Case['priority']> = {
    '1-High': 'urgent',
    '2-Medium': 'normal',
    '3-Low': 'low'
  };
  const statusMap: Record<SiebelServiceRequest['status'], Case['status']> = {
    Open: 'open',
    'In Progress': 'in_progress',
    'Pending Customer': 'waiting_customer',
    Closed: 'closed',
    Cancelled: 'cancelled'
  };
  return {
    id: `case_${sr.id}` as Case['id'],
    customerId: customerId as Customer['id'],
    externalId: sr.id,
    status: statusMap[sr.status],
    priority: priorityMap[sr.priority],
    category: mapSiebelCategoryToLegacyOps(sr.category),
    subject: sr.subject,
    description: sr.description,
    assigneeId: sr.owner as Case['assigneeId']
  };
}

export function mapSiebelCategoryToLegacyOps(category: string): Case['category'] {
  const k = category.toLowerCase();
  if (k.includes('billing') || k.includes('invoice')) return 'billing_claim';
  if (k.includes('cancel')) return 'cancellation_retention';
  if (k.includes('technical') || k.includes('outage')) return 'technical_complaint';
  if (k.includes('promise') || k.includes('payment')) return 'payment_promise';
  if (k.includes('service')) return 'service_request';
  if (k.includes('complaint')) return 'complaint';
  return 'general_inquiry';
}

export function mapSiebelActivityToInteraction(a: SiebelActivity, customerId: string): Omit<Interaction, 'id' | 'agentId'> {
  const channelMap: Record<SiebelActivity['type'], Interaction['channel']> = {
    Call: 'voice',
    Email: 'email',
    Task: 'in_person',
    Appointment: 'in_person',
    Note: 'email'
  };
  return {
    customerId: customerId as Customer['id'],
    channel: channelMap[a.type],
    direction: 'inbound',
    reason: a.type,
    summary: a.description,
    startedAt: a.planned,
    endedAt: a.actual
  };
}

export function mapSiebelAssetToServiceOrder(a: SiebelAsset, customerId: string, accountId: string): Omit<ServiceOrder, 'id' | 'createdAt'> {
  return {
    customerId: customerId as Customer['id'],
    accountId: accountId as Account['id'],
    type: 'change',
    status: a.status === 'Active' ? 'completed' : 'cancelled',
    externalId: a.id,
    completedAt: a.startDate
  };
}

export function mapSiebelOrderToServiceOrder(o: SiebelOrder, customerId: string, accountId: string): Omit<ServiceOrder, 'id' | 'createdAt'> {
  const typeMap: Record<SiebelOrder['type'], ServiceOrder['type']> = {
    New: 'install',
    Change: 'change',
    Disconnect: 'terminate',
    Suspend: 'suspend'
  };
  const statusMap: Record<SiebelOrder['status'], ServiceOrder['status']> = {
    Submitted: 'scheduled',
    'In Progress': 'in_progress',
    Completed: 'completed',
    Cancelled: 'cancelled'
  };
  return {
    customerId: customerId as Customer['id'],
    accountId: accountId as Account['id'],
    type: typeMap[o.type],
    status: statusMap[o.status],
    externalId: o.id,
    completedAt: o.status === 'Completed' ? o.created : undefined
  };
}

export function mapSiebelInvoiceToLegacyOps(
  inv: { id: string; accountId: string; period: string; totalAmount: number; paidAmount: number; currency: string; status: string; issuedAt: string; dueAt: string },
  accountId: string
): Invoice {
  const statusMap: Record<string, Invoice['status']> = {
    Paid: 'paid',
    Partial: 'partial',
    Overdue: 'overdue',
    Disputed: 'disputed',
    Issued: 'issued'
  };
  return {
    id: `inv_${inv.id}` as Invoice['id'],
    accountId: accountId as Account['id'],
    period: inv.period,
    issuedAt: inv.issuedAt,
    dueAt: inv.dueAt,
    totalAmount: inv.totalAmount,
    paidAmount: inv.paidAmount,
    currency: inv.currency,
    status: statusMap[inv.status] ?? 'issued',
    externalId: inv.id as ExternalId
  };
}

// ---------- LegacyOps → Siebel ----------
export function mapLegacyOpsCaseToSiebelSR(c: Case): Omit<SiebelServiceRequest, 'id' | 'created' | 'updated' | 'srNumber'> & { externalId?: string } {
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
