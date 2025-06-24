# 微信机器人客户端 API 文档

本文档定义了微信机器人客户端与后端服务交互的 API。

---

## 1. 用户登录

### 接口描述

用户通过账号密码登录，成功后获取访问令牌 (Token)，用于后续接口的身份认证。网页端和机器人客户端使用相同的账号体系。

### 接口详情

- **路径:** `/api/auth/login`
- **请求方法:** `POST`
- **请求头:**
  - `Content-Type`: `application/json`

### 请求参数

请求体为一个 JSON 对象，包含以下字段：

| 参数名   | 类型   | 是否必填 | 描述                               |
| -------- | ------ | -------- | ---------------------------------- |
| `username` | `string` | 是       | 用户名 (或注册时使用的手机号) |
| `password` | `string` | 是       | 用户密码                           |

**请求示例:**

```json
{
  "username": "your_username_or_phone",
  "password": "your_password"
}
```

### 返回结果

根据 `api.mdc` 规范，返回结果为 JSON 对象。

#### 成功返回

当 `error` 字段为 `0` 时，表示登录成功。

**返回示例:**

```json
{
    "error": 0,
    "body": {
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE2...",
        "user": {
            "id": "clxfa41ce0000123456789abc",
            "username": "testuser",
            "email": "test@example.com",
            "phone": "13800138000",
            "is_active": true,
            "is_superuser": false,
            "created_at": "2024-06-20T12:00:00Z"
        }
    },
    "message": ""
}
```

**`body` 字段说明:**

| 字段    | 类型   | 描述                                                         |
| ------- | ------ | ------------------------------------------------------------ |
| `token` | `string` | JWT 访问令牌。客户端需在后续请求的 `Authorization` 请求头中携带此令牌，格式为 `Bearer <token>`。 |
| `user`  | `object` | 用户基本信息对象。                                           |

#### 失败返回

当 `error` 字段为非 `0` 值时，表示登录失败。

**业务异常 (如用户名或密码错误):**

- `error`: `400`
- `message`: `"用户名或密码错误"`

**返回示例:**

```json
{
    "error": 400,
    "body": {},
    "message": "用户名或密码错误"
}
```

**业务异常 (如账户被禁用):**

- `error`: `403`
- `message`: `"账户已被禁用"`

**返回示例:**

```json
{
    "error": 403,
    "body": {},
    "message": "账户已被禁用"
}
```

**系统异常:**

- `error`: `500`
- `message`: (具体的系统错误信息)

---

## 2. 后续接口调用规范

登录成功后，客户端必须在所有后续需要认证的 API 请求的 `Header` 中添加 `Authorization` 字段，值为登录接口返回的 `token`。

- **Key**: `Authorization`
- **Value**: `Bearer <token>`  (注意 `Bearer` 和 `token` 之间有一个空格)

如果 `token` 无效或过期，后端将返回 `error` 为 `401` 的响应，此时客户端需要引导用户重新登录。 