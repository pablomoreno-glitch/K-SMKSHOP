import { useEffect } from "react";
import { Link } from "react-router-dom";
import { MessageCircle, ShieldCheck, ShoppingBag } from "lucide-react";
import { EMPTY_FILTERS } from "../lib/filters";
import { useCategories, useProducts } from "../lib/queries";
import { formatPrice } from "../lib/format";
import { BRAND } from "../lib/brand";
import { PuffScale } from "../components/PuffScale";
import { ProductCard } from "../components/ProductCard";
import { ProductGridSkeleton, Skeleton } from "../components/Skeleton";
import { ErrorState } from "../components/ErrorState";

const STEPS = [
  { icon: ShoppingBag, title: "Arma tu carrito", text: "Compara puffs, batería y modos, y agrega lo que quieras." },
  { icon: MessageCircle, title: "Confirma por WhatsApp", text: "Te escribimos para acordar pago, sabor disponible y entrega." },
  { icon: ShieldCheck, title: "Recibe con documento", text: "Entregamos solo a mayores de 18. Ten tu cédula a la mano." },
];

export function Home() {
  const products = useProducts(EMPTY_FILTERS, 100);
  const categories = useCategories();

  useEffect(() => {
    document.title = `${BRAND.name} - Vapes desechables en Colombia`;
  }, []);

  const items = products.data?.items ?? [];
  const packs = items.filter((p) => p.pack_price && p.pack_size);

  return (
    <div>
      <section className="mx-auto max-w-6xl px-4 pb-6 pt-12 sm:px-6 sm:pt-16">
        <div className="max-w-2xl">
          <h1 className="font-display text-h3 font-extrabold text-ink sm:text-h2 lg:text-h1">
            Elige por puffs, no por suerte.
          </h1>
          <p className="mt-4 text-body-lg text-muted">
            {items.length > 0 ? `${items.length} vapes desechables` : "Vapes desechables"} de 5.000 a
            50.000 puffs. Mira la nicotina, la batería y los modos de cada uno y pide por WhatsApp.
          </p>
        </div>

        <div className="mt-10">
          {products.isLoading ? (
            <Skeleton className="h-[340px] w-full" />
          ) : products.isError ? (
            <ErrorState onRetry={() => products.refetch()} />
          ) : (
            <PuffScale products={items} />
          )}
        </div>
      </section>

      {packs.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex flex-col gap-5 rounded-tile border border-forest/50 bg-sage p-5 sm:flex-row sm:items-center sm:p-7">
            <div className="sm:w-1/2">
              <h2 className="font-display text-h4 font-bold text-ink">
                Lleva {packs[0].pack_size} por {formatPrice(packs[0].pack_price)}
              </h2>
              <p className="mt-2 text-body text-muted">
                El precio se aplica solo en el carrito cada vez que llevas {packs[0].pack_size} del
                mismo modelo.
              </p>
            </div>
            <div className="flex gap-3 sm:ml-auto">
              {packs.map((product) => (
                <Link
                  key={product.ref}
                  to={`/producto/${product.slug}`}
                  className="flex items-center gap-3 rounded-card border border-line bg-paper p-2 pr-4 hover:border-forest"
                >
                  <img src={product.image_url} alt="" width={56} height={56} className="h-14 w-14 rounded-control object-cover" />
                  <span>
                    <span className="block text-body font-semibold text-ink">{product.name}</span>
                    <span className="block text-meta text-muted">1 x {formatPrice(product.price)}</span>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="mx-auto mt-14 max-w-6xl px-4 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="font-display text-h4 font-bold text-ink">Todo el catálogo</h2>
          <Link to="/catalogo" className="text-body font-medium text-leaf hover:underline">
            Buscar con filtros
          </Link>
        </div>

        {categories.data && (
          <div className="no-scrollbar -mx-4 mt-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
            {categories.data.filter((c) => c.product_count > 0).map((category) => (
              <Link
                key={category.slug}
                to={`/catalogo?categoria=${category.slug}`}
                className="shrink-0 rounded-pill border border-line px-4 py-2 text-body text-ink hover:border-leaf"
              >
                {category.name} <span className="text-muted">({category.product_count})</span>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-6">
          {products.isLoading ? (
            <ProductGridSkeleton count={8} />
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
              {items.map((product) => (
                <ProductCard key={product.ref} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto mt-16 max-w-6xl px-4 sm:px-6">
        <h2 className="font-display text-h4 font-bold text-ink">Así se pide</h2>
        <ol className="mt-6 grid gap-6 sm:grid-cols-3">
          {STEPS.map(({ icon: Icon, title, text }, index) => (
            <li key={title} className="flex gap-4">
              <span className="font-display text-h3 font-extrabold text-forest">{index + 1}</span>
              <div>
                <p className="flex items-center gap-2 text-body-lg font-semibold text-ink">
                  <Icon size={18} strokeWidth={1.75} className="text-leaf" /> {title}
                </p>
                <p className="mt-1 text-body text-muted">{text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
