import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { BRAND } from "../lib/brand";
import { confirmAge, isAgeConfirmed } from "../lib/ageGate";

/**
 * Blocks the whole storefront until the visitor says they are an adult. It is a full-screen
 * dialog, not a dismissible banner: there is no close button and Escape does nothing.
 * The cookie policy stays reachable because it is linked from the gate itself.
 */
export function AgeGate() {
  const location = useLocation();
  const [confirmed, setConfirmed] = useState(() => isAgeConfirmed());
  const [refused, setRefused] = useState(false);

  // The policy page is readable without confirming, so the link in the gate works.
  const exempt = location.pathname === "/cookies";

  useEffect(() => {
    if (confirmed || exempt) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [confirmed, exempt]);

  if (confirmed || exempt) return null;

  return (
    <div
      className="fixed inset-0 z-[2147483646] flex items-center justify-center bg-paper/95 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="age-title"
      aria-describedby="age-desc"
    >
      <div className="gate-card w-full max-w-md rounded-tile border border-line bg-sage p-7 text-center shadow-2xl">
        <p className="neon-text font-neon text-[34px] leading-none sm:text-[40px]">{BRAND.name}</p>

        {refused ? (
          <>
            <h1 id="age-title" className="mt-7 font-display text-h4 font-bold text-ink">
              Esta tienda es solo para adultos
            </h1>
            <p id="age-desc" className="mt-3 text-body text-muted">
              Vendemos productos con nicotina y no podemos atender a menores de {BRAND.minimumAge} años.
            </p>
            <button
              type="button"
              onClick={() => setRefused(false)}
              className="mt-6 text-body font-medium text-leaf underline-offset-4 hover:underline"
            >
              Me equivoqué, volver
            </button>
          </>
        ) : (
          <>
            <h1 id="age-title" className="mt-7 font-display text-h4 font-bold text-ink">
              ¿Eres mayor de {BRAND.minimumAge} años?
            </h1>
            <p id="age-desc" className="mt-3 text-body text-muted">
              Aquí se venden vapeadores y productos con nicotina, una sustancia adictiva. Al entrar
              confirmas tu mayoría de edad. En la entrega te podemos pedir documento.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRefused(true)}
                className="rounded-pill border border-line px-4 py-3 text-body font-semibold text-ink hover:border-muted"
              >
                No, soy menor
              </button>
              <button
                type="button"
                autoFocus
                onClick={() => {
                  confirmAge();
                  setConfirmed(true);
                }}
                className="rounded-pill bg-forest px-4 py-3 text-body font-semibold text-paper hover:bg-forest/90"
              >
                Sí, tengo {BRAND.minimumAge}+
              </button>
            </div>
            <p className="mt-5 text-meta text-muted">
              Guardamos esta respuesta y tu carrito en este navegador.{" "}
              <Link to="/cookies" className="text-leaf hover:underline">
                Política de cookies
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
