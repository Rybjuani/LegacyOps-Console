import type { FastifyInstance } from 'fastify';
import type { AppState } from '../state.js';
import { ROI_DEMO } from '@legacyops/demo-data';

export async function registerRoiRoutes(app: FastifyInstance, state: AppState) {
  app.get('/roi/demo', async () => {
    return {
      assumptions: ROI_DEMO,
      computed: state.roi
    };
  });
}
