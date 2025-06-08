"""
用户管理模块的路由定义
"""
import uuid
from typing import Any

from fastapi import APIRouter, HTTPException

from app.core.config import settings
from app.utils import generate_new_account_email, send_email
from modules.auth.deps import SessionDep, CurrentUser, AdminUser
from modules.auth.models import Message
from modules.auth.service import get_password_hash, verify_password
from modules.users.models import (
    UserCreate, UserPublic, UserRole, UsersPublic, 
    UserUpdate, UserUpdateMe, AdminResetPassword
)
from modules.users.service import (
    create_user, get_user_by_email, get_users, get_user_by_id,
    update_user, delete_user, check_user_permissions
)

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/", response_model=UsersPublic)
def read_users(
    session: SessionDep, 
    current_user: AdminUser, 
    skip: int = 0, 
    limit: int = 100
) -> Any:
    """
    获取用户列表
    - 需要管理员权限
    - 普通管理员只能看到普通用户
    """
    # 如果是普通管理员，只显示普通用户
    role_filter = UserRole.USER if current_user.role == UserRole.ADMIN else None
    users, count = get_users(
        session=session, 
        skip=skip, 
        limit=limit, 
        role_filter=role_filter
    )
    
    return UsersPublic(data=users, count=count)


@router.post("/", response_model=UserPublic)
def create_user_endpoint(
    *, 
    session: SessionDep, 
    user_in: UserCreate, 
    current_user: AdminUser
) -> Any:
    """
    创建新用户
    - 需要管理员权限
    - 普通管理员只能创建普通用户
    """
    # 权限检查：普通管理员只能创建普通用户
    if current_user.role == UserRole.ADMIN and user_in.role != UserRole.USER:
        raise HTTPException(
            status_code=403,
            detail="Admin users can only create regular users.",
        )
    
    # 权限检查：只有超级管理员可以创建管理员
    if user_in.role in [UserRole.ADMIN, UserRole.SUPER_ADMIN] and current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(
            status_code=403,
            detail="Only super admin can create admin or super admin users.",
        )
    
    # 检查邮箱是否已存在
    user = get_user_by_email(session=session, email=user_in.email)
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this email already exists in the system.",
        )

    # 设置创建者ID
    user_in_dict = user_in.model_dump()
    user_in_dict['created_by_id'] = current_user.id
    
    # 创建用户
    user = create_user(session=session, user_create=UserCreate(**user_in_dict))
    
    # 发送欢迎邮件
    if settings.emails_enabled and user_in.email:
        email_data = generate_new_account_email(
            email_to=user_in.email, username=user_in.email, password=user_in.password
        )
        send_email(
            email_to=user_in.email,
            subject=email_data.subject,
            html_content=email_data.html_content,
        )
    
    return user


@router.get("/me", response_model=UserPublic)
def read_user_me(current_user: CurrentUser) -> Any:
    """
    获取当前用户信息
    """
    return current_user


@router.patch("/me", response_model=UserPublic)
def update_user_me(
    *, 
    session: SessionDep, 
    user_in: UserUpdateMe, 
    current_user: CurrentUser
) -> Any:
    """
    更新当前用户信息
    """
    if user_in.email:
        existing_user = get_user_by_email(session=session, email=user_in.email)
        if existing_user and existing_user.id != current_user.id:
            raise HTTPException(
                status_code=409, detail="User with this email already exists"
            )
    
    user_data = user_in.model_dump(exclude_unset=True)
    current_user.sqlmodel_update(user_data)
    session.add(current_user)
    session.commit()
    session.refresh(current_user)
    
    return current_user


@router.delete("/me", response_model=Message)
def delete_user_me(session: SessionDep, current_user: CurrentUser) -> Any:
    """
    删除当前用户
    - 超级管理员不能删除自己
    """
    if current_user.role == UserRole.SUPER_ADMIN:
        raise HTTPException(
            status_code=403, detail="Super users are not allowed to delete themselves"
        )
    
    delete_user(session=session, user=current_user)
    return Message(message="User deleted successfully")


