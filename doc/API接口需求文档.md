# 微信销售助手API接口需求文档

## 1. 接口规范

### 1.1 通用规范
- **请求方式**: 默认POST，特殊情况下使用GET
- **请求格式**: JSON格式，参数为空时使用 `{}`
- **请求头**: 必须设置 `auth` 字段，值为登录后的token
- **响应格式**: 统一JSON对象格式

```json
{
  "error": 0,
  "body": {},
  "message": ""
}
```

### 1.2 错误码说明
- `error = 0`: 请求成功
- `error = 401`: 需要登录
- `error = 500`: 系统异常
- `error = 其他值`: 业务异常，显示message内容

## 2. 用户认证模块

### 2.1 用户登录
**接口地址**: `/api/auth/login`
**请求方式**: POST

**请求参数**:
```json
{
  "username": "string",
  "password": "string"
}
```

**响应示例**:
```json
{
  "error": 0,
  "body": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "userInfo": {
      "id": 1,
      "username": "张经理",
      "role": "销售主管",
      "avatar": "/placeholder.svg"
    },
    "expiresIn": 86400
  },
  "message": "登录成功"
}
```

### 2.2 退出登录
**接口地址**: `/api/auth/logout`
**请求方式**: POST

**请求参数**:
```json
{}
```

**响应示例**:
```json
{
  "error": 0,
  "body": {},
  "message": "退出成功"
}
```

## 3. 仪表盘模块

### 3.1 获取仪表盘统计数据
**接口地址**: `/api/dashboard/statistics`
**请求方式**: POST

**请求参数**:
```json
{
  "timeRange": "today|week|month"
}
```

**响应示例**:
```json
{
  "error": 0,
  "body": {
    "activeConversations": 42,
    "conversationsGrowth": 12,
    "pendingTakeover": 8,
    "takeoverGrowth": 75,
    "newCustomers": 16,
    "customersGrowth": 30,
    "avgResponseTime": "1.8秒",
    "responseTimeChange": "-0.3秒"
  },
  "message": ""
}
```

### 3.2 获取对话统计图表数据
**接口地址**: `/api/dashboard/chart-data`
**请求方式**: POST

**请求参数**:
```json
{
  "timeRange": "week|month|quarter",
  "type": "conversation|customer|performance"
}
```

**响应示例**:
```json
{
  "error": 0,
  "body": {
    "chartData": [
      {
        "date": "2025-05-01",
        "conversations": 120,
        "newCustomers": 25,
        "successRate": 85
      }
    ]
  },
  "message": ""
}
```

### 3.3 获取最近活动
**接口地址**: `/api/dashboard/recent-activities`
**请求方式**: POST

**请求参数**:
```json
{
  "limit": 10
}
```

**响应示例**:
```json
{
  "error": 0,
  "body": {
    "activities": [
      {
        "id": 1,
        "type": "conversation",
        "title": "新对话创建",
        "description": "李先生(ABC科技)发起对话",
        "time": "5分钟前",
        "status": "pending"
      }
    ]
  },
  "message": ""
}
```

## 4. 对话监控模块

### 4.1 获取对话列表
**接口地址**: `/api/conversations/list`
**请求方式**: POST

**请求参数**:
```json
{
  "page": 1,
  "pageSize": 20,
  "status": "all|active|pending|human|closed",
  "search": "搜索关键词"
}
```

**响应示例**:
```json
{
  "error": 0,
  "body": {
    "total": 100,
    "conversations": [
      {
        "id": 1,
        "customer": {
          "id": 1,
          "name": "李先生",
          "company": "ABC科技有限公司",
          "avatar": "/placeholder.svg"
        },
        "status": "pending",
        "lastMessage": "想了解产品价格",
        "lastMessageTime": "2025-05-14 11:45:00",
        "unreadCount": 3,
        "responseTime": "1.2秒",
        "wechatAccount": "销售助手1号"
      }
    ]
  },
  "message": ""
}
```

### 4.2 获取对话详情
**接口地址**: `/api/conversations/detail`
**请求方式**: POST

**请求参数**:
```json
{
  "conversationId": 1
}
```

**响应示例**:
```json
{
  "error": 0,
  "body": {
    "conversation": {
      "id": 1,
      "customer": {
        "id": 1,
        "name": "李先生",
        "company": "ABC科技有限公司",
        "position": "销售总监",
        "phone": "138****5678",
        "source": "LinkedIn广告",
        "firstContact": "2025-05-13",
        "tags": ["高意向", "预算敏感", "决策者"],
        "avatar": "/placeholder.svg"
      },
      "status": "pending",
      "messages": [
        {
          "id": 1,
          "sender": "customer|ai|human",
          "content": "消息内容",
          "time": "2025-05-14 11:30:00",
          "messageType": "text|image|file"
        }
      ]
    }
  },
  "message": ""
}
```

