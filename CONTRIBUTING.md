# Contributing to LegacyOps Console

## 1. Contribution Philosophy

LegacyOps Console is an ambitious enterprise CRM project. Contributions should strengthen the product vision: a complete, modern, auditable and migration-ready CRM for complex operational environments.

This project should not become a generic dashboard template or a shallow CRUD application.

Every contribution should support at least one of these goals:

- Improve operator clarity.
- Reduce workflow friction.
- Strengthen CRM domain modeling.
- Improve auditability.
- Improve security.
- Improve migration readiness.
- Improve synthetic demo realism.
- Improve test coverage.
- Improve documentation.

---

## 2. General Rules

Contributors should follow these rules:

- Do not commit real customer data.
- Do not commit secrets, tokens or credentials.
- Do not copy proprietary CRM screens, workflows, schemas or documentation.
- Do not use confidential information from any company.
- Do not add vendor-specific assumptions into the core domain.
- Prefer clear workflow design over generic CRUD.
- Keep auditability in mind.
- Add tests for business logic where possible.
- Document significant architectural decisions.

---

## 3. Product Direction

LegacyOps Console is designed as a full CRM platform with progressive migration capabilities.

Contributions should align with this direction.

Good contributions:

- Customer 360 improvements.
- Case management logic.
- Workflow engine functionality.
- Audit event modeling.
- Permission checks.
- Synthetic demo scenarios.
- Adapter interfaces.
- Supervisor metrics.
- Documentation.
- Tests.

Poor contributions:

- Decorative UI with no operational purpose.
- Hardcoded company-specific flows.
- Unstructured admin panels.
- AI features that bypass auditability.
- Direct coupling to one proprietary CRM.
- Real or realistic private customer data.

---

## 4. Code Standards

The final coding standards will depend on the selected stack.

General expectations:

- Use clear names.
- Keep modules small.
- Separate UI from business logic.
- Keep domain logic testable.
- Avoid hidden side effects.
- Prefer explicit errors.
- Keep external integrations behind adapters.
- Add comments only where they clarify non-obvious decisions.

---

## 5. Documentation Standards

Documentation should be clear, practical and aligned with the product vision.

Useful documents include:

- Product vision.
- Architecture.
- Migration strategy.
- Demo scenarios.
- Security notes.
- Workflow definitions.
- Data model notes.
- API documentation.
- Testing strategy.
- Deployment guide.

Documentation should avoid unsupported claims such as production readiness or guaranteed enterprise compatibility.

---

## 6. Synthetic Data Rules

Synthetic data must be fake.

Allowed:

- Fictional names.
- Fictional accounts.
- Fictional invoices.
- Fictional cases.
- Fictional companies.
- Fake emails under safe domains such as `example.com`.

Not allowed:

- Real customer data.
- Scraped data.
- Leaked data.
- Former employer data.
- Internal workflow names from real companies.
- Screenshots from proprietary systems.
- Real contracts, invoices or tickets.

---

## 7. Security Expectations

All contributions should avoid introducing obvious security risks.

Do not commit:

- `.env` files.
- API keys.
- Private certificates.
- Production credentials.
- Internal URLs.
- Personal data.
- Real logs.

Sensitive actions should be auditable.

Authorization should be enforced server-side, not only hidden in the UI.

---

## 8. Pull Request Expectations

A good pull request should include:

- Clear description.
- Reason for the change.
- Screenshots if UI changed.
- Tests if business logic changed.
- Documentation if architecture or product behavior changed.
- Notes about security or migration impact if relevant.

Recommended PR template:

```md
## Summary

Describe the change.

## Why

Explain the reason.

## Scope

List affected modules.

## Testing

Explain how it was tested.

## Screenshots

Add screenshots if applicable.

## Security / Audit Impact

Mention any relevant impact.

## Migration Impact

Mention any relevant impact.
```

---

## 9. Commit Message Style

Recommended style:

```text
type(scope): short description
```

Examples:

```text
docs(product): add migration strategy
feat(workflows): add billing claim workflow schema
feat(audit): add audit event model
test(cases): add case lifecycle tests
fix(ui): improve customer search empty state
```

Common types:

- `feat`
- `fix`
- `docs`
- `test`
- `refactor`
- `chore`
- `security`

---

## 10. Issue Guidelines

Good issues should include:

- Problem.
- Expected behavior.
- Current behavior.
- Proposed solution if known.
- Screenshots or examples if useful.
- Business impact if relevant.

Issue categories:

- Product.
- UX.
- Architecture.
- Security.
- Workflow.
- Demo data.
- Testing.
- Documentation.
- Integration.

---

## 11. Final Note

LegacyOps Console is not trying to imitate legacy systems. It is trying to solve the operational pain that legacy systems often create.

Contributions should make the product clearer, safer, faster and more credible as an enterprise CRM.
