from sqlalchemy import select

from .config import settings
from .database import AsyncSessionLocal
from .models import Media, Profile, Service

DEFAULT_NAME = settings.business_name
DEFAULT_TAGLINE = "Vapes desechables, pods y accesorios en Colombia"
DEFAULT_DESCRIPTION = (
    f"{DEFAULT_NAME} es una tienda en línea de vapes desechables, pods, líquidos y accesorios. "
    "Venta exclusiva para mayores de 18 años. Estos productos contienen nicotina, "
    "una sustancia adictiva."
)

CONTACT_FIELDS = (
    "whatsapp",
    "phone",
    "email",
    "address",
    "city",
    "hours",
    "instagram",
    "facebook",
)

DEFAULT_SERVICES = [
    {
        "title": "Solo mayores de 18",
        "description": "Venta exclusiva para adultos. Al recibir el pedido se puede pedir documento de identidad.",
        "icon": "shield-check",
        "sort_order": 0,
    },
    {
        "title": "Pedidos por WhatsApp",
        "description": "Arma tu pedido en el sitio y confirma pago y entrega directamente por WhatsApp.",
        "icon": "message-circle",
        "sort_order": 1,
    },
    {
        "title": "Ficha técnica clara",
        "description": "Puffs, nicotina, batería, tipo de carga y modos de cada equipo antes de comprar.",
        "icon": "sparkles",
        "sort_order": 2,
    },
]


async def seed_if_empty() -> None:
    async with AsyncSessionLocal() as session:
        await _seed_profile(session)
        await _seed_services(session)
        await _seed_media(session)
        await session.commit()


async def _seed_profile(session) -> None:
    profile = await session.get(Profile, 1)

    if profile is None:
        profile = Profile(id=1, name=DEFAULT_NAME, tagline=DEFAULT_TAGLINE, description=DEFAULT_DESCRIPTION)
        for field in CONTACT_FIELDS:
            setattr(profile, field, getattr(settings, f"business_{field}"))
        session.add(profile)
        return

    for field in CONTACT_FIELDS:
        if getattr(profile, field) is None:
            env_value = getattr(settings, f"business_{field}")
            if env_value is not None:
                setattr(profile, field, env_value)


async def _seed_services(session) -> None:
    total = (await session.execute(select(Service.id))).first()
    if total is not None:
        return
    for item in DEFAULT_SERVICES:
        session.add(Service(**item))


async def _seed_media(session) -> None:
    total = (await session.execute(select(Media.id))).first()
    if total is not None:
        return
    session.add(Media(kind="hero", title=DEFAULT_NAME, url="/media/site/hero.webp", alt=DEFAULT_NAME, sort_order=0))
