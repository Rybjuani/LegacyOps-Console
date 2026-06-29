/**
 * @legacyops/domain — Core CRM domain entities, value objects, and helpers.
 *
 * This package is intentionally free of any Siebel-like coupling. All
 * legacy/Siebel concepts live in @legacyops/siebel-bridge and are translated
 * through @legacyops/adapters + the anti-corruption layer described in
 * docs/ANTI_CORRUPTION_LAYER.md.
 */

import type {
  AccountId,
  AuditEventId,
  CaseId,
  CustomerId,
  ExternalId,
  InteractionId,
  InvoiceId,
  UserId,
  WorkflowRunId
} from '@legacyops/shared';

// ---------- Customer & Account ----------
export type CustomerSegment = 'residential' | 'business' | 'vip' | 'internal';

export interface Customer {
  id: CustomerId;
  externalId?: ExternalId;        // Populated only when mirrored from a legacy system
  segment: CustomerSegment;
  displayName: string;
  legalName?: string;
  documentNumber?: string;
  email?: string;
  phone?: string;
  accountId: AccountId;
  riskFlags: RiskFlag[];
  createdAt: string;
  updatedAt: string;
}

export type RiskFlag =
  | 'vip'
  | 'churn_risk'
  | 'high_debt'
  | 'recent_escalation'
  | 'fraud_alert'
  | 'special_handling';

export interface Account {
  id: AccountId;
  customerId: CustomerId;
  externalId?: ExternalId;
  status: 'active' | 'suspended' | 'closed' | 'in_collection';
  segment: CustomerSegment;
  creditLimit?: number;
  currency: string;
  openedAt: string;
}

export type ContactMethodType = 'email' | 'phone' | 'sms' | 'whatsapp' | 'push' | 'mail';

export interface ContactMethod {
  id: string;
  customerId: CustomerId;
  type: ContactMethodType;
  value: string;
  verified: boolean;
  primary: boolean;
}

// ---------- Contract, Product, Service ----------
export interface Contract {
  id: string;
  accountId: AccountId;
  productId: string;
  startDate: string;
  endDate?: string;
  status: 'active' | 'expired' | 'cancelled' | 'pending';
  monthlyFee: number;
  currency: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: 'mobile' | 'fixed' | 'internet' | 'tv' | 'bundle' | 'addon';
  basePrice: number;
  currency: string;
}

export interface Service {
  id: string;
  accountId: AccountId;
  productId: string;
  status: 'active' | 'suspended' | 'inactive';
  activatedAt: string;
  externalId?: ExternalId;
}

// ---------- Billing ----------
export type InvoiceStatus = 'issued' | 'paid' | 'partial' | 'overdue' | 'disputed';

export interface Invoice {
  id: InvoiceId;
  accountId: AccountId;
  period: string; // e.g. "2026-01"
  issuedAt: string;
  dueAt: string;
  totalAmount: number;
  paidAmount: number;
  currency: string;
  status: InvoiceStatus;
  externalId?: ExternalId;
}

export interface Payment {
  id: string;
  invoiceId: InvoiceId;
  amount: number;
  currency: string;
  method: 'credit_card' | 'bank_transfer' | 'cash' | 'wallet' | 'direct_debit';
  paidAt: string;
}

export interface DebtRecord {
  id: string;
  accountId: AccountId;
  invoiceId?: InvoiceId;
  amount: number;
  currency: string;
  daysPastDue: number;
  stage: 'current' | 'early' | 'mid' | 'late' | 'write_off';
}

// ---------- Case ----------
export type CaseStatus =
  | 'open'
  | 'in_progress'
  | 'waiting_customer'
  | 'waiting_third_party'
  | 'resolved'
  | 'closed'
  | 'cancelled';

export type CasePriority = 'low' | 'normal' | 'high' | 'urgent';

export type CaseCategory =
  | 'billing_claim'
  | 'technical_complaint'
  | 'cancellation_retention'
  | 'payment_promise'
  | 'service_request'
  | 'general_inquiry'
  | 'complaint';

export interface Case {
  id: CaseId;
  customerId: CustomerId;
  accountId?: AccountId;
  externalId?: ExternalId;
  status: CaseStatus;
  priority: CasePriority;
  category: CaseCategory;
  subject: string;
  description: string;
  assigneeId?: UserId;
  queueId?: string;
  slaDueAt?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  closedAt?: string;
}

export interface CaseComment {
  id: string;
  caseId: CaseId;
  authorId: UserId;
  body: string;
  internal: boolean;
  createdAt: string;
}

// ---------- Interaction ----------
export type InteractionChannel = 'voice' | 'email' | 'chat' | 'whatsapp' | 'sms' | 'in_person' | 'social';

export interface Interaction {
  id: InteractionId;
  customerId: CustomerId;
  caseId?: CaseId;
  channel: InteractionChannel;
  direction: 'inbound' | 'outbound';
  reason: string;
  summary: string;
  agentId: UserId;
  startedAt: string;
  endedAt?: string;
  durationSeconds?: number;
  outcome?: string;
}

// ---------- Workflow ----------
export type WorkflowRunStatus = 'pending' | 'active' | 'completed' | 'failed' | 'cancelled';

export interface WorkflowStepDefinition {
  id: string;
  label: string;
  description?: string;
  requiredFields: string[];
  optional?: boolean;
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  category: CaseCategory;
  description: string;
  steps: WorkflowStepDefinition[];
  createdAt: string;
}

export interface WorkflowRunStep {
  stepId: string;
  status: 'pending' | 'active' | 'completed' | 'skipped' | 'failed';
  startedAt?: string;
  completedAt?: string;
  capturedFields: Record<string, unknown>;
}

