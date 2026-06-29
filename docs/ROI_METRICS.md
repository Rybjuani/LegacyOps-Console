# ROI Metrics

> How LegacyOps measures operational savings. The template below is the
> same in the demo and in the pilot — prospects plug in their own
> numbers.

---

## 1. KPIs measured

| KPI | Definition | Why it matters |
|---|---|---|
| Average Handle Time (AHT) | Seconds from interaction start to close | Lower AHT = more interactions per agent per day |
| First Contact Resolution (FCR) | % of interactions resolved without a follow-up | Higher FCR = fewer repeat contacts, happier customers |
| Escalation rate | % of cases escalated to a senior team | Lower escalations = less senior time wasted |
| Screens per interaction | Number of screens an agent opens | Fewer screens = less cognitive load |
| Clicks per interaction | Number of clicks per interaction | Fewer clicks = faster operation |
| Training time | Weeks until an agent is productive | Lower training = faster onboarding, lower cost |
| Audit time | Minutes to extract an audit trail for a case | Lower audit time = cheaper compliance |
| Operator satisfaction | 1–5 self-reported | Higher satisfaction = lower attrition |

---

## 2. Synthetic baseline (shipped with the demo)

| Metric | Before | After | Delta |
|---|---|---|---|
| Avg handle time (sec) | 480 | 320 | −33% |
| Screens per interaction | 9 | 4 | −5 |
| Clicks per interaction | 22 | 9 | −13 |
| First contact resolution | 62% | 78% | +16pp |
| Escalation rate | 18% | 10% | −8pp |
| Training weeks | 6 | 3 | −3 |
| Audit time (min) | 240 | 90 | −62% |

These numbers are conservative synthetic estimates. Real pilots produce
real numbers using the same template.

---

## 3. ROI calculation

```
AHT delta (sec)         = before.AHT - after.AHT
Hours saved per day     = (AHT delta × interactionsPerDay × teamSize) / 3600
Monthly savings (USD)   = hoursSavedPerDay × 22 × costPerHourUsd
Audit savings per session = (before.auditMin - after.auditMin)/60 × auditTeamSize × auditCostPerHourUsd
```

Default assumptions:

- Team size: 250 agents
- Cost per agent hour: USD 18
- Interactions per day per agent: 60
- Audit team size: 4
- Audit cost per hour: USD 32

Under these assumptions, the synthetic baseline produces approximately
**USD 1.32M / month in operational savings** plus audit savings per
session.

---

## 4. Pilot template

For a real pilot, replace the synthetic numbers with measured ones:

| Field | Source |
|---|---|
| `before.AHT` | AHT report from the legacy CRM, last 30 days |
| `after.AHT` | AHT report from LegacyOps, after 4 weeks of pilot |
| `before.FCR` | CRM reporting |
| `after.FCR` | LegacyOps audit log + post-interaction survey |
| `before.escalationRate` | CRM reporting |
| `after.escalationRate` | LegacyOps case audit log |
| `teamSize` | Customer-provided |
| `costPerHourUsd` | Customer-provided |
| `auditTeamSize` | Customer-provided |
| `auditCostPerHourUsd` | Customer-provided |

The same calculation runs in `packages/demo-data/src/index.ts → computeRoi`
and is exposed at `GET /roi/demo`.

---

## 5. Reporting cadence

| Cadence | Report | Audience |
|---|---|---|
| Daily | AHT, FCR, escalations | Operations, call center |
| Weekly | ROI delta vs baseline | Operations director |
| End of pilot | Full ROI report | Buyer committee |

---

## 6. Anti-patterns

- ❌ Reporting ROI before the pilot has measured real numbers.
- ❌ Counting “training weeks saved” without an actual training cohort.
- ❌ Mixing operational savings with license-cost savings.
- ❌ Claiming savings without an audit-trail-backed measurement.
- ❌ Using the synthetic numbers as a quote. They are illustrative only.

---

## 7. Reference

- `packages/demo-data/src/index.ts → ROI_DEMO, computeRoi`
- `apps/api/src/routes/roi.ts`
- `apps/web/src/pages/RoiPage.tsx`
- `docs/PILOT_PLAYBOOK_SIEBEL.md`
