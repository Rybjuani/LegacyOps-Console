# Architecture — LegacyOps Console

## 1. Architectural Goal

LegacyOps Console should be designed as a complete enterprise CRM with progressive migration capabilities.

The architecture must support three modes:

1. **Synthetic Demo Mode**  
   Uses fake enterprise data and simulated external systems.

2. **Standalone CRM Mode**  
   Uses LegacyOps Console as the main CRM with its own database and business logic.

3. **Hybrid Integration Mode**  
   Uses LegacyOps Console as a modern operational layer connected to external legacy systems through adapters.

The architecture must avoid tight coupling to any specific vendor, database schema or company-specific process.

---

## 2. Core Principles

### 2.1 Domain First

The system should be organized around CRM domain concepts:

- Customer.
- Account.
- Contact method.
- Contract.
- Product.
- Service.
- Invoice.
- Payment.
- Debt record.
- Case.
- Interaction.
- Workflow.
- Audit event.
- User.
- Role.
- Permission.
- Team.
- Queue.

The domain layer should not depend directly on UI frameworks, database drivers or external systems.

### 2.2 Adapter-Based Integration

External systems should be accessed through adapters.

Examples:

- CRM adapter.
- Billing adapter.
- Ticketing adapter.
- SQL adapter.
- REST API adapter.
- Authentication adapter.
- Telephony/CTI adapter.
- Reporting adapter.
- File import/export adapter.
- Legacy simulation adapter.

This allows the same application to run with synthetic data, a standalone database or external enterprise integrations.

### 2.3 Auditability by Design

Every critical action must create an audit event.

Examples:

- Customer viewed.
- Case created.
- Case updated.
- Workflow started.
- Workflow completed.
- Payment promise registered.
- Permission denied.
- External API call failed.
- AI suggestion generated.
- Manual override performed.

Audit events should be structured, searchable and exportable.

### 2.4 Progressive Migration

The architecture should allow individual modules to move from external dependency to native ownership.

Example:

1. Billing is initially read-only through an external adapter.
2. Billing claims become native in LegacyOps Console.
3. Billing adjustments are integrated through controlled writes.
4. A company may later migrate more billing-related workflows.

### 2.5 UI Optimized for Operations

The frontend must support dense enterprise workflows without becoming visually chaotic.

The UI architecture should prioritize:

- Reusable workflow components.
- Fast navigation.
- Keyboard support.
- Accessible forms.
- Consistent status indicators.
- Error prevention.
- Contextual actions.

---

## 3. Proposed Repository Structure

```text
legacyops-console/
│
├── apps/
│   ├── web/                  # Main frontend application
│   └── api/                  # Backend API
│
├── packages/
│   ├── domain/               # CRM domain models and business rules
│   ├── workflows/            # Workflow definitions and engine
│   ├── adapters/             # External system adapters
│   ├── audit/                # Audit logging logic
│   ├── permissions/          # RBAC and access control
│   ├── demo-data/            # Synthetic enterprise dataset
│   └── shared/               # Shared types and utilities
│
├── docs/
│   ├── PRODUCT_VISION.md
│   ├── ARCHITECTURE.md
│   ├── MIGRATION_STRATEGY.md
│   ├── DEMO_SCENARIOS.md
│   └── SECURITY_NOTES.md
│
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── README.md
├── ROADMAP.md
└── CONTRIBUTING.md
```

This structure may evolve, but the separation between domain, workflows, adapters, audit and permissions should remain.

---

## 4. Logical Layers

### 4.1 Presentation Layer

Responsible for:

- Customer search.
- Customer 360.
- Interaction console.
- Case views.
- Billing views.
- Workflow screens.
- Supervisor dashboards.
- Admin screens.

Possible technologies:

- React.
- TypeScript.
- Vite or Next.js.
- Tailwind CSS.
- Component library optimized for enterprise workflows.

The presentation layer should not contain core business rules. It should call the API and render domain states clearly.

---

### 4.2 API Layer

Responsible for:

- HTTP endpoints.
- Authentication middleware.
- Request validation.
- Response shaping.
- Application service orchestration.
- Error normalization.
- Rate limiting if needed.
- Audit event dispatching.

Possible technologies:

- NestJS.
- FastAPI.
- Express with strong structure.

The API layer should delegate business decisions to domain and application services.

---

### 4.3 Application Services Layer

Responsible for use cases:

- Start interaction.
- Verify customer identity.
- Create case.
- Update case status.
- Register payment promise.
- Start workflow.
- Complete workflow step.
- Assign case.
- Escalate case.
- Generate customer summary.

