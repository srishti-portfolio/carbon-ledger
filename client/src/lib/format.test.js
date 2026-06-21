import { describe, it, expect } from "vitest";
import { fmtKg, fmtTonnes, statusColor, regionInfo, factorFor, bucketDays, weekStartISO } from "./format.js";

const catalog = {
  countryData: { India: [0.71, 2.0] },
  global: { grid: 0.48, avg: 4.7 },
  categories: {
    transport: { items: { car_petrol: { factor: 0.17 } } },
    home: { items: { electricity: { factor: null } } },
    appliances: { items: { ac: { kw: 1.2 } } },
  },
};

describe("fmtKg", () => {
  it("formats small, medium, and tonne-scale values", () => {
    expect(fmtKg(4.567)).toBe("4.6 kg");
    expect(fmtKg(250)).toBe("250 kg");
    expect(fmtKg(1500)).toBe("1.5 t");
  });
});

describe("fmtTonnes", () => {
  it("renders kilograms as tonnes with two decimals", () => {
    expect(fmtTonnes(2300)).toBe("2.30 t");
  });
});

describe("statusColor", () => {
  it("maps the budget ratio to green / amber / red", () => {
    expect(statusColor(0.5)).toBe("var(--green)");
    expect(statusColor(1.3)).toBe("var(--amber)");
    expect(statusColor(2)).toBe("var(--over)");
  });
});

describe("regionInfo", () => {
  it("returns country data and falls back to global", () => {
    expect(regionInfo(catalog, "India")).toEqual({ label: "India", grid: 0.71, avg: 2.0 });
    expect(regionInfo(catalog, "Narnia")).toEqual({ label: "Narnia", grid: 0.48, avg: 4.7 });
  });
});

describe("factorFor", () => {
  it("uses the grid for electricity, power×grid for appliances, and the flat factor otherwise", () => {
    expect(factorFor(catalog, "home", "electricity", "India")).toBe(0.71);
    expect(factorFor(catalog, "appliances", "ac", "India")).toBe(0.852);
    expect(factorFor(catalog, "transport", "car_petrol", "India")).toBe(0.17);
  });
});

describe("bucketDays", () => {
  it("rolls daily totals into months", () => {
    const days = [{ day: "2026-01-05", total: 2 }, { day: "2026-01-20", total: 3 }, { day: "2026-03-10", total: 5 }];
    const months = bucketDays(days, "monthly").filter((m) => m.kg > 0);
    expect(months).toEqual([{ label: "Jan", kg: 5 }, { label: "Mar", kg: 5 }]);
  });
});

describe("weekStartISO", () => {
  it("returns the Monday of the week", () => {
    expect(weekStartISO("2026-06-21")).toBe("2026-06-15"); // Sunday -> Monday before
  });
});
