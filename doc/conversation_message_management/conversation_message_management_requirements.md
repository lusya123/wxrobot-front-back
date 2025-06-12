# 会话与消息管理模块需求文档

## 1. 概述

本模块旨在为 `wxbot` 系统提供强大而灵活的会话与消息管理能力。核心目标是高效地存储、管理和利用来自多个微信机器人账号的聊天数据，并结合 AI 能力为每个联系人建立动态的、有上下文情景的"记忆"，最终通过前端界面提供直观的操作和展示。

此模块将支持：
-   同时管理多个微信机器人账号的会话。
-   持久化存储所有私聊和群聊的消息。
-   为微信联系人（客户）打标签、分组和添加备注。
-   构建具有隐私隔离的上下文记忆系统（私聊记忆 vs 群聊记忆）。
-   提供全面的前端界面供运营人员查看、回复和管理会話。

## 2. 核心概念与数据模型设计

为了实现上述功能，我们需要建立以下核心数据模型。这些模型将使用 SQLAlchemy 在后端定义。

-   **`WechatAccount` (来自 `@/wechat_accounts` 模块)**:
    -   代表一个被系统管理的微信机器人账号。
    -   这是所有会话数据的顶层关联对象。

-   **`Contact` (微信联系人)**:
    -   代表一个微信用户，可以是好友或群成员。
    -   `id`: 主键。
    -   `wechat_id`: 微信的唯一ID (wxid)。
    -   `wechat_name`: 微信名。
    -   `remark_name`: 机器人给该联系人设置的备注名。
    -   `avatar`: 头像链接。
    -   `tags`: 标签（可关联到一个独立的 `Tag` 表）。
    -   `group`: 分组。
    -   `notes`: 运营人员添加的内部备注。

-   **`Conversation` (会话)**:
    -   代表一个聊天窗口，可以是私聊或群聊。
    -   `id`: 主键。
    -   `wechat_account_id`: 外键，关联到 `WechatAccount`，表明这个会话属于哪个机器人。
    -   `type`: ENUM('private', 'group')，标识会话类型。
    -   `topic`: 会话标题。对于私聊，是对方的备注名或微信名；对于群聊，是群名称。
    -   `last_message_at`: 最后一条消息的时间，用于排序。
    -   `participants`: 多对多关系，关联到 `Contact` 表，记录会话参与者。

-   **`Message` (消息)**:
    -   代表一条具体的聊天消息。
    -   `id`: 主键。
    -   `conversation_id`: 外键，关联到 `Conversation`。
    -   `sender_id`: 外键，关联到 `Contact`，表示消息发送者。
    -   `type`: 消息类型 (e.g., 'text', 'image', 'file', 'link')。
    -   `content`: 消息内容。
    -   `created_at`: 消息发送时间。

-   **`ContactMemory` (联系人记忆)**:
    -   存储由 AI 分析总结的关于特定联系人的记忆。
    -   `id`: 主键。
    -   `contact_id`: 外键，关联到 `Contact`。
    -   `context_id`: 上下文ID。对于私聊记忆，可以是 `contact_id` 本身；对于群聊记忆，是 `conversation_id`。
    -   `summary`: AI 生成的关于该用户在该上下文中的对话摘要。
    -   `updated_at`: 摘要更新时间。

## 3. 后端功能需求 (`/backend`)

-   **3.1. 消息接收与处理**:
    -   提供一个内部接口，供核心机器人 (`wechat_bot.py`) 调用。
    -   当机器人接收到新消息时，将消息数据（包括发送人、会话ID、内容等）推送到此接口。
    -   后端服务负责解析数据，查找或创建对应的 `Contact` 和 `Conversation`，并将 `Message` 存入数据库。

-   **3.2. 会话管理**:
    -   实现获取会话列表的逻辑，支持根据 `wechat_account_id` 进行筛选。
    -   支持会话搜索功能（按 `topic` 搜索）。

