import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { MessageCircle } from "lucide-react";
import { useAvailability, useProduct, useRelatedProducts } from "../lib/queries";
import { ApiError } from "../lib/api";
import { formatPrice, formatPuffs } from "../lib/format";
import { BRAND, whatsappLink } from "../lib/brand";
import { DEVICE_TYPE_LABELS } from "../lib/filters";
import { useSetCartItem } from "../lib/cart";
import { lineTotal } from "../lib/pricing";
import { AvailabilityPill } from "../components/AvailabilityPill";
import { QuantityStepper } from "../components/QuantityStepper";
import { ProductCard } from "../components/ProductCard";
import { SpecList } from "../components/SpecList";
import { ErrorState } from "../components/ErrorState";
import { Skeleton } from "../components/Skeleton";
import { NotFound } from "./NotFound";

function setMeta(name: string, content: string) {
  let tag = document.querySelector(`meta[name="${name}"]`);
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute("name", name);
    document.head.appendChild(tag);
  }
  tag.setAttribute("content", content);
}

export function Product() {
  const { slug } = useParams<{ slug: string }>();
  const product = useProduct(slug);
  const related = useRelatedProducts(slug);
  const availability = useAvailability(product.data ? [product.data.ref] : []);
  const setCartItem = useSetCartItem();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (product.data) {
      document.title = `${product.data.name} ${formatPuffs(product.data.puffs)} puffs - ${BRAND.name}`;
      setMeta("description", product.data.description.slice(0, 155));
    }
    return () => {
      document.title = `${BRAND.name} - Vapes desechables en Colombia`;
    };
  }, [product.data]);

  useEffect(() => setAdded(false), [quantity, slug]);

  if (product.isLoading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-2">
          <Skeleton className="aspect-square w-full" />
          <div className="space-y-3">
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-10 w-2/3" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (product.isError) {
    return product.error instanceof ApiError && product.error.status === 404 ? (
      <NotFound />
    ) : (
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <ErrorState onRetry={() => product.refetch()} message="No pudimos cargar este producto." />
      </div>
    );
  }

  const item = product.data;
  if (!item) return null;

  const status = availability.data?.[0]?.status ?? "available";
  const isOut = status === "out";
  const total = lineTotal(item.price, quantity, item.pack_price, item.pack_size);
  const saving = item.price !== null && total !== null ? item.price * quantity - total : 0;
  const flavorText = item.flavors.length > 0 ? item.flavors.join(", ") : "Variados, según disponibilidad";

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <nav aria-label="Ruta" className="mb-6 text-meta text-muted">
        <Link to="/catalogo" className="hover:text-leaf">Catálogo</Link>
        {" / "}
        <Link to={`/catalogo?categoria=${item.category.slug}`} className="hover:text-leaf">{item.category.name}</Link>
        {" / "}
        <span className="text-ink">{item.name}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
        <div className="relative aspect-square w-full overflow-hidden rounded-tile border border-line bg-sage">
          <img src={item.image_url} alt={item.name} width={640} height={640} className="h-full w-full object-cover" />
          {item.is_new && (
            <span className="absolute left-3 top-3 rounded-pill bg-leaf px-3 py-1 text-meta font-bold text-paper">Nuevo</span>
          )}
        </div>

        <div>
          <p className="text-body text-muted">
            {item.brand} · {DEVICE_TYPE_LABELS[item.device_type] ?? item.device_type}
          </p>
          <h1 className="mt-1 font-display text-h3 font-extrabold text-ink lg:text-h2">{item.name}</h1>
          <p className="mt-2 font-display text-h4 font-bold text-leaf">{formatPuffs(item.puffs)} puffs</p>

          <div className="mt-5 flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <p className="text-h4 font-semibold text-ink">{formatPrice(item.price)}</p>
            {item.pack_price && item.pack_size && (
              <p className="rounded-pill bg-forest/15 px-3 py-1 text-body font-semibold text-forest">
                {item.pack_size} x {formatPrice(item.pack_price)}
              </p>
            )}
          </div>
          <div className="mt-3">
            <AvailabilityPill status={status} />
          </div>

          <div className="mt-6">
            <SpecList product={item} />
          </div>
          <p className="mt-3 text-body text-muted">
            <span className="text-ink">Sabor:</span> {flavorText}
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <QuantityStepper value={quantity} onChange={setQuantity} disabled={isOut} />
            <button
              type="button"
              onClick={() =>
                setCartItem.mutate({ ref: item.ref, quantity, source: "catalog" }, { onSuccess: () => setAdded(true) })
              }
              disabled={isOut || setCartItem.isPending}
              className="flex-1 rounded-pill bg-forest px-6 py-3 text-body font-semibold text-paper hover:bg-forest/90 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
            >
              {added ? "En tu carrito" : `Agregar ${total !== null ? formatPrice(total) : ""}`}
            </button>
          </div>
          {saving > 0 && <p className="mt-2 text-meta text-forest">Ahorras {formatPrice(saving)} con el precio por {item.pack_size}.</p>}
          {added && (
            <Link to="/carrito" className="mt-2 inline-block text-body font-medium text-leaf hover:underline">
              Ir al carrito
            </Link>
          )}

          <a
            href={whatsappLink(`Hola, ¿qué sabores tienen del ${item.name} (${item.ref})?`)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 flex items-center gap-2 text-body font-medium text-ink hover:text-leaf"
          >
            <MessageCircle size={18} strokeWidth={1.75} className="text-leaf" />
            Preguntar sabores disponibles por WhatsApp
          </a>
        </div>
      </div>

      <div className="mt-12">
        <div>
          <h2 className="font-display text-body-lg font-bold text-ink">Descripción</h2>
          <p className="mt-2 max-w-prose text-body-lg text-muted">{item.description}</p>
          {item.highlights.length > 0 && (
            <ul className="mt-4 flex flex-wrap gap-2">
              {item.highlights.map((h) => (
                <li key={h} className="rounded-pill border border-line px-3 py-1 text-meta text-ink">{h}</li>
              ))}
            </ul>
          )}
          <p className="mt-4 text-meta text-muted">Ref. {item.ref}</p>
        </div>
      </div>

      {related.data && related.data.length > 0 && (
        <section className="mt-14">
          <h2 className="font-display text-h4 font-bold text-ink">Parecidos en puffs</h2>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {related.data.map((relatedProduct) => (
              <ProductCard key={relatedProduct.ref} product={relatedProduct} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
