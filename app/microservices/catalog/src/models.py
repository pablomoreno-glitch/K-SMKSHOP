from sqlalchemy import Boolean, Float, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


class Category(Base):
    __tablename__ = "categories"

    slug: Mapped[str] = mapped_column(String(64), primary_key=True)
    name: Mapped[str] = mapped_column(String(120))
    tagline: Mapped[str | None] = mapped_column(String(200), nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)


class Product(Base):
    __tablename__ = "products"

    ref: Mapped[str] = mapped_column(String(32), primary_key=True)
    slug: Mapped[str] = mapped_column(String(220), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(200))
    brand: Mapped[str | None] = mapped_column(String(80), nullable=True, index=True)
    category_slug: Mapped[str] = mapped_column(ForeignKey("categories.slug"))
    # desechable, pod, mod, liquido or accesorio.
    device_type: Mapped[str] = mapped_column(String(40), default="desechable", index=True)
    flavors: Mapped[list] = mapped_column(JSON, default=list)
    # Flavors lowercased, without accents and wrapped in "|" so a LIKE finds one whole flavor.
    flavor_text: Mapped[str] = mapped_column(String(1000), default="")
    puffs: Mapped[int | None] = mapped_column(Integer, nullable=True)
    nicotine_percent: Mapped[float | None] = mapped_column(Float, nullable=True)
    battery_mah: Mapped[int | None] = mapped_column(Integer, nullable=True)
    charging: Mapped[str | None] = mapped_column(String(40), nullable=True)
    modes: Mapped[str | None] = mapped_column(String(120), nullable=True)
    highlights: Mapped[list] = mapped_column(JSON, default=list)
    image: Mapped[str | None] = mapped_column(String(200), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    price: Mapped[int | None] = mapped_column(Integer, nullable=True)
    # Promotion "pack_size units for pack_price" (e.g. 2 x $80.000). Both null when there is none.
    pack_price: Mapped[int | None] = mapped_column(Integer, nullable=True)
    pack_size: Mapped[int | None] = mapped_column(Integer, nullable=True)
    supplier: Mapped[str | None] = mapped_column(String(80), nullable=True)
    cost_price: Mapped[int | None] = mapped_column(Integer, nullable=True)
    is_featured: Mapped[bool] = mapped_column(Boolean, default=False)
    is_new: Mapped[bool] = mapped_column(Boolean, default=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    search_text: Mapped[str] = mapped_column(String(4000), default="")

    category: Mapped[Category] = relationship(lazy="joined")
