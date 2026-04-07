from __future__ import annotations

from typing import Optional
from pydantic import BaseModel


class VenueBase(BaseModel):
    name_zh: str
    name_en: str = ""
    continent: str = ""
    country: str = ""
    city: str = ""
    address_zh: str = ""
    address_en: str = ""
    hours_zh: str = ""
    hours_en: str = ""
    cover_image: str = ""
    description_zh: str = ""
    description_en: str = ""
    website: str = ""


class VenueCreate(VenueBase):
    """创建场馆请求体"""
    pass


class VenueUpdate(BaseModel):
    """更新场馆请求体（所有字段可选）"""
    name_zh: Optional[str] = None
    name_en: Optional[str] = None
    continent: Optional[str] = None
    country: Optional[str] = None
    city: Optional[str] = None
    address_zh: Optional[str] = None
    address_en: Optional[str] = None
    hours_zh: Optional[str] = None
    hours_en: Optional[str] = None
    cover_image: Optional[str] = None
    description_zh: Optional[str] = None
    description_en: Optional[str] = None
    website: Optional[str] = None


class VenueResponse(VenueBase):
    """场馆 API 响应模型"""
    id: int

    model_config = {"from_attributes": True}


class VenueListResponse(BaseModel):
    """场馆列表响应"""
    total: int
    items: list[VenueResponse]
