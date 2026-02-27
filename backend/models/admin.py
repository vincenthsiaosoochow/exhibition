from __future__ import annotations

from sqlalchemy import Column, Integer, String, Boolean
from database import Base


class Admin(Base):
    """
    管理员账号表，密码以 bcrypt hash 存储，禁止明文
    """
    __tablename__ = "admins"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    username = Column(String(100), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    # NOTE: 保留 is_active 字段，便于后续临时禁用管理员账号
    is_active = Column(Boolean, nullable=False, default=True)
