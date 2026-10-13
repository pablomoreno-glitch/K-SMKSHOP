import { describe, expect, it } from "vitest";
import { formatNicotine, formatPrice, formatPercent, formatNumber, formatPuffs } from "./format";

describe("formatPrice", () => {
  it("formats a positive integer as Colombian pesos", () => {
    expect(formatPrice(45000)).toBe("$ 45.000");
  });

  it("returns the 'to be confirmed' label for null", () => {
    expect(formatPrice(null)).toBe("Precio a consultar");
  });

  it("returns the 'to be confirmed' label for undefined", () => {
    expect(formatPrice(undefined)).toBe("Precio a consultar");
  });

  it("formats zero as a valid price", () => {
    expect(formatPrice(0)).toBe("$ 0");
  });
});

describe("formatPercent", () => {
  it("rounds a fraction to a whole percentage", () => {
    expect(formatPercent(0.4444)).toBe("44%");
  });

  it("formats zero", () => {
    expect(formatPercent(0)).toBe("0%");
  });
});

describe("formatNumber", () => {
  it("formats with thousands separators", () => {
    expect(formatNumber(1234)).toBe("1.234");
  });
});


describe("vape formats", () => {
  it("formats puffs the way the flyers do", () => {
    expect(formatPuffs(40000)).toBe("40K");
    expect(formatPuffs(12500)).toBe("12,5K");
    expect(formatPuffs(null)).toBe("—");
  });

  it("formats nicotine", () => {
    expect(formatNicotine(5)).toBe("5%");
    expect(formatNicotine(0)).toBe("Sin nicotina");
  });
});
