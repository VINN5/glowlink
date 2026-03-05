# ─── backend/app/routers/admin.py ────────────────────────────────────────────
#
# Add this file, then register it in main.py:
#   from app.routers import admin
#   app.include_router(admin.router)

from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional
from app.database import db
from app.routers.auth import get_current_user
from bson import ObjectId
from datetime import datetime

router = APIRouter(prefix="/admin", tags=["admin"])


def require_admin(current_user=Depends(get_current_user)):
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user


def serialize_id(doc):
    """Convert MongoDB _id to string id."""
    if doc and "_id" in doc:
        doc["id"] = str(doc["_id"])
        del doc["_id"]
    return doc


# ── Stats ─────────────────────────────────────────────────────────────────────

@router.get("/stats")
async def get_stats(admin=Depends(require_admin)):
    total_users = await db.users.count_documents({})
    total_specialists = await db.specialist_profiles.count_documents({})
    total_bookings = await db.bookings.count_documents({})
    pending_verifications = await db.specialist_profiles.count_documents({"is_verified": False})

    return {
        "total_users": total_users,
        "total_specialists": total_specialists,
        "total_bookings": total_bookings,
        "pending_verifications": pending_verifications,
    }


# ── Users ─────────────────────────────────────────────────────────────────────

@router.get("/users")
async def get_users(
    role: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = Query(100, le=200),
    sort: Optional[str] = "newest",
    admin=Depends(require_admin),
):
    query = {}
    if role:
        query["role"] = role
    if search:
        query["$or"] = [
            {"full_name": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}},
        ]

    sort_order = [("created_at", -1)] if sort == "newest" else [("created_at", 1)]
    cursor = db.users.find(query).sort(sort_order).limit(limit)
    users = [serialize_id(u) async for u in cursor]
    # Remove password hashes before returning
    for u in users:
        u.pop("hashed_password", None)
        u.pop("password", None)

    return {"users": users, "total": len(users)}


@router.patch("/users/{user_id}")
async def update_user(
    user_id: str,
    data: dict,
    admin=Depends(require_admin),
):
    allowed_fields = {"role", "is_active", "full_name"}
    update_data = {k: v for k, v in data.items() if k in allowed_fields}
    if not update_data:
        raise HTTPException(status_code=400, detail="No valid fields to update")

    result = await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {**update_data, "updated_at": datetime.utcnow()}},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User updated"}


@router.delete("/users/{user_id}")
async def delete_user(user_id: str, admin=Depends(require_admin)):
    result = await db.users.delete_one({"_id": ObjectId(user_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    # Also clean up their specialist profile if they have one
    await db.specialist_profiles.delete_one({"user_id": user_id})
    return {"message": "User deleted"}


# ── Specialists ───────────────────────────────────────────────────────────────

@router.get("/specialists")
async def get_specialists(
    search: Optional[str] = None,
    verified: Optional[bool] = None,
    admin=Depends(require_admin),
):
    query = {}
    if verified is not None:
        query["is_verified"] = verified
    if search:
        query["$or"] = [
            {"city": {"$regex": search, "$options": "i"}},
        ]

    cursor = db.specialist_profiles.find(query).sort("created_at", -1)
    specialists = [serialize_id(s) async for s in cursor]

    # Enrich with user full_name and profile_picture
    for s in specialists:
        uid = s.get("user_id")
        if uid:
            try:
                user = await db.users.find_one({"_id": ObjectId(uid)})
                if user:
                    s["full_name"] = user.get("full_name")
                    s["profile_picture"] = user.get("profile_picture")
                    s["email"] = user.get("email")
            except Exception:
                pass

    return {"specialists": specialists, "total": len(specialists)}


@router.patch("/specialists/{specialist_id}/verify")
async def verify_specialist(
    specialist_id: str,
    data: dict,
    admin=Depends(require_admin),
):
    is_verified = data.get("is_verified")
    if is_verified is None:
        raise HTTPException(status_code=400, detail="is_verified is required")

    result = await db.specialist_profiles.update_one(
        {"_id": ObjectId(specialist_id)},
        {"$set": {"is_verified": is_verified, "updated_at": datetime.utcnow()}},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Specialist not found")
    return {"message": "Verification updated", "is_verified": is_verified}


@router.delete("/specialists/{specialist_id}")
async def delete_specialist(specialist_id: str, admin=Depends(require_admin)):
    result = await db.specialist_profiles.delete_one({"_id": ObjectId(specialist_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Specialist not found")
    return {"message": "Specialist deleted"}