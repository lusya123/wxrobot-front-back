import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import col, delete, func, select
from pydantic import BaseModel, Field

from app import crud
from app.api.deps import (
    CurrentUser,
    SessionDep,
    get_current_active_superuser,
    get_current_admin_user,
    AdminUser,
)
from app.core.config import settings
from app.core.security import get_password_hash, verify_password
from app.models import (
    Message,
    UpdatePassword,
    User,
    UserCreate,
    UserPublic,
    UserRegister,
    UserRole,
    UsersPublic,
    UserUpdate,
    UserUpdateMe,
)
from app.utils import generate_new_account_email, send_email

# 管理员重置密码请求模型
class AdminResetPassword(BaseModel):
    new_password: str = Field(min_length=8, max_length=40)

router = APIRouter(prefix="/users", tags=["users"])


@router.get(
    "/",
    response_model=UsersPublic,
)
def read_users(session: SessionDep, current_user: AdminUser, skip: int = 0, limit: int = 100) -> Any:
    """
    Retrieve users.
    """
    count_statement = select(func.count()).select_from(User)
    count = session.exec(count_statement).one()

    statement = select(User).offset(skip).limit(limit)
    users = session.exec(statement).all()

    # 如果是普通管理员，只显示普通用户
    if current_user.role == UserRole.ADMIN:
        users = [user for user in users if user.role == UserRole.USER]
        count = len(users)

    return UsersPublic(data=users, count=count)


@router.post(
    "/", response_model=UserPublic
)
def create_user(*, session: SessionDep, user_in: UserCreate, current_user: AdminUser) -> Any:
    """
    Create new user.
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
    
    user = crud.get_user_by_email(session=session, email=user_in.email)
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this email already exists in the system.",
        )

    # 设置创建者ID
    user_in_dict = user_in.model_dump()
    user_in_dict['created_by_id'] = current_user.id
    
    user = crud.create_user(session=session, user_create=UserCreate(**user_in_dict))
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


@router.patch("/me", response_model=UserPublic)
def update_user_me(
    *, session: SessionDep, user_in: UserUpdateMe, current_user: CurrentUser
) -> Any:
    """
    Update own user.
    """

    if user_in.email:
        existing_user = crud.get_user_by_email(session=session, email=user_in.email)
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


@router.patch("/me/password", response_model=Message)
def update_password_me(
    *, session: SessionDep, body: UpdatePassword, current_user: CurrentUser
) -> Any:
    """
    Update own password.
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


@router.get("/me", response_model=UserPublic)
def read_user_me(current_user: CurrentUser) -> Any:
    """
    Get current user.
    """
    return current_user


@router.delete("/me", response_model=Message)
def delete_user_me(session: SessionDep, current_user: CurrentUser) -> Any:
    """
    Delete own user.
    """
    if current_user.role == UserRole.SUPER_ADMIN:
        raise HTTPException(
            status_code=403, detail="Super users are not allowed to delete themselves"
        )
    session.delete(current_user)
    session.commit()
    return Message(message="User deleted successfully")


@router.post("/signup", response_model=UserPublic)
def register_user(session: SessionDep, user_in: UserRegister) -> Any:
    """
    Create new user without the need to be logged in.
    """
    user = crud.get_user_by_email(session=session, email=user_in.email)
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this email already exists in the system",
        )
    user_create = UserCreate.model_validate(user_in)
    user = crud.create_user(session=session, user_create=user_create)
    return user


@router.get("/{user_id}", response_model=UserPublic)
def read_user_by_id(
    user_id: uuid.UUID, session: SessionDep, current_user: CurrentUser
) -> Any:
    """
    Get a specific user by id.
    """
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if user == current_user:
        return user
        
    # 管理员权限检查
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.ADMIN]:
        raise HTTPException(
            status_code=403,
            detail="The user doesn't have enough privileges",
        )
    
    # 普通管理员只能查看普通用户
    if current_user.role == UserRole.ADMIN and user.role != UserRole.USER:
        raise HTTPException(
            status_code=403,
            detail="Admin users can only view regular users",
        )
    
    return user


@router.patch(
    "/{user_id}",
    response_model=UserPublic,
)
def update_user(
    *,
    session: SessionDep,
    user_id: uuid.UUID,
    user_in: UserUpdate,
    current_user: AdminUser
) -> Any:
    """
    Update a user.
    """

    db_user = session.get(User, user_id)
    if not db_user:
        raise HTTPException(
            status_code=404,
            detail="The user with this id does not exist in the system",
        )
    
    # 权限检查：普通管理员只能管理普通用户
    if current_user.role == UserRole.ADMIN and db_user.role != UserRole.USER:
        raise HTTPException(
            status_code=403,
            detail="Admin users can only manage regular users",
        )
    
    # 权限检查：不能修改用户角色为管理员（除非是超级管理员）
    if user_in.role and user_in.role in [UserRole.ADMIN, UserRole.SUPER_ADMIN] and current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(
            status_code=403,
            detail="Only super admin can set admin or super admin roles",
        )
    
    # 权限检查：普通管理员不能修改其他管理员
    if current_user.role == UserRole.ADMIN and user_in.role and user_in.role != UserRole.USER:
        raise HTTPException(
            status_code=403,
            detail="Admin users can only assign user role",
        )
    
    if user_in.email:
        existing_user = crud.get_user_by_email(session=session, email=user_in.email)
        if existing_user and existing_user.id != user_id:
            raise HTTPException(
                status_code=409, detail="User with this email already exists"
            )

    db_user = crud.update_user(session=session, db_user=db_user, user_in=user_in)
    return db_user


@router.delete("/{user_id}")
def delete_user(
    session: SessionDep, user_id: uuid.UUID, current_user: AdminUser
) -> Message:
    """
    Delete a user.
    """
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user == current_user:
        raise HTTPException(
            status_code=403, detail="Users are not allowed to delete themselves"
        )
    
    # 权限检查：普通管理员只能删除普通用户
    if current_user.role == UserRole.ADMIN and user.role != UserRole.USER:
        raise HTTPException(
            status_code=403,
            detail="Admin users can only delete regular users",
        )
    
    session.delete(user)
    session.commit()
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
    Reset user password (Admin only).
    """
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # 防止管理员重置自己的密码（应该使用修改密码功能）
    if user.id == current_user.id:
        raise HTTPException(
            status_code=400, 
            detail="Cannot reset your own password using this endpoint. Use change password instead."
        )
    
    # 权限检查：普通管理员只能重置普通用户密码
    if current_user.role == UserRole.ADMIN and user.role != UserRole.USER:
        raise HTTPException(
            status_code=403,
            detail="Admin users can only reset passwords for regular users",
        )
    
    # 更新密码
    hashed_password = get_password_hash(body.new_password)
    user.hashed_password = hashed_password
    session.add(user)
    session.commit()
    
    return Message(message="Password reset successfully")
