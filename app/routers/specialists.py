from fastapi import APIRouter, HTTPException, Depends, Query
from typing import Optional, List
from datetime import datetime
from bson import ObjectId

from app.database import get_database
from app.routers.auth import get_current_user

router = APIRouter(prefix="/specialists", tags=["Specialists"])


def specialist_helper(s) -> dict:
    return {
        "id": str(s["_id"]),
        "user_id": str(s["user_id"]),
        "bio": s.get("bio"),
        "city": s.get("city"),
        "location": s.get("location"),
        "categories": s.get("categories", []),
        "years_of_experience": s.get("years_of_experience"),
        "availability": s.get("availability", []),
        "rating": s.get("rating", 0.0),
        "total_reviews": s.get("total_reviews", 0),
        "is_verified": s.get("is_verified", False),
        "is_active": s.get("is_active", True),
        "created_at": s.get("created_at"),
    }


# ─── Create Profile ───────────────────────────────────────────────────────────

@router.post("/profile", status_code=201)
async def create_profile(data: dict, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "specialist":
        raise HTTPException(status_code=403, detail="Only specialists can create a profile")

    db = get_database()
    existing = await db["specialists"].find_one({"user_id": ObjectId(current_user["id"])})
    if existing:
        raise HTTPException(status_code=400, detail="Profile already exists")

    profile = {
        "user_id": ObjectId(current_user["id"]),
        "bio": data.get("bio"),
        "city": data.get("city"),
        "location": data.get("location"),
        "categories": data.get("categories", []),
        "years_of_experience": data.get("years_of_experience"),
        "availability": data.get("availability", []),
        "rating": 0.0,
        "total_reviews": 0,
        "is_verified": False,
        "is_active": True,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }

    result = await db["specialists"].insert_one(profile)
    new = await db["specialists"].find_one({"_id": result.inserted_id})
    return specialist_helper(new)


# ─── List / Search Specialists ────────────────────────────────────────────────

@router.get("/")
async def list_specialists(
    category: Optional[str] = Query(None),
    city: Optional[str] = Query(None),
    location: Optional[str] = Query(None),
    verified_only: bool = Query(False),
    limit: int = Query(20, le=100),
    skip: int = Query(0),
):
    db = get_database()
    query: dict = {"is_active": True}

    if category:
        query["categories"] = {"$in": [category]}
    if city:
        query["city"] = {"$regex": city, "$options": "i"}
    if location:
        query["location"] = {"$regex": location, "$options": "i"}
    if verified_only:
        query["is_verified"] = True

    cursor = db["specialists"].find(query).skip(skip).limit(limit).sort("rating", -1)
    specialists = await cursor.to_list(length=limit)
    return [specialist_helper(s) for s in specialists]


# ─── Get My Profile ───────────────────────────────────────────────────────────

@router.get("/me")
async def get_my_profile(current_user: dict = Depends(get_current_user)):
    db = get_database()
    profile = await db["specialists"].find_one({"user_id": ObjectId(current_user["id"])})
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return specialist_helper(profile)


# ─── Get Specialist By ID ─────────────────────────────────────────────────────

@router.get("/{specialist_id}")
async def get_specialist(specialist_id: str):
    db = get_database()
    try:
        specialist = await db["specialists"].find_one({"_id": ObjectId(specialist_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid ID")
    if not specialist:
        raise HTTPException(status_code=404, detail="Specialist not found")

    # Also fetch user info for display name and picture
    user = await db["users"].find_one({"_id": specialist["user_id"]})
    result = specialist_helper(specialist)
    if user:
        result["full_name"] = user.get("full_name")
        result["profile_picture"] = user.get("profile_picture")
        result["email"] = user.get("email")

    return result


# ─── Get Specialist's Availability ───────────────────────────────────────────

@router.get("/{specialist_id}/availability")
async def get_availability(specialist_id: str):
    db = get_database()
    try:
        specialist = await db["specialists"].find_one({"_id": ObjectId(specialist_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid ID")
    if not specialist:
        raise HTTPException(status_code=404, detail="Specialist not found")
    return {"availability": specialist.get("availability", [])}


# ─── Update My Profile ────────────────────────────────────────────────────────

@router.put("/me")
async def update_profile(data: dict, current_user: dict = Depends(get_current_user)):
    db = get_database()
    profile = await db["specialists"].find_one({"user_id": ObjectId(current_user["id"])})
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    update_data = {k: v for k, v in data.items() if k not in ["_id", "user_id", "rating", "total_reviews", "is_verified"]}
    update_data["updated_at"] = datetime.utcnow()

    await db["specialists"].update_one({"user_id": ObjectId(current_user["id"])}, {"$set": update_data})
    updated = await db["specialists"].find_one({"user_id": ObjectId(current_user["id"])})
    return specialist_helper(updated)