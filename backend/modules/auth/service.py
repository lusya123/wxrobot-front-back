"""
认证服务层 - 处理认证相关的业务逻辑
"""
from datetime import datetime, timedelta
from typing import Any

import jwt
from fastapi import HTTPException, status
from jwt.exceptions import InvalidTokenError
from passlib.context import CryptContext
from pydantic import ValidationError
from sqlmodel import Session, or_, select

from app.core.config import settings
from app.models import User
from modules.auth.models import TokenPayload

# 密码加密上下文
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT算法
ALGORITHM = "HS256"


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """验证密码"""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """获取密码哈希值"""
    return pwd_context.hash(password)


def create_access_token(subject: str | Any, expires_delta: timedelta) -> str:
    """创建访问令牌"""
    from datetime import timezone
    expire = datetime.now(timezone.utc) + expires_delta
    to_encode = {"exp": expire, "sub": str(subject)}
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def get_user_by_username_or_email(*, session: Session, username: str) -> User | None:
    """根据用户名或邮箱获取用户"""
    statement = select(User).where(
        or_(User.username == username, User.email == username)
    )
    session_user = session.exec(statement).first()
    return session_user


def authenticate(*, session: Session, username: str, password: str) -> User | None:
    """验证用户身份，支持用户名或邮箱登录"""
    db_user = get_user_by_username_or_email(session=session, username=username)
    if not db_user:
        return None
    if not verify_password(password, db_user.hashed_password):
        return None
    
    # 更新最后登录时间
    db_user.last_login_at = datetime.utcnow()
    session.add(db_user)
    session.commit()
    session.refresh(db_user)
    
    return db_user


def decode_token(token: str) -> TokenPayload | None:
    """解码JWT令牌"""
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[ALGORITHM]
        )
        token_data = TokenPayload(**payload)
        return token_data
    except (InvalidTokenError, ValidationError):
        return None


def get_current_user_from_token(*, session: Session, token: str) -> User | None:
    """从令牌获取当前用户"""
    if not token:
        return None
    
    token_data = decode_token(token)
    if not token_data:
        return None
    
    user = session.get(User, token_data.sub)
    if not user or not user.is_active:
        return None
    
    return user 