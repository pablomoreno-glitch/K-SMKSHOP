import { useMemo, useState } from "react";
import { Check, X } from "lucide-react";
import { useAdminProducts, useUpdateProduct } from "./queries";
import { matchesSearch } from "./filters";
import type { AdminProductRow } from "../types";
import { formatPrice, formatPuffs } from "../lib/format";
import { ErrorState } from "../components/ErrorState";
import { Skeleton } from "../components/Skeleton";

/** Editable peso amount: the supplier cost or our selling price. Saves with Enter or the button. */
function MoneyCell({
  product,
  field,
  label,
}: {
  product: AdminProductRow;
  field: "cost_price" | "price";
  label: string;
}) {
  const updateProduct = useUpdateProduct();
  const current = product[field];
  const [value, setValue] = useState(current ? String(current) : "");
  const [saved, setSaved] = useState(false);

  const parsed = value.trim() === "" ? null : Number(value);
  const invalid = parsed === null || !Number.isInteger(parsed) || parsed <= 0;
  const dirty = parsed !== (current ?? null);

  function save() {
    if (invalid || !dirty || parsed === null) return;
    updateProduct.mutate(
      { ref: product.ref, [field]: parsed },
      { onSuccess: () => { setSaved(true); setTimeout(() => setSaved(false), 1500); } },
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-meta text-muted">$</span>
        <input
          type="number"
          inputMode="numeric"
          min={1}
          step={100}
          value={value}
          placeholder="Sin precio"
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => event.key === "Enter" && save()}
          aria-label={`${label} de ${product.name}`}
          aria-invalid={dirty && invalid}
          className={`w-28 rounded-control border bg-paper py-1.5 pl-5 pr-2 text-body outline-none focus-visible:border-leaf ${
            dirty && invalid ? "border-danger" : "border-line"
          }`}
        />
      </div>
      {dirty && (
        <button
          type="button"
          onClick={save}
          disabled={invalid || updateProduct.isPending}
          className="rounded-pill bg-forest px-3 py-1.5 text-meta font-medium text-paper disabled:opacity-40"
        >
          {updateProduct.isPending ? "..." : "Guardar"}
        </button>
      )}
      {saved && <Check size={18} className="text-leaf" aria-label="Guardado" />}
      {updateProduct.isError && <span className="text-meta text-danger">No se guardó</span>}
    </div>
  );
}

function Profit({ product }: { product: AdminProductRow }) {
  if (!product.cost_price || !product.price) {
    return <span className="text-meta text-muted">Falta el precio proveedor</span>;
  }
  const profit = product.price - product.cost_price;
  return (
    <div className={profit < 0 ? "text-danger" : "text-ink"}>
      <p className="font-semibold">{formatPrice(profit)}</p>
      <p className="text-meta">{product.margin_percent}% sobre el costo</p>
    </div>
  );
}

function ProductRow({ product, onEdit }: { product: AdminProductRow; onEdit: (p: AdminProductRow) => void }) {
  const updateProduct = useUpdateProduct();
  return (
    <tr className={`border-b border-line last:border-0 ${product.is_active ? "" : "opacity-60"}`}>
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <img src={product.image_url} alt="" width={40} height={40} loading="lazy" className="h-10 w-10 shrink-0 rounded-control bg-sage object-contain" />
          <div className="min-w-0">
            <button type="button" onClick={() => onEdit(product)} className="text-left font-medium text-ink hover:text-leaf">
              {product.name}
            </button>
            <p className="text-meta text-muted">
              {product.ref}
              {product.puffs ? ` · ${formatPuffs(product.puffs)} puffs` : ""}
              {product.pack_price ? ` · ${product.pack_size} x ${formatPrice(product.pack_price)}` : ""}
            </p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-body">
        {product.supplier ? (
          <span className="inline-block rounded-pill bg-sage px-2.5 py-0.5 text-meta font-medium text-forest">
            {product.supplier}
          </span>
        ) : (
          <span className="text-meta text-muted">Sin proveedor</span>
        )}
        <p className="mt-1 text-meta text-muted">
          {product.brand && product.brand !== product.supplier ? `${product.brand} · ` : ""}
          {product.category.name}
        </p>
      </td>
      <td className="px-4 py-3">
        <MoneyCell key={`c-${product.ref}-${product.cost_price}`} product={product} field="cost_price" label="Precio proveedor" />
      </td>
      <td className="px-4 py-3">
        <MoneyCell key={`p-${product.ref}-${product.price}`} product={product} field="price" label="Precio de venta" />
      </td>
      <td className="px-4 py-3 text-body">
        <Profit product={product} />
      </td>
      <td className="px-4 py-3">
        <label className="inline-flex cursor-pointer items-center gap-2 text-body">
          <input
            type="checkbox"
            checked={product.is_active}
            onChange={(event) => updateProduct.mutate({ ref: product.ref, is_active: event.target.checked })}
            className="h-4 w-4 rounded border-line accent-forest"
          />
          {product.is_active ? "Visible" : "Oculto"}
        </label>
      </td>
    </tr>
  );
}

