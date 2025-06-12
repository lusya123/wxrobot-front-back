"""
认证模块的数据模型
"""
from pydantic import EmailStr, Field
from sqlmodel import SQLModel


# 登录请求模型
class UserLogin(SQLModel):
    """用户登录请求模型"""
    username: str  # 可以是用户名或邮箱
    password: str


# 用户注册模型
class UserRegister(SQLModel):
    """用户注册请求模型"""
    username: str = Field(max_length=50)
    phone: str = Field(max_length=20)
    password: str = Field(min_length=8, max_length=40)
    full_name: str | None = Field(default=None, max_length=100)


# 修改密码模型
class UpdatePassword(SQLModel):
    """修改密码请求模型"""
    current_password: str = Field(min_length=8, max_length=40)
    new_password: str = Field(min_length=8, max_length=40)


# 重置密码模型
class NewPassword(SQLModel):
    """重置密码请求模型"""
    token: str
    new_password: str = Field(min_length=8, max_length=40)


# JWT令牌模型
class Token(SQLModel):
    """JWT令牌响应模型"""
    access_token: str
    token_type: str = "bearer"


# JWT令牌内容
class TokenPayload(SQLModel):
    """JWT令牌载荷模型"""
    sub: str | None = None


# 通用消息响应
class Message(SQLModel):
    """通用消息响应模型"""
    message: str 