from __future__ import annotations

from datetime import date
from typing import Literal, Optional
from pydantic import BaseModel, field_validator


class ExhibitionCreate(BaseModel):
    """
    创建展览请求体（所有字段必填）
    """
    title_en: str
    title_zh: str
    venue_en: str
    venue_zh: str
    continent: str
    country: str
    city: str
    start_date: date
    end_date: date
    cover_image: str = ""
    price: Literal["free", "paid"] = "paid"
    status: Literal["recent", "ending", "longTerm"] = "recent"
    description_en: str = ""
    description_zh: str = ""
    address_en: str = ""
    address_zh: str = ""
    hours_en: str = ""
    hours_zh: str = ""
    transport_en: str = ""
    transport_zh: str = ""
    # 卪约网址
    booking_url: str = ""
    # 关联场馆 ID（可空）
    venue_id: Optional[int] = None
    # 艺术家和图片作为简单列表传入
    artists: list[str] = []
    images: list[str] = []

    @field_validator("end_date")
    @classmethod
    def end_date_must_be_after_start(cls, v: date, info) -> date:
        """
        结束日期必须晚于或等于开始日期
        """
        start = info.data.get("start_date")
        if start and v < start:
            raise ValueError("end_date 必须晚于或等于 start_date")
        return v


class ExhibitionUpdate(BaseModel):
    """
    更新展览请求体（所有字段可选，仅更新传入的字段）
    """
    title_en: Optional[str] = None
    title_zh: Optional[str] = None
    venue_en: Optional[str] = None
    venue_zh: Optional[str] = None
    continent: Optional[str] = None
    country: Optional[str] = None
    city: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    cover_image: Optional[str] = None
    price: Optional[Literal["free", "paid"]] = None
    status: Optional[Literal["recent", "ending", "longTerm"]] = None
    description_en: Optional[str] = None
    description_zh: Optional[str] = None
    address_en: Optional[str] = None
    address_zh: Optional[str] = None
    hours_en: Optional[str] = None
    hours_zh: Optional[str] = None
    transport_en: Optional[str] = None
    transport_zh: Optional[str] = None
    booking_url: Optional[str] = None
    venue_id: Optional[int] = None
    artists: Optional[list[str]] = None
    images: Optional[list[str]] = None
