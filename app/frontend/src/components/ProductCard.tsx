import { useState } from "react";
import { Link } from "react-router-dom";
import { Check, Plus } from "lucide-react";
import type { Product } from "../types";
import { formatNicotine, formatPrice, formatPuffs } from "../lib/format";
import { useAddToCart } from "../lib/cart";

export function ProductCard({ product }: { product: Product }) {
  const [confirmed, setConfirmed] = useState(false);
  const addToCart = useAddToCart();

  function handleAdd(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    addToCart.mutate(
      { ref: product.ref, quantity: 1, source: "catalog" },
      {
        onSuccess: () => {
          setConfirmed(true);
          setTimeout(() => setConfirmed(false), 1200);
        },
      },
    );
  }

  const flavor = product.flavors.length === 1 ? product.flavors[0] : null;

  return (
    <Link
      to={`/producto/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-tile border border-line bg-sage transition-colors hover:border-forest/70"
    >
      <div className="relative aspect-square w-full overflow-hidden bg-paper">
        <img
          src={product.image_url}
          alt={product.name}
          width={400}
          height={400}
          loading="lazy"
          className="h-full w-full object-cover"
        />
        <span className="absolute left-2 top-2 rounded-pill bg-paper/85 px-2.5 py-1 font-display text-meta font-bold text-leaf backdrop-blur">
          {formatPuffs(product.puffs)} puffs
        </span>
        {product.pack_price && product.pack_size && (
          <span className="absolute right-2 top-2 rounded-pill bg-forest px-2.5 py-1 text-meta font-bold text-paper">
            {product.pack_size} x {formatPrice(product.pack_price)}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <p className="text-meta text-muted">{product.brand}</p>
        <h3 className="line-clamp-2 font-display text-body font-bold text-ink">{product.name}</h3>
        <p className="text-meta text-muted">
          {[flavor, `Nicotina ${formatNicotine(product.nicotine_percent)}`].filter(Boolean).join(", ")}
        </p>
        <div className="mt-auto flex items-center justify-between pt-2">
          <p className="text-body-lg font-semibold text-ink">{formatPrice(product.price)}</p>
          <button
            type="button"
            aria-label={`Agregar ${product.name} al carrito`}
            onClick={handleAdd}
            disabled={addToCart.isPending}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-forest text-paper transition-transform hover:scale-105 disabled:opacity-60"
          >
            {confirmed ? <Check size={18} strokeWidth={2.25} /> : <Plus size={18} strokeWidth={2.25} />}
          </button>
        </div>
      </div>
    </Link>
  );
}
