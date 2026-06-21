import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";

// Mock the database so the real route handlers run without a live Postgres.
const { query, connect } = vi.hoisted(() => ({ query: vi.fn(), connect: vi.fn() }));
vi.mock("./db.js", () => ({ pool: { query, connect }, initDb: vi.fn() }));

const { createApp } = await import("./app.js");
const { hashPassword, signToken } = await import("./auth.js");
const app = createApp();

beforeEach(() => {
  query.mockReset();
  connect.mockReset();
  query.mockResolvedValue({ rows: [], rowCount: 0 });
});

describe("public routes (no auth, no db)", () => {
  it("GET /api/health returns ok", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it("GET /api/catalog returns countries and the appliances category", async () => {
    const res = await request(app).get("/api/catalog");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.countries)).toBe(true);
    expect(res.body.categories.appliances).toBeTruthy();
  });
});

describe("auth guard", () => {
  it("rejects unauthenticated profile reads", async () => {
    expect((await request(app).get("/api/me")).status).toBe(401);
  });
  it("rejects unauthenticated entry creation", async () => {
    expect((await request(app).post("/api/entries").send({})).status).toBe(401);
  });
});

describe("registration validation", () => {
  it("rejects a bad email", async () => {
    const res = await request(app).post("/api/auth/register").send({ email: "nope", password: "password123", region: "India" });
    expect(res.status).toBe(400);
  });
  it("rejects a short password", async () => {
    const res = await request(app).post("/api/auth/register").send({ email: "a@b.com", password: "short", region: "India" });
    expect(res.status).toBe(400);
  });
  it("rejects an invalid region", async () => {
    const res = await request(app).post("/api/auth/register").send({ email: "a@b.com", password: "password123", region: "Narnia" });
    expect(res.status).toBe(400);
  });
});

describe("registration + login happy paths", () => {
  it("registers a new user and returns a token", async () => {
    query.mockImplementation((sql) => {
      if (sql.includes("SELECT 1 FROM users")) return Promise.resolve({ rowCount: 0 });
      if (sql.startsWith("INSERT INTO users")) return Promise.resolve({ rows: [{ id: "u1", email: "a@b.com", name: null, region: "India", theme: "light", goal_kg: null }] });
      return Promise.resolve({ rows: [] });
    });
    const res = await request(app).post("/api/auth/register").send({ email: "a@b.com", password: "password123", region: "India" });
    expect(res.status).toBe(201);
    expect(res.body.token).toBeTruthy();
    expect(res.body.user.email).toBe("a@b.com");
  });

  it("rejects a duplicate email with 409", async () => {
    query.mockImplementation((sql) => (sql.includes("SELECT 1 FROM users") ? Promise.resolve({ rowCount: 1 }) : Promise.resolve({ rows: [] })));
    const res = await request(app).post("/api/auth/register").send({ email: "a@b.com", password: "password123", region: "India" });
    expect(res.status).toBe(409);
  });

  it("logs in with the correct password and rejects the wrong one", async () => {
    const hash = await hashPassword("realpassword");
    query.mockImplementation((sql) =>
      sql.includes("SELECT * FROM users")
        ? Promise.resolve({ rows: [{ id: "u1", email: "a@b.com", password_hash: hash, name: null, region: "India", theme: "light", goal_kg: null }] })
        : Promise.resolve({ rows: [] }));

    const ok = await request(app).post("/api/auth/login").send({ email: "a@b.com", password: "realpassword" });
    expect(ok.status).toBe(200);
    expect(ok.body.token).toBeTruthy();

    const bad = await request(app).post("/api/auth/login").send({ email: "a@b.com", password: "wrong" });
    expect(bad.status).toBe(401);
  });
});

describe("authenticated entry logging", () => {
  const auth = () => `Bearer ${signToken("u1")}`;

  it("computes co2e server-side and returns the labelled entry", async () => {
    query.mockImplementation((sql) => {
      if (sql.includes("SELECT * FROM users WHERE id")) return Promise.resolve({ rows: [{ id: "u1", email: "a@b.com", region: "India", name: null, theme: "light", goal_kg: null, password_hash: "x" }] });
      if (sql.startsWith("INSERT INTO entries")) return Promise.resolve({ rows: [{ id: "e1", day: "2026-06-21", category: "transport", item: "car_petrol", amount: 10, co2e: 1.7 }] });
      return Promise.resolve({ rows: [] });
    });
    const res = await request(app).post("/api/entries").set("Authorization", auth())
      .send({ category: "transport", item: "car_petrol", amount: 10, day: "2026-06-21" });
    expect(res.status).toBe(201);
    expect(res.body.co2e).toBe(1.7);
    expect(res.body.label).toBe("Car · petrol");
    expect(res.body.unit).toBe("km");
  });

  it("rejects a badly formatted date", async () => {
    const res = await request(app).post("/api/entries").set("Authorization", auth())
      .send({ category: "transport", item: "car_petrol", amount: 10, day: "not-a-date" });
    expect(res.status).toBe(400);
  });
});