### 4.3 发送消息
**接口地址**: `/api/conversations/send-message`
**请求方式**: POST

**请求参数**:
```json
{
  "conversationId": 1,
  "content": "消息内容",
  "messageType": "text|image|file"
}
```

**响应示例**:
```json
{
  "error": 0,
  "body": {
    "messageId": 123
  },
  "message": "消息发送成功"
}
```

### 4.4 接管对话
**接口地址**: `/api/conversations/takeover`
**请求方式**: POST

**请求参数**:
```json
{
  "conversationId": 1
}
```

**响应示例**:
```json
{
  "error": 0,
  "body": {},
  "message": "对话接管成功"
}
```

### 4.5 结束对话
**接口地址**: `/api/conversations/close`
**请求方式**: POST

**请求参数**:
```json
{
  "conversationId": 1,
  "reason": "已解决|客户不感兴趣|其他"
}
```

**响应示例**:
```json
{
  "error": 0,
  "body": {},
  "message": "对话已结束"
}
```

## 5. 客户管理模块

### 5.1 获取客户列表
**接口地址**: `/api/customers/list`
**请求方式**: POST

**请求参数**:
```json
{
  "page": 1,
  "pageSize": 20,
  "search": "搜索关键词",
  "status": "all|高意向|已接洽|已预约|需跟进|已成交|低意向",
  "source": "all|LinkedIn广告|行业展会|官网咨询|朋友推荐|百度搜索|微信群|抖音广告"
}
```

**响应示例**:
```json
{
  "error": 0,
  "body": {
    "total": 150,
    "customers": [
      {
        "id": 1,
        "name": "李先生",
        "company": "ABC科技有限公司",
        "position": "销售总监",
        "phone": "138****5678",
        "email": "li@abc.com",
        "source": "LinkedIn广告",
        "status": "高意向",
        "lastContact": "2025-05-14",
        "createTime": "2025-05-13",
        "avatar": "/placeholder.svg",
        "tags": ["高意向", "预算敏感"]
      }
    ]
  },
  "message": ""
}
```

### 5.2 获取客户详情
**接口地址**: `/api/customers/detail`
**请求方式**: POST

**请求参数**:
```json
{
  "customerId": 1
}
```

**响应示例**:
```json
{
  "error": 0,
  "body": {
    "customer": {
      "id": 1,
      "name": "李先生",
      "company": "ABC科技有限公司",
      "position": "销售总监",
      "phone": "138****5678",
      "email": "li@abc.com",
      "address": "北京市朝阳区",
      "source": "LinkedIn广告",
      "status": "高意向",
      "createTime": "2025-05-13",
      "lastContact": "2025-05-14",
      "avatar": "/placeholder.svg",
      "tags": ["高意向", "预算敏感", "决策者"],
      "notes": "客户备注信息",
      "conversations": [
        {
          "id": 1,
          "startTime": "2025-05-14 10:00:00",
          "endTime": "2025-05-14 11:00:00",
          "status": "已结束",
          "messageCount": 15
        }
      ]
    }
  },
  "message": ""
}
```

### 5.3 添加客户
**接口地址**: `/api/customers/add`
**请求方式**: POST

**请求参数**:
```json
{
  "name": "客户姓名",
  "company": "公司名称",
  "position": "职位",
  "phone": "联系电话",
  "email": "邮箱",
  "source": "来源",
  "status": "状态",
  "tags": ["标签1", "标签2"],
  "notes": "备注信息"
}
```

**响应示例**:
```json
{
  "error": 0,
  "body": {
    "customerId": 123
  },
  "message": "客户添加成功"
}
```

### 5.4 编辑客户信息
**接口地址**: `/api/customers/update`
**请求方式**: POST

**请求参数**:
```json
{
  "customerId": 1,
  "name": "客户姓名",
  "company": "公司名称",
  "position": "职位",
  "phone": "联系电话",
  "email": "邮箱",
  "status": "状态",
  "tags": ["标签1", "标签2"],
  "notes": "备注信息"
}
```

**响应示例**:
```json
{
  "error": 0,
  "body": {},
  "message": "客户信息更新成功"
}
```

### 5.5 删除客户
**接口地址**: `/api/customers/delete`
**请求方式**: POST

