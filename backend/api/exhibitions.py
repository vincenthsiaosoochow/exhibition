import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from database import get_db
from models.admin import Admin
from schemas.exhibition import ExhibitionResponse, ExhibitionListResponse
from schemas.exhibition_write import ExhibitionCreate, ExhibitionUpdate
from service import exhibition_service
from service.auth_service import get_current_admin

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/exhibitions", tags=["exhibitions"])


@router.get("", response_model=ExhibitionListResponse)
def list_exhibitions(
    search: Optional[str] = Query(None, description="关键词搜索（标题/场馆）"),
    continent: Optional[str] = Query(None, description="大洲筛选"),
    country: Optional[str] = Query(None, description="国家筛选"),
    city: Optional[str] = Query(None, description="城市筛选"),
    status_filter: Optional[str] = Query(None, alias="status", description="状态筛选：recent/ending/longTerm"),
    price: Optional[str] = Query(None, description="票价筛选：free/paid"),
    db: Session = Depends(get_db),
) -> ExhibitionListResponse:
    """
    获取展览列表，支持搜索和多维度筛选
    """
    items = exhibition_service.get_exhibitions(
        db=db,
        search=search,
        continent=continent,
        country=country,
        city=city,
        status=status_filter,
        price=price,
    )
    return ExhibitionListResponse(total=len(items), items=items)


@router.get("/{exhibition_id}", response_model=ExhibitionResponse)
def get_exhibition(
    exhibition_id: int,
    db: Session = Depends(get_db),
) -> ExhibitionResponse:
    """
    根据 ID 获取单个展览详情
    """
    exhibition = exhibition_service.get_exhibition_by_id(db=db, exhibition_id=exhibition_id)
    if not exhibition:
        raise HTTPException(status_code=404, detail="Exhibition not found")
    return exhibition


@router.post("", response_model=ExhibitionResponse, status_code=status.HTTP_201_CREATED)
def create_exhibition(
    data: ExhibitionCreate,
    db: Session = Depends(get_db),
    admin: Admin = Depends(get_current_admin),
) -> ExhibitionResponse:
    """
    创建新展览（需要管理员权限）
    """
    logger.info(f"管理员 {admin.username} 创建了新展览：{data.title_en}")
    return exhibition_service.create_exhibition(db=db, data=data)


@router.put("/{exhibition_id}", response_model=ExhibitionResponse)
def update_exhibition(
    exhibition_id: int,
    data: ExhibitionUpdate,
    db: Session = Depends(get_db),
    admin: Admin = Depends(get_current_admin),
) -> ExhibitionResponse:
    """
    更新展览（需要管理员权限）
    """
    exhibition = exhibition_service.update_exhibition(db=db, exhibition_id=exhibition_id, data=data)
    if not exhibition:
        raise HTTPException(status_code=404, detail="Exhibition not found")
    logger.info(f"管理员 {admin.username} 更新了展览：{exhibition_id}")
    return exhibition


@router.delete("/{exhibition_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_exhibition(
    exhibition_id: int,
    db: Session = Depends(get_db),
    admin: Admin = Depends(get_current_admin),
):
    """
    删除展览（需要管理员权限）
    """
    success = exhibition_service.delete_exhibition(db=db, exhibition_id=exhibition_id)
    if not success:
        raise HTTPException(status_code=404, detail="Exhibition not found")
    logger.info(f"管理员 {admin.username} 删除了展览：{exhibition_id}")

