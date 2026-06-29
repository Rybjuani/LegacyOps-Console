# Security Notes — LegacyOps Console

## 1. Purpose

LegacyOps Console is intended to handle CRM workflows, customer records, cases, billing visibility, operational notes, permissions and audit trails.

Even though the early versions will use synthetic data, the project must be designed with security and compliance in mind from the beginning.

This document defines the initial security principles, risks and implementation guidelines.

---

## 2. Security Position

LegacyOps Console is not production-ready in its early stage.

Until a stable security model is implemented and reviewed, the project should be treated as experimental.

Public demos must use synthetic data only.

No real customer data, private company workflows, production credentials, internal documents or confidential schemas should be committed to the repository.

---

## 3. Core Security Principles

### 3.1 Least Privilege

Users should only have access to the actions and data required for their role.

Examples:

- Operators may view customers and create cases.
- Supervisors may review team queues and escalations.
- Administrators may configure workflows and permissions.
- Auditors may read audit logs but not modify customer data.

### 3.2 Role-Based Access Control

The platform should implement RBAC as an early security feature.

Initial role examples:

- Operator.
- Senior operator.
- Supervisor.
- Back-office analyst.
- Retention agent.
- Collections agent.
- Auditor.
- Administrator.

Permissions should be explicit.

Examples:

- `customer:read`
- `customer:update`
- `case:create`
- `case:update`
- `case:assign`
- `billing:read`
- `workflow:run`
- `workflow:configure`
- `audit:read`
- `admin:users`

### 3.3 Auditability

All critical actions should generate audit events.

Examples:

- Customer profile opened.
- Customer data changed.
- Case created.
- Case status changed.
- Billing data viewed.
- Workflow started.
- Workflow completed.
- Permission denied.
- External adapter failed.
- AI suggestion generated.
- Manual override performed.

### 3.4 Data Minimization

The UI should only expose the data needed for the task.

Sensitive fields should be masked where possible.

Examples:

- Document numbers.
- Phone numbers.
- Email addresses.
- Payment-related fields.
- Internal risk flags.
- Financial status.

### 3.5 Separation of Demo and Real Data

Demo data must be clearly separated from imported or real data.

Recommended safeguards:

- Demo database seed files must be synthetic.
- Demo mode should be visibly labeled.
- Real imports should require explicit configuration.
- Public repository must not include production-like secrets.
- Test fixtures must avoid real identities.

---

## 4. Authentication

Authentication strategy will depend on the final stack.

Early options:

- Local development authentication.
- Demo login with synthetic users.
- JWT-based sessions.
- Secure cookie sessions.
- External identity provider integration later.

Production-grade deployments should eventually support:

- SSO.
- SAML or OIDC.
- Multi-factor authentication where required.
- Session expiration.
- Device/session management.
- Account lockout policies.
- Password policies if local auth exists.

---

## 5. Authorization

Authorization should be enforced server-side.

The frontend may hide unavailable actions, but the backend must be the source of truth.

Every sensitive endpoint should check:

- User identity.
- Role.
- Permission.
- Team/queue access if applicable.
- Field-level access if applicable.
- Workflow state.

Example:

An operator may create a case, but not approve a billing adjustment.

A supervisor may reassign a case, but not configure global permissions.

An auditor may read audit events, but not update customer data.

---

## 6. Audit Log Requirements

Audit logs should be structured.

Recommended fields:

- Event ID.
- Timestamp.
- Actor ID.
- Actor role.
- Action.
- Entity type.
- Entity ID.
- Previous value if applicable.
- New value if applicable.
- Workflow ID if applicable.
- Interaction ID if applicable.
- Source module.
- External system if applicable.
- IP address if applicable.
- Request ID.
- AI-assisted flag if applicable.
- Metadata.

Audit logs should be append-only where possible.

Audit logs should be searchable and exportable.

---

## 7. Data Protection

### 7.1 Sensitive Data

Potentially sensitive data includes:

- Names.
- Document numbers.
- Phone numbers.
- Email addresses.
- Addresses.
- Billing status.
- Debt records.
- Case notes.
- Complaint details.
- Payment promises.
- Internal risk flags.

### 7.2 Masking

The system should support masking for sensitive fields.

Examples:

- Show only last digits of document number.
- Hide full phone number unless needed.
- Mask billing identifiers.
- Limit visibility of internal flags by role.

### 7.3 Encryption

Future production deployments should consider:

- TLS for all network traffic.
- Database encryption at rest where required.
- Secret encryption.
- Secure credential storage.
- Encrypted backups.

---

## 8. Input Validation

All user input should be validated.

Examples:

