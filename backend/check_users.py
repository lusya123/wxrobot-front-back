import psycopg

# 查看数据库中的用户
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
        # 查看所有用户
        cur.execute("SELECT username, email, role, is_active, created_at FROM users;")
        users = cur.fetchall()
        
        print("\n数据库中的用户:")
        for user in users:
            print(f"用户名: {user[0]}, 邮箱: {user[1]}, 角色: {user[2]}, 激活: {user[3]}, 创建时间: {user[4]}")
        
    conn.close()
    
except Exception as e:
    print(f"查询失败: {e}") 