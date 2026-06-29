# Siebel Open UI Research

> Potential role of Siebel Open UI as an extension surface for LegacyOps
> Console. **Not a runtime dependency**. This document is exploratory.

---

## 1. What Open UI is

Siebel Open UI is the web client layer of Siebel CRM. It is highly
customisable: views, applets, presentation templates, navigation context
and behaviour can be extended with JavaScript.

Public sources inspected:

- `https://github.com/OracleSiebel/ConfiguringSiebel/tree/master/ExampleCode/Open%20UI`
- `https://github.com/OracleSiebel/ConfiguringSiebel/blob/master/ExampleCode/Open%20UI/Nexus%20Bridge/readme.md`
- `https://github.com/svict4/siebel-openui-cookbook`

---

## 2. Concepts an operator-side LegacyOps extension could use

| Concept | What it is | Potential LegacyOps use |
|---|---|---|
| View | A screen showing applets. | Detect which customer/case the operator is on. |
| Applet | A UI component bound to a business component. | Read field values for context. |
| Presentation model | The client-side model behind an applet. | Inspect current record without backend round-trip. |
| Physical renderer | Renders the applet to the DOM. | Inject LegacyOps side-panel content. |
| Navigation context | Tracks the user's position in the app. | Auto-launch a LegacyOps workflow for the current customer. |
| Browser script | Client-side scripting hooks. | Emit telemetry to LegacyOps observability. |

---

## 3. Possible future: “Legacy UI Inspector”

A future LegacyOps module could provide a **Legacy UI Inspector**: a
browser extension or a small embedded script that, on a Siebel Open UI
page, extracts the current view, applet and record context, and surfaces
matching LegacyOps capabilities (Customer 360, Workflow Stepper, Knowledge
articles).

This would give operators a **bridge experience** inside the legacy UI
without forcing them to switch contexts.

---

## 4. What we will NOT do with Open UI

- ❌ Reproduce proprietary Siebel Open UI code from Oracle repos.
- ❌ Depend on Open UI at runtime for LegacyOps to function.
- ❌ Ship fragile hacks that break with Siebel patch upgrades.
- ❌ Hide the legacy UI in a way that violates support contracts.
- ❌ Use Open UI as a substitute for a real CRM core.

---

## 5. Architectural principle

> LegacyOps must work **without** any Open UI integration. Open UI is an
> optional **context booster**, not a foundation.

The LegacyOps CRM core, the Siebel-like bridge, the migration engine and
the observability stack are all server-side and UI-agnostic. Open UI is a
potential future client surface only.

---

## 6. Risk posture

| Risk | Mitigation |
|------|------------|
| Siebel patch breaks Open UI customisations. | LegacyOps core never depends on Open UI. |
| Vendor support issues. | Document Open UI extension as optional, customer-owned. |
| Security review objections. | No code injection from LegacyOps into Siebel; only read-only context extraction. |
| IP concerns. | No code copied from OracleSiebel repos. Original implementation only. |

---

## 7. Status

- **Current**: no Open UI integration is shipped in this scaffold.
- **Future**: a `packages/legacy-ui-inspector/` package could be added
  behind a feature flag, with documentation that it is a customer-owned
  extension point.
