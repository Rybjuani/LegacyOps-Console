/**
 * @legacyops/demo-data — Synthetic CRM + Fake Siebel dataset.
 *
 * All data here is fictional. No real customer data is used. The dataset is
 * generated deterministically at first call and cached in memory; subsequent
 * imports get the same instance.
 */

import type {
  Account,
  AuditEvent,
  Case,
  ContactMethod,
  Contract,
  Customer,
  DebtRecord,
  Interaction,
  Invoice,
  KnowledgeArticle,
  Offer,
  Payment,
  Product,
  Queue,
  Service,
  ServiceOrder,
  Team,
  User,
  WorkflowDefinition,
  WorkflowRun
} from '@legacyops/domain';
import type { ExternalId } from '@legacyops/shared';
import { addDays, id, nowIso } from '@legacyops/shared';
import { listDemoWorkflows } from '@legacyops/workflows';
import type { FakeSiebelDataset } from '@legacyops/siebel-bridge';
import { IdMappingStore, SourceOfTruthRegistry } from '@legacyops/migration';
import type { EntityMapping, MigrationPlan, ModuleMigrationStatus, SourceSystem } from '@legacyops/migration';

// ---------- Helpers ----------
function seeded(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

const rand = seeded(42);
function pick<T>(arr: T[]): T {
  return arr[Math.floor(rand() * arr.length)]!;
}
function int(min: number, max: number): number {
  return Math.floor(min + rand() * (max - min + 1));
}

// ---------- Users, teams, queues ----------
const users: User[] = [
  {
    id: 'usr_operator1' as User['id'],
    username: 'mreyes',
    displayName: 'María Reyes',
    role: 'operator',
    teamId: 'team_voice',
    active: true
  },
  {
    id: 'usr_operator2' as User['id'],
    username: 'jlopez',
    displayName: 'Joaquín López',
    role: 'senior_operator',
    teamId: 'team_voice',
    active: true
  },
  {
    id: 'usr_supervisor' as User['id'],
    username: 'nsuarez',
    displayName: 'Nora Suárez',
    role: 'supervisor',
    teamId: 'team_voice',
    active: true
  },
  {
    id: 'usr_backoffice' as User['id'],
    username: 'pcastro',
    displayName: 'Pedro Castro',
    role: 'backoffice',
    teamId: 'team_back',
    active: true
  },
  {
    id: 'usr_retention' as User['id'],
    username: 'lromero',
    displayName: 'Lucía Romero',
    role: 'retention_agent',
    teamId: 'team_ret',
    active: true
  },
  {
    id: 'usr_collections' as User['id'],
    username: 'fgomez',
    displayName: 'Federico Gómez',
    role: 'collections_agent',
    teamId: 'team_col',
    active: true
  },
  {
    id: 'usr_auditor' as User['id'],
    username: 'amendez',
    displayName: 'Andrea Méndez',
    role: 'auditor',
    teamId: 'team_audit',
    active: true
  },
  {
    id: 'usr_admin' as User['id'],
    username: 'admin',
    displayName: 'Admin Root',
    role: 'admin',
    teamId: 'team_audit',
    active: true
  }
];

const teams: Team[] = [
  { id: 'team_voice', name: 'Voice Operations', leadId: 'usr_supervisor' as User['id'] },
  { id: 'team_back', name: 'Back Office', leadId: 'usr_backoffice' as User['id'] },
  { id: 'team_ret', name: 'Retention', leadId: 'usr_retention' as User['id'] },
  { id: 'team_col', name: 'Collections', leadId: 'usr_collections' as User['id'] },
  { id: 'team_audit', name: 'Audit', leadId: 'usr_auditor' as User['id'] }
];

const queues: Queue[] = [
  {
    id: 'q_voice_general',
    name: 'Voice - General',
    category: ['general_inquiry', 'complaint'],
    assignmentRule: 'round_robin'
  },
  { id: 'q_billing', name: 'Billing Claims', category: ['billing_claim'], assignmentRule: 'least_load' },
  { id: 'q_technical', name: 'Technical Support', category: ['technical_complaint'], assignmentRule: 'skill_based' },
  { id: 'q_retention', name: 'Retention', category: ['cancellation_retention'], assignmentRule: 'skill_based' },
  { id: 'q_collections', name: 'Collections', category: ['payment_promise'], assignmentRule: 'round_robin' }
];

// ---------- Products & contracts ----------
const products: Product[] = [
  {
    id: 'prod_mobile_postpaid',
    sku: 'MOB-POST-50',
    name: 'Mobile Postpaid 50GB',
    category: 'mobile',
    basePrice: 50,
    currency: 'USD'
  },
  { id: 'prod_fiber_500', sku: 'FIB-500', name: 'Fiber 500Mb', category: 'internet', basePrice: 65, currency: 'USD' },
  { id: 'prod_tv_basic', sku: 'TV-BAS', name: 'TV Basic 120ch', category: 'tv', basePrice: 35, currency: 'USD' },
  {
    id: 'prod_bundle_triple',
    sku: 'BND-TRI',
    name: 'Triple Play Bundle',
    category: 'bundle',
    basePrice: 120,
    currency: 'USD'
  },
  {
    id: 'prod_addon_roaming',
    sku: 'ADD-ROAM',
    name: 'Roaming Addon',
    category: 'addon',
    basePrice: 10,
    currency: 'USD'
  }
];

// ---------- Customers (residential + business + vip) ----------
function makeResidential(i: number): {
  customer: Customer;
  account: Account;
  contactMethods: ContactMethod[];
  contracts: Contract[];
  services: Service[];
} {
  const firstNames = ['Lucía', 'Mateo', 'Sofía', 'Tomás', 'Valentina', 'Bruno', 'Catalina', 'Joel', 'Renata', 'Iván'];
  const lastNames = ['Pérez', 'García', 'Fernández', 'López', 'Martínez', 'Sosa', 'Romero', 'Díaz', 'Acosta', 'Vega'];
  const fn = pick(firstNames);
  const ln = pick(lastNames);
  const doc = `10${int(100000, 999999)}`;
  const phone = `+1 555 ${int(100, 999)} ${int(1000, 9999)}`;
  const email = `${fn.toLowerCase()}.${ln.toLowerCase()}${i}@example.com`;
  const customerId = `cust_res_${i}` as Customer['id'];
  const accountId = `acc_res_${i}` as Account['id'];
  const createdAt = addDays(nowIso(), -int(60, 1500));
  const customer: Customer = {
    id: customerId,
    externalId: `ext_cust_${i}` as ExternalId,
    segment: 'residential',
    displayName: `${fn} ${ln}`,
    documentNumber: doc,
    email,
    phone,
    accountId,
    riskFlags: i % 7 === 0 ? ['high_debt'] : i % 11 === 0 ? ['churn_risk'] : [],
    createdAt,
    updatedAt: createdAt
  };
  const account: Account = {
    id: accountId,
    customerId,
    externalId: `ext_acc_${i}` as ExternalId,
    status: i % 23 === 0 ? 'in_collection' : i % 17 === 0 ? 'suspended' : 'active',
    segment: 'residential',
    currency: 'USD',
    openedAt: createdAt
  };
  const contactMethods: ContactMethod[] = [
    { id: id('cm'), customerId, type: 'email', value: email, verified: true, primary: true },
    { id: id('cm'), customerId, type: 'phone', value: phone, verified: i % 2 === 0, primary: false }
  ];
  const product = pick(products);
  const contracts: Contract[] = [
    {
      id: id('ctr'),
      accountId,
      productId: product.id,
      startDate: createdAt,
      status: 'active',
      monthlyFee: product.basePrice,
      currency: product.currency
    }
  ];
  const services: Service[] = [
    {
      id: id('svc'),
      accountId,
      productId: product.id,
      status: account.status === 'suspended' ? 'suspended' : 'active',
      activatedAt: createdAt,
      externalId: `ext_svc_${i}` as ExternalId
    }
  ];
  return { customer, account, contactMethods, contracts, services };
}

function makeBusiness(i: number): {
  customer: Customer;
  account: Account;
  contactMethods: ContactMethod[];
  contracts: Contract[];
  services: Service[];
} {
  const companyName = pick([
    'Acme SA',
    'Globex LLC',
    'Initech',
    'Umbrella Co',
    'Wayne Industries',
    'Stark Holdings',
    'Cyberdyne',
    'Soylent BV'
  ]);
  const customerId = `cust_biz_${i}` as Customer['id'];
  const accountId = `acc_biz_${i}` as Account['id'];
  const createdAt = addDays(nowIso(), -int(300, 2500));
  const customer: Customer = {
    id: customerId,
    externalId: `ext_bizcust_${i}` as ExternalId,
    segment: 'business',
    displayName: companyName,
    legalName: `${companyName} Inc.`,
    documentNumber: `30${int(1000000, 9999999)}`,
    email: `contact@${companyName.toLowerCase().replace(/[^a-z]/g, '')}.com`,
    phone: `+1 555 ${int(100, 999)} ${int(1000, 9999)}`,
    accountId,
    riskFlags: i % 5 === 0 ? ['vip'] : [],
    createdAt,
    updatedAt: createdAt
  };
  const account: Account = {
    id: accountId,
    customerId,
    externalId: `ext_bizacc_${i}` as ExternalId,
    status: 'active',
    segment: 'business',
    creditLimit: 50000,
    currency: 'USD',
    openedAt: createdAt
  };
  const contactMethods: ContactMethod[] = [
    { id: id('cm'), customerId, type: 'email', value: customer.email!, verified: true, primary: true }
  ];
  const contracts: Contract[] = [];
  const services: Service[] = [];
  for (const p of products.slice(0, 3)) {
    contracts.push({
      id: id('ctr'),
      accountId,
      productId: p.id,
      startDate: createdAt,
      status: 'active',
      monthlyFee: p.basePrice * int(3, 12),
      currency: p.currency
    });
    services.push({
      id: id('svc'),
      accountId,
      productId: p.id,
      status: 'active',
      activatedAt: createdAt
    });
  }
  return { customer, account, contactMethods, contracts, services };
}

// ---------- Build full dataset ----------
export interface LegacyOpsDataset {
  users: User[];
  teams: Team[];
  queues: Queue[];
  products: Product[];
  customers: Customer[];
  accounts: Account[];
  contactMethods: ContactMethod[];
  contracts: Contract[];
  services: Service[];
  invoices: Invoice[];
  payments: Payment[];
  debts: DebtRecord[];
  cases: Case[];
  interactions: Interaction[];
  serviceOrders: ServiceOrder[];
  knowledgeArticles: KnowledgeArticle[];
  offers: Offer[];
  auditEvents: AuditEvent[];
  workflowRuns: WorkflowRun[];
  workflows: WorkflowDefinition[];
  fakeSiebel: FakeSiebelDataset;
}

let cache: LegacyOpsDataset | undefined;

export function buildDataset(): LegacyOpsDataset {
  if (cache) return cache;

  const customers: Customer[] = [];
  const accounts: Account[] = [];
  const contactMethods: ContactMethod[] = [];
  const contracts: Contract[] = [];
  const services: Service[] = [];

  for (let i = 1; i <= 24; i++) {
    const r = makeResidential(i);
    customers.push(r.customer);
    accounts.push(r.account);
    contactMethods.push(...r.contactMethods);
    contracts.push(...r.contracts);
    services.push(...r.services);
  }
  for (let i = 1; i <= 8; i++) {
    const b = makeBusiness(i);
    customers.push(b.customer);
    accounts.push(b.account);
    contactMethods.push(...b.contactMethods);
    contracts.push(...b.contracts);
    services.push(...b.services);
  }

  // Mark one VIP explicitly
  const vip = customers[3]!;
  vip.segment = 'vip';
  vip.riskFlags = ['vip', 'churn_risk'];

  // ---------- Invoices / payments / debts ----------
  const invoices: Invoice[] = [];
  const payments: Payment[] = [];
  const debts: DebtRecord[] = [];

  for (const acc of accounts) {
    for (let m = 0; m < 6; m++) {
      const issuedAt = addDays(nowIso(), -30 * m - 5);
      const dueAt = addDays(issuedAt, 15);
      const totalAmount = int(40, 300);
      const status: Invoice['status'] =
        m === 0 ? 'issued' : pick(['paid', 'paid', 'paid', 'partial', 'overdue', 'disputed']);
      const paidAmount =
        status === 'paid'
          ? totalAmount
          : status === 'partial'
            ? Math.floor(totalAmount / 2)
            : status === 'disputed'
              ? 0
              : status === 'overdue'
                ? Math.floor(totalAmount * 0.3)
                : totalAmount;
      const invId = `inv_${acc.id}_${m}` as Invoice['id'];
      invoices.push({
        id: invId,
        accountId: acc.id,
        period: issuedAt.slice(0, 7),
        issuedAt,
        dueAt,
        totalAmount,
        paidAmount,
        currency: acc.currency,
        status,
        externalId: `ext_${invId}` as ExternalId
      });
      if (paidAmount > 0) {
        payments.push({
          id: id('pay'),
          invoiceId: invId,
          amount: paidAmount,
          currency: acc.currency,
          method: pick(['credit_card', 'bank_transfer', 'direct_debit']),
          paidAt: addDays(issuedAt, int(1, 14))
        });
      }
      if (status === 'overdue') {
        debts.push({
          id: id('debt'),
          accountId: acc.id,
          invoiceId: invId,
          amount: totalAmount - paidAmount,
          currency: acc.currency,
          daysPastDue: int(10, 60),
          stage: pick(['early', 'mid', 'late'])
        });
      }
    }
  }

  // ---------- Cases & interactions ----------
  const cases: Case[] = [];
  const interactions: Interaction[] = [];
  const categories: Case['category'][] = [
    'billing_claim',
    'technical_complaint',
    'cancellation_retention',
    'payment_promise',
    'general_inquiry',
    'complaint'
  ];
  const channels: Interaction['channel'][] = ['voice', 'email', 'chat', 'whatsapp'];

  for (let i = 1; i <= 40; i++) {
    const cust = pick(customers);
    const acc = accounts.find((a) => a.id === cust.accountId);
    const cat = pick(categories);
    const createdAt = addDays(nowIso(), -int(0, 60));
    const slaDueAt = addDays(createdAt, int(1, 5));
    const status: Case['status'] = pick(['open', 'in_progress', 'waiting_customer', 'resolved', 'closed']);
    const c: Case = {
      id: `case_${i}` as Case['id'],
      customerId: cust.id,
      accountId: acc?.id,
      externalId: `ext_case_${i}` as ExternalId,
      status,
      priority: pick(['low', 'normal', 'high', 'urgent']),
      category: cat,
      subject: `Case ${i} — ${cat.replace(/_/g, ' ')}`,
      description: `Customer reported an issue related to ${cat.replace(/_/g, ' ')}. Synthetic description for case #${i}.`,
      assigneeId: pick(users).id,
      queueId: pick(queues).id,
      slaDueAt,
      createdAt,
      updatedAt: addDays(createdAt, int(0, 3)),
      resolvedAt: status === 'resolved' || status === 'closed' ? addDays(createdAt, int(1, 5)) : undefined,
      closedAt: status === 'closed' ? addDays(createdAt, int(2, 6)) : undefined
    };
    cases.push(c);

    interactions.push({
      id: `int_${i}` as Interaction['id'],
      customerId: cust.id,
      caseId: c.id,
      channel: pick(channels),
      direction: 'inbound',
      reason: cat,
      summary: `Interaction ${i} — operator handled a ${cat.replace(/_/g, ' ')} request.`,
      agentId: pick(users).id,
      startedAt: addDays(createdAt, -int(0, 2)),
      endedAt: addDays(createdAt, int(0, 1)),
      durationSeconds: int(60, 900)
    });
  }

  // ---------- Service orders ----------
  const serviceOrders: ServiceOrder[] = [];
  for (let i = 1; i <= 12; i++) {
    const cust = pick(customers);
    const acc = accounts.find((a) => a.id === cust.accountId);
    if (!acc) continue;
    serviceOrders.push({
      id: `so_${i}`,
      customerId: cust.id,
      accountId: acc.id,
      type: pick(['install', 'repair', 'change', 'suspend', 'reactivate']),
      status: pick(['scheduled', 'in_progress', 'completed']),
      scheduledAt: addDays(nowIso(), int(0, 30)),
      completedAt: Math.random() > 0.5 ? addDays(nowIso(), -int(0, 10)) : undefined,
      externalId: `ext_so_${i}` as ExternalId,
      createdAt: addDays(nowIso(), -int(10, 40))
    });
  }

  // ---------- Knowledge articles & offers ----------
  const knowledgeArticles: KnowledgeArticle[] = [
    {
      id: 'ka_1',
      title: 'Handling billing disputes under $50',
      body: 'For low-value billing disputes, apply the quick-credit workflow. Validate the invoice, confirm the customer claim, and issue a credit note. Always log the decision in the audit trail.',
      tags: ['billing', 'dispute', 'credit'],
      updatedAt: addDays(nowIso(), -10),
      applicableCategories: ['billing_claim']
    },
    {
      id: 'ka_2',
      title: 'Cancellation retention script',
      body: 'When a customer requests cancellation, ask for the reason, validate intent strength, check eligibility, and present the best retention offer before finalizing.',
      tags: ['retention', 'cancellation'],
      updatedAt: addDays(nowIso(), -5),
      applicableCategories: ['cancellation_retention']
    },
    {
      id: 'ka_3',
      title: 'Technical complaint triage matrix',
      body: 'Reproduce → diagnose → resolve or dispatch. For fiber issues, request ONT status. For mobile, request signal info.',
      tags: ['technical', 'triage'],
      updatedAt: addDays(nowIso(), -15),
      applicableCategories: ['technical_complaint']
    }
  ];

  const offers: Offer[] = [
    {
      id: 'off_1',
      name: 'Stay 20% off',
      description: '20% discount for 3 months',
      discountPercent: 20,
      appliesToSegment: ['residential', 'business'],
      validUntil: addDays(nowIso(), 60)
    },
    {
      id: 'off_2',
      name: 'Free month',
      description: 'One month free on the current plan',
      fixedAmount: 50,
      appliesToSegment: ['residential'],
      validUntil: addDays(nowIso(), 30)
    },
    {
      id: 'off_3',
      name: 'VIP upgrade',
      description: 'Upgrade to VIP tier with priority routing',
      appliesToSegment: ['residential', 'business'],
      validUntil: addDays(nowIso(), 90)
    }
  ];

  // ---------- Fake Siebel dataset (mirror of part of the CRM data) ----------
  const fakeSiebel: FakeSiebelDataset = {
    accounts: accounts.slice(0, 10).map((a, i) => ({
      id: (a.externalId ?? `ext_acc_${i}`) as ExternalId,
      name: customers.find((c) => c.accountId === a.id)?.displayName ?? `Account ${i}`,
      bu: pick(['BU_NORTH', 'BU_SOUTH', 'BU_WEST']),
      status: a.status === 'active' ? 'Active' : a.status === 'suspended' ? 'Suspended' : 'Inactive',
      currency: a.currency,
      segment: a.segment
    })),
    contacts: customers.slice(0, 10).map((c, i) => ({
      id: (c.externalId ?? `ext_cust_${i}`) as ExternalId,
      accountId: (accounts.find((a) => a.id === c.accountId)?.externalId ?? `ext_acc_${i}`) as ExternalId,
      firstName: c.displayName.split(' ')[0] ?? 'First',
      lastName: c.displayName.split(' ').slice(1).join(' ') ?? 'Last',
      email: c.email,
      phone: c.phone,
      documentNumber: c.documentNumber
    })),
    serviceRequests: cases.slice(0, 10).map((c, i) => ({
      id: (c.externalId ?? `ext_case_${i}`) as ExternalId,
      accountId: (accounts.find((a) => a.id === c.accountId)?.externalId ?? '') as ExternalId,
      contactId: (customers.find((cu) => cu.id === c.customerId)?.externalId ?? '') as ExternalId,
      status:
        c.status === 'open'
          ? 'Open'
          : c.status === 'closed'
            ? 'Closed'
            : c.status === 'resolved'
              ? 'Closed'
              : 'In Progress',
      priority:
        c.priority === 'urgent' || c.priority === 'high' ? '1-High' : c.priority === 'normal' ? '2-Medium' : '3-Low',
      category: c.category,
      subject: c.subject,
      description: c.description,
      owner: c.assigneeId,
      created: c.createdAt,
      updated: c.updatedAt,
      srNumber: `1-${1000000 + i}`
    })),
    assets: services.slice(0, 10).map((s, i) => ({
      id: (s.externalId ?? `ext_svc_${i}`) as ExternalId,
      accountId: (accounts.find((a) => a.id === s.accountId)?.externalId ?? '') as ExternalId,
      productName: products.find((p) => p.id === s.productId)?.name ?? 'Asset',
      status: s.status === 'active' ? 'Active' : 'Inactive',
      startDate: s.activatedAt
    })),
    activities: interactions.slice(0, 10).map((it, i) => ({
      id: `ext_act_${i}` as ExternalId,
      accountId: (accounts.find((a) => a.id === customers.find((c) => c.id === it.customerId)?.accountId)?.externalId ??
        '') as ExternalId,
      contactId: (customers.find((c) => c.id === it.customerId)?.externalId ?? '') as ExternalId,
      srId: it.caseId ? (`ext_case_${i}` as ExternalId) : undefined,
      type: it.channel === 'voice' ? 'Call' : it.channel === 'email' ? 'Email' : 'Task',
      status: 'Done',
      description: it.summary,
      planned: it.startedAt,
      actual: it.endedAt,
      owner: it.agentId
    })),
    orders: serviceOrders.slice(0, 8).map((o, i) => ({
      id: (o.externalId ?? `ext_so_${i}`) as ExternalId,
      accountId: (accounts.find((a) => a.id === o.accountId)?.externalId ?? '') as ExternalId,
      orderNumber: `ORD-${1000 + i}`,
      type:
        o.type === 'install' ? 'New' : o.type === 'change' ? 'Change' : o.type === 'suspend' ? 'Suspend' : 'Disconnect',
      status: o.status === 'completed' ? 'Completed' : o.status === 'cancelled' ? 'Cancelled' : 'In Progress',
      total: int(50, 500),
      currency: 'USD',
      created: o.createdAt
    })),
    invoices: invoices.slice(0, 12).map((inv) => ({
      id: (inv.externalId ?? inv.id) as ExternalId,
      accountId: (accounts.find((a) => a.id === inv.accountId)?.externalId ?? '') as ExternalId,
      period: inv.period,
      totalAmount: inv.totalAmount,
      paidAmount: inv.paidAmount,
      currency: inv.currency,
      status: inv.status.charAt(0).toUpperCase() + inv.status.slice(1),
      issuedAt: inv.issuedAt,
      dueAt: inv.dueAt
    }))
  };

  cache = {
    users,
    teams,
    queues,
    products,
    customers,
    accounts,
    contactMethods,
    contracts,
    services,
    invoices,
    payments,
    debts,
    cases,
    interactions,
    serviceOrders,
    knowledgeArticles,
    offers,
    auditEvents: [],
    workflowRuns: [],
    workflows: listDemoWorkflows(),
    fakeSiebel
  };

  return cache;
}

// ---------- Migration scaffolding (demo) ----------
export function buildDemoMigrationArtifacts(): {
  sourceSystems: SourceSystem[];
  registry: SourceOfTruthRegistry;
  idStore: IdMappingStore;
  plan: MigrationPlan;
  moduleStatuses: ModuleMigrationStatus[];
  entityMapping: EntityMapping;
} {
  const registry = new SourceOfTruthRegistry();
  registry.register({
    module: 'customer.identity',
    rule: { kind: 'primary', system: 'siebel_like' },
    since: '2026-01-01',
    notes: 'Identity still owned by legacy CRM'
  });
  registry.register({
    module: 'case.billing_claim',
    rule: { kind: 'fallback', primary: 'legacyops', secondary: 'siebel_like' },
    since: '2026-02-01'
  });
  registry.register({
    module: 'billing.invoice',
    rule: { kind: 'primary', system: 'billing_provider' },
    since: '2026-01-01'
  });
  registry.register({
    module: 'interaction.history',
    rule: { kind: 'merge', systems: ['legacyops', 'siebel_like'], mergeBy: 'occurredAt' },
    since: '2026-03-01'
  });

  const idStore = new IdMappingStore();
  const ds = buildDataset();
  let count = 0;
  for (const c of ds.customers) {
    if (c.externalId) {
      idStore.register(c.id, c.externalId, 'siebel_like', 'Customer');
      count++;
      if (count >= 10) break;
    }
  }

  const entityMapping: EntityMapping = {
    id: 'em_case',
    sourceSystem: 'siebel_like',
    sourceEntity: 'Service Request',
    targetEntity: 'Case',
    defaultCategory: 'general_inquiry',
    fields: [
      { sourceSystem: 'siebel_like', sourceField: 'Id', targetField: 'externalId' },
      { sourceSystem: 'siebel_like', sourceField: 'AccountId', targetField: 'accountId' },
      { sourceSystem: 'siebel_like', sourceField: 'Subject', targetField: 'subject' },
      { sourceSystem: 'siebel_like', sourceField: 'Description', targetField: 'description' },
      { sourceSystem: 'siebel_like', sourceField: 'Status', targetField: 'status' },
      { sourceSystem: 'siebel_like', sourceField: 'Priority', targetField: 'priority' },
      { sourceSystem: 'siebel_like', sourceField: 'Created', targetField: 'createdAt' }
    ]
  };

  const plan: MigrationPlan = {
    id: 'plan_case_mig_v1',
    name: 'Case Module Migration v1',
    description:
      'Migrate Service Request records from the Siebel-like legacy CRM into LegacyOps Case module with dual-write strategy.',
    sourceSystem: 'siebel_like',
    entityMappings: [entityMapping],
    strategy: 'dual_write',
    rollbackEnabled: true,
    createdAt: '2026-01-15T00:00:00.000Z'
  };

  const moduleStatuses: ModuleMigrationStatus[] = [
    {
      module: 'customer.identity',
      status: 'shadow',
      ownerSystem: 'siebel_like',
      lastUpdated: '2026-02-01',
      notes: 'Read-only mirror.'
    },
    { module: 'case.billing_claim', status: 'dual_write', ownerSystem: 'legacyops', lastUpdated: '2026-02-15' },
    {
      module: 'billing.invoice',
      status: 'read_only_overlay',
      ownerSystem: 'billing_provider',
      lastUpdated: '2026-02-20'
    },
    { module: 'interaction.history', status: 'cut_over', ownerSystem: 'legacyops', lastUpdated: '2026-03-01' }
  ] as ModuleMigrationStatus[];

  const sourceSystems: SourceSystem[] = [
    { id: 'legacyops', displayName: 'LegacyOps Console', kind: 'primary', description: 'The new CRM core.' },
    {
      id: 'siebel_like',
      displayName: 'Siebel-like legacy CRM',
      kind: 'secondary',
      description: 'Conceptual legacy CRM used in the Fake Siebel Lab.'
    },
    {
      id: 'billing_provider',
      displayName: 'External Billing Provider',
      kind: 'secondary',
      description: 'External system of truth for invoices.'
    },
    {
      id: 'external_crm',
      displayName: 'External CRM (generic)',
      kind: 'archive',
      description: 'Archive of historical CRM data.'
    }
  ];

  return { sourceSystems, registry, idStore, plan, moduleStatuses, entityMapping };
}

// ---------- ROI demo numbers ----------
export const ROI_DEMO = {
  before: {
    avgHandleTimeSec: 480,
    screensPerInteraction: 9,
    clicksPerInteraction: 22,
    firstContactResolution: 0.62,
    escalationRate: 0.18,
    trainingWeeks: 6,
    auditTimeMinutes: 240
  },
  after: {
    avgHandleTimeSec: 320,
    screensPerInteraction: 4,
    clicksPerInteraction: 9,
    firstContactResolution: 0.78,
    escalationRate: 0.1,
    trainingWeeks: 3,
    auditTimeMinutes: 90
  },
  teamSize: 250,
  costPerHourUsd: 18,
  auditTeamSize: 4,
  auditCostPerHourUsd: 32
};

export function computeRoi() {
  const before = ROI_DEMO.before;
  const after = ROI_DEMO.after;
  const ahtDeltaSec = before.avgHandleTimeSec - after.avgHandleTimeSec;
  const interactionsPerDayPerAgent = 60; // synthetic
  const hoursSavedPerAgentPerDay = (ahtDeltaSec * interactionsPerDayPerAgent) / 3600;
  const hoursSavedPerDay = hoursSavedPerAgentPerDay * ROI_DEMO.teamSize;
  const dailySavingsUsd = hoursSavedPerDay * ROI_DEMO.costPerHourUsd;
  const monthlySavingsUsd = dailySavingsUsd * 22;

  const auditHoursBefore = before.auditTimeMinutes / 60;
  const auditHoursAfter = after.auditTimeMinutes / 60;
  const auditSavingsPerSession =
    (auditHoursBefore - auditHoursAfter) * ROI_DEMO.auditTeamSize * ROI_DEMO.auditCostPerHourUsd;

  const fcrUplift = after.firstContactResolution - before.firstContactResolution;
  const escDrop = before.escalationRate - after.escalationRate;

  return {
    ahtDeltaSec,
    ahtDeltaPct: Math.round((ahtDeltaSec / before.avgHandleTimeSec) * 100),
    screensDelta: before.screensPerInteraction - after.screensPerInteraction,
    clicksDelta: before.clicksPerInteraction - after.clicksPerInteraction,
    fcrUpliftPct: Math.round(fcrUplift * 100),
    escalationDropPct: Math.round(escDrop * 100),
    trainingWeeksSaved: before.trainingWeeks - after.trainingWeeks,
    hoursSavedPerDay,
    monthlySavingsUsd,
    auditSavingsPerSessionUsd: Math.round(auditSavingsPerSession)
  };
}
