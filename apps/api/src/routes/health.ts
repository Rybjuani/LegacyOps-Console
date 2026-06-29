import type { FastifyInstance } from 'fastify';
import type { AppState } from '../state.js';

export async function registerHealthRoutes(app: FastifyInstance, _state: AppState) {
  app.get('/health', async () => {
    return { status: 'ok', service: 'legacyops-api', time: new Date().toISOString() };
  });
}
