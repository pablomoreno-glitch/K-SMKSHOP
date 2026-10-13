import { Link } from "react-router-dom";
import { Instagram, Mail, MapPin, MessageCircle } from "lucide-react";
import { useBusiness } from "../lib/queries";
import { BRAND, whatsappLink } from "../lib/brand";
import { NicotineWarning } from "./NicotineWarning";
import { Wordmark } from "./Wordmark";

export function Footer() {
  const { data: business } = useBusiness();
  const contacts = business?.contacts;
  const whatsapp = contacts?.whatsapp ?? BRAND.whatsapp;

  return (
    <footer className="mt-16 border-t border-line">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <NicotineWarning />

        <div className="mt-10 grid gap-8 sm:grid-cols-3">
          <div>
            <Wordmark className="text-[24px]" />
            <p className="mt-3 max-w-xs text-body text-muted">{BRAND.tagline}. Venta solo a mayores de 18 años.</p>
          </div>

          <div>
            <h2 className="text-body font-semibold text-ink">Tienda</h2>
            <ul className="mt-3 space-y-2 text-body text-muted">
              <li><Link to="/catalogo" className="hover:text-leaf">Catálogo completo</Link></li>
              <li><Link to="/nosotros" className="hover:text-leaf">Cómo comprar</Link></li>
              <li><Link to="/cookies" className="hover:text-leaf">Política de cookies</Link></li>
            </ul>
          </div>

          <div>
            <h2 className="text-body font-semibold text-ink">Contacto</h2>
            <ul className="mt-3 space-y-2 text-body text-muted">
              <li>
                <a
                  href={`https://wa.me/${whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 hover:text-leaf"
                >
                  <MessageCircle size={16} strokeWidth={1.75} /> WhatsApp
                </a>
              </li>
              {contacts?.email && (
                <li className="flex items-center gap-2"><Mail size={16} strokeWidth={1.75} /> {contacts.email}</li>
              )}
              {(contacts?.city || contacts?.address) && (
                <li className="flex items-center gap-2">
                  <MapPin size={16} strokeWidth={1.75} /> {[contacts?.address, contacts?.city].filter(Boolean).join(", ")}
                </li>
              )}
              {contacts?.instagram && (
                <li className="flex items-center gap-2"><Instagram size={16} strokeWidth={1.75} /> {contacts.instagram}</li>
              )}
            </ul>
          </div>
        </div>

        <p className="mt-10 text-meta text-muted">
          ¿Dudas antes de pedir?{" "}
          <a href={whatsappLink("Hola, tengo una pregunta sobre un vape")} className="text-leaf hover:underline">
            Escríbenos
          </a>
          . © {new Date().getFullYear()} {BRAND.name}.
        </p>
      </div>
    </footer>
  );
}