const numOrNull = (value: string) => (value.trim() === "" ? null : Number(value));

/** Side panel to edit the description and the vape spec sheet of one product. */
function EditPanel({ product, onClose }: { product: AdminProductRow; onClose: () => void }) {
  const updateProduct = useUpdateProduct();
  const [form, setForm] = useState({
    description: product.description,
    flavors: product.flavors.join(", "),
    puffs: product.puffs?.toString() ?? "",
    nicotine_percent: product.nicotine_percent?.toString() ?? "",
    battery_mah: product.battery_mah?.toString() ?? "",
    charging: product.charging ?? "",
    modes: product.modes ?? "",
    pack_price: product.pack_price?.toString() ?? "",
    is_featured: product.is_featured,
    is_new: product.is_new,
  });
  const [saved, setSaved] = useState(false);
  const set = (key: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: event.target.type === "checkbox" ? (event.target as HTMLInputElement).checked : event.target.value }));

  function save() {
    updateProduct.mutate(
      {
        ref: product.ref,
        description: form.description,
        flavors: form.flavors.split(",").map((f) => f.trim()).filter(Boolean),
        puffs: numOrNull(form.puffs),
        nicotine_percent: numOrNull(form.nicotine_percent),
        battery_mah: numOrNull(form.battery_mah),
        charging: form.charging.trim() || null,
        modes: form.modes.trim() || null,
        pack_price: numOrNull(form.pack_price),
        is_featured: form.is_featured,
        is_new: form.is_new,
      },
      { onSuccess: () => { setSaved(true); setTimeout(() => setSaved(false), 1500); } },
    );
  }

  const input = "mt-1 w-full rounded-control border border-line bg-sage px-3 py-2 text-body outline-none focus-visible:border-leaf";
  const field = (key: keyof typeof form, label: string, hint?: string, type = "text") => (
    <div>
      <label htmlFor={`edit-${key}`} className="block text-body font-medium text-ink">{label}</label>
      <input id={`edit-${key}`} type={type} value={form[key] as string} onChange={set(key)} className={input} />
      {hint && <p className="mt-1 text-meta text-muted">{hint}</p>}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-paper/70" onClick={onClose} />
      <div className="absolute inset-y-0 right-0 w-full max-w-lg overflow-y-auto border-l border-line bg-paper p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src={product.image_url} alt="" width={56} height={56} className="h-14 w-14 rounded-control bg-sage object-cover" />
            <div>
              <h2 className="text-body-lg font-semibold text-ink">{product.name}</h2>
              <p className="text-meta text-muted">{product.ref} · {formatPrice(product.price)}</p>
            </div>
          </div>
          <button type="button" aria-label="Cerrar" onClick={onClose} className="rounded-control p-1 hover:bg-sage">
            <X size={20} strokeWidth={1.75} />
          </button>
        </div>

        <div className="mt-6 space-y-4">
          {field("flavors", "Sabores", "Sepáralos con coma. Vacío = sabores variados.")}
          <div className="grid grid-cols-2 gap-3">
            {field("puffs", "Puffs", undefined, "number")}
            {field("nicotine_percent", "Nicotina (%)", undefined, "number")}
            {field("battery_mah", "Batería (mAh)", undefined, "number")}
            {field("charging", "Carga", "Ej. USB-C")}
          </div>
          {field("modes", "Modos / niveles", "Ej. 3 modos (Soft / Normal / Turbo)")}
          {field("pack_price", "Precio por 2 unidades", "Vacío = sin promoción.", "number")}
          <div className="flex gap-6">
            <label className="inline-flex items-center gap-2 text-body">
              <input type="checkbox" checked={form.is_featured} onChange={set("is_featured")} className="h-4 w-4 accent-forest" /> Destacado
            </label>
            <label className="inline-flex items-center gap-2 text-body">
              <input type="checkbox" checked={form.is_new} onChange={set("is_new")} className="h-4 w-4 accent-forest" /> Nuevo
            </label>
          </div>
          <div>
            <label htmlFor="product-description" className="block text-body font-medium text-ink">Descripción</label>
            <textarea id="product-description" rows={6} value={form.description} onChange={set("description")} className={input} />
          </div>
          <button
            type="button"
            onClick={save}
            disabled={updateProduct.isPending}
            className="rounded-pill bg-forest px-5 py-2.5 text-body font-semibold text-paper disabled:opacity-60"
          >
            {saved ? "Guardado" : "Guardar cambios"}
          </button>
          {updateProduct.isError && <p className="text-meta text-danger">{(updateProduct.error as Error).message}</p>}
        </div>
      </div>
    </div>
  );
}

