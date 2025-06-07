import uuid
from datetime import datetime
from enum import Enum

from pydantic import EmailStr
from sqlmodel import Field, Relationship, SQLModel
from sqlalchemy import Column, Enum as SQLAlchemyEnum


# 用户角色枚举
class UserRole(str, Enum):
    SUPER_ADMIN = "super_admin"
    ADMIN = "admin"
    USER = "user"


# Shared properties
class UserBase(SQLModel):
    username: str = Field(unique=True, index=True, max_length=50)
    email: EmailStr = Field(unique=True, index=True, max_length=100)
    role: UserRole = UserRole.USER
    is_active: bool = True
    full_name: str | None = Field(default=None, max_length=100)
    phone: str | None = Field(default=None, max_length=20)
    avatar_url: str | None = Field(default=None, max_length=500)


# Properties to receive via API on creation
class UserCreate(UserBase):
    password: str = Field(min_length=8, max_length=40)


# 登录请求模型
class UserLogin(SQLModel):
    username: str  # 可以是用户名或邮箱
    password: str


# 用户注册模型
class UserRegister(SQLModel):
    username: str = Field(max_length=50)
    email: EmailStr = Field(max_length=100)
    password: str = Field(min_length=8, max_length=40)
    full_name: str | None = Field(default=None, max_length=100)


# Properties to receive via API on update, all are optional
class UserUpdate(UserBase):
    username: str | None = Field(default=None, max_length=50)
    email: EmailStr | None = Field(default=None, max_length=100)
    password: str | None = Field(default=None, min_length=8, max_length=40)
    role: UserRole | None = None
    is_active: bool | None = None


class UserUpdateMe(SQLModel):
    full_name: str | None = Field(default=None, max_length=100)
    email: EmailStr | None = Field(default=None, max_length=100)
    phone: str | None = Field(default=None, max_length=20)
    avatar_url: str | None = Field(default=None, max_length=500)


class UpdatePassword(SQLModel):
    current_password: str = Field(min_length=8, max_length=40)
    new_password: str = Field(min_length=8, max_length=40)


# Database model, database table inferred from class name
class User(UserBase, table=True):
    __tablename__ = "users"
    
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    hashed_password: str
    # 使用sa_column明确指定role字段使用PostgreSQL的枚举类型
    role: UserRole = Field(
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
    created_by_id: uuid.UUID | None = Field(default=None, foreign_key="users.id")
    last_login_at: datetime | None = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # TODO: 添加自引用关系
    # 暂时注释掉以避免初始化错误
    # created_users: list["User"] = Relationship(
    #     back_populates="created_by",
    #     sa_relationship_kwargs={
    #         "foreign_keys": "User.created_by_id",
    #         "remote_side": "User.id"
    #     }
    # )
    # created_by: "User | None" = Relationship(
    #     back_populates="created_users",
    #     sa_relationship_kwargs={
    #         "foreign_keys": "User.created_by_id",
    #         "remote_side": "User.id",
    #         "uselist": False
    #     }
    # )


# Properties to return via API, id is always required
class UserPublic(UserBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    last_login_at: datetime | None = None
    created_by_id: uuid.UUID | None = None


class UsersPublic(SQLModel):
    data: list[UserPublic]
    count: int


# 注释掉Item相关模型，因为本项目只需要用户管理功能
# # Shared properties
# class ItemBase(SQLModel):
#     title: str = Field(min_length=1, max_length=255)
#     description: str | None = Field(default=None, max_length=255)


# # Properties to receive on item creation
# class ItemCreate(ItemBase):
#     pass


# # Properties to receive on item update
# class ItemUpdate(ItemBase):
#     title: str | None = Field(default=None, min_length=1, max_length=255)  # type: ignore


# # Database model, database table inferred from class name
# class Item(ItemBase, table=True):
#     id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
#     owner_id: uuid.UUID = Field(
#         foreign_key="user.id", nullable=False, ondelete="CASCADE"
#     )
#     owner: User | None = Relationship(back_populates="items")


# # Properties to return via API, id is always required
# class ItemPublic(ItemBase):
#     id: uuid.UUID
#     owner_id: uuid.UUID


# class ItemsPublic(SQLModel):
#     data: list[ItemPublic]
#     count: int


# Generic message
class Message(SQLModel):
    message: str


# JSON payload containing access token
class Token(SQLModel):
    access_token: str
    token_type: str = "bearer"


# Contents of JWT token
class TokenPayload(SQLModel):
    sub: str | None = None


class NewPassword(SQLModel):
    token: str
    new_password: str = Field(min_length=8, max_length=40)
