#!/usr/bin/env python
"""
检查和修复用户的created_by_id字段
"""
import sys
sys.path.append('.')

from sqlalchemy import create_engine, text
from app.core.config import settings

# 创建数据库连接
engine = create_engine(str(settings.SQLALCHEMY_DATABASE_URI))

def check_and_fix_created_by_id():
    """检查和修复created_by_id字段"""
    with engine.connect() as conn:
        print("=" * 50)
        print("检查用户的created_by_id字段")
        print("=" * 50)
        
        # 1. 检查当前用户状态
        print("\n1. 当前用户状态:")
        result = conn.execute(text("""
            SELECT u1.id, u1.username, u1.role, u1.created_by_id, u2.username as creator_name
            FROM users u1
            LEFT JOIN users u2 ON u1.created_by_id = u2.id
            ORDER BY u1.role, u1.username
        """))
        users = result.fetchall()
        
        admin_users = []
        regular_users = []
        
        for user in users:
            user_id, username, role, created_by_id, creator_name = user
            if role == 'admin':
                admin_users.append((user_id, username))
            elif role == 'user':
                regular_users.append((user_id, username, created_by_id, creator_name))
            
            print(f"{username:<20} 角色: {role:<15} 创建者: {creator_name or '无':<20}")
        
        print(f"\n找到 {len(admin_users)} 个管理员用户")
        print(f"找到 {len(regular_users)} 个普通用户")
        
        # 2. 检查哪些普通用户没有创建者
        users_without_creator = [u for u in regular_users if u[2] is None]
        print(f"其中 {len(users_without_creator)} 个普通用户没有设置创建者")
        
        if users_without_creator and admin_users:
            print("\n需要修复的用户:")
            for user_id, username, _, _ in users_without_creator:
                print(f"  - {username}")
            
            # 3. 询问是否要修复
            print(f"\n发现 {len(admin_users)} 个管理员:")
            for i, (admin_id, admin_name) in enumerate(admin_users):
                print(f"  {i+1}. {admin_name}")
            
            if len(admin_users) == 1:
                # 如果只有一个管理员，自动分配
                admin_id, admin_name = admin_users[0]
                print(f"\n自动将所有无创建者的用户分配给管理员: {admin_name}")
                
                for user_id, username, _, _ in users_without_creator:
                    conn.execute(text("""
                        UPDATE users SET created_by_id = :admin_id WHERE id = :user_id
                    """), {"admin_id": admin_id, "user_id": user_id})
                    print(f"  ✓ 已将 {username} 的创建者设置为 {admin_name}")
                
                conn.commit()
                print("\n修复完成！")
                
            else:
                print("\n发现多个管理员，请手动指定分配关系")
                return
        
        # 4. 再次检查修复后的状态
        print("\n" + "=" * 50)
        print("修复后的用户状态:")
        print("=" * 50)
        
        result = conn.execute(text("""
            SELECT u1.username, u1.role, u2.username as creator_name
            FROM users u1
            LEFT JOIN users u2 ON u1.created_by_id = u2.id
            ORDER BY u1.role, u1.username
        """))
        users = result.fetchall()
        
        for username, role, creator_name in users:
            print(f"{username:<20} 角色: {role:<15} 创建者: {creator_name or '无':<20}")
        
        # 5. 检查管理员能看到的机器人
        print("\n" + "=" * 50)
        print("管理员权限范围检查:")
        print("=" * 50)
        
        result = conn.execute(text("SELECT id, username FROM users WHERE role = 'admin'"))
        admins = result.fetchall()
        
        for admin_id, admin_name in admins:
            print(f"\n管理员: {admin_name}")
            
            # 查询该管理员创建的用户
            result = conn.execute(text("""
                SELECT id, username FROM users 
                WHERE created_by_id = :admin_id
            """), {"admin_id": admin_id})
            created_users = result.fetchall()
            
            print(f"  创建的用户数: {len(created_users)}")
            user_ids = [admin_id]  # 包含管理员自己
            
            for user_id, username in created_users:
                print(f"    - {username}")
                user_ids.append(user_id)
            
            # 查询这些用户的机器人
            if user_ids:
                placeholders = ",".join([":id" + str(i) for i in range(len(user_ids))])
                params = {"id" + str(i): user_ids[i] for i in range(len(user_ids))}
                
                result = conn.execute(text(f"""
                    SELECT b.name, u.username as owner_name 
                    FROM wechat_bots b
                    JOIN users u ON b.owner_id = u.id
                    WHERE b.owner_id IN ({placeholders})
                """), params)
                
                bots = result.fetchall()
                print(f"  可管理的机器人数: {len(bots)}")
                for bot_name, owner_name in bots:
                    print(f"    * {bot_name} (所有者: {owner_name})")

if __name__ == "__main__":
    try:
        check_and_fix_created_by_id()
    except Exception as e:
        print(f"错误: {e}")
        import traceback
        traceback.print_exc() 