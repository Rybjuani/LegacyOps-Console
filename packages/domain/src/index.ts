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
  externalId?: ExternalId; // Populated only when mirrored from a legacy system
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

export type RiskFlag = 'vip' | 'churn_risk' | 'high_debt' | 'recent_escalation' | 'fraud_alert' | 'special_handling';

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
  'open' | 'in_progress' | 'waiting_customer' | 'waiting_third_party' | 'resolved' | 'closed' | 'cancelled';

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
  /**
   * Role required to complete this step. If absent, any role with
   * `workflow:run` permission may complete it.
   */
  requiredRole?: Role;
  /**
   * Conditional next step. If a function is provided, it receives the
   * captured fields of THIS step plus all previously completed steps,
   * and returns the id of the next step to activate. Returning null
   * means "fall through to the next step in declaration order".
   */
  nextStepId?: (
    captured: Record<string, unknown>,
    allCaptured: Record<string, Record<string, unknown>>
  ) => string | null;
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
  | 'case.comment_added'
  | 'workflow.started'
  | 'workflow.step_completed'
  | 'workflow.completed'
  | 'workflow.cancelled'
  | 'interaction.started'
  | 'interaction.closed'
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

// =================================================================
// Extended CRM entities (B1 — deepen CRM core)
// =================================================================

// ---------- Task ----------
export type TaskStatus = 'open' | 'in_progress' | 'done' | 'cancelled';
export type TaskPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface Task {
  id: string;
  caseId?: CaseId;
  customerId?: CustomerId;
  assigneeId?: UserId;
  subject: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueAt?: string;
  createdAt: string;
  completedAt?: string;
}

// ---------- SLA ----------
export interface SlaPolicy {
  id: string;
  name: string;
  category?: CaseCategory;
  priority?: CasePriority;
  responseHours: number;
  resolutionHours: number;
  active: boolean;
}

export interface SlaBreach {
  id: string;
  caseId: CaseId;
  policyId: string;
  breachedAt: string;
  breachType: 'response' | 'resolution';
  minutesLate: number;
}

// ---------- Queue assignment ----------
export interface QueueAssignment {
  id: string;
  queueId: string;
  caseId: CaseId;
  assigneeId?: UserId;
  assignedAt: string;
  reason: 'round_robin' | 'skill_based' | 'least_load' | 'manual';
}

// ---------- Case escalation ----------
export interface CaseEscalation {
  id: string;
  caseId: CaseId;
  fromAssigneeId?: UserId;
  toAssigneeId?: UserId;
  fromQueueId?: string;
  toQueueId?: string;
  reason: string;
  escalatedAt: string;
  escalatedBy: UserId;
}

// ---------- Customer risk & consent ----------
export type CustomerRiskSignalKind =
  'high_debt' | 'churn_intent' | 'recent_escalation' | 'repeated_complaints' | 'vip_signal' | 'fraud_signal';

export interface CustomerRiskSignal {
  id: string;
  customerId: CustomerId;
  kind: CustomerRiskSignalKind;
  score: number; // 0..100
  observedAt: string;
  source: 'legacyops' | 'siebel_like' | 'billing_provider' | 'manual';
  notes?: string;
}

export type ConsentChannel = 'email' | 'phone' | 'sms' | 'whatsapp' | 'push' | 'mail';
export type ConsentStatus = 'granted' | 'denied' | 'pending';

export interface CustomerConsent {
  id: string;
  customerId: CustomerId;
  channel: ConsentChannel;
  status: ConsentStatus;
  recordedAt: string;
  source: 'explicit' | 'inferred' | 'imported';
  notes?: string;
}

// ---------- Interaction note ----------
export interface InteractionNote {
  id: string;
  interactionId: InteractionId;
  authorId: UserId;
  body: string;
  internal: boolean;
  createdAt: string;
}

// ---------- Billing dispute & payment promise ----------
export type BillingDisputeStatus = 'open' | 'under_review' | 'approved' | 'rejected' | 'partial_credit';

export interface BillingDispute {
  id: string;
  invoiceId: InvoiceId;
  customerId: CustomerId;
  reason: string;
  disputedAmount: number;
  creditAmount: number;
  currency: string;
  status: BillingDisputeStatus;
  openedAt: string;
  resolvedAt?: string;
  caseId?: CaseId;
}

export type PaymentPromiseStatus = 'pending' | 'kept' | 'broken' | 'cancelled';

