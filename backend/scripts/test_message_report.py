"""
测试消息上报接口的脚本
"""
import requests
import json
import time
from datetime import datetime
import random

# API配置
API_BASE_URL = "http://localhost:8000/api"
AUTH_TOKEN = "your_auth_token_here"  # 需要替换成实际的认证令牌

# 测试数据
test_bot_wxid = "test_bot_001"
test_conversations = [
    {
        "id": "private_001",
        "type": "private",
        "topic": "张三",
        "participant": {"id": "wxid_zhang001", "name": "张三"}
    },
    {
        "id": "private_002", 
        "type": "private",
        "topic": "李四",
        "participant": {"id": "wxid_li002", "name": "李四"}
    },
    {
        "id": "group_001@chatroom",
        "type": "group",
        "topic": "产品交流群",
        "participants": [
            {"id": "wxid_wang003", "name": "王五"},
            {"id": "wxid_zhao004", "name": "赵六"},
            {"id": "wxid_chen005", "name": "陈七"}
        ]
    }
]

# 测试消息内容
test_messages = [
    "你好，我想了解一下你们的产品",
    "这个产品的价格是多少？",
    "有没有优惠活动？",
    "可以提供试用吗？",
    "我想预约一个演示",
    "产品的主要功能有哪些？",
    "售后服务怎么样？",
    "可以定制开发吗？",
    "支付方式有哪些？",
    "多久可以交付？"
]

def report_message(conversation, sender, message_content):
    """上报一条消息"""
    url = f"{API_BASE_URL}/internal/message/report"
    
    # 构建请求数据
    data = {
        "bot_id": test_bot_wxid,
        "conversation_id": conversation["id"],
        "conversation_topic": conversation["topic"],
        "conversation_type": conversation["type"],
        "sender": sender,
        "message": {
            "id": f"msg_{int(time.time() * 1000)}",
            "type": "text",
            "content": message_content,
            "timestamp": int(time.time())
        }
    }
    
    # 如果是群聊，添加参与者列表
    if conversation["type"] == "group":
        data["participants"] = conversation["participants"]
    
    # 发送请求
    headers = {
        "Authorization": f"Bearer {AUTH_TOKEN}",
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.post(url, json=data, headers=headers)
        if response.status_code == 200:
            result = response.json()
            if result["error"] == 0:
                print(f"✓ 消息上报成功: {sender['name']} 在 {conversation['topic']}: {message_content[:20]}...")
            else:
                print(f"✗ 消息上报失败: {result['message']}")
        else:
            print(f"✗ HTTP错误: {response.status_code}")
    except Exception as e:
        print(f"✗ 请求异常: {str(e)}")

def main():
    """主函数"""
    print("开始测试消息上报...")
    print(f"API地址: {API_BASE_URL}")
    print("-" * 50)
    
    # 模拟私聊消息
    for conv in test_conversations[:2]:  # 前两个是私聊
        for i in range(3):
            message = random.choice(test_messages)
            report_message(conv, conv["participant"], message)
            time.sleep(1)  # 间隔1秒
    
    # 模拟群聊消息
    group_conv = test_conversations[2]
    for i in range(5):
        sender = random.choice(group_conv["participants"])
        message = random.choice(test_messages)
        report_message(group_conv, sender, message)
        time.sleep(1)
    
    print("-" * 50)
    print("测试完成!")

if __name__ == "__main__":
    # 提示用户设置认证令牌
    print("请确保已设置正确的AUTH_TOKEN!")
    print("你可以通过以下步骤获取令牌:")
    print("1. 启动后端服务: cd backend && uvicorn app.main:app --reload")
    print("2. 访问前端登录: http://localhost:3000/login")
    print("3. 登录后从浏览器开发者工具的localStorage中获取auth_token")
    print("")
    
    # 询问是否继续
    confirm = input("是否已设置好AUTH_TOKEN并继续测试? (y/n): ")
    if confirm.lower() == 'y':
        main()
    else:
        print("请先设置AUTH_TOKEN后再运行此脚本") 