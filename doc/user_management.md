# 用户管理模块文档

## 1. 简介

用户管理模块是系统的核心组成部分，负责处理用户账户的创建、认证、授权以及不同角色用户的操作权限。本模块旨在提供一个安全、高效的用户管理体系，支持超级管理员、普通管理员和普通用户三种角色。

## 2. 用户角色与权限

系统定义了以下三种用户角色：

*   **超级管理员 (Super Admin)**:
    *   拥有系统的最高权限。
    *   可以创建、查看、编辑、删除普通管理员账户。
    *   可以创建、查看、编辑、删除普通用户账户。
    *   可以管理系统配置等其他高级功能。
*   **普通管理员 (Admin)**:
    *   拥有对普通用户账户的管理权限。
    *   不可以创建、查看、编辑、删除其他管理员账户（包括超级管理员和普通管理员）。
    *   可以创建、查看、编辑、删除普通用户账户。
*   **用户 (User)**:
    *   系统的普通使用者。
    *   登录后访问其专属的仪表盘（Dashboard）。
    *   可以查看和修改自己的个人资料。
    *   不能进行任何账户管理操作。

## 3. 前端功能设计 (`wechat-sales-assistant` 项目)

### 3.1. 通用功能

*   **登录页面**:
    *   提供用户名/邮箱和密码输入框。
    *   "登录"按钮。
    *   "忘记密码"链接（可选）。
    *   显示错误提示（如凭证无效、账户锁定等）。
*   **导航栏/侧边栏**:
    *   根据用户角色动态显示可访问的菜单项。
    *   包含"个人资料"和"退出登录"选项。

### 3.2. 超级管理员界面

*   **仪表盘**: 显示系统概览信息。
*   **管理员管理**:
    *   列表展示所有普通管理员账户（用户名、邮箱、创建时间、状态等）。
    *   提供搜索和筛选功能。
    *   "创建管理员"按钮，弹出表单（用户名、邮箱、初始密码）。
    *   操作按钮：编辑管理员信息、重置密码、禁用/启用账户、删除账户。
*   **用户管理**:
    *   列表展示所有普通用户账户（用户名、邮箱、创建时间、状态、所属管理员（如果适用）等）。
    *   提供搜索和筛选功能。
    *   "创建用户"按钮，弹出表单（用户名、邮箱、初始密码）。
    *   操作按钮：编辑用户信息、重置密码、禁用/启用账户、删除账户。
*   **系统设置** (可选): 管理系统级配置。

### 3.3. 普通管理员界面

*   **仪表盘**: 显示其管理范围内的用户概览信息。
*   **用户管理**:
    *   列表展示其创建或分配的普通用户账户。
    *   提供搜索和筛选功能。
    *   "创建用户"按钮，弹出表单（用户名、邮箱、初始密码）。
    *   操作按钮：编辑用户信息、重置密码、禁用/启用账户、删除账户。
    *   **注意**: 普通管理员不能查看或管理其他管理员创建的用户（除非有明确的共享机制）。

### 3.4. 用户界面

*   **仪表盘 (Dashboard)**:
    *   显示与用户相关的业务数据和快捷操作。
*   **个人资料**:
    *   查看个人账户信息（用户名、邮箱）。
    *   修改密码。
    *   编辑个人偏好设置（如果适用）。

## 4. 后端功能设计 (`backend` 项目)

### 4.1. 数据模型 (示例，具体字段根据实际需求调整)

*   **User (用户表)**:
    *   `id` (主键, UUID/自增ID)
    *   `username` (字符串, 唯一, 登录名)
    *   `email` (字符串, 唯一, 邮箱)
    *   `hashed_password` (字符串, 加密后的密码)
    *   `role` (枚举/字符串: 'super_admin', 'admin', 'user')
    *   `is_active` (布尔值, 账户是否激活)
    *   `created_at` (日期时间)
    *   `updated_at` (日期时间)
    *   `created_by_id` (外键, 指向创建该用户的管理员User.id, 可为空) - 用于追踪用户创建者

