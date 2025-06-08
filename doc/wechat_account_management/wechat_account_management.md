# 微信账号管理模块设计文档 (v2)

## 1. 模块概述

微信账号管理是整个系统的核心功能之一。它允许管理员或运营人员添加、配置和监控多个微信机器人实例。本模块的目标是提供一个直观、强大的界面，来精细化控制每一个机器人的行为、智能、响应规则和协作方式，从而满足不同业务场景下的自动化需求。

本文档基于 V1 版本进行扩展，并采纳了更细致的配置分类。

## 2. 功能需求

### 2.1. 前端功能 (`wechat-sales-assistant/app/wechat-accounts/`)

-   **微信账号列表页 (`/`)**:
    -   以卡片或列表形式展示所有已添加的微信机器人账号。
    -   每个卡片显示机器人的头像、名称、角色描述、在线状态（登录、登出、扫码中、异常）。
    -   提供"添加新机器人"按钮。
    -   提供快速操作按钮：登录（弹出扫码登录二维码）、登出、编辑配置、删除。

-   **添加/编辑机器人页 (`/edit/[id]` 或 `/new`)**:
    -   这是一个多 Tab 的表单页面，用于配置机器人的所有规则。页面结构将严格按照以下四类进行划分。
    -   **Tab 1: 身份与角色 (Identity & Role)**
        -   **机器人名称/昵称**: 用于后台管理的内部名称。
        -   **角色描述/SOP**: 文本区域，详细描述机器人定位，如"售前技术咨询"。
        -   **风格与语气**:
            -   提供一个下拉框选择预设风格：`专业严谨`, `热情友好`, `可爱俏皮`, `简洁高效`。
            -   提供一个"自定义"选项，选中后出现一个文本区域，允许运营人员输入详细的 System Prompt 来精确控制 AI。
    -   **Tab 2: 行为与触发 (Behavior & Triggers)**
        -   **工作时间**:
            -   一个开关，用于启用/禁用工作时间限制。
            -   两个时间选择器，用于设置工作日的起止时间。
            -   一个文本输入框，用于配置非工作时间的自动回复内容。
           
        -   **自动通过好友请求**:
            -   一个开关，用于启用/禁用此功能。
            -   一个文本输入框，用于设置基于关键词过滤的规则（例如，请求信息包含"购买"）。留空则表示不过滤。
            -   一个文本区域，用于配置通过好友请求后的欢迎语。
        -   **监控范围**:
            -   **私聊监控**: 下拉选择 `回复所有私聊` 或 `不回复任何私聊`。 (注: 更复杂的标签/分组监控可在后续版本迭代)
            -   **群聊监控**: 下拉选择 `不监控任何群聊`, `监控所有群聊`, `仅监控指定的白名单群聊`。
            -   如果选择"白名单"，下方出现一个列表，允许通过搜索添加机器人已加入的群聊。
        -   **回复触发器**:
            -   **群聊回复**: 一个开关，`开启`状态表示仅在群聊中被`@`时才回复，`关闭`则响应（符合条件的）所有消息。
            -   **回复出发词** 配置触发回复的词语
            -   **新成员入群欢迎**: 一个开关，启用后出现文本区域，用于配置新成员入群的欢迎语。
    -   **Tab 3: 智能与知识 (Intelligence & Knowledge)**
        -   **主AI模型**: 下拉选择一个系统预设的 AI 大语言模型 (如 GPT-4, Kimi)。
        -   **知识库关联**: 一个可搜索、可多选的列表，用于关联一个或多个知识库。支持拖拽排序以决定优先级。
        -   **自主学习**:
            -   一个开关，用于启用/禁用。
            -   **学习范围**: 单选按钮，选择 `学习所有对话` 或 `仅学习被标记为"优质"的对话`。
            -   **学习方式**: 单选按钮，选择 `自动入库` 或 `需人工审核后入库`。
        -   **未知问题处理**:
            -   单选按钮，配置当 AI 和知识库都无法回答时的响应方式：`回复预设话术` 或 `触发人工接管流程`。
            -   如果选择"回复预设话术"，则出现一个文本区域让用户输入话术。
    -   **Tab 4: 协作与提醒 (Collaboration & Alerting)**
        -   **人工接管/转接**:
            -   一个可多选的下拉框，用于指定接管人（从系统用户中选择）。
            -   **触发条件设置**:
                -   **触发意图描述**: 文本区域，用于描述需要触发人工接管的用户意图（如 `用户表达强烈不满或投诉倾向`、`用户要求和真人沟通`）。
                -   数字输入框，配置连续 `N` 次未能回答用户问题后触发接管。
        -   **关键信息提醒**:
            -   一个可多选的下拉框，用于指定接收提醒的人员。
            -   **触发意图描述**: 文本区域，用于描述需要触发提醒的用户意图（如 `用户表现出强烈的购买意向`、`用户咨询关于合同的法律条款`）。

-   **扫码登录模态框**:
    -   调用后端接口获取登录二维码。
    -   实时显示二维码状态（等待扫描、已扫描待确认、已登录、已过期）。
    -   过期后可点击"刷新"按钮。

### 2.2. 后端功能 (`backend/`)

-   **机器人实例管理**:
    -   提供对 `wechat_bots` 表的 CRUD 操作。
    -   管理机器人与 `owner_id` (负责人) 的关联。
