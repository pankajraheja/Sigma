// ---------------------------------------------------------------------------
// Database connection adapter — pg.Pool
//
// All repositories import `db` from here.
// Connection is configured via environment variables (see config/index.ts).
// ---------------------------------------------------------------------------

import { Pool } from 'pg';
import type { PoolConfig } from 'pg';
import { config } from './index.js';

// ---------------------------------------------------------------------------
// Query result type (mirrors pg.QueryResult, rowCount normalised to number)
// ---------------------------------------------------------------------------

export interface QueryResult<T = Record<string, unknown>> {
  rows: T[];
  rowCount: number;
}

// ---------------------------------------------------------------------------
// DbAdapter interface — repositories depend on this, not on pg directly
// ---------------------------------------------------------------------------

export interface DbAdapter {
  query<T = Record<string, unknown>>(
    sql: string,
    params?: unknown[],
  ): Promise<QueryResult<T>>;
  ping(): Promise<void>;
}

// ---------------------------------------------------------------------------
// Real pg.Pool adapter
// ---------------------------------------------------------------------------

class PgPoolAdapter implements DbAdapter {
  private readonly pool: Pool;

  constructor() {
    const poolConfig: PoolConfig = config.db.url
      ? { connectionString: config.db.url }
      : {
          host: config.db.host,
          port: config.db.port,
          database: config.db.name,
          user: config.db.user,
          password: config.db.password,
          min: config.db.poolMin,
          max: config.db.poolMax,
          ssl: config.db.ssl ? { rejectUnauthorized: false } : false,
        };

    this.pool = new Pool(poolConfig);

    this.pool.on('error', (err) => {
      console.error('[DB] Unexpected pool client error:', err.message);
    });
  }

  async query<T = Record<string, unknown>>(
    sql: string,
    params?: unknown[],
  ): Promise<QueryResult<T>> {
    // pg's query<T> constrains T extends QueryResultRow; we call without generic
    // and cast rows — the caller supplies the correct shape via the type param.
    const result = await this.pool.query(sql, params);
    return { rows: result.rows as T[], rowCount: result.rowCount ?? 0 };
  }

  async ping(): Promise<void> {
    await this.pool.query('SELECT 1');
  }
}

// ---------------------------------------------------------------------------
// Exported singleton
// ---------------------------------------------------------------------------

export const db: DbAdapter = new PgPoolAdapter();
