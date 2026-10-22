import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pool } from './client.js';

const migrationId = '0001_study_features';
const migrationPath = resolve(process.cwd(), 'drizzle', `${migrationId}.sql`);
const client = await pool.connect();

try {
  await client.query('BEGIN');
  await client.query(`CREATE TABLE IF NOT EXISTS axon_refont_migrations (
    id text PRIMARY KEY,
    applied_at timestamptz NOT NULL DEFAULT now()
  )`);
  const alreadyApplied = await client.query('SELECT id FROM axon_refont_migrations WHERE id = $1', [
    migrationId,
  ]);
  if (alreadyApplied.rowCount) {
    console.log(`Migration ${migrationId} déjà appliquée.`);
  } else {
    const sql = await readFile(migrationPath, 'utf8');
    await client.query(sql);
    await client.query('INSERT INTO axon_refont_migrations (id) VALUES ($1)', [migrationId]);
    console.log(
      `Migration ${migrationId} appliquée (tables ajoutées sans toucher aux données existantes).`,
    );
  }
  await client.query('COMMIT');
} catch (error) {
  await client.query('ROLLBACK');
  throw error;
} finally {
  client.release();
  await pool.end();
}
