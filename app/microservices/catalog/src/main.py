from collections import Counter
from contextlib import asynccontextmanager
from typing import Literal

from fastapi import Depends, FastAPI, HTTPException, Query
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from .database import get_db, init_db
from .errors import install_error_handlers
from .models import Category, Product
from .pricing import real_margin_percent
from .schemas import (
    AdminProductListOut,
    AdminProductOut,
    CategoryOut,
    CategoryRef,
    FacetsOut,
    FacetValue,
    ProductListOut,
    ProductOut,
    ProductPatch,
    RangeOut,
    SummaryOut,
)
from .security import require_internal
from .seed import refresh_derived, seed_if_empty
from .text import normalize


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    await seed_if_empty()
    yield


app = FastAPI(title="K SMKSHOP - Catalog", lifespan=lifespan)
install_error_handlers(app)

SortKey = Literal["relevancia", "precio_asc", "precio_desc", "puffs_desc", "puffs_asc"]


@app.get("/health")
async def health() -> dict:
    return {"status": "ok", "service": "catalog"}


def default_description(product: Product) -> str:
    parts = [product.name]
    if product.puffs:
        parts.append(f"{product.puffs:,} puffs".replace(",", "."))
    if product.nicotine_percent is not None:
        parts.append(f"nicotina {product.nicotine_percent:g}%")
    return " · ".join(parts) + "."


def to_product_out(product: Product) -> ProductOut:
    return ProductOut(
        ref=product.ref,
        slug=product.slug,
        name=product.name,
        brand=product.brand,
        category=CategoryRef(slug=product.category.slug, name=product.category.name),
        device_type=product.device_type,
        flavors=product.flavors or [],
        puffs=product.puffs,
        nicotine_percent=product.nicotine_percent,
        battery_mah=product.battery_mah,
        charging=product.charging,
        modes=product.modes,
        highlights=product.highlights or [],
        description=product.description or default_description(product),
        image_url=f"/media/products/{product.image}" if product.image else "",
        price=product.price,
        pack_price=product.pack_price,
        pack_size=product.pack_size,
        is_featured=product.is_featured,
        is_new=product.is_new,
        is_active=product.is_active,
    )


def to_admin_product_out(product: Product) -> AdminProductOut:
    return AdminProductOut(
        **to_product_out(product).model_dump(),
        supplier=product.supplier,
        cost_price=product.cost_price,
        margin_percent=real_margin_percent(product.cost_price, product.price),
    )


def split_csv(value: str | None) -> list[str]:
    return [item.strip() for item in (value or "").split(",") if item.strip()]


@app.get("/categories", response_model=list[CategoryOut])
async def list_categories(db: AsyncSession = Depends(get_db)) -> list[CategoryOut]:
    categories = (await db.execute(select(Category).order_by(Category.sort_order))).scalars().all()
    counts = dict(
        (
            await db.execute(
                select(Product.category_slug, func.count(Product.ref))
                .where(Product.is_active.is_(True))
                .group_by(Product.category_slug)
            )
        ).all()
    )
    return [
        CategoryOut(slug=c.slug, name=c.name, tagline=c.tagline, product_count=counts.get(c.slug, 0))
        for c in categories
    ]


@app.get("/facets", response_model=FacetsOut)
async def get_facets(db: AsyncSession = Depends(get_db)) -> FacetsOut:
    """Every value the storefront filters can offer, counted over active products."""
    products = (await db.execute(select(Product).where(Product.is_active.is_(True)))).scalars().all()

    def counted(values) -> list[FacetValue]:
        counter = Counter(v for v in values if v)
        return [FacetValue(value=k, count=n) for k, n in sorted(counter.items(), key=lambda kv: kv[0].lower())]

    puffs = [p.puffs for p in products if p.puffs]
    prices = [p.price for p in products if p.price]
    return FacetsOut(
        brands=counted(p.brand for p in products),
        device_types=counted(p.device_type for p in products),
        flavors=counted(f for p in products for f in (p.flavors or [])),
        nicotine=counted(f"{p.nicotine_percent:g}" for p in products if p.nicotine_percent is not None),
        puffs=RangeOut(min=min(puffs, default=None), max=max(puffs, default=None)),
        price=RangeOut(min=min(prices, default=None), max=max(prices, default=None)),
    )


