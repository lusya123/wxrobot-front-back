-- SQL Schema for Wechat Account Management Module (v2) - PostgreSQL Version
-- Based on design doc: wechat_account_management.md
-- Adapted for compatibility with the existing PostgreSQL user management schema.

-- =================================================================
-- 设置客户端编码
-- =================================================================
SET client_encoding = 'UTF8';

-- =================================================================
-- 枚举类型定义
-- =================================================================

-- 机器人状态枚举
DROP TYPE IF EXISTS bot_status_enum CASCADE;
CREATE TYPE bot_status_enum AS ENUM ('logged_out', 'scanning', 'logged_in', 'error');

-- 私聊监控模式枚举
DROP TYPE IF EXISTS bot_listen_mode_private_enum CASCADE;
CREATE TYPE bot_listen_mode_private_enum AS ENUM ('all', 'none');

-- 群聊监控模式枚举
DROP TYPE IF EXISTS bot_listen_mode_group_enum CASCADE;
CREATE TYPE bot_listen_mode_group_enum AS ENUM ('none', 'all', 'specified');

-- AI学习范围枚举
DROP TYPE IF EXISTS bot_learning_scope_enum CASCADE;
CREATE TYPE bot_learning_scope_enum AS ENUM ('all', 'marked');

-- AI学习模式枚举
DROP TYPE IF EXISTS bot_learning_mode_enum CASCADE;
CREATE TYPE bot_learning_mode_enum AS ENUM ('auto', 'manual_approval');

-- 未知问题处理方式枚举
DROP TYPE IF EXISTS bot_unhandled_question_action_enum CASCADE;
CREATE TYPE bot_unhandled_question_action_enum AS ENUM ('reply_text', 'escalate');

-- 监控聊天类型枚举
DROP TYPE IF EXISTS bot_chat_type_enum CASCADE;
CREATE TYPE bot_chat_type_enum AS ENUM ('group', 'private');


-- =================================================================
-- Placeholder/Dependency Tables (PostgreSQL Syntax)
-- NOTE: The 'users' table is assumed to exist from 'user_management/tables_schema_only.sql'.
-- =================================================================

