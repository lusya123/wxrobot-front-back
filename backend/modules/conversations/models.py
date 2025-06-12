"""
会话与消息管理模块的数据模型
"""
import uuid
from datetime import datetime
from enum import Enum
from typing import Optional, List
from pydantic import BaseModel, Field
from sqlmodel import Field as SQLField, SQLModel, Column, Relationship
from sqlalchemy import Enum as SQLAlchemyEnum, BigInteger, Text, ForeignKey, Table
from sqlalchemy import MetaData


# 枚举类型定义
class ConversationType(str, Enum):
    """会话类型枚举"""
    PRIVATE = "private"
    GROUP = "group"


class MessageType(str, Enum):
    """消息类型枚举"""
    TEXT = "text"
    IMAGE = "image"
    FILE = "file"
    LINK = "link"
    AUDIO = "audio"
    VIDEO = "video"
    UNSUPPORTED = "unsupported"


class ContactMemoryContextType(str, Enum):
    """联系人记忆上下文类型枚举"""
    GLOBAL = "global"
    GROUP = "group"


# 关联表定义 - 使用SQLAlchemy的Table
metadata = MetaData()

contact_tags_table = Table(
    "contact_tags",
    metadata,
    Column("contact_id", BigInteger, ForeignKey("contacts.id", ondelete="CASCADE"), primary_key=True),
    Column("tag_id", BigInteger, ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True),
)

conversation_participants_table = Table(
    "conversation_participants",
    metadata,
    Column("conversation_id", BigInteger, ForeignKey("conversations.id", ondelete="CASCADE"), primary_key=True),
    Column("contact_id", BigInteger, ForeignKey("contacts.id", ondelete="CASCADE"), primary_key=True),
)


# 基础模型定义
class TagBase(SQLModel):
    """标签基础模型"""
    name: str = SQLField(max_length=100)
    owner_id: Optional[uuid.UUID] = None


class ContactBase(SQLModel):
    """联系人基础模型"""
    wxid: str = SQLField(unique=True, index=True, max_length=255)
    wx_name: Optional[str] = SQLField(default=None, max_length=255)
    remark_name: Optional[str] = SQLField(default=None, max_length=255)
    avatar: Optional[str] = SQLField(default=None, max_length=1024)
    group_name: Optional[str] = SQLField(default=None, max_length=255)
    notes: Optional[str] = None


class ConversationBase(SQLModel):
    """会话基础模型"""
    wechat_bot_id: int
    external_id: str = SQLField(max_length=255)
    type: ConversationType
    topic: Optional[str] = SQLField(default=None, max_length=255)
    last_message_summary: Optional[str] = None
    last_message_at: Optional[datetime] = None


class MessageBase(SQLModel):
    """消息基础模型"""
    conversation_id: int
    sender_id: int
    external_message_id: Optional[str] = SQLField(default=None, max_length=255)
    type: MessageType
    content: Optional[str] = None
    created_at: datetime


class ContactMemoryBase(SQLModel):
    """联系人记忆基础模型"""
    contact_id: int
    context_type: ContactMemoryContextType
    context_key: str = SQLField(max_length=255)
    summary: str
    updated_at: datetime


# 数据库模型
class Tag(TagBase, table=True):
    """标签数据库模型"""
    __tablename__ = "tags"
    
    id: int = SQLField(sa_column=Column(BigInteger, primary_key=True, autoincrement=True))
    owner_id: Optional[uuid.UUID] = SQLField(foreign_key="users.id", default=None)
    created_at: datetime = SQLField(default_factory=datetime.utcnow)
    updated_at: datetime = SQLField(default_factory=datetime.utcnow)
    
    # 移除多对多关系，避免SQLAlchemy报错


class Contact(ContactBase, table=True):
    """联系人数据库模型"""
    __tablename__ = "contacts"
    
    id: int = SQLField(sa_column=Column(BigInteger, primary_key=True, autoincrement=True))
    created_at: datetime = SQLField(default_factory=datetime.utcnow)
    updated_at: datetime = SQLField(default_factory=datetime.utcnow)
    
    # 移除多对多关系，避免SQLAlchemy报错
    memories: List["ContactMemory"] = Relationship(back_populates="contact")


class Conversation(ConversationBase, table=True):
    """会话数据库模型"""
    __tablename__ = "conversations"
    
    id: int = SQLField(sa_column=Column(BigInteger, primary_key=True, autoincrement=True))
    wechat_bot_id: int = SQLField(foreign_key="wechat_bots.id")
    type: ConversationType = SQLField(
        sa_column=Column(
            SQLAlchemyEnum(
                ConversationType,
                name="conversation_type_enum",
                create_type=False,
                values_callable=lambda x: [e.value for e in x]
            ),
            nullable=False
        )
    )
    created_at: datetime = SQLField(default_factory=datetime.utcnow)
    updated_at: datetime = SQLField(default_factory=datetime.utcnow)
    
    # 保留一对多关系
    messages: List["Message"] = Relationship(back_populates="conversation")


