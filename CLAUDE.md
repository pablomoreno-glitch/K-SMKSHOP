# K SMKSHOP

Tienda en línea de vapes desechables para Colombia. Dominio previsto `ksmkshop.com` (sin comprar todavía).
Copia adaptada de salud-inteligente (pablomoreno-glitch/salud-inteligente), con la misma arquitectura. El detalle está en README.md.

## Reglas de trabajo

- Trabajar en español.
- Commits pequeños con mensajes claros. Nunca hacer push sin preguntar.
- Sin atribución a Claude en commits ni PRs.

## Estructura

- `app/frontend`: React + Vite + Tailwind. Se publica en Netlify (`netlify.toml` reenvía `/api/*` al gateway).
- `app/backend/gateway`: gateway en Laravel 12, el único punto público de la API.
- `app/microservices/{business,catalog,inventory,orders,notifications}`: FastAPI.
- Postgres 16, Docker Compose y Caddy en el VPS (`deploy/`, `docker-compose.*.yml`).

## Datos clave

- Nombre, dominio y WhatsApp están centralizados en `app/frontend/src/lib/brand.ts`. Además: `app/frontend/index.html`, `BUSINESS_NAME`/`ROOT_DOMAIN` en el `.env` del servidor y `netlify.toml`.
- WhatsApp de pedidos: `573044497385`. Códigos de pedido: `VP-000001`.
- Seed (solo con la base vacía): `app/microservices/catalog/seed/catalog.json`, 12 productos. Fotos en `app/frontend/public/media/products/` (recortes de flyers, provisionales).
- Filtros del catálogo en la URL. Facetas en `GET /v1/catalog/facets`.
- Promoción por paquete: `pack_price` y `pack_size` (por ejemplo 2 x $80.000). Se aplica en el carrito, el pedido y el mensaje de WhatsApp.
- AgeGate obligatorio y advertencia de nicotina en el pie (`NICOTINE_WARNING` en `brand.ts`). No quitarlos.
- Diseño oscuro con neón magenta `#FF4FC3` y cian `#45E3FF`. Fuentes Monoton, Unbounded y Figtree, servidas desde el propio sitio. Los tokens de Tailwind conservan los nombres originales (`paper`, `sage`, `ink`, `forest`, `leaf`).
- Contenedores `vape_*`, red `vape`, puertos 3300 (tienda), 8120 (gateway), 9301-9306 (servicios) y 5732 (Postgres). En el VPS compartido: `docker-compose.shared.yml` con `-p vape`.

## Pruebas

Las mismas que corre `.github/workflows/ci.yml`:

```bash
# Cada microservicio
cd app/microservices/<servicio> && pip install -r requirements-dev.txt && python -m pytest -q

# Gateway (en Windows, composer está en C:/ProgramData/ComposerSetup/bin)
cd app/backend/gateway && composer install && ./vendor/bin/pint --test && php artisan test

# Frontend
cd app/frontend && npm ci && npm run lint && npm run test && npm run build
```

## Pendientes

1. Comprar `ksmkshop.com` y configurarlo en `netlify.toml` y en el `.env` del servidor.
2. Reemplazar las fotos de producto por fotos propias.
3. Cargar los sabores reales de cada producto.
4. Desplegar: tienda en Netlify y API en el VPS compartido (`docker-compose.shared.yml`, `-p vape`).
5. Logo y paleta definitivos.
