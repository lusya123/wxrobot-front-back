## 3. 机器人客户端 (PySide EXE) 修改

### 3.1. 登录逻辑

- **目标:** 使用账号密码登录，获取并持久化 Token。
- **修改:**
    1.  应用启动时，检查本地是否存有有效的 `access_token`。
    2.  如果没有，或 `access_token` 已过期，则显示一个登录窗口。
    3.  登录窗口要求输入「机器人账号」（如 Bot ID）和「密码」。
    4.  点击登录后，调用后端的 `POST /api/v1/bot-auth/login` 接口。
    5.  登录成功后，将返回的 `access_token` 和 `refresh_token` 安全地保存在本地配置文件中（例如，使用 `QSettings` 或加密的 SQLite 数据库）。

### 3.2. API 请求认证

- **目标:** 在所有与后端的通信中携带认证信息。
- **修改:**
    1.  封装一个统一的 API 请求函数或类。
    2.  在每次发起请求时，从本地存储中读取 `access_token`，并将其添加到请求头中：`Authorization: Bearer <token>`。

### 3.3. Token 刷新机制

- **目标:** 实现 `access_token` 的自动续期，避免频繁重新登录。
- **修改:**
    1.  当某个 API 请求因 Token 过期而失败时（通常后端会返回 401 Unauthorized），客户端应自动尝试使用 `refresh_token` 去调用一个新的端点（例如 `POST /api/v1/bot-auth/refresh`）来获取新的 `access_token`。
    2.  获取成功后，更新本地存储的 `access_token`，并重新发起刚才失败的请求。
    3.  如果 `refresh_token` 也失效了，则提示用户需要重新登录。 