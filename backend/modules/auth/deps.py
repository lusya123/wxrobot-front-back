"""
认证模块的依赖注入
"""
from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlmodel import Session

from app.core.config import settings
from app.core.db import get_db
from app.models import User, UserRole
from modules.auth.service import get_current_user_from_token

# OAuth2密码载体
reusable_oauth2 = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/login",
    auto_error=False
)

# 类型注解
SessionDep = Annotated[Session, Depends(get_db)]
TokenDep = Annotated[str | None, Depends(reusable_oauth2)]


def get_current_user(session: SessionDep, token: TokenDep) -> User | None:
    """获取当前用户（可选）"""
    if not token:
        return None
    return get_current_user_from_token(session=session, token=token)


def get_current_active_user(session: SessionDep, token: TokenDep) -> User:
    """获取当前活跃用户（必需）"""
    user = get_current_user(session, token)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


def get_current_active_superuser(current_user: User = Depends(get_current_active_user)) -> User:
    """获取当前超级管理员用户"""
    if current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(
            status_code=403, detail="The user doesn't have enough privileges"
        )
    return current_user


def get_current_admin_user(current_user: User = Depends(get_current_active_user)) -> User:
    """获取当前管理员用户（包括超级管理员和普通管理员）"""
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.ADMIN]:
        raise HTTPException(
            status_code=403, detail="The user doesn't have enough privileges"
        )
    return current_user


# 类型注解
CurrentUser = Annotated[User, Depends(get_current_active_user)]
OptionalCurrentUser = Annotated[User | None, Depends(get_current_user)]
AdminUser = Annotated[User, Depends(get_current_admin_user)]
SuperUser = Annotated[User, Depends(get_current_active_superuser)] 