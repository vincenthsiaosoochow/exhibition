import logging
from typing import Optional

from sqlalchemy.orm import Session

from models.venue import Venue
from schemas.venue import VenueCreate, VenueUpdate, VenueResponse, VenueListResponse

logger = logging.getLogger(__name__)


def _to_response(venue: Venue) -> VenueResponse:
    """将 ORM 对象转换为 API 响应模型"""
    return VenueResponse(
        id=venue.id,
        name_zh=venue.name_zh,
        name_en=venue.name_en,
        continent=venue.continent,
        country=venue.country,
        city=venue.city,
        address_zh=venue.address_zh,
        address_en=venue.address_en,
        hours_zh=venue.hours_zh,
        hours_en=venue.hours_en,
        cover_image=venue.cover_image,
        description_zh=venue.description_zh,
        description_en=venue.description_en,
        website=venue.website,
    )


def get_venues(
    db: Session,
    continent: Optional[str] = None,
    country: Optional[str] = None,
    city: Optional[str] = None,
    search: Optional[str] = None,
) -> list[VenueResponse]:
    """
    获取场馆列表，支持地区筛选和关键词搜索
    """
    from sqlalchemy import or_
    query = db.query(Venue)

    if search:
        keyword = f"%{search}%"
        query = query.filter(
            or_(
                Venue.name_zh.ilike(keyword),
                Venue.name_en.ilike(keyword),
                Venue.city.ilike(keyword),
            )
        )

    if continent and continent != "all":
        query = query.filter(Venue.continent == continent)

    if country and country != "all":
        query = query.filter(Venue.country == country)

    if city and city != "all":
        query = query.filter(Venue.city == city)

    venues = query.order_by(Venue.name_zh).all()
    return [_to_response(v) for v in venues]


def get_venue_by_id(db: Session, venue_id: int) -> Optional[VenueResponse]:
    """根据 ID 获取场馆详情"""
    venue = db.query(Venue).filter(Venue.id == venue_id).first()
    if not venue:
        return None
    return _to_response(venue)


def create_venue(db: Session, data: VenueCreate) -> VenueResponse:
    """创建新场馆"""
    venue = Venue(**data.model_dump())
    db.add(venue)
    db.commit()
    db.refresh(venue)
    logger.info(f"场馆已创建：{venue.name_zh} (id={venue.id})")
    return _to_response(venue)


def update_venue(db: Session, venue_id: int, data: VenueUpdate) -> Optional[VenueResponse]:
    """更新场馆（仅更新非 None 字段）"""
    venue = db.query(Venue).filter(Venue.id == venue_id).first()
    if not venue:
        return None

    update_dict = data.model_dump(exclude_none=True)
    for field, value in update_dict.items():
        setattr(venue, field, value)

    db.commit()
    db.refresh(venue)
    logger.info(f"场馆已更新：id={venue_id}")
    return _to_response(venue)


def delete_venue(db: Session, venue_id: int) -> bool:
    """删除场馆，返回是否成功"""
    venue = db.query(Venue).filter(Venue.id == venue_id).first()
    if not venue:
        return False
    db.delete(venue)
    db.commit()
    logger.info(f"场馆已删除：id={venue_id}")
    return True
