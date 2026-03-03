-- =============================================================================
-- 001_init_extensions.sql
-- SigAI Platform — PostgreSQL extension bootstrap
--
-- Run once per database instance before any schema or table creation.
-- Target: PostgreSQL 16
-- =============================================================================

-- pgcrypto: provides gen_random_uuid() and other cryptographic helpers.
-- Note: gen_random_uuid() is also available natively since PG 13, but
-- enabling pgcrypto makes the dependency explicit and provides additional
-- functions (e.g. crypt(), gen_salt()) for future use.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- citext: case-insensitive text type — reserved for future use (e.g. email
-- lookups once the identity schema is built). Enabling now avoids a later
-- schema migration that would require rewriting affected columns.
CREATE EXTENSION IF NOT EXISTS citext;

-- pg_trgm: trigram similarity — enables GIN-backed ILIKE prefix search on
-- tag labels, asset names, and other text fields.
CREATE EXTENSION IF NOT EXISTS pg_trgm;
