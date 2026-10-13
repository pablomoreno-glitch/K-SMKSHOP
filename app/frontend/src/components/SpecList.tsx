import { BatteryCharging, Cable, Droplet, Gauge, SlidersHorizontal } from "lucide-react";
import type { Product } from "../types";
import { formatNicotine, formatNumber } from "../lib/format";

/** The five numbers buyers compare, in the same order as the flyers. Missing ones are left out. */
function specRows(product: Product) {
  return [
    { icon: Gauge, label: "Puffs", value: product.puffs ? formatNumber(product.puffs) : null },
    { icon: Droplet, label: "Nicotina", value: product.nicotine_percent !== null ? formatNicotine(product.nicotine_percent) : null },
    { icon: BatteryCharging, label: "Batería", value: product.battery_mah ? `${product.battery_mah} mAh` : null },
    { icon: Cable, label: "Carga", value: product.charging },
    { icon: SlidersHorizontal, label: "Modos", value: product.modes },
  ].filter((row): row is { icon: typeof Gauge; label: string; value: string } => Boolean(row.value));
}

export function SpecList({ product }: { product: Product }) {
  return (
    <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-card border border-line bg-line sm:grid-cols-3">
      {specRows(product).map(({ icon: Icon, label, value }) => (
        <div key={label} className={`bg-sage px-4 py-3 ${value.length > 10 ? "col-span-2" : ""}`}>
          <dt className="flex items-center gap-1.5 text-meta text-muted">
            <Icon size={14} strokeWidth={2} className="text-leaf" /> {label}
          </dt>
          <dd className={`mt-1 font-bold text-ink ${value.length > 10 ? "text-body-lg" : "font-display text-body-lg"}`}>
            {value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
