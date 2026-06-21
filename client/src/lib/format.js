// format.js — display, date, domain, aggregation, and chart-theme helpers.

export const todayISO = () => new Date().toISOString().slice(0, 10);
export const daysAgoISO = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().slice(0, 10); };
export const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function fmtKg(kg) {
  if (kg == null || isNaN(kg)) return "0";
  if (kg >= 1000) return (kg / 1000).toFixed(kg >= 10000 ? 0 : 1) + " t";
  if (kg >= 100) return Math.round(kg) + " kg";
  if (kg >= 10) return kg.toFixed(0) + " kg";
  return kg.toFixed(1) + " kg";
}
export const fmtTonnes = (kg) => (kg / 1000).toFixed(2) + " t";
export const statusColor = (r) => (r <= 1 ? "var(--green)" : r <= 1.6 ? "var(--amber)" : "var(--over)");
export const prettyDay = (s) => new Date(s + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" });

// ---- domain (mirrors server/factors.js) ----
export function regionInfo(catalog, name) {
  if (!name || name === "Global average") return { label: "Global average", grid: catalog.global.grid, avg: catalog.global.avg };
  const d = catalog.countryData[name];
  return d ? { label: name, grid: d[0], avg: d[1] } : { label: name, grid: catalog.global.grid, avg: catalog.global.avg };
}
export function factorFor(catalog, category, item, region) {
  const it = catalog.categories[category].items[item];
  if (category === "home" && item === "electricity") return regionInfo(catalog, region).grid;
  if (category === "appliances") return Math.round(it.kw * regionInfo(catalog, region).grid * 1000) / 1000;
  return it.factor;
}

// ---- aggregation ----
export function weekStartISO(iso) {
  const d = new Date(iso + "T00:00:00"); const dow = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - dow); return d.toISOString().slice(0, 10);
}
export function bucketDays(days, period) {
  if (period === "daily") return days.map((d) => ({ label: prettyDay(d.day), kg: +d.total.toFixed(1) }));
  if (period === "monthly") {
    const m = MONTHS.map((label) => ({ label, kg: 0 }));
    days.forEach((d) => { m[+d.day.slice(5, 7) - 1].kg += d.total; });
    return m.map((x) => ({ ...x, kg: +x.kg.toFixed(1) }));
  }
  const map = {};
  days.forEach((d) => { const w = weekStartISO(d.day); map[w] = (map[w] || 0) + d.total; });
  return Object.keys(map).sort().map((w) => ({ label: prettyDay(w), kg: +map[w].toFixed(1) }));
}
export const chartTheme = (dark) => dark
  ? { axis: "#93A69C", grid: "#25322C", tipBg: "#16201C", tipBorder: "#25322C", area: "#34B27B", cursor: "#1F2B25" }
  : { axis: "#5E6F66", grid: "#EDF0EA", tipBg: "#FFFFFF", tipBorder: "#E2E7DF", area: "#1E8E5A", cursor: "#F0F1EC" };
