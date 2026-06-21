import { useState } from "react";
import { Leaf, Sun, Moon } from "lucide-react";

export default function Auth({ catalog, onLogin, onRegister, busy, error, theme, toggleTheme }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [region, setRegion] = useState("India");
  const isRegister = mode === "register";

  const submit = () => {
    if (!email || !password) return;
    if (isRegister) onRegister({ email, password, name: name.trim(), region });
    else onLogin({ email, password });
  };

  return (
    <div className="cf-wrap">
      <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: 16 }}>
        <button className="cf-btn icon" onClick={toggleTheme} aria-label="Toggle theme">
          {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>
      <div className="cf-card" style={{ maxWidth: 440, margin: "30px auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <div className="cf-mark"><Leaf size={19} /></div>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 700 }}>Carbon Ledger</h1>
            <p className="cf-mono" style={{ fontSize: 11, color: "var(--sub)", letterSpacing: ".06em" }}>
              {isRegister ? "CREATE YOUR ACCOUNT" : "WELCOME BACK"}
            </p>
          </div>
        </div>

        <label className="cf-eyebrow" htmlFor="auth-email">Email</label>
        <input id="auth-email" className="cf-input" style={{ margin: "6px 0 14px" }} type="email" autoComplete="email"
          value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com"
          onKeyDown={(e) => e.key === "Enter" && submit()} />

        <label className="cf-eyebrow" htmlFor="auth-password">Password</label>
        <input id="auth-password" className="cf-input" style={{ margin: "6px 0 14px" }} type="password"
          autoComplete={isRegister ? "new-password" : "current-password"} value={password}
          onChange={(e) => setPassword(e.target.value)} placeholder={isRegister ? "At least 8 characters" : "Your password"}
          onKeyDown={(e) => e.key === "Enter" && submit()} />

        {isRegister && (
          <>
            <label className="cf-eyebrow" htmlFor="auth-name">Name <span style={{ textTransform: "none", letterSpacing: 0 }}>(optional)</span></label>
            <input id="auth-name" className="cf-input" style={{ margin: "6px 0 14px" }} value={name}
              onChange={(e) => setName(e.target.value)} placeholder="e.g. Asha" />
            <label className="cf-eyebrow" htmlFor="auth-region">Country / region</label>
            <select id="auth-region" className="cf-select" style={{ margin: "6px 0 6px" }} value={region} onChange={(e) => setRegion(e.target.value)}>
              <option value="Global average">Global average</option>
              {catalog.countries.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </>
        )}

        {error && <p style={{ color: "var(--over)", fontSize: 13, margin: "10px 0 0" }}>{error}</p>}

        <button className="cf-btn primary" style={{ width: "100%", justifyContent: "center", marginTop: 16 }}
          onClick={submit} disabled={busy || !email || !password}>
          {busy ? "Please wait…" : isRegister ? "Create account" : "Sign in"}
        </button>

        <p style={{ textAlign: "center", fontSize: 13, color: "var(--sub)", marginTop: 16 }}>
          {isRegister ? "Already have an account? " : "New here? "}
          <button onClick={() => setMode(isRegister ? "login" : "register")}
            style={{ border: "none", background: "none", color: "var(--green)", fontWeight: 600, cursor: "pointer", font: "inherit" }}>
            {isRegister ? "Sign in" : "Create one"}
          </button>
        </p>
      </div>
    </div>
  );
}
