#!/usr/bin/env python
"""更新临时手机号为符合格式的号码"""
from sqlalchemy import create_engine, text
from app.core.config import settings

# 创建数据库连接
engine = create_engine(str(settings.SQLALCHEMY_DATABASE_URI))

# 预定义的测试手机号
test_phones = {
    'xuehongyu': '13800138001',
    'superadmin': '13800138002',
    'admin': '13800138003'
}

with engine.connect() as conn:
    # 开始事务
    trans = conn.begin()
    
    try:
        # 查询用户数据
        result = conn.execute(text("SELECT id, username, phone FROM users"))
        users = result.fetchall()
        
        print("更新手机号码：")
        print("-" * 50)
        
        for user_id, username, phone in users:
            if phone.startswith('1000'):
                # 使用预定义的手机号或生成一个
                new_phone = test_phones.get(username, f'138{str(hash(username))[-8:]}')
                if len(new_phone) > 11:
                    new_phone = new_phone[:11]
                    
                conn.execute(
                    text("UPDATE users SET phone = :phone WHERE id = :id"),
                    {"phone": new_phone, "id": user_id}
                )
                print(f"{username}: {phone} -> {new_phone}")
        
        # 提交事务
        trans.commit()
        print("-" * 50)
        print("✓ 手机号码更新完成！")
        
    except Exception as e:
        trans.rollback()
        print(f"✗ 更新失败: {e}")
        raise 