-   **3.3. 消息管理**:
    -   实现根据 `conversation_id` 获取历史消息的逻辑，支持分页加载。

-   **3.4. 联系人管理**:
    -   实现对 `Contact` 的增删改查。
    -   提供接口用于修改联系人的标签、分组和备注信息。

-   **3.5. 记忆系统**:
    -   **摘要生成**: 创建一个后台定时任务（如使用 Celery），定期扫描新的消息。
    -   **上下文隔离**:
        -   **私聊记忆**: 针对某个 `Contact`，收集其所有私聊消息和他在所有群聊中发出的消息，调用 AI API 生成一份"全局"摘要，存储时 `context_id` 设为 `contact_id`。
        -   **群聊记忆**: 针对某个群聊 `Conversation`，收集某 `Contact` 在**该群聊内**的所有消息，调用 AI API 生成一份"群聊专属"摘要，存储时 `context_id` 设为 `conversation_id`。
    -   **记忆获取**: 提供一个接口。当需要为某个联系人生成回复建议时，后端的处理逻辑如下：
        -   **如果是私聊**: 获取该联系人的"全局"记忆摘要(记忆摘要是根据该联系人在群聊里面所有的聊天记录通过AI总结和提炼生成)。
        -   **如果是群聊**: 获取该联系人的"群聊专属"记忆摘要，**并额外提取该群聊中最近的 N 条消息（例如最近的 10 条）作为即时上下文**。
        -   将获取到的记忆摘要和即时上下文消息一起发送给 AI 模型，生成最终的回复建议。

## 4. 前端功能需求 (`/wechat-sales-assistant`)

-   **4.1. 主界面布局**:
    -   左侧为"会话列表区"，中间为"当前会话消息区"，右侧为"联系人/会话详情区"。
    -   顶部应有下拉框，允许用户切换不同的微信机器人账号 (`WechatAccount`)，切换后所有数据应随之刷新。

-   **4.2. 会话列表区 (`/app/conversations`)**:
    -   显示当前选中机器人的所有会话列表。
    -   每个列表项应显示对方头像、`topic`、最新消息摘要和 `last_message_at`。
    -   提供搜索框，实时过滤会话列表。
    -   点击列表项，在中间区域加载该会话的聊天记录。

-   **4.3. 消息区**:
    -   显示当前选中会话的所有历史消息，发送者和接收者的消息应有明显区分（如颜色、位置）。
    -   支持向上滚动无限加载更多历史消息。
    -   底部为消息输入框，支持发送文本、图片等。
    -   在输入框附近，可以有一个"AI 建议"按钮。点击后，调用后端记忆系统接口，获取回复建议。

-   **4.4. 详情区**:
    -   当选中一个**私聊**会话时，右侧显示该 `Contact` 的详细信息。
    -   当选中一个**群聊**会话时，右侧显示群信息（如群成员列表）。点击群成员，可切换显示该成员的 `Contact` 详情。
    -   `Contact` 详情中应包含：
        -   基本信息：头像、微信名、备注名。
        -   可编辑的字段：标签（Tag）、分组（Group）、备注（Notes）。修改后立即调用 API 保存。

## 5. API 设计

所有 API 均遵循 `api.mdc` 规则：`POST` 请求，Header 中带 `auth` Token，请求体为 JSON，返回统一的 JSON 结构。

---

### **内部 API (机器人 -> 后端)**

#### 1. 上报新消息
-   **Endpoint**: `/api/internal/message/report`
-   **说明**: 核心机器人程序监听到新消息后调用此接口。
-   **请求 Body**:
    ```json
    {
      "bot_id": "wechat_bot_wxid_123", // 机器人自己的微信ID
      "conversation_id": "chatroom_id@chatroom", // 会话的唯一ID
      "conversation_topic": "技术交流群", // 会话标题
      "conversation_type": "group", // 'private' or 'group'
      "sender": {
        "id": "sender_wxid_456",
        "name": "张三"
      },
      "message": {
        "id": "msg_id_789",
        "type": "text",
        "content": "大家好",
        "timestamp": 1678886400
      },
      "participants": [ // (可选)仅在群聊消息且需要更新成员列表时提供
        {"id": "sender_wxid_456", "name": "张三"},
        {"id": "another_member_wxid", "name": "李四"}
      ]
    }
    ```