### 4.2. 认证机制

*   使用 Token-based authentication (例如 JWT)。
*   登录成功后，后端生成一个 Token 返回给前端。
*   前端在后续请求的 Header 中携带此 Token (`Authorization: Bearer <token>`)。
*   后端中间件验证 Token 的有效性。

### 4.3. 授权与业务逻辑

*   基于用户 `role` 字段进行权限控制。
*   关键 API 接口需要检查用户角色，确保只有授权用户才能执行操作。
    *   例如，创建管理员的接口只对 `super_admin` 开放。
    *   创建用户的接口对 `super_admin` 和 `admin` 开放。
*   普通管理员创建用户时，`created_by_id` 字段记录该管理员的 ID。

## 5. API 接口设计

**通用原则 (遵循 `api.mdc`):**

*   **请求方式**: 默认为 POST，除非明确指定。
*   **请求头**:
    *   `Content-Type: application/json`
    *   `Authorization: Bearer <token>` (除登录/注册接口外)
*   **请求体**: JSON 格式。即使参数为空，也需使用 `{}`。
*   **响应体**: JSON 格式。
    ```json
    {
      "error": 0,        // 0: 成功; 500: 系统异常; 401: 需要登录; 其他: 业务异常
      "body": {},        // 实际返回数据对象
      "message": ""      // 错误或成功信息
    }
    ```

**通用错误处理函数 (前端实现):**

```javascript
function handleApiResponse(response) {
  if (response.error === 0) {
    return response.body; // 或 Promise.resolve(response.body)
  } else if (response.error === 401) {
    // 跳转到登录页
    console.error('需要登录:', response.message);
    // window.location.href = '/login';
    throw new Error('需要登录');
  } else if (response.error === 500) {
    // 弹出系统异常提示
    console.error('系统异常:', response.message);
    alert('系统异常，请稍后再试或联系管理员。');
    throw new Error(response.message || '系统异常');
  } else {
    // 业务异常，直接弹出 message 内容
    console.warn('业务异常:', response.message);
    alert(response.message);
    throw new Error(response.message);
  }
}
```

---

### 5.1. 认证相关接口

#### 5.1.1. 用户登录

*   **路径**: `/api/auth/login`
*   **方法**: POST
*   **请求头**: 不需要 `Authorization`
*   **请求体**:
    ```json
    {
      "username": "user_or_admin_name", // 或 email
      "password": "user_password"
    }
    ```
*   **响应体 (`body`)**:
    ```json
    {
      "token": "jwt_token_string",
      "user": {
        "id": "user_id",
        "username": "user_or_admin_name",
        "email": "user_email",
        "role": "super_admin" // or "admin", "user"
      }
    }
    ```
*   **说明**: 登录成功返回 Token 和用户信息。

#### 5.1.2. 用户登出 (可选，依赖前端 Token 清除)

*   **路径**: `/api/auth/logout`
*   **方法**: POST
*   **请求头**: `Authorization: Bearer <token>`
*   **请求体**: `{}`
*   **响应体 (`body`)**: `{}`
*   **说明**: 后端可将 Token 加入黑名单（如果需要）。

---

### 5.2. 超级管理员 - 管理员账户接口

#### 5.2.1. 创建普通管理员

*   **路径**: `/api/superadmin/admins`
*   **方法**: POST
*   **请求头**: `Authorization: Bearer <token>` (超级管理员Token)
*   **请求体**:
    ```json
    {
      "username": "new_admin_username",
      "email": "new_admin_email@example.com",
      "password": "initial_password"
    }
    ```
*   **响应体 (`body`)**:
    ```json
    {
      "id": "new_admin_id",
      "username": "new_admin_username",
      "email": "new_admin_email@example.com",
      "role": "admin",
      "is_active": true,
      "created_at": "timestamp"
    }
    ```

#### 5.2.2. 获取普通管理员列表