export interface WorkflowRun {
  id: WorkflowRunId;
  workflowId: string;
  workflowName: string;
  caseId?: CaseId;
  customerId: CustomerId;
  agentId: UserId;
  status: WorkflowRunStatus;
  startedAt: string;
  completedAt?: string;
  steps: WorkflowRunStep[];
}

// ---------- Audit ----------
export type AuditEventType =
  | 'customer.viewed'
  | 'case.created'
  | 'case.updated'
  | 'case.assigned'
  | 'case.escalated'
  | 'workflow.started'
  | 'workflow.step_completed'
  | 'workflow.completed'
  | 'permission.denied'
  | 'external.adapter_call'
  | 'ai.suggestion_generated'
  | 'migration.event'
  | 'auth.login'
  | 'auth.logout';

export interface AuditEvent {
  id: AuditEventId;
  type: AuditEventType;
  actorId: UserId;
  actorRole: string;
  occurredAt: string;
  target?: { kind: string; id: string };
  metadata?: Record<string, unknown>;
  correlationId?: string;
}

// ---------- Users, Roles, Permissions ----------
export interface User {
  id: UserId;
  username: string;
  displayName: string;
  role: Role;
  teamId?: string;
  active: boolean;
}

export type Role =
  | 'operator'
  | 'senior_operator'
  | 'supervisor'
  | 'backoffice'
  | 'retention_agent'
  | 'collections_agent'
  | 'auditor'
  | 'admin';

export interface Team {
  id: string;
  name: string;
  leadId?: UserId;
}

export interface Queue {
  id: string;
  name: string;
  category: CaseCategory[];
  assignmentRule: 'round_robin' | 'skill_based' | 'least_load';
}

// ---------- Knowledge, Offers, Retention, Collection ----------
export interface KnowledgeArticle {
  id: string;
  title: string;
  body: string;
  tags: string[];
  updatedAt: string;
  applicableCategories: CaseCategory[];
}

export interface Offer {
  id: string;
  name: string;
  description: string;
  discountPercent?: number;
  fixedAmount?: number;
  appliesToSegment: CustomerSegment[];
  validUntil: string;
}

export interface RetentionAction {
  id: string;
  customerId: CustomerId;
  offerId?: string;
  reason: string;
  outcome: 'pending' | 'accepted' | 'rejected' | 'expired';
  createdAt: string;
  decidedAt?: string;
  agentId: UserId;
}

export interface CollectionAction {
  id: string;
  customerId: CustomerId;
  stage: DebtRecord['stage'];
  action: 'reminder' | 'promise' | 'negotiation' | 'notice' | 'suspension';
  scheduledAt: string;
  executedAt?: string;
  notes?: string;
}

// ---------- Service Order ----------
export type ServiceOrderType = 'install' | 'repair' | 'suspend' | 'reactivate' | 'terminate' | 'change';
export type ServiceOrderStatus = 'draft' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

export interface ServiceOrder {
  id: string;
  customerId: CustomerId;
  accountId: AccountId;
  serviceId?: string;
  type: ServiceOrderType;
  status: ServiceOrderStatus;
  scheduledAt?: string;
  completedAt?: string;
  externalId?: ExternalId;
  createdAt: string;
}

// ---------- Helpers ----------
export const CASE_STATUS_TRANSITIONS: Record<CaseStatus, CaseStatus[]> = {
  open: ['in_progress', 'cancelled'],
  in_progress: ['waiting_customer', 'waiting_third_party', 'resolved', 'cancelled'],
  waiting_customer: ['in_progress', 'resolved', 'cancelled'],
  waiting_third_party: ['in_progress', 'resolved', 'cancelled'],
  resolved: ['closed', 'in_progress'],
  closed: [],
  cancelled: []
};

export function canTransitionCase(from: CaseStatus, to: CaseStatus): boolean {
  return CASE_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

export function customerDisplayName(c: Pick<Customer, 'displayName' | 'legalName' | 'segment'>): string {
  const base = c.legalName ?? c.displayName;
  return c.segment === 'vip' ? `${base} ★` : base;
}

export function hasRiskFlag(c: Pick<Customer, 'riskFlags'>, flag: RiskFlag): boolean {
  return c.riskFlags.includes(flag);
}

export function isHighRisk(c: Pick<Customer, 'riskFlags'>): boolean {
  return c.riskFlags.some((f) => f === 'churn_risk' || f === 'high_debt' || f === 'fraud_alert');
}

export interface SlaStatus {
  status: 'on_track' | 'at_risk' | 'breached' | 'no_sla';
  hoursRemaining?: number;
  percentElapsed?: number;
}

export function slaStatus(caseEntity: Pick<Case, 'slaDueAt' | 'createdAt' | 'status'>): SlaStatus {
  if (caseEntity.status === 'closed' || caseEntity.status === 'cancelled' || caseEntity.status === 'resolved') {
    return { status: 'no_sla' };
  }
  if (!caseEntity.slaDueAt) return { status: 'no_sla' };
  const now = Date.now();
  const due = new Date(caseEntity.slaDueAt).getTime();
  const created = new Date(caseEntity.createdAt).getTime();
  const total = due - created;
  const elapsed = now - created;
  if (now > due) {
    return { status: 'breached', hoursRemaining: 0, percentElapsed: 100 };
  }
  const hoursRemaining = Math.round((due - now) / (1000 * 60 * 60));
  const percentElapsed = total > 0 ? Math.round((elapsed / total) * 100) : 0;
  if (percentElapsed >= 80) return { status: 'at_risk', hoursRemaining, percentElapsed };
  return { status: 'on_track', hoursRemaining, percentElapsed };
}
