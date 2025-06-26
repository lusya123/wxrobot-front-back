"""
机器人认证相关的数据模型
"""
from pydantic import BaseModel


class BotLogin(BaseModel):
    """机器人登录请求模型"""
    username: str  # 机器人名称
    password: str


class BotToken(BaseModel):
    """机器人令牌响应模型"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class BotRefreshToken(BaseModel):
    """机器人刷新令牌请求模型"""
    refresh_token: str


class BotTokenPayload(BaseModel):
    """机器人JWT令牌载荷"""
    sub: str  # bot_id
    exp: int  # 过期时间
    bot_type: str = "bot"  # 用于区分用户token和机器人token 