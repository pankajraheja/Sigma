// ---------------------------------------------------------------------------
// Health Service — aggregates infrastructure checks
// ---------------------------------------------------------------------------

import { healthRepository } from '../repositories/health.repository.js';
import { config } from '../config/index.js';
import type { HealthResponse, HealthCheck, HealthStatus } from '../models/api.types.js';

export const healthService = {
  async check(): Promise<HealthResponse> {
    const checks: HealthCheck[] = [];

    // Database check
    try {
      const { latencyMs } = await healthRepository.pingDb();
      checks.push({ service: 'database', status: 'ok', latencyMs });
    } catch (err) {
      checks.push({
        service: 'database',
        status: 'down',
        latencyMs: null,
        error: err instanceof Error ? err.message : 'Unknown DB error',
      });
    }

    const overallStatus: HealthStatus = checks.every((c) => c.status === 'ok')
      ? 'ok'
      : checks.some((c) => c.status === 'down')
        ? 'down'
        : 'degraded';

    return {
      status: overallStatus,
      version: config.version,
      timestamp: new Date().toISOString(),
      checks,
    };
  },
};
