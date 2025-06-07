from datetime import timedelta
from typing import Any

from fastapi import APIRouter, HTTPException
from sqlmodel import Session

from app import crud
from app.api.deps import SessionDep
from app.core import security
from app.core.config import settings
from app.models import UserLogin, UserPublic


router = APIRouter(prefix="/auth", tags=["auth"])


# 定义响应模型
class LoginResponse(dict):
    """登录响应模型"""
    def __init__(self, token: str, user: UserPublic):
        super().__init__(
            error=0,
            body={
                "token": token,
                "user": user.model_dump()
            },
            message=""
        )


class ErrorResponse(dict):
    """错误响应模型"""
    def __init__(self, error: int, message: str):
        super().__init__(
            error=error,
            body={},
            message=message
        )


@router.post("/login")
def login(session: SessionDep, login_data: UserLogin) -> Any:
    """
    用户登录接口
    - 支持用户名或邮箱登录
    - 返回JWT Token和用户信息
    """
    # 验证用户
    user = crud.authenticate(
        session=session, 
        username=login_data.username, 
        password=login_data.password
    )
    
    if not user:
        return ErrorResponse(error=400, message="用户名或密码错误")
    elif not user.is_active:
        return ErrorResponse(error=403, message="账户已被禁用")
    
    # 生成访问令牌
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        user.id, expires_delta=access_token_expires
    )
    
    # 返回用户信息
    user_public = UserPublic.model_validate(user)
    
    return LoginResponse(token=access_token, user=user_public)


@router.post("/logout")
def logout() -> Any:
    """
    用户登出接口
    - 前端清除Token即可
    - 后端可选实现Token黑名单机制
    """
    return {
        "error": 0,
        "body": {},
        "message": "登出成功"
    } 