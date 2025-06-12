-- ====================================================================
-- 会话与消息管理模块表结构定义 - PostgreSQL版本
-- 设计依据: doc/会话与消息管理模块/需求文档.md
-- 关联表: users (user_management), wechat_bots (wechat_account_management)
-- ====================================================================

SET client_encoding = 'UTF8';

-- ====================================================================
-- 枚举类型定义
-- ====================================================================

-- 会话类型枚举
DROP TYPE IF EXISTS conversation_type_enum CASCADE;
CREATE TYPE conversation_type_enum AS ENUM ('private', 'group');

-- 消息类型枚举
DROP TYPE IF EXISTS message_type_enum CASCADE;
CREATE TYPE message_type_enum AS ENUM ('text', 'image', 'file', 'link', 'audio', 'video', 'unsupported');

-- 联系人记忆上下文类型枚举
DROP TYPE IF EXISTS contact_memory_context_type_enum CASCADE;
CREATE TYPE contact_memory_context_type_enum AS ENUM ('global', 'group');

-- ====================================================================
-- 表结构定义
-- ====================================================================

-- 1. 标签表 (用于联系人)
DROP TABLE IF EXISTS tags CASCADE;
CREATE TABLE tags (
    id BIGSERIAL PRIMARY KEY,
    owner_id UUID REFERENCES users(id) ON DELETE SET NULL, -- 标签创建者，可为NULL表示公共标签
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(owner_id, name) -- 同一个用户下的标签名唯一
);

