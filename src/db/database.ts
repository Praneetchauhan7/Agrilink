// Postgres-backed data layer (Supabase). Provides the same primitive API
// (queryAll, queryOne, execute, getDb) that the rest of the app expects,
// so the existing query functions in queries.ts don't need to change shape,
// only await their (now async) results.
import { Pool, type QueryResultRow } from 'pg';

declare global {
  // eslint-disable-next-line no-var
  var _pgPool: Pool | undefined;
}

export type QueryParam = string | number | boolean | null | undefined;

function getPool(): Pool {
  if (!global._pgPool) {
    global._pgPool = new Pool({
      host: process.env.SQL_HOST,
      port: process.env.SQL_PORT ? parseInt(process.env.SQL_PORT, 10) : 5432,
      user: process.env.SQL_USER,
      password: process.env.SQL_PASSWORD,
      database: process.env.SQL_DB_NAME,
      max: 10,
      connectionTimeoutMillis: 15000,
      ssl: process.env.SQL_SSL === 'false' ? false : { rejectUnauthorized: false },
    });
    global._pgPool.on('error', (err) => {
      console.error('Unexpected error on idle Postgres pool client:', err);
    });
  }
  return global._pgPool;
}

/**
 * Convert SQLite-style `?` positional placeholders to Postgres `$1, $2, ...`
 */
function toPgQuery(sql: string): string {
  let i = 0;
  return sql.replace(/\?/g, () => `$${++i}`);
}

function sanitizeParams(params: QueryParam[]): (string | number | boolean | null)[] {
  return params.map((p) => (p === undefined ? null : p));
}

/**
 * Execute parameterized query returning multiple rows as plain objects
 */
export async function queryAll<T extends QueryResultRow = any>(
  sql: string,
  params: QueryParam[] = []
): Promise<T[]> {
  const pool = getPool();
  const result = await pool.query<T>(toPgQuery(sql), sanitizeParams(params));
  return result.rows;
}

/**
 * Execute parameterized query returning a single row (or null)
 */
export async function queryOne<T extends QueryResultRow = any>(
  sql: string,
  params: QueryParam[] = []
): Promise<T | null> {
  const rows = await queryAll<T>(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

/**
 * Execute INSERT, UPDATE, or DELETE with params
 */
export async function execute(sql: string, params: QueryParam[] = []): Promise<void> {
  const pool = getPool();
  await pool.query(toPgQuery(sql), sanitizeParams(params));
}

/**
 * No-op kept for backward compatibility with old SQLite call sites
 * (Postgres persists writes immediately; there's nothing to "save").
 */
export function saveDb(): void {
  // no-op
}

/**
 * Ensures the connection pool is ready. Table creation is handled by
 * Supabase migrations (see drizzle/ generated SQL), not here, since the
 * schema is already provisioned on the Supabase project.
 */
export async function getDb(): Promise<Pool> {
  const pool = getPool();
  // Verify connectivity early so failures surface at startup, not on first request.
  await pool.query('SELECT 1');
  console.log('[Postgres] Connected to Supabase database.');
  return pool;
}
