from pydantic import BaseModel, Field, field_validator

DEVICE_TYPES = ("desechable", "pod", "mod", "liquido", "accesorio")


class CategoryRef(BaseModel):
    slug: str
    name: str


class CategoryOut(BaseModel):
    slug: str
    name: str
    tagline: str | None
    product_count: int


class ProductOut(BaseModel):
    ref: str
    slug: str
    name: str
    brand: str | None
    category: CategoryRef
    device_type: str
    flavors: list[str]
    puffs: int | None
    nicotine_percent: float | None
    battery_mah: int | None
    charging: str | None
    modes: str | None
    highlights: list[str]
    description: str
    image_url: str
    price: int | None
    pack_price: int | None
    pack_size: int | None
    is_featured: bool
    is_new: bool
    is_active: bool


class AdminProductOut(ProductOut):
    """Internal view: adds what we pay and the resulting margin over cost. Never exposed publicly."""

    supplier: str | None
    cost_price: int | None
    margin_percent: float | None


class AdminProductListOut(BaseModel):
    items: list[AdminProductOut]
    total: int


class ProductListOut(BaseModel):
    items: list[ProductOut]
    total: int
    limit: int
    offset: int


class FacetValue(BaseModel):
    value: str
    count: int


class RangeOut(BaseModel):
    min: int | None
    max: int | None


class FacetsOut(BaseModel):
    brands: list[FacetValue]
    device_types: list[FacetValue]
    flavors: list[FacetValue]
    nicotine: list[FacetValue]
    puffs: RangeOut
    price: RangeOut


class ProductPatch(BaseModel):
    name: str | None = None
    description: str | None = None
    is_active: bool | None = None
    is_featured: bool | None = None
    is_new: bool | None = None
    price: int | None = None
    cost_price: int | None = None
    pack_price: int | None = None
    pack_size: int | None = Field(default=None, ge=2, le=10)
    flavors: list[str] | None = None
    puffs: int | None = Field(default=None, ge=0)
    nicotine_percent: float | None = Field(default=None, ge=0, le=20)
    battery_mah: int | None = Field(default=None, ge=0)
    charging: str | None = None
    modes: str | None = None
    device_type: str | None = None

    @field_validator("price", "cost_price", "pack_price")
    @classmethod
    def price_must_be_positive_or_null(cls, value: int | None) -> int | None:
        if value is not None and value <= 0:
            raise ValueError("el precio debe ser nulo o un entero positivo")
        return value

    @field_validator("device_type")
    @classmethod
    def device_type_must_be_known(cls, value: str | None) -> str | None:
        if value is not None and value not in DEVICE_TYPES:
            raise ValueError(f"el tipo debe ser uno de: {', '.join(DEVICE_TYPES)}")
        return value

    @field_validator("flavors")
    @classmethod
    def clean_flavors(cls, value: list[str] | None) -> list[str] | None:
        if value is None:
            return None
        return [f.strip() for f in value if f and f.strip()]


class SummaryOut(BaseModel):
    products: int
    active: int
    unpriced: int
