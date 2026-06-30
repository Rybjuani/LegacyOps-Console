import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import type { Case, Customer, Interaction, WorkflowDefinition } from '@legacyops/domain';

type Step =
  | 'select_customer'
  | 'verify_identity'
  | 'choose_reason'
  | 'run_workflow'
  | 'create_case'
  | 'add_note'
  | 'close_interaction';

const REASONS = [
  'billing_claim',
  'technical_complaint',
  'cancellation_retention',
  'payment_promise',
  'general_inquiry'
];
const CHANNELS: Interaction['channel'][] = ['voice', 'email', 'chat', 'whatsapp'];

export function InteractionConsolePage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('select_customer');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerId, setCustomerId] = useState('');
  const [channel, setChannel] = useState<Interaction['channel']>('voice');
  const [reason, setReason] = useState<string>('billing_claim');
  const [identityVerified, setIdentityVerified] = useState(false);
  const [workflows, setWorkflows] = useState<WorkflowDefinition[]>([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState('');
  const [interactionId, setInteractionId] = useState('');
  const [caseId, setCaseId] = useState('');
  const [note, setNote] = useState('');
  const [outcome, setOutcome] = useState('resolved');
  const [auditSummary, setAuditSummary] = useState<string[]>([]);

  useEffect(() => {
    api.get<{ items: Customer[] }>('/customers?pageSize=50').then((r) => setCustomers(r.items));
    api.get<{ items: WorkflowDefinition[] }>('/workflows').then((r) => setWorkflows(r.items));
  }, []);

  function startInteraction() {
    api
      .post<{ ok: true; data: Interaction }>('/interactions', {
        customerId,
        channel,
        reason,
        summary: `Started interaction for ${reason}`,
        agentId: 'usr_operator1'
      })
      .then((r) => {
        setInteractionId(r.data.id);
        setAuditSummary((s) => [
          ...s,
          `Interaction ${r.data.id} started for customer ${customerId} (${channel}, ${reason})`
        ]);
        setStep('verify_identity');
      });
  }

  function startWorkflow() {
    if (!selectedWorkflow) return;
    api
      .post<{ ok: true; data: { id: string } }>(`/workflows/${selectedWorkflow}/start`, {
        customerId,
        agentId: 'usr_operator1'
      })
      .then((r) => {
        setAuditSummary((s) => [...s, `Workflow ${selectedWorkflow} started (run ${r.data.id})`]);
        setStep('create_case');
      });
  }

  function createCase() {
    api
      .post<{ ok: true; data: Case }>('/cases', {
        customerId,
        subject: `${reason} — interaction ${interactionId.slice(0, 8)}`,
        category: reason,
        description: `Created from interaction console. Workflow: ${selectedWorkflow}`,
        priority: 'normal'
      })
      .then((r) => {
        setCaseId(r.data.id);
        setAuditSummary((s) => [...s, `Case ${r.data.id} created (${reason})`]);
        setStep('add_note');
      });
  }

  function addNote() {
    if (!note.trim()) {
      setStep('close_interaction');
      return;
    }
    api
      .post<{ ok: true }>(`/cases/${caseId}/comments`, {
        body: note,
        internal: false
      })
      .then(() => {
        setAuditSummary((s) => [...s, `Note added to case ${caseId}`]);
        setStep('close_interaction');
      });
  }

  function closeInteraction() {
    api
      .post<{ ok: true }>('/interactions', {
        customerId,
        channel,
        reason,
        summary: `Closed. Outcome: ${outcome}`,
        agentId: 'usr_operator1'
      })
      .then(() => {
        setAuditSummary((s) => [...s, `Interaction closed with outcome "${outcome}"`]);
        setStep('close_interaction');
      });
    // Mark as done in UI even if second interaction is created.
    setStep('close_interaction');
  }

  function reset() {
    setStep('select_customer');
    setCustomerId('');
    setInteractionId('');
    setCaseId('');
    setNote('');
    setIdentityVerified(false);
    setAuditSummary([]);
  }

  return (
    <div>
      <h1 className="page-title">Interaction Console</h1>
      <p className="page-subtitle">
        Guided operator flow: select customer → verify identity → choose reason → run workflow → create case → add note
        → close.
      </p>

      <div className="banner accent">
        Demo mode: the console consumes the synthetic API. The role is sent as <code>x-legacyops-role: admin</code> by
        the web client.
      </div>

      <div className="panel mb">
        <h3>Stepper</h3>
        <div className="stepper">
          {(
            [
              ['select_customer', 'Select customer'],
              ['verify_identity', 'Verify identity'],
              ['choose_reason', 'Choose reason'],
              ['run_workflow', 'Run workflow'],
              ['create_case', 'Create case'],
              ['add_note', 'Add note'],
              ['close_interaction', 'Close interaction']
            ] as [Step, string][]
          ).map(([s, label]) => (
            <div
              key={s}
              className={`step ${step === s ? 'active' : auditSummary.some((a) => a.toLowerCase().includes(label.toLowerCase().split(' ')[0])) ? 'completed' : ''}`}
            >
              <div className="step-id">{s}</div>
              <div className="step-label">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {step === 'select_customer' && (
        <div className="panel mb">
          <h3>1. Select customer</h3>
          <div className="col">
            <label className="muted">Customer</label>
            <select className="select" value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
              <option value="">— pick a customer —</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.displayName} ({c.segment})
                </option>
              ))}
            </select>
            <label className="muted">Channel</label>
            <select
              className="select"
              value={channel}
              onChange={(e) => setChannel(e.target.value as Interaction['channel'])}
            >
              {CHANNELS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <button className="btn" disabled={!customerId} onClick={startInteraction}>
              Start interaction
            </button>
          </div>
        </div>
      )}

      {step === 'verify_identity' && (
        <div className="panel mb">
          <h3>2. Verify identity</h3>
          <p className="muted">
            Ask the customer for their document number or DOB. Tick the checkbox to confirm identity before proceeding.
          </p>
          <label className="row" style={{ gap: 8 }}>
            <input type="checkbox" checked={identityVerified} onChange={(e) => setIdentityVerified(e.target.checked)} />
            <span>Identity verified</span>
          </label>
          <button className="btn" disabled={!identityVerified} onClick={() => setStep('choose_reason')}>
            Continue
          </button>
        </div>
      )}

      {step === 'choose_reason' && (
        <div className="panel mb">
          <h3>3. Choose reason</h3>
          <div className="col">
            <label className="muted">Reason</label>
            <select className="select" value={reason} onChange={(e) => setReason(e.target.value)}>
              {REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            <button className="btn" onClick={() => setStep('run_workflow')}>
              Continue
            </button>
          </div>
        </div>
      )}

      {step === 'run_workflow' && (
        <div className="panel mb">
          <h3>4. Run workflow</h3>
          <div className="col">
            <label className="muted">Workflow</label>
            <select className="select" value={selectedWorkflow} onChange={(e) => setSelectedWorkflow(e.target.value)}>
              <option value="">— pick a workflow —</option>
              {workflows.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
            <button className="btn" disabled={!selectedWorkflow} onClick={startWorkflow}>
              Start workflow
            </button>
            <button className="btn secondary" onClick={() => setStep('create_case')}>
              Skip workflow
            </button>
          </div>
        </div>
      )}

      {step === 'create_case' && (
        <div className="panel mb">
          <h3>5. Create case</h3>
          <p className="muted">
            A new case will be created for customer <strong>{customerId}</strong> with reason <strong>{reason}</strong>.
          </p>
          <button className="btn" onClick={createCase}>
            Create case
          </button>
        </div>
      )}

      {step === 'add_note' && (
        <div className="panel mb">
          <h3>6. Add note</h3>
          <textarea
            className="textarea"
            rows={4}
            placeholder="Optional. Will be added as a comment to the case."
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <button className="btn mt" onClick={addNote}>
            Save note & continue
          </button>
        </div>
      )}

      {step === 'close_interaction' && (
        <div className="panel mb">
          <h3>7. Close interaction</h3>
          <div className="col">
            <label className="muted">Outcome</label>
            <select className="select" value={outcome} onChange={(e) => setOutcome(e.target.value)}>
              <option value="resolved">Resolved</option>
              <option value="escalated">Escalated</option>
              <option value="follow_up">Follow-up required</option>
              <option value="unresolved">Unresolved</option>
            </select>
            <button className="btn" onClick={closeInteraction}>
              Close interaction
            </button>
            <button className="btn secondary" onClick={reset}>
              Start new interaction
            </button>
            {caseId && (
              <button className="btn secondary" onClick={() => navigate(`/customers/${customerId}`)}>
                View customer 360
              </button>
            )}
          </div>
        </div>
      )}

      <div className="panel">
        <h3>Audit summary</h3>
        {auditSummary.length === 0 ? (
          <p className="muted">No actions yet.</p>
        ) : (
          <ul className="list-clean">
            {auditSummary.map((s, i) => (
              <li key={i} className="row between">
                <span>{s}</span>
                <span className="pill ok">audited</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