**请求参数**:
```json
{
  "customerId": 1
}
```

**响应示例**:
```json
{
  "error": 0,
  "body": {},
  "message": "客户删除成功"
}
```

## 6. 知识库管理模块

### 6.1 获取知识库列表
**接口地址**: `/api/knowledge/list`
**请求方式**: POST

**请求参数**:
```json
{
  "page": 1,
  "pageSize": 20,
  "category": "all|产品介绍|价格政策|常见问题|技术支持",
  "search": "搜索关键词"
}
```

**响应示例**:
```json
{
  "error": 0,
  "body": {
    "total": 50,
    "knowledgeList": [
      {
        "id": 1,
        "title": "产品功能介绍",
        "category": "产品介绍",
        "content": "知识内容",
        "status": "启用|禁用",
        "createTime": "2025-05-01",
        "updateTime": "2025-05-14",
        "useCount": 120
      }
    ]
  },
  "message": ""
}
```

### 6.2 添加知识
**接口地址**: `/api/knowledge/add`
**请求方式**: POST

**请求参数**:
```json
{
  "title": "知识标题",
  "category": "分类",
  "content": "知识内容",
  "keywords": ["关键词1", "关键词2"],
  "status": "启用|禁用"
}
```

**响应示例**:
```json
{
  "error": 0,
  "body": {
    "knowledgeId": 123
  },
  "message": "知识添加成功"
}
```

### 6.3 获取话术模板列表
**接口地址**: `/api/knowledge/scripts`
**请求方式**: POST

**请求参数**:
```json
{
  "page": 1,
  "pageSize": 20,
  "type": "all|开场白|产品介绍|价格谈判|异议处理|成交话术"
}
```

**响应示例**:
```json
{
  "error": 0,
  "body": {
    "total": 30,
    "scripts": [
      {
        "id": 1,
        "title": "产品演示邀请话术",
        "type": "产品介绍",
        "content": "话术内容",
        "status": "启用",
        "useCount": 85
      }
    ]
  },
  "message": ""
}
```

### 6.4 获取产品知识卡片
**接口地址**: `/api/knowledge/products`
**请求方式**: POST

**请求参数**:
```json
{
  "page": 1,
  "pageSize": 20
}
```

**响应示例**:
```json
{
  "error": 0,
  "body": {
    "total": 20,
    "products": [
      {
        "id": 1,
        "name": "销售管理平台",
        "description": "产品描述",
        "features": ["功能1", "功能2"],
        "pricing": "定价信息",
        "targetCustomer": "目标客户",
        "status": "启用"
      }
    ]
  },
  "message": ""
}
```

### 6.5 知识库效果测试
**接口地址**: `/api/knowledge/test`
**请求方式**: POST

**请求参数**:
```json
{
  "question": "测试问题"
}
```

**响应示例**:
```json
{
  "error": 0,
  "body": {
    "answer": "AI回答内容",
    "confidence": 0.95,
    "relatedKnowledge": [
      {
        "id": 1,
        "title": "相关知识标题",
        "relevance": 0.89
      }
    ]
  },
  "message": ""
}
```

## 7. 预约管理模块

### 7.1 获取预约列表
**接口地址**: `/api/appointments/list`
**请求方式**: POST

**请求参数**:
```json
{
  "page": 1,
  "pageSize": 20,
  "status": "all|已确认|待确认|已取消",
  "dateRange": {
    "startDate": "2025-05-01",
    "endDate": "2025-05-31"
  }
}
```

**响应示例**:
```json
{
  "error": 0,
  "body": {
    "total": 25,
    "appointments": [
      {
        "id": 1,
        "customer": {
          "id": 1,
          "name": "李先生",
          "company": "ABC科技有限公司",
          "avatar": "/placeholder.svg"
        },
        "type": "产品演示",
        "date": "2025-05-15",
        "startTime": "10:00",
        "endTime": "11:00",
        "salesperson": "张经理",
        "status": "已确认",
        "location": "线上会议",
        "notes": "备注信息",
        "createTime": "2025-05-14"
      }
    ]
  },
  "message": ""
}
```

### 7.2 创建预约
**接口地址**: `/api/appointments/create`
**请求方式**: POST

**请求参数**:
```json
{
  "customerId": 1,
  "type": "产品演示|需求沟通|方案讨论|价格谈判",
  "date": "2025-05-15",
  "startTime": "10:00",
  "endTime": "11:00",
  "salesperson": "张经理",
  "location": "会议地点",
  "notes": "备注信息"
}
```

