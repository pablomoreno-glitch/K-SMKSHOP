import { describe, expect, it } from "vitest";
import { lineTotal } from "./pricing";

describe("lineTotal", () => {
  it("applies the 2 x price to each full pair", () => {
    expect(lineTotal(45000, 1, 80000, 2)).toBe(45000);
    expect(lineTotal(45000, 2, 80000, 2)).toBe(80000);
    expect(lineTotal(45000, 3, 80000, 2)).toBe(125000);
  });

  it("is price times quantity without a pack and null without a price", () => {
    expect(lineTotal(16000, 3, null, null)).toBe(48000);
    expect(lineTotal(null, 3, 80000, 2)).toBeNull();
  });
});