Application services coordinate domain logic, permissions, persistence and adapters.

---

### 4.4 Domain Layer

Responsible for core business concepts and rules.

Examples:

- Customer identity.
- Case lifecycle.
- Workflow state.
- Permission checks.
- SLA status.
- Audit event model.
- Validation rules.
- Resolution codes.

The domain layer should be testable without the database or UI.

---

### 4.5 Persistence Layer

Responsible for storing native LegacyOps data.

Initial database recommendation:

- PostgreSQL for production-like development.
- SQLite for lightweight demo mode if useful.

Persistence should store:

- Customers.
- Accounts.
- Contracts.
- Services.
- Cases.
- Interactions.
- Workflows.
- Audit events.
- Users.
- Roles.
- Permissions.
- Demo data.

---

### 4.6 Adapter Layer

Responsible for external dependencies.

Each adapter should expose a stable internal interface.

Example adapter contract:

```ts
interface BillingAdapter {
  getBillingSummary(customerId: string): Promise<BillingSummary>;
  getInvoices(customerId: string): Promise<Invoice[]>;
  getPaymentHistory(customerId: string): Promise<Payment[]>;
}
```

Implementations may include:

- DemoBillingAdapter.
- RestBillingAdapter.
- SqlBillingAdapter.
- LegacyBillingAdapter.

The application should depend on the interface, not the implementation.

---

### 4.7 Audit Layer

Responsible for generating and storing audit events.

Each event should include:

- Event ID.
- Timestamp.
- Actor ID.
- Actor role.
- Action type.
- Entity type.
- Entity ID.
- Previous value if applicable.
- New value if applicable.
- Source module.
- Workflow ID if applicable.
- External system if applicable.
- AI-assisted flag if applicable.
- Metadata.

Audit logs should be append-only where possible.

---

### 4.8 Permission Layer

Responsible for access control.

Initial model:

- Role-based access control.
- Permission-based action checks.
- Optional team/queue restrictions.
- Field-level visibility in later versions.

Examples:

- `customer:read`.
- `case:create`.
- `case:update`.
- `case:assign`.
- `billing:read`.
- `billing:adjustment:request`.
- `workflow:configure`.
- `audit:read`.
- `admin:users`.

---

## 5. Initial Domain Model

### 5.1 Customer

Represents a person or organization receiving products or services.

Fields may include:

- ID.
- Full name.
- Document type.
- Document number.
- Contact methods.
- Status.
- Risk flags.
- Created date.
- Updated date.

### 5.2 Account

Represents the commercial account associated with a customer.

Fields may include:

- ID.
- Customer ID.
- Account number.
- Segment.
- Status.
- Billing profile.
- Current balance.
- Created date.

### 5.3 Contract

Represents an agreement between the customer and the company.

Fields may include:

- ID.
- Account ID.
- Contract type.
- Start date.
- End date.
- Status.
- Terms summary.

### 5.4 Service

Represents an active or historical service/product.

Fields may include:

- ID.
- Account ID.
- Product ID.
- Status.
- Activation date.
- Cancellation date.
- Service address.
- Technical status.

### 5.5 Invoice

Represents billing documents.

Fields may include:

- ID.
- Account ID.
- Invoice number.
- Amount.
- Due date.
- Status.
- Dispute status.

### 5.6 Case

Represents a customer issue, request, claim or internal follow-up.

Fields may include:

- ID.
- Customer ID.
- Account ID.
- Category.
- Priority.
- Severity.
- Status.
- Assigned team.
- Assigned user.
- SLA due date.
- Resolution code.
- Created date.
- Closed date.

### 5.7 Interaction

Represents a customer contact session.

Fields may include:

- ID.
- Customer ID.
- Channel.
- Started at.
- Ended at.
- Operator ID.
- Reason.
- Outcome.
- Linked case IDs.
- Notes.

### 5.8 Workflow

Represents a guided business process.

Fields may include:

- ID.
- Name.
- Version.
- Category.
- Steps.
- Conditions.
- Required permissions.
- Active flag.

### 5.9 Audit Event

Represents a traceable system event.

Fields may include:

- ID.
- Timestamp.
- Actor ID.
- Action.
- Entity type.
- Entity ID.
- Metadata.
- Source.

---

## 6. API Design

The API should be resource-oriented and workflow-aware.

Possible endpoints:

```text
GET    /customers
GET    /customers/:id
GET    /customers/:id/timeline
GET    /customers/:id/billing
GET    /customers/:id/cases
POST   /interactions
POST   /interactions/:id/close
POST   /cases
GET    /cases/:id
PATCH  /cases/:id
POST   /cases/:id/comments
POST   /cases/:id/escalate
GET    /workflows
POST   /workflows/:id/start
POST   /workflow-runs/:id/steps/:stepId/complete
GET    /audit-events
GET    /supervisor/dashboard
```

API responses should be explicit and predictable.

Error responses should include:

- Error code.
- Human-readable message.
- Field errors if applicable.
- Correlation ID.
- Audit reference if applicable.

---

## 7. Workflow Engine Design

The workflow engine is central to the product.

A workflow should define:

- Name.
- Version.
- Category.
- Trigger.
- Steps.
- Required fields.
- Conditional branches.
- Validation rules.
- Permissions.
- Completion rules.
- Audit events.

Example workflow concept:

```json
{
  "id": "billing-claim-v1",
  "name": "Billing Claim",
  "version": 1,
  "steps": [
    {
      "id": "verify-identity",
      "title": "Verify customer identity",
      "required": true
    },
    {
      "id": "select-invoice",
      "title": "Select disputed invoice",
      "required": true
    },
    {
      "id": "capture-reason",
      "title": "Capture claim reason",
      "required": true
    },
    {
      "id": "create-case",
      "title": "Create billing case",
      "required": true
    }
  ]
}
```

---

## 8. Synthetic Data Architecture

Synthetic data should be realistic enough to demonstrate enterprise operations.

It should include:

- Customers.
- Accounts.
- Contracts.
- Services.
- Invoices.
- Payments.
- Cases.
- Interactions.
- Notes.
- Operators.
- Supervisors.
- Queues.
- Workflows.
- Audit events.

Synthetic data should include edge cases:

- Customers with debt.
- Customers with multiple services.
- Customers with open claims.
- Customers with cancellation risk.
- Customers with repeated complaints.
- Customers with incomplete contact data.
- Customers with disputed invoices.

No real customer data should be used.

---

## 9. AI Assistance Architecture

AI assistance should be optional, traceable and bounded by business rules.

Potential AI services:

- Customer summary.
- Case summary.
- Suggested next step.
- Note drafting.
- Knowledge article suggestion.
- Escalation risk detection.
- Supervisor insight generation.

AI outputs should include:

- Clear labeling.
- Confidence level if available.
- Source data references.
- Audit event.
- Manual confirmation before critical actions.

AI should not perform irreversible business actions without explicit user confirmation.

---

## 10. Testing Strategy

### 10.1 Unit Tests

Should cover:

- Domain rules.
- Workflow validation.
- Permission checks.
- Audit event creation.
- Case lifecycle.

### 10.2 Integration Tests

Should cover:

- API endpoints.
- Database behavior.
- Adapter contracts.
- Workflow execution.
- Audit persistence.

### 10.3 End-to-End Tests

Should cover:

- Customer search.
- Identity verification.
- Billing claim.
- Case creation.
- Case escalation.
- Interaction closure.
- Supervisor dashboard.

### 10.4 Visual Regression Tests

Should cover:

- Customer 360.
- Interaction console.
- Case detail.
- Workflow stepper.
- Supervisor dashboard.
- Admin screens.

---

## 11. Deployment Architecture

Early deployment can use Docker Compose.

Possible services:

- Web app.
- API.
- PostgreSQL.
- Redis.
- Worker service.

Example future topology:

```text
Browser
  │
  ▼
Web App
  │
  ▼
API
  ├── PostgreSQL
  ├── Redis
  ├── Worker
  ├── External CRM Adapter
  ├── External Billing Adapter
  └── Audit Store
```

---

## 12. Observability

The platform should eventually include:

- Structured logs.
- Request IDs.
- Error tracking.
- Audit event search.
- Performance metrics.
- Workflow metrics.
- Adapter latency metrics.
- Failed integration monitoring.

---

## 13. Architecture Risks

Key risks:

- Overbuilding before validating core workflows.
- Designing too generic a CRM with no operational depth.
- Coupling the core to one simulated legacy model.
- Ignoring security and auditability early.
- Making AI features central before core workflows are stable.
- Creating a beautiful UI that does not reduce actual operator effort.

---

## 14. Architecture Priorities

The first implementation should prioritize:

1. Clean domain model.
2. Synthetic data.
3. Customer 360.
4. Interaction console.
5. Case management.
6. Workflow engine.
7. Audit trail.
8. Basic supervisor metrics.
9. Adapter interfaces.
10. Testable architecture.

The architecture should remain simple enough to build, but serious enough to scale into a credible enterprise product.
