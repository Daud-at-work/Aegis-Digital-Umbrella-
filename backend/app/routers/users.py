"""Profile management endpoints."""

from fastapi import HTTPException

from ..core import (PasswordChange, UserUpdate, api_router, db, hash_password, verify_password)

@api_router.get("/user/profile/{user_id}")
async def get_user_profile(user_id: str):
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.pop("password", None)
    user.pop("reset_token", None)
    user.pop("reset_token_expires", None)
    user.pop("_id", None)
    return user

@api_router.put("/user/profile/{user_id}")
async def update_user_profile(user_id: str, update_data: UserUpdate):
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    update_dict = {k: v for k, v in update_data.dict().items() if v is not None}
    if update_dict:
        await db.users.update_one({"id": user_id}, {"$set": update_dict})
    return {"message": "Profile updated successfully"}

@api_router.post("/user/change-password/{user_id}")
async def change_password(user_id: str, password_data: PasswordChange):
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if not verify_password(password_data.current_password, user["password"]):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    new_hashed_password = hash_password(password_data.new_password)
    await db.users.update_one(
        {"id": user_id},
        {"$set": {"password": new_hashed_password}}
    )
    return {"message": "Password changed successfully"}


@api_router.delete("/user/profile/{user_id}")
async def delete_user_profile(user_id: str):
    try:
        user = await db.users.find_one({"id": user_id})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        await db.scans.delete_many({"user_id": user_id})
        await db.chat_history.delete_many({"user_id": user_id})
        result = await db.users.delete_one({"id": user_id})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="User not found")
        return {"message": "User profile deleted successfully", "deleted_user_id": user_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete user profile: {str(e)}")

