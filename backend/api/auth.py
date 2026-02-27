import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.schemas.admin import AdminLoginRequest, TokenResponse
from backend.service import auth_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponse)
def login(
    request: AdminLoginRequest,
    db: Session = Depends(get_db),
) -> TokenResponse:
    """
    管理员登录，返回 JWT access token
    """
    admin = auth_service.authenticate_admin(db, request.username, request.password)
    if not admin:
        # NOTE: 统一返回模糊错误，避免泄露账号是否存在
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户名或密码错误",
        )
    token = auth_service.create_access_token({"sub": admin.username})
    logger.info(f"管理员登录成功：{admin.username}")
    return TokenResponse(access_token=token)
