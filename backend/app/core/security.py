"""
应用的安全功能

认证相关的安全功能已迁移到:
- modules.auth.service
"""
from modules.auth.service import (
    ALGORITHM, create_access_token, verify_password, get_password_hash
)

# 导出所有函数和常量，保持向后兼容
__all__ = [
    "ALGORITHM", "create_access_token", "verify_password", "get_password_hash"
]
