import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import type { Case, Customer, Interaction, WorkflowDefinition } from '@legacyops/domain';
import { ErrorState, LoadingState, SectionHeader, SuccessBanner } from '../components/ui';

type Step =
  | 'select_customer'
  | 'verify_identity'
  | 'choose_reason'
  | 'run_workflow'
  | 'create_case'
  | 'add_note'
  | 'close_interaction';

const STEP_LABELS: [Step, string, string][] = [
  ['select_customer', 'Select customer', 'Pick the customer you are talking to.'],
  ['verify_identity', 'Verify identity', 'Confirm the customer identity before proceeding.'],
  ['choose_reason', 'Choose reason', 'Why is the customer contacting us?'],
  ['run_workflow', 'Recommended workflow', 'Launch the guided workflow that fits this reason.'],
  ['create_case', 'Create case', 'Open a case to track this interaction.'],
  ['add_note', 'Add note', 'Leave an optional note for the case.'],
  ['close_interaction', 'Close', 'Close the interaction and record the outcome.']
];

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
  const [success, setSuccess] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    api.get<{ items: Customer[] }>('/customers?pageSize=50').then((r) => setCustomers(r.items));
    api.get<{ items: WorkflowDefinition[] }>('/workflows').then((r) => setWorkflows(r.items));
  }, []);

  function flash(msg: string) {
    setSuccess(msg);
    setTimeout(() => setSuccess(null), 3000);
  }

  function startInteraction() {
    setErr(null);
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
        flash('Interaction started.');
        setStep('verify_identity');
      })
      .catch((e) => setErr(String(e)));
  }

  function startWorkflow() {
    if (!selectedWorkflow) return;
    setErr(null);
    api
      .post<{ ok: true; data: { id: string } }>(`/workflows/${selectedWorkflow}/start`, {
        customerId,
        agentId: 'usr_operator1'
      })
      .then((r) => {
        setAuditSummary((s) => [...s, `Workflow ${selectedWorkflow} started (run ${r.data.id})`]);
        flash('Workflow started.');
        setStep('create_case');
      })
      .catch((e) => setErr(String(e)));
  }

  function createCase() {
    setErr(null);
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
        flash('Case created.');
        setStep('add_note');
      })
      .catch((e) => setErr(String(e)));
  }

  function addNote() {
    if (!note.trim()) {
      setStep('close_interaction');
      return;
    }
    setErr(null);
    api
      .post<{ ok: true }>(`/cases/${caseId}/comments`, {
        body: note,
        internal: false
      })
      .then(() => {
        setAuditSummary((s) => [...s, `Note added to case ${caseId}`]);
        flash('Note saved.');
        setStep('close_interaction');
      })
      .catch((e) => setErr(String(e)));
  }

  function closeInteraction() {
    setAuditSummary((s) => [...s, `Interaction closed with outcome "${outcome}"`]);
    flash('Interaction closed.');
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
    setSuccess(null);
    setErr(null);
  }

  if (customers.length === 0) return <LoadingState />;

  return (
    <div>
      <SectionHeader
        title="Guided Interaction"
        subtitle="Follow the steps to verify the customer, run the right workflow and create an auditable case."
      />

      {success && <SuccessBanner>{success}</SuccessBanner>}
      {err && <ErrorState message={err} />}

      <div className="panel mb">
        <h3>Steps</h3>
        <div className="stepper">
          {STEP_LABELS.map(([s, label, help]) => {
            const isDone = auditSummary.some((a) => a.toLowerCase().includes(label.toLowerCase().split(' ')[0]));
            const isCurrent = step === s;
            return (
              <div key={s} className={`step ${isCurrent ? 'active' : isDone ? 'completed' : ''}`}>
                <div className="step-id">{isDone ? '✓' : s.replace(/_/g, ' ')}</div>
                <div className="step-label">{label}</div>
                <div className="muted" style={{ fontSize: 11 }}>
                  {help}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-2">
        <div>
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
                Ask the customer for their document number or date of birth. Tick the box once confirmed.
              </p>
              <label className="row" style={{ gap: 8 }}>
                <input
                  type="checkbox"
                  checked={identityVerified}
                  onChange={(e) => setIdentityVerified(e.target.checked)}
                />
                <span>Identity verified</span>
              </label>
              <button
                className="btn"
                disabled={!identityVerified}
                onClick={() => setStep('choose_reason')}
                style={{ marginTop: 8 }}
              >
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
                      {r.replace(/_/g, ' ')}
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
              <h3>4. Recommended workflow</h3>
              <div className="col">
                <label className="muted">Workflow</label>
                <select
                  className="select"
                  value={selectedWorkflow}
                  onChange={(e) => setSelectedWorkflow(e.target.value)}
                >
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
                A case will be created for customer <strong>{customerId}</strong> with reason <strong>{reason}</strong>.
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
              <h3>7. Close</h3>
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
        </div>

        <div>
          <div className="panel mb">
            <h3>Summary</h3>
            <table>
              <tbody>
                <tr>
                  <th>Customer</th>
                  <td className="muted">
                    {customerId ? (customers.find((c) => c.id === customerId)?.displayName ?? customerId) : '—'}
                  </td>
                </tr>
                <tr>
                  <th>Channel</th>
                  <td className="muted">{channel}</td>
                </tr>
                <tr>
                  <th>Reason</th>
                  <td className="muted">{reason}</td>
                </tr>
                <tr>
                  <th>Workflow</th>
                  <td className="muted">{selectedWorkflow || '—'}</td>
                </tr>
                <tr>
                  <th>Case ID</th>
                  <td className="muted">{caseId || '—'}</td>
                </tr>
                <tr>
                  <th>Status</th>
                  <td>
                    <span
                      className={`pill ${step === 'close_interaction' && auditSummary.some((a) => a.includes('closed')) ? 'ok' : 'accent'}`}
                    >
                      {step === 'close_interaction' && auditSummary.some((a) => a.includes('closed'))
                        ? 'Closed'
                        : 'In progress'}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

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
      </div>

      <details style={{ marginTop: 16 }}>
        <summary className="muted" style={{ cursor: 'pointer', fontSize: 12 }}>
          Developer note
        </summary>
        <p className="muted" style={{ marginTop: 8, fontSize: 12 }}>
          The web client sends <code>x-legacyops-role: admin</code> so the demo can access every endpoint. This is
          demo-only and will be replaced by real SSO/OIDC/SAML (issue #1).
        </p>
      </details>
    </div>
  );
}
