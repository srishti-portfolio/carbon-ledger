// index.js — REST API for the multi-customer Carbon Ledger.
import "dotenv/config";
import express from "express";
import cors from "cors";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";

import { pool, initDb } from "./db.js";
import { hashPassword, verifyPassword, signToken, requireAuth } from "./auth.js";
import { catalog, computeCo2e, CATEGORIES, isValidRegion, ACTION_IDS } from "./factors.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 4000;
const isProd = process.env.NODE_ENV === "production";

const app = express();
app.use(cors({ origin: process.env.CLIENT_ORIGIN || true }));
app.use(express.json());

const h = (fn) => (req, res) =>
  Promise.resolve(fn(req, res)).catch((err) => res.status(err.status || 400).json({ error: err.message || "Request failed" }));
const fail = (status, message) => Object.assign(new Error(message), { status });

// ---- meta ----
app.get("/api/health", (_req, res) => res.json({ ok: true, time: new Date().toISOString() }));
app.get("/api/catalog", (_req, res) => res.json(catalog()));

// ---- auth ----
app.post("/api/auth/register", h(async (req, res) => {
  const { email, password, name, region } = req.body || {};
  const mail = (email || "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) throw fail(400, "Enter a valid email");
  if (!password || password.length < 8) throw fail(400, "Password must be at least 8 characters");
  if (!isValidRegion(region)) throw fail(400, "Choose a valid country / region");

  if ((await pool.query("SELECT 1 FROM users WHERE email = $1", [mail])).rowCount)
    throw fail(409, "An account with that email already exists");

  const hash = await hashPassword(password);
  const { rows } = await pool.query(
    `INSERT INTO users (email, password_hash, name, region) VALUES ($1,$2,$3,$4)
     RETURNING id, email, name, region, theme, goal_kg`,
    [mail, hash, (name || "").trim().slice(0, 60) || null, region]
  );
  res.status(201).json({ token: signToken(rows[0].id), user: serializeUser(rows[0]) });
}));

app.post("/api/auth/login", h(async (req, res) => {
  const { email, password } = req.body || {};
  const mail = (email || "").trim().toLowerCase();
  const { rows } = await pool.query("SELECT * FROM users WHERE email = $1", [mail]);
  const user = rows[0];
  if (!user || !(await verifyPassword(password || "", user.password_hash)))
    throw fail(401, "Email or password is incorrect");
  res.json({ token: signToken(user.id), user: serializeUser(user) });
}));

// ---- profile ----
app.get("/api/me", requireAuth, h(async (req, res) => res.json(serializeUser(await loadUser(req.userId)))));

app.patch("/api/me", requireAuth, h(async (req, res) => {
  const { theme, region, goal, name } = req.body || {};
  const sets = [], vals = [];
  if (theme !== undefined) { if (!["light", "dark"].includes(theme)) throw fail(400, "theme must be light or dark"); vals.push(theme); sets.push(`theme=$${vals.length}`); }
  if (region !== undefined) { if (!isValidRegion(region)) throw fail(400, "Invalid region"); vals.push(region); sets.push(`region=$${vals.length}`); }
  if (goal !== undefined) { vals.push(Number.isFinite(Number(goal)) ? Math.round(Number(goal)) : null); sets.push(`goal_kg=$${vals.length}`); }
  if (name !== undefined) { vals.push((name || "").trim().slice(0, 60) || null); sets.push(`name=$${vals.length}`); }
  if (!sets.length) throw fail(400, "Nothing to update");
  vals.push(req.userId);
  const { rows } = await pool.query(
    `UPDATE users SET ${sets.join(", ")} WHERE id=$${vals.length} RETURNING id, email, name, region, theme, goal_kg`, vals);
  res.json(serializeUser(rows[0]));
}));

// ---- entries ----
app.get("/api/entries", requireAuth, h(async (req, res) => {
  const to = isoDate(req.query.to) || todayISO();
  const from = isoDate(req.query.from) || daysAgoISO(60);
  const { rows } = await pool.query(
    `SELECT id, to_char(day,'YYYY-MM-DD') AS day, category, item, amount, co2e
       FROM entries WHERE user_id=$1 AND day BETWEEN $2 AND $3
       ORDER BY day DESC, created_at DESC`, [req.userId, from, to]);
  res.json(rows.map(serializeEntry));
}));

app.post("/api/entries", requireAuth, h(async (req, res) => {
  const { category, item, amount, day } = req.body || {};
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day || "")) throw fail(400, "day must be YYYY-MM-DD");
  const user = await loadUser(req.userId);
  const co2e = computeCo2e({ category, item, amount, region: user.region });
  const { rows } = await pool.query(
    `INSERT INTO entries (user_id, day, category, item, amount, co2e) VALUES ($1,$2,$3,$4,$5,$6)
     RETURNING id, to_char(day,'YYYY-MM-DD') AS day, category, item, amount, co2e`,
    [req.userId, day, category, item, Number(amount), co2e]);
  res.status(201).json(serializeEntry(rows[0]));
}));

