"""
微信账号管理模块的数据模型
"""
import uuid
from datetime import datetime, time
from enum import Enum
from typing import Optional, List
from pydantic import BaseModel, Field
from sqlmodel import Field as SQLField, SQLModel, Column, Relationship
from sqlalchemy import Enum as SQLAlchemyEnum, Time, ForeignKey, BigInteger, JSON


# 机器人状态枚举
class BotStatus(str, Enum):
    LOGGED_OUT = "logged_out"
    SCANNING = "scanning"
    LOGGED_IN = "logged_in"
    ERROR = "error"


# 私聊监控模式枚举
class ListenModePrivate(str, Enum):
    ALL = "all"
    NONE = "none"


# 群聊监控模式枚举
class ListenModeGroup(str, Enum):
    NONE = "none"
    ALL = "all"
    SPECIFIED = "specified"


# 学习范围枚举
class LearningScope(str, Enum):
    ALL = "all"
    MARKED = "marked"


# 学习模式枚举
class LearningMode(str, Enum):
    AUTO = "auto"
    MANUAL_APPROVAL = "manual_approval"


# 未知问题处理方式枚举
class UnhandledQuestionAction(str, Enum):
    REPLY_TEXT = "reply_text"
    ESCALATE = "escalate"


# 聊天类型枚举
class ChatType(str, Enum):
    GROUP = "group"
    PRIVATE = "private"


# 音调风格枚举
class ToneStyle(str, Enum):
    PROFESSIONAL = "professional"  # 专业严谨
    FRIENDLY = "friendly"          # 热情友好
    CUTE = "cute"                  # 可爱俏皮
    EFFICIENT = "efficient"        # 简洁高效
    CUSTOM = "custom"              # 自定义


# 微信机器人基础模型
class WechatBotBase(SQLModel):
    """微信机器人基础模型"""
    name: str = SQLField(max_length=255, unique=True)
    owner_id: uuid.UUID
    wxid: Optional[str] = SQLField(default=None, unique=True, max_length=255)
    avatar: Optional[str] = SQLField(default=None, max_length=1024)
    status: BotStatus = BotStatus.LOGGED_OUT


# 机器人配置基础模型
class BotConfigBase(SQLModel):
    """机器人配置基础模型"""
    # Tab 1: 身份与角色
    role_description: Optional[str] = None
    tone_style: ToneStyle = ToneStyle.PROFESSIONAL
    system_prompt: Optional[str] = None
    responsible_wxid: Optional[str] = SQLField(default=None, max_length=255)  # 负责人微信ID
    
    # Tab 2: 行为与触发
    is_active_on_work_time: bool = False
    work_time_start: Optional[time] = None
    work_time_end: Optional[time] = None
    offline_reply_message: Optional[str] = None
    auto_accept_friend_request: bool = False
    friend_request_keyword_filter: Optional[str] = SQLField(default=None, max_length=255)
    friend_request_welcome_message: Optional[str] = None
    listen_mode_private_chat: ListenModePrivate = ListenModePrivate.ALL
    listen_mode_group_chat: ListenModeGroup = ListenModeGroup.NONE
    reply_trigger_on_mention: bool = True
    reply_trigger_words: Optional[str] = None
    wake_words: Optional[str] = None  # 唤醒词，多个词用英文逗号分隔
    welcome_new_group_member: bool = False
    new_member_welcome_message: Optional[str] = None
    
    # Tab 3: 智能与知识
    main_ai_model_id: Optional[int] = None
    main_ai_model_params: Optional[dict] = SQLField(default=None, sa_column=Column("main_ai_model_params", JSON))
    enable_auto_learning: bool = False
    learning_scope: LearningScope = LearningScope.MARKED
    learning_mode: LearningMode = LearningMode.MANUAL_APPROVAL
    unhandled_question_action: UnhandledQuestionAction = UnhandledQuestionAction.REPLY_TEXT
    unhandled_question_reply_text: Optional[str] = None
    
    # Tab 4: 协作与提醒
    escalation_failed_attempts_trigger: Optional[int] = None
    escalation_trigger_intent_description: Optional[str] = None
    alert_trigger_intent_description: Optional[str] = None
    max_replies_per_minute: Optional[int] = None


