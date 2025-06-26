"""
微信账号管理模块的服务层
"""
import uuid
from typing import List, Optional
from sqlmodel import Session, select, and_, or_
from fastapi import HTTPException, status

from modules.users.models import User
from modules.auth.service import get_password_hash, verify_password
from .models import (
    WechatBot, WechatBotCreate, WechatBotUpdate,
    BotConfig, BotConfigUpdate,
    BotMonitoredChat, BotKnowledgeBase,
    BotAlertRecipient, BotEscalationRecipient,
    MonitoredChatInfo, KnowledgeBaseInfo, RecipientInfo
)


class WechatAccountService:
    """微信账号管理服务类"""
    
    @staticmethod
    def get_bots_by_user(
        db: Session, 
        current_user: User,
        skip: int = 0,
        limit: int = 100
    ) -> List[WechatBot]:
        """获取用户有权访问的微信机器人列表"""
        # 超级管理员可以看到所有机器人
        if current_user.role == "super_admin":
            statement = select(WechatBot).offset(skip).limit(limit)
        elif current_user.role == "admin":
            # 管理员可以看到：
            # 1. 自己创建的机器人
            # 2. 自己创建的用户创建的机器人
            
            # 先查询自己创建的用户
            created_users = db.exec(
                select(User).where(User.created_by_id == current_user.id)
            ).all()
            
            # 收集所有可访问的用户ID（包括自己）
            accessible_user_ids = [current_user.id]
            for user in created_users:
                accessible_user_ids.append(user.id)
            
            # 查询这些用户创建的所有机器人
            statement = select(WechatBot).where(
                WechatBot.owner_id.in_(accessible_user_ids)
            ).offset(skip).limit(limit)
        else:
            # 普通用户只能看到自己负责的机器人
            statement = select(WechatBot).where(
                WechatBot.owner_id == current_user.id
            ).offset(skip).limit(limit)
        
        results = db.exec(statement)
        return list(results)
    
    @staticmethod
    def get_bot_by_id(
        db: Session,
        bot_id: int,
        current_user: User
    ) -> Optional[WechatBot]:
        """根据ID获取机器人"""
        bot = db.get(WechatBot, bot_id)
        if not bot:
            return None
        
        # 权限检查
        if current_user.role == "super_admin":
            # 超级管理员可以访问所有机器人
            return bot
        elif current_user.role == "admin":
            # 管理员可以访问自己创建的机器人和自己创建的用户创建的机器人
            if bot.owner_id == current_user.id:
                return bot
            
            # 检查机器人所有者是否是自己创建的用户
            owner = db.get(User, bot.owner_id)
            if owner and owner.created_by_id == current_user.id:
                return bot
                
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="您没有权限访问此机器人"
            )
        else:
            # 普通用户只能访问自己的机器人
            if bot.owner_id != current_user.id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="您没有权限访问此机器人"
                )
        
        return bot
    
    @staticmethod
    def create_bot(
        db: Session,
        bot_create: WechatBotCreate,
        current_user: User
    ) -> WechatBot:
        """创建新的微信机器人"""
        # 移除原有的权限限制，现在user角色也可以创建机器人
        # 所有认证用户都可以创建机器人，但要受到数量限制
        
        # 检查机器人名字是否重复
        existing_bot_statement = select(WechatBot).where(WechatBot.name == bot_create.name)
        existing_bot = db.exec(existing_bot_statement).first()
        if existing_bot:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"机器人名字 '{bot_create.name}' 已存在，请选择其他名字"
            )
        
        # 检查用户的机器人数量限制
        statement = select(WechatBot).where(WechatBot.owner_id == current_user.id)
        current_bot_count = len(db.exec(statement).all())
        
        if current_bot_count >= current_user.max_bot_count:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"您已达到机器人数量上限（{current_user.max_bot_count}个）"
            )
        
        # 创建机器人实例，使用当前用户作为owner
        bot_data = bot_create.dict(exclude={'password'})
        bot_data['owner_id'] = current_user.id  # 使用当前用户作为owner
        # 处理密码哈希
        bot_data['hashed_password'] = get_password_hash(bot_create.password)
        bot = WechatBot(**bot_data)
        db.add(bot)
        db.commit()
        db.refresh(bot)
        
        # 创建默认配置
        config = BotConfig(bot_id=bot.id)
        db.add(config)
        db.commit()
        
        return bot
    
    @staticmethod
    def update_bot(
        db: Session,
        bot_id: int,
        bot_update: WechatBotUpdate,
        current_user: User
    ) -> Optional[WechatBot]:
        """更新微信机器人基本信息"""
        bot = WechatAccountService.get_bot_by_id(db, bot_id, current_user)
        if not bot:
            return None
        
        update_data = bot_update.dict(exclude_unset=True)
        # 处理密码更新
        if 'password' in update_data and update_data['password']:
            bot.hashed_password = get_password_hash(update_data['password'])
            del update_data['password']  # 删除明文密码，不直接设置到模型上
        
        for key, value in update_data.items():
            setattr(bot, key, value)
        
        db.add(bot)
        db.commit()
        db.refresh(bot)
        return bot
    
    @staticmethod
    def delete_bot(
        db: Session,
        bot_id: int,
        current_user: User
    ) -> bool:
        """删除微信机器人"""
        bot = WechatAccountService.get_bot_by_id(db, bot_id, current_user)
        if not bot:
            return False
        
        db.delete(bot)
        db.commit()
        return True
    
    @staticmethod
    def get_bot_config(
        db: Session,
        bot_id: int,
        current_user: User
    ) -> Optional[BotConfig]:
        """获取机器人配置"""
        # 先检查机器人权限
        bot = WechatAccountService.get_bot_by_id(db, bot_id, current_user)
        if not bot:
            return None
        
        statement = select(BotConfig).where(BotConfig.bot_id == bot_id)
        return db.exec(statement).first()
    
    @staticmethod
    def update_bot_config(
        db: Session,
        bot_id: int,
        config_update: BotConfigUpdate,
        current_user: User
    ) -> Optional[BotConfig]:
        """更新机器人配置"""
        # 先检查机器人权限
        bot = WechatAccountService.get_bot_by_id(db, bot_id, current_user)
        if not bot:
            return None
        
        # 获取或创建配置
        config = WechatAccountService.get_bot_config(db, bot_id, current_user)
        if not config:
            config = BotConfig(bot_id=bot_id)
            db.add(config)
        
        # 更新基本配置字段
        update_data = config_update.dict(
            exclude={"monitored_chats", "knowledge_bases", "alert_recipients", "escalation_recipients"},
            exclude_unset=True
        )
        for key, value in update_data.items():
            setattr(config, key, value)
        
        db.add(config)
        db.commit()
        
        # 更新关联数据
        if config_update.monitored_chats is not None:
            WechatAccountService._update_monitored_chats(db, bot_id, config_update.monitored_chats)
        
        if config_update.knowledge_bases is not None:
            WechatAccountService._update_knowledge_bases(db, bot_id, config_update.knowledge_bases)
        
        if config_update.alert_recipients is not None:
            WechatAccountService._update_alert_recipients(db, bot_id, config_update.alert_recipients)
        
        if config_update.escalation_recipients is not None:
            WechatAccountService._update_escalation_recipients(db, bot_id, config_update.escalation_recipients)
        
        db.refresh(config)
        return config
    
    @staticmethod
    def _update_monitored_chats(db: Session, bot_id: int, chats: List[MonitoredChatInfo]):
        """更新监控的聊天列表"""
        # 删除旧的
        statement = select(BotMonitoredChat).where(BotMonitoredChat.bot_id == bot_id)
        old_chats = db.exec(statement).all()
        for chat in old_chats:
            db.delete(chat)
        
        # 添加新的
        for chat_info in chats:
            chat = BotMonitoredChat(
                bot_id=bot_id,
                chat_id=chat_info.chat_id,
                chat_type=chat_info.chat_type
            )
            db.add(chat)
        
        db.commit()
    
    @staticmethod
    def _update_knowledge_bases(db: Session, bot_id: int, kbs: List[KnowledgeBaseInfo]):
        """更新知识库关联"""
        # 删除旧的
        statement = select(BotKnowledgeBase).where(BotKnowledgeBase.bot_id == bot_id)
        old_kbs = db.exec(statement).all()
        for kb in old_kbs:
            db.delete(kb)
        
        # 添加新的
        for kb_info in kbs:
            kb = BotKnowledgeBase(
                bot_id=bot_id,
                kb_id=kb_info.kb_id,
                priority=kb_info.priority
            )
            db.add(kb)
        
        db.commit()
    
    @staticmethod
    def _update_alert_recipients(db: Session, bot_id: int, recipients: List[RecipientInfo]):
        """更新提醒接收人"""
        # 删除旧的
        statement = select(BotAlertRecipient).where(BotAlertRecipient.bot_id == bot_id)
        old_recipients = db.exec(statement).all()
        for recipient in old_recipients:
            db.delete(recipient)
        
        # 添加新的
        for recipient_info in recipients:
            recipient = BotAlertRecipient(
                bot_id=bot_id,
                user_id=recipient_info.user_id
            )
            db.add(recipient)
        
        db.commit()
    
    @staticmethod
    def _update_escalation_recipients(db: Session, bot_id: int, recipients: List[RecipientInfo]):
        """更新人工接管人"""
        # 删除旧的
        statement = select(BotEscalationRecipient).where(BotEscalationRecipient.bot_id == bot_id)
        old_recipients = db.exec(statement).all()
        for recipient in old_recipients:
            db.delete(recipient)
        
        # 添加新的
        for recipient_info in recipients:
            recipient = BotEscalationRecipient(
                bot_id=bot_id,
                user_id=recipient_info.user_id
            )
            db.add(recipient)
        
        db.commit()
    
    @staticmethod
    def get_bot_monitored_chats(db: Session, bot_id: int) -> List[MonitoredChatInfo]:
        """获取机器人监控的聊天列表"""
        statement = select(BotMonitoredChat).where(BotMonitoredChat.bot_id == bot_id)
        chats = db.exec(statement).all()
        return [
            MonitoredChatInfo(chat_id=chat.chat_id, chat_type=chat.chat_type)
            for chat in chats
        ]
    
    @staticmethod
    def get_bot_knowledge_bases(db: Session, bot_id: int) -> List[KnowledgeBaseInfo]:
        """获取机器人关联的知识库"""
        statement = select(BotKnowledgeBase).where(BotKnowledgeBase.bot_id == bot_id)
        kbs = db.exec(statement).all()
        # TODO: 需要关联查询知识库表获取名称
        return [
            KnowledgeBaseInfo(kb_id=kb.kb_id, name=f"知识库{kb.kb_id}", priority=kb.priority)
            for kb in kbs
        ]
    
    @staticmethod
    def get_bot_alert_recipients(db: Session, bot_id: int) -> List[RecipientInfo]:
        """获取机器人提醒接收人"""
        statement = select(BotAlertRecipient, User).join(
            User, BotAlertRecipient.user_id == User.id
        ).where(BotAlertRecipient.bot_id == bot_id)
        
        results = db.exec(statement).all()
        return [
            RecipientInfo(user_id=recipient.user_id, name=user.full_name or user.username)
            for recipient, user in results
        ]
    
    @staticmethod
    def authenticate_bot(
        db: Session,
        bot_name: str,
        password: str
    ) -> Optional[WechatBot]:
        """验证机器人身份
        
        Args:
            db: 数据库会话
            bot_name: 机器人名称
            password: 机器人密码
            
        Returns:
            验证成功返回机器人对象，失败返回None
        """
        # 通过机器人名称查找机器人
        statement = select(WechatBot).where(WechatBot.name == bot_name)
        bot = db.exec(statement).first()
        
        if not bot:
            return None
        
        # 验证密码
        if not verify_password(password, bot.hashed_password):
            return None
        
        return bot
    
    @staticmethod
    def get_bot_escalation_recipients(db: Session, bot_id: int) -> List[RecipientInfo]:
        """获取机器人人工接管人"""
        statement = select(BotEscalationRecipient, User).join(
            User, BotEscalationRecipient.user_id == User.id
        ).where(BotEscalationRecipient.bot_id == bot_id)
        
        results = db.exec(statement).all()
        return [
            RecipientInfo(user_id=recipient.user_id, name=user.full_name or user.username)
            for recipient, user in results
        ] 