app.delete("/api/entries/:id", requireAuth, h(async (req, res) => {
  const info = await pool.query("DELETE FROM entries WHERE id=$1 AND user_id=$2", [req.params.id, req.userId]);
  if (info.rowCount === 0) throw fail(404, "Entry not found");
  res.status(204).end();
}));

// ---- pledges ----
app.get("/api/pledges", requireAuth, h(async (req, res) => {
  const { rows } = await pool.query("SELECT action_id FROM pledges WHERE user_id=$1", [req.userId]);
  res.json(rows.map((r) => r.action_id));
}));

app.put("/api/pledges", requireAuth, h(async (req, res) => {
  const ids = Array.isArray(req.body?.actionIds) ? [...new Set(req.body.actionIds.filter((id) => ACTION_IDS.has(id)))] : [];
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("DELETE FROM pledges WHERE user_id=$1", [req.userId]);
    for (const id of ids) await client.query("INSERT INTO pledges (user_id, action_id) VALUES ($1,$2)", [req.userId, id]);
    await client.query("COMMIT");
  } catch (e) { await client.query("ROLLBACK"); throw e; } finally { client.release(); }
  res.json(ids);
}));

// ---- stats for a year (daily/weekly/monthly/yearly + min/max) ----
app.get("/api/stats", requireAuth, h(async (req, res) => {
  const year = parseInt(req.query.year, 10) || new Date().getFullYear();
  const daysQ = await pool.query(
    `SELECT to_char(day,'YYYY-MM-DD') AS day, ROUND(SUM(co2e)::numeric,2) AS total
       FROM entries WHERE user_id=$1 AND EXTRACT(YEAR FROM day)=$2 GROUP BY day ORDER BY day`, [req.userId, year]);
  const days = daysQ.rows.map((r) => ({ day: r.day, total: Number(r.total) }));

  const catQ = await pool.query(
    `SELECT category, ROUND(SUM(co2e)::numeric,2) AS total
       FROM entries WHERE user_id=$1 AND EXTRACT(YEAR FROM day)=$2 GROUP BY category`, [req.userId, year]);
  const byCategory = {};
  for (const r of catQ.rows) byCategory[r.category] = Number(r.total);

  const yearsQ = await pool.query(
    `SELECT EXTRACT(YEAR FROM day)::int AS year, ROUND(SUM(co2e)::numeric,2) AS total
       FROM entries WHERE user_id=$1 GROUP BY 1 ORDER BY 1`, [req.userId]);
  const yearTotals = yearsQ.rows.map((r) => ({ year: r.year, total: Number(r.total) }));

  const total = days.reduce((s, d) => s + d.total, 0);
  const min = days.length ? days.reduce((a, b) => (b.total < a.total ? b : a)) : null;
  const max = days.length ? days.reduce((a, b) => (b.total > a.total ? b : a)) : null;

  res.json({ year, days, byCategory, total: Math.round(total * 100) / 100, min, max, years: yearTotals.map((y) => y.year), yearTotals });
}));

// ---- serve client build in production ----
const clientDist = path.resolve(__dirname, "../client/dist");
if (isProd && fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get("*", (_req, res) => res.sendFile(path.join(clientDist, "index.html")));
}

initDb()
  .then(() => app.listen(PORT, () => console.log(`Carbon Ledger API on http://localhost:${PORT}`)))
  .catch((err) => { console.error("[boot] db init failed:", err.message); process.exit(1); });

// ---- helpers ----
async function loadUser(id) {
  const { rows } = await pool.query("SELECT * FROM users WHERE id=$1", [id]);
  if (!rows[0]) throw fail(404, "User not found");
  return rows[0];
}
function serializeUser(u) { return { id: u.id, email: u.email, name: u.name, region: u.region, theme: u.theme, goal: u.goal_kg }; }
function serializeEntry(e) {
  const meta = CATEGORIES[e.category]?.items?.[e.item];
  return { id: e.id, day: e.day, category: e.category, item: e.item, label: meta?.label ?? e.item, unit: meta?.unit ?? "", amount: Number(e.amount), co2e: Number(e.co2e) };
}
function isoDate(v) { return /^\d{4}-\d{2}-\d{2}$/.test(v || "") ? v : null; }
function todayISO() { return new Date().toISOString().slice(0, 10); }
function daysAgoISO(n) { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().slice(0, 10); }