*   **路径**: `/api/superadmin/admins`
*   **方法**: GET (这里使用 GET，符合 RESTful 风格获取列表)
*   **请求头**: `Authorization: Bearer <token>` (超级管理员Token)
*   **请求参数 (Query Parameters)**:
    *   `page` (int, optional): 页码
    *   `limit` (int, optional): 每页数量
    *   `search` (string, optional): 搜索关键词 (用户名/邮箱)
*   **响应体 (`body`)**:
    ```json
    {
      "admins": [
        {
          "id": "admin_id_1",
          "username": "admin1",
          "email": "admin1@example.com",
          "role": "admin",
          "is_active": true,
          "created_at": "timestamp"
        }
        // ... more admins
      ],
      "total_count": 100
    }
    ```

#### 5.2.3. 获取单个普通管理员信息

*   **路径**: `/api/superadmin/admins/{admin_id}`
*   **方法**: GET
*   **请求头**: `Authorization: Bearer <token>` (超级管理员Token)
*   **响应体 (`body`)**: (同 5.2.1 创建成功后的 body)

#### 5.2.4. 更新普通管理员信息

*   **路径**: `/api/superadmin/admins/{admin_id}`
*   **方法**: PUT (或 POST，若遵循所有请求为 POST)
*   **请求头**: `Authorization: Bearer <token>` (超级管理员Token)
*   **请求体**: (只包含需要更新的字段)
    ```json
    {
      "email": "updated_email@example.com", // 可选
      "is_active": false // 可选
    }
    ```
*   **响应体 (`body`)**: (更新后的管理员信息，同 5.2.1 创建成功后的 body)

#### 5.2.5. 删除普通管理员

*   **路径**: `/api/superadmin/admins/{admin_id}`
*   **方法**: DELETE (或 POST，若遵循所有请求为 POST)
*   **请求头**: `Authorization: Bearer <token>` (超级管理员Token)
*   **请求体**: `{}`
*   **响应体 (`body`)**: `{}`
*   **说明**: 软删除或硬删除根据业务决定。

#### 5.2.6. 重置普通管理员密码

*   **路径**: `/api/superadmin/admins/{admin_id}/reset-password`
*   **方法**: POST
*   **请求头**: `Authorization: Bearer <token>` (超级管理员Token)
*   **请求体**:
    ```json
    {
      "new_password": "new_strong_password"
    }
    ```
*   **响应体 (`body`)**: `{}`

---

### 5.3. 管理员 (超级/普通) - 用户账户接口

#### 5.3.1. 创建用户

*   **路径**: `/api/users` (或 `/api/admin/users` 如果需要更明确区分)
*   **方法**: POST
*   **请求头**: `Authorization: Bearer <token>` (超级管理员或普通管理员Token)
*   **请求体**:
    ```json
    {
      "username": "new_user_username",
      "email": "new_user_email@example.com",
      "password": "initial_password"
    }
    ```
*   **响应体 (`body`)**:
    ```json
    {
      "id": "new_user_id",
      "username": "new_user_username",
      "email": "new_user_email@example.com",
      "role": "user",
      "is_active": true,
      "created_at": "timestamp",
      "created_by_id": "admin_creator_id" // 创建者ID
    }
    ```

#### 5.3.2. 获取用户列表

*   **路径**: `/api/users`
*   **方法**: GET
*   **请求头**: `Authorization: Bearer <token>` (超级管理员或普通管理员Token)
*   **请求参数 (Query Parameters)**:
    *   `page` (int, optional): 页码
    *   `limit` (int, optional): 每页数量
    *   `search` (string, optional): 搜索关键词 (用户名/邮箱)
    *   `created_by` (string, optional): (超级管理员用) 按创建者ID筛选
*   **响应体 (`body`)**:
    ```json
    {
      "users": [
        {
          "id": "user_id_1",
          "username": "user1",
          "email": "user1@example.com",
          "role": "user",
          "is_active": true,
          "created_at": "timestamp",
          "created_by_id": "admin_creator_id"
        }
        // ... more users
      ],
      "total_count": 250
    }
    ```
