import { Link } from "react-router-dom";
import type { Product } from "../types";
import { formatPrice, formatPuffs } from "../lib/format";

const SCALE_MAX = 55000;
const TICKS = [5000, 10000, 20000, 30000, 40000, 50000];

const position = (puffs: number) => `${(puffs / SCALE_MAX) * 100}%`;

/**
 * The catalog laid out on one neon tube by number of puffs: the thing people compare first.
 * Products with the same puffs stack in one column; each column links to that range.
 */
export function PuffScale({ products }: { products: Product[] }) {
  const groups = new Map<number, Product[]>();
  for (const product of products) {
    if (!product.puffs) continue;
    groups.set(product.puffs, [...(groups.get(product.puffs) ?? []), product]);
  }
  const columns = [...groups.entries()].sort(([a], [b]) => a - b);

  return (
    <div className="no-scrollbar -mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <div className="relative min-w-[680px] pb-10 pt-2" style={{ height: 340 }}>
        {columns.map(([puffs, items]) => (
          <Link
            key={puffs}
            to={`/catalogo?puffs=${puffs}-${puffs}`}
            aria-label={`${formatPuffs(puffs)} puffs: ${items.map((p) => p.name).join(", ")}`}
            className="group absolute bottom-12 flex w-[76px] -translate-x-1/2 flex-col-reverse items-center gap-1.5"
            style={{ left: position(puffs) }}
          >
            {items.map((product) => (
              <span key={product.ref} className="flex w-full flex-col items-center">
                <img
                  src={product.image_url}
                  alt=""
                  width={56}
                  height={56}
                  className="h-14 w-14 rounded-control border border-line object-cover transition-colors group-hover:border-forest"
                />
                <span className="mt-0.5 w-full truncate text-center text-[11px] leading-tight text-muted group-hover:text-ink">
                  {product.name}
                </span>
                <span className="text-[11px] font-semibold leading-tight text-ink">
                  {formatPrice(product.price).replace(/\s/g, "")}
                </span>
              </span>
            ))}
          </Link>
        ))}

        <div className="neon-tube absolute bottom-8 left-0 right-0 h-1 rounded-pill" aria-hidden="true" />
        {TICKS.map((tick) => (
          <span
            key={tick}
            className="absolute bottom-0 -translate-x-1/2 font-display text-meta font-bold text-muted"
            style={{ left: position(tick) }}
            aria-hidden="true"
          >
            {formatPuffs(tick)}
          </span>
        ))}
      </div>
    </div>
  );
}
