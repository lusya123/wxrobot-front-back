"""
会话与消息管理模块的服务层
"""
from datetime import datetime
from typing import List, Optional, Dict, Any
from sqlmodel import Session, select, and_, or_, func
from sqlalchemy.orm import selectinload
from sqlalchemy import text
from uuid import UUID

from app.core.db import engine
from modules.wechat_accounts.models import WechatBot
from modules.conversations.models import (
    Contact, ContactCreate, ContactUpdate, ContactPublic,
    Tag, TagCreate, TagPublic,
    Conversation, ConversationCreate, ConversationPublic,
    Message, MessageCreate, MessagePublic,
    ContactMemory, ContactMemoryCreate, ContactMemoryPublic,
    ConversationType, MessageType, ContactMemoryContextType,
    MessageReportRequest
)


class ConversationService:
    """会话与消息管理服务"""
    
    @staticmethod
    def process_message_report(data: MessageReportRequest) -> dict:
        """处理消息上报"""
        with Session(engine) as session:
            # 1. 查找机器人
            bot = session.exec(
                select(WechatBot).where(WechatBot.wxid == data.bot_id)
            ).first()
            if not bot:
                raise ValueError(f"机器人 {data.bot_id} 不存在")
            
            # 2. 查找或创建发送者联系人
            sender = session.exec(
                select(Contact).where(Contact.wxid == data.sender["id"])
            ).first()
            if not sender:
                sender = Contact(
                    wxid=data.sender["id"],
                    wx_name=data.sender["name"]
                )
                session.add(sender)
                session.commit()
                session.refresh(sender)
            
            # 3. 查找或创建会话
            conversation = session.exec(
                select(Conversation).where(
                    and_(
                        Conversation.wechat_bot_id == bot.id,
                        Conversation.external_id == data.conversation_id
                    )
                )
            ).first()
            
            if not conversation:
                conversation = Conversation(
                    wechat_bot_id=bot.id,
                    external_id=data.conversation_id,
                    type=ConversationType(data.conversation_type),
                    topic=data.conversation_topic
                )
                session.add(conversation)
                session.commit()
                session.refresh(conversation)
            
            # 4. 更新会话参与者（如果是群聊）
            if data.conversation_type == "group" and data.participants:
                for participant_data in data.participants:
                    participant = session.exec(
                        select(Contact).where(Contact.wxid == participant_data["id"])
                    ).first()
                    if not participant:
                        participant = Contact(
                            wxid=participant_data["id"],
                            wx_name=participant_data["name"]
                        )
                        session.add(participant)
                        session.commit()
                        session.refresh(participant)
                    
                    # 检查是否已经是参与者
                    existing = session.exec(
                        text("SELECT 1 FROM conversation_participants WHERE conversation_id = :conv_id AND contact_id = :contact_id"),
                        {"conv_id": conversation.id, "contact_id": participant.id}
                    ).first()
                    
                    if not existing:
                        session.exec(
                            text("INSERT INTO conversation_participants (conversation_id, contact_id) VALUES (:conv_id, :contact_id)"),
                            {"conv_id": conversation.id, "contact_id": participant.id}
                        )
            
            # 确保发送者在参与者列表中
            sender_exists = session.exec(
                text("SELECT 1 FROM conversation_participants WHERE conversation_id = :conv_id AND contact_id = :contact_id"),
                {"conv_id": conversation.id, "contact_id": sender.id}
            ).first()
            
            if not sender_exists:
                session.exec(
                    text("INSERT INTO conversation_participants (conversation_id, contact_id) VALUES (:conv_id, :contact_id)"),
                    {"conv_id": conversation.id, "contact_id": sender.id}
                )
            
            # 5. 创建消息
            message = Message(
                conversation_id=conversation.id,
                sender_id=sender.id,
                external_message_id=data.message.get("id"),
                type=MessageType(data.message.get("type", "text")),
                content=data.message.get("content"),
                created_at=datetime.fromtimestamp(data.message["timestamp"])
            )
            session.add(message)
            
            # 6. 更新会话的最后消息信息
            conversation.last_message_summary = f"{sender.wx_name}: {message.content[:50]}"
            conversation.last_message_at = message.created_at
            
            session.commit()
            
            return {"status": "received"}
    
    @staticmethod
    def get_conversations(
        wechat_account_id: int,
        query: Optional[str] = None,
        current_user_id: UUID = None
    ) -> List[ConversationPublic]:
        """获取会话列表"""
        with Session(engine) as session:
            # 构建查询
            stmt = select(Conversation).where(
                Conversation.wechat_bot_id == wechat_account_id
            )
            
            # 应用搜索条件
            if query:
                stmt = stmt.where(
                    Conversation.topic.ilike(f"%{query}%")
                )
            
            # 按最后消息时间排序
            stmt = stmt.order_by(Conversation.last_message_at.desc())
            
            conversations = session.exec(stmt).all()
            
            # 转换为响应模型
            result = []
            for conv in conversations:
                # 获取会话头像（私聊用对方头像，群聊暂时为空）
                avatar = None
                if conv.type == ConversationType.PRIVATE:
                    # 获取私聊的参与者
                    participant = session.exec(
                        text("""
                            SELECT c.* FROM contacts c 
                            JOIN conversation_participants cp ON c.id = cp.contact_id 
                            WHERE cp.conversation_id = :conv_id 
                            LIMIT 1
                        """),
                        {"conv_id": conv.id}
                    ).first()
                    if participant:
                        avatar = participant.avatar
                
                result.append(ConversationPublic(
                    id=conv.id,
                    wechat_bot_id=conv.wechat_bot_id,
                    external_id=conv.external_id,
                    type=conv.type,
                    topic=conv.topic,
                    avatar=avatar,
                    last_message=conv.last_message_summary,
                    last_message_summary=conv.last_message_summary,
                    last_message_at=conv.last_message_at,
                    created_at=conv.created_at,
                    updated_at=conv.updated_at
                ))
            
            return result
    
    @staticmethod
    def get_messages(
        conversation_id: int,
        page: int = 1,
        page_size: int = 20,
        current_user_id: UUID = None
    ) -> Dict[str, Any]:
        """获取会话消息列表"""
        with Session(engine) as session:
            # 计算偏移量
            offset = (page - 1) * page_size
            
            # 查询消息总数
            total = session.exec(
                select(func.count(Message.id)).where(
                    Message.conversation_id == conversation_id
                )
            ).one()
            
            # 查询消息列表（包含发送者信息）
            stmt = (
                select(Message)
                .where(Message.conversation_id == conversation_id)
                .options(selectinload(Message.sender))
                .order_by(Message.created_at.desc())
                .offset(offset)
                .limit(page_size)
            )
            
            messages = session.exec(stmt).all()
            
            # 转换为响应模型
            message_list = []
            for msg in reversed(messages):  # 反转顺序，让最新的消息在底部
                # 获取发送者的标签
                sender_tags = session.exec(
                    text("""
                        SELECT t.* FROM tags t 
                        JOIN contact_tags ct ON t.id = ct.tag_id 
                        WHERE ct.contact_id = :contact_id
                    """),
                    {"contact_id": msg.sender.id}
                ).all()
                
                tags_public = [TagPublic(
                    id=tag.id,
                    name=tag.name,
                    owner_id=tag.owner_id,
                    created_at=tag.created_at,
                    updated_at=tag.updated_at
                ) for tag in sender_tags]
                
                sender_public = ContactPublic(
                    id=msg.sender.id,
                    wxid=msg.sender.wxid,
                    wx_name=msg.sender.wx_name,
                    remark_name=msg.sender.remark_name,
                    avatar=msg.sender.avatar,
                    group_name=msg.sender.group_name,
                    notes=msg.sender.notes,
                    tags=tags_public,
                    created_at=msg.sender.created_at,
                    updated_at=msg.sender.updated_at
                )
                
                message_list.append(MessagePublic(
                    id=msg.id,
                    conversation_id=msg.conversation_id,
                    sender_id=msg.sender_id,
                    sender=sender_public,
                    external_message_id=msg.external_message_id,
                    type=msg.type,
                    content=msg.content,
                    created_at=msg.created_at
                ))
            
            return {
                "messages": message_list,
                "total": total
            }
    
    @staticmethod
    def get_conversation_details(
        conversation_id: int,
        contact_id: Optional[int] = None,
        current_user_id: UUID = None
    ) -> Dict[str, Any]:
        """获取会话或联系人详情"""
        with Session(engine) as session:
            # 查询会话
            conversation = session.exec(
                select(Conversation)
                .where(Conversation.id == conversation_id)
            ).first()
            
            if not conversation:
                raise ValueError("会话不存在")
            
            # 如果指定了联系人ID，返回联系人详情
            if contact_id:
                contact = session.exec(
                    select(Contact)
                    .where(Contact.id == contact_id)
                ).first()
                
                if not contact:
                    raise ValueError("联系人不存在")
                
                # 获取联系人的标签
                contact_tags = session.exec(
                    text("""
                        SELECT t.name FROM tags t 
                        JOIN contact_tags ct ON t.id = ct.tag_id 
                        WHERE ct.contact_id = :contact_id
                    """),
                    {"contact_id": contact.id}
                ).all()
                
                return {
                    "type": "contact",
                    "details": {
                        "id": contact.id,
                        "wxid": contact.wxid,
                        "name": contact.wx_name,
                        "remark_name": contact.remark_name,
                        "avatar": contact.avatar,
                        "tags": [tag[0] for tag in contact_tags],
                        "group": contact.group_name,
                        "notes": contact.notes
                    }
                }
            
            # 返回会话详情
            if conversation.type == ConversationType.PRIVATE:
                # 私聊，返回对方的联系人信息
                other_contact = session.exec(
                    text("""
                        SELECT c.* FROM contacts c 
                        JOIN conversation_participants cp ON c.id = cp.contact_id 
                        WHERE cp.conversation_id = :conv_id 
                        LIMIT 1
                    """),
                    {"conv_id": conversation.id}
                ).first()
                
                if other_contact:
                    # 获取联系人的标签
                    contact_tags = session.exec(
                        text("""
                            SELECT t.name FROM tags t 
                            JOIN contact_tags ct ON t.id = ct.tag_id 
                            WHERE ct.contact_id = :contact_id
                        """),
                        {"contact_id": other_contact.id}
                    ).all()
                    
                    return {
                        "type": "contact",
                        "details": {
                            "id": other_contact.id,
                            "wxid": other_contact.wxid,
                            "name": other_contact.wx_name,
                            "remark_name": other_contact.remark_name,
                            "avatar": other_contact.avatar,
                            "tags": [tag[0] for tag in contact_tags],
                            "group": other_contact.group_name,
                            "notes": other_contact.notes
                        }
                    }
            else:
                # 群聊，返回群信息和成员列表
                participants = session.exec(
                    text("""
                        SELECT c.* FROM contacts c 
                        JOIN conversation_participants cp ON c.id = cp.contact_id 
                        WHERE cp.conversation_id = :conv_id
                    """),
                    {"conv_id": conversation.id}
                ).all()
                
                return {
                    "type": "conversation",
                    "details": {
                        "id": conversation.id,
                        "topic": conversation.topic,
                        "participants": [
                            {
                                "id": p.id,
                                "wxid": p.wxid,
                                "name": p.wx_name,
                                "avatar": p.avatar
                            }
                            for p in participants
                        ]
                    }
                }
    
    @staticmethod
    def update_contact(
        contact_id: int,
        update_data: ContactUpdate,
        current_user_id: UUID = None
    ) -> ContactPublic:
        """更新联系人信息"""
        with Session(engine) as session:
            # 查询联系人
            contact = session.exec(
                select(Contact).where(Contact.id == contact_id)
            ).first()
            
            if not contact:
                raise ValueError("联系人不存在")
            
            # 更新基本信息
            if update_data.wx_name is not None:
                contact.wx_name = update_data.wx_name
            if update_data.remark_name is not None:
                contact.remark_name = update_data.remark_name
            if update_data.avatar is not None:
                contact.avatar = update_data.avatar
            if update_data.group_name is not None:
                contact.group_name = update_data.group_name
            if update_data.notes is not None:
                contact.notes = update_data.notes
            
            # 更新标签
            if update_data.tag_ids is not None:
                # 清除现有标签
                session.exec(
                    text("DELETE FROM contact_tags WHERE contact_id = :contact_id"),
                    {"contact_id": contact.id}
                )
                
                # 添加新标签
                for tag_id in update_data.tag_ids:
                    tag = session.exec(
                        select(Tag).where(Tag.id == tag_id)
                    ).first()
                    if tag:
                        session.exec(
                            text("INSERT INTO contact_tags (contact_id, tag_id) VALUES (:contact_id, :tag_id)"),
                            {"contact_id": contact.id, "tag_id": tag.id}
                        )
            
            contact.updated_at = datetime.utcnow()
            session.commit()
            session.refresh(contact)
            
            # 获取更新后的标签
            contact_tags = session.exec(
                text("""
                    SELECT t.* FROM tags t 
                    JOIN contact_tags ct ON t.id = ct.tag_id 
                    WHERE ct.contact_id = :contact_id
                """),
                {"contact_id": contact.id}
            ).all()
            
            tags_public = [TagPublic(
                id=tag.id,
                name=tag.name,
                owner_id=tag.owner_id,
                created_at=tag.created_at,
                updated_at=tag.updated_at
            ) for tag in contact_tags]
            
            # 返回更新后的联系人信息
            return ContactPublic(
                id=contact.id,
                wxid=contact.wxid,
                wx_name=contact.wx_name,
                remark_name=contact.remark_name,
                avatar=contact.avatar,
                group_name=contact.group_name,
                notes=contact.notes,
                tags=tags_public,
                created_at=contact.created_at,
                updated_at=contact.updated_at
            )
    
    @staticmethod
    def get_ai_suggestion(
        conversation_id: int,
        contact_id: int,
        current_user_id: UUID = None
    ) -> Dict[str, Any]:
        """获取AI回复建议"""
        with Session(engine) as session:
            # 查询会话
            conversation = session.exec(
                select(Conversation).where(Conversation.id == conversation_id)
            ).first()
            
            if not conversation:
                raise ValueError("会话不存在")
            
            # 查询联系人
            contact = session.exec(
                select(Contact).where(Contact.id == contact_id)
            ).first()
            
            if not contact:
                raise ValueError("联系人不存在")
            
            # 根据会话类型获取记忆
            if conversation.type == ConversationType.PRIVATE:
                # 私聊，获取全局记忆
                memory = session.exec(
                    select(ContactMemory).where(
                        and_(
                            ContactMemory.contact_id == contact_id,
                            ContactMemory.context_type == ContactMemoryContextType.GLOBAL,
                            ContactMemory.context_key == contact.wxid
                        )
                    )
                ).first()
            else:
                # 群聊，获取群聊专属记忆
                memory = session.exec(
                    select(ContactMemory).where(
                        and_(
                            ContactMemory.contact_id == contact_id,
                            ContactMemory.context_type == ContactMemoryContextType.GROUP,
                            ContactMemory.context_key == conversation.external_id
                        )
                    )
                ).first()
                
                # 获取最近的10条群聊消息作为上下文
                recent_messages = session.exec(
                    select(Message)
                    .where(Message.conversation_id == conversation_id)
                    .order_by(Message.created_at.desc())
                    .limit(10)
                ).all()
            
            # TODO: 调用AI服务生成建议
            # 这里暂时返回模拟数据
            memory_summary = memory.summary if memory else "暂无历史记忆"
            
            suggestion = f"根据历史对话分析，{contact.wx_name or contact.wxid} "
            if memory:
                suggestion += f"的特点是：{memory_summary[:100]}... "
            
            if conversation.type == ConversationType.GROUP:
                suggestion += "在群聊中，建议采用更加正式和专业的语气回复。"
            else:
                suggestion += "在私聊中，可以采用更加亲切和个性化的回复方式。"
            
            return {
                "suggestion": suggestion,
                "memory_summary": memory_summary
            }
    
    @staticmethod
    def create_tag(
        tag_data: TagCreate,
        current_user_id: UUID = None
    ) -> TagPublic:
        """创建标签"""
        with Session(engine) as session:
            # 检查标签是否已存在
            existing_tag = session.exec(
                select(Tag).where(
                    and_(
                        Tag.name == tag_data.name,
                        Tag.owner_id == (tag_data.owner_id or current_user_id)
                    )
                )
            ).first()
            
            if existing_tag:
                raise ValueError("标签已存在")
            
            # 创建新标签
            tag = Tag(
                name=tag_data.name,
                owner_id=tag_data.owner_id or current_user_id
            )
            session.add(tag)
            session.commit()
            session.refresh(tag)
            
            return TagPublic(
                id=tag.id,
                name=tag.name,
                owner_id=tag.owner_id,
                created_at=tag.created_at,
                updated_at=tag.updated_at
            )
    
    @staticmethod
    def get_tags(
        owner_id: Optional[UUID] = None,
        include_public: bool = True
    ) -> List[TagPublic]:
        """获取标签列表"""
        with Session(engine) as session:
            # 构建查询
            conditions = []
            if owner_id:
                conditions.append(Tag.owner_id == owner_id)
            if include_public:
                conditions.append(Tag.owner_id.is_(None))
            
            stmt = select(Tag)
            if conditions:
                stmt = stmt.where(or_(*conditions))
            
            tags = session.exec(stmt).all()
            
            return [
                TagPublic(
                    id=tag.id,
                    name=tag.name,
                    owner_id=tag.owner_id,
                    created_at=tag.created_at,
                    updated_at=tag.updated_at
                )
                for tag in tags
            ]
