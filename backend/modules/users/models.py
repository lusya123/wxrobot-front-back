"""
用户管理模块的数据模型
"""
import uuid
from datetime import datetime
from enum import Enum
from pydantic import Field, BaseModel, field_validator
from sqlmodel import Field as SQLField, Relationship, SQLModel, Column
from sqlalchemy import Enum as SQLAlchemyEnum


# 用户角色枚举
class UserRole(str, Enum):
    SUPER_ADMIN = "super_admin"
    ADMIN = "admin"
    USER = "user"


# 基础用户模型
class UserBase(SQLModel):
    """用户基础模型"""
    username: str = SQLField(unique=True, index=True, max_length=50)
    phone: str = SQLField(unique=True, index=True, max_length=20)
    role: UserRole = UserRole.USER
    is_active: bool = True
    full_name: str | None = SQLField(default=None, max_length=100)
    avatar_url: str | None = SQLField(default=None, max_length=500)
    max_bot_count: int = SQLField(default=1)  # 可创建的最大机器人数量，默认为1
    
    @field_validator('phone')
    @classmethod
    def validate_phone(cls, v: str) -> str:
        """验证手机号格式"""
        if not v:
            raise ValueError('手机号不能为空')
        # 允许临时手机号（以1000开头的）
        if v.startswith('1000'):
            return v
        # 标准的中国手机号验证
        if not v.startswith('1') or len(v) != 11 or not v.isdigit():
            raise ValueError('请输入有效的手机号码')
        return v


# 创建用户请求模型
class UserCreate(UserBase):
    """创建用户请求模型"""
    password: str = Field(min_length=8, max_length=40)


# 更新用户请求模型
class UserUpdate(UserBase):
    """更新用户请求模型"""
    username: str | None = Field(default=None, max_length=50)
    phone: str | None = Field(default=None, max_length=20)
    password: str | None = Field(default=None, min_length=8, max_length=40)
    role: UserRole | None = None
    is_active: bool | None = None
    max_bot_count: int | None = None  # 允许更新最大机器人数量


# 更新当前用户信息模型
class UserUpdateMe(SQLModel):
    """更新当前用户信息请求模型"""
    full_name: str | None = Field(default=None, max_length=100)
    phone: str | None = Field(default=None, max_length=20)
    avatar_url: str | None = Field(default=None, max_length=500)


# 数据库用户模型
class User(UserBase, table=True):
    """用户数据库模型"""
    __tablename__ = "users"
    
    id: uuid.UUID = SQLField(default_factory=uuid.uuid4, primary_key=True)
    hashed_password: str
    # 使用sa_column明确指定role字段使用PostgreSQL的枚举类型
    role: UserRole = SQLField(
        sa_column=Column(
            SQLAlchemyEnum(
                UserRole, 
                name="user_role_enum", 
                create_type=False,
                values_callable=lambda x: [e.value for e in x]
            ),
            nullable=False,
            default=UserRole.USER
        )
    )
    created_by_id: uuid.UUID | None = SQLField(default=None, foreign_key="users.id")
    last_login_at: datetime | None = SQLField(default=None)
    created_at: datetime = SQLField(default_factory=datetime.utcnow)
    updated_at: datetime = SQLField(default_factory=datetime.utcnow)


# 公开的用户信息模型
class UserPublic(UserBase):
    """公开的用户信息模型"""
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    last_login_at: datetime | None = None
    created_by_id: uuid.UUID | None = None


# 用户列表响应模型
class UsersPublic(SQLModel):
    """用户列表响应模型"""
    data: list[UserPublic]
    count: int


# 管理员重置密码请求模型
class AdminResetPassword(BaseModel):
    """管理员重置密码请求模型"""
    new_password: str = Field(min_length=8, max_length=40) 