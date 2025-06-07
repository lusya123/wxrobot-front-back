import time
from wxautox import WeChat
import re
from cozepy import Coze, TokenAuth, Message, ChatStatus, MessageContentType, ChatEventType, COZE_CN_BASE_URL

def log(message):
    """日志输出函数"""
    current_time = time.strftime('%Y-%m-%d %H:%M:%S', time.localtime())
    print(f"[{current_time}] {message}")

class WeChatBot:
    def __init__(self):
        """初始化微信机器人"""
        self.wx = None
        self.all_Mode_listen_list = []  # 监听列表，格式: [[chat_id, timestamp], ...]
        
        # 获取用户输入的配置
        print("=== 微信机器人配置 ===")
        coze_api_token = input("请输入 Coze API Token(pat_xxx): ")
        coze_bot_id = input("请输入机器人ID: ")
        chatgroup = input("请输入要监听的群聊(多个群聊用-分隔): ")
        chatgroups = [group.strip() for group in chatgroup.split("-")]  # 将输入的群聊字符串分割成列表
        
        wake_words = input("请输入唤醒词(多个唤醒词用-分隔，留空则只响应@消息): ")
        wake_words_list = [word.strip() for word in wake_words.split("-") if word.strip()] if wake_words.strip() else []
        
        # 配置参数
        self.config = {
            'listen_list': chatgroups,  # 要监听的群聊列表
            'chat_timeout': 180,  # 会话超时时间（秒）
            'main_timeout': 10,  # 主循环超时时间（秒）
            'loop_interval': 1,  # 循环间隔时间（秒）
            'coze_api_token': coze_api_token,  # 扣子API Token
            'coze_bot_id': coze_bot_id,  # 扣子机器人ID
            'wake_words': wake_words_list,  # 唤醒词列表
        }
        
        # 初始化扣子客户端
        self.coze = Coze(auth=TokenAuth(self.config['coze_api_token']), base_url=COZE_CN_BASE_URL)
        
        self.init_wechat()
        
        # 初始化@提及关键词列表（需要在微信初始化后获取昵称）
        self.mention_keywords = []
        if self.wx:
            try:
                nickname = self.wx.nickname
                self.mention_keywords = [
                    f"@{nickname}",  # @昵称
                ]
                log(f"初始化@提及关键词: {self.mention_keywords}")
            except Exception as e:
                log(f"获取微信昵称失败: {e}")
                self.mention_keywords = []
    
    def init_wechat(self):
        """初始化微信连接"""
        try:
            log("正在初始化微信连接...")
            self.wx = WeChat()
            log("微信连接初始化成功")
            return True
        except Exception as e:
            log(f"微信连接初始化失败: {e}")
            return False
    
    def is_mentioned(self, message):
        """检查消息中是否包含@提及方式"""
        if not message or not self.mention_keywords:
            return False
        return any(keyword in message for keyword in self.mention_keywords)
    
    def contains_wake_words(self, message):
        """检查消息中是否包含唤醒词"""
        if not message or not self.config['wake_words']:
            return False
        return any(wake_word in message for wake_word in self.config['wake_words'])
    
    def should_respond_to_message(self, message_content):
        """
        判断是否应该回复该消息
        返回: (should_respond: bool, processed_content: str)
        """
        if not message_content or not message_content.strip():
            return False, ""
        
        # 检查是否被@了
        if self.is_mentioned(message_content):
            # 移除@提及部分，提取用户问题
            processed_content = message_content
            for keyword in self.mention_keywords:
                processed_content = processed_content.replace(keyword, "").strip()
            return True, processed_content
        
        # 检查是否包含唤醒词
        if self.contains_wake_words(message_content):
            return True, message_content.strip()
        
        return False, ""
    
    def new_msg_get_plus(self, chat_records):
        """
        处理聊天记录过滤逻辑:
        1. 过滤类型为 SYS 与 Recall 的消息 (保留 Time 消息)
        2. 识别 SYS 消息中的时间信息（如 ['SYS', '13:11']）并将其转换为 Time 消息
        3. 如果存在 Self 消息, 则:
            a. 删除掉最新一条 Self 消息及其之前的所有消息,
               仅保留最新 Self 消息之后的记录;
            b. 在该记录中查找最新 (最后出现) 的 Time 消息,
               如果存在, 则仅保留该 Time 消息之后的对方消息 (过滤掉 Self 和 Time) ;
               否则返回最新 Self 消息之后的所有记录.
        4. 如果没有 Self 消息, 则查找过滤后的最新 (最后出现) 的 Time 消息.
           如果存在, 则返回该消息之后的所有对方消息 (过滤掉 Self 和 Time) ;
           否则返回过滤后的所有消息.
        """
        
        # 时间格式正则表达式，匹配如 "13:11", "09:30", "23:59" 等
        time_pattern = re.compile(r'^\d{1,2}:\d{2}$')
        
        # 将消息转换为统一格式并识别时间消息
        filtered = []
        for msg in chat_records:
            # 处理列表格式的消息 [sender, content]
            if isinstance(msg, list) and len(msg) >= 2:
                sender = msg[0]
                content = msg[1]
                
                # 识别 SYS 消息中的时间信息
                if sender == "SYS":
                    # 检查是否为时间消息
                    if time_pattern.match(content.strip()):
                        # 将时间 SYS 消息转换为 Time 消息
                        filtered.append(["Time", content, msg])
                    # 否则过滤掉其他 SYS 消息（如安全提示、撤回消息等）
                elif sender not in ("Recall",):
                    # 保留非 SYS 和非 Recall 的消息
                    filtered.append([sender, content, msg])
                    
            # 处理消息对象格式（兼容原有逻辑）
            elif hasattr(msg, 'sender') and hasattr(msg, 'content'):
                # 根据消息类型判断sender
                if hasattr(msg, 'type'):
                    if msg.type == 'sys':
                        # 检查是否为时间消息
                        if time_pattern.match(msg.content.strip()):
                            sender = "Time"
                        else:
                            continue  # 跳过非时间的 SYS 消息
                    elif msg.type == 'time':
                        sender = "Time"
                    elif msg.type == 'recall':
                        sender = "Recall"
                    elif msg.type == 'self':
                        sender = "Self"
                    elif msg.type == 'friend':
                        sender = msg.sender
                    else:
                        sender = msg.sender
                else:
                    sender = msg.sender
                
                # 过滤掉 Recall 消息
                if sender not in ("Recall",):
                    filtered.append([sender, msg.content, msg])
        
        # 判断是否存在 Self 消息
        if any(msg[0] == "Self" for msg in filtered):
            # 找到最新 Self 消息的索引
            latest_self_index = None
            for idx, msg in enumerate(filtered):
                if msg[0] == "Self":
                    latest_self_index = idx
            
            if latest_self_index is not None:
                # 保留最新 Self 消息之后的记录
                post_self = filtered[latest_self_index + 1:]
                
                # 在最新 Self 消息之后查找最新的 Time 消息
                latest_time_index = None
                for idx, msg in enumerate(post_self):
                    if msg[0] == "Time":
                        latest_time_index = idx
                
                if latest_time_index is not None:
                    # 返回该 Time 消息之后的对方消息
                    post_time = post_self[latest_time_index + 1:]
                    final_records = [msg for msg in post_time if msg[0] not in ("Self", "Time")]
                    return final_records
                else:
                    # 未找到 Time 消息，返回最新 Self 消息之后的所有对方消息
                    return [msg for msg in post_self if msg[0] not in ("Self", "Time")]
        else:
            # 没有 Self 消息，查找过滤后的最新 Time 消息
            latest_time_index = None
            for idx, msg in enumerate(filtered):
                if msg[0] == "Time":
                    latest_time_index = idx
            
            if latest_time_index is not None:
                # 返回该 Time 消息之后的对方消息
                post_time = filtered[latest_time_index + 1:]
                final_records = [msg for msg in post_time if msg[0] not in ("Self", "Time")]
                return final_records
            else:
                # 若也没有 Time 消息，返回过滤后的所有对方消息
                return [msg for msg in filtered if msg[0] not in ("Self", "Time")]
    
    def next_message_handle(self):
        """处理next获取到的新消息，防止黑色流程漏洞消息"""
        try:
            all_message = self.wx.GetAllMessage()
            # print("all_message为: ",all_message)
            new_msg = self.new_msg_get_plus(all_message)
            # print("过滤后的new_msg为: ", new_msg)
            return new_msg
        except Exception as e:
            log(f"获取消息时出错: {e}")
            return []
    
    def add_chat_to_listen(self, chat):
        """将会话添加到监听列表，并调用添加监听的接口"""
        # 检查是否在监听名单中
        if self.config['listen_list'] and chat not in self.config['listen_list']:
            log(f"'{chat}' 不在监听名单中，拒绝添加到监听列表")
            return False
        
        log(f"chat '{chat}' 不在监听列表，正在添加到列表")
        self.all_Mode_listen_list.append([chat, time.time()])
        log(f"当前监听列表: {[item[0] for item in self.all_Mode_listen_list]}")
        try:
            self.wx.AddListenChat(chat)
            log(f"成功添加 '{chat}' 到微信监听")
            return True
        except Exception as e:
            log(f"添加监听失败 '{chat}': {e}")
            # 如果添加失败，从列表中移除
            self.all_Mode_listen_list = [item for item in self.all_Mode_listen_list if item[0] != chat]
            return False
    
    def is_chat_listened(self, chat):
        """判断当前会话是否已经在监听列表中"""
        return any(listen_chat[0] == chat for listen_chat in self.all_Mode_listen_list)
    
    def process_message(self, chat_obj, message_data):
        """
        处理单条消息 - 这里是消息处理的核心逻辑
        使用扣子API进行智能回复
        """
        try:
            # 获取聊天对象信息
            chat_info = chat_obj.who if hasattr(chat_obj, 'who') else str(chat_obj)
            
            # 获取消息内容
            sender = message_data[0] if len(message_data) > 0 else "Unknown"
            content = message_data[1] if len(message_data) > 1 else ""
            msg_obj = message_data[2] if len(message_data) > 2 else None
            
            log(f"收到消息 - 聊天: {chat_info}, 发送者: {sender}, 内容: {content}")
            
            # 检查是否应该回复该消息（@或唤醒词）
            should_respond, processed_content = self.should_respond_to_message(content)
            
            if should_respond and processed_content.strip():
                log(f"触发回复条件 - 聊天: {chat_info}, 发送者: {sender}, 处理后内容: {processed_content}")
                
                # 调用扣子API生成回复
                ai_response = self.call_ai_api(processed_content, sender, chat_info)
                
                if ai_response and ai_response.strip():
                    # 发送回复消息，@发送消息的人
                    try:
                        # 切换到对应聊天窗口并发送消息
                        # self.wx.ChatWith(chat_info)
                        self.wx.SendMsg(ai_response, who=chat_info)
                        log(f"已回复 {chat_info}: {ai_response}，并@了 {sender}")
                    except Exception as e:
                        log(f"发送回复失败: {e}")
                else:
                    log(f"扣子API未返回有效回复，跳过发送")
            else:
                log(f"消息未触发回复条件或内容为空，跳过处理")
            
        except Exception as e:
            log(f"处理消息时出错: {e}")

    def process_messages_with_ai(self, chat_id, processed_new_msg_list):
        """
        新的消息处理函数 - 直接处理processed_new_msg_list并调用大模型API
        """
        try:
            log(f"开始处理聊天 '{chat_id}' 的消息列表，共 {len(processed_new_msg_list)} 条消息")
            
            # 遍历处理每条消息
            for msg_data in processed_new_msg_list:
                try:
                    # 获取消息内容
                    sender = msg_data[0] if len(msg_data) > 0 else "Unknown"
                    content = msg_data[1] if len(msg_data) > 1 else ""
                    msg_obj = msg_data[2] if len(msg_data) > 2 else None
                    
                    log(f"检查消息 - 聊天: {chat_id}, 发送者: {sender}, 内容: {content}")
                    
                    # 只处理非系统消息和非自己发送的消息
                    if sender not in ("Self", "Time", "SYS", "Recall", "Unknown") and content.strip():
                        # 检查是否应该回复该消息（@或唤醒词）
                        should_respond, processed_content = self.should_respond_to_message(content)
                        
                        if should_respond:
                            log(f"触发回复条件 - 聊天: {chat_id}, 发送者: {sender}, 处理后内容: {processed_content}")
                            
                            # 调用大模型API生成回复
                            ai_response = self.call_ai_api(processed_content, sender, chat_id)
                            
                            if ai_response and ai_response.strip():
                                # 发送回复消息，@发送消息的人
                                try:
                                    # 切换到对应聊天窗口
                                    self.wx.ChatWith(chat_id)
                                    # 发送消息，@发送消息的人
                                    self.wx.SendMsg(ai_response, who=chat_id)
                                    log(f"已回复 {chat_id}: {ai_response}，并@了 {sender}")
                                except Exception as e:
                                    log(f"发送回复失败给 {chat_id}: {e}")
                            else:
                                log(f"大模型未返回有效回复，跳过发送")
                        else:
                            log(f"消息未触发回复条件，跳过处理")
                    else:
                        log(f"跳过处理消息: sender={sender}, content_empty={not content.strip()}")
                        
                except Exception as e:
                    log(f"处理单条消息时出错: {e}")
                    
        except Exception as e:
            log(f"处理消息列表时出错: {e}")
    
    def call_ai_api(self, content, sender, chat_id):
        """
        调用大模型API生成回复
        使用扣子API进行回复
        """
        try:
            # 构建消息内容
            user_question = f"{sender} 向你提问: {content}"
            log(f"调用扣子API处理消息: {user_question}")
            
            # 调用扣子API获取回复
            chat_poll = self.coze.chat.create_and_poll(
                bot_id=self.config['coze_bot_id'],
                user_id=sender,  # 使用发送者名称作为用户ID
                additional_messages=[
                    Message.build_user_question_text(user_question),
                ],
            )
            
            # 获取机器人回复
            if chat_poll.messages and len(chat_poll.messages) > 0:
                # 根据消息数组长度确定回复内容的位置
                if len(chat_poll.messages) == 5:
                    index = 0
                elif len(chat_poll.messages) == 6:
                    index = 1
                else:
                    index = -1
                
                if index >= 0:
                    assistant_reply = chat_poll.messages[index].content
                    # 删除多余的换行符
                    assistant_reply = re.sub(r"\n{2,}", "\n", assistant_reply)
                    log(f"扣子API回复成功")
                    return assistant_reply
                else:
                    log("扣子API回复格式异常")
                    return "抱歉，未能获取到有效回复"
            else:
                log("扣子API未返回消息")
                return "抱歉，未能获取到回复"
                
        except Exception as e:
            log(f"调用扣子API时出错: {e}")
            return "服务器错误，请稍后再试"
    
    def process_new_messages(self):
        """处理获取到的新消息，对好友消息进行监听及消息处理"""
        try:
            messages_new = self.wx.GetNextNewMessage()
            
            for chat_id, messages in messages_new.items():
                # 检查是否在监听名单中（只处理名单中的群）
                if not self.config['listen_list'] or chat_id not in self.config['listen_list']:
                    log(f"{chat_id} 不在监听名单中，跳过处理")
                    continue
                
                # 获取过滤后的消息
                processed_new_msg_list = self.next_message_handle()
                print("processed_new_msg_list为: ",processed_new_msg_list)
                # 检查是否在监听列表中
                if not self.is_chat_listened(chat_id):
                    self.add_chat_to_listen(chat_id)
                else:
                    log(f"chat '{chat_id}' 在监听列表")
                
                # 直接处理过滤后的消息，使用新的AI处理函数
                try:
                    self.process_messages_with_ai(chat_id, processed_new_msg_list)
                except Exception as e:
                    log(f"处理消息时出错: {e}")
                    
        except Exception as e:
            log(f"处理新消息时出错: {e}")
    
    def process_listen_messages(self):
        """处理监听中的会话消息，同时更新对应会话的最新消息时间"""
        try:
            messages_dict = self.wx.GetListenMessage()
            # print("当前为process_listen_messages函数，messages_dict为: ",messages_dict)
            for chat_obj, message_list in messages_dict.items():
                # 获取聊天标识符
                chat_identifier = None
                if hasattr(chat_obj, 'who'):
                    chat_identifier = chat_obj.who
                elif hasattr(chat_obj, 'id'):
                    chat_identifier = chat_obj.id
                else:
                    chat_identifier = str(chat_obj)
                    log(f"Warning: 使用字符串作为聊天标识符: {chat_identifier}")
                
                # 检查是否在监听名单中
                if chat_identifier and self.config['listen_list'] and chat_identifier not in self.config['listen_list']:
                    log(f"'{chat_identifier}' 不在监听名单中，跳过处理监听消息")
                    continue
                
                for message_obj in message_list:
                    if chat_identifier:
                        # 更新监听列表中的时间戳
                        updated = False
                        for listen_chat_entry in self.all_Mode_listen_list:
                            if listen_chat_entry[0] == chat_identifier:
                                log(f"{chat_identifier} 对话最新消息时间已更新")
                                listen_chat_entry[1] = time.time()
                                updated = True
                                break
                        
                        if not updated:
                            log(f"Warning: 监听列表中未找到 '{chat_identifier}'")
                    
                    # 将message_obj转换为message_data格式
                    sender = message_obj.sender if hasattr(message_obj, 'sender') else "Unknown"
                    content = message_obj.content if hasattr(message_obj, 'content') else ""
                    message_data = [sender, content, message_obj]
                    
                    # 过滤消息：排除自己发送的消息、系统消息和"查看更多消息"等系统提示
                    if (sender != "Self" and 
                        sender != "SYS" and 
                        content != "查看更多消息" and
                        not (hasattr(message_obj, 'type') and message_obj.type == 'sys')):
                        # 处理消息
                        self.process_message(chat_obj, message_data)
                    else:
                        log(f"跳过处理消息: sender={sender}, content={content[:20]}...")
                    
        except Exception as e:
            log(f"处理监听消息时出错: {e}")
    
    def remove_timeout_listen(self):
        """删除超时的监听会话"""
        chat_time_out = self.config['chat_timeout']
        
        # 遍历副本以安全删除
        for listen_chat_entry in self.all_Mode_listen_list[:]:
            if time.time() - listen_chat_entry[1] >= chat_time_out:
                chat_id_to_remove = listen_chat_entry[0]
                log(f"{chat_id_to_remove} 对话超时，正在删除监听")
                
                try:
                    self.wx.RemoveListenChat(who=chat_id_to_remove)
                    self.all_Mode_listen_list.remove(listen_chat_entry)
                    log(f"成功删除超时监听: {chat_id_to_remove}")
                except Exception as e:
                    log(f"删除监听失败 {chat_id_to_remove}: {e}")
    
    def AllListen_mode(self, last_time):
        """全局监听模式"""
        timeout = self.config['main_timeout']
        
        # 处理新消息
        self.process_new_messages()
        
        # 处理监听消息
        self.process_listen_messages()
        
        # 检查是否需要清理超时会话
        if time.time() - last_time >= timeout:
            self.remove_timeout_listen()
            return time.time()
        
        return last_time
    
    def run(self):
        """运行微信机器人"""
        if not self.wx:
            log("微信连接失败，无法启动机器人")
            return
        
        log("微信机器人启动成功，开始监听消息...")
        log(f"配置信息:")
        log(f"  - 监听群聊: {self.config['listen_list'] if self.config['listen_list'] else '未设置'}")
        log(f"  - @提及关键词: {self.mention_keywords if self.mention_keywords else '未设置'}")
        log(f"  - 唤醒词: {self.config['wake_words'] if self.config['wake_words'] else '未设置'}")
        log(f"  - 会话超时: {self.config['chat_timeout']}秒")
        log(f"  - 主循环超时: {self.config['main_timeout']}秒")
        log(f"  - 循环间隔: {self.config['loop_interval']}秒")
        log(f"  - 扣子机器人ID: {self.config['coze_bot_id']}")
        
        last_time = time.time()
        
        try:
            while True:
                last_time = self.AllListen_mode(last_time)
                time.sleep(self.config['loop_interval'])
                
        except KeyboardInterrupt:
            log("收到中断信号，正在停止机器人...")
        except Exception as e:
            log(f"机器人运行出错: {e}")
        finally:
            self.cleanup()
    
    def cleanup(self):
        """清理资源"""
        log("正在清理资源...")
        try:
            # 移除所有监听
            for listen_chat_entry in self.all_Mode_listen_list[:]:
                chat_id = listen_chat_entry[0]
                self.wx.RemoveListenChat(who=chat_id)
                log(f"已移除监听: {chat_id}")
            
            self.all_Mode_listen_list.clear()
            log("资源清理完成")
        except Exception as e:
            log(f"清理资源时出错: {e}")

if __name__ == "__main__":
    # 创建并运行微信机器人
    bot = WeChatBot()
    bot.run()