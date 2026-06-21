// db.js — PostgreSQL connection pool + schema bootstrap.
import pg from "pg";

const { Pool } = pg;
const connectionString = process.env.DATABASE_URL;
if (!connectionString) console.warn("[db] DATABASE_URL not set. Copy server/.env.example to server/.env.");

const needsSsl = connectionString && !/localhost|127\.0\.0\.1/.test(connectionString);
export const pool = new Pool({ connectionString, ssl: needsSsl ? { rejectUnauthorized: false } : false });

export async function initDb() {
  await pool.query(`
    CREATE EXTENSION IF NOT EXISTS pgcrypto;

    CREATE TABLE IF NOT EXISTS users (
      id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email         TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name          TEXT,
      region        TEXT NOT NULL,
      theme         TEXT NOT NULL DEFAULT 'light',
      goal_kg       INTEGER,
      created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS entries (
      id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      day        DATE NOT NULL,
      category   TEXT NOT NULL,
      item       TEXT NOT NULL,
      amount     DOUBLE PRECISION NOT NULL,
      co2e       DOUBLE PRECISION NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS idx_entries_user_day ON entries(user_id, day);

    CREATE TABLE IF NOT EXISTS pledges (
      user_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      action_id TEXT NOT NULL,
      PRIMARY KEY (user_id, action_id)
    );
  `);
  console.log("[db] schema ready");
}
