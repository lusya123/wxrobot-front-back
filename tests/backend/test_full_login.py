# 完整的登录和API测试
import requests
import json

def test_full_login_flow():
    base_url = "http://localhost:8001"
    
    # 1. 测试登录
    login_url = f"{base_url}/api/v1/auth/login"
    login_data = {"username": "superadmin", "password": "admin123"}
    
    print("=== 测试登录 ===")
    login_response = requests.post(login_url, json=login_data)
    print(f"登录状态码: {login_response.status_code}")
    
    if login_response.status_code == 200:
        login_result = login_response.json()
        print(f"登录响应: {json.dumps(login_result, indent=2, ensure_ascii=False)}")
        
        if login_result.get('error') == 0:
            token = login_result['body']['token']
            print(f"\n获取到Token: {token[:30]}...")
            
            # 2. 测试获取当前用户信息
            print("\n=== 测试获取当前用户信息 ===")
            headers = {"Authorization": f"Bearer {token}"}
            me_url = f"{base_url}/api/v1/users/me"
            
            me_response = requests.get(me_url, headers=headers)
            print(f"用户信息状态码: {me_response.status_code}")
            
            if me_response.status_code == 200:
                me_result = me_response.json()
                print(f"用户信息: {json.dumps(me_result, indent=2, ensure_ascii=False)}")
            else:
                print(f"获取用户信息失败: {me_response.text}")
            
            # 3. 测试获取用户列表（需要超级管理员权限）
            print("\n=== 测试获取用户列表 ===")
            users_url = f"{base_url}/api/v1/users/"
            users_response = requests.get(users_url, headers=headers)
            print(f"用户列表状态码: {users_response.status_code}")
            
            if users_response.status_code == 200:
                users_result = users_response.json()
                print(f"用户列表: {json.dumps(users_result, indent=2, ensure_ascii=False)}")
            else:
                print(f"获取用户列表失败: {users_response.text}")
        else:
            print(f"登录失败: {login_result.get('message')}")
    else:
        print(f"登录请求失败: {login_response.text}")

if __name__ == "__main__":
    test_full_login_flow() 