-- AI模型表 (PostgreSQL 兼容版本)
DROP TABLE IF EXISTS ai_models CASCADE;
CREATE TABLE ai_models (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    provider VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 知识库表 (PostgreSQL 兼容版本)
DROP TABLE IF EXISTS knowledge_bases CASCADE;
CREATE TABLE knowledge_bases (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);


-- =================================================================
-- 微信账号管理核心表
-- =================================================================

-- 1. 微信机器人实例表
DROP TABLE IF EXISTS wechat_bots CASCADE;
CREATE TABLE wechat_bots (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    wxid VARCHAR(255) NULL UNIQUE,
    avatar VARCHAR(1024) NULL,
    status bot_status_enum NOT NULL DEFAULT 'logged_out',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. 机器人配置表
DROP TABLE IF EXISTS bot_configs CASCADE;
CREATE TABLE bot_configs (
    id BIGSERIAL PRIMARY KEY,
    bot_id BIGINT NOT NULL UNIQUE REFERENCES wechat_bots(id) ON DELETE CASCADE,

    -- Tab 1: 身份与角色
    role_description TEXT NULL,
    tone_style VARCHAR(50) NOT NULL DEFAULT 'professional',
    system_prompt TEXT NULL,

    -- Tab 2: 行为与触发
    is_active_on_work_time BOOLEAN NOT NULL DEFAULT FALSE,
    work_time_start TIME NULL,
    work_time_end TIME NULL,
    offline_reply_message TEXT NULL,
    auto_accept_friend_request BOOLEAN NOT NULL DEFAULT FALSE,
    friend_request_keyword_filter VARCHAR(255) NULL,
    friend_request_welcome_message TEXT NULL,
    listen_mode_private_chat bot_listen_mode_private_enum NOT NULL DEFAULT 'all',
    listen_mode_group_chat bot_listen_mode_group_enum NOT NULL DEFAULT 'none',
    reply_trigger_on_mention BOOLEAN NOT NULL DEFAULT TRUE,
    reply_trigger_words TEXT NULL,
    welcome_new_group_member BOOLEAN NOT NULL DEFAULT FALSE,
    new_member_welcome_message TEXT NULL,
    
    -- Tab 3: 智能与知识
    main_ai_model_id BIGINT REFERENCES ai_models(id) ON DELETE SET NULL,
    main_ai_model_params JSONB NULL,
    enable_auto_learning BOOLEAN NOT NULL DEFAULT FALSE,
    learning_scope bot_learning_scope_enum NOT NULL DEFAULT 'marked',
    learning_mode bot_learning_mode_enum NOT NULL DEFAULT 'manual_approval',
    unhandled_question_action bot_unhandled_question_action_enum NOT NULL DEFAULT 'reply_text',
    unhandled_question_reply_text TEXT NULL,
    
    -- Tab 4: 协作与提醒
    escalation_failed_attempts_trigger INT NULL,
    escalation_trigger_intent_description TEXT NULL,
    alert_trigger_intent_description TEXT NULL,
    max_replies_per_minute INT NULL,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. 机器人监控聊天室列表 (多对多)
DROP TABLE IF EXISTS bot_monitored_chats CASCADE;
CREATE TABLE bot_monitored_chats (
    id BIGSERIAL PRIMARY KEY,
    bot_id BIGINT NOT NULL REFERENCES wechat_bots(id) ON DELETE CASCADE,
    chat_id VARCHAR(255) NOT NULL,
    chat_type bot_chat_type_enum NOT NULL DEFAULT 'group',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (bot_id, chat_id)
);

-- 4. 机器人知识库关联表 (多对多)
DROP TABLE IF EXISTS bot_knowledge_bases CASCADE;
CREATE TABLE bot_knowledge_bases (
    id BIGSERIAL PRIMARY KEY,
    bot_id BIGINT NOT NULL REFERENCES wechat_bots(id) ON DELETE CASCADE,
    kb_id BIGINT NOT NULL REFERENCES knowledge_bases(id) ON DELETE CASCADE,
    priority INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (bot_id, kb_id)
);

-- 5. 机器人提醒接收人表 (多对多)
DROP TABLE IF EXISTS bot_alert_recipients CASCADE;
CREATE TABLE bot_alert_recipients (
    id BIGSERIAL PRIMARY KEY,
    bot_id BIGINT NOT NULL REFERENCES wechat_bots(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (bot_id, user_id)
);

-- 6. 机器人人工接管人表 (多对多)
DROP TABLE IF EXISTS bot_escalation_recipients CASCADE;
CREATE TABLE bot_escalation_recipients (
    id BIGSERIAL PRIMARY KEY,
    bot_id BIGINT NOT NULL REFERENCES wechat_bots(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (bot_id, user_id)
);


-- ====================================================================
-- 索引定义
-- ====================================================================
CREATE INDEX idx_wechat_bots_owner_id ON wechat_bots (owner_id);
CREATE INDEX idx_bot_configs_bot_id ON bot_configs (bot_id);
CREATE INDEX idx_bot_monitored_chats_bot_id ON bot_monitored_chats (bot_id);
CREATE INDEX idx_bot_knowledge_bases_bot_id ON bot_knowledge_bases (bot_id);
CREATE INDEX idx_bot_knowledge_bases_kb_id ON bot_knowledge_bases (kb_id);
CREATE INDEX idx_bot_alert_recipients_bot_id ON bot_alert_recipients (bot_id);
CREATE INDEX idx_bot_alert_recipients_user_id ON bot_alert_recipients (user_id);
CREATE INDEX idx_bot_escalation_recipients_bot_id ON bot_escalation_recipients (bot_id);
CREATE INDEX idx_bot_escalation_recipients_user_id ON bot_escalation_recipients (user_id);


-- ====================================================================
-- 触发器函数定义 (用于自动更新updated_at字段)
-- ====================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

-- 为新表创建更新时间触发器
CREATE TRIGGER update_ai_models_updated_at BEFORE UPDATE ON ai_models FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_knowledge_bases_updated_at BEFORE UPDATE ON knowledge_bases FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_wechat_bots_updated_at BEFORE UPDATE ON wechat_bots FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bot_configs_updated_at BEFORE UPDATE ON bot_configs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ====================================================================
-- 表和字段注释
-- ====================================================================
-- wechat_bots
COMMENT ON TABLE wechat_bots IS '微信机器人实例表';
COMMENT ON COLUMN wechat_bots.owner_id IS '负责人ID，关联users.id';
COMMENT ON COLUMN wechat_bots.wxid IS '机器人实际微信号，登录后获取';
COMMENT ON COLUMN wechat_bots.status IS '机器人实时状态';

-- bot_configs
COMMENT ON TABLE bot_configs IS '机器人详细配置表';
COMMENT ON COLUMN bot_configs.bot_id IS '关联的机器人ID，一对一关系';
COMMENT ON COLUMN bot_configs.escalation_trigger_intent_description IS '触发人工接管的用户意图描述，用于大模型识别';
COMMENT ON COLUMN bot_configs.alert_trigger_intent_description IS '触发提醒的用户意图描述，用于大模型识别';

-- bot_monitored_chats
COMMENT ON TABLE bot_monitored_chats IS '机器人监控的群聊白名单';

-- bot_knowledge_bases
COMMENT ON TABLE bot_knowledge_bases IS '机器人与知识库的关联表';
COMMENT ON COLUMN bot_knowledge_bases.priority IS '知识库匹配优先级，0为最高';

-- bot_alert_recipients
COMMENT ON TABLE bot_alert_recipients IS '机器人关键信息提醒的接收人列表';
COMMENT ON COLUMN bot_alert_recipients.user_id IS '接收提醒的用户ID, 关联users.id';

-- bot_escalation_recipients
COMMENT ON TABLE bot_escalation_recipients IS '机器人触发人工接管后的接管人列表';
COMMENT ON COLUMN bot_escalation_recipients.user_id IS '接管人用户ID, 关联users.id';

-- ====================================================================
-- 脚本执行完成
-- ==================================================================== 