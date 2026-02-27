from pydantic import BaseModel


class AdminLoginRequest(BaseModel):
    """
    管理员登录请求
    """
    username: str
    password: str


class TokenResponse(BaseModel):
    """
    JWT Token 响应
    """
    access_token: str
    token_type: str = "bearer"
