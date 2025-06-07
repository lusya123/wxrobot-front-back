import psycopg
from app.core.security import get_password_hash

# 更新superadmin密码
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
    
    # 新密码
    new_password = "admin123"
    new_hash = get_password_hash(new_password)
    print(f"新密码哈希: {new_hash}")
    
    with conn.cursor() as cur:
        # 更新密码
        cur.execute(
            "UPDATE users SET hashed_password = %s WHERE username = 'superadmin';",
            (new_hash,)
        )
        conn.commit()
        print("密码更新成功！")
        
        # 验证更新
        cur.execute("SELECT username, hashed_password FROM users WHERE username = 'superadmin';")
        user = cur.fetchone()
        print(f"更新后的哈希: {user[1]}")
    
    conn.close()
    
except Exception as e:
    print(f"更新失败: {e}") 