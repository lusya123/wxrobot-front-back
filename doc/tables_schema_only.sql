-- ====================================================================
-- 用户管理模块表结构定义 - PostgreSQL版本
-- 创建时间: 2024年
-- 描述: 仅包含核心表结构定义，不含视图、函数、初始数据
-- ====================================================================

-- 设置客户端编码
SET client_encoding = 'UTF8';

-- ====================================================================
-- 枚举类型定义
-- ====================================================================

-- 用户角色枚举
DROP TYPE IF EXISTS user_role_enum CASCADE;
CREATE TYPE user_role_enum AS ENUM ('super_admin', 'admin', 'user');

-- 操作类型枚举
DROP TYPE IF EXISTS operation_type_enum CASCADE;
CREATE TYPE operation_type_enum AS ENUM (
    'login', 'logout', 'create_user', 'update_user', 'delete_user', 
    'reset_password', 'change_password', 'activate_user', 'deactivate_user',
    'create_admin', 'update_admin', 'delete_admin', 'update_profile'
);

-- 操作结果枚举
DROP TYPE IF EXISTS operation_result_enum CASCADE;
CREATE TYPE operation_result_enum AS ENUM ('success', 'failure');

-- ====================================================================
-- 表结构定义
-- ====================================================================

-- 1. 用户主表
DROP TABLE IF EXISTS users CASCADE;
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    hashed_password VARCHAR(255) NOT NULL,
    role user_role_enum NOT NULL DEFAULT 'user',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
    full_name VARCHAR(100),
    phone VARCHAR(20),
    avatar_url VARCHAR(500),
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. 用户会话表
DROP TABLE IF EXISTS user_sessions CASCADE;
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    device_info TEXT,
    ip_address INET,
    is_active BOOLEAN NOT NULL DEFAULT true,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. 用户操作日志表
