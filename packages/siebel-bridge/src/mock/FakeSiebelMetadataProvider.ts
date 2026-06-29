/**
 * FakeSiebelMetadataProvider — synthetic Siebel-like metadata.
 *
 * Lists the Business Objects, Business Components, Integration Objects and
 * Business Services that a real Siebel-like environment would expose. The
 * names are intentionally generic; no proprietary schema is reproduced.
 */

import type {
  SiebelBusinessObject,
  SiebelBusinessService,
  SiebelIntegrationObject
} from '../contracts/types.js';

const BUSINESS_OBJECTS: SiebelBusinessObject[] = [
  { name: 'Account', components: ['Account', 'Account Address', 'Business Address'] },
  { name: 'Contact', components: ['Contact', 'Personal Address'] },
  { name: 'Service Request', components: ['Service Request', 'Action', 'Activity'] },
  { name: 'Asset', components: ['Asset Mgmt - Asset', 'Asset Mgmt - Product'] },
  { name: 'Order', components: ['Order Entry - Orders', 'Order Entry - Line Items'] },
  { name: 'Invoice', components: ['Invoice Header', 'Invoice Line Item'] }
];

const INTEGRATION_OBJECTS: SiebelIntegrationObject[] = [
  { name: 'Account Interface', namespace: 'LegacyOps.SiebelLike', fields: ['Id', 'Name', 'Status', 'Currency', 'BU'] },
  { name: 'Contact Interface', namespace: 'LegacyOps.SiebelLike', fields: ['Id', 'AccountId', 'FirstName', 'LastName', 'Email', 'Phone'] },
  { name: 'Service Request Interface', namespace: 'LegacyOps.SiebelLike', fields: ['Id', 'AccountId', 'ContactId', 'Status', 'Priority', 'Subject', 'Description'] },
  { name: 'Invoice Interface', namespace: 'LegacyOps.SiebelLike', fields: ['Id', 'AccountId', 'Period', 'TotalAmount', 'Status'] }
];

const BUSINESS_SERVICES: SiebelBusinessService[] = [
  {
    name: 'LegacyOps Customer BS',
    displayName: 'Customer Lookup',
    methods: ['GetCustomer', 'SearchCustomers', 'UpdateContact']
  },
  {
    name: 'LegacyOps Billing BS',
    displayName: 'Billing Lookup',
    methods: ['GetBillingSummary', 'GetInvoices', 'DisputeInvoice']
  },
  {
    name: 'LegacyOps Workflow BS',
    displayName: 'Workflow Dispatcher',
    methods: ['StartWorkflow', 'CompleteStep', 'CancelWorkflow']
  },
  {
    name: 'LegacyOps Migration BS',
    displayName: 'Migration Helper',
    methods: ['DryRun', 'Commit', 'Rollback']
  }
];

export class FakeSiebelMetadataProvider {
  listBusinessObjects(): SiebelBusinessObject[] {
    return BUSINESS_OBJECTS;
  }

  listIntegrationObjects(): SiebelIntegrationObject[] {
    return INTEGRATION_OBJECTS;
  }

  listBusinessServices(): SiebelBusinessService[] {
    return BUSINESS_SERVICES;
  }

  findBusinessService(name: string): SiebelBusinessService | undefined {
    return BUSINESS_SERVICES.find((b) => b.name === name || b.displayName === name);
  }
}