@router.get("/{user_id}", response_model=UserPublic)
def read_user_by_id(
    user_id: uuid.UUID, 
    session: SessionDep, 
    current_user: CurrentUser
) -> Any:
    """
    根据ID获取用户信息
    - 用户可以查看自己的信息
    - 管理员可以查看其权限范围内的用户
    """
    user = get_user_by_id(session=session, user_id=str(user_id))
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # 如果是查看自己的信息，直接返回
    if user == current_user:
        return user
    
    # 检查权限
    if not check_user_permissions(
        current_user=current_user,
        target_user=user,
        action="view"
    ):
        raise HTTPException(
            status_code=403,
            detail="The user doesn't have enough privileges",
        )
    
    return user


@router.patch("/{user_id}", response_model=UserPublic)
def update_user_endpoint(
    *,
    session: SessionDep,
    user_id: uuid.UUID,
    user_in: UserUpdate,
    current_user: AdminUser
) -> Any:
    """
    更新用户信息
    - 需要管理员权限
    - 权限检查遵循角色层级
    """
    db_user = get_user_by_id(session=session, user_id=str(user_id))
    if not db_user:
        raise HTTPException(
            status_code=404,
            detail="The user with this id does not exist in the system",
        )
    
    # 权限检查
    if not check_user_permissions(
        current_user=current_user,
        target_user=db_user,
        action="update"
    ):
        raise HTTPException(
            status_code=403,
            detail="The user doesn't have enough privileges",
        )
    
    # 角色修改权限检查
    if user_in.role and user_in.role != db_user.role:
        if user_in.role in [UserRole.ADMIN, UserRole.SUPER_ADMIN] and current_user.role != UserRole.SUPER_ADMIN:
            raise HTTPException(
                status_code=403,
                detail="Only super admin can set admin or super admin roles",
            )
    
    # 检查邮箱是否已存在
    if user_in.email:
        existing_user = get_user_by_email(session=session, email=user_in.email)
        if existing_user and existing_user.id != user_id:
            raise HTTPException(
                status_code=409, detail="User with this email already exists"
            )

    # 更新用户
    db_user = update_user(session=session, db_user=db_user, user_in=user_in)
    return db_user


@router.delete("/{user_id}")
def delete_user_endpoint(
    session: SessionDep, 
    user_id: uuid.UUID, 
    current_user: AdminUser
) -> Message:
    """
    删除用户
    - 需要管理员权限
    - 不能删除自己
    """
    user = get_user_by_id(session=session, user_id=str(user_id))
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user == current_user:
        raise HTTPException(
            status_code=403, detail="Users are not allowed to delete themselves"
        )
    
    # 权限检查
    if not check_user_permissions(
        current_user=current_user,
        target_user=user,
        action="delete"
    ):
        raise HTTPException(
            status_code=403,
            detail="The user doesn't have enough privileges",
        )
    
    delete_user(session=session, user=user)
    return Message(message="User deleted successfully")


@router.post("/{user_id}/reset-password")
def reset_user_password(
    *,
    session: SessionDep,
    user_id: uuid.UUID,
    body: AdminResetPassword,
    current_user: AdminUser
) -> Message:
    """
    重置用户密码
    - 需要管理员权限
    - 不能重置自己的密码
    """
    user = get_user_by_id(session=session, user_id=str(user_id))
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # 防止管理员重置自己的密码（应该使用修改密码功能）
    if user.id == current_user.id:
        raise HTTPException(
            status_code=400, 
            detail="Cannot reset your own password using this endpoint. Use change password instead."
        )
    
    # 权限检查
    if not check_user_permissions(
        current_user=current_user,
        target_user=user,
        action="reset_password"
    ):
        raise HTTPException(
            status_code=403,
            detail="The user doesn't have enough privileges",
        )
    
    # 更新密码
    hashed_password = get_password_hash(body.new_password)
    user.hashed_password = hashed_password
    session.add(user)
    session.commit()
    
    return Message(message="Password reset successfully") 