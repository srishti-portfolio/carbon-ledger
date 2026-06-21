import { useState } from "react";
import { Check } from "lucide-react";
import { regionInfo } from "../lib/format.js";

export default function Settings({ catalog, user, onSave, busy }) {
  const [name, setName] = useState(user.name || "");
  const [region, setRegion] = useState(user.region);
  const [saved, setSaved] = useState(false);
  const dirty = name.trim() !== (user.name || "") || region !== user.region;
  const ri = regionInfo(catalog, region);

  return (
    <div className="cf-grid cf-cols-2">
      <div className="cf-card">
        <div className="cf-eyebrow" style={{ marginBottom: 12 }}>Edit profile</div>
        <label className="cf-eyebrow" htmlFor="set-name">Name</label>
        <input id="set-name" className="cf-input" style={{ margin: "6px 0 14px" }} value={name}
          onChange={(e) => { setName(e.target.value); setSaved(false); }} placeholder="Your name" />
        <label className="cf-eyebrow" htmlFor="set-region">Country / region</label>
        <select id="set-region" className="cf-select" style={{ margin: "6px 0 16px" }} value={region}
          onChange={(e) => { setRegion(e.target.value); setSaved(false); }}>
          <option value="Global average">Global average</option>
          {catalog.countries.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button className="cf-btn primary" disabled={!dirty || busy} onClick={async () => { await onSave({ name: name.trim(), region }); setSaved(true); }}>
            {busy ? "Saving…" : "Save changes"}
          </button>
          {saved && !dirty && <span style={{ fontSize: 13, color: "var(--green)", display: "inline-flex", alignItems: "center", gap: 5 }}><Check size={14} /> Saved</span>}
        </div>
      </div>
      <div className="cf-card">
        <div className="cf-eyebrow" style={{ marginBottom: 12 }}>Account</div>
        <Row label="Email" value={user.email} />
        <Row label="Grid intensity" value={ri.grid + " kg/kWh"} />
        <Row label="Avg footprint" value={ri.avg + " t/person·yr"} />
        <p style={{ fontSize: 12.5, color: "var(--sub)", marginTop: 12, lineHeight: 1.5 }}>
          Changing your country updates the electricity and appliance factors used for new entries, and the benchmark you’re compared against. Past entries keep the value they were logged with.
        </p>
      </div>
    </div>
  );
}
function Row({ label, value }) {
  return (
    <div className="cf-row">
      <span style={{ fontSize: 13, color: "var(--sub)" }}>{label}</span>
      <span className="cf-mono" style={{ fontSize: 13 }}>{value}</span>
    </div>
  );
}