**响应示例**:
```json
{
  "error": 0,
  "body": {
    "appointmentId": 123
  },
  "message": "预约创建成功"
}
```

### 7.3 更新预约状态
**接口地址**: `/api/appointments/update-status`
**请求方式**: POST

**请求参数**:
```json
{
  "appointmentId": 1,
  "status": "已确认|待确认|已取消",
  "reason": "取消原因（状态为已取消时必填）"
}
```

**响应示例**:
```json
{
  "error": 0,
  "body": {},
  "message": "预约状态更新成功"
}
```

### 7.4 获取日历视图数据
**接口地址**: `/api/appointments/calendar`
**请求方式**: POST

**请求参数**:
```json
{
  "year": 2025,
  "month": 5
}
```

**响应示例**:
```json
{
  "error": 0,
  "body": {
    "calendarData": [
      {
        "date": "2025-05-15",
        "appointments": [
          {
            "id": 1,
            "time": "10:00-11:00",
            "customer": "李先生",
            "type": "产品演示",
            "status": "已确认"
          }
        ]
      }
    ]
  },
  "message": ""
}
```

## 8. 微信账号管理模块

### 8.1 获取微信账号列表
**接口地址**: `/api/wechat-accounts/list`
**请求方式**: POST

**请求参数**:
```json
{
  "page": 1,
  "pageSize": 20,
  "status": "all|online|offline"
}
```

**响应示例**:
```json
{
  "error": 0,
  "body": {
    "total": 5,
    "accounts": [
      {
        "id": 1,
        "name": "销售助手1号",
        "avatar": "/placeholder.svg",
        "status": "online|offline",
        "lastActive": "2025-05-14 12:00:00",
        "friendsCount": 156,
        "groupsCount": 12,
        "messagesCount": 42,
        "autoReply": true,
        "createTime": "2025-05-01"
      }
    ]
  },
  "message": ""
}
```

### 8.2 添加微信账号
**接口地址**: `/api/wechat-accounts/add`
**请求方式**: POST

**请求参数**:
```json
{
  "name": "账号名称",
  "phone": "手机号码"
}
```

**响应示例**:
```json
{
  "error": 0,
  "body": {
    "accountId": 123,
    "qrcode": "base64编码的二维码图片"
  },
  "message": "账号添加成功，请扫码登录"
}
```

### 8.3 获取登录二维码
**接口地址**: `/api/wechat-accounts/qrcode`
**请求方式**: POST

**请求参数**:
```json
{
  "accountId": 1
}
```

**响应示例**:
```json
{
  "error": 0,
  "body": {
    "qrcode": "base64编码的二维码图片",
    "expireTime": 300
  },
  "message": ""
}
```

### 8.4 更新账号设置
**接口地址**: `/api/wechat-accounts/settings`
**请求方式**: POST

**请求参数**:
```json
{
  "accountId": 1,
  "autoReply": true,
  "replyDelay": 2,
  "workTime": {
    "start": "09:00",
    "end": "18:00"
  }
}
```

**响应示例**:
```json
{
  "error": 0,
  "body": {},
  "message": "设置更新成功"
}
```

### 8.5 获取好友列表
**接口地址**: `/api/wechat-accounts/friends`
**请求方式**: POST

**请求参数**:
```json
{
  "accountId": 1,
  "page": 1,
  "pageSize": 20,
  "search": "搜索关键词"
}
```

**响应示例**:
```json
{
  "error": 0,
  "body": {
    "total": 156,
    "friends": [
      {
        "wxId": "friend_123",
        "nickname": "张三",
        "avatar": "/placeholder.svg",
        "addTime": "2025-05-10",
        "lastChatTime": "2025-05-14",
        "isCustomer": true,
        "customerId": 1
      }
    ]
  },
  "message": ""
}
```

## 9. 设置中心模块

### 9.1 获取系统设置
**接口地址**: `/api/settings/system`
**请求方式**: POST

**请求参数**:
```json
{}
```

**响应示例**:
```json
{
  "error": 0,
  "body": {
    "settings": {
      "autoReply": true,
      "replyDelay": 2,
      "maxConcurrentConversations": 50,
      "workTime": {
        "start": "09:00",
        "end": "18:00"
      },
      "escalationRules": {
        "keywordTrigger": ["价格", "付款", "合同"],
        "responseTime": 30
      }
    }
  },
  "message": ""
}
```

### 9.2 更新系统设置
**接口地址**: `/api/settings/update`
**请求方式**: POST

