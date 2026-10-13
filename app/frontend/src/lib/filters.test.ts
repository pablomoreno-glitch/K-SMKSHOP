import { describe, expect, it } from "vitest";
import {
  EMPTY_FILTERS,
  activeFilterCount,
  filtersFromParams,
  filtersToApiQuery,
  filtersToParams,
  toggle,
} from "./filters";

describe("catalog filters", () => {
  it("round-trips through the URL", () => {
    const filters = {
      ...EMPTY_FILTERS,
      q: "peach",
      brands: ["Lost Mary", "Nimmbox"],
      nicotine: ["5"],
      puffsMin: 30000,
      puffsMax: 40000,
      sort: "puffs_desc" as const,
    };
    expect(filtersFromParams(filtersToParams(filters))).toEqual(filters);
  });

  it("maps to the catalog API names", () => {
    const query = new URLSearchParams(
      filtersToApiQuery({ ...EMPTY_FILTERS, brands: ["Bang"], types: ["pod"], puffsMin: 40001 }),
    );
    expect(query.get("brand")).toBe("Bang");
    expect(query.get("type")).toBe("pod");
    expect(query.get("puffs_min")).toBe("40001");
    expect(query.has("puffs_max")).toBe(false);
    expect(query.has("sort")).toBe(false);
  });

  it("ignores junk in the URL", () => {
    const filters = filtersFromParams(new URLSearchParams("puffs=abc-&orden=hack"));
    expect(filters.puffsMin).toBeNull();
    expect(filters.sort).toBe("relevancia");
  });

  it("counts active filters and toggles values", () => {
    expect(activeFilterCount({ ...EMPTY_FILTERS, brands: ["A", "B"], puffsMax: 12000 })).toBe(3);
    expect(toggle(["a"], "b")).toEqual(["a", "b"]);
    expect(toggle(["a", "b"], "a")).toEqual(["b"]);
  });
});
