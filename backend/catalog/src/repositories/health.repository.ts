// ---------------------------------------------------------------------------
// Health Repository — infrastructure-level checks
// ---------------------------------------------------------------------------

import { db } from '../config/database.js';

export const healthRepository = {
  // -------------------------------------------------------------------------
  // Database ping — SELECT 1 via the adapter
  // -------------------------------------------------------------------------
  async pingDb(): Promise<{ latencyMs: number }> {
    const start = Date.now();
    await db.ping();
    return { latencyMs: Date.now() - start };
  },
};
