-- ====================================================================
-- 用户管理模块数据库建表脚本 (简化版) - PostgreSQL版本
-- 创建时间: 2024年
-- 描述: 用户管理模块核心表结构，包含users、user_sessions、user_operation_logs
-- ====================================================================

-- 设置客户端编码
SET client_encoding = 'UTF8';

-- 创建枚举类型
DROP TYPE IF EXISTS user_role_enum CASCADE;
CREATE TYPE user_role_enum AS ENUM ('super_admin', 'admin', 'user');

DROP TYPE IF EXISTS operation_type_enum CASCADE;
CREATE TYPE operation_type_enum AS ENUM (
    'login', 'logout', 'create_user', 'update_user', 'delete_user', 
    'reset_password', 'change_password', 'activate_user', 'deactivate_user',
    'create_admin', 'update_admin', 'delete_admin', 'update_profile'
);

DROP TYPE IF EXISTS operation_result_enum CASCADE;
CREATE TYPE operation_result_enum AS ENUM ('success', 'failure');

-- ====================================================================
-- 1. 用户主表 (users) - 核心用户信息
-- ====================================================================
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

-- 创建用户表索引
CREATE INDEX idx_users_username ON users (username);
CREATE INDEX idx_users_email ON users (email);
CREATE INDEX idx_users_role ON users (role);
CREATE INDEX idx_users_created_by ON users (created_by_id);
CREATE INDEX idx_users_is_active ON users (is_active);
CREATE INDEX idx_users_created_at ON users (created_at);
CREATE INDEX idx_users_phone ON users (phone);
CREATE INDEX idx_users_role_active_created ON users (role, is_active, created_at);

-- 创建更新时间触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为users表创建更新时间触发器
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 用户表注释
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

-- ====================================================================
-- 2. 用户会话表 (user_sessions) - JWT Token管理和会话控制
-- ====================================================================
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

-- 创建会话表索引
CREATE INDEX idx_user_sessions_user_id ON user_sessions (user_id);
CREATE INDEX idx_user_sessions_token_hash ON user_sessions (token_hash);
CREATE INDEX idx_user_sessions_expires_at ON user_sessions (expires_at);
CREATE INDEX idx_user_sessions_is_active ON user_sessions (is_active);
CREATE INDEX idx_user_sessions_user_active_expires ON user_sessions (user_id, is_active, expires_at);

-- 为user_sessions表创建更新时间触发器
CREATE TRIGGER update_user_sessions_updated_at 
    BEFORE UPDATE ON user_sessions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 会话表注释
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

-- ====================================================================
-- 3. 用户操作日志表 (user_operation_logs) - 审计和安全监控
-- ====================================================================
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

-- 创建操作日志表索引
CREATE INDEX idx_user_operation_logs_operator_id ON user_operation_logs (operator_id);
CREATE INDEX idx_user_operation_logs_target_user_id ON user_operation_logs (target_user_id);
CREATE INDEX idx_user_operation_logs_operation_type ON user_operation_logs (operation_type);
CREATE INDEX idx_user_operation_logs_created_at ON user_operation_logs (created_at);
CREATE INDEX idx_user_operation_logs_result ON user_operation_logs (result);
CREATE INDEX idx_user_operation_logs_operator_type_created ON user_operation_logs (operator_id, operation_type, created_at);

-- 操作日志表注释
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
-- 4. 初始数据插入
-- ====================================================================

-- 插入默认超级管理员
-- 注意：密码 'admin123' 的bcrypt加密值
-- 实际部署时请修改用户名、邮箱和密码
INSERT INTO users (
    id, 
    username, 
    email, 
    hashed_password, 
    role, 
    is_active, 
    created_by_id,
    full_name,
    created_at
) VALUES (
    '00000000-0000-0000-0000-000000000001'::UUID,
    'superadmin',
    'admin@example.com',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/lewf92XRDCC4kke22', -- 示例哈希值
    'super_admin',
    true,
    NULL,
    '系统管理员',
    CURRENT_TIMESTAMP
);

-- 记录管理员创建操作日志
INSERT INTO user_operation_logs (
    operator_id,
    target_user_id,
    operation_type,
    operation_details,
    ip_address,
    result,
    created_at
) VALUES (
    '00000000-0000-0000-0000-000000000001'::UUID,
    '00000000-0000-0000-0000-000000000001'::UUID,
    'create_user',
    '{"action": "system_init", "note": "系统初始化创建默认超级管理员"}'::JSONB,
    '127.0.0.1'::INET,
    'success',
    CURRENT_TIMESTAMP
);

-- ====================================================================
-- 5. 实用视图创建
-- ====================================================================

-- 创建用户信息视图，方便查询用户基本信息
DROP VIEW IF EXISTS view_user_info;
CREATE VIEW view_user_info AS
SELECT 
    u.id,
    u.username,
    u.email,
    u.role,
    u.is_active,
    u.full_name,
    u.phone,
    u.avatar_url,
    u.last_login_at,
    u.created_at,
    u.updated_at,
    creator.username AS created_by_username,
    creator.full_name AS created_by_name
FROM users u
LEFT JOIN users creator ON u.created_by_id = creator.id;