# 数据库模型
class WechatBot(WechatBotBase, table=True):
    """微信机器人数据库模型"""
    __tablename__ = "wechat_bots"
    
    id: int = SQLField(sa_column=Column(BigInteger, primary_key=True, autoincrement=True))
    owner_id: uuid.UUID = SQLField(foreign_key="users.id")
    hashed_password: str = SQLField(max_length=255)  # 添加密码字段
    status: BotStatus = SQLField(
        sa_column=Column(
            SQLAlchemyEnum(
                BotStatus,
                name="bot_status_enum",
                create_type=False,
                values_callable=lambda x: [e.value for e in x]
            ),
            nullable=False,
            default=BotStatus.LOGGED_OUT
        )
    )
    created_at: datetime = SQLField(default_factory=datetime.utcnow)
    updated_at: datetime = SQLField(default_factory=datetime.utcnow)


class BotConfig(BotConfigBase, table=True):
    """机器人配置数据库模型"""
    __tablename__ = "bot_configs"
    
    id: int = SQLField(sa_column=Column(BigInteger, primary_key=True, autoincrement=True))
    bot_id: int = SQLField(foreign_key="wechat_bots.id", unique=True)
    
    # 枚举类型字段需要特殊处理
    tone_style: ToneStyle = SQLField(default=ToneStyle.PROFESSIONAL, max_length=50)
    
    listen_mode_private_chat: ListenModePrivate = SQLField(
        sa_column=Column(
            SQLAlchemyEnum(
                ListenModePrivate,
                name="bot_listen_mode_private_enum",
                create_type=False,
                values_callable=lambda x: [e.value for e in x]
            ),
            nullable=False,
            default=ListenModePrivate.ALL
        )
    )
    
    listen_mode_group_chat: ListenModeGroup = SQLField(
        sa_column=Column(
            SQLAlchemyEnum(
                ListenModeGroup,
                name="bot_listen_mode_group_enum",
                create_type=False,
                values_callable=lambda x: [e.value for e in x]
            ),
            nullable=False,
            default=ListenModeGroup.NONE
        )
    )
    
    learning_scope: LearningScope = SQLField(
        sa_column=Column(
            SQLAlchemyEnum(
                LearningScope,
                name="bot_learning_scope_enum",
                create_type=False,
                values_callable=lambda x: [e.value for e in x]
            ),
            nullable=False,
            default=LearningScope.MARKED
        )
    )
    
    learning_mode: LearningMode = SQLField(
        sa_column=Column(
            SQLAlchemyEnum(
                LearningMode,
                name="bot_learning_mode_enum",
                create_type=False,
                values_callable=lambda x: [e.value for e in x]
            ),
            nullable=False,
            default=LearningMode.MANUAL_APPROVAL
        )
    )
    
    unhandled_question_action: UnhandledQuestionAction = SQLField(
        sa_column=Column(
            SQLAlchemyEnum(
                UnhandledQuestionAction,
                name="bot_unhandled_question_action_enum",
                create_type=False,
                values_callable=lambda x: [e.value for e in x]
            ),
            nullable=False,
            default=UnhandledQuestionAction.REPLY_TEXT
        )
    )
    
    work_time_start: Optional[time] = SQLField(sa_column=Column(Time))
    work_time_end: Optional[time] = SQLField(sa_column=Column(Time))
    
    created_at: datetime = SQLField(default_factory=datetime.utcnow)
    updated_at: datetime = SQLField(default_factory=datetime.utcnow)


class BotMonitoredChat(SQLModel, table=True):
    """机器人监控聊天室列表"""
    __tablename__ = "bot_monitored_chats"
    
    id: int = SQLField(sa_column=Column(BigInteger, primary_key=True, autoincrement=True))
    bot_id: int = SQLField(foreign_key="wechat_bots.id")
    chat_id: str = SQLField(max_length=255)
    chat_type: ChatType = SQLField(
        sa_column=Column(
            SQLAlchemyEnum(
                ChatType,
                name="bot_chat_type_enum",
                create_type=False,
                values_callable=lambda x: [e.value for e in x]
            ),
            nullable=False,
            default=ChatType.GROUP
        )
    )
    created_at: datetime = SQLField(default_factory=datetime.utcnow)