export interface PaymentPromise {
  id: string;
  customerId: CustomerId;
  accountId: AccountId;
  promiseAmount: number;
  currency: string;
  promiseDate: string;
  status: PaymentPromiseStatus;
  createdById: UserId;
  createdAt: string;
  settledAt?: string;
  caseId?: CaseId;
}

// ---------- Retention offer ----------
export type RetentionOfferStatus = 'proposed' | 'accepted' | 'rejected' | 'expired';

export interface RetentionOfferRecord {
  id: string;
  customerId: CustomerId;
  offerId: string;
  offerName: string;
  status: RetentionOfferStatus;
  proposedAt: string;
  decidedAt?: string;
  agentId: UserId;
  reason: string;
}

// ---------- Attachment metadata ----------
export interface AttachmentMetadata {
  id: string;
  ownerId: string;
  ownerKind: 'case' | 'interaction' | 'customer' | 'invoice';
  filename: string;
  contentType: string;
  sizeBytes: number;
  uploadedAt: string;
  uploadedById: UserId;
  storageRef: string; // e.g. "s3://bucket/key" or "memory://id"
}

// ---------- Audit actor ----------
export interface AuditActor {
  id: UserId;
  role: Role;
  displayName?: string;
  teamId?: string;
}

// =================================================================
// Extended helpers (B1)
// =================================================================

export function calculateSlaStatus(
  caseEntity: Pick<Case, 'slaDueAt' | 'createdAt' | 'status'>,
  policy?: SlaPolicy
): SlaStatus {
  // If a policy is provided and the case has no explicit slaDueAt, derive one.
  if (!caseEntity.slaDueAt && policy) {
    const derived = addDaysDerived(caseEntity.createdAt, policy.resolutionHours / 24);
    return slaStatus({ ...caseEntity, slaDueAt: derived });
  }
  return slaStatus(caseEntity);
}

function addDaysDerived(iso: string, days: number): string {
  const d = new Date(iso);
  d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
  return d.toISOString();
}

export function canTransitionCaseStatus(from: CaseStatus, to: CaseStatus): boolean {
  return canTransitionCase(from, to);
}

export interface AssignCaseInput {
  caseEntity: Case;
  queueId?: string;
  assigneeId?: UserId;
  reason: QueueAssignment['reason'];
  actorId: UserId;
}

export interface AssignCaseResult {
  caseEntity: Case;
  assignment: QueueAssignment;
}

export function assignCaseToQueue(input: AssignCaseInput): AssignCaseResult {
  const now = nowIsoDerived();
  const assignment: QueueAssignment = {
    id: `qa_${Math.random().toString(36).slice(2, 10)}`,
    queueId: input.queueId ?? input.caseEntity.queueId ?? 'q_default',
    caseId: input.caseEntity.id,
    assigneeId: input.assigneeId,
    assignedAt: now,
    reason: input.reason
  };
  const caseEntity: Case = {
    ...input.caseEntity,
    queueId: input.queueId ?? input.caseEntity.queueId,
    assigneeId: input.assigneeId ?? input.caseEntity.assigneeId,
    updatedAt: now
  };
  return { caseEntity, assignment };
}

export interface EscalateCaseInput {
  caseEntity: Case;
  toAssigneeId?: UserId;
  toQueueId?: string;
  reason: string;
  escalatedBy: UserId;
}

export interface EscalateCaseResult {
  caseEntity: Case;
  escalation: CaseEscalation;
}

export function escalateCase(input: EscalateCaseInput): EscalateCaseResult {
  const now = nowIsoDerived();
  const escalation: CaseEscalation = {
    id: `esc_${Math.random().toString(36).slice(2, 10)}`,
    caseId: input.caseEntity.id,
    fromAssigneeId: input.caseEntity.assigneeId,
    toAssigneeId: input.toAssigneeId,
    fromQueueId: input.caseEntity.queueId,
    toQueueId: input.toQueueId,
    reason: input.reason,
    escalatedAt: now,
    escalatedBy: input.escalatedBy
  };
  const caseEntity: Case = {
    ...input.caseEntity,
    assigneeId: input.toAssigneeId ?? input.caseEntity.assigneeId,
    queueId: input.toQueueId ?? input.caseEntity.queueId,
    priority: bumpPriority(input.caseEntity.priority),
    updatedAt: now
  };
  return { caseEntity, escalation };
}

function bumpPriority(p: CasePriority): CasePriority {
  if (p === 'low') return 'normal';
  if (p === 'normal') return 'high';
  return 'urgent';
}

export interface CreatePaymentPromiseInput {
  customerId: CustomerId;
  accountId: AccountId;
  promiseAmount: number;
  currency: string;
  promiseDate: string;
  createdById: UserId;
  caseId?: CaseId;
}

