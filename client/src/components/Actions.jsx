import { Check } from "lucide-react";
import { Ic } from "../lib/icons.jsx";
import { fmtKg } from "../lib/format.js";

export default function Actions({ catalog, pledges, onToggle }) {
  const { categories, actions } = catalog;
  const total = actions.filter((a) => pledges.includes(a.id)).reduce((s, a) => s + a.saving, 0);
  return (
    <div className="cf-grid">
      <div className="cf-card" style={{ background: "var(--panel-bg)", color: "var(--panel-fg)", border: "none" }}>
        <div className="cf-eyebrow" style={{ color: "var(--panel-sub)" }}>Your commitments</div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginTop: 8 }}>
          <span className="cf-display" style={{ fontSize: 34, color: "#fff" }}>{fmtKg(total)}</span>
          <span className="cf-mono" style={{ fontSize: 13, color: "var(--panel-sub)" }}>CO₂e saved per year, pledged</span>
        </div>
      </div>
      <div className="cf-grid cf-cols-2">
        {actions.map((a) => {
          const on = pledges.includes(a.id);
          const accent = categories[a.cat]?.color || "var(--green)";
          return (
            <button key={a.id} className={"cf-pledge" + (on ? " on" : "")} onClick={() => onToggle(a.id)}>
              <div style={{ width: 34, height: 34, borderRadius: 8, flex: "none", display: "grid", placeItems: "center", background: on ? "var(--green)" : "var(--surface-soft)", color: on ? "#fff" : accent }}>
                {on ? <Check size={17} /> : <Ic name={a.icon} size={17} />}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.35, marginBottom: 6 }}>{a.label}</div>
                <span className="cf-tag">≈ {fmtKg(a.saving)}/yr · {categories[a.cat]?.label}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
