from .conftest import SEED, SEED_ACTIVE, SEED_CATEGORIES


async def test_seed_loads_every_product_with_image_urls(client):
    body = (await client.get("/products", params={"limit": 1000})).json()
    assert body["total"] == SEED_ACTIVE
    for item in body["items"]:
        assert item["image_url"].startswith("/media/products/")


async def test_seed_loads_every_category_with_counts(client):
    categories = (await client.get("/categories")).json()
    assert len(categories) == SEED_CATEGORIES
    assert sum(c["product_count"] for c in categories) == SEED_ACTIVE


async def test_seed_keeps_the_vape_specs(client):
    item = (await client.get("/products/nimmbox-flux")).json()
    seed = next(p for p in SEED["products"] if p["ref"] == "VP-011")
    assert item["puffs"] == seed["puffs"] == 40000
    assert item["nicotine_percent"] == 5.0
    assert item["battery_mah"] == 700
    assert item["charging"] == "USB-C"
    assert item["flavors"] == ["White Peach Ice"]
    assert item["pack_price"] == 80000 and item["pack_size"] == 2


async def test_seed_is_idempotent_on_restart(client):
    first = await client.get("/products", params={"limit": 1000})
    second = await client.get("/products", params={"limit": 1000})
    assert first.json()["total"] == second.json()["total"] == SEED_ACTIVE
