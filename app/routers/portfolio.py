from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from datetime import datetime
from bson import ObjectId
import os, uuid

from app.database import get_database
from app.routers.auth import get_current_user

router = APIRouter(prefix="/portfolio", tags=["Portfolio"])

UPLOAD_DIR = "uploads/portfolio"
os.makedirs(UPLOAD_DIR, exist_ok=True)

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}
ALLOWED_VIDEO_TYPES = {"video/mp4", "video/quicktime", "video/webm"}
MAX_IMAGE_MB = 10
MAX_VIDEO_MB = 50


def portfolio_helper(item) -> dict:
    return {
        "id": str(item["_id"]),
        "specialist_id": str(item["specialist_id"]),
        "url": item["url"],
        "media_type": item["media_type"],
        "caption": item.get("caption", ""),
        "price": item.get("price"),
        "created_at": item.get("created_at"),
    }


# ─── Upload Portfolio Item ────────────────────────────────────────────────────

@router.post("/upload", status_code=201)
async def upload_portfolio_item(
    file: UploadFile = File(...),
    caption: str = Form(""),
    price: str = Form(""),
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != "specialist":
        raise HTTPException(status_code=403, detail="Only specialists can upload portfolio items")

    db = get_database()

    # Get specialist profile
    specialist = await db["specialists"].find_one({"user_id": ObjectId(current_user["id"])})
    if not specialist:
        raise HTTPException(status_code=404, detail="Specialist profile not found. Please set up your profile first.")

    # Determine media type
    if file.content_type in ALLOWED_IMAGE_TYPES:
        media_type = "image"
        max_mb = MAX_IMAGE_MB
    elif file.content_type in ALLOWED_VIDEO_TYPES:
        media_type = "video"
        max_mb = MAX_VIDEO_MB
    else:
        raise HTTPException(status_code=400, detail="Only JPEG, PNG, WebP images and MP4, MOV, WebM videos are allowed")

    # Read and validate size
    contents = await file.read()
    if len(contents) > max_mb * 1024 * 1024:
        raise HTTPException(status_code=400, detail=f"File must be under {max_mb}MB")

    # Check portfolio limit (20 items)
    count = await db["portfolio"].count_documents({"specialist_id": specialist["_id"]})
    if count >= 20:
        raise HTTPException(status_code=400, detail="Portfolio limit reached (20 items). Please delete some items first.")

    # Save file
    ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ("jpg" if media_type == "image" else "mp4")
    filename = f"{uuid.uuid4().hex}.{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)
    with open(filepath, "wb") as f:
        f.write(contents)

    url = f"/static/uploads/portfolio/{filename}"

    item = {
        "specialist_id": specialist["_id"],
        "user_id": ObjectId(current_user["id"]),
        "url": url,
        "media_type": media_type,
        "caption": caption.strip(),
        "price": int(price) if price.strip().isdigit() else None,
        "created_at": datetime.utcnow(),
    }
    result = await db["portfolio"].insert_one(item)
    new = await db["portfolio"].find_one({"_id": result.inserted_id})
    return portfolio_helper(new)


# ─── Get Portfolio for a Specialist ──────────────────────────────────────────

@router.get("/{specialist_id}")
async def get_portfolio(specialist_id: str):
    db = get_database()
    try:
        specialist = await db["specialists"].find_one({"_id": ObjectId(specialist_id)})
        if not specialist:
            return []
        items = await db["portfolio"].find(
            {"specialist_id": specialist["_id"]}
        ).sort("created_at", -1).to_list(length=20)
        return [portfolio_helper(i) for i in items]
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid specialist ID")


# ─── Get My Portfolio (specialist) ───────────────────────────────────────────

@router.get("/me/items")
async def get_my_portfolio(current_user: dict = Depends(get_current_user)):
    db = get_database()
    specialist = await db["specialists"].find_one({"user_id": ObjectId(current_user["id"])})
    if not specialist:
        return []
    items = await db["portfolio"].find(
        {"specialist_id": specialist["_id"]}
    ).sort("created_at", -1).to_list(length=20)
    return [portfolio_helper(i) for i in items]


# ─── Delete Portfolio Item ────────────────────────────────────────────────────

@router.delete("/{item_id}")
async def delete_portfolio_item(item_id: str, current_user: dict = Depends(get_current_user)):
    db = get_database()
    try:
        item = await db["portfolio"].find_one({"_id": ObjectId(item_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid item ID")
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    if str(item["user_id"]) != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not your portfolio item")

    # Delete file from disk
    filepath = item["url"].replace("/static/", "")
    if os.path.exists(filepath):
        os.remove(filepath)

    await db["portfolio"].delete_one({"_id": ObjectId(item_id)})
    return {"message": "Deleted successfully"}