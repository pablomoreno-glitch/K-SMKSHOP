import { beforeEach, describe, expect, it } from "vitest";
import { AGE_KEY, confirmAge, isAgeConfirmed } from "./ageGate";

const DAY = 24 * 60 * 60 * 1000;

describe("age gate", () => {
  beforeEach(() => localStorage.clear());

  it("asks on the first visit", () => {
    expect(isAgeConfirmed()).toBe(false);
  });

  it("remembers the confirmation for 30 days", () => {
    const now = Date.UTC(2026, 9, 12);
    confirmAge(now);
    expect(isAgeConfirmed(now + 29 * DAY)).toBe(true);
    expect(isAgeConfirmed(now + 31 * DAY)).toBe(false);
  });

  it("ignores a corrupted value", () => {
    localStorage.setItem(AGE_KEY, "nope");
    expect(isAgeConfirmed()).toBe(false);
  });
});
