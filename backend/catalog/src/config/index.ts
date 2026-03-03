// ---------------------------------------------------------------------------
// Application configuration — reads from environment variables
// ---------------------------------------------------------------------------

function optional(key: string, fallback: string): string {
  return process.env[key] ?? fallback;
}

export const config = {
  env: optional('NODE_ENV', 'development') as 'development' | 'production' | 'test',
  port: parseInt(optional('PORT', '3001'), 10),
  apiPrefix: optional('API_PREFIX', '/api/catalog'),

  db: {
    // DATABASE_URL takes precedence when set.
    // Format: postgresql://user:password@host:port/dbname
    url: optional('DATABASE_URL', ''),
    host: optional('DB_HOST', 'localhost'),
    port: parseInt(optional('DB_PORT', '5432'), 10),
    name: optional('DB_NAME', 'sigai'),
    user: optional('DB_USER', 'sigai'),
    password: process.env['DB_PASSWORD'] ?? 'pgadmin',
    poolMin: parseInt(optional('DB_POOL_MIN', '2'), 10),
    poolMax: parseInt(optional('DB_POOL_MAX', '10'), 10),
    ssl: optional('DB_SSL', 'false') === 'true',
  },

  cors: {
    origins: optional('CORS_ORIGINS', 'http://localhost:5173').split(','),
  },

  version: optional('APP_VERSION', '0.1.0'),
} as const;

export type Config = typeof config;
