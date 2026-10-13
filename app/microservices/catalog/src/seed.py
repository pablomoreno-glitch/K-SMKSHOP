import json
from pathlib import Path

from sqlalchemy import func, select

from .database import AsyncSessionLocal
from .models import Category, Product
from .text import normalize

SEED_FILE = Path(__file__).resolve().parent.parent / "seed" / "catalog.json"


def build_flavor_text(flavors: list[str]) -> str:
    return "".join(f"|{normalize(f)}|" for f in flavors)


def build_search_text(product: Product) -> str:
    parts = [
        product.ref,
        product.name,
        product.brand or "",
        product.device_type or "",
        product.modes or "",
        *(product.flavors or []),
        *(product.highlights or []),
    ]
    return normalize(" ".join(parts))


def refresh_derived(product: Product) -> None:
    """Recompute the search columns after any change to the fields they are built from."""
    product.flavor_text = build_flavor_text(product.flavors or [])
    product.search_text = build_search_text(product)


def product_from_seed(item: dict) -> Product:
    product = Product(
        ref=item["ref"],
        slug=item["slug"],
        name=item["name"],
        brand=item.get("brand"),
        category_slug=item["category"],
        device_type=item.get("device_type", "desechable"),
        flavors=item.get("flavors", []),
        puffs=item.get("puffs"),
        nicotine_percent=item.get("nicotine_percent"),
        battery_mah=item.get("battery_mah"),
        charging=item.get("charging"),
        modes=item.get("modes"),
        highlights=item.get("highlights", []),
        image=item.get("image"),
        description=item.get("description"),
        price=item.get("price"),
        pack_price=item.get("pack_price"),
        pack_size=item.get("pack_size"),
        supplier=item.get("supplier"),
        cost_price=item.get("cost_price"),
        is_featured=item.get("is_featured", False),
        is_new=item.get("is_new", False),
        is_active=item.get("is_active", True),
        sort_order=item.get("sort_order", 0),
    )
    refresh_derived(product)
    return product


async def seed_if_empty() -> None:
    async with AsyncSessionLocal() as session:
        total = (await session.execute(select(func.count(Product.ref)))).scalar_one()
        if total > 0:
            return

        data = json.loads(SEED_FILE.read_text(encoding="utf-8"))

        for item in data["categories"]:
            session.add(
                Category(
                    slug=item["slug"],
                    name=item["name"],
                    tagline=item.get("tagline"),
                    sort_order=item.get("sort_order", 0),
                )
            )
        await session.flush()

        for item in data["products"]:
            session.add(product_from_seed(item))

        await session.commit()
