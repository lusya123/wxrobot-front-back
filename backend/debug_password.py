import psycopg
from app.core.security import verify_password, get_password_hash

# 检查密码验证
try:
    conn = psycopg.connect(
        host="bj-postgres-qdwvh0rk.sql.tencentcdb.com",
        port=23171,
        user="admin",
        password="2001426xhY!",
        dbname="wx",
        options="-c search_path=wxbot_pumeiren"
    )
    print("数据库连接成功！")
    
    with conn.cursor() as cur:
        # 获取superadmin的密码哈希
        cur.execute("SELECT username, hashed_password FROM users WHERE username = 'superadmin';")
        user = cur.fetchone()
        
        if user:
            username, stored_hash = user
            print(f"用户名: {username}")
            print(f"存储的哈希: {stored_hash}")
            
            # 测试密码验证
            test_password = "admin123"
            is_valid = verify_password(test_password, stored_hash)
            print(f"密码 '{test_password}' 验证结果: {is_valid}")
            
            # 生成新的密码哈希看看格式
            new_hash = get_password_hash(test_password)
            print(f"新生成的哈希: {new_hash}")
            
            # 验证新哈希
            is_new_valid = verify_password(test_password, new_hash)
            print(f"新哈希验证结果: {is_new_valid}")
        else:
            print("未找到superadmin用户")
        
    conn.close()
    
except Exception as e:
    print(f"调试失败: {e}") 