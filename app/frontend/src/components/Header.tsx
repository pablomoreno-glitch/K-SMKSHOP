import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Menu, Search, ShoppingBag, X } from "lucide-react";
import { useCart } from "../lib/cart";
import { Wordmark } from "./Wordmark";

const NAV_LINKS = [
  { to: "/catalogo", label: "Catálogo" },
  { to: "/catalogo?orden=puffs_desc", label: "Más puffs" },
  { to: "/nosotros", label: "Cómo comprar" },
];

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const { data: cart } = useCart();
  const itemCount = cart?.item_count ?? 0;

  function handleSearchSubmit(event: React.FormEvent) {
    event.preventDefault();
    setMenuOpen(false);
    navigate(`/catalogo?q=${encodeURIComponent(query.trim())}`);
  }

  const search = (id: string) => (
    <form onSubmit={handleSearchSubmit} role="search" className="relative flex-1">
      <label htmlFor={id} className="sr-only">
        Buscar por marca, sabor o modelo
      </label>
      <Search
        size={16}
        strokeWidth={2}
        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
      />
      <input
        id={id}
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Marca, sabor o modelo"
        className="w-full rounded-pill border border-line bg-sage py-2 pl-9 pr-4 text-body text-ink placeholder:text-muted outline-none focus-visible:border-leaf"
      />
    </form>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
        <Link to="/" aria-label="Inicio" className="shrink-0">
          <Wordmark className="text-[22px] sm:text-[26px]" />
        </Link>

        <nav className="ml-4 hidden items-center gap-6 lg:flex">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className="text-body font-medium text-muted hover:text-ink"
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto hidden w-64 md:block">{search("header-search")}</div>

        <div className="ml-auto flex shrink-0 items-center gap-1 md:ml-0">
          <Link
            to="/carrito"
            aria-label={`Carrito, ${itemCount} productos`}
            className="relative rounded-control p-2 text-ink hover:bg-sage"
          >
            <ShoppingBag size={22} strokeWidth={1.75} />
            {itemCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-forest px-1 text-[11px] font-bold text-paper">
                {itemCount}
              </span>
            )}
          </Link>
          <button
            type="button"
            aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
            className="rounded-control p-2 text-ink hover:bg-sage lg:hidden"
          >
            {menuOpen ? <X size={22} strokeWidth={1.75} /> : <Menu size={22} strokeWidth={1.75} />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav className="border-t border-line bg-paper px-4 py-4 lg:hidden">
          <div className="md:hidden">{search("mobile-search")}</div>
          <ul className="mt-4 flex flex-col gap-3 md:mt-0">
            {NAV_LINKS.map((link) => (
              <li key={link.to}>
                <Link
                  to={link.to}
                  onClick={() => setMenuOpen(false)}
                  className="block text-body-lg font-medium text-ink"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
