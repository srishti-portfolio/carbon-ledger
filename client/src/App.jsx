import { useEffect, useState } from "react";
import { Leaf, Plus, Gauge, Target, Settings as SettingsIcon, Sun, Moon, LogOut } from "lucide-react";
import { api, getToken, setToken } from "./api.js";
import { daysAgoISO, todayISO } from "./lib/format.js";
import Auth from "./components/Auth.jsx";
import Dashboard from "./components/Dashboard.jsx";
import Log from "./components/Log.jsx";
import Actions from "./components/Actions.jsx";
import Settings from "./components/Settings.jsx";

const THEME_KEY = "carbon-ledger:theme";

export default function App() {
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [theme, setTheme] = useState(() => localStorage.getItem(THEME_KEY) || "light");

  const [catalog, setCatalog] = useState(null);
  const [user, setUser] = useState(null);
  const [entries, setEntries] = useState([]);
  const [pledges, setPledges] = useState([]);
  const [stats, setStats] = useState(null);
  const [year, setYear] = useState(new Date().getFullYear());
  const [period, setPeriod] = useState("monthly");
  const [view, setView] = useState("dashboard");

  // apply + persist theme
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  // initial load
  useEffect(() => { (async () => {
    try {
      setCatalog(await api.catalog());
      if (getToken()) {
        const me = await api.me().catch(() => null);
        if (me) { if (me.theme) setTheme(me.theme); await afterAuth(me); }
      }
    } catch (e) { setError(e.message); }
    finally { setReady(true); }
  })(); }, []);

  async function afterAuth(me, yr = new Date().getFullYear()) {
    setUser(me); setYear(yr);
    const [es, ps, st] = await Promise.all([api.listEntries(daysAgoISO(60), todayISO()), api.getPledges(), api.stats(yr)]);
    setEntries(es); setPledges(ps); setStats(st);
  }

  async function reload(yr = year) {
    const [es, st] = await Promise.all([api.listEntries(daysAgoISO(60), todayISO()), api.stats(yr)]);
    setEntries(es); setStats(st);
  }

  async function doAuth(fn, body) {
    setBusy(true); setError(null);
    try { const { token, user: me } = await fn(body); setToken(token); if (me.theme) setTheme(me.theme); await afterAuth(me); setView("dashboard"); }
    catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }

  const addEntry = async (p) => { try { await api.addEntry(p); await reload(); } catch (e) { setError(e.message); } };
  const deleteEntry = async (id) => { const prev = entries; setEntries(entries.filter((x) => x.id !== id)); try { await api.deleteEntry(id); await reload(); } catch (e) { setEntries(prev); setError(e.message); } };
  const togglePledge = async (id) => { const next = pledges.includes(id) ? pledges.filter((x) => x !== id) : [...pledges, id]; setPledges(next); try { await api.setPledges(next); } catch (e) { setError(e.message); } };
  const onYear = async (y) => { setYear(y); try { setStats(await api.stats(y)); } catch (e) { setError(e.message); } };
  const toggleTheme = () => { const t = theme === "dark" ? "light" : "dark"; setTheme(t); if (user) api.updateMe({ theme: t }).catch(() => {}); };
  const saveProfile = async (patch) => { setBusy(true); try { setUser(await api.updateMe(patch)); } catch (e) { setError(e.message); } finally { setBusy(false); } };
  const signOut = () => { setToken(null); setUser(null); setEntries([]); setPledges([]); setStats(null); setView("dashboard"); };

  if (!ready) return <div className="cf-root"><div className="cf-wrap" style={{ paddingTop: 60, textAlign: "center", color: "var(--sub)" }}>Loading…</div></div>;

  if (error && !catalog) return (
    <div className="cf-root"><div className="cf-wrap" style={{ paddingTop: 60 }}>
      <div className="cf-card cf-empty">
        <h3 style={{ color: "var(--ink)", fontWeight: 700, marginBottom: 8 }}>Can’t reach the server</h3>
        <p style={{ fontSize: 14 }}>{error}</p>
      </div>
    </div></div>
  );

  if (!user) return (
    <div className="cf-root">
      <Auth catalog={catalog} busy={busy} error={error} theme={theme} toggleTheme={toggleTheme}
        onLogin={(b) => doAuth(api.login, b)} onRegister={(b) => doAuth(api.register, b)} />
    </div>
  );

  const tabs = [
    { k: "dashboard", label: "Dashboard", Icon: Gauge },
    { k: "log", label: "Log", Icon: Plus },
    { k: "actions", label: "Actions", Icon: Target },
    { k: "settings", label: "Settings", Icon: SettingsIcon },
  ];

  return (
    <div className="cf-root">
      <div className="cf-wrap">
        <header className="cf-header">
          <div className="cf-brand">
            <div className="cf-mark"><Leaf size={19} /></div>
            <div><h1>Carbon Ledger</h1><p>{(user.name || user.email).toUpperCase()} · {user.region.toUpperCase()}</p></div>
          </div>
          <div className="cf-hactions">
            <button className="cf-btn icon" onClick={toggleTheme} aria-label="Toggle theme">{theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}</button>
            <button className="cf-btn" onClick={signOut}><LogOut size={15} /> Sign out</button>
          </div>
        </header>

        <nav className="cf-nav">
          {tabs.map((t) => { const I = t.Icon; return (
            <button key={t.k} className={"cf-tab" + (view === t.k ? " on" : "")} aria-current={view === t.k ? "page" : undefined} onClick={() => setView(t.k)}><I size={16} /> <span>{t.label}</span></button>
          ); })}
        </nav>

        {error && <div className="cf-card" style={{ borderColor: "var(--danger-bd)", background: "var(--danger-bg)", marginBottom: 14 }}><p style={{ fontSize: 13, color: "var(--over)" }}>{error}</p></div>}

        <main>
          {view === "dashboard" && <Dashboard catalog={catalog} user={user} recentEntries={entries} pledges={pledges} stats={stats}
            selectedYear={year} period={period} onYear={onYear} onPeriod={setPeriod} isDark={theme === "dark"} goTo={setView} />}
          {view === "log" && <Log catalog={catalog} user={user} recentEntries={entries} onAdd={addEntry} onDelete={deleteEntry} />}
          {view === "actions" && <Actions catalog={catalog} pledges={pledges} onToggle={togglePledge} />}
          {view === "settings" && <Settings catalog={catalog} user={user} onSave={saveProfile} busy={busy} />}
        </main>

        <p className="cf-mono" style={{ textAlign: "center", fontSize: 11, color: "var(--sub)", marginTop: 28, opacity: .8 }}>
          Emission factors are approximate (DEFRA/BEIS · IPCC · Our World in Data).
        </p>
      </div>
    </div>
  );
}
