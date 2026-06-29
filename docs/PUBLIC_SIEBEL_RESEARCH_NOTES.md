# Public Siebel Research Notes

> Audit of publicly available material around Oracle Siebel CRM. Purpose:
> validate the hypothesis that no open-source platform today combines a
> complete CRM core, a modern operation layer, a Siebel-like bridge,
> observability and a progressive migration engine — and to define the
> architectural posture of LegacyOps Console accordingly.

---

## 1. Methodology

The following public sources were inspected for **conceptual reference
only**. No proprietary schema, no private repository, no proprietary code
was copied. The audit focuses on **what each source provides** and **what
gap it leaves**, so LegacyOps can position itself honestly against the
existing ecosystem.

---

## 2. Audited links

| # | URL | Type | What it provides | What it does NOT solve |
|---|-----|------|------------------|------------------------|
| 1 | https://github.com/search?q=siebel&type=repositories | GitHub search | Aggregates community repos related to Siebel. Mostly utilities, exporters, Open UI recipes. | No end-to-end modernization platform. No CRM replacement story. |
| 2 | https://github.com/topics/siebel | GitHub topic | Same as above, topic-scoped. Small set of repos. | No migration engine, no anti-corruption layer. |
| 3 | https://github.com/topics/oracle-siebel | GitHub topic | Topic aggregation for Oracle Siebel. | Tooling only; no operational CRM. |
| 4 | https://github.com/OracleSiebel/ConfiguringSiebel | Official repo | Official Oracle samples for Siebel configuration, including Open UI extensions. | Vendor examples for customization; not an integration platform. |
| 5 | https://github.com/OracleSiebel/ConfiguringSiebel/tree/master/ExampleCode/Open%20UI | Subpath | Open UI extension examples. | Browser-side customization only; no server-side bridge. |
| 6 | https://github.com/OracleSiebel/ConfiguringSiebel/blob/master/ExampleCode/Open%20UI/Nexus%20Bridge/readme.md | File | Nexus Bridge concept — a UI bridge idea. | Conceptual; not a complete CRM modernization platform. |
| 7 | https://github.com/svict4/siebel-openui-cookbook | Community repo | Open UI recipes. | Recipes only; no architecture, no migration. |
| 8 | https://github.com/barkadron/siebel_exporter | Community repo | Prometheus exporter for Siebel server metrics. | Metrics only; no CRM, no migration, no operational layer. |
| 9 | https://docs.oracle.com/cd/F26413_09/books/RestAPI/overview-of-using-the-siebel-rest-api.html | Official docs | Siebel REST API overview. | Reference docs; no migration engine, no operational UI. |
| 10 | https://docs.oracle.com/en/applications/siebel/siebel-crm/26.3/szapi/index.html | Official docs | Siebel REST API 26.3 reference. | API reference; no operational layer. |

---

## 3. What each source actually provides

- **Open UI samples (4, 5, 6, 7)**: client-side extensions to the Siebel
  web UI. They show how to add buttons, customise views, embed content.
  They are tied to the Siebel Open UI runtime.
- **Exporter (8)**: a Prometheus exporter that scrapes Siebel server
  metrics (sessions, queue depth, component status). Useful for
  observability, but only one metric source.
- **REST API docs (9, 10)**: the public contract for talking to Siebel
  over HTTP. They cover authentication, business components, business
  services, integration objects. No operational layer is built on top.
- **Topic/search aggregations (1, 2, 3)**: there is no flagship open-source
  project that combines CRM + bridge + migration + observability.

---

## 4. What none of them solve

- **A complete CRM core** with its own domain, workflows, audit, RBAC.
- **A modern operation layer** (Customer 360, Interaction Console,
  Workflow Stepper) on top of legacy data.
- **An anti-corruption layer** that translates Siebel concepts to a clean
  internal domain without coupling.
- **A migration engine** with source-of-truth registry, dry-runs,
  conflict detection, reconciliation and rollback.
- **Legacy observability** separated from operational CRM metrics.
- **A pilot playbook** and **ROI metrics** template.
- **A synthetic lab** that simulates a Siebel-like backend for demos,
  training and integration tests.

---

## 5. Lessons applicable to LegacyOps

1. **Do not depend on Open UI hacks.** Open UI extenders are useful for
   in-Siebel enhancements but they are not a modernization strategy.
   LegacyOps must operate as a standalone layer that can talk to Siebel
   over its documented REST API.