@app.get("/products", response_model=ProductListOut)
async def list_products(
    category: str | None = None,
    brand: str | None = Query(default=None, description="Una o varias marcas separadas por coma"),
    type: str | None = Query(default=None, description="desechable, pod, mod, liquido, accesorio (separados por coma)"),
    flavor: str | None = Query(default=None, description="Uno o varios sabores separados por coma"),
    nicotine: str | None = Query(default=None, description="Porcentajes separados por coma, p. ej. 0,3,5"),
    puffs_min: int | None = Query(default=None, ge=0),
    puffs_max: int | None = Query(default=None, ge=0),
    price_max: int | None = Query(default=None, ge=0),
    q: str | None = None,
    featured: bool | None = None,
    sort: SortKey = "relevancia",
    limit: int = Query(default=24, ge=1, le=1000),
    offset: int = Query(default=0, ge=0),
    include_inactive: bool = False,
    db: AsyncSession = Depends(get_db),
) -> ProductListOut:
    stmt = select(Product)

    if not include_inactive:
        stmt = stmt.where(Product.is_active.is_(True))
    if category:
        stmt = stmt.where(Product.category_slug == category)
    if brands := split_csv(brand):
        stmt = stmt.where(Product.brand.in_(brands))
    if types := split_csv(type):
        stmt = stmt.where(Product.device_type.in_(types))
    if flavors := split_csv(flavor):
        stmt = stmt.where(or_(*(Product.flavor_text.like(f"%|{normalize(f)}|%") for f in flavors)))
    if nicotine_levels := split_csv(nicotine):
        try:
            levels = [float(n) for n in nicotine_levels]
        except ValueError:
            raise HTTPException(422, "El nivel de nicotina debe ser un número")
        stmt = stmt.where(Product.nicotine_percent.in_(levels))
    if puffs_min is not None:
        stmt = stmt.where(Product.puffs >= puffs_min)
    if puffs_max is not None:
        stmt = stmt.where(Product.puffs <= puffs_max)
    if price_max is not None:
        stmt = stmt.where(Product.price <= price_max)
    if featured is not None:
        stmt = stmt.where(Product.is_featured.is_(featured))
    if q:
        for word in normalize(q).split():
            stmt = stmt.where(Product.search_text.like(f"%{word}%"))

    total = (await db.execute(select(func.count()).select_from(stmt.subquery()))).scalar_one()

    order = {
        "relevancia": (Product.sort_order,),
        "precio_asc": (Product.price.asc(), Product.sort_order),
        "precio_desc": (Product.price.desc(), Product.sort_order),
        "puffs_desc": (Product.puffs.desc(), Product.sort_order),
        "puffs_asc": (Product.puffs.asc(), Product.sort_order),
    }[sort]
    products = (await db.execute(stmt.order_by(*order).limit(limit).offset(offset))).scalars().all()

    return ProductListOut(
        items=[to_product_out(p) for p in products], total=total, limit=limit, offset=offset
    )


@app.get("/products/by-refs", response_model=list[ProductOut])
async def get_products_by_refs(refs: str, db: AsyncSession = Depends(get_db)) -> list[ProductOut]:
    ref_list = split_csv(refs)
    if not ref_list:
        return []
    products = (await db.execute(select(Product).where(Product.ref.in_(ref_list)))).scalars().all()
    by_ref = {p.ref: p for p in products}
    return [to_product_out(by_ref[ref]) for ref in ref_list if ref in by_ref]


async def _active_by_slug(db: AsyncSession, slug: str) -> Product:
    product = (await db.execute(select(Product).where(Product.slug == slug))).scalar_one_or_none()
    if not product or not product.is_active:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return product


@app.get("/products/{slug}", response_model=ProductOut)
async def get_product(slug: str, db: AsyncSession = Depends(get_db)) -> ProductOut:
    return to_product_out(await _active_by_slug(db, slug))


@app.get("/products/{slug}/related", response_model=list[ProductOut])
async def get_related_products(slug: str, db: AsyncSession = Depends(get_db)) -> list[ProductOut]:
    """Same category first, then the closest number of puffs."""
    product = await _active_by_slug(db, slug)
    others = (
        await db.execute(
            select(Product).where(Product.ref != product.ref, Product.is_active.is_(True))
        )
    ).scalars().all()
    target = product.puffs or 0
    ranked = sorted(
        others,
        key=lambda p: (p.category_slug != product.category_slug, abs((p.puffs or 0) - target), p.sort_order),
    )
    return [to_product_out(p) for p in ranked[:4]]


@app.patch("/products/{ref}", response_model=ProductOut, dependencies=[Depends(require_internal)])
async def patch_product(ref: str, payload: ProductPatch, db: AsyncSession = Depends(get_db)) -> ProductOut:
    product = await db.get(Product, ref)
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(product, field, value)

    # A pack price without a size means "2 for"; clearing the price removes the promotion.
    if product.pack_price is None:
        product.pack_size = None
    elif product.pack_size is None:
        product.pack_size = 2

    refresh_derived(product)
    await db.commit()
    await db.refresh(product, ["category"])
    return to_product_out(product)


@app.get("/admin/products", response_model=AdminProductListOut, dependencies=[Depends(require_internal)])
async def list_admin_products(db: AsyncSession = Depends(get_db)) -> AdminProductListOut:
    """Every product (active or not) with cost and margin, for the admin panel."""
    products = (await db.execute(select(Product).order_by(Product.sort_order, Product.name))).scalars().all()
    return AdminProductListOut(items=[to_admin_product_out(p) for p in products], total=len(products))


@app.get("/summary", dependencies=[Depends(require_internal)])
async def get_summary(db: AsyncSession = Depends(get_db)) -> SummaryOut:
    total = (await db.execute(select(func.count(Product.ref)))).scalar_one()
    active = (await db.execute(select(func.count(Product.ref)).where(Product.is_active.is_(True)))).scalar_one()
    unpriced = (await db.execute(select(func.count(Product.ref)).where(Product.price.is_(None)))).scalar_one()
    return SummaryOut(products=total, active=active, unpriced=unpriced)
