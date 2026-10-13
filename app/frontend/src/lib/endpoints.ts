export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface ApiEndpoint {
  method: HttpMethod;
  path: string;
  description: string;
  example: string;
  group: string;
  admin?: boolean;
  tryable?: boolean;
}

// Single source of truth for the /api developer page. Mirrors design.md section 5.
export const endpoints: ApiEndpoint[] = [
  {
    method: "GET",
    path: "/v1/health",
    description: "Estado agregado de todos los servicios.",
    example: `{
  "status": "ok",
  "services": {
    "catalog": { "status": "ok", "latency_ms": 12 }
  }
}`,
    group: "Estado",
    tryable: true,
  },
  {
    method: "GET",
    path: "/v1/business",
    description: "Perfil del negocio, contactos, servicios y medios.",
    example: `{
  "profile": { "name": "Nube Neón", "tagline": "...", "description": "..." },
  "contacts": { "whatsapp": "573001112233" },
  "services": [],
  "media": []
}`,
    group: "Negocio",
    tryable: true,
  },
  {
    method: "GET",
    path: "/v1/business/contacts",
    description: "Canales de contacto disponibles (los no configurados son null).",
    example: `{
  "whatsapp": "573001112233",
  "phone": null,
  "email": "hola@nubeneon.com",
  "address": null,
  "city": "Bogotá",
  "hours": "Lun a sáb, 8am a 6pm",
  "instagram": "@nubeneon",
  "facebook": null
}`,
    group: "Negocio",
    tryable: true,
  },
  {
    method: "GET",
    path: "/v1/business/services",
    description: "Servicios ofrecidos por el negocio.",
    example: `[{ "id": 1, "title": "Pedidos por WhatsApp", "description": "...", "icon": "sparkles" }]`,
    group: "Negocio",
    tryable: true,
  },
  {
    method: "GET",
    path: "/v1/business/media",
    description: "Imágenes del negocio (hero, galería).",
    example: `[{ "id": 1, "kind": "gallery", "title": "Tienda", "url": "/media/site/hero.webp", "alt": "..." }]`,
    group: "Negocio",
    tryable: true,
  },
  {
    method: "POST",
    path: "/v1/business/contact-messages",
    description: "Envía un mensaje de contacto (nombre, teléfono o correo, mensaje).",
    example: `{ "id": 10, "status": "new" }`,
    group: "Negocio",
  },
  {
    method: "GET",
    path: "/v1/catalog/categories",
    description: "Categorías del catálogo en orden.",
    example: `[{ "slug": "modos", "name": "Alta capacidad con modos", "tagline": "40K puffs · potencia ajustable", "product_count": 2 }]`,
    group: "Catálogo",
    tryable: true,
  },
  {
    method: "GET",
    path: "/v1/catalog/facets",
    description: "Valores disponibles para los filtros: marcas, tipos, sabores, nicotina y rangos de puffs y precio.",
    example: `{
  "brands": [{ "value": "Nimmbox", "count": 1 }],
  "device_types": [{ "value": "desechable", "count": 12 }],
  "flavors": [{ "value": "White Peach Ice", "count": 1 }],
  "nicotine": [{ "value": "5", "count": 12 }],
  "puffs": { "min": 5000, "max": 50000 },
  "price": { "min": 16000, "max": 50000 }
}`,
    group: "Catálogo",
    tryable: true,
  },
  {
    method: "GET",
    path: "/v1/catalog/products",
    description:
      "Lista de productos. Filtros: category, brand, type, flavor, nicotine (listas separadas por coma), puffs_min, puffs_max, price_max, q, featured, sort (relevancia, precio_asc, precio_desc, puffs_desc, puffs_asc), limit, offset.",
    example: `{
  "items": [{ "ref": "VP-011", "slug": "nimmbox-flux", "name": "Nimmbox Flux", "puffs": 40000, "nicotine_percent": 5, "price": 45000, "pack_price": 80000, "pack_size": 2 }],
  "total": 12,
  "limit": 24,
  "offset": 0
}`,
    group: "Catálogo",
    tryable: true,
  },
  {
    method: "GET",
    path: "/v1/catalog/products/{slug}",
    description: "Detalle de un producto por slug.",
    example: `{ "ref": "VP-011", "slug": "nimmbox-flux", "name": "Nimmbox Flux", "puffs": 40000, "battery_mah": 700, "charging": "USB-C", "modes": "3 modos (Soft / Normal / Turbo)" }`,
    group: "Catálogo",
  },
  {
    method: "GET",
    path: "/v1/catalog/products/{slug}/related",
    description: "Hasta 4 productos parecidos: misma gama y luego los de puffs más cercanos.",
    example: `[{ "ref": "VP-012", "slug": "adjust-mycool", "name": "Adjust MyCool" }]`,
    group: "Catálogo",
  },
  {
    method: "GET",
    path: "/v1/inventory/availability",
    description: "Disponibilidad por referencia. refs=A,B",
    example: `[{ "ref": "VP-011", "status": "available" }]`,
    group: "Inventario",
    tryable: true,
  },
  {
    method: "POST",
    path: "/v1/cart",
    description: "Crea un carrito vacío.",
    example: `{ "token": "uuid", "items": [], "item_count": 0, "subtotal": 0, "has_unpriced": false }`,
    group: "Carrito y pedidos",
  },
  {
    method: "GET",
    path: "/v1/cart/{token}",
    description: "Consulta un carrito por token.",
    example: `{ "token": "uuid", "items": [], "item_count": 0, "subtotal": 0, "has_unpriced": false }`,
    group: "Carrito y pedidos",
  },
  {
    method: "PUT",
    path: "/v1/cart/{token}/items/{ref}",
    description: "Fija la cantidad de una línea (0 elimina).",
    example: `{ "token": "uuid", "items": [], "item_count": 1, "subtotal": 45000, "has_unpriced": false }`,
    group: "Carrito y pedidos",
  },
  {
    method: "DELETE",
    path: "/v1/cart/{token}/items/{ref}",
    description: "Elimina una línea del carrito.",
    example: `{ "token": "uuid", "items": [], "item_count": 0, "subtotal": 0, "has_unpriced": false }`,
    group: "Carrito y pedidos",
  },
  {
    method: "DELETE",
    path: "/v1/cart/{token}/items",
    description: "Vacía el carrito.",
    example: `{ "token": "uuid", "items": [], "item_count": 0, "subtotal": 0, "has_unpriced": false }`,
    group: "Carrito y pedidos",
  },
  {
    method: "POST",
    path: "/v1/orders",
    description: "Crea un pedido a partir de un carrito.",
    example: `{ "order": { "code": "VP-000123", "status": "pending" }, "whatsapp_url": "https://wa.me/..." }`,
    group: "Carrito y pedidos",
  },
  {
    method: "GET",
    path: "/v1/orders/track/{code}",
    description: "Consulta un pedido por código, validando el celular. phone=",
    example: `{ "code": "VP-000123", "status": "pending" }`,
    group: "Carrito y pedidos",
  },
  {
    method: "POST",
    path: "/admin/login",
    description: "Autenticación del panel de administración.",
    example: `{ "token": "...", "user": { "id": 1, "name": "Admin", "email": "admin@nubeneon.lat" } }`,
    group: "Administración",
    admin: true,
  },
  {
    method: "GET",
    path: "/admin/dashboard",
    description: "KPIs agregados del negocio para el panel.",
    example: `{ "orders": null, "inventory": null, "catalog": null, "messages": null, "errors": {} }`,
    group: "Administración",
    admin: true,
  },
  {
    method: "GET",
    path: "/admin/orders",
    description: "Lista de pedidos con filtros de estado y búsqueda.",
    example: `{ "items": [], "total": 0 }`,
    group: "Administración",
    admin: true,
  },
  {
    method: "PATCH",
    path: "/admin/orders/{id}/status",
    description: "Cambia el estado de un pedido siguiendo transiciones válidas.",
    example: `{ "id": 1, "status": "confirmed" }`,
    group: "Administración",
    admin: true,
  },
  {
    method: "GET",
    path: "/admin/inventory",
    description: "Inventario con estado por referencia.",
    example: `{ "items": [], "total": 0 }`,
    group: "Administración",
    admin: true,
  },
  {
    method: "PATCH",
    path: "/admin/inventory/{ref}",
    description: "Actualiza cantidad y umbral de una referencia.",
    example: `{ "ref": "VP-011", "quantity": 20 }`,
    group: "Administración",
    admin: true,
  },
  {
    method: "GET",
    path: "/admin/products",
    description: "Lista de productos incluyendo inactivos.",
    example: `{ "items": [], "total": 0 }`,
    group: "Administración",
    admin: true,
  },
  {
    method: "PATCH",
    path: "/admin/products/{ref}",
    description: "Actualiza precio, descripción o estado activo de un producto.",
    example: `{ "ref": "VP-011", "price": 45000 }`,
    group: "Administración",
    admin: true,
  },
  {
    method: "GET",
    path: "/admin/messages",
    description: "Mensajes de contacto recibidos.",
    example: `{ "items": [], "total": 0 }`,
    group: "Administración",
    admin: true,
  },
  {
    method: "PATCH",
    path: "/admin/messages/{id}",
    description: "Marca un mensaje como leído o archivado.",
    example: `{ "id": 1, "status": "read" }`,
    group: "Administración",
    admin: true,
  },
  {
    method: "PUT",
    path: "/admin/password",
    description: "Cambia la contraseña del administrador (pide la actual y cierra las otras sesiones).",
    example: `{ "message": "Contraseña actualizada." }`,
    group: "Administración",
    admin: true,
  },
  {
    method: "GET",
    path: "/admin/notifications",
    description: "SMS enviados al negocio por cada pedido nuevo (Twilio).",
    example: `{ "items": [{ "order_code": "VP-000001", "status": "sent" }], "total": 1 }`,
    group: "Administración",
    admin: true,
  },
  {
    method: "GET",
    path: "/admin/notifications/status",
    description: "Indica si Twilio está configurado y a qué números llegan los SMS.",
    example: `{ "sms_configured": true, "order_sms_to": ["+573044497385"] }`,
    group: "Administración",
    admin: true,
  },
];

export function groupedEndpoints(): Record<string, ApiEndpoint[]> {
  return endpoints.reduce<Record<string, ApiEndpoint[]>>((acc, endpoint) => {
    acc[endpoint.group] = acc[endpoint.group] || [];
    acc[endpoint.group].push(endpoint);
    return acc;
  }, {});
}
