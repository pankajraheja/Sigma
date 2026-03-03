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

  ai: {
    openaiApiKey: process.env['OPENAI_API_KEY'] ?? '',
    // Azure OpenAI — set all three to activate Azure mode
    azureEndpoint: process.env['AZURE_OPENAI_ENDPOINT'] ?? '',
    azureDeployment: optional('AZURE_OPENAI_DEPLOYMENT', 'gpt-4o-mini'),
    azureApiVersion: optional('AZURE_OPENAI_API_VERSION', '2024-12-01-preview'),
    // When Azure is active, OPENAI_MODEL is ignored; azureDeployment is used instead
    model: optional('OPENAI_MODEL', 'gpt-4o-mini'),
    // Fallback standard OpenAI key — used when Azure fails, before stub
    openaiFallbackKey: process.env['OPENAI_FALLBACK_KEY'] ?? '',
    summaryTtlMs: parseInt(optional('AI_SUMMARY_TTL_MS', '1800000'), 10),
    recTtlMs: parseInt(optional('AI_REC_TTL_MS', '900000'), 10),
    enrichTtlMs: parseInt(optional('AI_ENRICH_TTL_MS', '900000'), 10),
  },

  version: optional('APP_VERSION', '0.1.0'),
} as const;

export type Config = typeof config;
