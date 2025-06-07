# 微信智能销售助手 - 启动指南

## 后端启动

### 1. 进入后端目录
```bash
cd backend
```

### 2. 安装依赖（使用 uv）
```bash
# 如果没有安装 uv，先安装
curl -LsSf https://astral.sh/uv/install.sh | sh

# 安装项目依赖
uv pip install -r pyproject.toml
```

### 3. 运行数据库迁移（如果需要）
```bash
# 生成迁移文件
alembic revision --autogenerate -m "Initial migration"

# 执行迁移
alembic upgrade head
```

### 4. 初始化数据
```bash
python -m app.initial_data
```

### 5. 启动后端服务
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

后端将在 http://localhost:8000 启动

## 前端启动

### 1. 进入前端目录
```bash
cd wechat-sales-assistant
```

### 2. 安装依赖
```bash
npm install
# 或使用 pnpm
pnpm install
```

### 3. 设置环境变量
创建 `.env.local` 文件：
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 4. 启动前端服务
```bash
npm run dev
# 或
pnpm dev
```

前端将在 http://localhost:3000 启动

## 测试账号

系统初始化后，将创建以下测试账号：

- **超级管理员**
  - 用户名：superadmin
  - 密码：admin123
  - 邮箱：superadmin@example.com

## 功能测试

1. 访问 http://localhost:3000/login
2. 使用上述超级管理员账号登录
3. 登录成功后将跳转到主页面
4. 超级管理员可以创建普通管理员和用户账号

## API 文档

后端启动后，可以访问：
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## 常见问题

### 1. CORS 错误
确保后端的 CORS 配置中包含前端地址（默认已配置 http://localhost:3000）

### 2. 数据库连接错误
检查 `backend/app/core/config.py` 中的数据库配置是否正确

### 3. 登录失败
- 确保后端服务正在运行
- 检查前端的 API 地址配置是否正确
- 确保已运行初始化数据脚本创建超级管理员账号 