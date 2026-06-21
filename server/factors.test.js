import { describe, it, expect } from "vitest";
import { computeCo2e, regionInfo, isValidRegion, catalog, CATEGORIES, ACTIONS } from "./factors.js";

describe("computeCo2e", () => {
  it("scales a simple per-unit factor by amount", () => {
    expect(computeCo2e({ category: "transport", item: "car_petrol", amount: 10, region: "India" })).toBe(1.7);
  });

  it("uses the country grid factor for electricity", () => {
    expect(computeCo2e({ category: "home", item: "electricity", amount: 5, region: "India" })).toBe(3.55);
  });

  it("computes appliances as hours x power x grid, and varies by country", () => {
    expect(computeCo2e({ category: "appliances", item: "ac", amount: 4, region: "India" })).toBe(3.41);
    expect(computeCo2e({ category: "appliances", item: "ac", amount: 4, region: "France" })).toBe(0.29);
  });

  it("returns a fixed factor for food", () => {
    expect(computeCo2e({ category: "food", item: "beef", amount: 1, region: "India" })).toBe(6.6);
  });

  it("rejects non-positive amounts", () => {
    expect(() => computeCo2e({ category: "transport", item: "car_petrol", amount: 0, region: "India" })).toThrow();
    expect(() => computeCo2e({ category: "transport", item: "car_petrol", amount: -3, region: "India" })).toThrow(/positive/);
  });

  it("rejects unknown categories, items, and regions", () => {
    expect(() => computeCo2e({ category: "nope", item: "x", amount: 1, region: "India" })).toThrow(/category/);
    expect(() => computeCo2e({ category: "transport", item: "nope", amount: 1, region: "India" })).toThrow(/item/);
    expect(() => computeCo2e({ category: "transport", item: "car_petrol", amount: 1, region: "Narnia" })).toThrow(/region/);
  });
});

describe("regionInfo", () => {
  it("returns known country data", () => {
    expect(regionInfo("India")).toEqual({ label: "India", grid: 0.71, avg: 2.0 });
  });
  it("falls back to global averages for unknown countries", () => {
    expect(regionInfo("Narnia")).toEqual({ label: "Narnia", grid: 0.48, avg: 4.7 });
  });
  it("treats 'Global average' as the global default", () => {
    expect(regionInfo("Global average")).toEqual({ label: "Global average", grid: 0.48, avg: 4.7 });
  });
});

describe("isValidRegion", () => {
  it("accepts listed countries and the global option, rejects others", () => {
    expect(isValidRegion("India")).toBe(true);
    expect(isValidRegion("Global average")).toBe(true);
    expect(isValidRegion("Narnia")).toBe(false);
    expect(isValidRegion("")).toBe(false);
  });
});

describe("catalog", () => {
  it("exposes all countries and the appliances category", () => {
    const c = catalog();
    expect(c.countries.length).toBe(195);
    expect(c.categories.appliances).toBeTruthy();
    expect(c.categories.appliances.items.ac.kw).toBe(1.2);
    expect(c.paris.annual).toBe(2300);
  });
  it("ships appliance reduction actions", () => {
    expect(ACTIONS.some((a) => a.cat === "appliances")).toBe(true);
    expect(Object.keys(CATEGORIES)).toContain("appliances");
  });
});
