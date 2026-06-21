import { useMemo } from "react";
import {
  PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar,
} from "recharts";
import { Plus, Gauge, TrendingDown, Lightbulb, ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Ic } from "../lib/icons.jsx";
import { fmtKg, fmtTonnes, todayISO, statusColor, bucketDays, chartTheme, regionInfo } from "../lib/format.js";

const PERIODS = ["daily", "weekly", "monthly", "yearly"];

export default function Dashboard({ catalog, user, recentEntries, pledges, stats, selectedYear, period, onYear, onPeriod, isDark, goTo }) {
  const { categories, actions, paris, global } = catalog;
  const ct = chartTheme(isDark);
  const tooltip = { background: ct.tipBg, border: `1px solid ${ct.tipBorder}`, borderRadius: 8, fontSize: 12, color: "var(--ink)" };

  const today = recentEntries.filter((e) => e.day === todayISO()).reduce((s, e) => s + e.co2e, 0);
  const dayRatio = today / paris.daily;

  const tip = useMemo(() => {
    const td = recentEntries.filter((e) => e.day === todayISO());
    if (!td.length) return null;
    const byCat = {}; td.forEach((e) => (byCat[e.category] = (byCat[e.category] || 0) + e.co2e));
    const sorted = Object.entries(byCat).sort((a, b) => b[1] - a[1]);
    const total = sorted.reduce((s, [, v]) => s + v, 0);
    const top = sorted.slice(0, 2).map(([c]) => c);
    return { total, leadCat: sorted[0][0], leadShare: sorted[0][1] / total, acts: actions.filter((a) => top.includes(a.cat)).slice(0, 3) };
  }, [recentEntries, actions]);

  const series = useMemo(() => {
    if (!stats) return [];
    if (period === "yearly") return stats.yearTotals.map((y) => ({ label: String(y.year), kg: +y.total.toFixed(1), sel: y.year === selectedYear }));
    return bucketDays(stats.days, period);
  }, [stats, period, selectedYear]);

  const breakdown = useMemo(() => {
    if (!stats) return [];
    return Object.entries(stats.byCategory)
      .map(([c, v]) => ({ key: c, name: categories[c].label, value: +v.toFixed(1), color: categories[c].color }))
      .filter((d) => d.value > 0).sort((a, b) => b.value - a.value);
  }, [stats, categories]);

  const pledged = actions.filter((a) => pledges.includes(a.id)).reduce((s, a) => s + a.saving, 0);
  const now = new Date();
  const isCur = selectedYear === now.getFullYear();
  const doy = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 864e5) || 1;
  const yearTotal = stats?.total || 0;
  const annualized = isCur && yearTotal > 0 ? (yearTotal / doy) * 365 : yearTotal;
  const aRatio = annualized / paris.annual;
  const ri = regionInfo(catalog, user.region);

  const compare = [
    { name: "You", kg: annualized / 1000, fill: statusColor(aRatio) },
    { name: ri.label, kg: ri.avg, fill: isDark ? "#3A4A41" : "#C4D2C6" },
    { name: "Global", kg: global.avg, fill: isDark ? "#3A4A41" : "#C4D2C6" },
  ];
  const years = stats ? [...new Set([now.getFullYear(), selectedYear, ...stats.years])].sort((a, b) => b - a) : [selectedYear];

  return (
    <div className="cf-grid">
      <div className="cf-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14 }}>
          <div className="cf-eyebrow">Today’s budget · {paris.daily.toFixed(1)} kg allowance</div>
          <div className="cf-mono" style={{ fontSize: 12, color: statusColor(dayRatio), fontWeight: 700 }}>
            {today === 0 ? "NOTHING LOGGED" : dayRatio <= 1 ? "WITHIN BUDGET" : "OVER BUDGET"}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 14 }}>
          <span className="cf-display" style={{ fontSize: 40, color: statusColor(dayRatio) }}>{today.toFixed(1)}</span>
          <span className="cf-mono" style={{ color: "var(--sub)", fontSize: 14 }}>kg CO₂e spent today</span>
        </div>
        <div className="cf-meter" role="img" aria-label={`Today ${today.toFixed(1)} kilograms of a ${paris.daily.toFixed(1)} kilogram daily budget`}>
          <div className="cf-meter-fill" style={{ width: Math.min(100, dayRatio * 100) + "%", background: statusColor(dayRatio) }} />
          {dayRatio > 1 && <div className="cf-tick" style={{ left: 100 / dayRatio + "%" }} />}
        </div>
        {today === 0 && <button className="cf-btn primary" style={{ marginTop: 14 }} onClick={() => goTo("log")}><Plus size={16} /> Log today’s activity</button>}
      </div>

      {tip && (
        <div className="cf-card" style={{ background: "var(--pos-bg)", borderColor: "var(--pos-bd)" }}>
          <div className="cf-eyebrow" style={{ marginBottom: 8, display: "flex", alignItems: "center", gap: 7 }}><Lightbulb size={14} /> How to cut today’s footprint</div>
          <p style={{ fontSize: 14, lineHeight: 1.55, marginBottom: 12 }}>
            {categories[tip.leadCat].label} drove most of today’s {fmtKg(tip.total)} ({Math.round(tip.leadShare * 100)}%). {categories[tip.leadCat].tip}
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {tip.acts.map((a) => (
              <span key={a.id} className="cf-tag" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 10px" }}>
                <Ic name={a.icon} size={13} /> {a.label} · ≈{fmtKg(a.saving)}/yr
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="cf-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div>
            <div className="cf-eyebrow" style={{ marginBottom: 4 }}>{selectedYear} {isCur ? "so far" : "total"}</div>
            <span className="cf-display" style={{ fontSize: 28 }}>{fmtKg(yearTotal)}</span>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <select className="cf-select" style={{ width: "auto" }} aria-label="Select year" value={selectedYear} onChange={(e) => onYear(Number(e.target.value))}>
              {years.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
            <div className="cf-seg">
              {PERIODS.map((p) => <button key={p} className={period === p ? "on" : ""} aria-pressed={period === p} onClick={() => onPeriod(p)}>{p[0].toUpperCase() + p.slice(1)}</button>)}
            </div>
          </div>
        </div>
      </div>

      <div className="cf-card">
        <div className="cf-eyebrow" style={{ marginBottom: 12 }}>
          {period === "yearly" ? "Total by year" : `${period[0].toUpperCase() + period.slice(1)} footprint · ${selectedYear}`}
        </div>
        {series.length === 0 ? <div className="cf-empty">No activity logged for {selectedYear}.</div> : (
          <div role="img" aria-label={`${period} carbon footprint chart for ${selectedYear}`}>
          <ResponsiveContainer width="100%" height={210}>
            {period === "daily" ? (
              <AreaChart data={series} margin={{ left: -16, right: 6, top: 6, bottom: 0 }}>
                <defs><linearGradient id="cf-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={ct.area} stopOpacity={0.28} /><stop offset="100%" stopColor={ct.area} stopOpacity={0.02} />
                </linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke={ct.grid} vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: ct.axis }} axisLine={false} tickLine={false} interval="preserveStartEnd" minTickGap={28} />
                <YAxis tick={{ fontSize: 11, fill: ct.axis }} axisLine={false} tickLine={false} width={42} />
                <Tooltip formatter={(v) => [fmtKg(v), "that day"]} contentStyle={tooltip} labelStyle={{ color: ct.axis }} />
                <Area type="monotone" dataKey="kg" stroke={ct.area} strokeWidth={2} fill="url(#cf-grad)" />
              </AreaChart>
            ) : (
              <BarChart data={series} margin={{ left: -16, right: 6, top: 6, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={ct.grid} vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: ct.axis }} axisLine={false} tickLine={false} interval="preserveStartEnd" minTickGap={16} />
                <YAxis tick={{ fontSize: 11, fill: ct.axis }} axisLine={false} tickLine={false} width={42} />
                <Tooltip cursor={{ fill: ct.cursor }} formatter={(v) => [fmtKg(v), period === "yearly" ? "year" : "period"]} contentStyle={tooltip} labelStyle={{ color: ct.axis }} />
                <Bar dataKey="kg" radius={[4, 4, 0, 0]}>
                  {series.map((d, i) => <Cell key={i} fill={d.sel === false ? ct.area : "var(--green)"} fillOpacity={d.sel === false ? 0.5 : 1} />)}
                </Bar>
              </BarChart>
            )}
          </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="cf-grid cf-cols-2">
        <DayCard label="Lowest-footprint day" data={stats?.min} accent="var(--green)" Icon={ArrowDownRight} year={selectedYear} />
        <DayCard label="Highest-footprint day" data={stats?.max} accent="var(--over)" Icon={ArrowUpRight} year={selectedYear} />
      </div>

      <div className="cf-grid cf-cols-2">
        <div className="cf-card">
          <div className="cf-eyebrow" style={{ marginBottom: 10 }}>Where it comes from · {selectedYear}</div>
          {breakdown.length === 0 ? <p style={{ color: "var(--sub)", fontSize: 14, padding: "30px 0" }}>No activity.</p> : (
            <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
              <ResponsiveContainer width={130} height={130}>
                <PieChart>
                  <Pie data={breakdown} dataKey="value" innerRadius={38} outerRadius={62} paddingAngle={2} stroke="none">
                    {breakdown.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                  <Tooltip formatter={(v, n) => [fmtKg(v), n]} contentStyle={tooltip} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ flex: 1 }}>
                {breakdown.map((d) => (
                  <div key={d.key} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0" }}>
                    <span className="cf-dot" style={{ background: d.color }} />
                    <span style={{ fontSize: 13, flex: 1 }}>{d.name}</span>
                    <span className="cf-mono" style={{ fontSize: 12, color: "var(--sub)" }}>{Math.round((d.value / yearTotal) * 100)}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="cf-card">
          <div className="cf-eyebrow" style={{ marginBottom: 10 }}>{isCur ? "Projected vs benchmark" : `${selectedYear} vs benchmark`}</div>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={compare} layout="vertical" margin={{ left: 0, right: 16, top: 0, bottom: 0 }}>
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="name" width={132} tick={{ fontSize: 10, fill: ct.axis }} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: ct.cursor }} formatter={(v) => [v.toFixed(2) + " t", "per year"]} contentStyle={tooltip} />
              <Bar dataKey="kg" radius={[0, 5, 5, 0]} barSize={16}>{compare.map((c, i) => <Cell key={i} fill={c.fill} />)}</Bar>
            </BarChart>
          </ResponsiveContainer>
          {isCur && yearTotal > 0 && <p className="cf-mono" style={{ fontSize: 11, color: "var(--sub)", marginTop: 4 }}>“You” is annualised from {selectedYear} so far.</p>}
        </div>
      </div>

      {pledged > 0 && (
        <div className="cf-card" style={{ background: "var(--pos-bg)", borderColor: "var(--pos-bd)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <TrendingDown size={18} style={{ color: "var(--green)" }} />
            <p style={{ fontSize: 14 }}>Your pledges could cut about <b>{fmtKg(pledged)}/year</b> — bringing an annual pace of <b>{fmtTonnes(annualized)}</b> down to <b>{fmtTonnes(Math.max(0, annualized - pledged))}</b>.</p>
          </div>
        </div>
      )}
    </div>
  );
}

function DayCard({ label, data, accent, Icon, year }) {
  return (
    <div className="cf-card">
      <div className="cf-eyebrow" style={{ marginBottom: 10, display: "flex", alignItems: "center", gap: 7 }}><Icon size={14} style={{ color: accent }} /> {label}</div>
      {data ? (
        <>
          <span className="cf-display" style={{ fontSize: 26, color: accent }}>{fmtKg(data.total)}</span>
          <p className="cf-mono" style={{ fontSize: 12.5, color: "var(--sub)", marginTop: 6 }}>
            {new Date(data.day + "T00:00:00").toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}
          </p>
        </>
      ) : <p style={{ color: "var(--sub)", fontSize: 14 }}>No data for {year}.</p>}
    </div>
  );
}
