"""
机器人认证路由
"""
from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session
import jwt

from app.core.config import settings
from app.core.db import get_db
from modules.auth.service import create_access_token, ALGORITHM
from modules.wechat_accounts.service import WechatAccountService
from modules.wechat_accounts.models import OperationResponse, WechatBot
from .models import BotLogin, BotToken, BotRefreshToken
from .deps import decode_bot_token

router = APIRouter()


@router.post("/login", response_model=OperationResponse)
def bot_login(
    body: BotLogin,
    db: Session = Depends(get_db)
) -> OperationResponse:
    """
    机器人登录端点
    
    - **username**: 机器人名称
    - **password**: 机器人密码
    """
    # 验证机器人身份
    bot = WechatAccountService.authenticate_bot(
        db=db,
        bot_name=body.username,
        password=body.password
    )
    
    if not bot:
        return OperationResponse(
            error=401,
            message="机器人账号或密码错误",
            body={}
        )
    
    # 创建访问令牌
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token_payload = {
        "sub": str(bot.id),
        "bot_type": "bot"
    }
    access_token = create_access_token(
        subject=bot.id,
        expires_delta=access_token_expires
    )
    # 手动添加bot_type到token
    import jwt as pyjwt
    decoded = pyjwt.decode(access_token, settings.SECRET_KEY, algorithms=[ALGORITHM])
    decoded["bot_type"] = "bot"
    access_token = pyjwt.encode(decoded, settings.SECRET_KEY, algorithm=ALGORITHM)
    
    # 创建刷新令牌 (7天有效期)
    refresh_token_expires = timedelta(days=7)
    refresh_token_payload = {
        "sub": str(bot.id),
        "bot_type": "bot"
    }
    refresh_token = create_access_token(
        subject=bot.id,
        expires_delta=refresh_token_expires
    )
    # 手动添加bot_type到token
    decoded = pyjwt.decode(refresh_token, settings.SECRET_KEY, algorithms=[ALGORITHM])
    decoded["bot_type"] = "bot"
    refresh_token = pyjwt.encode(decoded, settings.SECRET_KEY, algorithm=ALGORITHM)
    
    return OperationResponse(
        error=0,
        message="登录成功",
        body={
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer"
        }
    )


@router.post("/refresh", response_model=OperationResponse)
def refresh_bot_token(
    body: BotRefreshToken,
    db: Session = Depends(get_db)
) -> OperationResponse:
    """
    刷新机器人访问令牌
    
    - **refresh_token**: 刷新令牌
    """
    # 验证refresh_token
    token_data = decode_bot_token(body.refresh_token)
    if not token_data:
        return OperationResponse(
            error=401,
            message="Refresh token 无效或已过期，请重新登录",
            body={}
        )
    
    # 获取机器人
    bot = db.get(WechatBot, int(token_data.sub))
    if not bot:
        return OperationResponse(
            error=401,
            message="机器人不存在",
            body={}
        )
    
    # 创建新的访问令牌
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        subject=bot.id,
        expires_delta=access_token_expires
    )
    # 手动添加bot_type到token
    import jwt as pyjwt
    decoded = pyjwt.decode(access_token, settings.SECRET_KEY, algorithms=[ALGORITHM])
    decoded["bot_type"] = "bot"
    access_token = pyjwt.encode(decoded, settings.SECRET_KEY, algorithm=ALGORITHM)
    
    return OperationResponse(
        error=0,
        message="令牌刷新成功",
        body={
            "access_token": access_token,
            "token_type": "bearer"
        }
    ) 