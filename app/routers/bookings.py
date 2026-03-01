from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime
from bson import ObjectId

from app.database import get_database
from app.routers.auth import get_current_user

router = APIRouter(prefix="/bookings", tags=["Bookings"])


def booking_helper(b) -> dict:
    return {
        "id": str(b["_id"]),
        "client_id": str(b["client_id"]),
        "specialist_id": str(b["specialist_id"]),
        "service_id": str(b["service_id"]) if b.get("service_id") else None,
        "booking_date": b.get("booking_date"),
        "time_slot": b.get("time_slot"),
        "day_of_week": b.get("day_of_week"),
        "status": b.get("status", "pending"),
        "total_price": b.get("total_price", 0),
        "notes": b.get("notes"),
        "created_at": b.get("created_at"),
    }


# ─── Create Booking ───────────────────────────────────────────────────────────

@router.post("/", status_code=201)
async def create_booking(data: dict, current_user: dict = Depends(get_current_user)):
    db = get_database()

    specialist_id = data.get("specialist_id")
    service_id = data.get("service_id")
    booking_date = data.get("booking_date")
    time_slot = data.get("time_slot")      # e.g. "09:00 - 10:00"
    day_of_week = data.get("day_of_week")  # e.g. "Monday"

    if not all([specialist_id, service_id, booking_date]):
        raise HTTPException(status_code=400, detail="specialist_id, service_id and booking_date are required")

    # Validate specialist exists
    try:
        specialist = await db["specialists"].find_one({"_id": ObjectId(specialist_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid specialist ID")
    if not specialist:
        raise HTTPException(status_code=404, detail="Specialist not found")

    # Validate service
    try:
        service = await db["services"].find_one({"_id": ObjectId(service_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid service ID")
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")

    # Validate time slot against specialist's availability
    if time_slot and day_of_week:
        availability = specialist.get("availability", [])
        matching_day = [a for a in availability if a.get("day", "").lower() == day_of_week.lower()]
        if availability and not matching_day:
            raise HTTPException(
                status_code=400,
                detail=f"Specialist is not available on {day_of_week}"
            )

    booking = {
        "client_id": ObjectId(current_user["id"]),
        "specialist_id": ObjectId(specialist_id),
        "service_id": ObjectId(service_id),
        "booking_date": datetime.fromisoformat(booking_date) if isinstance(booking_date, str) else booking_date,
        "time_slot": time_slot,
        "day_of_week": day_of_week,
        "status": "pending",
        "total_price": service.get("price", 0),
        "notes": data.get("notes"),
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }

    result = await db["bookings"].insert_one(booking)
    new = await db["bookings"].find_one({"_id": result.inserted_id})
    return booking_helper(new)


# ─── Get My Bookings ──────────────────────────────────────────────────────────

@router.get("/my-bookings")
async def get_my_bookings(current_user: dict = Depends(get_current_user)):
    db = get_database()

    if current_user["role"] == "client":
        query = {"client_id": ObjectId(current_user["id"])}
    elif current_user["role"] == "specialist":
        profile = await db["specialists"].find_one({"user_id": ObjectId(current_user["id"])})
        if not profile:
            return []
        query = {"specialist_id": profile["_id"]}
    else:
        query = {}

    cursor = db["bookings"].find(query).sort("created_at", -1)
    bookings = await cursor.to_list(length=100)
    return [booking_helper(b) for b in bookings]


# ─── Get Booking By ID ────────────────────────────────────────────────────────

@router.get("/{booking_id}")
async def get_booking(booking_id: str, current_user: dict = Depends(get_current_user)):
    db = get_database()
    try:
        booking = await db["bookings"].find_one({"_id": ObjectId(booking_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid booking ID")
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    return booking_helper(booking)


# ─── Update Booking Status ────────────────────────────────────────────────────

@router.put("/{booking_id}/status")
async def update_status(booking_id: str, data: dict, current_user: dict = Depends(get_current_user)):
    db = get_database()
    new_status = data.get("status")
    valid_statuses = ["pending", "confirmed", "completed", "cancelled"]

    if new_status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Status must be one of {valid_statuses}")

    try:
        booking = await db["bookings"].find_one({"_id": ObjectId(booking_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid booking ID")
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    await db["bookings"].update_one(
        {"_id": ObjectId(booking_id)},
        {"$set": {"status": new_status, "updated_at": datetime.utcnow()}}
    )
    updated = await db["bookings"].find_one({"_id": ObjectId(booking_id)})
    return booking_helper(updated)


# ─── Cancel Booking ───────────────────────────────────────────────────────────

@router.delete("/{booking_id}")
async def cancel_booking(booking_id: str, current_user: dict = Depends(get_current_user)):
    db = get_database()
    try:
        booking = await db["bookings"].find_one({"_id": ObjectId(booking_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid booking ID")
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if str(booking["client_id"]) != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    if booking["status"] not in ["pending", "confirmed"]:
        raise HTTPException(status_code=400, detail="Cannot cancel this booking")

    await db["bookings"].update_one(
        {"_id": ObjectId(booking_id)},
        {"$set": {"status": "cancelled", "updated_at": datetime.utcnow()}}
    )
    return {"message": "Booking cancelled"}