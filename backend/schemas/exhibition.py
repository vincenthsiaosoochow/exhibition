from __future__ import annotations

from datetime import date
from typing import Literal
from pydantic import BaseModel


class ExhibitionArtistSchema(BaseModel):
    artist_name: str

    model_config = {"from_attributes": True}


class ExhibitionImageSchema(BaseModel):
    image_url: str
    sort_order: int

    model_config = {"from_attributes": True}


class ExhibitionBase(BaseModel):
    title_en: str
    title_zh: str
    venue_en: str
    venue_zh: str
    continent: str
    country: str
    city: str
    start_date: date
    end_date: date
    cover_image: str
    price: Literal["free", "paid"]
    status: Literal["recent", "ending", "longTerm"]
    description_en: str
    description_zh: str
    address_en: str
    address_zh: str
    hours_en: str
    hours_zh: str
    transport_en: str
    transport_zh: str


class ExhibitionResponse(ExhibitionBase):
    """
    API 响应模型：与前端 Exhibition interface 对齐的扁平化结构
    """
    id: int
    artists: list[str]
    images: list[str]

    model_config = {"from_attributes": True}


class ExhibitionListResponse(BaseModel):
    """
    列表接口响应包装
    """
    total: int
    items: list[ExhibitionResponse]
