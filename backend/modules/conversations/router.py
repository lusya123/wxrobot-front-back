"""
会话与消息管理模块的路由层
"""
from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Header
from pydantic import BaseModel

from modules.auth.deps import CurrentUser
from modules.conversations.service import ConversationService
from modules.conversations.models import (
    MessageReportRequest,
    ConversationListResponse,
    MessageListResponse,
    ConversationDetailResponse,
    ContactUpdate,
    ContactPublic,
    AISuggestionResponse,
    TagCreate,
    TagPublic,
    TagUpdate
)

router = APIRouter(prefix="/conversations", tags=["conversations"])


# 请求模型定义
class ConversationListRequest(BaseModel):
    """获取会话列表请求"""
    wechat_account_id: int
    query: Optional[str] = None


class MessageListRequest(BaseModel):
    """获取消息列表请求"""
    conversation_id: int
    page: int = 1
    page_size: int = 20


class ConversationDetailRequest(BaseModel):
    """获取会话详情请求"""
    conversation_id: int
    contact_id: Optional[int] = None


class ContactUpdateRequest(BaseModel):
    """更新联系人请求"""
    contact_id: int
    tags: Optional[list[str]] = None
    group: Optional[str] = None
    notes: Optional[str] = None


class AISuggestionRequest(BaseModel):
    """获取AI建议请求"""
    conversation_id: int
    contact_id: int


# 内部API路由
@router.post("/internal/message/report")
async def report_message(
    request_data: MessageReportRequest,
    authorization: str = Header(None)
) -> Dict[str, Any]:
    """
    上报新消息（内部API，供机器人调用）
    """
    # 简单的token验证
    if not authorization or not authorization.startswith("Bearer "):
        return {
            "error": 401,
            "body": None,
            "message": "未授权"
        }
    
    try:
        result = ConversationService.process_message_report(request_data)
        return {
            "error": 0,
            "body": result,
            "message": "成功"
        }
    except ValueError as e:
        return {
            "error": 1,
            "body": None,
            "message": str(e)
        }
    except Exception as e:
        return {
            "error": 1,
            "body": None,
            "message": f"处理失败: {str(e)}"
        }


# 公开API路由
@router.post("/list")
async def list_conversations(
    request_data: ConversationListRequest,
    current_user: CurrentUser
) -> Dict[str, Any]:
    """
    获取会话列表
    """
    try:
        conversations = ConversationService.get_conversations(
            wechat_account_id=request_data.wechat_account_id,
            query=request_data.query,
            current_user_id=current_user.id
        )
        
        return {
            "error": 0,
            "body": {
                "conversations": [conv.model_dump() for conv in conversations]
            },
            "message": "成功"
        }
    except Exception as e:
        return {
            "error": 1,
            "body": None,
            "message": f"获取失败: {str(e)}"
        }


@router.post("/messages/list")
async def list_messages(
    request_data: MessageListRequest,
    current_user: CurrentUser
) -> Dict[str, Any]:
    """
    获取指定会话的消息列表
    """
    try:
        result = ConversationService.get_messages(
            conversation_id=request_data.conversation_id,
            page=request_data.page,
            page_size=request_data.page_size,
            current_user_id=current_user.id
        )
        
        # 转换消息列表为字典格式
        messages_dict = []
        for msg in result["messages"]:
            msg_dict = msg.model_dump()
            # 确保时间格式正确
            if msg_dict.get("created_at"):
                msg_dict["created_at"] = msg_dict["created_at"].isoformat()
            messages_dict.append(msg_dict)
        
        return {
            "error": 0,
            "body": {
                "messages": messages_dict,
                "total": result["total"]
            },
            "message": "成功"
        }
    except Exception as e:
        return {
            "error": 1,
            "body": None,
            "message": f"获取失败: {str(e)}"
        }