export function Products() {
  const products = useAdminProducts();
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [brand, setBrand] = useState("");
  const [supplier, setSupplier] = useState("");
  const [editing, setEditing] = useState<AdminProductRow | null>(null);

  const all = useMemo(() => products.data?.items ?? [], [products.data]);
  const categories = useMemo(() => {
    const seen = new Map<string, string>();
    all.forEach((p) => seen.set(p.category.slug, p.category.name));
    return [...seen.entries()];
  }, [all]);
  const withCost = all.filter((p) => p.cost_price).length;
  const suppliers = useMemo(() => {
    const counts = new Map<string, number>();
    all.forEach((p) => p.supplier && counts.set(p.supplier, (counts.get(p.supplier) ?? 0) + 1));
    return [...counts.entries()].sort(([a], [b]) => a.localeCompare(b, "es"));
  }, [all]);
  const brands = useMemo(() => ([...new Set(all.map((p) => p.brand).filter(Boolean))] as string[]).sort((a, b) => a.localeCompare(b, "es")), [all]);

  const visible = all.filter(
    (p) =>
      (!category || p.category.slug === category) &&
      (!supplier || p.supplier === supplier) &&
      (!brand || p.brand === brand) &&
      matchesSearch(q, p.name, p.ref, p.brand, p.supplier, p.flavors.join(" ")),
  );

  return (
    <div>
      <h1 className="font-display text-h3 font-bold text-ink">Productos</h1>
      {products.data && (
        <>
          <p className="mt-1 text-body text-muted">
            {all.length} productos. Edita el precio proveedor (lo que pagas) y el precio de venta (lo que cobra la
            tienda); la ganancia se calcula sola. {all.length - withCost} productos aún no tienen precio proveedor.
          </p>
        </>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <input
          type="search"
          value={q}
          onChange={(event) => setQ(event.target.value)}
          placeholder="Buscar por nombre, referencia o proveedor..."
          aria-label="Buscar productos"
          className="w-full max-w-sm rounded-pill border border-line bg-sage px-4 py-2 text-body outline-none focus-visible:border-leaf"
        />
        <select
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          aria-label="Filtrar por categoría"
          className="rounded-pill border border-line bg-sage px-4 py-2 text-body"
        >
          <option value="">Todas las categorías</option>
          {categories.map(([slug, name]) => (
            <option key={slug} value={slug}>{name}</option>
          ))}
        </select>
        <select
          value={supplier}
          onChange={(event) => setSupplier(event.target.value)}
          aria-label="Filtrar por proveedor"
          className="rounded-pill border border-line bg-sage px-4 py-2 text-body"
        >
          <option value="">Todos los proveedores</option>
          {suppliers.map(([name, count]) => (
            <option key={name} value={name}>{name} ({count})</option>
          ))}
        </select>
        <select
          value={brand}
          onChange={(event) => setBrand(event.target.value)}
          aria-label="Filtrar por marca"
          className="rounded-pill border border-line bg-sage px-4 py-2 text-body"
        >
          <option value="">Todas las marcas</option>
          {brands.map((b) => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>
      </div>

      <div className="mt-4 overflow-x-auto rounded-card border border-line bg-sage">
        {products.isLoading && <Skeleton className="h-40 w-full" />}
        {products.isError && (
          <div className="p-4">
            <ErrorState onRetry={() => products.refetch()} message="No pudimos cargar los productos." />
          </div>
        )}
        {products.data && (
          <table className="w-full min-w-[1080px] text-body">
            <thead>
              <tr className="whitespace-nowrap border-b border-line text-left text-meta text-muted">
                <th className="px-4 py-3">Producto</th>
                <th className="px-4 py-3">Proveedor</th>
                <th className="px-4 py-3">Precio proveedor</th>
                <th className="px-4 py-3">Precio de venta</th>
                <th className="px-4 py-3">Ganancia</th>
                <th className="px-4 py-3">En la tienda</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((product) => (
                <ProductRow key={product.ref} product={product} onEdit={setEditing} />
              ))}
              {visible.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted">No hay productos con esos filtros.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
      {products.data && (
        <p className="mt-2 text-meta text-muted">Mostrando {visible.length} de {all.length}. Escribe un precio y pulsa Enter o Guardar.</p>
      )}

      {editing && <EditPanel product={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}
