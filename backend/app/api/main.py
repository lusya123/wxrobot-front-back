from fastapi import APIRouter

from app.api.routes import private, utils  # 保留未迁移的路由
from app.core.config import settings
from modules.auth.router import router as auth_router
from modules.users.router import router as users_router
from modules.wechat_accounts.router import router as wechat_accounts_router
from modules.conversations.router import router as conversations_router
from modules.bot_auth.router import router as bot_auth_router

api_router = APIRouter()

# 包含模块化路由
api_router.include_router(auth_router)
api_router.include_router(users_router)
api_router.include_router(wechat_accounts_router)
api_router.include_router(conversations_router)
api_router.include_router(bot_auth_router, prefix="/bot-auth", tags=["bot-auth"])

# 包含未迁移的路由
api_router.include_router(utils.router)

if settings.ENVIRONMENT == "local":
    api_router.include_router(private.router)
