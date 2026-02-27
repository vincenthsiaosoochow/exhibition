import os
import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

logger = logging.getLogger(__name__)

# 优先使用 DATABASE_URL，如果没有则尝试使用 Zeabur 提供的 MySQL 环境变量自动拼装
db_url = os.getenv("DATABASE_URL")
if not db_url:
    mysql_user = os.getenv("MYSQL_USER", "root")
    mysql_password = os.getenv("MYSQL_PASSWORD", "root")
    mysql_host = os.getenv("MYSQL_HOST", "localhost")
    mysql_port = os.getenv("MYSQL_PORT", "3306")
    mysql_db = os.getenv("MYSQL_DATABASE", "exhibition")
    db_url = f"mysql+pymysql://{mysql_user}:{mysql_password}@{mysql_host}:{mysql_port}/{mysql_db}"

DATABASE_URL = db_url

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
