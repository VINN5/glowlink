from fastapi import APIRouter, HTTPException, Depends
from bson import ObjectId
from datetime import datetime
from app.database import get_database
from app.models.service import ServiceCreate, ServiceUpdate, ServiceResponse
from app.routers.auth import get_current_user

router = APIRouter(prefix="/services", tags=["Services"])


def service_helper(s) -> dict:
    return {
        "id": str(s["_id"]),
        "specialist_id": s["specialist_id"],
        "name": s["name"],
        "description": s.get("description"),
        "price": s["price"],
        "duration_minutes": s["duration_minutes"],
        "category": s["category"],
        "is_active": s["is_active"],
        "created_at": s["created_at"],
    }


@router.post("/")
async def create_service(
    service_data: ServiceCreate,
    current_user: dict = Depends(get_current_user)
):
    db = get_database()
    if current_user["role"] not in ["specialist", "admin"]:
        raise HTTPException(status_code=403, detail="Only specialists can add services")

    service_dict = service_data.model_dump()
    service_dict["specialist_id"] = current_user["id"]
    service_dict["is_active"] = True
    service_dict["created_at"] = datetime.utcnow()

    result = await db["services"].insert_one(service_dict)
    new_service = await db["services"].find_one({"_id": result.inserted_id})
    return service_helper(new_service)


@router.get("/specialist/{specialist_id}")
async def get_specialist_services(specialist_id: str):
    db = get_database()
    services = []
    async for s in db["services"].find({"specialist_id": specialist_id, "is_active": True}):
        services.append(service_helper(s))
    return services


@router.get("/{service_id}")
async def get_service(service_id: str):
    db = get_database()
    service = await db["services"].find_one({"_id": ObjectId(service_id)})
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    return service_helper(service)


@router.put("/{service_id}")
async def update_service(
    service_id: str,
    update_data: ServiceUpdate,
    current_user: dict = Depends(get_current_user)
):
    db = get_database()
    service = await db["services"].find_one({"_id": ObjectId(service_id)})
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    if service["specialist_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    await db["services"].update_one({"_id": ObjectId(service_id)}, {"$set": update_dict})
    updated = await db["services"].find_one({"_id": ObjectId(service_id)})
    return service_helper(updated)


@router.delete("/{service_id}")
async def delete_service(service_id: str, current_user: dict = Depends(get_current_user)):
    db = get_database()
    service = await db["services"].find_one({"_id": ObjectId(service_id)})
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    if service["specialist_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    await db["services"].update_one(
        {"_id": ObjectId(service_id)},
        {"$set": {"is_active": False}}
    )
    return {"message": "Service deleted successfully"}