DROP TABLE IF EXISTS user_operation_logs CASCADE;
CREATE TABLE user_operation_logs (
    id BIGSERIAL PRIMARY KEY,
    operator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    operation_type operation_type_enum NOT NULL,
    operation_details JSONB,
    ip_address INET,
    user_agent TEXT,
    result operation_result_enum NOT NULL,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ====================================================================
-- 索引定义
-- ====================================================================

-- users表索引
CREATE INDEX idx_users_username ON users (username);
CREATE INDEX idx_users_email ON users (email);
CREATE INDEX idx_users_role ON users (role);
CREATE INDEX idx_users_created_by ON users (created_by_id);
CREATE INDEX idx_users_is_active ON users (is_active);
CREATE INDEX idx_users_created_at ON users (created_at);
CREATE INDEX idx_users_phone ON users (phone);
CREATE INDEX idx_users_role_active_created ON users (role, is_active, created_at);

-- user_sessions表索引
CREATE INDEX idx_user_sessions_user_id ON user_sessions (user_id);
CREATE INDEX idx_user_sessions_token_hash ON user_sessions (token_hash);
CREATE INDEX idx_user_sessions_expires_at ON user_sessions (expires_at);
CREATE INDEX idx_user_sessions_is_active ON user_sessions (is_active);
CREATE INDEX idx_user_sessions_user_active_expires ON user_sessions (user_id, is_active, expires_at);

-- user_operation_logs表索引
CREATE INDEX idx_user_operation_logs_operator_id ON user_operation_logs (operator_id);
CREATE INDEX idx_user_operation_logs_target_user_id ON user_operation_logs (target_user_id);
CREATE INDEX idx_user_operation_logs_operation_type ON user_operation_logs (operation_type);
CREATE INDEX idx_user_operation_logs_created_at ON user_operation_logs (created_at);
CREATE INDEX idx_user_operation_logs_result ON user_operation_logs (result);
CREATE INDEX idx_user_operation_logs_operator_type_created ON user_operation_logs (operator_id, operation_type, created_at);

-- ====================================================================
-- 触发器函数定义（用于自动更新updated_at字段）
-- ====================================================================

-- 创建更新时间触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

-- 为users表创建更新时间触发器
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 为user_sessions表创建更新时间触发器
CREATE TRIGGER update_user_sessions_updated_at 
    BEFORE UPDATE ON user_sessions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ====================================================================
-- 表和字段注释
-- ====================================================================

-- users表注释
COMMENT ON TABLE users IS '用户主表';
COMMENT ON COLUMN users.id IS '用户唯一标识，使用UUID';
COMMENT ON COLUMN users.username IS '用户名，全局唯一';
COMMENT ON COLUMN users.email IS '邮箱地址，全局唯一';
COMMENT ON COLUMN users.hashed_password IS '加密后的密码，推荐使用bcrypt';
COMMENT ON COLUMN users.role IS '用户角色：超级管理员/普通管理员/普通用户';
COMMENT ON COLUMN users.is_active IS '账户是否激活：true-激活，false-禁用';
COMMENT ON COLUMN users.created_by_id IS '创建者ID，关联users.id，用于追踪用户创建者';
COMMENT ON COLUMN users.full_name IS '真实姓名';
COMMENT ON COLUMN users.phone IS '手机号码';
COMMENT ON COLUMN users.avatar_url IS '头像URL';
COMMENT ON COLUMN users.last_login_at IS '最后登录时间';
COMMENT ON COLUMN users.created_at IS '创建时间';
COMMENT ON COLUMN users.updated_at IS '更新时间';

-- user_sessions表注释
COMMENT ON TABLE user_sessions IS '用户会话表';
COMMENT ON COLUMN user_sessions.id IS '会话唯一标识';
COMMENT ON COLUMN user_sessions.user_id IS '用户ID，关联users.id';
COMMENT ON COLUMN user_sessions.token_hash IS 'JWT Token的哈希值';
COMMENT ON COLUMN user_sessions.device_info IS '设备信息（User-Agent等）';
COMMENT ON COLUMN user_sessions.ip_address IS 'IP地址（支持IPv6）';
COMMENT ON COLUMN user_sessions.is_active IS '会话是否有效：true-有效，false-已失效';
COMMENT ON COLUMN user_sessions.expires_at IS 'Token过期时间';
COMMENT ON COLUMN user_sessions.created_at IS '创建时间';
COMMENT ON COLUMN user_sessions.updated_at IS '更新时间';

-- user_operation_logs表注释
COMMENT ON TABLE user_operation_logs IS '用户操作日志表';
COMMENT ON COLUMN user_operation_logs.id IS '日志ID';
COMMENT ON COLUMN user_operation_logs.operator_id IS '操作者用户ID';
COMMENT ON COLUMN user_operation_logs.target_user_id IS '被操作的用户ID（如果适用）';
COMMENT ON COLUMN user_operation_logs.operation_type IS '操作类型';
COMMENT ON COLUMN user_operation_logs.operation_details IS '操作详情（JSONB格式）';
COMMENT ON COLUMN user_operation_logs.ip_address IS '操作者IP地址';
COMMENT ON COLUMN user_operation_logs.user_agent IS '用户代理信息';
COMMENT ON COLUMN user_operation_logs.result IS '操作结果';
COMMENT ON COLUMN user_operation_logs.error_message IS '错误信息（如果操作失败）';
COMMENT ON COLUMN user_operation_logs.created_at IS '操作时间';

-- ====================================================================
-- 脚本执行完成
-- ====================================================================
-- 说明：
-- 1. 本文件仅包含表结构定义，不包含视图、存储函数和初始数据
-- 2. 包含3张核心表：users、user_sessions、user_operation_logs
-- 3. 使用PostgreSQL特有数据类型：UUID、INET、JSONB、ENUM
-- 4. 包含完整的索引定义
-- 5. 包含自动更新时间戳的触发器
-- 6. 包含详细的表和字段注释
-- ==================================================================== 