# Carbon Ledger

A full-stack, multi-customer carbon footprint platform. Every user signs in to
their own private dashboard, logs daily activities, and sees their footprint
broken down by **day, week, month, and year** — for any year — along with their
lowest- and highest-footprint days, end-of-day reduction tips, and a benchmark
against their country and the global average. Dark/light mode and an editable
profile are built in.

The server owns all emission factors and CO₂e computation; the client renders a
catalog served from `/api/catalog`, so the science lives in one place.

---

## Features

- **Accounts & privacy** — email/password sign-in (bcrypt + JWT); every record is scoped to the logged-in user.
- **Daily logging** — five categories (Transport, Home energy, Food, Shopping, Appliances) with a live footprint preview.
- **Time views** — switch any year between daily, weekly, monthly, and yearly.
- **Min / max days** — the lowest- and highest-footprint day for the selected year.
- **End-of-day tips** — personalised reductions based on what actually drove today's footprint.
- **Benchmarks** — your annualised footprint vs. your country and the global average.
- **Country-aware** — pick any country; its electricity grid intensity drives electricity and appliance emissions.
- **Reduction pledges** — commit to actions and see the projected yearly saving.
- **Themes & profile** — light/dark toggle and an editable name/country, both saved to your account.

## Tech stack

- **Frontend:** Vite + React, Recharts (charts), lucide-react (icons)
- **Backend:** Node + Express, JWT auth, bcrypt password hashing
- **Database:** PostgreSQL (Neon free tier recommended)

---

## Project structure

```
carbon-ledger/
├── package.json              # root: `npm run dev` runs client + server
├── server/
│   ├── factors.js            # countries, categories (incl. appliances), actions, computeCo2e
│   ├── db.js                 # Postgres pool + schema (users / entries / pledges)
│   ├── auth.js               # bcrypt + JWT + requireAuth middleware
│   ├── app.js                # Express app + routes (auth, profile, entries, pledges, stats)
│   ├── index.js              # entry point: init db, start server
│   ├── factors.test.js       # unit tests (emission logic)
│   ├── auth.test.js          # unit tests (hashing + auth guard)
│   ├── api.test.js           # API integration tests (Supertest, db mocked)
│   └── .env.example
└── client/
    ├── vite.config.js        # dev proxy /api -> :4000
    ├── vitest.config.js      # test runner config (jsdom)
    ├── index.html            # no-flash theme bootstrap
    └── src/
        ├── App.jsx           # shell: data loading, theme, routing
        ├── api.js            # token fetch wrapper
        ├── index.css         # light + dark design system
        ├── test/setup.js     # jest-dom matchers
        ├── lib/format.js, lib/format.test.js, lib/icons.jsx
        └── components/Auth.jsx, Dashboard.jsx, Log.jsx, Actions.jsx, Settings.jsx
            (+ Auth.test.jsx, Actions.test.jsx)
```

## API reference

| Method | Route                  | Purpose                                       |
|--------|------------------------|-----------------------------------------------|
| GET    | `/api/health`          | Liveness probe                                |
| GET    | `/api/catalog`         | Countries, categories, actions, Paris budget  |
| POST   | `/api/auth/register`   | Create an account → `{ token, user }`         |
| POST   | `/api/auth/login`      | Sign in → `{ token, user }`                    |
| GET    | `/api/me`              | Current profile                               |
| PATCH  | `/api/me`              | Update name / country / theme                 |
| GET    | `/api/entries`         | List entries (optional `?from=&to=`)          |
| POST   | `/api/entries`         | Log an activity (CO₂e computed server-side)   |
| DELETE | `/api/entries/:id`     | Delete an entry                               |
| GET    | `/api/pledges`         | List pledged action ids                       |
| PUT    | `/api/pledges`         | Replace the pledge set                        |
| GET    | `/api/stats?year=`     | Daily totals, category split, min/max, yearly |

---

## Run locally

Requires **Node 18+** and a PostgreSQL connection string (free at [neon.tech](https://neon.tech)).

```bash
# 1. configure the server
cp server/.env.example server/.env
#    then edit server/.env and set DATABASE_URL (your Neon string) and JWT_SECRET

# 2. install dependencies
cd server && npm install
cd ../client && npm install
cd .. && npm install        # root: installs "concurrently"

# 3. run both apps
npm run dev
```

- App → http://localhost:5173
- API → http://localhost:4000

Tables are created automatically the first time the server starts.

---

Tests

Both apps use Vitest. The server adds Supertest
for API integration tests; the client uses React Testing Library + jsdom.

# server: emission-factor logic, auth helpers, and API routes (db is mocked)
cd server && npm test

# client: formatting/domain helpers and component render tests
cd client && npm test


Server coverage includes computeCo2e/regionInfo correctness, password hashing
and the JWT auth guard, and the auth/entries endpoints (validation, 401s, and the
register→login→log happy path). Client coverage includes the format/domain helpers
and the Auth and Actions components. No live database is required to run the tests.

---

## Deploy for free

Recommended stack: **Neon (database) + Render (API) + Vercel (client)**.

### 1 · Database — Neon
Create a free project at neon.tech and copy the connection string (ends in
`?sslmode=require`). Nothing else to do — the schema builds itself on first boot.

### 2 · API — Render (free web service)
Push the repo to GitHub, then on render.com → **New + → Web Service**:

| Field          | Value             |
|----------------|-------------------|
| Root Directory | `server`          |
| Build Command  | `npm install`     |
| Start Command  | `node index.js`   |
| Instance Type  | Free              |

Environment variables: `DATABASE_URL`, `JWT_SECRET`, `NODE_ENV=production`.
After it deploys, test `https://<your-app>.onrender.com/api/health`.

> Render's free service sleeps after ~15 min idle, so the first request after a
> nap takes ~30–50s. Hit `/api/health` once before demoing to warm it up.

### 3 · Client — Vercel (free)
On vercel.com → **Add New → Project** → import the repo:

| Field            | Value                                            |
|------------------|--------------------------------------------------|
| Root Directory   | `client`                                         |
| Framework        | Vite (auto-detected)                             |
| Env var          | `VITE_API_URL = https://<your-app>.onrender.com/api` |

### 4 · Connect them
Back on Render, set `CLIENT_ORIGIN` to your Vercel URL (for CORS) and let it redeploy.

### Single-service alternative (one deploy)
Let Express serve the built client and deploy only to Render (+ Neon):
build the client (`cd client && npm install && npm run build`), then on Render set
root `server`, start `node index.js`, `NODE_ENV=production`, and a build command
that also builds the client. The server serves `client/dist` and the API from one
origin — no `CLIENT_ORIGIN` / `VITE_API_URL` needed.

---

## A note on the numbers

Emission factors are mid-range estimates drawn from DEFRA/BEIS (2023), the IPCC,
and Our World in Data (Poore & Nemecek, 2018). Appliance emissions are computed
as `hours × power(kW) × grid intensity`. They're meant to guide behaviour, not to
certify an exact footprint — tune any of them in `server/factors.js`.