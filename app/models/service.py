from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class ServiceBase(BaseModel):
    specialist_id: str
    name: str
    description: Optional[str] = None
    price: float
    duration_minutes: int
    category: str
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)


class ServiceCreate(BaseModel):
    name: str
    description: Optional[str] = None
    price: float
    duration_minutes: int
    category: str


class ServiceUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    duration_minutes: Optional[int] = None
    is_active: Optional[bool] = None


class ServiceResponse(BaseModel):
    id: str
    specialist_id: str
    name: str
    description: Optional[str] = None
    price: float
    duration_minutes: int
    category: str
    is_active: bool
    created_at: datetime