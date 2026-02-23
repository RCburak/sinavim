"""Arkadaşlar sistemi rotaları."""
from fastapi import APIRouter, HTTPException
from services.friends_service import friends_service
from schemas import (
    SearchUserRequest, 
    FriendRequestAction, 
    SendFriendRequest
)

friends_router = APIRouter()

@friends_router.post("/search")
async def search_users(req: SearchUserRequest):
    users, error = friends_service.search_users(req.query, req.current_user_id)
    if error:
        raise HTTPException(status_code=500, detail=error)
    return {"users": users}

@friends_router.post("/request")
async def send_friend_request(req: SendFriendRequest):
    success, error = friends_service.send_friend_request(req.sender_id, req.receiver_id)
    if not success:
        raise HTTPException(status_code=400, detail=error)
    return {"message": "İstek gönderildi."}

@friends_router.get("/requests/{user_id}")
async def get_pending_requests(user_id: str):
    requests, error = friends_service.get_pending_requests(user_id)
    if error:
        raise HTTPException(status_code=500, detail=error)
    return {"requests": requests}

@friends_router.post("/request/respond")
async def respond_to_request(req: FriendRequestAction):
    success, error = friends_service.respond_to_request(req.request_id, req.action)
    if not success:
        raise HTTPException(status_code=400, detail=error)
    return {"message": f"İstek {req.action} edildi."}

@friends_router.get("/{user_id}/list")
async def get_friends_list(user_id: str):
    friends, error = friends_service.get_friends(user_id)
    if error:
        raise HTTPException(status_code=500, detail=error)
    return {"friends": friends}

@friends_router.delete("/{user_id}/remove/{friend_id}")
async def remove_friend(user_id: str, friend_id: str):
    success, error = friends_service.remove_friend(user_id, friend_id)
    if not success:
        raise HTTPException(status_code=400, detail=error)
    return {"message": "Arkadaş silindi."}
