# 测试登录功能
import requests
import json

def test_login():
    url = "http://localhost:8001/api/v1/auth/login"
    
    # 测试数据
    test_cases = [
        {"username": "superadmin", "password": "admin123"},
        {"username": "admin@example.com", "password": "admin123"},
    ]
    
    for test_case in test_cases:
        print(f"\n测试: {test_case}")
        response = requests.post(url, json=test_case)
        print(f"状态码: {response.status_code}")
        
        try:
            result = response.json()
            print(f"响应内容: {json.dumps(result, indent=2, ensure_ascii=False)}")
        except:
            print(f"响应文本: {response.text}")

if __name__ == "__main__":
    test_login() 