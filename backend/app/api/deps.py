"""
应用的依赖注入

认证相关的依赖已迁移到:
- modules.auth.deps
"""
from modules.auth.deps import (
    SessionDep, TokenDep, CurrentUser, OptionalCurrentUser, 
    AdminUser, SuperUser, get_current_user, get_current_active_user,
    get_current_active_superuser, get_current_admin_user
)

# 导出所有依赖，保持向后兼容
__all__ = [
    "SessionDep", "TokenDep", "CurrentUser", "OptionalCurrentUser",
    "AdminUser", "SuperUser", "get_current_user", "get_current_active_user",
    "get_current_active_superuser", "get_current_admin_user"
]
