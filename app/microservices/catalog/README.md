# catalog

FastAPI microservice for the K SMKSHOP catalog: categories (tiers), products with their vape specs, prices and pack promotions.

## Endpoints

| Method and path | Access | Notes |
| --- | --- | --- |
| `GET /health` | public | `{"status": "ok", "service": "catalog"}` |
| `GET /categories` | public | Tiers in order with `product_count` |
| `GET /facets` | public | Brands, device types, flavors and nicotine levels with counts, plus puff and price ranges |
| `GET /products` | public | Filters: `category`, `brand`, `type`, `flavor`, `nicotine` (comma lists), `puffs_min`, `puffs_max`, `price_max`, `q`, `featured`, `sort`, `limit`, `offset`, `include_inactive` |
| `GET /products/by-refs?refs=A,B` | public | Products for the given refs, unknown refs omitted |
| `GET /products/{slug}` | public | Product detail, `404` if missing or inactive |
| `GET /products/{slug}/related` | public | Up to 4: same tier first, then closest puffs |
| `PATCH /products/{ref}` | internal | Any of the spec fields, prices, `pack_price`/`pack_size`, flags, description |
| `GET /admin/products` | internal | Every product with cost and margin |
| `GET /summary` | internal | `{products, active, unpriced}` |

## Environment variables

| Variable | Default | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | `postgresql+asyncpg://vape:vape@postgres:5432/vape_catalog` | Async SQLAlchemy connection string |
| `INTERNAL_TOKEN` | `change-me` | Shared secret required in `X-Internal-Token` for internal endpoints |

## Seed

On first start, if the `products` table is empty, the service loads `seed/catalog.json` (4 tiers, 12 products, built from `inventario_vapers_v1.xlsx`). After that the admin panel is the source of truth.

## Running tests

```bash
python -m venv /tmp/venv-catalog
source /tmp/venv-catalog/bin/activate
pip install -r requirements-dev.txt
python -m pytest -q
```
