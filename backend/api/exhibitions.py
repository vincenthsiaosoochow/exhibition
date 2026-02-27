import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.schemas.exhibition import ExhibitionResponse, ExhibitionListResponse
from backend.service import exhibition_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/exhibitions", tags=["exhibitions"])


@router.get("", response_model=ExhibitionListResponse)
def list_exhibitions(
    search: Optional[str] = Query(None, description="关键词搜索（标题/场馆）"),
    continent: Optional[str] = Query(None, description="大洲筛选"),
    country: Optional[str] = Query(None, description="国家筛选"),
    city: Optional[str] = Query(None, description="城市筛选"),
    status: Optional[str] = Query(None, description="状态筛选：recent/ending/longTerm"),
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
        status=status,
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
