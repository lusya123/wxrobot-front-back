"""
微信账号管理模块的路由
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from sqlalchemy import func

from app.api.deps import get_current_active_user, SessionDep
from modules.users.models import User
from .models import (
    WechatBotCreate, WechatBotUpdate, WechatBotPublic, WechatBotsPublic,
    WechatBotWithConfig, BotConfigUpdate, BotConfigPublic,
    LoginResponse, OperationResponse, WechatBot
)
from .service import WechatAccountService

router = APIRouter(
    prefix="/wechat-accounts",
    tags=["wechat-accounts"],
)


@router.get("", response_model=OperationResponse)
def get_wechat_accounts(
    *,
    db: SessionDep,
    current_user: User = Depends(get_current_active_user),
    skip: int = 0,
    limit: int = 100
):
    """
    获取微信机器人列表
    """
    bots = WechatAccountService.get_bots_by_user(db, current_user, skip, limit)
    
    # 获取所有者名称和创建者信息
    bot_list = []
    for bot in bots:
        owner = db.get(User, bot.owner_id)
        bot_dict = bot.dict()
        bot_dict["owner_name"] = owner.full_name or owner.username if owner else None
        
        # 为管理员提供额外的创建者信息
        if current_user.role == "admin" and owner and owner.created_by_id == current_user.id:
            bot_dict["created_by_me"] = True
            bot_dict["creator_type"] = "subordinate"  # 下属创建的
        elif bot.owner_id == current_user.id:
            bot_dict["created_by_me"] = True
            bot_dict["creator_type"] = "self"  # 自己创建的
        else:
            bot_dict["created_by_me"] = False
            bot_dict["creator_type"] = "other"  # 其他人创建的
        
        bot_list.append(WechatBotPublic(**bot_dict))
    
    # 计算总数
    if current_user.role == "super_admin":
        count_statement = select(func.count()).select_from(WechatBot)
    elif current_user.role == "admin":
        # 管理员看到的机器人总数包括自己的和自己创建的用户的
        created_users = db.exec(
            select(User).where(User.created_by_id == current_user.id)
        ).all()
        
        accessible_user_ids = [current_user.id]
        for user in created_users:
            accessible_user_ids.append(user.id)
        
        count_statement = select(func.count()).select_from(WechatBot).where(
            WechatBot.owner_id.in_(accessible_user_ids)
        )
    else:
        count_statement = select(func.count()).select_from(WechatBot).where(
            WechatBot.owner_id == current_user.id
        )
    total = db.exec(count_statement).one()
    
    return OperationResponse(
        error=0,
        message="Success",
        body={
            "data": bot_list,
            "total": total
        }
    )


@router.get("/{bot_id}", response_model=WechatBotWithConfig)
def get_wechat_account(
    *,
    db: SessionDep,
    current_user: User = Depends(get_current_active_user),
    bot_id: int
):
    """
    获取单个机器人完整配置
    """
    bot = WechatAccountService.get_bot_by_id(db, bot_id, current_user)
    if not bot:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="机器人不存在"
        )
    
    # 获取配置
    config = WechatAccountService.get_bot_config(db, bot_id, current_user)
    
    # 获取关联数据
    config_dict = config.dict() if config else {}
    if config:
        config_dict["monitored_chats"] = WechatAccountService.get_bot_monitored_chats(db, bot_id)
        config_dict["knowledge_bases"] = WechatAccountService.get_bot_knowledge_bases(db, bot_id)
        config_dict["alert_recipients"] = WechatAccountService.get_bot_alert_recipients(db, bot_id)
        config_dict["escalation_recipients"] = WechatAccountService.get_bot_escalation_recipients(db, bot_id)
        config_public = BotConfigPublic(**config_dict)
    else:
        config_public = None
    
    # 获取所有者名称
    owner = db.get(User, bot.owner_id)
    bot_dict = bot.dict()
    bot_dict["owner_name"] = owner.full_name or owner.username if owner else None
    bot_dict["config"] = config_public
    
    return WechatBotWithConfig(**bot_dict)


@router.post("", response_model=WechatBotPublic)
def create_wechat_account(
    *,
    db: SessionDep,
    current_user: User = Depends(get_current_active_user),
    bot_create: WechatBotCreate
):
    """
    创建新的微信机器人
    """
    bot = WechatAccountService.create_bot(db, bot_create, current_user)
    
    # 获取所有者名称
    owner = db.get(User, bot.owner_id)
    bot_dict = bot.dict()
    bot_dict["owner_name"] = owner.full_name or owner.username if owner else None
    
    return WechatBotPublic(**bot_dict)


@router.put("/{bot_id}", response_model=OperationResponse)
def update_wechat_account(
    *,
    db: SessionDep,
    current_user: User = Depends(get_current_active_user),
    bot_id: int,
    config_update: BotConfigUpdate
):
    """
    更新微信机器人配置
    """
    # 更新基本信息（如果提供了）
    if hasattr(config_update, 'name') or hasattr(config_update, 'owner_id'):
        bot_update = WechatBotUpdate()
        if hasattr(config_update, 'name'):
            bot_update.name = config_update.name
        if hasattr(config_update, 'owner_id'):
            bot_update.owner_id = config_update.owner_id
        
        bot = WechatAccountService.update_bot(db, bot_id, bot_update, current_user)
        if not bot:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="机器人不存在"
            )
    
    # 更新配置
    config = WechatAccountService.update_bot_config(db, bot_id, config_update, current_user)
    if not config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="机器人不存在"
        )
    
    return OperationResponse(
        error=0,
        message="更新成功"
    )


@router.delete("/{bot_id}", response_model=OperationResponse)
def delete_wechat_account(
    *,
    db: SessionDep,
    current_user: User = Depends(get_current_active_user),
    bot_id: int
):
    """
    删除微信机器人
    """
    success = WechatAccountService.delete_bot(db, bot_id, current_user)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="机器人不存在"
        )
    
    return OperationResponse(
        error=0,
        message="删除成功"
    )


@router.post("/{bot_id}/login", response_model=OperationResponse)
def login_wechat_account(
    *,
    db: SessionDep,
    current_user: User = Depends(get_current_active_user),
    bot_id: int
):
    """
    机器人登录操作
    """
    bot = WechatAccountService.get_bot_by_id(db, bot_id, current_user)
    if not bot:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="机器人不存在"
        )
    
    # TODO: 调用wechaty服务生成二维码
    # 这里返回模拟数据
    return OperationResponse(
        error=0,
        message="请求成功，请扫码",
        body={
            "qrcode": "https://example.com/qrcode/demo.png",
            "status_check_token": "demo_token_123456"
        }
    )


@router.post("/{bot_id}/logout", response_model=OperationResponse)
def logout_wechat_account(
    *,
    db: SessionDep,
    current_user: User = Depends(get_current_active_user),
    bot_id: int
):
    """
    机器人登出操作
    """
    bot = WechatAccountService.get_bot_by_id(db, bot_id, current_user)
    if not bot:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="机器人不存在"
        )
    
    # TODO: 调用wechaty服务登出
    # 更新状态
    bot.status = "logged_out"
    db.add(bot)
    db.commit()
    
    return OperationResponse(
        error=0,
        message="登出指令已发送"
    ) 