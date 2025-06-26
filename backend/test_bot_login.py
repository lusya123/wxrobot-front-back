#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
微信机器人登录功能测试脚本
"""
import requests
import json
import os
import sys

# 配置
BASE_URL = "http://localhost:8000"
API_VERSION = "/api/v1"

def test_normal_user_login():
    """测试普通用户登录"""
    print("=== 测试普通用户登录 ===")
    
    url = f"{BASE_URL}{API_VERSION}/auth/login"
    
    # 根据TEST_ACCOUNTS.md中的测试数据
    test_cases = [
        {"username": "superadmin", "password": "admin123"},
    ]
    
    for test_case in test_cases:
        print(f"\n测试用户: {test_case['username']}")
        try:
            response = requests.post(url, json=test_case, timeout=10)
            print(f"状态码: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                print(f"响应内容: {json.dumps(result, indent=2, ensure_ascii=False)}")
                
                if result.get('error') == 0:
                    print("✅ 普通用户登录成功!")
                    return result['body']['token']
                else:
                    print(f"❌ 登录失败: {result.get('message')}")
            else:
                print(f"❌ HTTP错误: {response.text}")
                
        except requests.exceptions.RequestException as e:
            print(f"❌ 请求异常: {e}")
        except Exception as e:
            print(f"❌ 其他异常: {e}")
    
    return None

def test_bot_login():
    """测试真实的机器人登录"""
    print("\n=== 测试微信机器人登录 ===")
    
    url = f"{BASE_URL}{API_VERSION}/bot-auth/login"
    
    # 使用机器人名称登录
    # 机器人名称：123，密码：010426
    test_case = {"username": "123", "password": "010426"}
    
    print(f"\n测试机器人登录 - 用户名: {test_case['username']}, 密码: {test_case['password']}")
    try:
        response = requests.post(url, json=test_case, timeout=10)
        print(f"状态码: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"响应内容: {json.dumps(result, indent=2, ensure_ascii=False)}")
            
            if result.get('error') == 0:
                print("✅ 机器人登录成功!")
                return result['body']['access_token']
            else:
                print(f"❌ 机器人登录失败: {result.get('message')}")
        else:
            print(f"❌ HTTP错误: {response.text}")
            
    except requests.exceptions.RequestException as e:
        print(f"❌ 请求异常: {e}")
    except Exception as e:
        print(f"❌ 其他异常: {e}")
    
    return None

def test_bot_token_refresh(access_token):
    """测试机器人Token刷新"""
    print("\n=== 测试机器人Token刷新 ===")
    
    if not access_token:
        print("❌ 没有有效的access_token，跳过刷新测试")
        return
    
    # 先重新登录获取refresh_token
    login_url = f"{BASE_URL}{API_VERSION}/bot-auth/login"
    
    # 使用机器人名称重新登录获取refresh_token
    login_data = {"username": "123", "password": "010426"}
    
    try:
        login_response = requests.post(login_url, json=login_data, timeout=10)
        if login_response.status_code == 200:
            login_result = login_response.json()
            if login_result.get('error') == 0:
                refresh_token = login_result['body'].get('refresh_token')
                if refresh_token:
                    print(f"✅ 使用机器人名称 {login_data['username']} 登录成功，开始测试Token刷新")
                    
                    # 测试刷新Token
                    refresh_url = f"{BASE_URL}{API_VERSION}/bot-auth/refresh"
                    refresh_data = {"refresh_token": refresh_token}
                    
                    refresh_response = requests.post(refresh_url, json=refresh_data, timeout=10)
                    print(f"刷新Token状态码: {refresh_response.status_code}")
                    
                    if refresh_response.status_code == 200:
                        refresh_result = refresh_response.json()
                        print(f"刷新响应: {json.dumps(refresh_result, indent=2, ensure_ascii=False)}")
                        if refresh_result.get('error') == 0:
                            print("✅ Token刷新成功!")
                            return
                        else:
                            print(f"❌ Token刷新失败: {refresh_result.get('message')}")
                    else:
                        print(f"❌ 刷新请求失败: {refresh_response.text}")
                else:
                    print("❌ 登录响应中没有refresh_token")
                    
    except requests.exceptions.RequestException as e:
        print(f"❌ 请求异常: {e}")
    except Exception as e:
        print(f"❌ 其他异常: {e}")
    
    print("❌ 无法获取有效的refresh_token进行测试")

def check_api_health():
    """检查API健康状态"""
    print("=== 检查API健康状态 ===")
    
    try:
        # 检查API文档是否可访问
        docs_url = f"{BASE_URL}/docs"
        response = requests.get(docs_url, timeout=10)
        
        if response.status_code == 200:
            print("✅ API服务运行正常，可以访问Swagger文档")
            return True
        else:
            print(f"❌ API服务状态异常: {response.status_code}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ 无法连接到API服务: {e}")
        print("请确保后端服务正在运行在 http://localhost:8000")
        return False

def check_existing_bots():
    """检查现有的机器人账号（需要管理员权限）"""
    print("\n=== 检查现有机器人账号 ===")
    
    # 先登录获取管理员token
    login_url = f"{BASE_URL}{API_VERSION}/auth/login"
    login_data = {"username": "superadmin", "password": "admin123"}
    
    try:
        login_response = requests.post(login_url, json=login_data, timeout=10)
        if login_response.status_code == 200:
            login_result = login_response.json()
            if login_result.get('error') == 0:
                token = login_result['body']['token']
                headers = {"Authorization": f"Bearer {token}"}
                
                # 获取微信账号列表
                bots_url = f"{BASE_URL}{API_VERSION}/wechat-accounts/"
                bots_response = requests.get(bots_url, headers=headers, timeout=10)
                
                if bots_response.status_code == 200:
                    bots_result = bots_response.json()
                    print(f"现有机器人账号: {json.dumps(bots_result, indent=2, ensure_ascii=False)}")
                    return bots_result
                else:
                    print(f"❌ 获取机器人列表失败: {bots_response.text}")
            else:
                print(f"❌ 管理员登录失败: {login_result.get('message')}")
        else:
            print(f"❌ 管理员登录请求失败: {login_response.text}")
            
    except requests.exceptions.RequestException as e:
        print(f"❌ 请求异常: {e}")
    except Exception as e:
        print(f"❌ 其他异常: {e}")
    
    return None

def main():
    """主测试函数"""
    print("🤖 微信机器人登录功能测试")
    print("=" * 50)
    print("测试机器人账号：123")
    print("测试密码：010426")
    print("=" * 50)
    
    # 1. 检查API健康状态
    if not check_api_health():
        print("\n❌ API服务不可用，测试终止")
        sys.exit(1)
    
    # 2. 检查现有机器人账号
    check_existing_bots()
    
    # 3. 测试普通用户登录
    user_token = test_normal_user_login()
    
    # 4. 测试机器人登录
    bot_token = test_bot_login()
    
    # 5. 测试机器人Token刷新
    test_bot_token_refresh(bot_token)
    
    print("\n" + "=" * 50)
    print("测试完成!")
    
    if user_token:
        print("✅ 普通用户登录: 成功")
    else:
        print("❌ 普通用户登录: 失败")
    
    if bot_token:
        print("✅ 机器人登录: 成功")
    else:
        print("❌ 机器人登录: 失败")

if __name__ == "__main__":
    main() 