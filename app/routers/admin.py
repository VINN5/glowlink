from fastapi import APIRouter, HTTPException, Depends
from bson import ObjectId
from datetime import datetime
from app.database import get_database
from app.routers.auth import get_current_user, require_admin

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/stats")
async def get_dashboard_stats(admin: dict = Depends(require_admin)):
    db = get_database()
    total_users = await db["users"].count_documents({})
    total_clients = await db["users"].count_documents({"role": "client"})
    total_specialists = await db["users"].count_documents({"role": "specialist"})
    total_bookings = await db["bookings"].count_documents({})
    pending_bookings = await db["bookings"].count_documents({"status": "pending"})
    completed_bookings = await db["bookings"].count_documents({"status": "completed"})
    total_services = await db["services"].count_documents({"is_active": True})

    return {
        "total_users": total_users,
        "total_clients": total_clients,
        "total_specialists": total_specialists,
        "total_bookings": total_bookings,
        "pending_bookings": pending_bookings,
        "completed_bookings": completed_bookings,
        "total_services": total_services,
    }


@router.get("/users")
async def list_all_users(skip: int = 0, limit: int = 50, admin: dict = Depends(require_admin)):
    db = get_database()
    users = []
    async for u in db["users"].find().skip(skip).limit(limit):
        users.append({
            "id": str(u["_id"]),
            "full_name": u["full_name"],
            "email": u["email"],
            "role": u["role"],
            "is_active": u["is_active"],
            "created_at": u["created_at"],
        })
    return users


@router.put("/users/{user_id}/toggle-active")
async def toggle_user_active(user_id: str, admin: dict = Depends(require_admin)):
    db = get_database()
    user = await db["users"].find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    new_status = not user["is_active"]
    await db["users"].update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"is_active": new_status, "updated_at": datetime.utcnow()}}
    )
    return {"message": f"User {'activated' if new_status else 'deactivated'} successfully"}


@router.put("/specialists/{specialist_id}/verify")
async def verify_specialist(specialist_id: str, admin: dict = Depends(require_admin)):
    db = get_database()
    result = await db["specialists"].update_one(
        {"_id": ObjectId(specialist_id)},
        {"$set": {"is_verified": True, "updated_at": datetime.utcnow()}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Specialist not found")
    return {"message": "Specialist verified successfully"}


@router.get("/bookings")
async def list_all_bookings(skip: int = 0, limit: int = 50, admin: dict = Depends(require_admin)):
    db = get_database()
    bookings = []
    async for b in db["bookings"].find().skip(skip).limit(limit).sort("created_at", -1):
        bookings.append({
            "id": str(b["_id"]),
            "client_id": b["client_id"],
            "specialist_id": b["specialist_id"],
            "service_id": b["service_id"],
            "booking_date": b["booking_date"],
            "status": b["status"],
            "total_price": b["total_price"],
            "created_at": b["created_at"],
        })
    return bookings