"""测试唤醒词API功能"""
import requests
import json

# API基础URL
BASE_URL = "http://localhost:8000/api/v1"

# 测试用的登录凭据
USERNAME = "superadmin@example.com"
PASSWORD = "admin123"

def login():
    """登录获取token"""
    url = f"{BASE_URL}/auth/login"
    data = {
        "username": USERNAME,
        "password": PASSWORD
    }
    response = requests.post(url, data=data)
    if response.status_code == 200:
        return response.json()["access_token"]
    else:
        print(f"登录失败: {response.status_code} - {response.text}")
        return None

def get_bot_list(token):
    """获取机器人列表"""
    url = f"{BASE_URL}/wechat-accounts"
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(url, headers=headers)
    if response.status_code == 200:
        return response.json()["body"]["data"]
    else:
        print(f"获取机器人列表失败: {response.status_code} - {response.text}")
        return []

def update_bot_config(token, bot_id, wake_words):
    """更新机器人配置，设置唤醒词"""
    url = f"{BASE_URL}/wechat-accounts/{bot_id}"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    data = {
        "wake_words": wake_words
    }
    response = requests.put(url, headers=headers, json=data)
    if response.status_code == 200:
        return True
    else:
        print(f"更新配置失败: {response.status_code} - {response.text}")
        return False

def get_bot_config(token, bot_id):
    """获取机器人配置"""
    url = f"{BASE_URL}/wechat-accounts/{bot_id}"
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(url, headers=headers)
    if response.status_code == 200:
        return response.json()
    else:
        print(f"获取配置失败: {response.status_code} - {response.text}")
        return None

def main():
    print("=== 测试唤醒词API功能 ===\n")
    
    # 1. 登录
    print("1. 登录系统...")
    token = login()
    if not token:
        print("登录失败，退出测试")
        return
    print("✅ 登录成功\n")
    
    # 2. 获取机器人列表
    print("2. 获取机器人列表...")
    bots = get_bot_list(token)
    if not bots:
        print("没有找到机器人，请先创建一个机器人")
        return
    
    bot = bots[0]  # 使用第一个机器人进行测试
    bot_id = bot["id"]
    print(f"✅ 找到机器人: {bot['name']} (ID: {bot_id})\n")
    
    # 3. 获取当前配置
    print("3. 获取当前配置...")
    config = get_bot_config(token, bot_id)
    if config and config.get("config"):
        current_wake_words = config["config"].get("wake_words")
        print(f"当前唤醒词: {current_wake_words or '未设置'}\n")
    
    # 4. 更新唤醒词
    print("4. 更新唤醒词...")
    new_wake_words = "小助手,助手,你好,您好"
    if update_bot_config(token, bot_id, new_wake_words):
        print(f"✅ 成功设置唤醒词为: {new_wake_words}\n")
    else:
        print("❌ 设置唤醒词失败\n")
        return
    
    # 5. 验证更新
    print("5. 验证更新...")
    config = get_bot_config(token, bot_id)
    if config and config.get("config"):
        updated_wake_words = config["config"].get("wake_words")
        if updated_wake_words == new_wake_words:
            print(f"✅ 验证成功! 唤醒词已更新为: {updated_wake_words}")
        else:
            print(f"❌ 验证失败! 期望: {new_wake_words}, 实际: {updated_wake_words}")
    
    print("\n=== 测试完成 ===")

if __name__ == "__main__":
    main() 