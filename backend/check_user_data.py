#!/usr/bin/env python
"""检查用户数据中的邮箱和手机号情况"""
from sqlalchemy import create_engine, text
from app.core.config import settings

# 创建数据库连接
engine = create_engine(str(settings.SQLALCHEMY_DATABASE_URI))

with engine.connect() as conn:
    # 查询用户数据
    result = conn.execute(text("SELECT username, email, phone FROM users"))
    users = result.fetchall()
    
    print(f"总用户数: {len(users)}")
    print("-" * 50)
    
    missing_phone = []
    for user in users:
        username, email, phone = user
        print(f"用户名: {username}, 邮箱: {email}, 手机号: {phone or '未设置'}")
        if not phone:
            missing_phone.append((username, email))
    
    print("-" * 50)
    if missing_phone:
        print(f"\n发现 {len(missing_phone)} 个用户没有手机号:")
        for username, email in missing_phone:
            print(f"  - {username} ({email})")
    else:
        print("\n所有用户都有手机号，可以安全进行迁移。") 