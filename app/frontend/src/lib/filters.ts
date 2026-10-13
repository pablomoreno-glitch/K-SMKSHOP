// Catalog filters live in the URL (?marca=Lost%20Mary&puffs=15000-40000...) so a filtered list can be
// shared by WhatsApp and survives a reload. These helpers translate URL <-> state <-> API query.

export type SortKey = "relevancia" | "precio_asc" | "precio_desc" | "puffs_desc" | "puffs_asc";

export interface CatalogFilters {
  q: string;
  category: string;
  brands: string[];
  types: string[];
  flavors: string[];
  nicotine: string[];
  puffsMin: number | null;
  puffsMax: number | null;
  sort: SortKey;
}

export const EMPTY_FILTERS: CatalogFilters = {
  q: "",
  category: "",
  brands: [],
  types: [],
  flavors: [],
  nicotine: [],
  puffsMin: null,
  puffsMax: null,
  sort: "relevancia",
};

/** Puff ranges offered as one-tap choices; they match the store's own tiers. */
export const PUFF_RANGES: { label: string; min: number | null; max: number | null }[] = [
  { label: "Hasta 12K", min: null, max: 12000 },
  { label: "15K", min: 15000, max: 15000 },
  { label: "30K a 40K", min: 30000, max: 40000 },
  { label: "Más de 40K", min: 40001, max: null },
];

export const SORT_LABELS: Record<SortKey, string> = {
  relevancia: "Destacados",
  precio_asc: "Menor precio",
  precio_desc: "Mayor precio",
  puffs_desc: "Más puffs",
  puffs_asc: "Menos puffs",
};

export const DEVICE_TYPE_LABELS: Record<string, string> = {
  desechable: "Desechable",
  pod: "Pod",
  mod: "Mod",
  liquido: "Líquido",
  accesorio: "Accesorio",
};

const list = (value: string | null) => (value ? value.split(",").filter(Boolean) : []);
const num = (value: string | undefined) => {
  if (!value) return null;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : null;
};

export function filtersFromParams(params: URLSearchParams): CatalogFilters {
  const [min, max] = (params.get("puffs") ?? "").split("-");
  const sort = params.get("orden") as SortKey | null;
  return {
    q: params.get("q") ?? "",
    category: params.get("categoria") ?? "",
    brands: list(params.get("marca")),
    types: list(params.get("tipo")),
    flavors: list(params.get("sabor")),
    nicotine: list(params.get("nicotina")),
    puffsMin: num(min),
    puffsMax: num(max),
    sort: sort && sort in SORT_LABELS ? sort : "relevancia",
  };
}

export function filtersToParams(filters: CatalogFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.category) params.set("categoria", filters.category);
  if (filters.brands.length) params.set("marca", filters.brands.join(","));
  if (filters.types.length) params.set("tipo", filters.types.join(","));
  if (filters.flavors.length) params.set("sabor", filters.flavors.join(","));
  if (filters.nicotine.length) params.set("nicotina", filters.nicotine.join(","));
  if (filters.puffsMin !== null || filters.puffsMax !== null) {
    params.set("puffs", `${filters.puffsMin ?? ""}-${filters.puffsMax ?? ""}`);
  }
  if (filters.sort !== "relevancia") params.set("orden", filters.sort);
  return params;
}

export function filtersToApiQuery(filters: CatalogFilters, limit = 48): string {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.category) params.set("category", filters.category);
  if (filters.brands.length) params.set("brand", filters.brands.join(","));
  if (filters.types.length) params.set("type", filters.types.join(","));
  if (filters.flavors.length) params.set("flavor", filters.flavors.join(","));
  if (filters.nicotine.length) params.set("nicotine", filters.nicotine.join(","));
  if (filters.puffsMin !== null) params.set("puffs_min", String(filters.puffsMin));
  if (filters.puffsMax !== null) params.set("puffs_max", String(filters.puffsMax));
  if (filters.sort !== "relevancia") params.set("sort", filters.sort);
  params.set("limit", String(limit));
  return params.toString();
}

/** How many filters are on, so the mobile button can say "Filtros (3)". */
export function activeFilterCount(filters: CatalogFilters): number {
  return (
    (filters.category ? 1 : 0) +
    filters.brands.length +
    filters.types.length +
    filters.flavors.length +
    filters.nicotine.length +
    (filters.puffsMin !== null || filters.puffsMax !== null ? 1 : 0)
  );
}

export function toggle(values: string[], value: string): string[] {
  return values.includes(value) ? values.filter((v) => v !== value) : [...values, value];
}