export function createPaymentPromise(input: CreatePaymentPromiseInput): PaymentPromise {
  return {
    id: `pp_${Math.random().toString(36).slice(2, 10)}`,
    customerId: input.customerId,
    accountId: input.accountId,
    promiseAmount: input.promiseAmount,
    currency: input.currency,
    promiseDate: input.promiseDate,
    status: 'pending',
    createdById: input.createdById,
    createdAt: nowIsoDerived(),
    caseId: input.caseId
  };
}

export interface CalculateCustomerRiskInput {
  signals: CustomerRiskSignal[];
  debts: DebtRecord[];
  escalations: CaseEscalation[];
}

export interface CustomerRiskResult {
  score: number; // 0..100
  level: 'low' | 'medium' | 'high' | 'critical';
  reasons: string[];
}

export function calculateCustomerRisk(input: CalculateCustomerRiskInput): CustomerRiskResult {
  let score = 0;
  const reasons: string[] = [];
  for (const s of input.signals) {
    if (s.kind === 'high_debt') {
      score += Math.min(30, s.score * 0.3);
      reasons.push(`high_debt signal (score ${s.score})`);
    }
    if (s.kind === 'churn_intent') {
      score += Math.min(35, s.score * 0.35);
      reasons.push(`churn_intent signal (score ${s.score})`);
    }
    if (s.kind === 'fraud_signal') {
      score += Math.min(25, s.score * 0.25);
      reasons.push(`fraud_signal (score ${s.score})`);
    }
    if (s.kind === 'repeated_complaints') {
      score += Math.min(15, s.score * 0.15);
      reasons.push(`repeated_complaints (score ${s.score})`);
    }
  }
  const totalDebt = input.debts.reduce((s, d) => s + d.amount, 0);
  if (totalDebt > 1000) {
    score += 10;
    reasons.push(`outstanding debt ${totalDebt}`);
  }
  if (input.escalations.length >= 2) {
    score += 10;
    reasons.push(`${input.escalations.length} recent escalations`);
  }
  score = Math.min(100, Math.round(score));
  const level: CustomerRiskResult['level'] =
    score >= 80 ? 'critical' : score >= 60 ? 'high' : score >= 30 ? 'medium' : 'low';
  return { score, level, reasons };
}

export interface CustomerOperationalSummary {
  customerId: CustomerId;
  openCases: number;
  openInteractions: number;
  totalDebt: number;
  currency: string;
  lastInteractionAt?: string;
  lastCaseAt?: string;
  riskLevel: CustomerRiskResult['level'];
  riskScore: number;
  isVip: boolean;
  hasChurnIntent: boolean;
  activePaymentPromises: number;
  sourceOfTruth: 'legacyops' | 'siebel_like' | 'hybrid';
}

export function summarizeCustomerOperationalState(input: {
  customer: Customer;
  cases: Case[];
  interactions: Interaction[];
  debts: DebtRecord[];
  signals: CustomerRiskSignal[];
  escalations: CaseEscalation[];
  paymentPromises: PaymentPromise[];
  sourceOfTruth?: 'legacyops' | 'siebel_like' | 'hybrid';
}): CustomerOperationalSummary {
  const risk = calculateCustomerRisk({
    signals: input.signals,
    debts: input.debts,
    escalations: input.escalations
  });
  const openCases = input.cases.filter((c) => c.status === 'open' || c.status === 'in_progress').length;
  const openInteractions = input.interactions.filter((i) => !i.endedAt).length;
  const totalDebt = input.debts.reduce((s, d) => s + d.amount, 0);
  const lastInteraction = input.interactions.slice().sort((a, b) => b.startedAt.localeCompare(a.startedAt))[0];
  const lastCase = input.cases.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  const activePromises = input.paymentPromises.filter((p) => p.status === 'pending').length;
  return {
    customerId: input.customer.id,
    openCases,
    openInteractions,
    totalDebt,
    currency: input.debts[0]?.currency ?? 'USD',
    lastInteractionAt: lastInteraction?.startedAt,
    lastCaseAt: lastCase?.createdAt,
    riskLevel: risk.level,
    riskScore: risk.score,
    isVip: input.customer.riskFlags.includes('vip'),
    hasChurnIntent: input.signals.some((s) => s.kind === 'churn_intent'),
    activePaymentPromises: activePromises,
    sourceOfTruth: input.sourceOfTruth ?? (input.customer.externalId ? 'hybrid' : 'legacyops')
  };
}

function nowIsoDerived(): string {
  return new Date().toISOString();
}
