import { useEffect, useState, type ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, SlidersHorizontal, X } from "lucide-react";
import {
  DEVICE_TYPE_LABELS,
  EMPTY_FILTERS,
  PUFF_RANGES,
  SORT_LABELS,
  type CatalogFilters,
  type SortKey,
  activeFilterCount,
  filtersFromParams,
  filtersToParams,
  toggle,
} from "../lib/filters";
import { useCategories, useFacets, useProducts } from "../lib/queries";
import { BRAND, whatsappLink } from "../lib/brand";
import { formatNicotine } from "../lib/format";
import type { FacetValue } from "../types";
import { ProductCard } from "../components/ProductCard";
import { ProductGridSkeleton } from "../components/Skeleton";
import { EmptyState } from "../components/EmptyState";
import { ErrorState } from "../components/ErrorState";

export function Catalog() {
  const [params, setParams] = useSearchParams();
  const filters = filtersFromParams(params);
  const products = useProducts(filters);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [query, setQuery] = useState(filters.q);

  useEffect(() => setQuery(filters.q), [filters.q]);
  useEffect(() => {
    document.title = `Catálogo - ${BRAND.name}`;
  }, []);

  function update(patch: Partial<CatalogFilters>) {
    setParams(filtersToParams({ ...filters, ...patch }), { replace: true });
  }

  const count = activeFilterCount(filters);
  const total = products.data?.total ?? 0;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <h1 className="font-display text-h3 font-extrabold text-ink">Catálogo</h1>

      <form
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          update({ q: query.trim() });
        }}
        className="relative mt-5 max-w-xl"
      >
        <label htmlFor="catalog-search" className="sr-only">
          Buscar por marca, sabor o modelo
        </label>
        <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
        <input
          id="catalog-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Busca &quot;lost mary&quot;, &quot;peach&quot;, &quot;turbo&quot;..."
          className="w-full rounded-pill border border-line bg-sage py-3 pl-11 pr-28 text-body-lg text-ink placeholder:text-muted outline-none focus-visible:border-leaf"
        />
        <button
          type="submit"
          className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-pill bg-forest px-4 py-2 text-body font-semibold text-paper"
        >
          Buscar
        </button>
      </form>

      <div className="mt-8 grid gap-8 lg:grid-cols-[240px_1fr]">
        <aside className="hidden lg:block" aria-label="Filtros">
          <FilterPanel filters={filters} update={update} />
        </aside>

        <div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setSheetOpen(true)}
              className="inline-flex items-center gap-2 rounded-pill border border-line px-4 py-2 text-body font-medium text-ink hover:border-leaf lg:hidden"
            >
              <SlidersHorizontal size={16} /> Filtros{count > 0 ? ` (${count})` : ""}
            </button>
            <p className="text-body text-muted" aria-live="polite">
              {products.isLoading ? "Buscando..." : `${total} ${total === 1 ? "producto" : "productos"}`}
            </p>
            <label className="ml-auto flex items-center gap-2 text-body text-muted">
              Ordenar
              <select
                value={filters.sort}
                onChange={(event) => update({ sort: event.target.value as SortKey })}
                className="rounded-control border border-line bg-sage px-3 py-2 text-body text-ink outline-none focus-visible:border-leaf"
              >
                {Object.entries(SORT_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <ActiveChips filters={filters} update={update} />

          <div className="mt-5">
            {products.isLoading ? (
              <ProductGridSkeleton count={6} />
            ) : products.isError ? (
              <ErrorState onRetry={() => products.refetch()} message="No pudimos cargar el catálogo." />
            ) : products.data && products.data.items.length > 0 ? (
              <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-3">
                {products.data.items.map((product) => (
                  <ProductCard key={product.ref} product={product} />
                ))}
              </div>
            ) : (
              <EmptyState
                title="Nada con esos filtros"
                description="Quita alguno de los filtros o pregúntanos por WhatsApp: muchos modelos llegan en sabores que aún no están en la ficha."
              >
                <div className="mt-2 flex flex-wrap justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setParams(new URLSearchParams(), { replace: true })}
                    className="rounded-pill border border-line px-4 py-2 text-body font-medium text-ink hover:border-leaf"
                  >
                    Quitar filtros
                  </button>
                  <a
                    href={whatsappLink(`Hola, busco un vape${filters.q ? ` "${filters.q}"` : ""}. ¿Lo tienen?`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-pill bg-forest px-4 py-2 text-body font-semibold text-paper"
                  >
                    Preguntar por WhatsApp
                  </a>
                </div>
              </EmptyState>
            )}
          </div>
        </div>
      </div>

      {sheetOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Filtros">
          <div className="absolute inset-0 bg-paper/70" onClick={() => setSheetOpen(false)} aria-hidden="true" />
          <div className="gate-card absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-tile border-t border-line bg-sage px-5 pb-24 pt-5">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-h4 font-bold text-ink">Filtros</h2>
              <button type="button" aria-label="Cerrar filtros" onClick={() => setSheetOpen(false)} className="rounded-control p-2 text-ink">
                <X size={22} />
              </button>
            </div>
            <div className="mt-4">
              <FilterPanel filters={filters} update={update} />
            </div>
            <div className="fixed inset-x-0 bottom-0 flex gap-3 border-t border-line bg-sage p-4">
              <button
                type="button"
                onClick={() => update({ ...EMPTY_FILTERS, q: filters.q, sort: filters.sort })}
                className="flex-1 rounded-pill border border-line py-3 text-body font-medium text-ink"
              >
                Limpiar
              </button>
              <button
                type="button"
                onClick={() => setSheetOpen(false)}
                className="flex-[2] rounded-pill bg-forest py-3 text-body font-semibold text-paper"
              >
                Ver {total} {total === 1 ? "producto" : "productos"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface PanelProps {
  filters: CatalogFilters;
  update: (patch: Partial<CatalogFilters>) => void;
}

function FilterPanel({ filters, update }: PanelProps) {
  const facets = useFacets();
  const categories = useCategories();
  const f = facets.data;

  return (
    <div className="space-y-7">
      <Group title="Puffs">
        <div className="flex flex-wrap gap-2">
          {PUFF_RANGES.map((range) => {
            const on = filters.puffsMin === range.min && filters.puffsMax === range.max;
            return (
              <Chip
                key={range.label}
                on={on}
                onClick={() => update(on ? { puffsMin: null, puffsMax: null } : { puffsMin: range.min, puffsMax: range.max })}
              >
                {range.label}
              </Chip>
            );
          })}
        </div>
      </Group>

      {categories.data && (
        <Group title="Gama">
          <div className="flex flex-col gap-1">
            {categories.data.filter((c) => c.product_count > 0).map((category) => (
              <Check
                key={category.slug}
                type="radio"
                checked={filters.category === category.slug}
                onChange={() => update({ category: filters.category === category.slug ? "" : category.slug })}
                label={category.name}
                count={category.product_count}
              />
            ))}
          </div>
        </Group>
      )}

      {f && <CheckGroup title="Marca" values={f.brands} selected={filters.brands} onToggle={(v) => update({ brands: toggle(filters.brands, v) })} />}

      {f && f.device_types.length > 0 && (
        <CheckGroup
          title="Tipo"
          values={f.device_types}
          selected={filters.types}
          labelFor={(v) => DEVICE_TYPE_LABELS[v] ?? v}
          onToggle={(v) => update({ types: toggle(filters.types, v) })}
        />
      )}

      {f && (
        <Group title="Sabor">
          {f.flavors.length > 0 ? (
            <div className="flex flex-col gap-1">
              {f.flavors.map((value) => (
                <Check
                  key={value.value}
                  checked={filters.flavors.includes(value.value)}
                  onChange={() => update({ flavors: toggle(filters.flavors, value.value) })}
                  label={value.value}
                  count={value.count}
                />
              ))}
            </div>
          ) : null}
          <p className="mt-2 text-meta text-muted">
            La mayoría llega en sabores variados. Confirmamos el tuyo por WhatsApp.
          </p>
        </Group>
      )}

      {f && f.nicotine.length > 0 && (
        <CheckGroup
          title="Nicotina"
          values={f.nicotine}
          selected={filters.nicotine}
          labelFor={(v) => formatNicotine(Number(v))}
          onToggle={(v) => update({ nicotine: toggle(filters.nicotine, v) })}
        />
      )}
    </div>
  );
}

function ActiveChips({ filters, update }: PanelProps) {
  const categories = useCategories();
  const categoryName = categories.data?.find((c) => c.slug === filters.category)?.name ?? filters.category;
  const chips: { label: string; clear: Partial<CatalogFilters> }[] = [];
  if (filters.q) chips.push({ label: `"${filters.q}"`, clear: { q: "" } });
  if (filters.category) chips.push({ label: categoryName, clear: { category: "" } });
  if (filters.puffsMin !== null || filters.puffsMax !== null) {
    const range = PUFF_RANGES.find((r) => r.min === filters.puffsMin && r.max === filters.puffsMax);
    const label =
      range?.label ??
      (filters.puffsMin === filters.puffsMax
        ? `${filters.puffsMin?.toLocaleString("es-CO")} puffs`
        : `${filters.puffsMin ?? 0} a ${filters.puffsMax ?? "más"} puffs`);
    chips.push({ label, clear: { puffsMin: null, puffsMax: null } });
  }
  for (const b of filters.brands) chips.push({ label: b, clear: { brands: filters.brands.filter((x) => x !== b) } });
  for (const t of filters.types) chips.push({ label: DEVICE_TYPE_LABELS[t] ?? t, clear: { types: filters.types.filter((x) => x !== t) } });
  for (const s of filters.flavors) chips.push({ label: s, clear: { flavors: filters.flavors.filter((x) => x !== s) } });
  for (const n of filters.nicotine) chips.push({ label: `Nicotina ${formatNicotine(Number(n))}`, clear: { nicotine: filters.nicotine.filter((x) => x !== n) } });

  if (chips.length === 0) return null;
  return (
    <div className="mt-4 flex flex-wrap items-center gap-2">
      {chips.map((chip) => (
        <button
          key={chip.label}
          type="button"
          onClick={() => update(chip.clear)}
          className="inline-flex items-center gap-1.5 rounded-pill bg-leaf/15 px-3 py-1 text-meta font-medium text-leaf hover:bg-leaf/25"
        >
          {chip.label} <X size={13} aria-label="Quitar" />
        </button>
      ))}
      <button
        type="button"
        onClick={() => update({ ...EMPTY_FILTERS, sort: filters.sort })}
        className="text-meta text-muted underline-offset-4 hover:text-ink hover:underline"
      >
        Quitar todo
      </button>
    </div>
  );
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset>
      <legend className="mb-2.5 font-display text-body font-bold text-ink">{title}</legend>
      {children}
    </fieldset>
  );
}

function CheckGroup({
  title,
  values,
  selected,
  onToggle,
  labelFor = (v) => v,
}: {
  title: string;
  values: FacetValue[];
  selected: string[];
  onToggle: (value: string) => void;
  labelFor?: (value: string) => string;
}) {
  return (
    <Group title={title}>
      <div className="flex flex-col gap-1">
        {values.map((value) => (
          <Check
            key={value.value}
            checked={selected.includes(value.value)}
            onChange={() => onToggle(value.value)}
            label={labelFor(value.value)}
            count={value.count}
          />
        ))}
      </div>
    </Group>
  );
}

function Check({
  checked,
  onChange,
  label,
  count,
  type = "checkbox",
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
  count: number;
  type?: "checkbox" | "radio";
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 rounded-control px-1 py-1 text-body text-ink hover:bg-paper/40">
      <input
        type={type === "radio" ? "checkbox" : type}
        checked={checked}
        onChange={onChange}
        className={`h-4 w-4 accent-[#FF4FC3] ${type === "radio" ? "rounded-full" : ""}`}
      />
      <span className="flex-1">{label}</span>
      <span className="text-meta text-muted">{count}</span>
    </label>
  );
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={`rounded-pill border px-3 py-1.5 text-meta font-semibold transition-colors ${
        on ? "border-forest bg-forest text-paper" : "border-line text-ink hover:border-leaf"
      }`}
    >
      {children}
    </button>
  );
}
