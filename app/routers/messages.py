from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timezone
from bson import ObjectId

from app.database import get_database
from app.routers.auth import get_current_user

router = APIRouter(prefix="/messages", tags=["Messages"])


def now_utc():
    return datetime.now(timezone.utc)


def conversation_helper(c, current_user_id: str) -> dict:
    return {
        "id": str(c["_id"]),
        "client_id": str(c["client_id"]),
        "specialist_id": str(c["specialist_id"]),
        "booking_id": str(c["booking_id"]) if c.get("booking_id") else None,
        "last_message": c.get("last_message"),
        "last_message_at": c.get("last_message_at"),
        "unread_count": c.get(f"unread_{current_user_id}", 0),
        "created_at": c.get("created_at"),
    }


def message_helper(m) -> dict:
    return {
        "id": str(m["_id"]),
        "conversation_id": str(m["conversation_id"]),
        "sender_id": str(m["sender_id"]),
        "content": m.get("content"),
        "is_read": m.get("is_read", False),
        "created_at": m.get("created_at"),
    }


# ─── Start or Get Conversation ────────────────────────────────────────────────

@router.post("/conversations", status_code=201)
async def start_conversation(data: dict, current_user: dict = Depends(get_current_user)):
    db = get_database()
    other_id = data.get("other_user_id")
    booking_id = data.get("booking_id")

    if not other_id:
        raise HTTPException(status_code=400, detail="other_user_id is required")

    other_user = await db["users"].find_one({"_id": ObjectId(other_id)})
    if not other_user:
        raise HTTPException(status_code=404, detail="User not found")

    if current_user["role"] == "client":
        client_id = ObjectId(current_user["id"])
        specialist = await db["specialists"].find_one({"user_id": ObjectId(other_id)})
        if not specialist:
            raise HTTPException(status_code=404, detail="Specialist profile not found")
        specialist_id = specialist["_id"]
    else:
        specialist_profile = await db["specialists"].find_one({"user_id": ObjectId(current_user["id"])})
        if not specialist_profile:
            raise HTTPException(status_code=404, detail="Your specialist profile not found")
        specialist_id = specialist_profile["_id"]
        client_id = ObjectId(other_id)

    existing = await db["conversations"].find_one({
        "client_id": client_id,
        "specialist_id": specialist_id,
    })
    if existing:
        return conversation_helper(existing, current_user["id"])

    conversation = {
        "client_id": client_id,
        "specialist_id": specialist_id,
        "booking_id": ObjectId(booking_id) if booking_id else None,
        "last_message": None,
        "last_message_at": None,
        f"unread_{current_user['id']}": 0,
        "created_at": now_utc(),
        "updated_at": now_utc(),
    }
    result = await db["conversations"].insert_one(conversation)
    new = await db["conversations"].find_one({"_id": result.inserted_id})
    return conversation_helper(new, current_user["id"])


# ─── List My Conversations ────────────────────────────────────────────────────

@router.get("/conversations")
async def list_conversations(current_user: dict = Depends(get_current_user)):
    db = get_database()

    if current_user["role"] == "client":
        query = {"client_id": ObjectId(current_user["id"])}
    else:
        specialist = await db["specialists"].find_one({"user_id": ObjectId(current_user["id"])})
        if not specialist:
            return []
        query = {"specialist_id": specialist["_id"]}

    cursor = db["conversations"].find(query).sort("updated_at", -1)
    conversations = await cursor.to_list(length=50)

    result = []
    for c in conversations:
        conv = conversation_helper(c, current_user["id"])
        if current_user["role"] == "client":
            sp = await db["specialists"].find_one({"_id": c["specialist_id"]})
            if sp:
                ou = await db["users"].find_one({"_id": sp["user_id"]})
                if ou:
                    conv["other_name"] = ou.get("full_name", "Specialist")
                    conv["other_picture"] = ou.get("profile_picture")
                    conv["other_id"] = str(ou["_id"])
        else:
            ou = await db["users"].find_one({"_id": c["client_id"]})
            if ou:
                conv["other_name"] = ou.get("full_name", "Client")
                conv["other_picture"] = ou.get("profile_picture")
                conv["other_id"] = str(ou["_id"])
        result.append(conv)

    return result


# ─── Get Messages ─────────────────────────────────────────────────────────────

@router.get("/conversations/{conversation_id}/messages")
async def get_messages(conversation_id: str, current_user: dict = Depends(get_current_user)):
    db = get_database()
    try:
        conversation = await db["conversations"].find_one({"_id": ObjectId(conversation_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid conversation ID")
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    await db["messages"].update_many(
        {
            "conversation_id": ObjectId(conversation_id),
            "sender_id": {"$ne": ObjectId(current_user["id"])},
            "is_read": False,
        },
        {"$set": {"is_read": True}}
    )
    await db["conversations"].update_one(
        {"_id": ObjectId(conversation_id)},
        {"$set": {f"unread_{current_user['id']}": 0}}
    )

    cursor = db["messages"].find({"conversation_id": ObjectId(conversation_id)}).sort("created_at", 1)
    messages = await cursor.to_list(length=200)
    return [message_helper(m) for m in messages]


# ─── Send a Message ───────────────────────────────────────────────────────────

@router.post("/conversations/{conversation_id}/messages", status_code=201)
async def send_message(conversation_id: str, data: dict, current_user: dict = Depends(get_current_user)):
    db = get_database()
    content = data.get("content", "").strip()
    if not content:
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    try:
        conversation = await db["conversations"].find_one({"_id": ObjectId(conversation_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid conversation ID")
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    if str(conversation["client_id"]) == current_user["id"]:
        sp = await db["specialists"].find_one({"_id": conversation["specialist_id"]})
        other_user = await db["users"].find_one({"_id": sp["user_id"]}) if sp else None
    else:
        other_user = await db["users"].find_one({"_id": conversation["client_id"]})

    other_id = str(other_user["_id"]) if other_user else None

    message = {
        "conversation_id": ObjectId(conversation_id),
        "sender_id": ObjectId(current_user["id"]),
        "content": content,
        "is_read": False,
        "created_at": now_utc(),
    }
    result = await db["messages"].insert_one(message)

    update = {
        "last_message": content,
        "last_message_at": now_utc(),
        "updated_at": now_utc(),
    }
    if other_id:
        update[f"unread_{other_id}"] = conversation.get(f"unread_{other_id}", 0) + 1

    await db["conversations"].update_one({"_id": ObjectId(conversation_id)}, {"$set": update})
    new_message = await db["messages"].find_one({"_id": result.inserted_id})
    return message_helper(new_message)


# ─── Unread Count ─────────────────────────────────────────────────────────────

@router.get("/unread")
async def get_unread_count(current_user: dict = Depends(get_current_user)):
    db = get_database()
    if current_user["role"] == "client":
        query = {"client_id": ObjectId(current_user["id"])}
    else:
        specialist = await db["specialists"].find_one({"user_id": ObjectId(current_user["id"])})
        if not specialist:
            return {"unread": 0}
        query = {"specialist_id": specialist["_id"]}

    conversations = await db["conversations"].find(query).to_list(length=100)
    total = sum(c.get(f"unread_{current_user['id']}", 0) for c in conversations)
    return {"unread": total}