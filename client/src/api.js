// api.js — fetch wrapper with bearer-token auth.
const BASE = import.meta.env.VITE_API_URL || "/api";
const TOKEN_KEY = "carbon-ledger:token";

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t) => (t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY));

async function req(path, opts = {}) {
  const headers = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(BASE + path, { method: opts.method || "GET", headers, body: opts.body ? JSON.stringify(opts.body) : undefined });
  if (res.status === 401) { setToken(null); const m = await res.json().catch(() => ({})); throw Object.assign(new Error(m.error || "Not signed in"), { auth: true }); }
  if (!res.ok) { const m = await res.json().catch(() => ({})); throw new Error(m.error || `${res.status} ${res.statusText}`); }
  return res.status === 204 ? null : res.json();
}

export const api = {
  catalog: () => req("/catalog"),
  register: (body) => req("/auth/register", { method: "POST", body }),
  login: (body) => req("/auth/login", { method: "POST", body }),
  me: () => req("/me"),
  updateMe: (body) => req("/me", { method: "PATCH", body }),
  listEntries: (from, to) => req(`/entries${from ? `?from=${from}&to=${to}` : ""}`),
  addEntry: (body) => req("/entries", { method: "POST", body }),
  deleteEntry: (id) => req(`/entries/${id}`, { method: "DELETE" }),
  getPledges: () => req("/pledges"),
  setPledges: (actionIds) => req("/pledges", { method: "PUT", body: { actionIds } }),
  stats: (year) => req(`/stats?year=${year}`),
};
