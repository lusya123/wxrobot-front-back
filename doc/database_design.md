# 用户管理模块数据库设计文档

## 1. 概述

本文档基于用户管理模块需求，设计了完整的数据库表结构。系统支持三种用户角色：超级管理员(super_admin)、普通管理员(admin)和普通用户(user)，实现分层管理和权限控制。

## 2. 数据库表设计

### 2.1. users 表（用户主表）

用户主表存储所有用户（包括超级管理员、普通管理员和普通用户）的基本信息。

```sql
CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY COMMENT '用户唯一标识，使用UUID',
    username VARCHAR(50) NOT NULL UNIQUE COMMENT '用户名，全局唯一',
    email VARCHAR(100) NOT NULL UNIQUE COMMENT '邮箱地址，全局唯一',
    hashed_password VARCHAR(255) NOT NULL COMMENT '加密后的密码，推荐使用bcrypt',
    role ENUM('super_admin', 'admin', 'user') NOT NULL DEFAULT 'user' COMMENT '用户角色：超级管理员/普通管理员/普通用户',
    is_active TINYINT(1) NOT NULL DEFAULT 1 COMMENT '账户是否激活：1-激活，0-禁用',
    created_by_id VARCHAR(36) NULL COMMENT '创建者ID，关联users.id，用于追踪用户创建者',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    last_login_at TIMESTAMP NULL COMMENT '最后登录时间',
    
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_created_by (created_by_id),
    INDEX idx_is_active (is_active),
    INDEX idx_created_at (created_at),
    
    FOREIGN KEY (created_by_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户主表';
```

#### 字段说明：

- **id**: 主键，使用UUID确保全局唯一性
- **username**: 用户名，用于登录，全局唯一
- **email**: 邮箱地址，可用于登录或找回密码，全局唯一
- **hashed_password**: 密码哈希值，推荐使用bcrypt等安全算法
- **role**: 用户角色枚举，支持三种角色
- **is_active**: 账户状态，支持禁用/启用功能
- **created_by_id**: 创建者ID，用于权限控制（普通管理员只能管理自己创建的用户）
- **last_login_at**: 最后登录时间，用于统计和安全监控

### 2.2. user_sessions 表（用户会话表）

存储用户登录会话信息，支持JWT Token管理和黑名单机制。

```sql
CREATE TABLE user_sessions (
    id VARCHAR(36) PRIMARY KEY COMMENT '会话唯一标识',
    user_id VARCHAR(36) NOT NULL COMMENT '用户ID，关联users.id',
    token_hash VARCHAR(255) NOT NULL COMMENT 'JWT Token的哈希值',
    device_info TEXT NULL COMMENT '设备信息（User-Agent等）',
    ip_address VARCHAR(45) NULL COMMENT 'IP地址（支持IPv6）',
    is_active TINYINT(1) NOT NULL DEFAULT 1 COMMENT '会话是否有效：1-有效，0-已失效',
    expires_at TIMESTAMP NOT NULL COMMENT 'Token过期时间',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    
    INDEX idx_user_id (user_id),
    INDEX idx_token_hash (token_hash),
    INDEX idx_expires_at (expires_at),
    INDEX idx_is_active (is_active),
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户会话表';
```

#### 字段说明：

- **token_hash**: 存储JWT Token的哈希值，用于Token黑名单管理
- **device_info**: 设备信息，便于安全监控
- **ip_address**: 登录IP地址，支持IPv4和IPv6
- **expires_at**: Token过期时间，用于清理过期会话

### 2.3. user_profiles 表（用户扩展信息表）

存储用户的扩展信息和个人设置。

```sql
CREATE TABLE user_profiles (
    id VARCHAR(36) PRIMARY KEY COMMENT '主键',
    user_id VARCHAR(36) NOT NULL UNIQUE COMMENT '用户ID，关联users.id',
    full_name VARCHAR(100) NULL COMMENT '真实姓名',
    phone VARCHAR(20) NULL COMMENT '手机号码',
    avatar_url VARCHAR(500) NULL COMMENT '头像URL',
    timezone VARCHAR(50) DEFAULT 'Asia/Shanghai' COMMENT '时区设置',
    language VARCHAR(10) DEFAULT 'zh-CN' COMMENT '语言偏好',
    preferences JSON NULL COMMENT '用户偏好设置（JSON格式）',
    last_profile_update TIMESTAMP NULL COMMENT '最后更新个人资料时间',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    
    INDEX idx_user_id (user_id),
    INDEX idx_phone (phone),
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户扩展信息表';
```

### 2.4. password_reset_tokens 表（密码重置令牌表）

管理密码重置请求的临时令牌。

```sql
CREATE TABLE password_reset_tokens (
    id VARCHAR(36) PRIMARY KEY COMMENT '主键',
    user_id VARCHAR(36) NOT NULL COMMENT '用户ID，关联users.id',
    token VARCHAR(255) NOT NULL UNIQUE COMMENT '重置令牌',
    expires_at TIMESTAMP NOT NULL COMMENT '令牌过期时间',
    is_used TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否已使用：1-已使用，0-未使用',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    used_at TIMESTAMP NULL COMMENT '使用时间',
    
    INDEX idx_user_id (user_id),
    INDEX idx_token (token),
    INDEX idx_expires_at (expires_at),
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='密码重置令牌表';
```

