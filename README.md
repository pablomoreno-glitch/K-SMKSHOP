# K SMKSHOP

Tienda en línea de vapes desechables, pods, líquidos y accesorios para Colombia.
Tienda: **K SMKSHOP**. Dominio previsto: `ksmkshop.com` (sin comprar todavía).

Parte de la arquitectura de [salud-inteligente](https://github.com/pablomoreno-glitch/salud-inteligente), pero es un proyecto independiente: repositorio, base de datos, contenedores, dominio y variables de entorno propios.

## Qué cambió frente a Salud Inteligente

| Tema | Aquí |
| --- | --- |
| Asesor IA | Eliminado (servicio `advisor`, ruta `/v1/advisor/chat`, Claude API). En su lugar: buscador y filtros |
| Filtros | Marca, tipo (desechable, pod, mod, líquido, accesorio), sabor, nicotina, rango de puffs, gama y orden por precio o puffs. Viven en la URL (`/catalogo?marca=Lost%20Mary&puffs=30000-40000`) para compartir el enlace por WhatsApp |
| Ficha de producto | Puffs, nicotina %, batería (mAh), tipo de carga, modos o niveles, sabores, destacados |
| Promoción "2 x $80.000" | `pack_price` y `pack_size` por producto. El carrito, el pedido y el mensaje de WhatsApp cobran cada par completo al precio del paquete |
| Mayoría de edad | Ventana obligatoria al entrar (sin botón de cerrar). Se recuerda 30 días en el navegador. La política de cookies queda visible sin confirmar |
| Advertencia sanitaria | "Este producto contiene nicotina..." en el pie de todas las páginas |
| Diseño | Oscuro con acentos neón magenta y cian. Logotipo en Monoton, títulos en Unbounded, texto en Figtree, fuentes servidas desde el propio sitio |
| Inicio | Escala de puffs: los 12 productos sobre un tubo de neón de 5K a 50K |
| WhatsApp de pedidos | 3044497385 (`BUSINESS_WHATSAPP=573044497385`) |
| Códigos de pedido | `VP-000001` |

## Arquitectura

```
Navegador ──> React (Vite + Tailwind)  ──/api──>  Gateway Laravel 12  ──>  business      (9201)
              Netlify en producción                (8110, único punto      catalog       (9202)
              nginx en local (3300)                 público de la API)     inventory     (9203)
                                                                           orders        (9204)
                                                                           notifications (9206) ──> Twilio SMS
                                                          PostgreSQL 16 (una base de datos por servicio)
```

Puertos publicados en local: tienda 3300, gateway 8120, servicios 9301 a 9306, Postgres 5732.
Los contenedores se llaman `vape_*` y la red `vape`.

## Catálogo inicial

`app/microservices/catalog/seed/catalog.json`, construido desde `inventario_vapers_v1.xlsx`: 12 productos en 4 gamas.

| Gama | Productos |
| --- | --- |
| Desechables básicos (5K a 12K) | Death Row, Lost Mary MO, Lost Mary OS, North |
| Desechables mid (15K) | Chillax, Baddie Bar, Humo Azul |
| Desechables premium (32K a 50K) | Bang Leader, EV Create, Lost Angel |
| Alta capacidad con modos (40K) | Nimmbox Flux (3 modos, 2 x $80.000), Adjust MyCool (5 niveles, 2 x $80.000) |

Las fotos de `app/frontend/public/media/products/` son recortes de los flyers. Sirven para arrancar; conviene reemplazarlas por fotos propias.
La mayoría de productos dice "sabores variados": los sabores se cargan desde el panel (`/admin/productos`, clic en el nombre) y aparecen solos en el filtro.

El seed solo se carga con la base vacía. Después, todo se edita desde el panel.

## API

Base: `https://api.ksmkshop.com/api`. Desde la tienda también responde en `/api/...` porque Netlify la reenvía al gateway.

| Método | Ruta | Para qué |
| --- | --- | --- |
| GET | `/v1/health` | Estado del gateway y de los servicios |
| GET | `/v1/business` | Perfil, contactos y servicios |
| GET | `/v1/catalog/categories` | Gamas con número de productos |
| GET | `/v1/catalog/facets` | Valores para los filtros: marcas, tipos, sabores, nicotina, rangos de puffs y precio |
| GET | `/v1/catalog/products` | Filtros `category`, `brand`, `type`, `flavor`, `nicotine` (listas con coma), `puffs_min`, `puffs_max`, `price_max`, `q`, `featured`, `sort` (`relevancia`, `precio_asc`, `precio_desc`, `puffs_desc`, `puffs_asc`), `limit`, `offset` |
| GET | `/v1/catalog/products/{slug}` | Un producto |
| GET | `/v1/catalog/products/{slug}/related` | Parecidos: misma gama y luego puffs más cercanos |
| GET | `/v1/inventory/availability?refs=A,B` | Disponible, pocas unidades o agotado |
| POST/GET/PUT/DELETE | `/v1/cart...` | Carrito |
| POST | `/v1/orders` | Confirmar pedido; devuelve el código y el enlace de WhatsApp |
| GET | `/v1/orders/track/{code}?phone=` | Seguimiento |

Las rutas `/admin/*` (pedidos, inventario, productos, mensajes, SMS) son las mismas de Salud Inteligente; `PATCH /admin/products/{ref}` acepta además `flavors`, `puffs`, `nicotine_percent`, `battery_mah`, `charging`, `modes`, `device_type`, `pack_price`, `pack_size`, `is_featured` e `is_new`.

```bash
curl "https://api.ksmkshop.com/api/v1/catalog/products?brand=Nimmbox,Adjust&puffs_min=40000"
```

## Desarrollo local

```bash
docker compose up -d --build
```

| URL | Qué es |
| --- | --- |
| http://localhost:3300 | Tienda |
| http://localhost:3300/admin | Panel (`admin@ksmkshop.com` / `VapeAdmin2026!` solo en local) |
| http://localhost:8120/api/v1/health | Estado del gateway |

## Pruebas

| Capa | Comando |
| --- | --- |
| Cada microservicio | `cd app/microservices/<servicio> && pip install -r requirements-dev.txt && python -m pytest -q` |
| Gateway | `cd app/backend/gateway && composer install && php artisan test` |
| Frontend | `cd app/frontend && npm ci && npm run lint && npm run test && npm run build` |

## Cambiar el nombre de la tienda

1. `app/frontend/src/lib/brand.ts` (nombre, dominio, WhatsApp).
2. `app/frontend/index.html` (título, descripción, canonical).
3. `BUSINESS_NAME` y `ROOT_DOMAIN` en el `.env` del servidor.
4. `netlify.toml` (destino del proxy `/api/*`).

## Despliegue

Tienda en Netlify y API en un servidor dedicado (VPS) con Docker Compose detrás de Caddy: `docker-compose.yml` + `docker-compose.prod.yml` + `docker-compose.caddy.yml`, que levanta `deploy/deploy-vps.sh`. Ver [deploy/README.md](deploy/README.md).
