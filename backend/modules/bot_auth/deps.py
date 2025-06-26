"""
机器人认证依赖
"""
from typing import Annotated
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlmodel import Session
from jwt.exceptions import InvalidTokenError
from pydantic import ValidationError

from app.core.db import get_db
from modules.auth.service import decode_token
from modules.wechat_accounts.models import WechatBot
from .models import BotTokenPayload

security = HTTPBearer()


def decode_bot_token(token: str) -> BotTokenPayload | None:
    """解码机器人JWT令牌"""
    try:
        import jwt
        from app.core.config import settings
        from modules.auth.service import ALGORITHM
        
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[ALGORITHM]
        )
        # 检查是否是机器人token
        if payload.get("bot_type") != "bot":
            return None
        token_data = BotTokenPayload(**payload)
        return token_data
    except (InvalidTokenError, ValidationError):
        return None


def get_current_bot(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(security)],
    db: Session = Depends(get_db)
) -> WechatBot:
    """获取当前认证的机器人"""
    token = credentials.credentials
    
    token_data = decode_bot_token(token)
    if not token_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="无效的认证凭据",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # 获取机器人
    bot = db.get(WechatBot, int(token_data.sub))
    if not bot:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="机器人不存在"
        )
    
    return bot


# 类型别名
CurrentBot = Annotated[WechatBot, Depends(get_current_bot)] 