class BotKnowledgeBase(SQLModel, table=True):
    """机器人知识库关联表"""
    __tablename__ = "bot_knowledge_bases"
    
    id: int = SQLField(sa_column=Column(BigInteger, primary_key=True, autoincrement=True))
    bot_id: int = SQLField(foreign_key="wechat_bots.id")
    kb_id: int = SQLField(foreign_key="knowledge_bases.id")
    priority: int = 0
    created_at: datetime = SQLField(default_factory=datetime.utcnow)


class BotAlertRecipient(SQLModel, table=True):
    """机器人提醒接收人表"""
    __tablename__ = "bot_alert_recipients"
    
    id: int = SQLField(sa_column=Column(BigInteger, primary_key=True, autoincrement=True))
    bot_id: int = SQLField(foreign_key="wechat_bots.id")
    user_id: uuid.UUID = SQLField(foreign_key="users.id")
    created_at: datetime = SQLField(default_factory=datetime.utcnow)


class BotEscalationRecipient(SQLModel, table=True):
    """机器人人工接管人表"""
    __tablename__ = "bot_escalation_recipients"
    
    id: int = SQLField(sa_column=Column(BigInteger, primary_key=True, autoincrement=True))
    bot_id: int = SQLField(foreign_key="wechat_bots.id")
    user_id: uuid.UUID = SQLField(foreign_key="users.id")
    created_at: datetime = SQLField(default_factory=datetime.utcnow)


# 请求/响应模型
class WechatBotCreate(BaseModel):
    """创建微信机器人请求模型"""
    name: str
    password: str  # 添加密码字段


class WechatBotUpdate(BaseModel):
    """更新微信机器人请求模型"""
    name: Optional[str] = None
    password: Optional[str] = None  # 添加可选的密码字段


class MonitoredChatInfo(BaseModel):
    """监控聊天信息"""
    chat_id: str
    chat_type: ChatType


class KnowledgeBaseInfo(BaseModel):
    """知识库信息"""
    kb_id: int
    name: str
    priority: int


class RecipientInfo(BaseModel):
    """接收人信息"""
    user_id: uuid.UUID
    name: str


class BotConfigUpdate(BotConfigBase):
    """更新机器人配置请求模型"""
    monitored_chats: Optional[List[MonitoredChatInfo]] = None
    knowledge_bases: Optional[List[KnowledgeBaseInfo]] = None
    alert_recipients: Optional[List[RecipientInfo]] = None
    escalation_recipients: Optional[List[RecipientInfo]] = None


class WechatBotPublic(WechatBotBase):
    """公开的微信机器人信息模型"""
    id: int
    owner_name: Optional[str] = None
    created_by_me: Optional[bool] = None
    creator_type: Optional[str] = None  # "self", "subordinate", "other"
    created_at: datetime
    updated_at: datetime


class BotConfigPublic(BotConfigBase):
    """公开的机器人配置信息模型"""
    id: int
    bot_id: int
    monitored_chats: List[MonitoredChatInfo] = []
    knowledge_bases: List[KnowledgeBaseInfo] = []
    alert_recipients: List[RecipientInfo] = []
    escalation_recipients: List[RecipientInfo] = []


class WechatBotWithConfig(WechatBotPublic):
    """包含配置的微信机器人信息模型"""
    config: Optional[BotConfigPublic] = None


class WechatBotsPublic(BaseModel):
    """微信机器人列表响应模型"""
    data: List[WechatBotPublic]
    total: int


class LoginResponse(BaseModel):
    """登录响应模型"""
    qrcode: str
    status_check_token: str


class OperationResponse(BaseModel):
    """操作响应模型"""
    error: int = 0
    message: str
    body: Optional[dict] = None 