@router.post("/details/get")
async def get_details(
    request_data: ConversationDetailRequest,
    current_user: CurrentUser
) -> Dict[str, Any]:
    """
    获取联系人/会话详情
    """
    try:
        result = ConversationService.get_conversation_details(
            conversation_id=request_data.conversation_id,
            contact_id=request_data.contact_id,
            current_user_id=current_user.id
        )
        
        return {
            "error": 0,
            "body": result,
            "message": "成功"
        }
    except ValueError as e:
        return {
            "error": 1,
            "body": None,
            "message": str(e)
        }
    except Exception as e:
        return {
            "error": 1,
            "body": None,
            "message": f"获取失败: {str(e)}"
        }


@router.post("/contacts/update")
async def update_contact(
    request_data: ContactUpdateRequest,
    current_user: CurrentUser
) -> Dict[str, Any]:
    """
    更新联系人信息
    """
    try:
        # 如果提供了标签名称列表，需要先查询或创建标签
        tag_ids = []
        if request_data.tags is not None:
            # 获取现有标签
            existing_tags = ConversationService.get_tags(
                owner_id=current_user.id,
                include_public=True
            )
            
            existing_tag_names = {tag.name: tag.id for tag in existing_tags}
            
            # 处理每个标签
            for tag_name in request_data.tags:
                if tag_name in existing_tag_names:
                    tag_ids.append(existing_tag_names[tag_name])
                else:
                    # 创建新标签
                    new_tag = ConversationService.create_tag(
                        TagCreate(name=tag_name, owner_id=current_user.id),
                        current_user_id=current_user.id
                    )
                    tag_ids.append(new_tag.id)
        
        # 更新联系人信息
        update_data = ContactUpdate(
            group_name=request_data.group,
            notes=request_data.notes,
            tag_ids=tag_ids if request_data.tags is not None else None
        )
        
        updated_contact = ConversationService.update_contact(
            contact_id=request_data.contact_id,
            update_data=update_data,
            current_user_id=current_user.id
        )
        
        return {
            "error": 0,
            "body": {"status": "updated"},
            "message": "成功"
        }
    except ValueError as e:
        return {
            "error": 1,
            "body": None,
            "message": str(e)
        }
    except Exception as e:
        return {
            "error": 1,
            "body": None,
            "message": f"更新失败: {str(e)}"
        }


@router.post("/ai/suggestion")
async def get_ai_suggestion(
    request_data: AISuggestionRequest,
    current_user: CurrentUser
) -> Dict[str, Any]:
    """
    获取AI回复建议
    """
    try:
        result = ConversationService.get_ai_suggestion(
            conversation_id=request_data.conversation_id,
            contact_id=request_data.contact_id,
            current_user_id=current_user.id
        )
        
        return {
            "error": 0,
            "body": result,
            "message": "成功"
        }
    except ValueError as e:
        return {
            "error": 1,
            "body": None,
            "message": str(e)
        }
    except Exception as e:
        return {
            "error": 1,
            "body": None,
            "message": f"获取失败: {str(e)}"
        }


# 标签管理API
@router.post("/tags/create")
async def create_tag(
    tag_data: TagCreate,
    current_user: CurrentUser
) -> Dict[str, Any]:
    """
    创建标签
    """
    try:
        # 设置owner_id为当前用户
        if not tag_data.owner_id:
            tag_data.owner_id = current_user.id
            
        tag = ConversationService.create_tag(
            tag_data=tag_data,
            current_user_id=current_user.id
        )
        
        return {
            "error": 0,
            "body": tag.model_dump(),
            "message": "成功"
        }
    except ValueError as e:
        return {
            "error": 1,
            "body": None,
            "message": str(e)
        }
    except Exception as e:
        return {
            "error": 1,
            "body": None,
            "message": f"创建失败: {str(e)}"
        }


@router.post("/tags/list")
async def list_tags(
    current_user: CurrentUser
) -> Dict[str, Any]:
    """
    获取标签列表
    """
    try:
        tags = ConversationService.get_tags(
            owner_id=current_user.id,
            include_public=True
        )
        
        return {
            "error": 0,
            "body": {
                "tags": [tag.model_dump() for tag in tags]
            },
            "message": "成功"
        }
    except Exception as e:
        return {
            "error": 1,
            "body": None,
            "message": f"获取失败: {str(e)}"
        }
