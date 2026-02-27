import logging
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.api.auth import router as auth_router
from backend.api.exhibitions import router as exhibitions_router
from backend.database import init_db

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    应用生命周期管理：启动时初始化数据库表并写入初始数据
    """
    logger.info("服务启动，正在自动配置数据库及管理员账号...")
    try:
        from backend.seed import seed
        seed()
    except Exception as e:
        logger.error(f"数据库初始化失败，请检查配置：{e}")
    yield
    logger.info("服务关闭")


app = FastAPI(
    title="FUHUNG Art Exhibition API",
    description="艺术展览应用后端 API",
    version="1.0.0",
    lifespan=lifespan,
)

# NOTE: CORS 配置，允许前端（Next.js）跨域访问
# 生产环境应限制 allow_origins 为实际部署域名
ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:3000,http://localhost:3001"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(auth_router)
app.include_router(exhibitions_router)


@app.get("/api/health")
def health_check():
    """健康检查端点，用于 Zeabur 存活探测"""
    return {"status": "ok", "service": "FUHUNG Art Exhibition API"}
