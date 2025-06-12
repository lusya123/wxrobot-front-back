# 会话与消息管理模块使用说明

## 功能概述

会话与消息管理模块提供了以下核心功能：

1. **会话管理**
   - 查看所有微信机器人的会话列表
   - 支持私聊和群聊两种会话类型
   - 实时显示最新消息摘要和时间
   - 支持会话搜索功能

2. **消息管理**
   - 查看会话的完整消息历史
   - 支持消息分页加载
   - 实时消息上报和展示
   - 消息时间格式化显示

3. **联系人管理**
   - 查看和编辑联系人信息
   - 支持标签管理
   - 支持备注功能
   - AI回复建议功能

## 后端API接口

### 1. 内部API（供机器人调用）

#### 消息上报接口
```
POST /api/internal/message/report
Authorization: Bearer {token}

请求体:
{
  "bot_id": "机器人wxid",
  "conversation_id": "会话唯一ID",
  "conversation_topic": "会话标题",
  "conversation_type": "private|group",
  "sender": {
    "id": "发送者wxid",
    "name": "发送者昵称"
  },
  "message": {
    "id": "消息ID",
    "type": "text|image|file|...",
    "content": "消息内容",
    "timestamp": 1234567890
  },
  "participants": [  // 群聊时需要
    {"id": "wxid1", "name": "成员1"},
    {"id": "wxid2", "name": "成员2"}
  ]
}
```

### 2. 公开API（供前端调用）

#### 获取会话列表
```
POST /api/conversations/list
Authorization: Bearer {token}

请求体:
{
  "wechat_account_id": 1,
  "query": "搜索关键词"  // 可选
}
```

#### 获取消息列表
```
POST /api/messages/list
Authorization: Bearer {token}

请求体:
{
  "conversation_id": 1,
  "page": 1,
  "page_size": 20
}
```

#### 获取会话详情
```
POST /api/details/get
Authorization: Bearer {token}

请求体:
{
  "conversation_id": 1,
  "contact_id": 1  // 可选，指定查看特定联系人
}
```

#### 更新联系人信息
```
POST /api/contacts/update
Authorization: Bearer {token}

请求体:
{
  "contact_id": 1,
  "tags": ["标签1", "标签2"],
  "group": "分组名称",
  "notes": "备注信息"
}
```

#### 获取AI建议
```
POST /api/ai/suggestion
Authorization: Bearer {token}

请求体:
{
  "conversation_id": 1,
  "contact_id": 1
}
```

## 前端使用说明

### 1. 访问会话管理页面
访问 `/conversations` 路径即可进入会话管理页面。

### 2. 主要功能操作

- **切换微信账号**：在页面顶部的下拉框中选择要查看的微信机器人账号
- **搜索会话**：在搜索框中输入关键词，实时过滤会话列表
- **查看消息**：点击左侧会话列表中的任意会话，右侧会显示消息详情
- **查看联系人信息**：在消息详情页右侧可以查看联系人的详细信息
- **编辑备注**：点击备注区域可以编辑联系人的备注信息
- **获取AI建议**：点击消息输入框旁的灯泡图标，获取AI回复建议

## 测试方法

### 1. 启动服务

```bash
# 启动后端服务
cd backend
uvicorn app.main:app --reload

# 启动前端服务
cd wechat-sales-assistant
npm run dev
```

### 2. 模拟消息上报

使用提供的测试脚本模拟消息上报：

```bash
cd backend/scripts
python test_message_report.py
```

在运行脚本前，需要：
1. 登录系统获取认证令牌
2. 修改脚本中的 `AUTH_TOKEN` 变量
3. 确保数据库中存在对应的微信机器人记录

### 3. 创建测试数据

如果需要创建测试机器人，可以通过以下SQL：

```sql
-- 创建测试机器人
INSERT INTO wechat_bots (name, owner_id, wxid, status, created_at, updated_at)
VALUES ('测试机器人', '你的用户ID', 'test_bot_001', 'logged_in', NOW(), NOW());
```

## 注意事项

1. **权限控制**：用户只能查看自己拥有的微信机器人的会话和消息
2. **消息同步**：消息通过内部API上报，需要确保机器人服务正确调用上报接口
3. **性能优化**：消息列表支持分页加载，避免一次性加载过多数据
4. **实时更新**：当前版本需要手动刷新获取最新消息，后续可以集成WebSocket实现实时推送

## 后续优化建议

1. **实时消息推送**：集成WebSocket，实现消息的实时推送
2. **消息发送功能**：实现通过前端界面发送消息的功能
3. **富媒体消息**：支持图片、文件等富媒体消息的展示
4. **消息搜索**：在会话内搜索特定消息
5. **批量操作**：支持批量管理联系人标签和分组
6. **数据导出**：支持导出会话记录和联系人信息 