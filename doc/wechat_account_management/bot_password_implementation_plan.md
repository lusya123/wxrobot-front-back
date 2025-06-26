# 微信机器人密码管理功能实现计划

本文档旨在为微信机器人添加手动设置和修改密码的功能，这将涉及后端、前端的修改。

## 1. 后端 (Backend) 修改

### 1.1. 数据库模型变更

- **目标:** 在 `wechat_bots` 表中添加一个字段来存储机器人的密码哈希。
- **操作:**
    1.  在 `backend/app/models/wechat_bot.py` 的 `WechatBot` SQLAlchemy 模型中，添加 `hashed_password: Mapped[str]` 字段。
    2.  创建 Alembic 数据库迁移脚本来应用此变更。
        ```bash
        # 在 backend 目录下运行
        alembic revision --autogenerate -m "Add password to wechat_bots"
        ```
    3.  检查并调整生成的迁移脚本，然后应用迁移：
        ```bash
        alembic upgrade head
        ```

### 1.2. Pydantic Schema 定义

- **目标:** 更新 API 数据模型以包含密码字段。
- **操作:** 在 `backend/app/schemas/wechat_bot.py` 中：
    1.  在 `WechatBotCreate` schema 中添加 `password: str` 字段。
    2.  在 `WechatBotUpdate` schema 中添加 `password: Optional[str] = None` 字段，使其成为可选项。
    3.  确保 `WechatBot` (或 `WechatBotRead`) schema **不包含** `password` 或 `hashed_password` 字段，避免密码信息在常规 API 响应中泄露。

### 1.3. CRUD 逻辑更新

- **目标:** 在创建和更新机器人时处理密码哈希。
- **操作:** 在 `backend/app/crud/crud_wechat_bot.py` 中：
    1.  **创建 (`create`):** 修改 `create` 方法。在将数据存入数据库之前，从 `WechatBotCreate` schema 中获取明文密码，使用 `bcrypt` 或 `passlib` 等库进行哈希处理，然后将哈希值存入 `hashed_password` 字段。
    2.  **更新 (`update`):** 修改 `update` 方法。检查 `WechatBotUpdate` schema 中是否提供了新的 `password`。如果提供了，则同样进行哈希处理并更新数据库中的 `hashed_password` 字段。

### 1.4. API 端点详细设计

- **目标:** 提供机器人登录和修改密码的具体接口规范。
- **通用返回格式:** 所有 API 遵循统一的 JSON 返回结构：
  ```json
  {
    "error": 0,      // 0: 成功, 401: 未授权, 500: 系统异常, 其他: 业务异常
    "body": {},      // 成功时的数据体
    "message": ""    // 异常时的提示信息
  }
  ```

#### 1.4.1. 创建机器人

- **端点:** `POST /api/v1/wechat-bots/`
- **说明:** 用户在前端创建一个新的机器人，需要提供密码。
- **认证:** 需要用户登录 (`Authorization: Bearer <user_token>`)。
- **请求体:**
  ```json
  {
    "name": "销售机器人A",
    "description": "处理售前咨询",
    "password": "a_very_secure_password_123"
  }
  ```
- **成功响应 (`error: 0`):**
  ```json
  {
    "error": 0,
    "body": {
        "id": "bot_uuid_...",
        "name": "销售机器人A",
        "description": "处理售前咨询",
        "owner_user_id": "user_uuid_..."
    },
    "message": "创建成功"
  }
  ```

#### 1.4.2. 修改机器人密码

- **端点:** `PUT /api/v1/wechat-bots/{id}`
- **说明:** 用户在前端修改指定机器人的密码。
- **认证:** 需要用户登录 (`Authorization: Bearer <user_token>`)。
- **请求体 (仅包含需要修改的字段):**
  ```json
  {
    "password": "a_new_secure_password_456"
  }
  ```
- **成功响应 (`error: 0`):**
  ```json
  {
    "error": 0,
    "body": {
        "id": "bot_uuid_...",
        "name": "销售机器人A"
    },
    "message": "密码修改成功"
  }
  ```

#### 1.4.3. 机器人登录

- **端点:** `POST /api/v1/bot-auth/login`
- **说明:** 机器人客户端使用其唯一标识和密码进行登录，以获取访问令牌。
- **认证:** 无需认证。
- **请求体:**
  ```json
  {
    "username": "bot_uuid_...", // 或其他唯一ID
    "password": "a_very_secure_password_123"
  }
  ```
- **成功响应 (`error: 0`):**
  ```json
  {
    "error": 0,
    "body": {
        "access_token": "jwt_access_token_string",
        "refresh_token": "jwt_refresh_token_string",
        "token_type": "bearer"
    },
    "message": "登录成功"
  }
  ```
- **失败响应 (`error: 401`):**
  ```json
  {
    "error": 401,
    "body": {},
    "message": "机器人账号或密码错误"
  }
  ```

#### 1.4.4. 刷新机器人令牌 (可选但建议)

- **端点:** `POST /api/v1/bot-auth/refresh`
- **说明:** 使用长效的 `refresh_token` 来获取一个新的短效 `access_token`，避免让用户频繁重输密码。
- **认证:** 无需认证。
- **请求体:**
  ```json
  {
    "refresh_token": "jwt_refresh_token_string"
  }
  ```
- **成功响应 (`error: 0`):**
  ```json
  {
    "error": 0,
    "body": {
        "access_token": "new_jwt_access_token_string",
        "token_type": "bearer"
    },
    "message": "令牌刷新成功"
  }
  ```
- **失败响应 (`error: 401`):**
  ```json
  {
    "error": 401,
    "body": {},
    "message": "Refresh token 无效或已过期，请重新登录"
  }
  ```

### 1.5. 机器人 API 认证

- **目标:** 定义机器人客户端如何使用获取到的 Token 访问受保护的资源。
- **操作:**
    1.  对于所有需要机器人登录后才能调用的接口（如消息收发 `message/push`, `message/poll`），必须在请求头中携带 `access_token`。
    2.  **请求头格式:** `Authorization: Bearer <access_token>`。
    3.  后端需要添加一个依赖项 (Dependency)，用于验证此 Token 的有效性，并从中解析出 `bot_id`，确保机器人只能访问自己的数据。

## 2. 前端 (wechat-sales-assistant) 修改

### 2.1. 创建机器人表单

- **位置:** `wechat-sales-assistant/app/components/bots/CreateBotForm.tsx` (假设)
- **修改:**
    1.  在创建机器人的表单中，增加一个「密码」输入框 (`<Input type="password" />`)。
    2.  增加一个「确认密码」输入框以提高用户体验。
    3.  在提交表单时，将机器人名称、描述和密码一同发送到后端的 `POST /api/v1/wechat-bots/` 接口。

### 2.2. 修改机器人密码功能

- **位置:** 机器人列表或机器人详情页面。
- **修改:**
    1.  在每个机器人的管理选项中，添加一个「修改密码」按钮。
    2.  点击按钮后，弹出一个 Modal（模态框）。
    3.  Modal 中包含「新密码」和「确认新密码」两个输入框。
    4.  用户填写并确认后，调用后端的 `PUT /api/v1/wechat-bots/{id}` 接口，在请求体中仅包含 `password` 字段。

