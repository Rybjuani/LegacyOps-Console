import type { FastifyInstance } from 'fastify';
import type { AppState } from '../state.js';
import { paginate } from '@legacyops/shared';
import { withPermission } from '../rbac.js';

export async function registerCustomerRoutes(app: FastifyInstance, state: AppState) {
  app.get('/customers', { preHandler: withPermission('customer:read') }, async (req) => {
    const q = req.query as { q?: string; segment?: string; page?: string; pageSize?: string };
    const page = Number(q.page ?? 1);
    const pageSize = Number(q.pageSize ?? 20);
    let items = state.dataset.customers;
    if (q.q) {
      const term = q.q.toLowerCase();
      items = items.filter(
        (c) =>
          c.displayName.toLowerCase().includes(term) ||
          (c.documentNumber ?? '').includes(term) ||
          (c.email ?? '').toLowerCase().includes(term) ||
          (c.phone ?? '').includes(term)
      );
    }
    if (q.segment) items = items.filter((c) => c.segment === q.segment);
    return paginate(items, page, pageSize);
  });

  app.get('/customers/:id', { preHandler: withPermission('customer:read') }, async (req, reply) => {
    const id = (req.params as { id: string }).id;
    const customer = state.dataset.customers.find((c) => c.id === id);
    if (!customer) {
      return reply.status(404).send({ ok: false, error: { code: 'NOT_FOUND', message: `Customer ${id} not found` } });
    }
    const account = state.dataset.accounts.find((a) => a.id === customer.accountId);
    const contacts = state.dataset.contactMethods.filter((cm) => cm.customerId === customer.id);
    const contracts = state.dataset.contracts.filter((c) => c.accountId === customer.accountId);
    const services = state.dataset.services.filter((s) => s.accountId === customer.accountId);
    const debts = state.dataset.debts.filter((d) => d.accountId === customer.accountId);
    return { customer, account, contactMethods: contacts, contracts, services, debts };
  });

  app.get('/customers/:id/timeline', { preHandler: withPermission('customer:read') }, async (req) => {
    const id = (req.params as { id: string }).id;
    const interactions = state.dataset.interactions.filter((i) => i.customerId === id);
    const cases = state.dataset.cases.filter((c) => c.customerId === id);
    const timeline = [
      ...interactions.map((i) => ({ kind: 'interaction' as const, at: i.startedAt, item: i })),
      ...cases.map((c) => ({ kind: 'case' as const, at: c.createdAt, item: c }))
    ].sort((a, b) => b.at.localeCompare(a.at));
    return { items: timeline };
  });

  app.get('/customers/:id/billing', { preHandler: withPermission('billing:read') }, async (req, reply) => {
    const id = (req.params as { id: string }).id;
    const customer = state.dataset.customers.find((c) => c.id === id);
    if (!customer)
      return reply.status(404).send({ ok: false, error: { code: 'NOT_FOUND', message: 'Customer not found' } });
    const invoices = state.dataset.invoices.filter((i) => i.accountId === customer.accountId);
    const payments = state.dataset.payments.filter((p) => invoices.some((i) => i.id === p.invoiceId));
    const debts = state.dataset.debts.filter((d) => d.accountId === customer.accountId);
    const totalDue = invoices.reduce((s, i) => s + (i.totalAmount - i.paidAmount), 0);
    return {
      invoices,
      payments,
      debts,
      totalDue,
      currency: customer.accountId ? (invoices[0]?.currency ?? 'USD') : 'USD'
    };
  });

  app.get('/customers/:id/cases', { preHandler: withPermission('customer:read') }, async (req) => {
    const id = (req.params as { id: string }).id;
    const cases = state.dataset.cases.filter((c) => c.customerId === id);
    return { items: cases };
  });
}