-- 2. 微信联系人表
DROP TABLE IF EXISTS contacts CASCADE;
CREATE TABLE contacts (
    id BIGSERIAL PRIMARY KEY,
    wxid VARCHAR(255) NOT NULL UNIQUE, -- 微信的唯一ID
    wx_name VARCHAR(255), -- 微信昵称
    remark_name VARCHAR(255), -- 机器人给该联系人设置的备注名
    avatar VARCHAR(1024), -- 头像链接
    group_name VARCHAR(255), -- 所属分组
    notes TEXT, -- 运营人员添加的内部备注
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. 联系人-标签关联表 (多对多)
DROP TABLE IF EXISTS contact_tags CASCADE;
CREATE TABLE contact_tags (
    contact_id BIGINT NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    tag_id BIGINT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (contact_id, tag_id)
);

-- 4. 会话表
DROP TABLE IF EXISTS conversations CASCADE;
CREATE TABLE conversations (
    id BIGSERIAL PRIMARY KEY,
    wechat_bot_id BIGINT NOT NULL REFERENCES wechat_bots(id) ON DELETE CASCADE,
    external_id VARCHAR(255) NOT NULL, -- 会话的外部唯一ID (例如 wxid 或 chatroom_id@chatroom)
    type conversation_type_enum NOT NULL,
    topic VARCHAR(255), -- 会话标题 (对方昵称或群名称)
    last_message_summary TEXT, -- 最后一条消息的摘要
    last_message_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (wechat_bot_id, external_id)
);

-- 5. 会话参与者关联表 (多对多)
DROP TABLE IF EXISTS conversation_participants CASCADE;
CREATE TABLE conversation_participants (
    conversation_id BIGINT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    contact_id BIGINT NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (conversation_id, contact_id)
);

-- 6. 消息表
DROP TABLE IF EXISTS messages CASCADE;
CREATE TABLE messages (
    id BIGSERIAL PRIMARY KEY,
    conversation_id BIGINT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id BIGINT NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    external_message_id VARCHAR(255), -- 来自微信的原始消息ID
    type message_type_enum NOT NULL,
    content TEXT, -- 消息内容 (文本、图片URL、文件URL等)
    created_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- 7. 联系人记忆表
DROP TABLE IF EXISTS contact_memories CASCADE;
CREATE TABLE contact_memories (
    id BIGSERIAL PRIMARY KEY,
    contact_id BIGINT NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    context_type contact_memory_context_type_enum NOT NULL, -- 'global' 或 'group'
    context_key VARCHAR(255) NOT NULL, -- global时为contact.wxid, group时为conversation.external_id
    summary TEXT NOT NULL, -- AI生成的摘要
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    UNIQUE (contact_id, context_type, context_key)
);


-- ====================================================================
-- 索引定义
-- ====================================================================

-- tags表索引
CREATE INDEX idx_tags_owner_id ON tags (owner_id);

-- contacts表索引
CREATE INDEX idx_contacts_wxid ON contacts (wxid);
CREATE INDEX idx_contacts_wx_name ON contacts (wx_name);

-- contact_tags表索引
CREATE INDEX idx_contact_tags_contact_id ON contact_tags (contact_id);
CREATE INDEX idx_contact_tags_tag_id ON contact_tags (tag_id);

-- conversations表索引
CREATE INDEX idx_conversations_wechat_bot_id ON conversations (wechat_bot_id);
CREATE INDEX idx_conversations_external_id ON conversations (external_id);
CREATE INDEX idx_conversations_last_message_at ON conversations (last_message_at DESC);
CREATE INDEX idx_conversations_topic ON conversations (topic); -- 用于搜索

-- conversation_participants表索引
CREATE INDEX idx_conversation_participants_conversation_id ON conversation_participants (conversation_id);
CREATE INDEX idx_conversation_participants_contact_id ON conversation_participants (contact_id);

-- messages表索引
CREATE INDEX idx_messages_conversation_id ON messages (conversation_id);
CREATE INDEX idx_messages_sender_id ON messages (sender_id);
CREATE INDEX idx_messages_created_at ON messages (created_at DESC);
CREATE INDEX idx_messages_type ON messages (type);

-- contact_memories表索引
CREATE INDEX idx_contact_memories_contact_id ON contact_memories (contact_id);
CREATE INDEX idx_contact_memories_context_key ON contact_memories (context_key);


-- ====================================================================
-- 触发器函数定义 (用于自动更新updated_at字段)
-- ====================================================================

-- 确保函数存在
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

-- 为新表创建更新时间触发器
CREATE TRIGGER update_tags_updated_at BEFORE UPDATE ON tags FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON contacts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- contact_memories 使用手动设置的 updated_at，不创建触发器


-- ====================================================================
-- 表和字段注释
-- ====================================================================

COMMENT ON TABLE tags IS '联系人标签表';
COMMENT ON COLUMN tags.owner_id IS '标签创建者ID，关联users.id。NULL表示公共标签';
COMMENT ON COLUMN tags.name IS '标签名称';

COMMENT ON TABLE contacts IS '微信联系人表（客户或群成员）';
COMMENT ON COLUMN contacts.wxid IS '微信的全局唯一ID (wxid)';
COMMENT ON COLUMN contacts.wx_name IS '微信昵称';
COMMENT ON COLUMN contacts.remark_name IS '机器人所有者给该联系人设置的备注名';
COMMENT ON COLUMN contacts.avatar IS '头像链接';
COMMENT ON COLUMN contacts.group_name IS '运营人员设置的联系人分组';
COMMENT ON COLUMN contacts.notes IS '运营人员添加的关于此联系人的内部备注';

COMMENT ON TABLE contact_tags IS '联系人与标签的多对多关联表';

COMMENT ON TABLE conversations IS '会话表，代表一个私聊或群聊窗口';
COMMENT ON COLUMN conversations.wechat_bot_id IS '该会话所属的微信机器人ID，关联wechat_bots.id';
COMMENT ON COLUMN conversations.external_id IS '会话的外部唯一ID，如个人wxid或群聊id (e.g., "chatroom_id@chatroom")';
COMMENT ON COLUMN conversations.type IS '会话类型: private (私聊), group (群聊)';
COMMENT ON COLUMN conversations.topic IS '会话标题。私聊为对方备注/昵称，群聊为群名称';
COMMENT ON COLUMN conversations.last_message_summary IS '最后一条消息的文本摘要';
COMMENT ON COLUMN conversations.last_message_at IS '最后一条消息的接收时间，用于排序';

COMMENT ON TABLE conversation_participants IS '会话参与者关联表，记录会话中有哪些联系人';

COMMENT ON TABLE messages IS '具体的消息记录表';
COMMENT ON COLUMN messages.conversation_id IS '消息所属的会话ID';
COMMENT ON COLUMN messages.sender_id IS '消息发送者的ID，关联contacts.id';
COMMENT ON COLUMN messages.external_message_id IS '来自微信的原始消息ID，用于去重或关联';
COMMENT ON COLUMN messages.type IS '消息类型 (text, image, link, etc.)';
COMMENT ON COLUMN messages.content IS '消息内容。对于文本是文字，对于媒体是URL';
COMMENT ON COLUMN messages.created_at IS '消息的发送/接收时间';

COMMENT ON TABLE contact_memories IS 'AI生成的联系人记忆摘要表';
COMMENT ON COLUMN contact_memories.contact_id IS '记忆所属的联系人ID';
COMMENT ON COLUMN contact_memories.context_type IS '记忆的上下文类型: global (全局), group (特定群聊)';
COMMENT ON COLUMN contact_memories.context_key IS '上下文的唯一标识。global时为contact.wxid, group时为conversation.external_id';
COMMENT ON COLUMN contact_memories.summary IS 'AI分析生成的关于该用户在该上下文中的对话摘要';
COMMENT ON COLUMN contact_memories.updated_at IS '摘要的生成或更新时间';

-- ====================================================================
-- 脚本执行完成
-- ==================================================================== 