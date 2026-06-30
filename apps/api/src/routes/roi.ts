import type { FastifyInstance } from 'fastify';
import type { AppState } from '../state.js';
import { ROI_DEMO } from '@legacyops/demo-data';

export interface RoiCalculationInput {
  operatorCount?: number;
  avgHandleTimeBefore?: number;
  avgHandleTimeAfter?: number;
  monthlyInteractions?: number;
  hourlyCost?: number;
  trainingDaysBefore?: number;
  trainingDaysAfter?: number;
  errorRateBefore?: number;
  errorRateAfter?: number;
  escalationRateBefore?: number;
  escalationRateAfter?: number;
  auditTimeBefore?: number;
  auditTimeAfter?: number;
}

export interface RoiCalculationResult {
  inputs: Required<RoiCalculationInput>;
  hoursSavedPerDay: number;
  monthlySavingsUsd: number;
  annualSavingsUsd: number;
  annualHoursRecovered: number;
  trainingDaysSaved: number;
  errorRateDeltaPct: number;
  escalationRateDeltaPct: number;
  auditMinutesSaved: number;
}

function withDefaults(input: RoiCalculationInput): Required<RoiCalculationInput> {
  return {
    operatorCount: input.operatorCount ?? ROI_DEMO.teamSize,
    avgHandleTimeBefore: input.avgHandleTimeBefore ?? ROI_DEMO.before.avgHandleTimeSec,
    avgHandleTimeAfter: input.avgHandleTimeAfter ?? ROI_DEMO.after.avgHandleTimeSec,
    monthlyInteractions: input.monthlyInteractions ?? 60 * 22, // 60/day * 22 working days
    hourlyCost: input.hourlyCost ?? ROI_DEMO.costPerHourUsd,
    trainingDaysBefore: input.trainingDaysBefore ?? ROI_DEMO.before.trainingWeeks * 5,
    trainingDaysAfter: input.trainingDaysAfter ?? ROI_DEMO.after.trainingWeeks * 5,
    errorRateBefore: input.errorRateBefore ?? 0.08,
    errorRateAfter: input.errorRateAfter ?? 0.04,
    escalationRateBefore: input.escalationRateBefore ?? ROI_DEMO.before.escalationRate,
    escalationRateAfter: input.escalationRateAfter ?? ROI_DEMO.after.escalationRate,
    auditTimeBefore: input.auditTimeBefore ?? ROI_DEMO.before.auditTimeMinutes,
    auditTimeAfter: input.auditTimeAfter ?? ROI_DEMO.after.auditTimeMinutes
  };
}

export function calculateRoi(input: RoiCalculationInput): RoiCalculationResult {
  const i = withDefaults(input);
  const ahtDeltaSec = Math.max(0, i.avgHandleTimeBefore - i.avgHandleTimeAfter);
  // hoursSavedPerDay = (ahtDelta * monthlyInteractions / 60 minutes per hour / 22 days) * operatorCount
  // But simpler: ahtDelta * interactionsPerAgentPerDay * operatorCount / 3600
  const interactionsPerAgentPerDay = Math.round(i.monthlyInteractions / 22);
  const hoursSavedPerDay = (ahtDeltaSec * interactionsPerAgentPerDay * i.operatorCount) / 3600;
  const monthlySavingsUsd = hoursSavedPerDay * 22 * i.hourlyCost;
  const annualSavingsUsd = monthlySavingsUsd * 12;
  const annualHoursRecovered = hoursSavedPerDay * 22 * 12;
  const trainingDaysSaved = Math.max(0, i.trainingDaysBefore - i.trainingDaysAfter);
  const errorRateDeltaPct = Math.round((i.errorRateBefore - i.errorRateAfter) * 100);
  const escalationRateDeltaPct = Math.round((i.escalationRateBefore - i.escalationRateAfter) * 100);
  const auditMinutesSaved = Math.max(0, i.auditTimeBefore - i.auditTimeAfter);
  return {
    inputs: i,
    hoursSavedPerDay: Math.round(hoursSavedPerDay),
    monthlySavingsUsd: Math.round(monthlySavingsUsd),
    annualSavingsUsd: Math.round(annualSavingsUsd),
    annualHoursRecovered: Math.round(annualHoursRecovered),
    trainingDaysSaved,
    errorRateDeltaPct,
    escalationRateDeltaPct,
    auditMinutesSaved
  };
}

export async function registerRoiRoutes(app: FastifyInstance, state: AppState) {
  app.get('/roi/demo', async () => {
    return {
      assumptions: ROI_DEMO,
      computed: state.roi
    };
  });

  app.post('/roi/calculate', async (req, reply) => {
    const body = (req.body as RoiCalculationInput | null) ?? {};
    // Light validation: numbers must be non-negative where applicable.
    for (const [k, v] of Object.entries(body)) {
      if (typeof v === 'number' && v < 0) {
        return reply
          .status(400)
          .send({ ok: false, error: { code: 'BAD_REQUEST', message: `${k} must be non-negative` } });
      }
    }
    const result = calculateRoi(body);
    return { ok: true, data: result };
  });
}
