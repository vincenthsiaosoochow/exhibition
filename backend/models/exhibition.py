from __future__ import annotations

from sqlalchemy import Column, Integer, String, Date, Enum, Text, ForeignKey
from sqlalchemy.orm import relationship
from database import Base


class Exhibition(Base):
    """
    艺术展览主表，存储双语字段（英文/中文）
    """
    __tablename__ = "exhibitions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)

    # 双语标题
    title_en = Column(String(255), nullable=False)
    title_zh = Column(String(255), nullable=False)

    # 双语场馆名称
    venue_en = Column(String(255), nullable=False)
    venue_zh = Column(String(255), nullable=False)

    # 地理位置
    continent = Column(String(100), nullable=False)
    country = Column(String(100), nullable=False)
    city = Column(String(100), nullable=False)

    # 展览时间
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)

    # 封面图（URL）
    cover_image = Column(String(500), nullable=False, default="")

    # 票价类型
    price = Column(Enum("free", "paid", name="price_enum"), nullable=False, default="paid")

    # 展览状态
    status = Column(
        Enum("recent", "ending", "longTerm", name="status_enum"),
        nullable=False,
        default="recent"
    )

    # 双语描述
    description_en = Column(Text, nullable=False, default="")
    description_zh = Column(Text, nullable=False, default="")

    # 双语地址
    address_en = Column(String(500), nullable=False, default="")
    address_zh = Column(String(500), nullable=False, default="")

    # 双语开放时间
    hours_en = Column(String(255), nullable=False, default="")
    hours_zh = Column(String(255), nullable=False, default="")

    # 双语交通指引
    transport_en = Column(String(500), nullable=False, default="")
    transport_zh = Column(String(500), nullable=False, default="")

    # 一对多关联
    artists = relationship("ExhibitionArtist", back_populates="exhibition", cascade="all, delete-orphan")
    images = relationship("ExhibitionImage", back_populates="exhibition", cascade="all, delete-orphan", order_by="ExhibitionImage.sort_order")


class ExhibitionArtist(Base):
    """
    展览参展艺术家（一个展览可有多位艺术家）
    """
    __tablename__ = "exhibition_artists"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    exhibition_id = Column(Integer, ForeignKey("exhibitions.id", ondelete="CASCADE"), nullable=False, index=True)
    artist_name = Column(String(255), nullable=False)

    exhibition = relationship("Exhibition", back_populates="artists")


class ExhibitionImage(Base):
    """
    展览图片（一个展览可有多张图片，按 sort_order 排序）
    """
    __tablename__ = "exhibition_images"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    exhibition_id = Column(Integer, ForeignKey("exhibitions.id", ondelete="CASCADE"), nullable=False, index=True)
    image_url = Column(String(500), nullable=False)
    sort_order = Column(Integer, nullable=False, default=0)

    exhibition = relationship("Exhibition", back_populates="images")
