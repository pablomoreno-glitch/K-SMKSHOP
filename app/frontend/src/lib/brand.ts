// Everything that names the store lives here, so choosing the final name and domain is a one-file change
// (plus index.html and BUSINESS_NAME on the server).
export const BRAND = {
  name: "Nube Neón",
  domain: "nubeneon.com",
  tagline: "Vapes desechables con la ficha técnica a la vista",
  /** WhatsApp for questions before ordering, digits only with country code. */
  whatsapp: "573044497385",
  minimumAge: 18,
} as const;

export const NICOTINE_WARNING =
  "Este producto contiene nicotina. La nicotina es una sustancia adictiva. Venta prohibida a menores de 18 años.";

export function whatsappLink(text: string): string {
  return `https://wa.me/${BRAND.whatsapp}?text=${encodeURIComponent(text)}`;
}
