"""AI assistant and chat history endpoints."""

from fastapi import HTTPException

from ..core import ChatMessage, ChatRequest, api_router, db
from ..services.scanning import generate_chatbot_response

@api_router.post("/chat")
async def chat_with_ai(chat_request: ChatRequest):
    try:
        response = await generate_chatbot_response(chat_request.message)
        chat_message = ChatMessage(
            user_id=chat_request.user_id,
            message=chat_request.message,
            response=response
        )
        await db.chat_history.insert_one(chat_message.dict())
        return {"response": response, "message_id": chat_message.id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat failed: {str(e)}")

@api_router.get("/chat/history/{user_id}")
async def get_chat_history(user_id: str, limit: int = 50):
    chats = await db.chat_history.find({"user_id": user_id}).sort("timestamp", -1).limit(limit).to_list(limit)
    return [ChatMessage(**chat) for chat in chats]