**请求参数**:
```json
{
  "autoReply": true,
  "replyDelay": 2,
  "maxConcurrentConversations": 50,
  "workTime": {
    "start": "09:00",
    "end": "18:00"
  },
  "escalationRules": {
    "keywordTrigger": ["价格", "付款", "合同"],
    "responseTime": 30
  }
}
```

**响应示例**:
```json
{
  "error": 0,
  "body": {},
  "message": "设置更新成功"
}
```

## 10. 通知模块

### 10.1 获取通知列表
**接口地址**: `/api/notifications/list`
**请求方式**: POST

**请求参数**:
```json
{
  "page": 1,
  "pageSize": 20,
  "status": "all|unread|read"
}
```

**响应示例**:
```json
{
  "error": 0,
  "body": {
    "total": 15,
    "notifications": [
      {
        "id": 1,
        "type": "conversation|appointment|customer|system",
        "title": "需要接管对话",
        "content": "李先生(ABC科技)的对话需要人工接管",
        "status": "unread|read",
        "createTime": "2025-05-14 12:00:00",
        "relatedId": 1
      }
    ]
  },
  "message": ""
}
```

### 10.2 标记通知为已读
**接口地址**: `/api/notifications/mark-read`
**请求方式**: POST

**请求参数**:
```json
{
  "notificationIds": [1, 2, 3]
}
```

**响应示例**:
```json
{
  "error": 0,
  "body": {},
  "message": "标记成功"
}
```

## 11. 文件上传模块

### 11.1 上传文件
**接口地址**: `/api/upload/file`
**请求方式**: POST
**内容类型**: multipart/form-data

**请求参数**:
```
file: File对象
type: "avatar|document|image"
```

**响应示例**:
```json
{
  "error": 0,
  "body": {
    "fileId": "123",
    "fileName": "document.pdf",
    "fileUrl": "/uploads/document.pdf",
    "fileSize": 1024000
  },
  "message": "文件上传成功"
}
```

## 12. 数据导出模块

### 12.1 导出客户数据
**接口地址**: `/api/export/customers`
**请求方式**: POST

**请求参数**:
```json
{
  "format": "excel|csv",
  "filters": {
    "status": "all|高意向|已接洽|已预约|需跟进|已成交|低意向",
    "dateRange": {
      "startDate": "2025-05-01",
      "endDate": "2025-05-31"
    }
  }
}
```

**响应示例**:
```json
{
  "error": 0,
  "body": {
    "downloadUrl": "/downloads/customers_export_20250514.xlsx",
    "fileName": "客户数据_20250514.xlsx"
  },
  "message": "导出成功"
}
```

### 12.2 导出对话记录
**接口地址**: `/api/export/conversations`
**请求方式**: POST

**请求参数**:
```json
{
  "format": "excel|csv|pdf",
  "conversationIds": [1, 2, 3]
}
```

**响应示例**:
```json
{
  "error": 0,
  "body": {
    "downloadUrl": "/downloads/conversations_export_20250514.pdf",
    "fileName": "对话记录_20250514.pdf"
  },
  "message": "导出成功"
}
```

---

## 附录

### A. 公共数据结构

#### A.1 客户对象
```json
{
  "id": "number",
  "name": "string",
  "company": "string",
  "position": "string",
  "phone": "string",
  "email": "string",
  "source": "string",
  "status": "string",
  "avatar": "string",
  "tags": ["string"],
  "createTime": "string",
  "lastContact": "string"
}
```

#### A.2 对话对象
```json
{
  "id": "number",
  "customer": "客户对象",
  "status": "string",
  "messages": ["消息对象"],
  "createTime": "string",
  "lastMessageTime": "string"
}
```

#### A.3 消息对象
```json
{
  "id": "number",
  "sender": "customer|ai|human",
  "content": "string",
  "messageType": "text|image|file",
  "time": "string"
}
```

### B. 错误处理规范

所有接口都应实现统一的错误处理函数，根据返回的error字段进行相应处理：

1. error = 0: 请求成功，正常处理body数据
2. error = 401: 跳转到登录页面
3. error = 500: 显示系统异常提示
4. 其他error值: 显示message中的错误信息

### C. 数据验证规范

1. 前端发送请求前应进行基础数据验证
2. 后端应对所有接收参数进行严格验证
3. 敏感操作（删除、修改状态等）应进行二次确认
4. 文件上传应限制文件类型和大小

---

**文档版本**: v1.0  
**创建日期**: 2025-05-14  
**最后更新**: 2025-05-14 