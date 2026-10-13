import { useEffect } from "react";
import { BRAND } from "../lib/brand";

const STORED = [
  {
    name: "Confirmación de mayoría de edad (vp_age_confirmed)",
    purpose: "Recuerda que confirmaste tener 18 años o más, para no preguntarte en cada visita.",
    duration: "30 días, o hasta que borres los datos del navegador.",
  },
  {
    name: "Carrito (vp_cart_token)",
    purpose: "Recuerda los productos que agregaste al carrito.",
    duration: "Hasta que hagas el pedido o borres los datos del navegador.",
  },
  {
    name: "Sesión del panel (solo administradores)",
    purpose: "Mantiene abierta la sesión de quien administra la tienda.",
    duration: "Hasta cerrar sesión.",
  },
];

export function Cookies() {
  useEffect(() => {
    document.title = `Política de cookies - ${BRAND.name}`;
  }, []);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-h3 font-bold text-ink">Política de cookies</h1>
      <p className="mt-4 text-body-lg text-muted">
        {BRAND.name} guarda en tu navegador solo lo necesario para que la tienda funcione. No usamos
        cookies de publicidad ni analítica de terceros, y no vendemos ni compartimos esta información.
      </p>

      <h2 className="mt-10 text-body-lg font-semibold text-ink">Qué guardamos</h2>
      <div className="mt-4 overflow-hidden rounded-card border border-line bg-sage">
        {STORED.map((item) => (
          <div key={item.name} className="border-b border-line p-4 last:border-b-0">
            <p className="text-body font-semibold text-ink">{item.name}</p>
            <p className="mt-1 text-body text-muted">{item.purpose}</p>
            <p className="mt-1 text-meta text-muted">Duración: {item.duration}</p>
          </div>
        ))}
      </div>

      <h2 className="mt-10 text-body-lg font-semibold text-ink">Datos de tus pedidos</h2>
      <p className="mt-2 text-body text-muted">
        Cuando haces un pedido guardamos tu nombre, celular y ciudad para poder entregarlo y
        contactarte. Esa información queda en nuestros servidores, no en tu navegador, y la usamos
        solo para gestionar tu pedido.
      </p>
    </div>
  );
}