- Required fields.
- Field length.
- Allowed values.
- Date ranges.
- Numeric ranges.
- Email format.
- Phone format.
- Document format.
- Case status transitions.
- Workflow step requirements.

Validation should happen both client-side and server-side, but server-side validation is mandatory.

---

## 9. Secure Configuration

The repository should not contain:

- API keys.
- Database passwords.
- Production tokens.
- Private certificates.
- Internal endpoints.
- Real customer data.
- Private company documentation.

Configuration should use environment variables.

Recommended files:

- `.env.example`
- `.gitignore`
- `docker-compose.example.yml`

The `.env` file should never be committed.

---

## 10. Dependency Security

The project should eventually include:

- Dependency lock files.
- Dependency vulnerability checks.
- Regular updates.
- Minimal dependency surface.
- Review of packages used for authentication, authorization and cryptography.

For JavaScript/TypeScript projects:

- `npm audit`
- `pnpm audit`
- Dependabot or equivalent.

For Python projects:

- `pip-audit`
- `safety`
- Dependabot or equivalent.

---

## 11. API Security

The API should include:

- Authentication checks.
- Authorization checks.
- Request validation.
- Rate limiting where needed.
- Error normalization.
- No sensitive data in error messages.
- Request IDs.
- CORS configuration.
- Pagination for large result sets.
- Audit logging for sensitive actions.

Avoid:

- Returning unnecessary fields.
- Trusting client-side permissions.
- Exposing stack traces.
- Logging sensitive values.
- Allowing unrestricted exports.

---

## 12. AI Security

AI-assisted features must be bounded and auditable.

Rules:

- AI should not perform irreversible actions without confirmation.
- AI outputs should be clearly labeled.
- AI suggestions should be logged.
- Operators must remain responsible for final actions.
- Sensitive data sent to AI services must be controlled.
- Local/offline AI options should be considered for sensitive deployments.
- Prompt injection risks should be considered if AI uses notes, tickets or external content.

AI should assist with:

- Summaries.
- Suggested next steps.
- Draft notes.
- Knowledge article suggestions.
- Training explanations.

AI should not independently:

- Approve financial adjustments.
- Change contracts.
- Cancel services.
- Modify customer identity data.
- Override permissions.
- Delete audit logs.

---

## 13. Demo Data Safety

Synthetic data should be obviously fake.

Recommended practices:

- Use fictional names.
- Use fake document numbers.
- Use fake addresses.
- Use fake phone numbers.
- Use fake emails under safe domains such as `example.com`.
- Avoid using real company customer patterns.
- Avoid copying real internal process names.
- Avoid importing leaked or scraped datasets.

---

## 14. Logging

Logs should help diagnose problems without exposing sensitive data.

Logs may include:

- Request ID.
- Endpoint.
- Status code.
- Duration.
- User ID or synthetic user ID.
- Error code.
- Adapter status.

Logs should avoid:

- Full customer names if not needed.
- Full document numbers.
- Full billing details.
- Case notes.
- Authentication tokens.
- Secrets.
- Raw AI prompts containing sensitive data.

---

## 15. Backups and Recovery

Future production deployments should define:

- Backup schedule.
- Backup encryption.
- Restore process.
- Recovery point objective.
- Recovery time objective.
- Backup access control.
- Periodic restore testing.

For early development, this can be documented but not fully implemented.

---

## 16. Security Checklist for Early Development

Before the first public demo:

- No real customer data.
- No secrets committed.
- `.env.example` exists.
- Demo mode is clearly labeled.
- Basic RBAC exists or is documented.
- Sensitive fields are not overexposed.
- Audit events exist for critical actions.
- Errors do not expose stack traces in UI.
- Dependencies are checked.
- Demo users are synthetic.

Before any real pilot:

- Authentication reviewed.
- Authorization reviewed.
- Audit trail reviewed.
- Data handling agreement defined.
- Deployment configuration reviewed.
- Logging reviewed.
- Backup strategy reviewed.
- Integration permissions reviewed.
- Rollback plan documented.
- Legal/security stakeholders involved.

---

## 17. Known Early-Stage Limitations

Early versions may lack:

- Production authentication.
- Enterprise SSO.
- Full encryption strategy.
- Complete RBAC.
- Field-level permissions.
- Production monitoring.
- Formal penetration testing.
- Compliance certification.
- Mature backup/restore procedures.

These limitations should be disclosed clearly.

---

## 18. Final Security Goal

The final security goal is to make LegacyOps Console suitable for enterprise environments where customer data, operational actions and auditability matter.

Security must be treated as part of the product design, not as a final-stage add-on.
