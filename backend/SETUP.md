# 项目环境设置指南

## Python环境要求
- Python 3.10或更高版本（<4.0）

## 安装步骤

### 1. 创建虚拟环境
```bash
python -m venv venv
```

### 2. 激活虚拟环境
```bash
# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate
```

### 3. 安装依赖

#### 生产环境
```bash
pip install -r requirements.txt
```

#### 开发环境（推荐）
```bash
pip install -r requirements-dev.txt
```

### 4. 使用UV包管理器（推荐）
项目使用UV作为包管理器，可以获得更快的依赖安装速度：

```bash
# 安装UV
pip install uv

# 使用UV安装依赖
uv pip install -r requirements.txt

# 或安装开发依赖
uv pip install -r requirements-dev.txt
```

## 主要依赖说明

### 核心框架
- **FastAPI**: 现代、快速的Web框架
- **SQLModel**: SQL数据库的现代ORM
- **Pydantic**: 数据验证和设置管理

### 数据库
- **PostgreSQL**: 主数据库（通过psycopg驱动）
- **Alembic**: 数据库迁移工具

### 认证和安全
- **Passlib**: 密码哈希
- **PyJWT**: JWT令牌处理
- **bcrypt**: 密码加密

### 开发工具
- **pytest**: 测试框架
- **mypy**: 静态类型检查
- **ruff**: 代码格式化和linting
- **pre-commit**: Git提交前钩子

## 环境配置
项目使用`.env`文件进行配置，请确保设置了必要的环境变量。

## 数据库迁移
```bash
# 生成迁移文件
alembic revision --autogenerate -m "描述信息"

# 运行迁移
alembic upgrade head
``` 