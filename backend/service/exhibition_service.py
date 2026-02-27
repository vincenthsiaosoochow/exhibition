import logging
from typing import Optional

from sqlalchemy.orm import Session, selectinload
from sqlalchemy import or_

from backend.models.exhibition import Exhibition
from backend.schemas.exhibition import ExhibitionResponse

logger = logging.getLogger(__name__)


def _to_response(exhibition: Exhibition) -> ExhibitionResponse:
    """
    将 ORM 对象转换为 API 响应模型（展平 artists/images 关联）
    """
    return ExhibitionResponse(
        id=exhibition.id,
        title_en=exhibition.title_en,
        title_zh=exhibition.title_zh,
        venue_en=exhibition.venue_en,
        venue_zh=exhibition.venue_zh,
        continent=exhibition.continent,
        country=exhibition.country,
        city=exhibition.city,
        start_date=exhibition.start_date,
        end_date=exhibition.end_date,
        cover_image=exhibition.cover_image,
        price=exhibition.price,
        status=exhibition.status,
        description_en=exhibition.description_en,
        description_zh=exhibition.description_zh,
        address_en=exhibition.address_en,
        address_zh=exhibition.address_zh,
        hours_en=exhibition.hours_en,
        hours_zh=exhibition.hours_zh,
        transport_en=exhibition.transport_en,
        transport_zh=exhibition.transport_zh,
        artists=[a.artist_name for a in exhibition.artists],
        images=[img.image_url for img in exhibition.images],
    )


def get_exhibitions(
    db: Session,
    search: Optional[str] = None,
    continent: Optional[str] = None,
    country: Optional[str] = None,
    city: Optional[str] = None,
    status: Optional[str] = None,
    price: Optional[str] = None,
) -> list[ExhibitionResponse]:
    """
    获取展览列表，支持多维度筛选和关键词搜索
    """
    query = db.query(Exhibition).options(
        selectinload(Exhibition.artists),
        selectinload(Exhibition.images),
    )

    # 关键词搜索：匹配标题（双语）、场馆（双语）、艺术家名
    if search:
        keyword = f"%{search}%"
        query = query.filter(
            or_(
                Exhibition.title_en.ilike(keyword),
                Exhibition.title_zh.ilike(keyword),
                Exhibition.venue_en.ilike(keyword),
                Exhibition.venue_zh.ilike(keyword),
            )
        )

    if continent and continent != "all":
        query = query.filter(Exhibition.continent == continent)

    if country and country != "all":
        query = query.filter(Exhibition.country == country)

    if city and city != "all":
        query = query.filter(Exhibition.city == city)

    if status and status != "all":
        query = query.filter(Exhibition.status == status)

    if price and price != "all":
        query = query.filter(Exhibition.price == price)

    exhibitions = query.all()
    return [_to_response(ex) for ex in exhibitions]


def get_exhibition_by_id(db: Session, exhibition_id: int) -> Optional[ExhibitionResponse]:
    """
    根据 ID 获取单个展览详情
    """
    exhibition = (
        db.query(Exhibition)
        .options(
            selectinload(Exhibition.artists),
            selectinload(Exhibition.images),
        )
        .filter(Exhibition.id == exhibition_id)
        .first()
    )
    if not exhibition:
        return None
    return _to_response(exhibition)
