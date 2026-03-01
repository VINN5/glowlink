from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime
from bson import ObjectId

from app.database import get_database
from app.routers.auth import get_current_user

router = APIRouter(prefix="/reviews", tags=["Reviews"])


def review_helper(r) -> dict:
    return {
        "id": str(r["_id"]),
        "specialist_id": str(r["specialist_id"]),
        "client_id": str(r["client_id"]),
        "booking_id": str(r["booking_id"]),
        "rating": r["rating"],
        "comment": r.get("comment"),
        "client_name": r.get("client_name"),
        "client_picture": r.get("client_picture"),
        "created_at": r.get("created_at"),
    }


# ─── Submit a Review ──────────────────────────────────────────────────────────

@router.post("/", status_code=201)
async def submit_review(data: dict, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "client":
        raise HTTPException(status_code=403, detail="Only clients can submit reviews")

    db = get_database()
    specialist_id = data.get("specialist_id")
    booking_id = data.get("booking_id")
    rating = data.get("rating")
    comment = data.get("comment", "").strip()

    # Validate inputs
    if not all([specialist_id, booking_id, rating]):
        raise HTTPException(status_code=400, detail="specialist_id, booking_id and rating are required")
    if not isinstance(rating, (int, float)) or not (1 <= rating <= 5):
        raise HTTPException(status_code=400, detail="Rating must be between 1 and 5")

    # Validate booking exists, belongs to client, and is completed
    try:
        booking = await db["bookings"].find_one({"_id": ObjectId(booking_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid booking ID")
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if str(booking["client_id"]) != current_user["id"]:
        raise HTTPException(status_code=403, detail="This booking does not belong to you")
    if booking["status"] != "completed":
        raise HTTPException(status_code=400, detail="You can only review completed bookings")

    # Check not already reviewed
    existing = await db["reviews"].find_one({"booking_id": ObjectId(booking_id)})
    if existing:
        raise HTTPException(status_code=400, detail="You have already reviewed this booking")

    # Create review
    review = {
        "specialist_id": ObjectId(specialist_id),
        "client_id": ObjectId(current_user["id"]),
        "booking_id": ObjectId(booking_id),
        "rating": rating,
        "comment": comment,
        "client_name": current_user.get("full_name"),
        "client_picture": current_user.get("profile_picture"),
        "created_at": datetime.utcnow(),
    }
    result = await db["reviews"].insert_one(review)

    # Recalculate specialist rating
    pipeline = [
        {"$match": {"specialist_id": ObjectId(specialist_id)}},
        {"$group": {"_id": None, "avg": {"$avg": "$rating"}, "count": {"$sum": 1}}}
    ]
    agg = await db["reviews"].aggregate(pipeline).to_list(1)
    if agg:
        await db["specialists"].update_one(
            {"_id": ObjectId(specialist_id)},
            {"$set": {
                "rating": round(agg[0]["avg"], 1),
                "total_reviews": agg[0]["count"],
                "updated_at": datetime.utcnow(),
            }}
        )

    new = await db["reviews"].find_one({"_id": result.inserted_id})
    return review_helper(new)


# ─── Get Reviews for a Specialist ────────────────────────────────────────────

@router.get("/specialist/{specialist_id}")
async def get_specialist_reviews(specialist_id: str):
    db = get_database()
    try:
        cursor = db["reviews"].find(
            {"specialist_id": ObjectId(specialist_id)}
        ).sort("created_at", -1)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid specialist ID")

    reviews = await cursor.to_list(length=50)
    return [review_helper(r) for r in reviews]


# ─── Check if Booking Already Reviewed ───────────────────────────────────────

@router.get("/check/{booking_id}")
async def check_reviewed(booking_id: str, current_user: dict = Depends(get_current_user)):
    db = get_database()
    try:
        existing = await db["reviews"].find_one({"booking_id": ObjectId(booking_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid booking ID")
    return {"reviewed": existing is not None}