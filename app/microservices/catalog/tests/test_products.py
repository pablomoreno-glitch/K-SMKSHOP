from .conftest import TEST_INTERNAL_TOKEN

AUTH = {"X-Internal-Token": TEST_INTERNAL_TOKEN}


async def refs(client, **params) -> list[str]:
    response = await client.get("/products", params={"limit": 1000, **params})
    assert response.status_code == 200, response.text
    return [item["ref"] for item in response.json()["items"]]


async def test_get_product_by_slug_404_when_missing(client):
    response = await client.get("/products/no-existe")
    assert response.status_code == 404
    assert response.json() == {"error": "Producto no encontrado"}


async def test_filter_by_brand_accepts_several(client):
    found = await refs(client, brand="Nimmbox,Adjust")
    assert sorted(found) == ["VP-011", "VP-012"]


async def test_filter_by_puffs_range(client):
    found = await refs(client, puffs_min=30000, puffs_max=40000)
    assert sorted(found) == ["VP-008", "VP-009", "VP-011", "VP-012"]


async def test_filter_by_flavor_is_accent_and_case_insensitive(client):
    assert await refs(client, flavor="white peach ice") == ["VP-011"]
    assert await refs(client, flavor="PEACH") == []  # whole flavor, not a fragment


async def test_filter_by_type_and_nicotine(client):
    assert len(await refs(client, type="desechable", nicotine="5")) == 12
    assert await refs(client, type="pod") == []
    assert await refs(client, nicotine="3") == []


async def test_bad_nicotine_value_is_422(client):
    assert (await client.get("/products", params={"nicotine": "mucho"})).status_code == 422


async def test_search_matches_every_word(client):
    assert await refs(client, q="lost mary") == ["VP-002", "VP-003", "VP-010"]
    assert await refs(client, q="peach") == ["VP-011"]


async def test_sort_by_price_and_puffs(client):
    by_price = await refs(client, sort="precio_asc")
    assert by_price[0] == "VP-001"
    by_puffs = await refs(client, sort="puffs_desc")
    assert by_puffs[0] == "VP-010"


async def test_facets_list_brands_flavors_and_ranges(client):
    facets = (await client.get("/facets")).json()
    brands = {f["value"]: f["count"] for f in facets["brands"]}
    assert brands["Lost Mary"] == 3
    assert {"value": "White Peach Ice", "count": 1} in facets["flavors"]
    assert facets["puffs"] == {"min": 5000, "max": 50000}
    assert facets["price"] == {"min": 16000, "max": 50000}
    assert facets["nicotine"] == [{"value": "5", "count": 12}]


async def test_inactive_product_is_hidden(client):
    assert (await client.patch("/products/VP-001", json={"is_active": False}, headers=AUTH)).status_code == 200
    assert (await client.get("/products/death-row-vapes")).status_code == 404
    assert "VP-001" not in await refs(client)


async def test_patch_flavors_updates_search_and_filter(client):
    resp = await client.patch("/products/VP-008", json={"flavors": ["Blueberry Ice", " Banana "]}, headers=AUTH)
    assert resp.json()["flavors"] == ["Blueberry Ice", "Banana"]
    assert await refs(client, flavor="banana") == ["VP-008"]
    assert await refs(client, q="blueberry") == ["VP-008"]


async def test_pack_price_defaults_to_two_units_and_clears(client):
    resp = await client.patch("/products/VP-010", json={"pack_price": 90000}, headers=AUTH)
    assert resp.json()["pack_size"] == 2
    resp = await client.patch("/products/VP-010", json={"pack_price": None}, headers=AUTH)
    assert resp.json()["pack_price"] is None and resp.json()["pack_size"] is None


async def test_unknown_device_type_is_rejected(client):
    resp = await client.patch("/products/VP-010", json={"device_type": "cigarro"}, headers=AUTH)
    assert resp.status_code == 422


async def test_related_prefers_same_category(client):
    items = (await client.get("/products/nimmbox-flux/related")).json()
    assert items[0]["ref"] == "VP-012"
    assert "VP-011" not in [i["ref"] for i in items]


async def test_products_by_refs_omits_unknown_refs(client):
    response = await client.get("/products/by-refs", params={"refs": "VP-011,NOPE"})
    assert [i["ref"] for i in response.json()] == ["VP-011"]
