/**
 * RealSiebelEndpointMap — configurable REST endpoint paths.
 *
 * The defaults are CONCEPTUAL. Siebel REST URL shapes vary across versions
 * and customer configurations. Each customer pilot MUST review and override
 * these paths based on their actual Siebel REST configuration. See
 * `docs/REAL_SIEBEL_ADAPTER.md` and `docs/SIEBEL_SANDBOX_ONBOARDING.md`.
 *
 * Convention: paths are relative to the configured `baseUrl`. Use
 * placeholders like `{id}`, `{accountId}`, `{businessService}`, `{method}`
 * for substitution.
 */

export interface RealSiebelEndpointMap {
  contactsSearch: string;
  contactById: string;
  accountById: string;
  accountsList: string;
  serviceRequests: string;
  serviceRequestById: string;
  createServiceRequest: string;
  assetsByAccount: string;
  ordersByAccount: string;
  activitiesByAccount: string;
  invoicesByAccount: string;
  billingSummaryByAccount: string;
  businessServiceInvoke: string;
  metadataBusinessObjects: string;
  metadataIntegrationObjects: string;
  metadataBusinessServices: string;
  sessionLogin: string;
  healthCheck: string;
}

export const DEFAULT_ENDPOINT_MAP: RealSiebelEndpointMap = {
  contactsSearch: '/siebel/v1.0/data/Contact/Contact',
  contactById: '/siebel/v1.0/data/Contact/Contact/{id}',
  accountById: '/siebel/v1.0/data/Account/Account/{id}',
  accountsList: '/siebel/v1.0/data/Account/Account',
  serviceRequests: '/siebel/v1.0/data/Service Request/Service Request',
  serviceRequestById: '/siebel/v1.0/data/Service Request/Service Request/{id}',
  createServiceRequest: '/siebel/v1.0/data/Service Request/Service Request',
  assetsByAccount: '/siebel/v1.0/data/Asset Mgmt - Asset/Asset Mgmt - Asset',
  ordersByAccount: '/siebel/v1.0/data/Order Entry - Orders/Order Entry - Orders',
  activitiesByAccount: '/siebel/v1.0/data/Action/Action',
  invoicesByAccount: '/siebel/v1.0/data/Invoice Header/Invoice Header',
  billingSummaryByAccount: '/siebel/v1.0/data/Account/Account/{id}/billing-summary',
  businessServiceInvoke: '/siebel/v1.0/service/{businessService}/{method}',
  metadataBusinessObjects: '/siebel/v1.0/metadata/businessobjects',
  metadataIntegrationObjects: '/siebel/v1.0/metadata/integrationobjects',
  metadataBusinessServices: '/siebel/v1.0/metadata/businessservices',
  sessionLogin: '/siebel/v1.0/session',
  healthCheck: '/siebel/v1.0/healthcheck'
};

export function fillPath(template: string, params: Record<string, string>): string {
  let out = template;
  for (const [k, v] of Object.entries(params)) {
    out = out.replace(`{${k}}`, encodeURIComponent(v));
  }
  return out;
}
