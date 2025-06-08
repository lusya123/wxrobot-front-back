"""
用户管理服务层 - 处理用户相关的业务逻辑
"""
from typing import Any
from sqlmodel import Session, select, func

from modules.auth.service import get_password_hash
from modules.users.models import User, UserCreate, UserUpdate, UserRole


def create_user(*, session: Session, user_create: UserCreate) -> User:
    """创建新用户"""
    db_obj = User.model_validate(
        user_create, update={"hashed_password": get_password_hash(user_create.password)}
    )
    session.add(db_obj)
    session.commit()
    session.refresh(db_obj)
    return db_obj


def update_user(*, session: Session, db_user: User, user_in: UserUpdate) -> Any:
    """更新用户信息"""
    user_data = user_in.model_dump(exclude_unset=True)
    extra_data = {}
    if "password" in user_data:
        password = user_data["password"]
        hashed_password = get_password_hash(password)
        extra_data["hashed_password"] = hashed_password
    db_user.sqlmodel_update(user_data, update=extra_data)
    session.add(db_user)
    session.commit()
    session.refresh(db_user)
    return db_user





def get_user_by_phone(*, session: Session, phone: str) -> User | None:
    """根据手机号获取用户"""
    statement = select(User).where(User.phone == phone)
    session_user = session.exec(statement).first()
    return session_user


def get_user_by_username(*, session: Session, username: str) -> User | None:
    """根据用户名获取用户"""
    statement = select(User).where(User.username == username)
    session_user = session.exec(statement).first()
    return session_user


def get_user_by_id(*, session: Session, user_id: str) -> User | None:
    """根据ID获取用户"""
    return session.get(User, user_id)


def get_users(
    *, 
    session: Session, 
    skip: int = 0, 
    limit: int = 100,
    role_filter: UserRole | None = None
) -> tuple[list[User], int]:
    """
    获取用户列表
    
    Args:
        session: 数据库会话
        skip: 跳过的记录数
        limit: 返回的最大记录数
        role_filter: 角色过滤器
    
    Returns:
        用户列表和总数
    """
    # 构建查询
    query = select(User)
    count_query = select(func.count()).select_from(User)
    
    # 应用角色过滤
    if role_filter:
        query = query.where(User.role == role_filter)
        count_query = count_query.where(User.role == role_filter)
    
    # 获取总数
    count = session.exec(count_query).one()
    
    # 获取用户列表
    query = query.offset(skip).limit(limit)
    users = session.exec(query).all()
    
    return users, count


def delete_user(*, session: Session, user: User) -> None:
    """删除用户"""
    session.delete(user)
    session.commit()


def check_user_permissions(
    *, 
    current_user: User, 
    target_user: User | None = None,
    required_role: UserRole | None = None,
    action: str = ""
) -> bool:
    """
    检查用户权限
    
    Args:
        current_user: 当前用户
        target_user: 目标用户（如果有）
        required_role: 需要的角色
        action: 操作描述
    
    Returns:
        是否有权限
    """
    # 超级管理员拥有所有权限
    if current_user.role == UserRole.SUPER_ADMIN:
        return True
    
    # 如果需要特定角色
    if required_role:
        if required_role == UserRole.SUPER_ADMIN:
            return current_user.role == UserRole.SUPER_ADMIN
        elif required_role == UserRole.ADMIN:
            return current_user.role in [UserRole.SUPER_ADMIN, UserRole.ADMIN]
    
    # 普通管理员只能管理普通用户
    if current_user.role == UserRole.ADMIN and target_user:
        return target_user.role == UserRole.USER
    
    # 用户只能管理自己
    if current_user.role == UserRole.USER and target_user:
        return current_user.id == target_user.id
    
    return False 