-- 创建活跃会话视图
DROP VIEW IF EXISTS view_active_sessions;
CREATE VIEW view_active_sessions AS
SELECT 
    s.id,
    s.user_id,
    u.username,
    u.email,
    u.role,
    u.full_name,
    s.ip_address,
    s.device_info,
    s.created_at,
    s.expires_at,
    EXTRACT(EPOCH FROM (s.expires_at - CURRENT_TIMESTAMP))/60 AS minutes_to_expire
FROM user_sessions s
INNER JOIN users u ON s.user_id = u.id
WHERE s.is_active = true AND s.expires_at > CURRENT_TIMESTAMP
ORDER BY s.created_at DESC;

-- 创建操作日志视图
DROP VIEW IF EXISTS view_operation_logs;
CREATE VIEW view_operation_logs AS
SELECT 
    l.id,
    l.operation_type,
    l.result,
    operator.username AS operator_username,
    operator.full_name AS operator_name,
    target.username AS target_username,
    target.full_name AS target_name,
    l.operation_details,
    l.ip_address,
    l.error_message,
    l.created_at
FROM user_operation_logs l
LEFT JOIN users operator ON l.operator_id = operator.id
LEFT JOIN users target ON l.target_user_id = target.id
ORDER BY l.created_at DESC;

-- ====================================================================
-- 6. 存储函数/过程
-- ====================================================================

-- 用户统计函数
CREATE OR REPLACE FUNCTION get_user_statistics()
RETURNS TABLE (
    total_users BIGINT,
    super_admins BIGINT,
    admins BIGINT,
    users BIGINT,
    active_users BIGINT,
    inactive_users BIGINT,
    today_created BIGINT,
    today_login BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN role = 'super_admin' THEN 1 END) as super_admins,
        COUNT(CASE WHEN role = 'admin' THEN 1 END) as admins,
        COUNT(CASE WHEN role = 'user' THEN 1 END) as users,
        COUNT(CASE WHEN is_active = true THEN 1 END) as active_users,
        COUNT(CASE WHEN is_active = false THEN 1 END) as inactive_users,
        COUNT(CASE WHEN DATE(created_at) = CURRENT_DATE THEN 1 END) as today_created,
        COUNT(CASE WHEN DATE(last_login_at) = CURRENT_DATE THEN 1 END) as today_login
    FROM users;
END;
$$ LANGUAGE plpgsql;

-- 清理过期会话函数
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS TABLE (
    cleaned_sessions INTEGER,
    cleanup_time TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
    deleted_count INTEGER := 0;
BEGIN
    -- 删除过期的会话
    DELETE FROM user_sessions WHERE expires_at < CURRENT_TIMESTAMP;
    
    -- 获取删除的记录数
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- 返回清理结果
    RETURN QUERY
    SELECT 
        deleted_count as cleaned_sessions,
        CURRENT_TIMESTAMP as cleanup_time;
END;
$$ LANGUAGE plpgsql;

-- ====================================================================
-- 7. 定期清理任务 SQL（注释形式，可根据需要启用）
-- ====================================================================

-- 清理过期的用户会话（保留7天）
-- DELETE FROM user_sessions WHERE expires_at < CURRENT_TIMESTAMP - INTERVAL '7 days';

-- 清理旧的操作日志（保留1年）
-- DELETE FROM user_operation_logs WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '1 year';

-- 使用函数清理过期会话
-- SELECT * FROM cleanup_expired_sessions();

-- ====================================================================
-- 8. 有用的查询示例
-- ====================================================================

-- 查询用户登录统计
/*
SELECT 
    DATE(last_login_at) as login_date,
    COUNT(*) as login_count
FROM users 
WHERE last_login_at IS NOT NULL 
    AND last_login_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(last_login_at)
ORDER BY login_date DESC;
*/

-- 查询今日活跃用户
/*
SELECT COUNT(DISTINCT user_id) as today_active_users
FROM user_sessions 
WHERE DATE(created_at) = CURRENT_DATE 
    AND is_active = true;
*/

-- 查询异常登录行为（多IP登录）
/*
SELECT 
    u.username,
    u.email,
    COUNT(DISTINCT s.ip_address) as ip_count,
    STRING_AGG(DISTINCT s.ip_address::TEXT, ', ') as ip_addresses
FROM users u
INNER JOIN user_sessions s ON u.id = s.user_id
WHERE s.is_active = true 
    AND s.created_at >= CURRENT_DATE - INTERVAL '1 day'
GROUP BY u.id, u.username, u.email
HAVING COUNT(DISTINCT s.ip_address) > 1
ORDER BY ip_count DESC;
*/

-- ====================================================================
-- 脚本执行完成
-- ====================================================================
-- 说明：
-- 1. PostgreSQL版本包含3张核心表：users、user_sessions、user_operation_logs
-- 2. 使用了PostgreSQL特有的数据类型：UUID、INET、JSONB、ENUM等
-- 3. 创建了自动更新时间的触发器函数
-- 4. 使用了PostgreSQL函数语法替代存储过程
-- 5. 保留了完整的会话管理和操作审计功能
-- 6. 包含了实用的视图和函数
-- 7. 提供了常用查询示例
-- 8. 默认创建超级管理员：superadmin / admin@example.com
-- 9. 生产环境请修改默认管理员信息和密码
-- ==================================================================== 