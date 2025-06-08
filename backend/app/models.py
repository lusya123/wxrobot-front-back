"""
应用的公共数据模型

认证和用户相关的模型已迁移到:
- modules.auth.models
- modules.users.models
"""
import uuid
from datetime import datetime
from enum import Enum

from pydantic import EmailStr
from sqlmodel import Field, Relationship, SQLModel
from sqlalchemy import Column, Enum as SQLAlchemyEnum

# 从模块中导入用户相关模型
from modules.users.models import (
    User, UserBase, UserCreate, UserUpdate, UserUpdateMe, 
    UserPublic, UsersPublic, UserRole
)
from modules.auth.models import (
    UserLogin, UserRegister, UpdatePassword, NewPassword, 
    Token, TokenPayload, Message
)

# 导出所有模型，保持向后兼容
__all__ = [
    "User", "UserBase", "UserCreate", "UserUpdate", "UserUpdateMe",
    "UserPublic", "UsersPublic", "UserRole",
    "UserLogin", "UserRegister", "UpdatePassword", "NewPassword",
    "Token", "TokenPayload", "Message"
]

# 以下是其他尚未迁移的模型（如Item相关模型，已注释）
# 在后续重构中，这些模型也应该迁移到相应的模块中
