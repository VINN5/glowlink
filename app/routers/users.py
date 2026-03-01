from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from fastapi.staticfiles import StaticFiles
from bson import ObjectId
from datetime import datetime
import os, shutil, uuid
from app.database import get_database
from app.models.user import UserUpdate, UserResponse
from app.routers.auth import get_current_user

router = APIRouter(prefix="/users", tags=["Users"])

UPLOAD_DIR = "uploads/profile_pictures"
os.makedirs(UPLOAD_DIR, exist_ok=True)

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
MAX_SIZE_MB = 5


def user_helper(user) -> dict:
    return {
        "id": str(user["_id"]),
        "full_name": user["full_name"],
        "email": user["email"],
        "phone": user.get("phone"),
        "role": user["role"],
        "profile_picture": user.get("profile_picture"),
        "is_active": user["is_active"],
        "created_at": user["created_at"],
    }


@router.get("/me", response_model=UserResponse)
async def get_my_profile(current_user: dict = Depends(get_current_user)):
    return current_user


@router.put("/me", response_model=UserResponse)
async def update_my_profile(
    update_data: UserUpdate,
    current_user: dict = Depends(get_current_user)
):
    db = get_database()
    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    update_dict["updated_at"] = datetime.utcnow()

    await db["users"].update_one(
        {"_id": ObjectId(current_user["id"])},
        {"$set": update_dict}
    )
    updated = await db["users"].find_one({"_id": ObjectId(current_user["id"])})
    return user_helper(updated)


@router.post("/me/profile-picture")
async def upload_profile_picture(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    db = get_database()

    # Validate type
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail="Only JPEG, PNG, WebP or GIF images are allowed")

    # Validate size
    contents = await file.read()
    if len(contents) > MAX_SIZE_MB * 1024 * 1024:
        raise HTTPException(status_code=400, detail=f"Image must be under {MAX_SIZE_MB}MB")

    # Delete old picture if exists
    old_user = await db["users"].find_one({"_id": ObjectId(current_user["id"])})
    if old_user and old_user.get("profile_picture"):
        old_path = old_user["profile_picture"].replace("/static/", "")
        if os.path.exists(old_path):
            os.remove(old_path)

    # Save new file
    ext = file.filename.rsplit(".", 1)[-1] if "." in file.filename else "jpg"
    filename = f"{uuid.uuid4().hex}.{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)

    with open(filepath, "wb") as f:
        f.write(contents)

    # Build public URL
    picture_url = f"/static/uploads/profile_pictures/{filename}"

    # Save to DB
    await db["users"].update_one(
        {"_id": ObjectId(current_user["id"])},
        {"$set": {"profile_picture": picture_url, "updated_at": datetime.utcnow()}}
    )

    updated = await db["users"].find_one({"_id": ObjectId(current_user["id"])})
    return user_helper(updated)


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(user_id: str, current_user: dict = Depends(get_current_user)):
    db = get_database()
    user = await db["users"].find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user_helper(user)