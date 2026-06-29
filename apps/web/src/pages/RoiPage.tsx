import { useEffect, useState } from 'react';
import { api } from '../api/client';

interface Roi {
  assumptions: {
    before: Record<string, number>;
    after: Record<string, number>;
    teamSize: number;
    costPerHourUsd: number;
    auditTeamSize: number;
    auditCostPerHourUsd: number;
  };
  computed: {
    ahtDeltaSec: number;
    ahtDeltaPct: number;
    screensDelta: number;
    clicksDelta: number;
    fcrUpliftPct: number;
    escalationDropPct: number;
    trainingWeeksSaved: number;
    hoursSavedPerDay: number;
    monthlySavingsUsd: number;
    auditSavingsPerSessionUsd: number;
  };
}

export function RoiPage() {
  const [roi, setRoi] = useState<Roi | null>(null);
  useEffect(() => { api.get<Roi>('/roi/demo').then(setRoi); }, []);
  if (!roi) return <div className="muted">Loading…</div>;

  const b = roi.assumptions.before;
  const a = roi.assumptions.after;

  return (
    <div>
      <h1 className="page-title">ROI Metrics</h1>
      <p className="page-subtitle">
        Synthetic before/after comparison. The same template is shipped to pilots so prospects can plug in their own numbers.
      </p>

      <div className="grid grid-4 mb">
        <div className="panel kpi"><span className="label">AHT reduction</span><span className="value">{roi.computed.ahtDeltaPct}%</span><span className="delta">−{roi.computed.ahtDeltaSec}s</span></div>
        <div className="panel kpi"><span className="label">FCR uplift</span><span className="value">+{roi.computed.fcrUpliftPct}pp</span></div>
        <div className="panel kpi"><span className="label">Escalation drop</span><span className="value">−{roi.computed.escalationDropPct}pp</span></div>
        <div className="panel kpi"><span className="label">Training weeks saved</span><span className="value">{roi.computed.trainingWeeksSaved}</span></div>
        <div className="panel kpi"><span className="label">Screens saved / interaction</span><span className="value">{roi.computed.screensDelta}</span></div>
        <div className="panel kpi"><span className="label">Clicks saved / interaction</span><span className="value">{roi.computed.clicksDelta}</span></div>
        <div className="panel kpi"><span className="label">Hours saved / day</span><span className="value">{Math.round(roi.computed.hoursSavedPerDay)}</span></div>
        <div className="panel kpi"><span className="label">Monthly savings (USD)</span><span className="value">${roi.computed.monthlySavingsUsd.toLocaleString()}</span></div>
      </div>

      <div className="grid grid-2">
        <div className="panel">
          <h3>Before vs After</h3>
          <table>
            <thead><tr><th>Metric</th><th>Before</th><th>After</th></tr></thead>
            <tbody>
              <tr><td>Avg handle time (sec)</td><td>{b.avgHandleTimeSec}</td><td>{a.avgHandleTimeSec}</td></tr>
              <tr><td>Screens per interaction</td><td>{b.screensPerInteraction}</td><td>{a.screensPerInteraction}</td></tr>
              <tr><td>Clicks per interaction</td><td>{b.clicksPerInteraction}</td><td>{a.clicksPerInteraction}</td></tr>
              <tr><td>First contact resolution</td><td>{(b.firstContactResolution * 100).toFixed(0)}%</td><td>{(a.firstContactResolution * 100).toFixed(0)}%</td></tr>
              <tr><td>Escalation rate</td><td>{(b.escalationRate * 100).toFixed(0)}%</td><td>{(a.escalationRate * 100).toFixed(0)}%</td></tr>
              <tr><td>Training weeks</td><td>{b.trainingWeeks}</td><td>{a.trainingWeeks}</td></tr>
              <tr><td>Audit time (min)</td><td>{b.auditTimeMinutes}</td><td>{a.auditTimeMinutes}</td></tr>
            </tbody>
          </table>
        </div>
        <div className="panel">
          <h3>Assumptions</h3>
          <ul className="list-clean">
            <li>Team size: <strong>{roi.assumptions.teamSize}</strong> agents</li>
            <li>Cost per agent hour: <strong>${roi.assumptions.costPerHourUsd}</strong></li>
            <li>Audit team size: <strong>{roi.assumptions.auditTeamSize}</strong> people</li>
            <li>Audit cost per hour: <strong>${roi.assumptions.auditCostPerHourUsd}</strong></li>
            <li>Audit savings per session: <strong>${roi.computed.auditSavingsPerSessionUsd}</strong></li>
          </ul>
          <p className="muted" style={{ marginTop: 12 }}>
            These are conservative synthetic numbers. The same template is shipped to pilots so prospects can
            plug in their own AHT, FCR, escalation and cost-per-hour figures. See <code>docs/ROI_METRICS.md</code>.
          </p>
        </div>
      </div>
    </div>
  );
}