2. **REST is the realistic seam.** Siebel exposes business components,
   business services and integration objects over REST. LegacyOps should
   model adapters around those concepts, without copying any vendor
   schema.
3. **Observability is half-solved.** A Prometheus exporter exists, but it
   only covers Siebel server metrics. LegacyOps needs adapter latency,
   failed external calls and conflict metrics on top — separated from CRM
   operational metrics.
4. **No migration platform exists.** This is the strongest gap. LegacyOps
   must own source-of-truth, mapping, dry-run, conflict detection,
   reconciliation and rollback as first-class capabilities.
5. **Legal posture.** Conceptual Siebel-like types only. No proprietary
   schemas, no copied examples, no hardcoded vendor endpoints in the core
   packages.

---

## 6. Capabilities LegacyOps needs to NOT be a generic CRM

To defend the thesis *“LegacyOps is not just another modern CRM, it is a
modernization platform for Siebel-like environments”*, the product must
ship:

1. **Own CRM domain** — Customer, Account, Case, Workflow, Audit, RBAC.
2. **Siebel-like bridge** — adapters that expose Business Objects,
   Business Components, Integration Objects and Business Services as
   conceptual DTOs.
3. **Anti-corruption layer** — mapping helpers that translate between
   Siebel-like DTOs and the LegacyOps domain without leaking Siebel
   concepts into the core.
4. **Migration engine** — source-of-truth registry, entity/field mapping,
   ID mapping store, dry-run report, conflict detection, reconciliation
   report, rollback plan, module migration status.
5. **Legacy observability** — health checks, latency, errors, queue depth,
   session count, separated from operational CRM metrics.
6. **Fake Siebel Lab** — synthetic backend that reproduces latency,
   session expiry, permission errors, conflicts and partial data.
7. **Integration modes** — standalone CRM, synthetic, read-only overlay,
   workflow wrapper, controlled write-back, hybrid source-of-truth,
   progressive replacement.
8. **Pilot playbook** — clear path from demo to controlled pilot.
9. **ROI metrics** — before/after template with concrete KPIs.
10. **Auditability** — every operator action produces an audit event.

LegacyOps Console implements all ten capabilities in its first scaffold.

---

## 7. Legal and technical risks

| Risk | Mitigation in LegacyOps |
|------|-------------------------|
| Reproducing proprietary Siebel schemas. | Only conceptual Siebel-like types. Field mappings are configured, not hardcoded. |
| Embedding Oracle-copyrighted samples. | No code from OracleSiebel repos is copied. The bridge contract is original. |
| Hardcoding vendor endpoints. | Base URL, credentials and timeouts live in `.env`. The bridge contract is vendor-neutral. |
| Misleading “production-ready” claims. | `docs/ENTERPRISE_READINESS_GAP.md` documents honestly what is missing. |
| Operator data leakage. | The scaffold uses synthetic data only. No real customer data is supported in this phase. |
| Fragile Open UI coupling. | LegacyOps does not depend on Open UI at all. A future “legacy UI inspector” is documented as optional. |
| Token / credential leakage. | `.gitignore` excludes `.env`. No tokens are committed. The scaffold ships with inert placeholders only. |

---

## 8. Final architectural decision

LegacyOps Console will **not** clone Siebel, **not** wrap Siebel Open UI,
and **not** depend on any Oracle proprietary artifact. It will:

- Implement its own CRM core domain.
- Expose a **Siebel-like bridge** contract that maps conceptual Business
  Objects, Business Components, Integration Objects and Business Services
  to the LegacyOps domain through an explicit anti-corruption layer.
- Ship a **Fake Siebel Lab** so the entire platform is demonstrable
  without any real Siebel backend.
- Provide a **migration engine** with source-of-truth registry, dry-runs,
  conflict detection, reconciliation and rollback.
- Provide **legacy observability** for the adapter layer, separated from
  CRM operational metrics.
- Provide a **pilot playbook** and **ROI metrics** template so prospects
  can plug in their own numbers.

This positions LegacyOps as the **first open-source platform that
combines a complete CRM core, a modern operation layer, a Siebel-like
bridge, observability and a progressive migration engine** — exactly the
gap the public ecosystem audit confirmed.