*   **说明**: 普通管理员只能看到自己创建的用户。超级管理员可以看到所有用户。

#### 5.3.3. 获取单个用户信息

*   **路径**: `/api/users/{user_id}`
*   **方法**: GET
*   **请求头**: `Authorization: Bearer <token>` (超级管理员或普通管理员Token)
*   **响应体 (`body`)**: (同 5.3.1 创建成功后的 body)
*   **说明**: 普通管理员只能获取自己创建的用户信息。

#### 5.3.4. 更新用户信息

*   **路径**: `/api/users/{user_id}`
*   **方法**: PUT (或 POST)
*   **请求头**: `Authorization: Bearer <token>` (超级管理员或普通管理员Token)
*   **请求体**: (只包含需要更新的字段)
    ```json
    {
      "email": "updated_user_email@example.com", // 可选
      "is_active": false // 可选
    }
    ```
*   **响应体 (`body`)**: (更新后的用户信息，同 5.3.1 创建成功后的 body)
*   **说明**: 普通管理员只能更新自己创建的用户信息。

#### 5.3.5. 删除用户

*   **路径**: `/api/users/{user_id}`
*   **方法**: DELETE (或 POST)
*   **请求头**: `Authorization: Bearer <token>` (超级管理员或普通管理员Token)
*   **请求体**: `{}`
*   **响应体 (`body`)**: `{}`
*   **说明**: 普通管理员只能删除自己创建的用户。

#### 5.3.6. 重置用户密码

*   **路径**: `/api/users/{user_id}/reset-password`
*   **方法**: POST
*   **请求头**: `Authorization: Bearer <token>` (超级管理员或普通管理员Token)
*   **请求体**:
    ```json
    {
      "new_password": "new_strong_password"
    }
    ```
*   **响应体 (`body`)**: `{}`
*   **说明**: 普通管理员只能重置自己创建的用户的密码。

---

### 5.4. 用户个人接口

#### 5.4.1. 获取当前登录用户信息

*   **路径**: `/api/me`
*   **方法**: GET
*   **请求头**: `Authorization: Bearer <token>` (任意已登录用户Token)
*   **响应体 (`body`)**:
    ```json
    {
      "id": "current_user_id",
      "username": "current_username",
      "email": "current_email@example.com",
      "role": "user", // or "admin", "super_admin"
      "is_active": true,
      "created_at": "timestamp"
      // ... 其他个人信息
    }
    ```

#### 5.4.2. 更新当前登录用户密码

*   **路径**: `/api/me/change-password`
*   **方法**: POST
*   **请求头**: `Authorization: Bearer <token>` (任意已登录用户Token)
*   **请求体**:
    ```json
    {
      "current_password": "old_password",
      "new_password": "new_strong_password"
    }
    ```
*   **响应体 (`body`)**: `{}`

#### 5.4.3. 更新当前登录用户个人资料 (可选)

*   **路径**: `/api/me/profile`
*   **方法**: PUT (或 POST)
*   **请求头**: `Authorization: Bearer <token>` (任意已登录用户Token)
*   **请求体**: (只包含允许用户修改的字段)
    ```json
    {
      "email": "new_personal_email@example.com" // 例如，如果允许修改邮箱
      // ... 其他可修改字段
    }
    ```
*   **响应体 (`body`)**: (更新后的用户信息，同 5.4.1)

---

**注意**:
*   所有 ID (如 `admin_id`, `user_id`) 应为路径参数。
*   分页、排序和过滤参数通常作为 GET 请求的查询参数。
*   密码不应在任何 GET 请求的响应中明文返回。
*   创建操作成功后，通常返回创建的资源对象。更新操作成功后，返回更新后的资源对象。删除操作成功后，返回空对象或成功消息。
*   实际的后端路由前缀可能有所不同 (例如 `/v1/` 等)。
*   本文档中的 `User (用户表)` 的 `created_by_id` 字段用于普通管理员追踪其创建的用户。超级管理员可以管理所有用户和管理员。 