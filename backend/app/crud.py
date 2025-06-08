"""
应用的CRUD操作

认证和用户相关的CRUD操作已迁移到:
- modules.auth.service
- modules.users.service
"""
from modules.auth.service import authenticate, verify_password, get_password_hash
from modules.users.service import (
    create_user, update_user, get_user_by_phone, 
    get_user_by_username, get_user_by_id, get_users, delete_user
)

# 导出所有函数，保持向后兼容
__all__ = [
    "authenticate", "verify_password", "get_password_hash",
    "create_user", "update_user", "get_user_by_phone",
    "get_user_by_username", "get_user_by_id", "get_users", "delete_user"
]