class Message(MessageBase, table=True):
    """消息数据库模型"""
    __tablename__ = "messages"
    
    id: int = SQLField(sa_column=Column(BigInteger, primary_key=True, autoincrement=True))
    conversation_id: int = SQLField(foreign_key="conversations.id")
    sender_id: int = SQLField(foreign_key="contacts.id")
    type: MessageType = SQLField(
        sa_column=Column(
            SQLAlchemyEnum(
                MessageType,
                name="message_type_enum",
                create_type=False,
                values_callable=lambda x: [e.value for e in x]
            ),
            nullable=False
        )
    )
    content: Optional[str] = SQLField(sa_column=Column(Text))
    
    # 关系
    conversation: Conversation = Relationship(back_populates="messages")
    sender: Contact = Relationship()


class ContactMemory(ContactMemoryBase, table=True):
    """联系人记忆数据库模型"""
    __tablename__ = "contact_memories"
    
    id: int = SQLField(sa_column=Column(BigInteger, primary_key=True, autoincrement=True))
    contact_id: int = SQLField(foreign_key="contacts.id")
    context_type: ContactMemoryContextType = SQLField(
        sa_column=Column(
            SQLAlchemyEnum(
                ContactMemoryContextType,
                name="contact_memory_context_type_enum",
                create_type=False,
                values_callable=lambda x: [e.value for e in x]
            ),
            nullable=False
        )
    )
    summary: str = SQLField(sa_column=Column(Text))
    
    # 关系
    contact: Contact = Relationship(back_populates="memories")


# 请求/响应模型
class TagCreate(BaseModel):
    """创建标签请求模型"""
    name: str = Field(max_length=100)
    owner_id: Optional[uuid.UUID] = None


class TagUpdate(BaseModel):
    """更新标签请求模型"""
    name: Optional[str] = Field(default=None, max_length=100)


class ContactCreate(ContactBase):
    """创建联系人请求模型"""
    tag_ids: Optional[List[int]] = []


class ContactUpdate(BaseModel):
    """更新联系人请求模型"""
    wx_name: Optional[str] = None
    remark_name: Optional[str] = None
    avatar: Optional[str] = None
    group_name: Optional[str] = None
    notes: Optional[str] = None
    tag_ids: Optional[List[int]] = None


class ConversationCreate(ConversationBase):
    """创建会话请求模型"""
    participant_ids: Optional[List[int]] = []


class MessageCreate(MessageBase):
    """创建消息请求模型"""
    pass


class ContactMemoryCreate(ContactMemoryBase):
    """创建联系人记忆请求模型"""
    pass


# 内部API请求模型
class MessageReportRequest(BaseModel):
    """消息上报请求模型"""
    bot_id: str  # 机器人的wxid
    conversation_id: str  # 会话的唯一ID
    conversation_topic: str  # 会话标题
    conversation_type: str  # 'private' or 'group'
    sender: dict  # 发送者信息 {"id": "wxid", "name": "昵称"}
    message: dict  # 消息信息 {"id": "msg_id", "type": "text", "content": "内容", "timestamp": 1234567890}
    participants: Optional[List[dict]] = None  # 群聊参与者列表


# 公开API响应模型
class TagPublic(TagBase):
    """公开的标签信息模型"""
    id: int
    created_at: datetime
    updated_at: datetime


class ContactPublic(ContactBase):
    """公开的联系人信息模型"""
    id: int
    tags: List[TagPublic] = []
    created_at: datetime
    updated_at: datetime


class ConversationPublic(ConversationBase):
    """公开的会话信息模型"""
    id: int
    avatar: Optional[str] = None
    last_message: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class MessagePublic(MessageBase):
    """公开的消息信息模型"""
    id: int
    sender: ContactPublic


class ContactMemoryPublic(ContactMemoryBase):
    """公开的联系人记忆信息模型"""
    id: int


# 列表响应模型
class ConversationListResponse(BaseModel):
    """会话列表响应模型"""
    conversations: List[ConversationPublic]


class MessageListResponse(BaseModel):
    """消息列表响应模型"""
    messages: List[MessagePublic]
    total: int


class ConversationDetailResponse(BaseModel):
    """会话详情响应模型"""
    type: str  # "contact" or "conversation"
    details: dict


class AISuggestionResponse(BaseModel):
    """AI建议响应模型"""
    suggestion: str
    memory_summary: Optional[str] = None
