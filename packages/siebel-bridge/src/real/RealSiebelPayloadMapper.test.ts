import { describe, it, expect } from 'vitest';
import {
  mapRestAccount,
  mapRestActivity,
  mapRestAsset,
  mapRestBusinessObject,
  mapRestBusinessService,
  mapRestContact,
  mapRestIntegrationObject,
  mapRestInvoice,
  mapRestOrder,
  mapRestServiceRequest,
  unwrapList,
  PayloadMappingError
} from './RealSiebelPayloadMapper.js';

describe('RealSiebelPayloadMapper', () => {
  describe('mapRestAccount', () => {
    it('maps a complete payload', () => {
      const a = mapRestAccount({
        Id: 'ext_acc_1',
        Name: 'Acme',
        BU: 'BU_N',
        Status: 'Active',
        Currency: 'USD',
        Segment: 'business'
      });
      expect(a.id).toBe('ext_acc_1');
      expect(a.name).toBe('Acme');
      expect(a.status).toBe('Active');
      expect(a.currency).toBe('USD');
      expect(a.segment).toBe('business');
    });

    it('maps with field aliases and defaults', () => {
      const a = mapRestAccount({ id: 'x', 'Account Name': 'Globex' });
      expect(a.id).toBe('x');
      expect(a.name).toBe('Globex');
      expect(a.bu).toBe('DEFAULT');
      expect(a.status).toBe('Active');
      expect(a.currency).toBe('USD');
    });

    it('throws when Id is missing', () => {
      expect(() => mapRestAccount({ Name: 'NoId' })).toThrow(PayloadMappingError);
    });

    it('throws on non-object input', () => {
      expect(() => mapRestAccount(null)).toThrow(PayloadMappingError);
      expect(() => mapRestAccount('string')).toThrow(PayloadMappingError);
    });
  });

  describe('mapRestContact', () => {
    it('maps a complete contact', () => {
      const c = mapRestContact({
        Id: 'ext_c1',
        AccountId: 'ext_acc_1',
        FirstName: 'Ana',
        LastName: 'Paz',
        Email: 'a@b.com',
        Phone: '1',
        DocumentNumber: '1001'
      });
      expect(c.id).toBe('ext_c1');
      expect(c.firstName).toBe('Ana');
      expect(c.lastName).toBe('Paz');
      expect(c.email).toBe('a@b.com');
    });

    it('maps with aliases', () => {
      const c = mapRestContact({ id: 'x', 'First Name': 'Ben', 'Last Name': 'Rae' });
      expect(c.firstName).toBe('Ben');
      expect(c.lastName).toBe('Rae');
      expect(c.accountId).toBe('');
    });

    it('throws when Id is missing', () => {
      expect(() => mapRestContact({ FirstName: 'NoId' })).toThrow(PayloadMappingError);
    });
  });

  describe('mapRestServiceRequest', () => {
    it('maps a complete SR', () => {
      const sr = mapRestServiceRequest({
        Id: 'ext_sr_1',
        AccountId: 'ext_acc_1',
        ContactId: 'ext_c1',
        Status: 'In Progress',
        Priority: '1-High',
        Subject: 'Bad invoice',
        Description: 'desc',
        Created: '2026-01-01',
        Updated: '2026-01-02',
        SRNumber: '1-12345'
      });
      expect(sr.id).toBe('ext_sr_1');
      expect(sr.status).toBe('In Progress');
      expect(sr.priority).toBe('1-High');
      expect(sr.srNumber).toBe('1-12345');
    });

    it('maps with aliases and defaults', () => {
      const sr = mapRestServiceRequest({ id: 'x', Title: 't' });
      expect(sr.subject).toBe('t');
      expect(sr.status).toBe('Open');
      expect(sr.priority).toBe('2-Medium');
      expect(sr.srNumber).toBe('x');
    });

    it('throws when Id is missing', () => {
      expect(() => mapRestServiceRequest({ Subject: 'noId' })).toThrow(PayloadMappingError);
    });
  });

  describe('mapRestAsset', () => {
    it('maps a complete asset', () => {
      const a = mapRestAsset({
        Id: 'a1',
        AccountId: 'acc1',
        ProductName: 'Fiber',
        Status: 'Active',
        StartDate: '2025-01-01'
      });
      expect(a.id).toBe('a1');
      expect(a.productName).toBe('Fiber');
      expect(a.status).toBe('Active');
    });

    it('throws when Id is missing', () => {
      expect(() => mapRestAsset({ ProductName: 'noId' })).toThrow(PayloadMappingError);
    });
  });

  describe('mapRestActivity', () => {
    it('maps a complete activity', () => {
      const a = mapRestActivity({
        Id: 'act1',
        AccountId: 'acc1',
        Type: 'Call',
        Status: 'Done',
        Description: 'call',
        Planned: '2026-01-01'
      });
      expect(a.id).toBe('act1');
      expect(a.type).toBe('Call');
      expect(a.status).toBe('Done');
    });

    it('throws when Id is missing', () => {
      expect(() => mapRestActivity({ Type: 'Call' })).toThrow(PayloadMappingError);
    });
  });

  describe('mapRestOrder', () => {
    it('maps a complete order', () => {
      const o = mapRestOrder({
        Id: 'ord1',
        AccountId: 'acc1',
        OrderNumber: 'ORD-1',
        Type: 'New',
        Status: 'Completed',
        Total: 100,
        Currency: 'USD',
        Created: '2025-12-01'
      });
      expect(o.id).toBe('ord1');
      expect(o.type).toBe('New');
      expect(o.status).toBe('Completed');
      expect(o.total).toBe(100);
    });

    it('parses numeric Total from string', () => {
      const o = mapRestOrder({ Id: 'ord1', Total: '200' });
      expect(o.total).toBe(200);
    });

    it('throws when Id is missing', () => {
      expect(() => mapRestOrder({ OrderNumber: 'noId' })).toThrow(PayloadMappingError);
    });
  });

  describe('mapRestInvoice', () => {
    it('maps a complete invoice', () => {
      const i = mapRestInvoice({
        Id: 'inv1',
        AccountId: 'acc1',
        Period: '2026-01',
        TotalAmount: 100,
        PaidAmount: 100,
        Currency: 'USD',
        Status: 'Paid',
        IssuedDate: '2026-01-01',
        DueDate: '2026-01-15'
      });
      expect(i.id).toBe('inv1');
      expect(i.totalAmount).toBe(100);
      expect(i.paidAmount).toBe(100);
    });

    it('throws when Id is missing', () => {
      expect(() => mapRestInvoice({ Period: 'noId' })).toThrow(PayloadMappingError);
    });
  });

  describe('mapRestBusinessObject', () => {
    it('maps with components array', () => {
      const bo = mapRestBusinessObject({ Name: 'Account', components: ['Account', 'Account Address'] });
      expect(bo.name).toBe('Account');
      expect(bo.components).toEqual(['Account', 'Account Address']);
    });

    it('maps with empty components', () => {
      const bo = mapRestBusinessObject({ Name: 'Contact' });
      expect(bo.components).toEqual([]);
    });

    it('throws when Name is missing', () => {
      expect(() => mapRestBusinessObject({ components: ['x'] })).toThrow(PayloadMappingError);
    });
  });

  describe('mapRestIntegrationObject', () => {
    it('maps with fields', () => {
      const io = mapRestIntegrationObject({ Name: 'Account Interface', Namespace: 'ns', fields: ['Id', 'Name'] });
      expect(io.name).toBe('Account Interface');
      expect(io.namespace).toBe('ns');
      expect(io.fields).toEqual(['Id', 'Name']);
    });

    it('throws when Name is missing', () => {
      expect(() => mapRestIntegrationObject({ fields: ['x'] })).toThrow(PayloadMappingError);
    });
  });

  describe('mapRestBusinessService', () => {
    it('maps with methods', () => {
      const bs = mapRestBusinessService({
        Name: 'Customer BS',
        DisplayName: 'Customer Lookup',
        methods: ['Get', 'Search']
      });
      expect(bs.name).toBe('Customer BS');
      expect(bs.displayName).toBe('Customer Lookup');
      expect(bs.methods).toEqual(['Get', 'Search']);
    });

    it('uses Name as displayName when missing', () => {
      const bs = mapRestBusinessService({ Name: 'X' });
      expect(bs.displayName).toBe('X');
    });

    it('throws when Name is missing', () => {
      expect(() => mapRestBusinessService({ methods: ['x'] })).toThrow(PayloadMappingError);
    });
  });

  describe('unwrapList', () => {
    it('unwraps items array', () => {
      expect(unwrapList({ items: [1, 2, 3] })).toEqual([1, 2, 3]);
    });

    it('unwraps rows array', () => {
      expect(unwrapList({ rows: [{ a: 1 }] })).toEqual([{ a: 1 }]);
    });

    it('returns the array when input is already an array', () => {
      expect(unwrapList([1, 2])).toEqual([1, 2]);
    });

    it('returns empty array for unknown shape', () => {
      expect(unwrapList({ foo: 'bar' })).toEqual([]);
      expect(unwrapList(null)).toEqual([]);
      expect(unwrapList(undefined)).toEqual([]);
    });
  });
});
