import logging
from typing import Optional

from sqlalchemy.orm import Session, selectinload
from sqlalchemy import or_

from models.exhibition import Exhibition, ExhibitionArtist, ExhibitionImage
from schemas.exhibition import ExhibitionResponse
from schemas.exhibition_write import ExhibitionCreate, ExhibitionUpdate

logger = logging.getLogger(__name__)


def _to_response(exhibition: Exhibition) -> ExhibitionResponse:
    """
    将 ORM 对象转换为 API 响应模型（展平 artists/images 关联）
    """
    return ExhibitionResponse(
        id=exhibition.id,
        view_count=exhibition.view_count or 0,
        venue_id=exhibition.venue_id,
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
        booking_url=exhibition.booking_url or '',
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
    sort_by: Optional[str] = None,
    venue_id: Optional[int] = None,
) -> list[ExhibitionResponse]:
    """
    获取展览列表，支持多维度筛选和关键词搜索
    sort_by='views' 时按浏览量降序排列（热门排序）
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

    # 按指定场馆筛选
    if venue_id is not None:
        query = query.filter(Exhibition.venue_id == venue_id)

    # 热门排序：按浏览量降序；默认按开始日期降序
    if sort_by == "views":
        query = query.order_by(Exhibition.view_count.desc())
    else:
        query = query.order_by(Exhibition.start_date.desc())

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


def increment_view_count(db: Session, exhibition_id: int) -> bool:
    """
    递增展览浏览量，返回是否成功
    NOTE: 直接 UPDATE，避免先 SELECT 再 UPDATE 的竞态条件
    """
    rows = (
        db.query(Exhibition)
        .filter(Exhibition.id == exhibition_id)
        .update({"view_count": Exhibition.view_count + 1}, synchronize_session=False)
    )
    if rows == 0:
        return False
    db.commit()
    return True


def _save_artists_and_images(
    db: Session,
    exhibition: Exhibition,
    artists: list[str],
    images: list[str],
) -> None:
    """
    删除旧的艺术家/图片关联，重新写入新数据
    NOTE: 采用「全量替换」策略，简化管理逻辑
    """
    for art in exhibition.artists:
        db.delete(art)
    for img in exhibition.images:
        db.delete(img)
    db.flush()

    for name in artists:
        db.add(ExhibitionArtist(exhibition_id=exhibition.id, artist_name=name))
    for idx, url in enumerate(images):
        db.add(ExhibitionImage(exhibition_id=exhibition.id, image_url=url, sort_order=idx))


def create_exhibition(db: Session, data: ExhibitionCreate) -> ExhibitionResponse:
    """
    创建新展览，同时写入艺术家和图片关联
    """
    artists = data.artists
    images = data.images
    exhibition_data = data.model_dump(exclude={"artists", "images"})

    exhibition = Exhibition(**exhibition_data)
    db.add(exhibition)
    db.flush()  # 获取自增 ID

    for name in artists:
        db.add(ExhibitionArtist(exhibition_id=exhibition.id, artist_name=name))
    for idx, url in enumerate(images):
        db.add(ExhibitionImage(exhibition_id=exhibition.id, image_url=url, sort_order=idx))

    db.commit()
    db.refresh(exhibition)

    # 重新加载关联数据
    db.expire(exhibition)
    return get_exhibition_by_id(db, exhibition.id)


def update_exhibition(
    db: Session,
    exhibition_id: int,
    data: ExhibitionUpdate,
) -> Optional[ExhibitionResponse]:
    """
    更新展览（仅更新 data 中非 None 的字段）
    """
    exhibition = (
        db.query(Exhibition)
        .options(selectinload(Exhibition.artists), selectinload(Exhibition.images))
        .filter(Exhibition.id == exhibition_id)
        .first()
    )
    if not exhibition:
        return None

    update_dict = data.model_dump(exclude_none=True, exclude={"artists", "images"})
    for field, value in update_dict.items():
        setattr(exhibition, field, value)

    # 如果传入了 artists/images 则全量替换
    if data.artists is not None or data.images is not None:
        _save_artists_and_images(
            db,
            exhibition,
            data.artists if data.artists is not None else [a.artist_name for a in exhibition.artists],
            data.images if data.images is not None else [img.image_url for img in exhibition.images],
        )

    db.commit()
    return get_exhibition_by_id(db, exhibition_id)


def delete_exhibition(db: Session, exhibition_id: int) -> bool:
    """
    删除展览（级联删除艺术家和图片），返回是否成功
    """
    exhibition = db.query(Exhibition).filter(Exhibition.id == exhibition_id).first()
    if not exhibition:
        return False
    db.delete(exhibition)
    db.commit()
    logger.info(f"展览已删除：id={exhibition_id}")
    return True