-   **成功返回**:
    ```json
    { "error": 0, "body": {"status": "received"}, "message": "成功" }
    ```

---

### **公开 API (前端 <-> 后端)**

#### 1. 获取会话列表
-   **Endpoint**: `/api/conversations/list`
-   **请求 Body**:
    ```json
    {
      "wechat_account_id": 1, // 当前选择的机器人账号DB ID
      "query": "技术" // (可选) 搜索关键词
    }
    ```
-   **成功返回 `body`**:
    ```json
    {
      "conversations": [
        {
          "id": 101,
          "type": "group",
          "topic": "技术交流群",
          "avatar": "url/to/avatar.png",
          "last_message": "李四: 好的, 没问题",
          "last_message_at": "2023-10-27T10:00:00Z"
        }
      ]
    }
    ```

#### 2. 获取指定会话的消息
-   **Endpoint**: `/api/messages/list`
-   **请求 Body**:
    ```json
    {
      "conversation_id": 101,
      "page": 1, // 用于分页
      "page_size": 20
    }
    ```
-   **成功返回 `body`**:
    ```json
    {
      "messages": [
        {
          "id": 1,
          "sender": {"id": 1, "name": "张三", "avatar": "..."},
          "type": "text",
          "content": "大家好",
          "created_at": "2023-10-27T09:00:00Z"
        }
      ],
      "total": 100
    }
    ```

#### 3. 获取联系人/会话详情
-   **Endpoint**: `/api/details/get`
-   **请求 Body**:
    ```json
    {
      "conversation_id": 101, // 必须
      "contact_id": 202 // (可选) 如果是查看群聊中的某个成员详情
    }
    ```
-   **成功返回 `body` (私聊)**:
    ```json
    {
      "type": "contact",
      "details": {
        "id": 201, "name": "王五", "avatar": "...",
        "tags": ["潜在客户", "技术专家"],
        "group": "核心客户",
        "notes": "对我们的A产品非常感兴趣"
      }
    }
    ```
-   **成功返回 `body` (群聊)**:
    ```json
    {
      "type": "conversation",
      "details": {
        "id": 101, "topic": "技术交流群",
        "participants": [
          {"id": 201, "name": "王五", "avatar": "..."},
          {"id": 202, "name": "李四", "avatar": "..."}
        ]
      }
    }
    ```

#### 4. 更新联系人信息
-   **Endpoint**: `/api/contacts/update`
-   **请求 Body**:
    ```json
    {
      "contact_id": 201,
      "tags": ["潜在客户", "已联系"], // 发送全量更新的标签
      "group": "跟进中客户",
      "notes": "已于10月27日电话沟通"
    }
    ```
-   **成功返回 `body`**:
    ```json
    { "status": "updated" }
    ```

#### 5. 获取 AI 回复建议 (记忆)
-   **Endpoint**: `/api/ai/suggestion`
-   **请求 Body**:
    ```json
    {
      "conversation_id": 101, // 当前会话
      "contact_id": 201 // 提问对象
    }
    ```
-   **处理逻辑说明**: 后端在收到此请求后，会判断 `conversation_id` 对应的会话类型。如果是群聊，除了查询 `contact_id` 的记忆摘要外，还会从数据库中拉取该会话最近的 N 条聊天记录，将两者结合后一起发送给 AI 模型以生成建议。
-   **成功返回 `body`**:
    ```json
    {
      "suggestion": "根据历史对话, 王五是一名对AI技术非常感兴趣的后端工程师。他上次提到了关于 FastAPI 的性能问题。你可以询问他是否还需要相关的资料。",
      "memory_summary": "......" // (可选) 返回用于生成建议的原始摘要
    }
    ```
