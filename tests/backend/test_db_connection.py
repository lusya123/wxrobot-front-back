import psycopg

# 测试数据库连接
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
    
    # 测试查询
    with conn.cursor() as cur:
        cur.execute("SELECT version()")
        version = cur.fetchone()
        print(f"PostgreSQL版本: {version[0]}")
        
        # 检查当前schema
        cur.execute("SELECT current_schema()")
        current_schema = cur.fetchone()[0]
        print(f"当前Schema: {current_schema}")
        
        # 检查users表是否存在
        cur.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'wxbot_pumeiren' 
                AND table_name = 'users'
            );
        """)
        table_exists = cur.fetchone()[0]
        print(f"users表是否存在: {table_exists}")
        
        # 如果表存在，查看表结构
        if table_exists:
            cur.execute("""
                SELECT column_name, data_type, is_nullable
                FROM information_schema.columns
                WHERE table_schema = 'wxbot_pumeiren' 
                AND table_name = 'users'
                ORDER BY ordinal_position;
            """)
            columns = cur.fetchall()
            print("\nusers表结构:")
            for col in columns:
                print(f"  - {col[0]}: {col[1]} (nullable: {col[2]})")
        
    conn.close()
    
except Exception as e:
    print(f"数据库连接失败: {e}") 