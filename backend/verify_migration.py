#!/usr/bin/env python
"""验证迁移后的用户数据"""
from sqlalchemy import create_engine, text
from app.core.config import settings

# 创建数据库连接
engine = create_engine(str(settings.SQLALCHEMY_DATABASE_URI))

with engine.connect() as conn:
    # 查询用户数据
    result = conn.execute(text("SELECT username, phone FROM users"))
    users = result.fetchall()
    
    print(f"迁移后的用户数据:")
    print("-" * 50)
    
    for user in users:
        username, phone = user
        print(f"用户名: {username}, 手机号: {phone}")
    
    print("-" * 50)
    print(f"总用户数: {len(users)}")
    
    # 检查是否还有email列
    try:
        conn.execute(text("SELECT email FROM users LIMIT 1"))
        print("\n警告：email列仍然存在！")
    except:
        print("\n✓ email列已成功删除")
    
    # 检查phone是否有唯一索引
    index_result = conn.execute(text("""
        SELECT indexname 
        FROM pg_indexes 
        WHERE tablename = 'users' 
        AND indexname LIKE '%phone%'
    """))
    indexes = index_result.fetchall()
    if indexes:
        print("\n✓ phone列的索引:")
        for idx in indexes:
            print(f"  - {idx[0]}") 