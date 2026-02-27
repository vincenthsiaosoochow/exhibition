import os
import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

logger = logging.getLogger(__name__)

# NOTE: DATABASE_URL 格式：mysql+pymysql://user:password@host:port/dbname
DATABASE_URL = os.getenv("DATABASE_URL", "mysql+pymysql://root:root@localhost:3306/exhibition")

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,  # 自动检测断开的连接
    pool_recycle=3600,   # 每小时回收连接，避免 MySQL wait_timeout
    echo=False,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    """
    FastAPI 依赖注入：提供数据库 session，请求结束后自动关闭
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """
    创建所有数据库表（如不存在）
    """
    from models import exhibition  # noqa: F401 触发模型注册
    from models import admin       # noqa: F401 触发 Admin 模型注册
    Base.metadata.create_all(bind=engine)
    logger.info("数据库表初始化完成")
