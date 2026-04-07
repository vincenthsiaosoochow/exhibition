import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from database import get_db
from models.admin import Admin
from schemas.venue import VenueCreate, VenueUpdate, VenueResponse, VenueListResponse
from service import venue_service
from service.auth_service import get_current_admin

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/venues", tags=["venues"])


@router.get("", response_model=VenueListResponse)
def list_venues(
    continent: Optional[str] = Query(None, description="大洲筛选"),
    country: Optional[str] = Query(None, description="国家筛选"),
    city: Optional[str] = Query(None, description="城市筛选"),
    search: Optional[str] = Query(None, description="关键词搜索"),
    db: Session = Depends(get_db),
) -> VenueListResponse:
    """
    获取场馆列表，支持地区筛选和关键词搜索
    """
    items = venue_service.get_venues(
        db=db,
        continent=continent,
        country=country,
        city=city,
        search=search,
    )
    return VenueListResponse(total=len(items), items=items)


@router.get("/{venue_id}", response_model=VenueResponse)
def get_venue(
    venue_id: int,
    db: Session = Depends(get_db),
) -> VenueResponse:
    """根据 ID 获取场馆详情"""
    venue = venue_service.get_venue_by_id(db=db, venue_id=venue_id)
    if not venue:
        raise HTTPException(status_code=404, detail="Venue not found")
    return venue


@router.post("", response_model=VenueResponse, status_code=status.HTTP_201_CREATED)
def create_venue(
    data: VenueCreate,
    db: Session = Depends(get_db),
    admin: Admin = Depends(get_current_admin),
) -> VenueResponse:
    """创建场馆（需要管理员权限）"""
    logger.info(f"管理员 {admin.username} 创建了新场馆：{data.name_zh}")
    return venue_service.create_venue(db=db, data=data)


@router.put("/{venue_id}", response_model=VenueResponse)
def update_venue(
    venue_id: int,
    data: VenueUpdate,
    db: Session = Depends(get_db),
    admin: Admin = Depends(get_current_admin),
) -> VenueResponse:
    """更新场馆（需要管理员权限）"""
    venue = venue_service.update_venue(db=db, venue_id=venue_id, data=data)
    if not venue:
        raise HTTPException(status_code=404, detail="Venue not found")
    logger.info(f"管理员 {admin.username} 更新了场馆：{venue_id}")
    return venue


@router.delete("/{venue_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_venue(
    venue_id: int,
    db: Session = Depends(get_db),
    admin: Admin = Depends(get_current_admin),
):
    """删除场馆（需要管理员权限）"""
    success = venue_service.delete_venue(db=db, venue_id=venue_id)
    if not success:
        raise HTTPException(status_code=404, detail="Venue not found")
    logger.info(f"管理员 {admin.username} 删除了场馆：{venue_id}")
