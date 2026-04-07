from __future__ import annotations

from sqlalchemy import Column, Integer, String, Text
from database import Base


class Venue(Base):
    """
    艺术场馆表，存储场馆基本信息
    """
    __tablename__ = "venues"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)

    # 双语名称
    name_zh = Column(String(255), nullable=False)
    name_en = Column(String(255), nullable=False, default="")

    # 地理位置
    continent = Column(String(100), nullable=False, default="")
    country = Column(String(100), nullable=False, default="")
    city = Column(String(100), nullable=False, default="")

    # 双语地址
    address_zh = Column(String(500), nullable=False, default="")
    address_en = Column(String(500), nullable=False, default="")

    # 开放时间（双语）
    hours_zh = Column(String(255), nullable=False, default="")
    hours_en = Column(String(255), nullable=False, default="")

    # 场馆封面图
    cover_image = Column(String(500), nullable=False, default="")

    # 场馆简介
    description_zh = Column(Text, nullable=False, default="")
    description_en = Column(Text, nullable=False, default="")

    # 官网
    website = Column(String(500), nullable=False, default="")
