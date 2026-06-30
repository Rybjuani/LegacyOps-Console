# Siebel Modernization ROI Model

> How LegacyOps Console measures the financial impact of modernizing a
> Siebel-like CRM. This is the model used by the demo, the pilot and the
> production rollout. Companion to `docs/ROI_METRICS.md`.

---

## 1. Why ROI matters

A Siebel-like customer will not modernize based on a "better UI" claim.
They need a defensible financial model that answers:

- How much money are we losing today by operating the legacy CRM?
- How much will we save by adding LegacyOps on top?
- How fast does the investment pay back?
- What is the risk-adjusted return?

LegacyOps ships a transparent ROI model that answers all four questions
using the customer's own numbers.

---

## 2. Inputs

The model accepts the following inputs. Defaults are conservative
synthetic values; pilots replace them with measured baselines.

| Input | Default | Description |
|---|---|---|
| `operatorCount` | 250 | Number of call center operators. |
| `avgHandleTimeBefore` | 480 sec | AHT before LegacyOps. |
| `avgHandleTimeAfter` | 320 sec | AHT after LegacyOps. |
| `monthlyInteractions` | 1320 | Interactions per operator per month. |
| `hourlyCost` | USD 18 | Loaded cost per operator hour. |
| `trainingDaysBefore` | 30 | Training days before LegacyOps (6 weeks × 5). |
| `trainingDaysAfter` | 15 | Training days after LegacyOps (3 weeks × 5). |
| `errorRateBefore` | 8% | Operator error rate before. |
| `errorRateAfter` | 4% | Operator error rate after. |
| `escalationRateBefore` | 18% | Escalation rate before. |
| `escalationRateAfter` | 10% | Escalation rate after. |
| `auditTimeBefore` | 240 min | Minutes to extract an audit trail before. |
| `auditTimeAfter` | 90 min | Minutes to extract an audit trail after. |

---

## 3. Outputs

The model produces:

| Output | Formula |
|---|---|
| `hoursSavedPerDay` | (AHT delta × interactionsPerAgentPerDay × operatorCount) / 3600 |
| `monthlySavingsUsd` | hoursSavedPerDay × 22 × hourlyCost |
| `annualSavingsUsd` | monthlySavingsUsd × 12 |
| `annualHoursRecovered` | hoursSavedPerDay × 22 × 12 |
| `trainingDaysSaved` | trainingDaysBefore − trainingDaysAfter |
| `errorRateDeltaPct` | (errorRateBefore − errorRateAfter) × 100 |
| `escalationRateDeltaPct` | (escalationRateBefore − escalationRateAfter) × 100 |
| `auditMinutesSaved` | auditTimeBefore − auditTimeAfter |

---

## 4. Worked example (default inputs)

- AHT delta: 160 sec per interaction.
- Interactions per agent per day: 60.
- Hours saved per day per agent: 160 × 60 / 3600 ≈ 2.67 hours.
- Hours saved per day (250 agents): ≈ 667 hours.
- Monthly savings (22 working days × USD 18/hour): ≈ USD 264,000.
- Annual savings: ≈ USD 3.17M.

These numbers are conservative. The same model accepts the customer's
real AHT, FCR and hourly cost through `POST /roi/calculate`.

---

## 5. Risk-adjusted return

Not all savings are realized on day one. A realistic risk adjustment:

| Phase | Realization | Notes |
|---|---|---|
| Stage 2 (read-only overlay) | 10% | Operators learn the new UI; some AHT reduction. |
| Stage 3 (workflow wrapper) | 30% | Guided workflows reduce AHT and errors. |
| Stage 4 (controlled write-back) | 60% | Less duplicate data entry. |
| Stage 5 (partial replacement) | 90% | Full operational ownership. |
| Stage 6 (full migration) | 100% | Legacy retired for the module. |

Multiply the annual savings by the realization percentage to get the
risk-adjusted return per stage.

---

## 6. Cost of pilot

The pilot cost is dominated by:

- LegacyOps implementation work (real Siebel adapter, persistence, SSO).
- Customer IT time (sandbox access, service accounts, network).
- Training time for operators.
- Audit / compliance review.

A typical 8-week pilot costs USD 50k–150k depending on scope. With the
default ROI model, the pilot pays back in <1 month of stage 5.

---

## 7. What the model does NOT include

- License cost savings from retiring Siebel modules (these come later and are customer-specific).
- Reduced attrition from happier operators.
- Reduced compliance fines from better audit.
- Faster time-to-market for new products.

These are real but harder to quantify. They are presented as upside, not
as part of the base case.

---

## 8. How to use the model in a sales conversation

1. Show the default numbers in the demo.
2. Ask the customer for their real AHT, operator count and hourly cost.
3. Use `POST /roi/calculate` with their numbers — the result updates live.
4. Multiply by the stage realization percentage to set expectations.
5. Compare the annual savings to the pilot cost.
6. If the multiple is ≥ 5x, propose a stage-2 pilot.

---

## 9. Reference

- `docs/ROI_METRICS.md`
- `docs/PILOT_PLAYBOOK_SIEBEL.md`
- `docs/ENTERPRISE_PILOT_CHECKLIST.md`
- `apps/api/src/routes/roi.ts`