-   **机器人配置管理**:
    -   提供对 `bot_configs` 表的 CRUD 操作。确保每个机器人有且仅有一条配置记录。
    -   管理配置与关联表（知识库、提醒人、监听列表）的关系。
-   **机器人状态控制**:
    -   提供接口触发机器人登录（生成二维码）、登出。
    -   通过 WebSocket 或轮询，接收核心机器人服务上报的状态变化（扫码、登录成功、登出），并更新数据库。
    -   将状态变化实时推送给前端。
-   **安全与权限**:
    -   所有接口都应受 `auth` 中间件保护。
    -   只有超级管理员或被指定为"负责人"的用户才能编辑或操作机器人。




## 4. API 设计 (`backend/app/api/routes/wechat_accounts.py`)

所有接口均需在 Header 中提供 `Authorization: Bearer <token>`。

#### 4.1. 获取微信机器人列表

-   **Endpoint**: `GET /api/v1/wechat-accounts`
-   **说明**: 获取当前用户有权查看的所有微信机器人列表。
-   **返参**:
    ```json
    {
      "error": 0,
      "message": "Success",
      "body": {
        "data": [
          {
            "id": 1,
            "name": "销售机器人-华南",
            "owner_id": 10,
            "owner_name": "张三",
            "wxid": "wxid_xxxxxx",
            "avatar": "http://...",
            "status": "logged_in"
          }
        ],
        "total": 1
      }
    }
    ```

#### 4.2. 获取单个机器人完整配置

-   **Endpoint**: `GET /api/v1/wechat-accounts/{id}`
-   **说明**: 获取一个机器人的所有配置信息，用于渲染四分类的编辑页面。
-   **返参 (Body)**:
    ```json
    {
      "id": 1,
      "name": "销售机器人-华南",
      "owner_id": 10,
      "config": {
        "role_description": "负责售前技术咨询...",
        "tone_style": "professional",
        "system_prompt": null,
        "is_active_on_work_time": true,
        "work_time_start": "09:00:00",
        "work_time_end": "18:00:00",
        "offline_reply_message": "您好，现在是非工作时间...",
        "auto_accept_friend_request": true,
        "friend_request_keyword_filter": "购买,合作",
        "friend_request_welcome_message": "您好，很高兴认识您！",
        "listen_mode_group_chat": "specified",
        "listen_mode_private_chat": "all",
        "reply_trigger_on_mention": true,
        "welcome_new_group_member": true,
        "new_member_welcome_message": "欢迎新朋友！",
        "main_ai_model_id": 1,
        "main_ai_model_params": {"temperature": 0.7},
        "enable_auto_learning": true,
        "learning_scope": "manual_approved",
        "learning_mode": "manual_approval",
        "unhandled_question_action": "reply_text",
        "unhandled_question_reply_text": "抱歉，这个问题我需要咨询一下同事",
        "escalation_failed_attempts_trigger": 3,
        "escalation_trigger_intent_description": "用户表达强烈不满或投诉倾向",
        "alert_trigger_intent_description": "用户表现出强烈的购买意向",
        "max_replies_per_minute": 20
      },
      "monitored_chats": [ { "chat_id": "group_id_123", "chat_type": "group" } ],
      "knowledge_bases": [ { "kb_id": 1, "name": "产品A知识库", "priority": 0 } ],
      "alert_recipients": [ { "user_id": 11, "name": "李四" } ],
      "escalation_recipients": [ { "user_id": 10, "name": "张三" } ]
    }
    ```

#### 4.3. 创建新的微信机器人

-   **Endpoint**: `POST /api/v1/wechat-accounts`
-   **说明**: 创建一个新的机器人实例，只需提供基本信息。
-   **入参**:
    ```json
    {
      "name": "新的机器人",
      "owner_id": 10
    }
    ```
-   **返参**: 新创建的机器人信息 (类似 4.1 中的单项)。

#### 4.4. 更新微信机器人配置

-   **Endpoint**: `PUT /api/v1/wechat-accounts/{id}`
-   **说明**: 完整更新一个机器人的所有配置信息。
-   **入参 (Body)**: 结构同 `4.2` 的返参 Body。
-   **返参**:
    ```json
    { "error": 0, "message": "更新成功" }
    ```

#### 4.5. 删除微信机器人

-   **Endpoint**: `DELETE /api/v1/wechat-accounts/{id}`
-   **说明**: 删除一个机器人实例及其所有配置。
-   **返参**:
    ```json
    { "error": 0, "message": "删除成功" }
    ```

#### 4.6. 机器人登录操作

-   **Endpoint**: `POST /api/v1/wechat-accounts/{id}/login`
-   **说明**: 请求登录一个机器人，后端触发 `wechaty` 等核心服务启动。
-   **返参**:
    ```json
    {
      "error": 0, "message": "请求成功，请扫码",
      "body": {
        "qrcode": "https://wechat.com/qrcode/...", // URL for QR code image
        "status_check_token": "some_uuid_for_websocket_or_polling"
      }
    }
    ```

#### 4.7. 机器人登出操作

-   **Endpoint**: `POST /api/v1/wechat-accounts/{id}/logout`
-   **说明**: 请求登出一个机器人。
-   **返参**:
    ```json
    { "error": 0, "message": "登出指令已发送" }
    ``` 