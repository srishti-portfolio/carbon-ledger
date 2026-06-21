import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Ic } from "../lib/icons.jsx";
import { fmtKg, todayISO, factorFor } from "../lib/format.js";

export default function Log({ catalog, user, recentEntries, onAdd, onDelete }) {
  const { categories } = catalog;
  const catKeys = Object.keys(categories);
  const [cat, setCat] = useState(catKeys[0]);
  const [item, setItem] = useState(Object.keys(categories[catKeys[0]].items)[0]);
  const [amount, setAmount] = useState("");
  const [day, setDay] = useState(todayISO());

  const items = categories[cat].items;
  const cur = items[item] || Object.values(items)[0];
  const factor = factorFor(catalog, cat, item, user.region);
  const preview = amount ? parseFloat(amount) * factor : 0;
  const recent = recentEntries.slice(0, 12);

  const submit = () => { const a = parseFloat(amount); if (!a || a <= 0) return; onAdd({ category: cat, item, amount: a, day }); setAmount(""); };

  return (
    <div className="cf-grid">
      <div className="cf-card">
        <div className="cf-eyebrow" style={{ marginBottom: 12 }}>Log an activity</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
          {catKeys.map((k) => (
            <button key={k} className={"cf-chip" + (cat === k ? " on" : "")} aria-pressed={cat === k} onClick={() => { setCat(k); setItem(Object.keys(categories[k].items)[0]); }}>
              <Ic name={categories[k].icon} size={15} /> {categories[k].label}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 18 }}>
          {Object.entries(items).map(([k, it]) => <button key={k} className={"cf-chip" + (item === k ? " on" : "")} aria-pressed={item === k} onClick={() => setItem(k)}>{it.label}</button>)}
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div style={{ flex: "1 1 140px" }}>
            <label className="cf-eyebrow" htmlFor="log-amount">Amount ({cur.unit})</label>
            <input id="log-amount" className="cf-input" style={{ marginTop: 6 }} type="number" min="0" inputMode="decimal" value={amount}
              onChange={(e) => setAmount(e.target.value)} placeholder="e.g. 12" onKeyDown={(e) => e.key === "Enter" && submit()} />
          </div>
          <div style={{ flex: "1 1 140px" }}>
            <label className="cf-eyebrow" htmlFor="log-day">Date</label>
            <input id="log-day" className="cf-input" style={{ marginTop: 6 }} type="date" max={todayISO()} value={day} onChange={(e) => setDay(e.target.value)} />
          </div>
          <button className="cf-btn primary" onClick={submit} disabled={!amount || parseFloat(amount) <= 0}><Plus size={16} /> Add</button>
        </div>
        {amount > 0 && <p className="cf-mono" style={{ marginTop: 12, fontSize: 13, color: "var(--sub)" }}>= <b style={{ color: "var(--ink)" }}>{fmtKg(preview)}</b> CO₂e <span style={{ opacity: .7 }}>· {factor} kg per {cur.unit}</span></p>}
      </div>

      <div className="cf-card">
        <div className="cf-eyebrow" style={{ marginBottom: 4 }}>Recent entries</div>
        {recent.length === 0 ? <p style={{ color: "var(--sub)", fontSize: 14, padding: "18px 0" }}>Nothing logged yet.</p> : recent.map((e) => (
          <div className="cf-row" key={e.id}>
            <span className="cf-dot" style={{ background: categories[e.category].color }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{e.label}</div>
              <div className="cf-mono" style={{ fontSize: 11.5, color: "var(--sub)" }}>{e.amount} {e.unit} · {e.day}</div>
            </div>
            <span className="cf-mono" style={{ fontSize: 13, fontWeight: 700 }}>{fmtKg(e.co2e)}</span>
            <button className="cf-iconbtn" aria-label="Delete" onClick={() => onDelete(e.id)}><Trash2 size={15} /></button>
          </div>
        ))}
      </div>
    </div>
  );
}