### 2.5. user_operation_logs 表（用户操作日志表）

记录用户的重要操作，用于审计和安全监控。

```sql
CREATE TABLE user_operation_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '日志ID',
    operator_id VARCHAR(36) NOT NULL COMMENT '操作者用户ID',
    target_user_id VARCHAR(36) NULL COMMENT '被操作的用户ID（如果适用）',
    operation_type ENUM(
        'login', 'logout', 'create_user', 'update_user', 'delete_user', 
        'reset_password', 'change_password', 'activate_user', 'deactivate_user',
        'create_admin', 'update_admin', 'delete_admin'
    ) NOT NULL COMMENT '操作类型',
    operation_details JSON NULL COMMENT '操作详情（JSON格式）',
    ip_address VARCHAR(45) NULL COMMENT '操作者IP地址',
    user_agent TEXT NULL COMMENT '用户代理信息',
    result ENUM('success', 'failure') NOT NULL COMMENT '操作结果',
    error_message TEXT NULL COMMENT '错误信息（如果操作失败）',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '操作时间',
    
    INDEX idx_operator_id (operator_id),
    INDEX idx_target_user_id (target_user_id),
    INDEX idx_operation_type (operation_type),
    INDEX idx_created_at (created_at),
    INDEX idx_result (result),
    
    FOREIGN KEY (operator_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (target_user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户操作日志表';
```

## 3. 初始数据插入

### 3.1. 创建默认超级管理员

```sql
-- 插入默认超级管理员（密码需要在应用层进行bcrypt加密）
INSERT INTO users (
    id, 
    username, 
    email, 
    hashed_password, 
    role, 
    is_active, 
    created_by_id,
    created_at
) VALUES (
    '00000000-0000-0000-0000-000000000001',
    'superadmin',
    'admin@example.com',
    '$2b$12$...',  -- 这里应该是加密后的密码
    'super_admin',
    1,
    NULL,
    NOW()
);

-- 为默认超级管理员创建扩展信息
INSERT INTO user_profiles (
    id,
    user_id,
    full_name,
    timezone,
    language,
    created_at
) VALUES (
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    '系统管理员',
    'Asia/Shanghai',
    'zh-CN',
    NOW()
);
```

## 4. 数据库约束和规则

### 4.1. 约束规则

1. **用户名和邮箱唯一性**: `username` 和 `email` 字段必须全局唯一
2. **角色层级**: 超级管理员 > 普通管理员 > 普通用户
3. **创建者关系**: 普通管理员只能管理自己创建的用户
4. **密码安全**: 所有密码必须经过bcrypt等安全算法加密
5. **软删除**: 建议使用软删除，保留 `is_active` 字段控制账户状态

### 4.2. 数据完整性

1. **外键约束**: 确保数据引用完整性
2. **级联删除**: 用户删除时，相关的会话、日志等数据级联处理
3. **索引优化**: 为常用查询字段建立索引，提高查询性能

## 5. 性能优化建议

### 5.1. 索引策略

- 为经常查询的字段（username、email、role等）建立索引
- 为外键字段建立索引，提高关联查询性能
- 考虑复合索引，如 `(role, is_active, created_at)`

### 5.2. 分区策略

对于大量数据的表（如操作日志表），可以考虑按时间分区：

```sql
-- 示例：按年分区操作日志表
ALTER TABLE user_operation_logs 
PARTITION BY RANGE (YEAR(created_at)) (
    PARTITION p2023 VALUES LESS THAN (2024),
    PARTITION p2024 VALUES LESS THAN (2025),
    PARTITION p2025 VALUES LESS THAN (2026),
    PARTITION p_future VALUES LESS THAN MAXVALUE
);
```

### 5.3. 清理策略

定期清理过期数据：

```sql
-- 清理过期的密码重置令牌（保留30天）
DELETE FROM password_reset_tokens 
WHERE expires_at < DATE_SUB(NOW(), INTERVAL 30 DAY);

-- 清理过期的用户会话（保留7天）
DELETE FROM user_sessions 
WHERE expires_at < DATE_SUB(NOW(), INTERVAL 7 DAY);

-- 清理旧的操作日志（保留1年）
DELETE FROM user_operation_logs 
WHERE created_at < DATE_SUB(NOW(), INTERVAL 1 YEAR);
```

## 6. 安全考虑

### 6.1. 密码策略

- 使用bcrypt等强加密算法
- 设置密码复杂度要求
- 实现密码历史记录，防止重复使用

### 6.2. 会话管理

- JWT Token设置合理的过期时间
- 实现Token黑名单机制
- 记录异常登录行为

### 6.3. 操作审计

- 记录所有重要操作
- 定期分析操作日志
- 实现异常行为告警

## 7. 扩展性考虑

该数据库设计具有良好的扩展性：

1. **角色扩展**: 可以轻松添加新的用户角色
2. **权限细化**: 可以添加权限表实现更细粒度的权限控制
3. **多租户**: 可以添加组织/租户表支持多租户架构
4. **API限流**: 可以添加API调用记录表实现限流功能

## 8. 备份和恢复

### 8.1. 备份策略

- 定期全量备份数据库
- 实现增量备份策略
- 测试备份文件的完整性

### 8.2. 恢复计划

- 制定详细的数据恢复流程
- 定期进行恢复演练
- 确保RTO和RPO目标 