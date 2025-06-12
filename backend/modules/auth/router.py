"""
认证模块的路由定义
"""
from datetime import timedelta
from typing import Any, Annotated

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import HTMLResponse
from fastapi.security import OAuth2PasswordRequestForm

from app.core.config import settings
from app.models import UserPublic, User
# 暂时注释掉邮件相关的导入
# from app.utils import (
#     generate_password_reset_token,
#     generate_reset_password_email,
#     send_email,
#     verify_password_reset_token,
# )
from modules.auth.deps import SessionDep, CurrentUser, SuperUser
from modules.auth.models import (
    UserLogin, UserRegister, Token, Message, NewPassword, UpdatePassword,
    ClientType
)
from modules.auth.service import (
    authenticate, create_access_token, get_password_hash, 
    verify_password, get_user_by_username
)
from modules.users.service import get_user_by_phone, create_user

router = APIRouter(prefix="/auth", tags=["auth"])


# 定义响应模型
class LoginResponse(dict):
    """登录响应模型"""
    def __init__(self, token: str, user: UserPublic):
        super().__init__(
            error=0,
            body={
                "token": token,
                "user": user.model_dump()
            },
            message=""
        )


class ErrorResponse(dict):
    """错误响应模型"""
    def __init__(self, error: int, message: str):
        super().__init__(
            error=error,
            body={},
            message=message
        )


@router.post("/login")
def login(session: SessionDep, login_data: UserLogin) -> Any:
    """
    用户登录接口
    - 支持用户名或邮箱登录
    - 返回JWT Token和用户信息
    """
    # 验证用户
    user = authenticate(
        session=session, 
        username=login_data.username, 
        password=login_data.password
    )
    
    if not user:
        return ErrorResponse(error=400, message="用户名或密码错误")
    elif not user.is_active:
        return ErrorResponse(error=403, message="账户已被禁用")
    
    # 根据客户端类型生成不同过期时间的访问令牌
    if login_data.client_type == ClientType.BOT:
        # 为机器人设置一个超长过期时间，例如10年
        expires_delta = timedelta(days=365 * 10)
    else:
        # 为Web端设置配置的过期时间
        expires_delta = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    access_token = create_access_token(
        subject=user.id, expires_delta=expires_delta
    )
    
    # 返回用户信息
    user_public = UserPublic.model_validate(user)
    
    return LoginResponse(token=access_token, user=user_public)


@router.post("/login/access-token")
def login_access_token(
    session: SessionDep, form_data: Annotated[OAuth2PasswordRequestForm, Depends()]
) -> Token:
    """
    OAuth2兼容的令牌登录，获取用于后续请求的访问令牌
    """
    user = authenticate(
        session=session, username=form_data.username, password=form_data.password
    )
    if not user:
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    elif not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return Token(
        access_token=create_access_token(
            user.id, expires_delta=access_token_expires
        )
    )


@router.post("/logout")
def logout() -> Any:
    """
    用户登出接口
    - 前端清除Token即可
    - 后端可选实现Token黑名单机制
    """
    return {
        "error": 0,
        "body": {},
        "message": "登出成功"
    }


@router.post("/register", response_model=UserPublic)
def register(session: SessionDep, user_in: UserRegister) -> Any:
    """
    用户注册接口
    - 无需登录即可创建新用户
    """
    user = get_user_by_phone(session=session, phone=user_in.phone)
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this phone already exists in the system",
        )
    
    from app.models import UserCreate
    user_create = UserCreate.model_validate(user_in)
    user = create_user(session=session, user_create=user_create)
    return user


@router.post("/test-token", response_model=UserPublic)
def test_token(current_user: CurrentUser) -> Any:
    """
    测试访问令牌
    """
    return current_user


@router.patch("/password", response_model=Message)
def update_password(
    *, session: SessionDep, body: UpdatePassword, current_user: CurrentUser
) -> Any:
    """
    修改当前用户密码
    """
    if not verify_password(body.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect password")
    if body.current_password == body.new_password:
        raise HTTPException(
            status_code=400, detail="New password cannot be the same as the current one"
        )
    hashed_password = get_password_hash(body.new_password)
    current_user.hashed_password = hashed_password
    session.add(current_user)
    session.commit()
    return Message(message="Password updated successfully")


@router.post("/password-recovery/{phone}")
def recover_password(phone: str, session: SessionDep) -> Message:
    # 密码恢复功能暂时禁用，因为需要短信服务
    raise HTTPException(
        status_code=501,
        detail="Password recovery via SMS is not implemented yet"
    )


@router.post("/reset-password/")
def reset_password(session: SessionDep, body: NewPassword) -> Message:
    # 密码重置功能暂时禁用，因为需要短信验证
    raise HTTPException(
        status_code=501,
        detail="Password reset via SMS is not implemented yet"
    )


@router.post(
    "/password-recovery-html-content/{phone}",
    dependencies=[Depends(SuperUser)],
    response_class=HTMLResponse,
)
def recover_password_html_content(phone: str, session: SessionDep) -> Any:
    # 密码恢复HTML内容暂时禁用
    raise HTTPException(
        status_code=501,
        detail="Password recovery via SMS is not implemented yet"
    ) 