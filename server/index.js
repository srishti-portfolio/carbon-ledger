// index.js — entry point: initialise the database, then start the server.
import "dotenv/config";
import { createApp } from "./app.js";
import { initDb } from "./db.js";

const PORT = process.env.PORT || 4000;
const app = createApp();

initDb()
  .then(() => app.listen(PORT, () => console.log(`Carbon Ledger API on http://localhost:${PORT}`)))
  .catch((err) => { console.error("[boot] db init failed:", err.message); process.exit(1); });
